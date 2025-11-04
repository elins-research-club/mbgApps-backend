// npm install javascript-lp-solver
const solver = require("javascript-lp-solver");

// ------------------------------
// Nutrition goal -> based on excel tapi ada beberapa yang gaada di excel seperti retinol, b_kar, karoten
// ini dikelompokkan berdasarkan kelas (sd sampe sma). Untuk tau umur anak sd - sma, aku tanya gpt
// ------------------------------
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

function buildModel(foods, current, goal) {
	const model = {
		optimize: "obj",
		opType: "min",
		constraints: {},
		variables: {},
	};

	// Define 1/3 target of full goal
	// dengan pertimbangan 1 anak itu 3 kali makan, karena goal nya menggunakan batas gizi 1 hari penuh, maka
	// target gizi dibagi 3
	// intinya model linear programming ini mencoba untuk mencari kombinasi jumlah makanan yang sesuai untuk ditambahkan
	// dengan constraint constraint yang ada dan meminimalisir nilai deviation dari weight yang ditambahkan sebelumnya
	const target = {};
	for (const [nutrient, goalVal] of Object.entries(goal)) {
		target[nutrient] = goalVal / 3;
	}
	// Add foods
	for (const [foodName, foodValue] of Object.entries(foods)) {
		model.variables[foodName] = { obj: 0 };
		for (const [key, val] of Object.entries(foodValue)) {
			model.variables[foodName][key] = val;
		}
	}

	// Build constraints
	for (const [nutrient, goalVal] of Object.entries(goal)) {
		const w = WEIGHT_MAP[nutrient] ?? WEIGHT_MAP.default;
		model.variables[`under_${nutrient}`] = { [nutrient]: -1, obj: w.under };
		model.variables[`over_${nutrient}`] = { [nutrient]: 1, obj: w.over };

		const diff = target[nutrient] - current[nutrient];
		const maxDiff = goal[nutrient] - current[nutrient];
		// kalau masih kurang pakai diff buat batas bawah dan target_nutrisi_harian/3 untuk batas atasnya
		if (diff > 0) {
			model.constraints[nutrient] = {
				min: diff,
				max: maxDiff,
			};
		}
		//   else {
		// 	model.constraints[nutrient] = {
		// 		min: 0,
		// 		max: goal[nutrient],
		// 	};
		// }
	}
	return model;
}

// ------------------------------
// 5. Solve and summarize
// ------------------------------

function getRecommendation(
	currentFoods,
	currentNutrition,
	servingSize = 1,
	classGrade = 1,
) {
	const dividedFoods = Object.fromEntries(
		Object.entries(currentFoods).map(([foodName, nutrients]) => [
			foodName,
			Object.fromEntries(
				Object.entries(nutrients).map(([key, value]) => [
					key,
					value / servingSize,
				]),
			),
		]),
	);

	const selectedGoal = goals[classGrade];
	const model = buildModel(dividedFoods, currentNutrition, selectedGoal);
	const results = solver.Solve(model);
	const target = {};
	for (const [nutrient, goalVal] of Object.entries(selectedGoal)) {
		target[nutrient] = goalVal / 3;
	}

	// Step 1: Calculate servings to add
	const servingsToAdd = {};
	for (const [food, amount] of Object.entries(results)) {
		if (dividedFoods[food] && amount > 1e-6) {
			servingsToAdd[food] = parseFloat(amount.toFixed(2));
		}
	}

	// Step 2: Calculate optimized nutrition after adding servings
	const optimizedNutrition = { ...currentNutrition };
	for (const [food, amount] of Object.entries(servingsToAdd)) {
		for (const [nutrient, val] of Object.entries(dividedFoods[food])) {
			optimizedNutrition[nutrient] =
				(optimizedNutrition[nutrient] || 0) + val * amount;
		}
	}

	// Step 3: Compute nutritionDifference (only show positive deficits)
	const nutritionDifference = {};
	for (const [key, goalVal] of Object.entries(target)) {
		const currentVal = currentNutrition[key] || 0;
		const diff = goalVal - currentVal;
		nutritionDifference[key] = diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
	}
	const saran = Object.entries(servingsToAdd)
		.filter(([, jumlahPorsi]) => jumlahPorsi > 0.01) // Filter yang nilainya sangat kecil
		.map(([nama, jumlahPorsi]) => ({
			nama: nama,
			// Asumsi 1 unit LP solver = 100g, jadi kita kalikan jumlahPorsi * 100
			// Jika 1 unit LP solver adalah 1 porsi, ganti 100 dengan berat 1 porsi (misal 50)
			// gramasi: parseFloat((jumlahPorsi * 100).toFixed(1)),
			serving: parseFloat(jumlahPorsi.toFixed(2)),
		}));

	// 2. Format Kekurangan (nutritionDifference) -> { kekurangan: [...] }
	const defisitList = [];
	for (const [key, value] of Object.entries(nutritionDifference)) {
		if (value > 0.01) {
			// Hanya sertakan nutrisi yang masih defisit (> 0.01)
			let unit = "g";
			let readableKey = key.split("_")[0]; // Ambil nama nutrisi pertama

			if (key.includes("kkal")) {
				unit = "kkal";
				readableKey = "Energi";
			} else if (key.includes("mg")) {
				unit = "mg";
			} else if (key.includes("mcg")) {
				unit = "mcg";
			} else if (key.includes("g")) {
				unit = "g";
			}

			// Buat nama nutrisi jadi Capitalized (e.g., 'protein_g' -> 'Protein')
			readableKey = readableKey.charAt(0).toUpperCase() + readableKey.slice(1);

			defisitList.push(`${readableKey} (${value.toFixed(1)}${unit})`);
		}
	}

	// Gabungkan semua defisit menjadi satu string
	const defisitString = defisitList.join(", ");
	// Format akhir yang diharapkan oleh RecommendationCard.js
	const kekurangan =
		defisitString.length > 0
			? [{ menu: "Total Menu", kurang: defisitString }]
			: [];

	return {
		saran: saran, // Key 'saran'
		kekurangan: kekurangan, // Key 'kekurangan'
	};
}

function getAllRecommendation(currentFoods, currentNutrition, servingSize = 1) {
	const allResults = [];

	for (const [classGrade, goalData] of Object.entries(goals)) {
		const result = getRecommendation(
			currentFoods,
			currentNutrition,
			servingSize,
			parseInt(classGrade),
		);

		// Add context (which class grade this result belongs to)
		allResults.push({
			classGrade: parseInt(classGrade),
			...result,
		});
	}

	// Combine all saran & kekurangan into one list
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

	return {
		combinedSaran,
		combinedKekurangan,
	};
}

module.exports = {
	getRecommendation,
	getAllRecommendation,
};
