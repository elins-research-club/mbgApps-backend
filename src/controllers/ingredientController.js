require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.1,
    topP: 0.8,
    topK: 20,
  },
});

const NUTRIENTS = [
  "energi_kkal",
  "protein_g",
  "lemak_g",
  "karbohidrat_g",
  "serat_g",
  "abu_g",
  "kalsium_mg",
  "fosfor_mg",
  "besi_mg",
  "natrium_mg",
  "kalium_mg",
  "tembaga_mg",
  "seng_mg",
  "retinol_mcg",
  "b_kar_mcg",
  "karoten_total_mcg",
  "thiamin_mg",
  "riboflavin_mg",
  "niasin_mg",
  "vitamin_c_mg",
];

const scientificMatchCache = {};
async function getEnglishEquivalent(ingredientName) {
  const prompt = `Translate the following Indonesian ingredient name to English: "${ingredientName}". Return only the English name, nothing else.`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text.trim();
  } catch (err) {
    console.error("Error getting English equivalent:", err.message);
    return ingredientName; // fallback to original
  }
}

async function searchUSDA(englishName) {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.error("USDA API key not found");
    return [];
  }
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
    englishName
  )}&requireAllWords=true&dataType=Foundation`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.foods || [];
  } catch (err) {
    console.error("USDA API error:", err.message);
    return [];
  }
}

async function mapUSDAtoDb(usdaFood, originalName) {
  const nutrientMap = {
    1003: "protein_g",
    1004: "lemak_g",
    1005: "karbohidrat_g",
    1008: "energi_kkal",
    1093: "natrium_mg",
    1099: "kalium_mg",
    1109: "serat_g",
    1110: "abu_g",
    1162: "kalsium_mg",
    1165: "besi_mg",
    1166: "seng_mg",
    1170: "tembaga_mg",
    1177: "fosfor_mg",
    1180: "retinol_mcg",
    1183: "b_kar_mcg",
    1185: "karoten_total_mcg",
    1167: "thiamin_mg",
    1175: "riboflavin_mg",
    1169: "niasin_mg",
    1186: "vitamin_c_mg",
  };
  const dbNutrients = {};
  NUTRIENTS.forEach((n) => (dbNutrients[n] = 0));

  const servingSize = usdaFood.servingSize || 100;
  usdaFood.foodNutrients.forEach((fn) => {
    const dbKey = nutrientMap[fn.nutrientId];
    if (dbKey) {
      dbNutrients[dbKey] = (fn.value / servingSize) * 100;
    }
  });

  return {
    nama: originalName,
    isValidated: true,
    validatedBy: "USDA",
    ...dbNutrients,
  };
}
async function findBestScientificMatchLLM(ingredientName) {
  if (scientificMatchCache[ingredientName]) {
    console.log(
      `[DEBUG] Returning cached scientific match for: ${ingredientName}`
    );
    return scientificMatchCache[ingredientName];
  }
  console.log(
    "[DEBUG] Entering findBestScientificMatchLLM with ingredientName:",
    ingredientName
  );
  const allBahan = await prisma.bahan.findMany({
    select: { id: true, nama: true },
  });
  console.log("[DEBUG] Total candidate ingredients:", allBahan.length);
  if (allBahan.length === 0) {
    console.log("[DEBUG] No ingredients found in DB, returning []");
    return [];
  }
  const prompt = `You are a scientific food ingredient assistant. Given an input ingredient and a list of candidate ingredient names from a food database, select the best match(es) based on scientific similarity (genus, family). If no close match, return an empty array.

STRICT RULES:
1. Return ONLY valid JSON, no markdown, no explanations
2. Use this format:
{
  "ingredient_name": "${ingredientName}",
  "english_equivalent": "<english name or empty string>",
  "matches": [
    {"id": <id_from_list>, "name": "<name_from_list>", "genus": "<genus_name> or else empty_string", "family":"<family_name> or else empty string"}
  ]
}

INPUT INGREDIENT: "${ingredientName}"
CANDIDATE_LIST:
${allBahan.map((b) => `{"id":${b.id},"name":"${b.nama}"}`).join("\n")}

Return only the JSON object.`;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.log("[DEBUG] LLM Response genus: ", text);
    let cleaned = text.replace(/```json|```/g, "").trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first === -1 || last === -1) {
      console.log("[DEBUG] LLM response does not contain valid JSON object");
      return [];
    }
    cleaned = cleaned.substring(first, last + 1);
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.log(
        "[DEBUG] JSON.parse error:",
        parseErr.message,
        "\nRaw:",
        cleaned
      );
      return [];
    }
    if (
      !parsed.matches ||
      !Array.isArray(parsed.matches) ||
      parsed.matches.length === 0
    ) {
      console.log("[DEBUG] No matches found in LLM response");
      scientificMatchCache[ingredientName] = { matches: [], matchedBahan: [] };
      return scientificMatchCache[ingredientName];
    }
    const matchIds = parsed.matches
      .map((m) => m.id)
      .filter((id) => typeof id === "number");
    if (matchIds.length === 0) {
      console.log("[DEBUG] No valid match IDs in LLM response");
      scientificMatchCache[ingredientName] = { matches: [], matchedBahan: [] };
      return scientificMatchCache[ingredientName];
    }
    const matchedBahan = await prisma.bahan.findMany({
      where: { id: { in: matchIds } },
    });
    console.log(
      "[DEBUG] Returning matchedBahan:",
      matchedBahan.map((b) => b.nama)
    );
    scientificMatchCache[ingredientName] = {
      matches: parsed.matches,
      matchedBahan,
    };
    return scientificMatchCache[ingredientName];
  } catch (err) {
    console.error("[DEBUG] LLM scientific match error:", err.message);
    scientificMatchCache[ingredientName] = { matches: [], matchedBahan: [] };
    return scientificMatchCache[ingredientName];
  }
}
async function estimateIngredientWithLLM(ingredientName) {
  try {
    // Step 1: Get English equivalent
    const englishName = await getEnglishEquivalent(ingredientName);
    console.log(`English equivalent: ${englishName}`);

    // Step 2: Search USDA API
    const usdaFoods = await searchUSDA(englishName);
    console.log(`USDA results: ${usdaFoods.length} foods found`);

    // Step 3: Find matching description
    let matchedUSDA = null;
    for (const food of usdaFoods) {
      if (
        food.description.toLowerCase().startsWith(englishName.toLowerCase())
      ) {
        matchedUSDA = food;
        console.log(
          `Matched USDA food by startsWith: ${matchedUSDA.description}`
        );
        break; // Take the first match that starts with the name
      }
    }

    if (matchedUSDA) {
      const dbData = await mapUSDAtoDb(matchedUSDA, ingredientName);
      try {
        const savedBahan = await prisma.bahan.create({ data: dbData });
        console.log(
          `✅ Saved USDA ingredient "${ingredientName}" to database with ID: ${savedBahan.id}`
        );
        return {
          name: ingredientName,
          method: "usda-api",
          predicted_composition: dbData,
          confidence: 1.0,
        };
      } catch (saveError) {
        console.error(
          `❌ Failed to save USDA ingredient "${ingredientName}":`,
          saveError.message
        );
      }
    }

    // Step 4: If no USDA match, try scientific LLM match
    const sciResult = await findBestScientificMatchLLM(ingredientName);
    if (
      sciResult &&
      sciResult.matchedBahan &&
      sciResult.matchedBahan.length > 0
    ) {
      const candidates = sciResult.matches.map((m) => {
        const row = sciResult.matchedBahan.find((b) => b.id === m.id);
        return {
          id: m.id,
          name: m.name,
          genus: m.genus,
          family: m.family,
          ...(row ? { nutrition: row } : {}),
        };
      });
      try {
        const { id, nama, isValidated, validatedBy, ...nutritionFields } =
          sciResult.matchedBahan[0] || {};
        const savedBahan = await prisma.bahan.create({
          data: {
            nama: ingredientName,
            isValidated: false,
            validatedBy: "genus",
            ...nutritionFields,
          },
        });
        console.log(
          `✅ Saved scientific-match ingredient "${ingredientName}" to database with ID: ${savedBahan.id}`
        );
      } catch (saveError) {
        console.error(
          `❌ Failed to save scientific-match ingredient "${ingredientName}" to database:`,
          saveError.message
        );
      }
      return {
        name: ingredientName,
        method: "scientific-match-llm",
        candidates,
        predicted_composition: sciResult.matchedBahan[0],
        provenance: {
          genus_family: sciResult.matches,
        },
        confidence: 1.0,
      };
    }

    // Step 5: Fallback to LLM nutrient estimation
    // Step 5: Fallback to LLM nutrient estimation
    const allNames = await prisma.bahan.findMany({
      select: { id: true, nama: true },
    });
    const existingMenus = allNames.map((b) => ({ id: b.id, name: b.nama }));
    const llm = await getLLMPrediction(ingredientName, existingMenus);

    const candidatePromises = (llm.candidates || []).map(async (c) => {
      if (c.id != null)
        return await prisma.bahan.findUnique({ where: { id: c.id } });
      if (c.name)
        return await prisma.bahan.findFirst({
          where: { nama: { equals: c.name } },
        });
      return null;
    });
    const candidateRows = (await Promise.all(candidatePromises)).filter(
      Boolean
    );

    if (candidateRows.length > 0) {
      const mapped = [];
      for (const c of llm.candidates || []) {
        const row =
          c.id != null
            ? candidateRows.find((r) => r.id === c.id)
            : candidateRows.find(
                (r) =>
                  String(r.nama).toLowerCase() ===
                  String(c.name || "").toLowerCase()
              );
        if (row)
          mapped.push({
            row,
            score: typeof c.score === "number" ? c.score : null,
          });
      }

      const weightsRaw = mapped.map((m) => (m.score != null ? m.score : 1));
      const sumW = weightsRaw.reduce((a, b) => a + b, 0) || 1;
      const weights = weightsRaw.map((w) => w / sumW);

      const estimated = {};
      NUTRIENTS.forEach((n) => {
        estimated[n] = mapped.reduce(
          (acc, m, j) =>
            acc + (m.row[n] != null ? Number(m.row[n]) : 0) * weights[j],
          0
        );
        estimated[n] = Number((estimated[n] || 0).toFixed(4));
      });

      try {
        const savedBahan = await prisma.bahan.create({
          data: {
            nama: ingredientName,
            isValidated: false,
            ...estimated,
            validatedBy: "LLM",
          },
        });
        console.log(
          `✅ Saved LLM-predicted ingredient "${ingredientName}" to database with ID: ${savedBahan.id}`
        );
      } catch (saveError) {
        console.error(
          `❌ Failed to save ingredient "${ingredientName}" to database:`,
          saveError.message
        );
      }

      return {
        name: ingredientName,
        method: "llm-candidates",
        english_equivalent: llm.english_equivalent || null,
        candidates: mapped.map((m, i) => ({
          id: m.row.id,
          name: m.row.nama,
          weight: weights[i],
        })),
        predicted_composition: estimated,
        provenance: {
          llm_candidates: llm.candidates || [],
          tkpi_candidates: mapped.map((m) => ({
            id: m.row.id,
            name: m.row.nama,
          })),
        },
        confidence: llm.confidence,
      };
    }
  } catch (err) {
    console.error("DB lookup error in estimateIngredientWithLLM:", err);
  }
  return {
    name: ingredientName,
    method: "none",
    candidates: [],
    predicted_composition: null,
    provenance: {},
    confidence: 0,
  };
}

async function getLLMPrediction(ingredientName, existingMenus) {
  const prompt = `You are a precise food ingredient mapping assistant. Your task is to find the most similar items from the TKPI (Indonesian Food Composition Table) database.

STRICT RULES:
1. Return ONLY valid JSON, no markdown, no explanations
2. Use ONLY items from the provided TKPI_LIST below
3. Match by exact name
4. Provide 3 best matches ranked by similarity. Similarity can be based on
  a. The name of the ingredient
  b. The family of the ingredient
  c. The function in foods
5. Score must be between 0.0 and 1.0 (1.0 = perfect match)
6. Overall confidence must be between 0.0 and 1.0


INPUT INGREDIENT: "${ingredientName}"

REQUIRED JSON FORMAT:
{
  "ingredient_name": "${ingredientName}",
  "english_equivalent": "english name or empty string",
  "candidates": [
    {"id": <exact_id_from_list>, "name": "<exact_name_from_list>", "score": 0.95},
    {"id": <exact_id_from_list>, "name": "<exact_name_from_list>", "score": 0.80}
  ],
  "confidence": 0.85
}

TKPI_LIST (use exact id and name):
${existingMenus
  .slice(0, 500)
  .map((m) => `{"id":${m.id},"name":"${m.name}"}`)
  .join("\n")}

Return only the JSON object:`;

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();
      console.log(`LLM Response (attempt ${attempt + 1}):`, text.substring());

      let cleaned = text.replace(/```json|```/g, "").trim();
      const first = cleaned.indexOf("{");
      const last = cleaned.lastIndexOf("}");

      if (first === -1 || last === -1) {
        if (attempt < maxRetries) continue;
        return {
          ingredient_name: ingredientName,
          candidates: [],
          confidence: 0,
        };
      }

      cleaned = cleaned.substring(first, last + 1);
      const parsed = JSON.parse(cleaned);

      if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
        if (attempt < maxRetries) continue;
        return {
          ingredient_name: ingredientName,
          candidates: [],
          confidence: 0,
        };
      }

      // Validate and sanitize candidates
      const validCandidates = parsed.candidates
        .filter((c) => c && (c.id != null || c.name))
        .map((c) => ({
          id: typeof c.id === "number" ? c.id : null,
          name: String(c.name || ""),
          score:
            typeof c.score === "number" && c.score >= 0 && c.score <= 1
              ? c.score
              : 0.5,
        }))
        .slice(0, 10);

      const confidence =
        typeof parsed.confidence === "number" &&
        parsed.confidence >= 0 &&
        parsed.confidence <= 1
          ? parsed.confidence
          : 0.5;

      return {
        ingredient_name: ingredientName,
        english_equivalent: parsed.english_equivalent || "",
        candidates: validCandidates,
        confidence,
      };
    } catch (err) {
      console.error(`LLM parse error (attempt ${attempt + 1}):`, err.message);
      if (attempt >= maxRetries) {
        return {
          ingredient_name: ingredientName,
          candidates: [],
          confidence: 0,
        };
      }
    }
  }

  return { ingredient_name: ingredientName, candidates: [], confidence: 0 };
}

async function getNotValidatedIngredients(req, res) {
  try {
    const notValidatedIngredients = await prisma.bahan.findMany({
      where: {
        isValidated: false,
      },
      select: {
        id: true,
        nama: true,
        energi_kkal: true,
        protein_g: true,
        lemak_g: true,
        karbohidrat_g: true,
        serat_g: true,
        abu_g: true,
        kalsium_mg: true,
        fosfor_mg: true,
        besi_mg: true,
        natrium_mg: true,
        kalium_mg: true,
        tembaga_mg: true,
        seng_mg: true,
        retinol_mcg: true,
        b_kar_mcg: true,
        karoten_total_mcg: true,
        thiamin_mg: true,
        riboflavin_mg: true,
        niasin_mg: true,
        vitamin_c_mg: true,
        isValidated: true,
      },
    });

    res.status(200).json({
      success: true,
      count: notValidatedIngredients.length,
      ingredients: notValidatedIngredients,
    });
  } catch (error) {
    console.error("Error fetching not validated ingredients:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      ingredients: [],
    });
  }
}

async function editIngredientsNutritions(req, res) {
  try {
    const { id } = req.params;
    const { ingredientData } = req.body;

    const updates = ingredientData;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Ingredient ID is required",
      });
    }

    // Remove id from updates
    delete updates.id;
    delete updates.isValidated;

    // Validate that at least one nutrient field is being updated
    const nutrientFields = NUTRIENTS.filter((nutrient) =>
      updates.hasOwnProperty(nutrient)
    );

    // We use < 0 in case the nutritions are already correct
    if (nutrientFields.length < 0) {
      return res.status(400).json({
        success: false,
        error: "At least one nutrient field must be provided for update",
      });
    }

    // Validate nutrient values are numbers
    for (const nutrient of nutrientFields) {
      const value = updates[nutrient];
      if (
        value !== null &&
        value !== undefined &&
        (isNaN(value) || value < 0)
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid value for ${nutrient}: must be a non-negative number or null`,
        });
      }
    }

    // Update the ingredient with new nutrition values and set isValidated to true
    const updatedIngredient = await prisma.bahan.update({
      where: {
        id: parseInt(id),
      },
      data: {
        ...updates,
        isValidated: true,
      },
      select: {
        id: true,
        nama: true,
        energi_kkal: true,
        protein_g: true,
        lemak_g: true,
        karbohidrat_g: true,
        serat_g: true,
        abu_g: true,
        kalsium_mg: true,
        fosfor_mg: true,
        besi_mg: true,
        natrium_mg: true,
        kalium_mg: true,
        tembaga_mg: true,
        seng_mg: true,
        retinol_mcg: true,
        b_kar_mcg: true,
        karoten_total_mcg: true,
        thiamin_mg: true,
        riboflavin_mg: true,
        niasin_mg: true,
        vitamin_c_mg: true,
        isValidated: true,
      },
    });

    console.log(
      `Updated and validated ingredient "${updatedIngredient.nama}" (ID: ${updatedIngredient.id})`
    );

    res.status(200).json({
      success: true,
      message: "Ingredient nutrition values updated and validated successfully",
      ingredient: updatedIngredient,
    });
  } catch (error) {
    console.error("Error updating ingredient nutrition:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Ingredient not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// async function getIngredients(req, res) {
//   try {
//     const name = (req && req.body && req.body.name) || req.query.name;
//     if (!name) {
//       return res.status(400).json({ error: "Missing `name` in body or query" });
//     }
//     const result = await estimateIngredientWithLLM(name);
//     return res.json(result);
//   } catch (err) {
//     console.error("Error in getIngredients:", err);
//     return res.status(500).json({ error: String(err) });
//   }
// }

// Di ingredientController.js

async function getIngredients(req, res) {
  try {
    const name = (req && req.body && req.body.name) || req.query.name;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Missing `name` in body or query",
      });
    }

    console.log(`🔍 [getIngredients] Processing: "${name}"`);

    const result = await estimateIngredientWithLLM(name);

    console.log(`📊 [getIngredients] Result method: ${result.method}`);
    console.log(
      `📊 [getIngredients] Has predicted_composition: ${!!result.predicted_composition}`
    );

    // ✅ PERBAIKAN: Return format yang konsisten
    if (result.predicted_composition) {
      // Cari ingredient yang baru disimpan di database
      const savedIngredient = await prisma.bahan.findFirst({
        where: { nama: name.toLowerCase().trim() },
        orderBy: { id: "desc" },
      });

      return res.status(200).json({
        success: true, // ✅ TAMBAH FLAG SUCCESS
        status: "success", // ✅ TAMBAH STATUS
        ingredient_id: savedIngredient?.id || null, // ✅ ID BAHAN
        id: savedIngredient?.id || null, // ✅ ALIAS
        name: name,
        method: result.method,
        predicted_composition: result.predicted_composition,
        candidates: result.candidates || [],
        provenance: result.provenance || {},
        confidence: result.confidence || 0.5,
      });
    } else {
      // Tidak ada prediksi yang valid
      return res.status(404).json({
        success: false,
        error: "Could not generate nutrition data for this ingredient",
        name: name,
        method: result.method || "none",
      });
    }
  } catch (err) {
    console.error("❌ [getIngredients] Error:", err);
    return res.status(500).json({
      success: false,
      error: String(err.message || err),
    });
  }
}

async function searchIngredients(req, res) {
  const { q, exact } = req.query;

  if (!q) {
    return res
      .status(400)
      .json({ message: "Query parameter 'q' is required." });
  }

  try {
    let ingredients;
    if (exact === "true") {
      ingredients = await prisma.bahan.findMany({
        where: {
          nama: {
            equals: q,
          },
        },
      });
    } else {
      ingredients = await prisma.bahan.findMany({
        where: {
          nama: {
            contains: q,
          },
        },
        take: 10,
      });
    }

    res.status(200).json({ ingredients });
  } catch (error) {
    console.error("Error searching ingredients:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function deleteIngredients(req, res) {
  try {
    const { id } = req.params;

    // Validate that ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Ingredient ID is required",
      });
    }

    // Delete the ingredient
    const deletedIngredient = await prisma.bahan.delete({
      where: {
        id: parseInt(id),
      },
      select: {
        id: true,
        nama: true,
        isValidated: true,
      },
    });

    console.log(
      `Deleted ingredient "${deletedIngredient.nama}" (ID: ${deletedIngredient.id})`
    );

    res.status(200).json({
      success: true,
      message: "Ingredient deleted successfully",
      ingredient: deletedIngredient,
    });
  } catch (error) {
    console.error("Error deleting ingredient:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        error: "Ingredient not found",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function addIngredients(req, res) {
  try {
    const ingredientData = req.body;

    // Validate required fields
    if (
      !ingredientData.nama ||
      typeof ingredientData.nama !== "string" ||
      ingredientData.nama.trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        error: "Ingredient name is required and must be a non-empty string",
      });
    }

    // Remove any fields that shouldn't be set manually
    delete ingredientData.id;
    delete ingredientData.isValidated;

    // Validate nutrient values if provided
    const nutrientFields = NUTRIENTS.filter((nutrient) =>
      ingredientData.hasOwnProperty(nutrient)
    );
    for (const nutrient of nutrientFields) {
      const value = ingredientData[nutrient];
      if (
        value !== null &&
        value !== undefined &&
        (isNaN(value) || value < 0)
      ) {
        return res.status(400).json({
          success: false,
          error: `Invalid value for ${nutrient}: must be a non-negative number or null`,
        });
      }

      if (value !== null && value !== undefined) {
        ingredientData[nutrient] = Number(Number(value).toFixed(4));
      }
    }

    const newIngredient = await prisma.bahan.create({
      data: {
        ...ingredientData,
        isValidated: true,
        validatedBy: "Ahli Gizi",
      },
      select: {
        id: true,
        nama: true,
        energi_kkal: true,
        protein_g: true,
        lemak_g: true,
        karbohidrat_g: true,
        serat_g: true,
        abu_g: true,
        kalsium_mg: true,
        fosfor_mg: true,
        besi_mg: true,
        natrium_mg: true,
        kalium_mg: true,
        tembaga_mg: true,
        seng_mg: true,
        retinol_mcg: true,
        b_kar_mcg: true,
        karoten_total_mcg: true,
        thiamin_mg: true,
        riboflavin_mg: true,
        niasin_mg: true,
        vitamin_c_mg: true,
        isValidated: true,
      },
    });

    console.log(
      `Manually added ingredient "${newIngredient.nama}" (ID: ${newIngredient.id})`
    );

    res.status(201).json({
      success: true,
      message: "Ingredient added successfully",
      ingredient: newIngredient,
    });
  } catch (error) {
    console.error("Error adding ingredient:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "An ingredient with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
module.exports = {
  estimateIngredientWithLLM,
  getNotValidatedIngredients,
  editIngredientsNutritions,
  getIngredients,
  deleteIngredients,
  addIngredients,
  searchIngredients,
};
