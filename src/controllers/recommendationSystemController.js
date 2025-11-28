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
	karbohidrat_g: { under: 2, over: 10 },

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
function buildModel(foods, current, goal) {
	const model = {
		optimize: "obj",
		opType: "min",
		constraints: {},
		variables: {},
	};

	// Target = 1/3 daily requirement
	const target = {};
	for (const [nutrient, goalVal] of Object.entries(goal)) {
		target[nutrient] = goalVal / 3;
	}

	// --------------------------
	// Add food variables
	// --------------------------
	for (const [foodName, foodValue] of Object.entries(foods)) {
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

		// Optional: add upper bound if you have max amounts
		// model.constraints[`${foodName}_bound`].max = foodValue.gramasi || 1000;
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
// Compute each food's nutritional contribution
// ------------------------------------------------------
function computeNutrientContributions(result, foods) {
	const contrib = {};

	for (const [food, amount] of Object.entries(result)) {
		if (!foods[food]) continue;

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
// Detect unrealistic food usage
// ------------------------------------------------------
function findUnrealisticFoods(contrib, current, goal) {
	const issues = [];

	for (const [nutrient, list] of Object.entries(contrib)) {
		const totalNeeded = Math.max(
			(goal[nutrient] ?? 0) / 3 - (current[nutrient] ?? 0),
			0,
		);
		if (totalNeeded <= 0) continue;

		const totalContrib = list.reduce((sum, x) => sum + x.value, 0);

		// If solver used too much of a food to cover a small deficit → suspicious
		for (const entry of list) {
			const ratio = entry.value / totalNeeded;

			if (ratio > 5) {
				issues.push({
					nutrient,
					food: entry.food,
					amount: entry.amount,
					ratio: ratio,
					missing: totalNeeded,
					reason: `Food contributes ${ratio.toFixed(1)}× more than required.`,
				});
			}
		}

		// If total contribution is extremely higher than requirement
		if (totalContrib > totalNeeded * 10) {
			issues.push({
				nutrient,
				reason: `Total contribution for ${nutrient} is unrealistic (${totalContrib.toFixed(
					1,
				)} vs need ${totalNeeded.toFixed(1)}).`,
			});
		}
	}

	return issues;
}

// ------------------------------------------------------
// Export functions
// ------------------------------------------------------
module.exports = {
	buildModel,
	computeNutrientContributions,
	findUnrealisticFoods,
};

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
				warnings.push(`Missing foods rich in ${item.nutrient}.`);
				continue;
			}

			if (item.food_efficiency < 1) {
				warnings.push(
					`LP used ${item.chosen_food}, but it is LOW in ${item.nutrient}. Add better sources.`,
				);
			}
		}
	}
	return warnings;
}

// ------------------------------------------------------
// Check for weird or excessive recommendations
// ------------------------------------------------------
function checkWeirdRecommendation(saran, unrealisticFoodWarnings) {
	const weirdItems = [];
	const GRAM_THRESHOLD = 100;

	// Check for excessive servings (>100g)
	for (const item of saran) {
		if (item.serving != null && item.serving > GRAM_THRESHOLD) {
			weirdItems.push({
				type: "excessive_amount",
				nama: item.nama,
				serving: item.serving,
				reason: `Porsi terlalu besar (${item.serving}g)`
			});
		}
	}

	// Check for unrealistic LP usage
	for (const uw of unrealisticFoodWarnings || []) {
		const nutrientName = NUTRIENT_LABELS[uw.nutrient] || uw.nutrient;
		weirdItems.push({
			type: "unrealistic_usage",
			food: uw.food,
			nutrient: uw.nutrient,
			amount: uw.amount,
			reason: `${uw.food} berlebihan untuk ${nutrientName}`
		});
	}

	return { 
		weird: weirdItems.length > 0, 
		weirdItems 
	};
}

// ------------------------------------------------------
// 5. Solve Recommendation
// ------------------------------------------------------
function getRecommendation(currentFoods, currentNutrition, classGrade = 1) {
	const selectedGoal = goals[classGrade];
	const model = buildModel(currentFoods, currentNutrition, selectedGoal);
	const results = solver.Solve(model);

	// -----------------------------
	// RUN ANALYZERS HERE
	// -----------------------------
	const lpAnalysis = analyzeLP(
		results,
		currentFoods,
		currentNutrition,
		selectedGoal,
	);
	const missingFoodWarnings = findMissingFoodCategories(lpAnalysis);

	const contrib = computeNutrientContributions(results, currentFoods);
	const unrealisticFoodWarnings = findUnrealisticFoods(
		contrib,
		currentNutrition,
		selectedGoal,
	);

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
		if (currentFoods[food]) {
			servingsToAdd[food] =
				parseFloat(amount.toFixed(2)) * currentFoods[food].gramasi; //makanan 100 gram
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
	const { weird, weirdItems } = checkWeirdRecommendation(
		saran,
		unrealisticFoodWarnings,
		3,
	);

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

		// === RUN ONCE ONLY ===
		const result = getRecommendation(currentFoods, currentNutrition, grade);
		allResults.push({
			classGrade: grade,
			...result,
		});

		// === Reuse analysis from getRecommendation ===
		allIssues.push(
			...result.unrealisticFoodWarnings.map((i) => ({
				kelas: grade,
				...i,
			})),
		);

		if (result.lpAnalysis?.missingCategories) {
			allWarnings.push(
				...result.lpAnalysis.missingCategories.map((w) => ({
					kelas: grade,
					warning: w,
				})),
			);
		}

		if (result.weirdRecommendation) {
			allWarnings.push({
				kelas: grade,
				warning: "Unusually large servings detected.",
				details: result.weirdDetails,
			});
		}
	}

	// Merge results
	const combinedSaran = allResults.flatMap((r) =>
		r.saran.map((item) => ({
			kelas: r.classGrade,
			...item,
		})),
	);

	const combinedKekurangan = allResults.flatMap((r) =>
		r.kekurangan.map((item) => ({
			kelas: r.classGrade,
			...item,
		})),
	);
	console.log("issues", allIssues);
	console.log("warnings", allWarnings);
	return {
		combinedSaran,
		combinedKekurangan,
		issues: allIssues,
		warnings: allWarnings,
	};
}

module.exports = {
	getRecommendation,
	getAllRecommendation,
};
