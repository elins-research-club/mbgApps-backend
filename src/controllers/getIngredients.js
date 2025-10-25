require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.1,
    topP: 0.8,
    topK: 20,
  }
});

const NUTRIENTS = [
  "energi_kkal","protein_g","lemak_g","karbohidrat_g","serat_g","abu_g",
  "kalsium_mg","fosfor_mg","besi_mg","natrium_mg","kalium_mg","tembaga_mg",
  "seng_mg","retinol_mcg","b_kar_mcg","karoten_total_mcg","thiamin_mg",
  "riboflavin_mg","niasin_mg","vitamin_c_mg"
];

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
${existingMenus.slice(0, 500).map(m => `{"id":${m.id},"name":"${m.name}"}`).join("\n")}

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
        return { ingredient_name: ingredientName, candidates: [], confidence: 0 };
      }
      
      cleaned = cleaned.substring(first, last + 1);
      const parsed = JSON.parse(cleaned);
      
      if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
        if (attempt < maxRetries) continue;
        return { ingredient_name: ingredientName, candidates: [], confidence: 0 };
      }
      
      // Validate and sanitize candidates
      const validCandidates = parsed.candidates
        .filter(c => c && (c.id != null || c.name))
        .map(c => ({
          id: typeof c.id === 'number' ? c.id : null,
          name: String(c.name || ''),
          score: typeof c.score === 'number' && c.score >= 0 && c.score <= 1 ? c.score : 0.5
        }))
        .slice(0, 10);
      
      const confidence = typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1 
        ? parsed.confidence 
        : 0.5;
      
      return {
        ingredient_name: ingredientName,
        english_equivalent: parsed.english_equivalent || "",
        candidates: validCandidates,
        confidence
      };
      
    } catch (err) {
      console.error(`LLM parse error (attempt ${attempt + 1}):`, err.message);
      if (attempt >= maxRetries) {
        return { ingredient_name: ingredientName, candidates: [], confidence: 0 };
      }
    }
  }
  
  return { ingredient_name: ingredientName, candidates: [], confidence: 0 };
}

async function estimateIngredientWithLLM(ingredientName) {
  try {
    const allNames = await prisma.bahan.findMany({ select: { id: true, nama: true } });
    const existingMenus = allNames.map(b => ({ id: b.id, name: b.nama }));
    const llm = await getLLMPrediction(ingredientName, existingMenus);

    const candidatePromises = (llm.candidates || []).map(async c => {
      if (c.id != null) return await prisma.bahan.findUnique({ where: { id: c.id } });
      if (c.name) return await prisma.bahan.findFirst({ where: { nama: { equals: c.name } } });
      return null;
    });
    const candidateRows = (await Promise.all(candidatePromises)).filter(Boolean);

    if (candidateRows.length > 0) {
      const mapped = [];
      for (const c of (llm.candidates || [])) {
        const row = c.id != null ? candidateRows.find(r => r.id === c.id) : candidateRows.find(r => String(r.nama).toLowerCase() === String(c.name || '').toLowerCase());
        if (row) mapped.push({ row, score: typeof c.score === 'number' ? c.score : null });
      }

      const weightsRaw = mapped.map(m => (m.score != null ? m.score : 1));
      const sumW = weightsRaw.reduce((a,b) => a+b, 0) || 1;
      const weights = weightsRaw.map(w => w / sumW);

      const estimated = {};
      NUTRIENTS.forEach(n => {
        estimated[n] = mapped.reduce((acc, m, j) => acc + ((m.row[n] != null ? Number(m.row[n]) : 0) * weights[j]), 0);
        estimated[n] = Number((estimated[n] || 0).toFixed(4));
      });

      return {
        name: ingredientName,
        method: 'llm-candidates',
        english_equivalent: llm.english_equivalent || null,
        candidates: mapped.map((m, i) => ({ id: m.row.id, name: m.row.nama, weight: weights[i] })),
        predicted_composition: estimated,
        provenance: {
          llm_candidates: llm.candidates || [],
          tkpi_candidates: mapped.map(m => ({ id: m.row.id, name: m.row.nama })),
        },
        confidence: llm.confidence,
      };
    }
  } catch (err) {
    console.error("DB lookup error in estimateIngredientWithLLM:", err);
  }
  return {
    name: ingredientName,
    method: 'none',
    candidates: [],
    predicted_composition: null,
    provenance: {},
    confidence: 0
  };
}

module.exports = { estimateIngredientWithLLM };