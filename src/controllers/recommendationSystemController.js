// npm install javascript-lp-solver
const solver = require("javascript-lp-solver");
const { filterForLP } = require("./foodCategorization");
// ------------------------------
// Nutrition goal -> based on excel tapi ada beberapa yang gaada di excel seperti retinol, b_kar, karoten
// ini dikelompokkan berdasarkan kelas (sd sampe sma). Untuk tau umur anak sd - sma, aku tanya gpt
// ------------------------------
const NUTRIENT_LABELS = {
  energi_kkal: "energi",
  protein_g: "protein",
  lemak_g: "lemak",
  karbohidrat_g: "karbohidrat",
  serat_g: "serat",

  // Optional, uncomment if you're using them
  // abu_g: "Abu (g)",
  // kalsium_mg: "Kalsium (mg)",
  // fosfor_mg: "Fosfor (mg)",
  // besi_mg: "Besi (mg)",
  // natrium_mg: "Natrium (mg)",
  // kalium_mg: "Kalium (mg)",
  // tembaga_mg: "Tembaga (mg)",
  // seng_mg: "Seng (mg)",
  // retinol_mcg: "Retinol (mcg)",
  // b_kar_mcg: "Beta-Karoten (mcg)",
  // karoten_total_mcg: "Karoten Total (mcg)",
  // thiamin_mg: "Thiamin (mg)",
  // riboflavin_mg: "Riboflavin (mg)",
  // niasin_mg: "Niasin (mg)",
  // vitamin_c_mg: "Vitamin C (mg)",
};

const goals = {
  1: {
    // TK A
    energi_kkal: 1350,
    protein_g: 20,
    lemak_g: 45,
    karbohidrat_g: 215,
    serat_g: 19,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 500,
    // besi_mg: 10,
    // natrium_mg: 1000,
    // kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    // vitamin_c_mg: 45,
  },
  2: {
    // TK B
    energi_kkal: 1400,
    protein_g: 25,
    lemak_g: 50,
    karbohidrat_g: 250,
    serat_g: 20,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 500,
    // besi_mg: 10,
    // natrium_mg: 1000,
    // kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    // vitamin_c_mg: 45,
  },
  3: {
    //SD 1
    energi_kkal: 1650,
    protein_g: 40,
    lemak_g: 55,
    karbohidrat_g: 250,
    serat_g: 23,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 500,
    // besi_mg: 10,
    // natrium_mg: 1000,
    // kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    // vitamin_c_mg: 45,
  },
  4: {
    // SD 2
    energi_kkal: 1650,
    protein_g: 40,
    lemak_g: 55,
    karbohidrat_g: 250,
    serat_g: 23,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 500,
    // besi_mg: 10,
    // natrium_mg: 1000,
    // kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    // vitamin_c_mg: 45,
  },
  5: {
    //SD 3
    energi_kkal: 1650,
    protein_g: 40,
    lemak_g: 55,
    karbohidrat_g: 250,
    serat_g: 23,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 500,
    // besi_mg: 10,
    // natrium_mg: 1000,
    // kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    // vitamin_c_mg: 45,
  },
  6: {
    //SD 4
    energi_kkal: 2000,
    protein_g: 50,
    lemak_g: 65,
    karbohidrat_g: 300,
    serat_g: 28,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 1250,
    // besi_mg: 8,
    // natrium_mg: 1300,
    // kalium_mg: 3900,
    // tembaga_mg: 700,
    // seng_mg: 8,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.3,
    // niasin_mg: 12,
    // vitamin_c_mg: 50,
  },
  7: {
    //SD 5
    energi_kkal: 2000,
    protein_g: 50,
    lemak_g: 65,
    karbohidrat_g: 300,
    serat_g: 28,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 1250,
    // besi_mg: 8,
    // natrium_mg: 1300,
    // kalium_mg: 3900,
    // tembaga_mg: 700,
    // seng_mg: 8,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.3,
    // niasin_mg: 12,
    // vitamin_c_mg: 50,
  },
  8: {
    //SD 6
    energi_kkal: 2000,
    protein_g: 50,
    lemak_g: 65,
    karbohidrat_g: 300,
    serat_g: 28,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 1250,
    // besi_mg: 8,
    // natrium_mg: 1300,
    // kalium_mg: 3900,
    // tembaga_mg: 700,
    // seng_mg: 8,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.3,
    // niasin_mg: 12,
    // vitamin_c_mg: 50,
  },
  9: {
    // SMP 1
    energi_kkal: 2400,
    protein_g: 70,
    lemak_g: 80,
    karbohidrat_g: 350,
    serat_g: 34,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1200,
    // fosfor_mg: 1250,
    // besi_mg: 11,
    // natrium_mg: 1500,
    // kalium_mg: 4800,
    // tembaga_mg: 795,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    // vitamin_c_mg: 75,
  },
  10: {
    //SMP 2
    energi_kkal: 2400,
    protein_g: 70,
    lemak_g: 80,
    karbohidrat_g: 350,
    serat_g: 34,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1200,
    // fosfor_mg: 1250,
    // besi_mg: 11,
    // natrium_mg: 1500,
    // kalium_mg: 4800,
    // tembaga_mg: 795,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    // vitamin_c_mg: 75,
  },
  11: {
    //SMP 3
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1200,
    // fosfor_mg: 1250,
    // besi_mg: 9,
    // natrium_mg: 1700,
    // kalium_mg: 5300,
    // tembaga_mg: 890,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    // vitamin_c_mg: 90,
  },
  12: {
    //SMA 1
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1200,
    // fosfor_mg: 1250,
    // besi_mg: 9,
    // natrium_mg: 1700,
    // kalium_mg: 5300,
    // tembaga_mg: 890,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    // vitamin_c_mg: 90,
  },
  13: {
    //SMA 2
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1200,
    // fosfor_mg: 1250,
    // besi_mg: 9,
    // natrium_mg: 1700,
    // kalium_mg: 5300,
    // tembaga_mg: 890,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    // vitamin_c_mg: 90,
  },
  14: {
    //SMA 3
    energi_kkal: 2650,
    protein_g: 65,
    lemak_g: 75,
    karbohidrat_g: 430,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    // kalsium_mg: 1000,
    // fosfor_mg: 700,
    // besi_mg: 9,
    // natrium_mg: 1500,
    // kalium_mg: 4700,
    // tembaga_mg: 900,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    // vitamin_c_mg: 90,
  },
};

// ------------------------------
// 4. Build goal programming model
// ------------------------------

// ------------------------------
// Weight map for goal programming
// ------------------------------
const WEIGHT_MAP = {
  // Energy: Moderate penalties - slight deficit OK, excess leads to weight gain
  energi_kkal: { under: 3, over: 5 },

  // Protein: HIGH penalty for under, low for over - critical for body function
  // Most people struggle to get enough protein
  protein_g: { under: 10, over: 1 },

  // Carbs: Moderate under penalty, higher over penalty - excess stored as fat
  karbohidrat_g: { under: 5, over: 10 },

  // Fat: Balanced but prefer slight deficit - calorie dense
  lemak_g: { under: 3, over: 6 },

  // Fiber: HIGH penalty for under - most people don't get enough
  // Can't really "over-consume" fiber from whole foods
  serat_g: { under: 5, over: 1 },

  // Micronutrients (if you add them later)
  // vitamin_c: { under: 5, over: 1 },
  // kalsium_mg: { under: 8, over: 2 },
  // zat_besi_mg: { under: 10, over: 3 },

  default: { under: 3, over: 2 },
};
// ------------------------------
// Build Goal Programming LP Model
// ------------------------------
// function buildModel(foods, current, goal) {
// 	const model = {
// 		optimize: "obj",
// 		opType: "min",
// 		constraints: {},
// 		variables: {},
// 	};

// 	// Target = 1/3 daily requirement
// 	const target = {};
// 	for (const [nutrient, goalVal] of Object.entries(goal)) {
// 		target[nutrient] = goalVal / 3;
// 	}

// 	// --------------------------
// 	// Add food variables
// 	// --------------------------
// 	for (const [foodName, foodValue] of Object.entries(foods)) {
// 		// Each food variable represents the amount (in grams) to add
// 		model.variables[foodName] = {};

// 		// Add nutrient coefficients for each food
// 		for (const [key, val] of Object.entries(foodValue)) {
// 			if (key === "gramasi") continue;
// 			if (key === "kelompok_makanan") continue;
// 			model.variables[foodName][key] = val;
// 		}

// 		// Non-negativity constraint (can't subtract food)
// 		model.constraints[`${foodName}_bound`] = {
// 			[foodName]: 1,
// 			min: 0,
// 		};

// 		// Optional: add upper bound if you have max amounts
// 		// model.constraints[`${foodName}_bound`].max = foodValue.gramasi || 1000;
// 	}

// 	// --------------------------
// 	// Add deviation variables for each nutrient
// 	// --------------------------
// 	for (const [nutrient] of Object.entries(goal)) {
// 		const w = WEIGHT_MAP[nutrient] ?? WEIGHT_MAP.default;

// 		// Under-achievement deviation (penalized more heavily)
// 		model.variables[`under_${nutrient}`] = {
// 			[nutrient]: -1,
// 			obj: w.under,
// 		};

// 		// Over-achievement deviation (penalized less)
// 		model.variables[`over_${nutrient}`] = {
// 			[nutrient]: 1,
// 			obj: w.over,
// 		};

// 		// Constraint: current + added foods = target + over_deviation - under_deviation
// 		// Rearranged: added foods - over + under = target - current
// 		const gap = target[nutrient] - (current[nutrient] ?? 0);

// 		model.constraints[nutrient] = {
// 			equal: gap,
// 		};
// 	}

// 	return model;
// }

const CATEGORY_MAX_PORTION = {
  protein_lean: 150,
  protein_fatty: 120,
  carb_high_fiber: 180,
  carb_refined: 200,
  vegetable_leafy: 120,
  vegetable_other: 150,
  fruit: 150,
  legume: 120,
  dairy: 200,
  mixed: 100,
};

function buildModel(foods, current, goal) {
  const model = {
    optimize: "obj",
    opType: "min",
    constraints: {},
    variables: {},
  };

  console.log("currentFoods", foods);
  console.log("currentNutrition", current);
  console.log("goal", goal);
  const mainFoods = filterForLP(foods);
  // Target = 1/3 daily requirement
  const target = {};
  for (const [nutrient, goalVal] of Object.entries(goal)) {
    target[nutrient] = goalVal / 3;
  }

  // --------------------------
  // Add food variables
  // --------------------------
  for (const [foodName, foodValue] of Object.entries(mainFoods)) {
    // Each food variable represents the amount (in grams) to add
    model.variables[foodName] = {};

    // Add nutrient coefficients for each food
    for (const [key, val] of Object.entries(foodValue)) {
      if (key === "gramasi") continue;
      model.variables[foodName][key] = val;
    }

    // Non-negativity constraint (can't subtract food)
    model.constraints[`${foodName}_bound`] = {
      [foodName]: 1,
      min: 0,
    };

    const category = foodValue.category;
    const maxPortion = CATEGORY_MAX_PORTION[category];
    // Optional: add upper bound if you have max amounts
    model.constraints[`${foodName}_bound`].max = maxPortion;
  }

  // --------------------------
  // Add deviation variables for each nutrient
  // --------------------------
  for (const [nutrient] of Object.entries(goal)) {
    const w = WEIGHT_MAP[nutrient] ?? WEIGHT_MAP.default;

    // Under-achievement deviation (penalized more heavily)
    model.variables[`under_${nutrient}`] = {
      [nutrient]: -1,
      obj: w.under,
    };

    // Over-achievement deviation (penalized less)
    model.variables[`over_${nutrient}`] = {
      [nutrient]: 1,
      obj: w.over,
    };

    // Constraint: current + added foods = target + over_deviation - under_deviation
    // Rearranged: added foods - over + under = target - current
    const gap = target[nutrient] - (current[nutrient] ?? 0);

    model.constraints[nutrient] = {
      equal: gap,
    };
  }

  return model;
}

// ------------------------------------------------------
// 5. Solve Recommendation
// ------------------------------------------------------
async function getRecommendation(
  currentFoods,
  currentNutrition,
  classGrade = 1,
) {
  // -----------------------------------------
  // PREPARE LP MODEL AND SOLVE
  // -----------------------------------------
  const selectedGoal = goals[classGrade];
  const model = buildModel(currentFoods, currentNutrition, selectedGoal);
  const results = solver.Solve(model);

  // -----------------------------------------
  // BUILD TARGET VALUES (GOAL / 3)
  // -----------------------------------------
  const target = {};
  for (const [nutrient, goalVal] of Object.entries(selectedGoal)) {
    target[nutrient] = goalVal / 3;
  }

  // -----------------------------------------
  // EXTRACT SERVINGS FROM LP RESULTS
  // -----------------------------------------
  const servingsToAdd = {};
  for (const [food, amount] of Object.entries(results)) {
    if (currentFoods[food]) {
      const grams = parseFloat(amount.toFixed(2)) * currentFoods[food].gramasi;
      if (!isNaN(grams)) servingsToAdd[food] = grams;
    }
  }
  // -----------------------------------------
  // CALCULATE OPTIMIZED NUTRITION
  // -----------------------------------------
  const optimizedNutrition = { ...currentNutrition };
  for (const [food, amt] of Object.entries(servingsToAdd)) {
    const foodData = currentFoods[food];
    for (const [nutrient, val] of Object.entries(foodData)) {
      if (nutrient === "gramasi") continue;
      optimizedNutrition[nutrient] =
        (optimizedNutrition[nutrient] || 0) + val * amt;
    }
  }

  // -----------------------------------------
  // CALCULATE NUTRITION DEFICITS
  // -----------------------------------------
  const nutritionDifference = {};
  for (const [nutrient, goalVal] of Object.entries(target)) {
    const currVal = currentNutrition[nutrient] || 0;
    const diff = goalVal - currVal;
    nutritionDifference[nutrient] = diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
  }

  // -----------------------------------------
  // BUILD SARAN LIST
  // -----------------------------------------
  const saran = Object.entries(servingsToAdd)
    .filter(([, val]) => val > 0.01)
    .map(([nama, serving]) => ({
      nama,
      serving: parseFloat(serving.toFixed(2)),
    }));

  // -----------------------------------------
  // DEFICIT READABLE TEXT
  // -----------------------------------------
  const defisitList = [];
  for (const [key, value] of Object.entries(nutritionDifference)) {
    if (value <= 0.01) continue;

    let unit = "g";
    if (key.includes("kkal")) unit = "kkal";
    else if (key.includes("mg")) unit = "mg";
    else if (key.includes("mcg")) unit = "mcg";

    let readableKey = key.split("_")[0];
    readableKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1);

    defisitList.push(`${readableKey} (${value.toFixed(1)}${unit})`);
  }

  const defisitString = defisitList.join(", ");
  const kekurangan =
    defisitString.length > 0
      ? [{ menu: "Total Menu", kurang: defisitString }]
      : [];

  // -----------------------------------------
  // RETURN FINAL STRUCTURED OBJECT
  // -----------------------------------------
  return {
    saran,
    kekurangan,
  };
}

// ------------------------------------------------------
// 6. All Class Grades
// ------------------------------------------------------

// async function getAllRecommendation(currentFoods, currentNutrition) {
//   const allResults = [];
//
//   // Run LP recommendation for each class grade (no LLM here)
//   for (const [classGrade, goalData] of Object.entries(goals)) {
//     const grade = parseInt(classGrade);
//
//     const result = await getRecommendation(
//       currentFoods,
//       currentNutrition,
//       grade,
//     );
//
//     allResults.push({
//       classGrade: grade,
//       ...result,
//     });
//   }
//
//   // Merge results
//   const combinedSaran = allResults.flatMap((r) =>
//     r.saran.map((item) => ({
//       kelas: r.classGrade,
//       ...item,
//     })),
//   );
//
//   const combinedKekurangan = allResults.flatMap((r) =>
//     r.kekurangan.map((item) => ({
//       kelas: r.classGrade,
//       ...item,
//     })),
//   );
//
//   return {
//     combinedSaran,
//     combinedKekurangan,
//   };
// }
//
// temporary fix
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function getAllRecommendation(currentFoods, currentNutrition, menuId) {
  // Check DB first — return immediately if recommendation already exists
  const existing = await prisma.recommendation.findFirst({
    where: { menu_id: menuId },
    include: {
      saran: true,
      kekurangan: true,
    },
  });

  if (existing) {
    return {
      combinedSaran: existing.saran.map((s) => ({
        kelas: s.kelas,
        nama: s.nama,
        serving: s.serving,
      })),
      combinedKekurangan: existing.kekurangan.map((k) => ({
        kelas: k.kelas,
        menu: k.menu,
        kurang: k.kurang,
      })),
    };
  }

  // No existing recommendation — call Gemini
  const foodsSummary = Object.entries(currentFoods).map(([nama, data]) => ({
    nama,
    gramasi_saat_ini: data.gramasi,
    per_gram: {
      energi_kkal: +(data.energi_kkal / data.gramasi).toFixed(5),
      protein_g: +(data.protein_g / data.gramasi).toFixed(5),
      lemak_g: +(data.lemak_g / data.gramasi).toFixed(5),
      karbohidrat_g: +(data.karbohidrat_g / data.gramasi).toFixed(5),
      serat_g: +(data.serat_g / data.gramasi).toFixed(5),
    },
  }));

  const goalsList = Object.entries(goals).map(([classGrade, goalData]) => ({
    kelas: parseInt(classGrade),
    target: {
      energi_kkal: +(goalData.energi_kkal / 3).toFixed(2),
      protein_g: +(goalData.protein_g / 3).toFixed(2),
      lemak_g: +(goalData.lemak_g / 3).toFixed(2),
      karbohidrat_g: +(goalData.karbohidrat_g / 3).toFixed(2),
      serat_g: +(goalData.serat_g / 3).toFixed(2),
    },
  }));

  const prompt = `
Kamu adalah sistem rekomendasi gizi otomatis. Tugasmu adalah menghitung penyesuaian porsi makanan secara MATEMATIS dan PRESISI untuk memenuhi target nutrisi setiap kelas.

=== MENU SAAT INI ===
Berikut daftar makanan beserta porsi saat ini dan kandungan nutrisi per gram:
${JSON.stringify(foodsSummary, null, 2)}

=== TOTAL NUTRISI SAAT INI ===
${JSON.stringify(currentNutrition, null, 2)}

=== TARGET NUTRISI PER KELAS ===
Kelas 1 = TK A, Kelas 2 = TK B, Kelas 3-5 = SD 1-3, Kelas 6-8 = SD 4-6, Kelas 9-10 = SMP 1-2, Kelas 11-13 = SMA 1-3, Kelas 14 = Dewasa.
${JSON.stringify(goalsList, null, 2)}

=== INSTRUKSI ===
Untuk setiap kelas (1 sampai 14):

1. Hitung selisih (gap) antara total nutrisi saat ini dengan target kelas tersebut:
   gap = target - currentNutrition
   - Nilai positif = kekurangan (perlu ditambah)
   - Nilai negatif = kelebihan (perlu dikurangi)

2. Untuk mengisi gap, rekomendasikan penyesuaian porsi (delta gramasi) pada makanan yang PALING RELEVAN:
   - Untuk menambah energi/karbohidrat → prioritaskan makanan kategori karbohidrat
   - Untuk menambah lemak → prioritaskan makanan tinggi lemak
   - Untuk menambah serat → prioritaskan makanan tinggi serat per gram
   - Untuk menambah protein → prioritaskan makanan tinggi protein per gram
   - Boleh menyesuaikan lebih dari satu makanan per kelas jika diperlukan
   - Jangan rekomendasikan makanan di luar daftar menu yang ada
   - Hanya masukkan makanan yang benar-benar perlu diubah porsinya
   - Delta negatif berarti porsi dikurangi, delta positif berarti porsi ditambah

3. Setelah rekomendasi porsi diterapkan, hitung sisa kekurangan yang MASIH BELUM TERPENUHI.
   Jika semua nutrisi sudah terpenuhi, tulis "Tidak ada kekurangan".

=== FORMAT OUTPUT ===
Jawab HANYA dengan JSON murni. Tidak ada teks lain, tidak ada markdown, tidak ada komentar.

{
  "rekomendasi": {
    "combinedSaran": [
      {
        "kelas": <integer>,
        "nama": "<nama makanan sesuai daftar, huruf kecil>",
        "serving": <delta gramasi, number, positif=tambah, negatif=kurangi>
      }
    ],
    "combinedKekurangan": [
      {
        "kelas": <integer>,
        "menu": "Total Menu",
        "kurang": "<contoh: 'Energi (120kkal), Lemak (5.2g), Serat (3.1g)' atau 'Tidak ada kekurangan'>"
      }
    ]
  }
}

PENTING:
- combinedKekurangan HARUS memiliki tepat 14 entri (satu untuk setiap kelas 1-14)
- combinedSaran hanya berisi entri untuk makanan yang perlu disesuaikan
- Angka serving dan kurang harus dibulatkan maksimal 1 desimal
- Urutkan combinedSaran dan combinedKekurangan berdasarkan kelas ascending
`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Gagal parsing respons Gemini sebagai JSON.\nError: ${err.message}\nRaw response:\n${rawText}`,
    );
  }

  const { combinedSaran, combinedKekurangan } = parsed.rekomendasi;

  // Validate all 14 classes are present in kekurangan
  const kelasSet = new Set(combinedKekurangan.map((k) => k.kelas));
  for (let i = 1; i <= Object.keys(goals).length; i++) {
    if (!kelasSet.has(i)) {
      console.warn(`[getAllRecommendation] Missing kekurangan for kelas ${i}`);
    }
  }

  // Save to DB — always save even if combinedSaran is empty
  // so subsequent calls don't re-trigger Gemini unnecessarily
  try {
    await prisma.recommendation.create({
      data: {
        menu_id: menuId,
        saran: {
          create: combinedSaran.map((s) => ({
            kelas: s.kelas,
            nama: s.nama,
            serving: s.serving,
          })),
        },
        kekurangan: {
          create: combinedKekurangan.map((k) => ({
            kelas: k.kelas,
            menu: k.menu,
            kurang: k.kurang,
          })),
        },
      },
    });
  } catch (dbErr) {
    // Log but don't crash — recommendation was still computed successfully
    console.error(
      `[getAllRecommendation] Failed to save to DB for menu_id ${menuId}:`,
      dbErr.message,
    );
  }

  return {
    combinedSaran,
    combinedKekurangan,
  };
}

module.exports = {
  getRecommendation,
  getAllRecommendation,
};
