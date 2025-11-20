// npm install javascript-lp-solver
const solver = require("javascript-lp-solver");

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

// maybe still can be adjusted ?
const WEIGHT_MAP = {
	// Macros (very important, under:over ≈ 10:1)
	energi_kkal: { under: 100, over: 2 },
	protein_g: { under: 100, over: 2 },

	// Other macros (under:over ≈ 8:1)
	karbohidrat_g: { under: 100, over: 2 },
	lemak_g: { under: 100, over: 2 },
	serat_g: { under: 100, over: 1.5 },

	// Important micros (under:over ≈ 6–8:1)

	// kalsium_mg: { under: 10, over: 1.5 },
	// besi_mg: { under: 12, over: 1.5 },
	// vitamin_c_mg: { under: 8, over: 2 },
	// retinol_mcg: { under: 10, over: 2 },
	// B-vitamins and others (under:over ≈ 2:1)
	// thiamin_mg: { under: 4, over: 2 },
	// riboflavin_mg: { under: 4, over: 2 },
	// niasin_mg: { under: 4, over: 2 },

	// Fallback for unlisted nutrients
	default: { under: 3, over: 1.5 },
};

// -------------------------------
// buildModel (unchanged)
// -------------------------------
function buildModel(foods, current, goal) {
	const model = {
		optimize: "obj",
		opType: "min",
		constraints: {},
		variables: {},
	};

	// Define 1/3 target of full goal
	const target = {};
	for (const [nutrient, goalVal] of Object.entries(goal)) {
		target[nutrient] = goalVal / 3;
	}
	
	// Add foods
	for (const [foodName, foodValue] of Object.entries(foods)) {
		model.variables[foodName] = { obj: 0 };
		for (const [key, val] of Object.entries(foodValue)) {
			if (key === "gramasi") continue;
			model.variables[foodName][key] = val;
		}
	}

	// Build constraints
	for (const [nutrient, goalVal] of Object.entries(goal)) {
		const w = WEIGHT_MAP[nutrient] ?? WEIGHT_MAP.default;
		model.variables[`under_${nutrient}`] = { [nutrient]: -1, obj: w.under };
		model.variables[`over_${nutrient}`] = { [nutrient]: 1, obj: w.over };

		const diff = target[nutrient] - current[nutrient];
		// const maxDiff = goal[nutrient] - current[nutrient];

		if (diff > 0) {
			model.constraints[nutrient] = { min: diff, max: diff+100 };
		}
	}

	return model;
}

// ------------------------------------------------------
// 1. Compute each food's contribution for each nutrient
// ------------------------------------------------------
function computeNutrientContributions(result, foods) {
	const contrib = {};

	for (const [food, amount] of Object.entries(result)) {
		if (!foods[food] || amount <= 1e-6) continue;

		for (const [nutrient, val] of Object.entries(foods[food])) {
			if (nutrient === "gramasi") continue;

			if (!contrib[nutrient]) contrib[nutrient] = [];
			contrib[nutrient].push({
				food,
				amount,
				value: amount * val,
			});
		}
	}
	return contrib;
}

// ------------------------------------------------------
// 2. Detect unrealistic food usage
// ------------------------------------------------------
function findUnrealisticFoods(contrib, current, goal) {
	const issues = [];

	for (const [nutrient, list] of Object.entries(contrib)) {
		const totalNeeded = Math.max((goal[nutrient] ?? 0) / 3 - (current[nutrient] ?? 0), 0);
		if (totalNeeded <= 0) continue;

		const totalContrib = list.reduce((sum, x) => sum + x.value, 0);
		if (totalContrib <= 0) continue;

		for (const item of list) {
			const ratio = item.value / totalContrib;

			// suspicious if >80% of contribution and amount > 5 servings
			if (ratio > 0.8 && item.amount > 5) {
				issues.push({
					nutrient,
					food: item.food,
					amount: item.amount,
					ratio,
					missing: totalNeeded
				});
			}
		}
	}
	return issues;
}

// ------------------------------------------------------
// 3. LP Analyzer — best food per nutrient
// ------------------------------------------------------
function analyzeLP(result, foods, current, goal) {
	const analysis = [];

	for (const [nutrient, targetVal] of Object.entries(goal)) {
		const currentVal = current[nutrient] ?? 0;
		const target = targetVal / 3;
		const missing = target - currentVal;

		let bestFood = null;
		let bestContribution = 0;
		let bestEfficiency = 0;

		for (const [foodName, amount] of Object.entries(result)) {
			if (amount <= 0) continue;
			if (!foods[foodName]) continue;

			const foodNutrients = foods[foodName];
			const contributes = foodNutrients[nutrient] ?? 0;
			if (contributes <= 0) continue;

			const contributionTotal = contributes * amount;
			const efficiency = contributes;

			if (efficiency > bestEfficiency) {
				bestEfficiency = efficiency;
				bestContribution = contributionTotal;
				bestFood = foodName;
			}
		}

		analysis.push({
			nutrient,
			missing: missing > 0 ? missing : 0,
			chosen_food: bestFood,
			food_efficiency: bestEfficiency,
			contribution: bestContribution,
		});
	}

	return analysis;
}

// ------------------------------------------------------
// 4. Missing Food Category Detector
// ------------------------------------------------------
function findMissingFoodCategories(analysis) {
	const warnings = [];

	for (const item of analysis) {
		if (item.missing > 10) {
			if (!item.chosen_food) {
				warnings.push(
					`Missing foods rich in ${item.nutrient}.`
				);
				continue;
			}

			if (item.food_efficiency < 1) {
				warnings.push(
					`LP used ${item.chosen_food}, but it is LOW in ${item.nutrient}. Add better sources.`
				);
			}
		}
	}
	return warnings;
}

// ------------------------------------------------------
// NEW: Check for weird recommendation (Option B)
// ------------------------------------------------------
function checkWeirdRecommendation(saran, unrealisticFoodWarnings, threshold = 5) {
    const weirdItems = [];

    // Build nutrient mapping: which food → nutrients causing unrealistic usage
    const nutrientMap = {};
    for (const uw of unrealisticFoodWarnings || []) {
        if (!nutrientMap[uw.food]) nutrientMap[uw.food] = new Set();
        nutrientMap[uw.food].add(uw.nutrient);
    }

    // 1) servings above threshold
    // for (const item of saran) {
    //     if (item.serving != null && item.serving > threshold) {
    //         weirdItems.push({
    //             type: "large_serving",
    //             nama: item.nama,
    //             serving: item.serving,
    //             nutrients: nutrientMap[item.nama] 
    //                 ? Array.from(nutrientMap[item.nama]) 
    //                 : [],
    //             reason: `Serving ${item.serving} > ${threshold}`
    //         });
    //     }
    // }

    // 2) push unrealistic usage details
    for (const uw of unrealisticFoodWarnings || []) {
		const nutrientName = NUTRIENT_LABELS[uw.nutrient] || uw.nutrient;
        weirdItems.push({
            type: "lp_unrealistic",
            nutrient: uw.nutrient,
            food: uw.food,
            amount: uw.amount,
            ratio: uw.ratio,
            missing: uw.missing,
            reason: `Sistem rekomendasi menggunakan "${uw.food}" untuk menutupi kekurangan ${nutrientName} secara berlebihan, hal ini dapat disebabkan karena menu kekurangan bahan tinggi ${nutrientName}. Anda bisa menambahkan makanan yang tinggi akan ${nutrientName}. Jika bahan dirasa sudah pas, maka anda dapat mengabaikan saran ini.`,
        });
    }

    return { weird: weirdItems.length > 0, weirdItems };
}


// ------------------------------------------------------
// 5. Solve Recommendation
// ------------------------------------------------------
function getRecommendation(currentFoods, currentNutrition, classGrade = 1) {
	const selectedGoal = goals[classGrade];
	console.log("classgrade", classGrade);
	const model = buildModel(currentFoods, currentNutrition, selectedGoal);
	const results = solver.Solve(model);
	console.log(results);

	// -----------------------------
	// RUN ANALYZERS HERE
	// -----------------------------
	const lpAnalysis = analyzeLP(results, currentFoods, currentNutrition, selectedGoal);
	const missingFoodWarnings = findMissingFoodCategories(lpAnalysis);

	const contrib = computeNutrientContributions(results, currentFoods);
	const unrealisticFoodWarnings = findUnrealisticFoods(contrib, currentNutrition, selectedGoal);

	// -----------------------------
	// BUILD TARGET VALUES
	// -----------------------------
	const target = {};
	for (const [nutrient, goalVal] of Object.entries(selectedGoal)) {
		target[nutrient] = goalVal / 3;
	}

	// -----------------------------
	// Extract servings from LP results
	// -----------------------------
	const servingsToAdd = {};
	for (const [food, amount] of Object.entries(results)) {
		if (currentFoods[food] && amount > 1e-6) {
			servingsToAdd[food] = parseFloat(amount.toFixed(2))*100; //makanan 100 gram
		}
	}

	// -----------------------------
	// Calculate optimized total nutrition
	// -----------------------------
	const optimizedNutrition = { ...currentNutrition };
	for (const [food, amount] of Object.entries(servingsToAdd)) {
		for (const [nutrient, val] of Object.entries(currentFoods[food])) {
			optimizedNutrition[nutrient] =
				(optimizedNutrition[nutrient] || 0) + val * amount;
		}
	}

	// -----------------------------
	// Calculate deficits
	// -----------------------------
	const nutritionDifference = {};
	for (const [key, goalVal] of Object.entries(target)) {
		const currentVal = currentNutrition[key] || 0;
		const diff = goalVal - currentVal;
		nutritionDifference[key] = diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
	}

	// -----------------------------
	// Build saran
	// -----------------------------
	const saran = Object.entries(servingsToAdd)
		.filter(([, jumlahPorsi]) => jumlahPorsi > 0.01)
		.map(([nama, jumlahPorsi]) => ({
			nama,
			serving: parseFloat(jumlahPorsi.toFixed(2)),
		}));

	// -----------------------------
	// Build readable deficits
	// -----------------------------
	const defisitList = [];
	for (const [key, value] of Object.entries(nutritionDifference)) {
		if (value > 0.01) {
			let unit = key.includes("kkal")
				? "kkal"
				: key.includes("mg")
					? "mg"
					: key.includes("mcg")
						? "mcg"
						: "g";

			let readableKey = key.split("_")[0];
			readableKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1);

			defisitList.push(`${readableKey} (${value.toFixed(1)}${unit})`);
		}
	}
	const defisitString = defisitList.join(", ");
	const kekurangan =
		defisitString.length > 0
			? [{ menu: "Total Menu", kurang: defisitString }]
			: [];

	// -----------------------------
	// NEW: Check weird recommendations
	// -----------------------------
	const { weird, weirdItems } = checkWeirdRecommendation(saran, unrealisticFoodWarnings, 5);

	return {
		saran,
		kekurangan,
		lpAnalysis,
		missingFoodWarnings,
		unrealisticFoodWarnings,
		weirdRecommendation: weird,
		weirdDetails: weirdItems,
	};
}

// ------------------------------------------------------
// 6. All Class Grades
// ------------------------------------------------------
function getAllRecommendation(currentFoods, currentNutrition) {
	const allResults = [];
	const allIssues = [];
	const allWarnings = [];

	for (const [classGrade, goalData] of Object.entries(goals)) {
		const grade = parseInt(classGrade);

		// === 1. Solve recommendation normally ===
		const result = getRecommendation(
			currentFoods,
			currentNutrition,
			grade
		);

		// Add to result list
		allResults.push({
			classGrade: grade,
			...result,
		});

		// === 2. ANALYSIS BLOCK (the part you were missing) ===
		const model = buildModel(currentFoods, currentNutrition, goalData);
		const solverResult = solver.Solve(model);

		// Contribution analysis
		const contrib = computeNutrientContributions(solverResult, currentFoods);

		// Detect unrealistic servings
		const issues = findUnrealisticFoods(
			contrib,
			currentNutrition,
			goalData
		);

		// Analyze nutrient gaps + efficiency
		const analysis = analyzeLP(
			solverResult,
			currentFoods,
			currentNutrition,
			goalData
		);

		// High-severity warnings
		const warnings = findMissingFoodCategories(analysis);

		// Push results with class context
		allIssues.push(...issues.map(i => ({ kelas: grade, ...i })));
		allWarnings.push(...warnings.map(w => ({ kelas: grade, warning: w })));

		// Also push any per-grade weirdRecommendations
		if (result.weirdRecommendation) {
    allWarnings.push({
        kelas: grade,
        warning: "Unusually large servings detected.",
        details: result.weirdDetails.map(w => ({
            food: w.nama || w.food,
            serving: w.serving,
            nutrients: w.nutrients || [w.nutrient],
            reason: w.reason
        }))
    });
}

	}

	// === 3. Original merged outputs ===
	const combinedSaran = allResults.flatMap((r) =>
		r.saran.map((item) => ({
			kelas: r.classGrade,
			...item,
		}))
	);

	const combinedKekurangan = allResults.flatMap((r) =>
		r.kekurangan.map((item) => ({
			kelas: r.classGrade,
			...item,
		}))
	);

	// === 4. Add analysis output ===
	return {
		combinedSaran,
		combinedKekurangan,
		// issues: allIssues,       // <-- unrealistic servings
		warnings: allWarnings,   // <-- missing high-X nutrient sources + weirdRecommendation
	};
}

module.exports = {
	getRecommendation,
	getAllRecommendation,
};
