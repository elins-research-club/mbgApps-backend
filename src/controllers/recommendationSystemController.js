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
function optimizeFoodPortions(currentFoods, goalDaily) {
  const goal = {
    energi_kkal: goalDaily.energi_kkal / 3,
    protein_g: goalDaily.protein_g / 3,
    lemak_g: goalDaily.lemak_g / 3,
    karbohidrat_g: goalDaily.karbohidrat_g / 3,
    serat_g: goalDaily.serat_g / 3,
  };

  const foodsList = Object.keys(currentFoods);
  const nutrients = [
    "energi_kkal",
    "protein_g",
    "lemak_g",
    "karbohidrat_g",
    "serat_g",
  ];

  const foodsPerGram = {};
  foodsList.forEach((foodName) => {
    const food = currentFoods[foodName];
    foodsPerGram[foodName] = {};
    nutrients.forEach((nutrient) => {
      foodsPerGram[foodName][nutrient] = food[nutrient] / food.gramasi;
    });
  });

  const nutrientMatrix = nutrients.map((nutrient) =>
    foodsList.map((foodName) => foodsPerGram[foodName][nutrient]),
  );

  const goalVector = nutrients.map((nutrient) => goal[nutrient]);
  const weights = [1.5, 2.0, 1.5, 1.5, 1.0];

  function objective(portions) {
    const achieved = nutrientMatrix.map((row, i) =>
      row.reduce((sum, val, j) => sum + val * portions[j], 0),
    );

    let weightedError = 0;
    for (let i = 0; i < nutrients.length; i++) {
      const relativeError = Math.pow(
        (achieved[i] - goalVector[i]) / goalVector[i],
        2,
      );
      weightedError += weights[i] * relativeError;
    }

    const totalWeight = portions.reduce((sum, p) => sum + p, 0);
    if (totalWeight > 1200) {
      weightedError += Math.pow((totalWeight - 1200) / 500, 2);
    }

    return weightedError;
  }

  function gradient(portions) {
    const grad = [];
    const epsilon = 1e-5;
    const f0 = objective(portions);

    for (let i = 0; i < portions.length; i++) {
      const portsPlus = [...portions];
      portsPlus[i] += epsilon;
      const fPlus = objective(portsPlus);
      grad.push((fPlus - f0) / epsilon);
    }

    return grad;
  }

  let portions = foodsList.map((foodName) => currentFoods[foodName].gramasi);

  const bounds = foodsList.map((foodName) => {
    const original = currentFoods[foodName].gramasi;
    const min = Math.max(30, original * 0.3);
    const max = Math.min(400, original * 3);
    return { min, max };
  });

  let learningRate = 10.0;
  const momentum = 0.9;
  let velocity = new Array(portions.length).fill(0);

  for (let iter = 0; iter < 2000; iter++) {
    const grad = gradient(portions);

    for (let i = 0; i < portions.length; i++) {
      velocity[i] = momentum * velocity[i] - learningRate * grad[i];
      portions[i] += velocity[i];
      portions[i] = Math.max(
        bounds[i].min,
        Math.min(bounds[i].max, portions[i]),
      );
    }

    if (iter % 100 === 0) {
      learningRate *= 0.95;
    }
  }

  const achievedNutrients = nutrientMatrix.map((row) =>
    row.reduce((sum, val, j) => sum + val * portions[j], 0),
  );

  const response = {
    success: true,
    meal_type: "one_meal",
    portions: {},
    nutritional_achievement: {},
    daily_projection: {},
    total_weight_g: portions.reduce((sum, p) => sum + p, 0),
  };

  foodsList.forEach((foodName, i) => {
    const original = currentFoods[foodName].gramasi;
    const optimized = portions[i];
    const servings = optimized / original;

    response.portions[foodName] = {
      recommended_grams: Math.round(optimized * 10) / 10,
      original_grams: original,
      servings: Math.round(servings * 100) / 100,
    };
  });

  nutrients.forEach((nutrient, i) => {
    const goalVal = goalVector[i];
    const achievedVal = achievedNutrients[i];
    const gap = goalVal - achievedVal;
    const percent = (achievedVal / goalVal) * 100;

    let status = "short";
    if (percent >= 95) status = "achieved";
    else if (percent >= 80) status = "close";

    response.nutritional_achievement[nutrient] = {
      goal_per_meal: Math.round(goalVal * 10) / 10,
      achieved_per_meal: Math.round(achievedVal * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      percentage: Math.round(percent * 10) / 10,
      status: status,
    };

    const dailyAchieved = achievedVal * 3;
    const dailyGoal = goalDaily[nutrient];
    const dailyPercent = (dailyAchieved / dailyGoal) * 100;

    response.daily_projection[nutrient] = {
      goal_daily: dailyGoal,
      projected_daily: Math.round(dailyAchieved * 10) / 10,
      percentage: Math.round(dailyPercent * 10) / 10,
    };
  });

  return response;
}

// Get all recommendations - updated to accept object of goals
async function getAllRecommendation(currentFoods) {
  const combinedSaran = [];

  for (const goalId in goals) {
    const goalDaily = goals[goalId];
    const result = optimizeFoodPortions(currentFoods, goalDaily);

    combinedSaran.push({
      goal_id: goalId,
      goal_daily: goalDaily,
      recommendation: result,
    });
  }

  return {
    success: true,
    total_goals: combinedSaran.length,
    combinedSaran: combinedSaran,
  };
}

module.exports = {
  getRecommendation,
  getAllRecommendation,
};
