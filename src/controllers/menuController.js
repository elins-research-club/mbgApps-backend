const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
	getAiSuggestion,
	findIngredientAlternative,
	analyzeNewMenu,
	findSimilarMenu,
	getIngredientNutrition,
} = require("../services/aiService");
const {
	getRecommendation,
	getAllRecommendation,
} = require("./recommendationSystemController");

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
		kalsium_mg: 1000,
		// fosfor_mg: 500,
		besi_mg: 10,
		natrium_mg: 1000,
		kalium_mg: 3200,
		// tembaga_mg: 570,
		// seng_mg: 5,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.1,
		// niasin_mg: 10,
		vitamin_c_mg: 45,
	},
	2: {
		// TK B
		energi_kkal: 1400,
		protein_g: 25,
		lemak_g: 50,
		karbohidrat_g: 250,
		serat_g: 20,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 500,
		besi_mg: 10,
		natrium_mg: 1000,
		kalium_mg: 3200,
		// tembaga_mg: 570,
		// seng_mg: 5,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.1,
		// niasin_mg: 10,
		vitamin_c_mg: 45,
	},
	3: {
		//SD 1
		energi_kkal: 1650,
		protein_g: 40,
		lemak_g: 55,
		karbohidrat_g: 250,
		serat_g: 23,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 500,
		besi_mg: 10,
		natrium_mg: 1000,
		kalium_mg: 3200,
		// tembaga_mg: 570,
		// seng_mg: 5,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.1,
		// niasin_mg: 10,
		vitamin_c_mg: 45,
	},
	4: {
		// SD 2
		energi_kkal: 1650,
		protein_g: 40,
		lemak_g: 55,
		karbohidrat_g: 250,
		serat_g: 23,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 500,
		besi_mg: 10,
		natrium_mg: 1000,
		kalium_mg: 3200,
		// tembaga_mg: 570,
		// seng_mg: 5,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.1,
		// niasin_mg: 10,
		vitamin_c_mg: 45,
	},
	5: {
		//SD 3
		energi_kkal: 1650,
		protein_g: 40,
		lemak_g: 55,
		karbohidrat_g: 250,
		serat_g: 23,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 500,
		// besi_mg: 10,
		natrium_mg: 1000,
		kalium_mg: 3200,
		tembaga_mg: 570,
		// seng_mg: 5,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.1,
		// niasin_mg: 10,
		vitamin_c_mg: 45,
	},
	6: {
		//SD 4
		energi_kkal: 2000,
		protein_g: 50,
		lemak_g: 65,
		karbohidrat_g: 300,
		serat_g: 28,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 1250,
		besi_mg: 8,
		natrium_mg: 1300,
		kalium_mg: 3900,
		// tembaga_mg: 700,
		// seng_mg: 8,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.3,
		// niasin_mg: 12,
		vitamin_c_mg: 50,
	},
	7: {
		//SD 5
		energi_kkal: 2000,
		protein_g: 50,
		lemak_g: 65,
		karbohidrat_g: 300,
		serat_g: 28,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 1250,
		// besi_mg: 8,
		natrium_mg: 1300,
		kalium_mg: 3900,
		tembaga_mg: 700,
		// seng_mg: 8,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.3,
		// niasin_mg: 12,
		vitamin_c_mg: 50,
	},
	8: {
		//SD 6
		energi_kkal: 2000,
		protein_g: 50,
		lemak_g: 65,
		karbohidrat_g: 300,
		serat_g: 28,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 1250,
		// besi_mg: 8,
		natrium_mg: 1300,
		kalium_mg: 3900,
		tembaga_mg: 700,
		// seng_mg: 8,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.1,
		// riboflavin_mg: 1.3,
		// niasin_mg: 12,
		vitamin_c_mg: 50,
	},
	9: {
		// SMP 1
		energi_kkal: 2400,
		protein_g: 70,
		lemak_g: 80,
		karbohidrat_g: 350,
		serat_g: 34,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1200,
		// fosfor_mg: 1250,
		besi_mg: 11,
		natrium_mg: 1500,
		kalium_mg: 4800,
		// tembaga_mg: 795,
		// seng_mg: 11,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.2,
		// riboflavin_mg: 1.3,
		// niasin_mg: 16,
		vitamin_c_mg: 75,
	},
	10: {
		//SMP 2
		energi_kkal: 2400,
		protein_g: 70,
		lemak_g: 80,
		karbohidrat_g: 350,
		serat_g: 34,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1200,
		// fosfor_mg: 1250,
		besi_mg: 11,
		natrium_mg: 1500,
		kalium_mg: 4800,
		// tembaga_mg: 795,
		// seng_mg: 11,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.2,
		// riboflavin_mg: 1.3,
		// niasin_mg: 16,
		vitamin_c_mg: 75,
	},
	11: {
		//SMP 3
		energi_kkal: 2650,
		protein_g: 75,
		lemak_g: 85,
		karbohidrat_g: 400,
		serat_g: 37,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1200,
		// fosfor_mg: 1250,
		besi_mg: 9,
		natrium_mg: 1700,
		kalium_mg: 5300,
		// tembaga_mg: 890,
		// seng_mg: 11,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.2,
		// riboflavin_mg: 1.3,
		// niasin_mg: 16,
		vitamin_c_mg: 90,
	},
	12: {
		//SMA 1
		energi_kkal: 2650,
		protein_g: 75,
		lemak_g: 85,
		karbohidrat_g: 400,
		serat_g: 37,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1200,
		// fosfor_mg: 1250,
		besi_mg: 9,
		natrium_mg: 1700,
		kalium_mg: 5300,
		// tembaga_mg: 890,
		// seng_mg: 11,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.2,
		// riboflavin_mg: 1.3,
		// niasin_mg: 16,
		vitamin_c_mg: 90,
	},
	13: {
		//SMA 2
		energi_kkal: 2650,
		protein_g: 75,
		lemak_g: 85,
		karbohidrat_g: 400,
		serat_g: 37,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1200,
		// fosfor_mg: 1250,
		besi_mg: 9,
		natrium_mg: 1700,
		kalium_mg: 5300,
		// tembaga_mg: 890,
		// seng_mg: 11,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.2,
		// riboflavin_mg: 1.3,
		// niasin_mg: 16,
		vitamin_c_mg: 90,
	},
	14: {
		//SMA 3
		energi_kkal: 2650,
		protein_g: 65,
		lemak_g: 75,
		karbohidrat_g: 430,
		serat_g: 37,
		// abu_g: 5, // optional, tidak tercantum di AKG resmi
		kalsium_mg: 1000,
		// fosfor_mg: 700,
		besi_mg: 9,
		natrium_mg: 1500,
		kalium_mg: 4700,
		// tembaga_mg: 900,
		// seng_mg: 11,
		// retinol_mcg: 500,
		// b_kar_mcg: 3600,
		// karoten_total_mcg: 4000,
		// thiamin_mg: 1.2,
		// riboflavin_mg: 1.3,
		// niasin_mg: 16,
		vitamin_c_mg: 90,
	},
};

function computeAkgAll(totalGizi) {
	const all = {};
	for (const [classId, target] of Object.entries(goals)) {
		all[classId] = {};
		for (const [nutr, val] of Object.entries(target)) {
			const got = Number(totalGizi[nutr] || 0);
			if (!val || got === 0) {
				all[classId][nutr] = "0%";
				continue;
			}
			const p = (got / val) * 100;
			all[classId][nutr] = p > 0 && p < 1 ? "<1%" : `${Math.round(p)}%`;
		}
	}
	return all;
}

// =================================================================
// HELPER: Fungsi pencarian bahan
// =================================================================
function calculateSimilarity(str1, str2) {
	const words1 = str1.toLowerCase().split(/\s+/);
	const words2 = str2.toLowerCase().split(/\s+/);
	const matches = words1.filter((w) => words2.includes(w)).length;
	return matches / Math.max(words1.length, words2.length);
}

async function findBestMatchingBahan(searchName) {
	const cleanSearch = searchName.toLowerCase().trim();
	let bahan = await prisma.bahan.findFirst({ where: { nama: cleanSearch } });
	if (bahan) return { bahan, matchType: "exact", confidence: 1.0 };
	bahan = await prisma.bahan.findFirst({
		where: { nama: { contains: cleanSearch } },
	});
	if (bahan) return { bahan, matchType: "partial", confidence: 0.8 };
	const allBahan = await prisma.bahan.findMany({
		select: { id: true, nama: true },
	});
	let bestMatch = null;
	let bestScore = 0;
	for (const b of allBahan) {
		const score = calculateSimilarity(cleanSearch, b.nama);
		if (score > bestScore && score > 0.4) {
			bestScore = score;
			bestMatch = b;
		}
	}
	if (bestMatch) {
		const fullBahan = await prisma.bahan.findUnique({
			where: { id: bestMatch.id },
		});
		return { bahan: fullBahan, matchType: "similarity", confidence: bestScore };
	}
	return { bahan: null, matchType: "not_found", confidence: 0 };
}

// =================================================================
// FUNGSI UNTUK SEARCH BOX
// =================================================================
const searchMenus = async (req, res) => {
	const query = req.query.q || "";
	if (query.length < 2) {
		return res.json([]);
	}
	try {
		const menus = await prisma.menu.findMany({
			where: { nama: { contains: query.toLowerCase() } },
			select: {
				id: true,
				nama: true,
				kategori: true,
			},
			take: 20,
		});

		console.log(`🔍 Search query: "${query}"`);
		console.log(`📊 Total results:`, menus.length);
		console.log(
			`📋 All menus:`,
			menus.map((m) => ({ id: m.id, nama: m.nama, kategori: m.kategori })),
		);

		res.status(200).json(menus);
	} catch (error) {
		console.error("❌ Search error:", error);
		res.status(500).json({ message: "Gagal mencari menu" });
	}
};

// =================================================================
// FUNGSI getMenus
// =================================================================
const getMenus = async (req, res) => {
	try {
		const allMenus = await prisma.menu.findMany({ orderBy: { nama: "asc" } });
		const groupedMenus = allMenus.reduce(
			(acc, menu) => {
				if (acc[menu.kategori])
					acc[menu.kategori].push({ id: menu.id, nama: menu.nama });
				return acc;
			},
			{ karbo: [], lauk: [], sayur: [], side_dish: [], buah: [] },
		);
		return res.status(200).json(groupedMenus);
	} catch (error) {
		console.error("Error saat mengambil menu:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

// =================================================================
// BAGIAN 2: generateNutrition
// =================================================================
const generateNutrition = async (req, res) => {
	try {
		// Request body: { bahan: [ { bahan_id: 123, gramasi: 100 }, { bahan_id: "nasi putih", gramasi: 150 }]}
		const bahanInputs = Array.isArray(req.body?.bahan) ? req.body.bahan : [];
		console.log(`\n--- MEMULAI KALKULASI GIZI ---`);

		if (bahanInputs.length === 0)
			return res.status(400).json({ message: "Tidak ada menu yang dipilih." });

		const ids = bahanInputs
			.filter((b) => b.bahan_id != null)
			.map((b) => parseInt(b.bahan_id));

		const dbById = ids.length
			? await prisma.bahan.findMany({ where: { id: { in: ids } } })
			: [];

		const bahanMapById = new Map(dbById.map((b) => [b.id, b]));
		const allBahan = await prisma.bahan.findMany({
			select: { id: true, nama: true },
		});

		let totalGizi = {
			energi_kkal: 0,
			protein_g: 0,
			lemak_g: 0,
			karbohidrat_g: 0,
			serat_g: 0,
			abu_g: 0,
			kalsium_mg: 0,
			fosfor_mg: 0,
			besi_mg: 0,
			natrium_mg: 0,
			kalium_mg: 0,
			tembaga_mg: 0,
			seng_mg: 0,
			retinol_mcg: 0,
			b_kar_mcg: 0,
			karoten_total_mcg: 0,
			thiamin_mg: 0,
			riboflavin_mg: 0,
			niasin_mg: 0,
			vitamin_c_mg: 0,
		};

		let totalGramasi = 0;
		const detailBahan = [];
		const detailBahanForLp = {};

		for (const input of bahanInputs) {
			const gramasi = Number(input.gramasi) || 0;
			totalGramasi += gramasi;

			let bahanRow = null;
			if (input.bahan_id != null) {
				bahanRow = bahanMapById.get(parseInt(input.bahan_id));
			}
			if (!bahanRow && input.nama) {
				const nameClean = String(input.nama).toLowerCase().trim();
				bahanRow = await prisma.bahan.findFirst({ where: { nama: nameClean } });
				if (!bahanRow) {
					const candidate = allBahan.find((b) =>
						String(b.nama).toLowerCase().includes(nameClean),
					);
					if (candidate) {
						bahanRow = await prisma.bahan.findUnique({
							where: { id: candidate.id },
						});
					}
				}
			}

			// if (!bahanRow) {
			// 	missingBahan.push({ input, reason: "not_found_in_db" });
			// 	console.warn(`! Bahan tidak ditemukan:`, input);
			// 	continue;
			// }

			const ratio = gramasi / 100;
			const giziBahanIni = {};

			for (const key in totalGizi) {
				console.log("key", key);
				const val = bahanRow[key] != null ? Number(bahanRow[key]) : 0;
				const added = val * ratio;
				totalGizi[key] += added;
				giziBahanIni[key] = parseFloat(added.toFixed(2));
			}

			detailBahan.push({
				id: bahanRow.id,
				nama: bahanRow.nama,
				gramasi,
				gizi: giziBahanIni,
			});

			detailBahanForLp[bahanRow.nama] = {
				gramasi: gramasi,
				...giziBahanIni,
			};
		}

		console.log("DETAIL BAHAN FOR LP", detailBahanForLp);
		console.log(`\n[DETEKTOR 3] Total gramasi: ${totalGramasi}g`);
		console.log(
			`[DETEKTOR 3.1] Total energi: ${totalGizi.energi_kkal.toFixed(2)} kkal`,
		);

		for (const key in totalGizi)
			totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));

		const calculateAkg = (value, dailyValue) => {
			if (!dailyValue || !value) return "0%";
			const percentage = (value / dailyValue) * 100;
			if (percentage > 0 && percentage < 1) return "<1%";
			return `${Math.round(percentage)}%`;
		};

		console.log("[REKOMENDASI] totalGizi:", totalGizi);
		console.log("[Detail Bahan] detail bahan: ", detailBahan);
		const rekomendasi = getAllRecommendation(detailBahanForLp, totalGizi, 1);
		console.log(rekomendasi);
		console.log(
			"[REKOMENDASI] Result combinedSaran:",
			rekomendasi.combinedSaran?.length || 0,
		);
		console.log(
			"[REKOMENDASI] Result combinedKekurangan:",
			rekomendasi.combinedKekurangan?.length || 0,
		);
		console.log(
			"[REKOMENDASI] Full result:",
			JSON.stringify(rekomendasi, null, 2),
		);

		const persenAkgAll = computeAkgAll(totalGizi);
		console.log(
			"[AKG KESELURUHAN] Hasil persentase AKG per kategori: ",
			persenAkgAll,
		);

		const response = {
			totalLabel: {
				takaran_saji_g: parseFloat(totalGramasi.toFixed(2)),
				informasi_nilai_gizi: {
					...totalGizi,
					energi_dari_lemak_kkal: parseFloat(
						(totalGizi.lemak_g * 9).toFixed(2),
					),
				},
				persen_akg: {
					lemak_g: calculateAkg(totalGizi.lemak_g, 67),
					protein_g: calculateAkg(totalGizi.protein_g, 60),
					karbohidrat_g: calculateAkg(totalGizi.karbohidrat_g, 300),
					natrium_mg: calculateAkg(totalGizi.natrium_mg, 1500),
					kalsium_mg: calculateAkg(totalGizi.kalsium_mg, 1200),
					besi_mg: calculateAkg(totalGizi.besi_mg, 18),
					vitamin_c_mg: calculateAkg(totalGizi.vitamin_c_mg, 90),
					kalium_mg: calculateAkg(totalGizi.kalium_mg, 3900),
					besi_mg: calculateAkg(totalGizi.kalium_mg, 8),
					serat_g: calculateAkg(totalGizi.kalium_mg, 28),
				},
				persen_akg_all: persenAkgAll,
			},
			detailPerhitungan: {
				log: [`Total gramasi akhir: ${totalGramasi.toFixed(0)}g`],
				rincian_per_bahan: detailBahan,
			},
			rekomendasi: rekomendasi,
		};

		console.log(`\n✅ KALKULASI SELESAI`);
		return res.status(200).json(response);
	} catch (error) {
		console.error("Error saat generate nutrisi:", error);
		return res.status(500).json({ message: "Server error" });
	}
};

// =================================================================
// BAGIAN 3: suggestMenu
// =================================================================
const suggestMenu = async (req, res) => {
	const { new_menu_name } = req.body;
	if (!new_menu_name) {
		return res
			.status(400)
			.json({ message: "Nama menu baru tidak boleh kosong." });
	}

	try {
		console.log(`\n🤖 Meminta saran AI untuk: "${new_menu_name}"...`);
		const allMenus = await prisma.menu.findMany({ select: { nama: true } });
		const existingMenuNames = allMenus.map((menu) => menu.nama);
		const allBahanInDb = await prisma.bahan.findMany({
			select: { id: true, nama: true },
		});
		const bahanNameList = allBahanInDb.map((b) => b.nama);
		console.log(`📦 Database memiliki ${bahanNameList.length} bahan tersedia`);

		const suggestion = await getAiSuggestion(new_menu_name, existingMenuNames);
		console.log("✅ Hasil AI suggestion:", JSON.stringify(suggestion, null, 2));

		if (
			!suggestion ||
			!suggestion.suggested_category ||
			!Array.isArray(suggestion.suggested_ingredients)
		) {
			return res
				.status(500)
				.json({ message: "Respons AI tidak valid atau tidak lengkap." });
		}
		const { suggested_category, suggested_ingredients } = suggestion;

		console.log("\n🔍 Memproses bahan dan mencari alternatif scientific...");
		const ingredientResults = [];
		const recipesToCreate = [];
		const missingIngredients = [];
		const processedBahanIds = new Set();

		for (const ingredient of suggested_ingredients) {
			if (!ingredient.nama || typeof ingredient.gramasi === "undefined") {
				console.log(`! Format ingredient tidak valid:`, ingredient);
				continue;
			}

			const searchResult = await findBestMatchingBahan(ingredient.nama);

			let bahanIdToUse = null;
			let gramasiToUse = ingredient.gramasi;
			let statusLog = {};

			if (searchResult.bahan) {
				bahanIdToUse = searchResult.bahan.id;
				statusLog = {
					status: "found",
					match_type: searchResult.matchType,
					confidence: searchResult.confidence,
					bahan_digunakan: searchResult.bahan.nama,
					scientific_alternative: null,
				};
				console.log(
					`✅ "${ingredient.nama}" → DITEMUKAN: "${searchResult.bahan.nama}" (${
						searchResult.matchType
					}, ${searchResult.confidence * 100}%)`,
				);
			} else {
				console.log(
					`! "${ingredient.nama}" → TIDAK DITEMUKAN di database, perlu alternatif.`,
				);
				missingIngredients.push({
					nama: ingredient.nama,
					gramasi: gramasiToUse,
				});
				statusLog = { status: "pending_alternative" };
			}

			ingredientResults.push({
				nama_dicari: ingredient.nama,
				gramasi_saran: gramasiToUse,
				bahan_id: bahanIdToUse,
				...statusLog,
			});

			if (bahanIdToUse !== null) {
				if (!processedBahanIds.has(bahanIdToUse)) {
					recipesToCreate.push({
						bahan_id: bahanIdToUse,
						gramasi: gramasiToUse,
					});
					processedBahanIds.add(bahanIdToUse);
				} else {
					console.log(
						`! DUPLIKAT Terdeteksi untuk bahan ID ${bahanIdToUse} ("${searchResult.bahan.nama}"), dilewati.`,
					);
				}
			}
		}

		console.log(
			`\n📊 Ringkasan Pencarian Awal: Ditemukan langsung ${processedBahanIds.size}/${suggested_ingredients.length}, Perlu alternatif: ${missingIngredients.length}`,
		);

		if (missingIngredients.length > 0) {
			console.log(
				`\n🔬 Mencari alternatif / data nutrisi untuk ${missingIngredients.length} bahan...`,
			);
			for (const missing of missingIngredients) {
				console.log(`\n📌 Analisis: "${missing.nama}"`);
				let foundViaAlternative = false;

				const logEntry = ingredientResults.find(
					(entry) =>
						entry.nama_dicari === missing.nama &&
						entry.status === "pending_alternative",
				);

				const altResult = await findIngredientAlternative(
					missing.nama,
					bahanNameList,
				);

				if (altResult.alternative_found && altResult.alternative_name) {
					const altBahan = await prisma.bahan.findFirst({
						where: { nama: altResult.alternative_name },
					});
					if (altBahan) {
						console.log(
							`✅ ALTERNATIF DITEMUKAN: "${altBahan.nama}" (Scientific)`,
						);
						console.log(`   └─ Alasan: ${altResult.scientific_reason}`);
						console.log(
							`   └─ Confidence: ${(altResult.similarity_score * 100).toFixed(
								0,
							)}%`,
						);

						if (logEntry) {
							logEntry.status = "scientific_alternative";
							logEntry.bahan_digunakan = altBahan.nama;
							logEntry.bahan_id = altBahan.id;
							logEntry.match_type = "scientific";
							logEntry.confidence = altResult.similarity_score;
							logEntry.scientific_alternative = {
								original: missing.nama,
								alternative: altBahan.nama,
								reason: altResult.scientific_reason,
								category_match: altResult.category_match || null,
							};
						}

						if (!processedBahanIds.has(altBahan.id)) {
							recipesToCreate.push({
								bahan_id: altBahan.id,
								gramasi: missing.gramasi,
							});
							processedBahanIds.add(altBahan.id);
						} else {
							console.log(
								`! DUPLIKAT (via Alternatif) Terdeteksi untuk bahan ID ${altBahan.id} ("${altBahan.nama}"), dilewati.`,
							);
						}
						foundViaAlternative = true;
					} else {
						console.log(
							`! Alternatif "${altResult.alternative_name}" (disarankan AI) tidak ditemukan di DB`,
						);
					}
				} else {
					console.log(
						`! Tidak ada alternatif scientific untuk "${missing.nama}"`,
					);
					console.log(`   └─ ${altResult.scientific_reason}`);
				}

				if (!foundViaAlternative) {
					console.log(
						`🤖 Mencoba generate nutrisi via AI untuk "${missing.nama}"...`,
					);
					const generatedNutrition = await getIngredientNutrition(missing.nama);

					if (generatedNutrition) {
						const newOrUpdatedBahan = await prisma.bahan.upsert({
							where: { nama: generatedNutrition.nama.toLowerCase() },
							update: generatedNutrition,
							create: generatedNutrition,
						});
						console.log(
							`✅ Data nutrisi AI untuk "${newOrUpdatedBahan.nama}" disimpan/diupdate di DB (ID: ${newOrUpdatedBahan.id}).`,
						);

						if (logEntry) {
							logEntry.status = "ai_generated";
							logEntry.bahan_digunakan = newOrUpdatedBahan.nama;
							logEntry.bahan_id = newOrUpdatedBahan.id;
							logEntry.match_type = "ai_generated";
							logEntry.confidence = 0.9;
						}

						if (!processedBahanIds.has(newOrUpdatedBahan.id)) {
							recipesToCreate.push({
								bahan_id: newOrUpdatedBahan.id,
								gramasi: missing.gramasi,
							});
							processedBahanIds.add(newOrUpdatedBahan.id);
						} else {
							console.log(
								`! DUPLIKAT (via AI Generate) Terdeteksi untuk bahan ID ${newOrUpdatedBahan.id} ("${newOrUpdatedBahan.nama}"), dilewati.`,
							);
						}
					} else {
						console.log(
							`❌ AI juga GAGAL mendapatkan data nutrisi untuk "${missing.nama}". Bahan ini tidak akan dimasukkan.`,
						);

						if (logEntry) {
							logEntry.status = "not_found";
							logEntry.bahan_digunakan = null;
							logEntry.bahan_id = null;
						}
					}
				}
			}
		}

		const finalFoundCount = ingredientResults.filter(
			(r) => r.status === "found" || r.status === "scientific_alternative",
		).length;
		const finalNotFoundCount = ingredientResults.filter(
			(r) => r.status === "not_found" || r.status === "pending_alternative",
		).length;
		const scientificCount = ingredientResults.filter(
			(r) => r.status === "scientific_alternative",
		).length;
		const directMatchCount = finalFoundCount - scientificCount;
		console.log(
			`\n📊 Ringkasan Akhir: Total bahan valid: ${finalFoundCount}/${suggested_ingredients.length} (Direct: ${directMatchCount}, Scientific: ${scientificCount}), Gagal: ${finalNotFoundCount}`,
		);

		const newMenu = await prisma.menu.create({
			data: { nama: new_menu_name.toLowerCase(), kategori: suggested_category },
		});
		console.log(
			`\n✅ Menu "${newMenu.nama}" berhasil dibuat di kategori "${suggested_category}"`,
		);
		console.log(
			`\n💾 Membuat ${recipesToCreate.length} resep unik untuk menu "${newMenu.nama}"...`,
		);

		for (const recipe of recipesToCreate) {
			await prisma.resep.create({
				data: {
					menu_id: newMenu.id,
					bahan_id: recipe.bahan_id,
					gramasi: recipe.gramasi,
				},
			});
		}
		console.log(`✅ Berhasil membuat ${recipesToCreate.length} resep unik.`);

		const createdRecipes = await prisma.resep.findMany({
			where: { menu_id: newMenu.id },
			include: { bahan: true },
		});
		let totalEnergi = 0,
			totalProtein = 0,
			totalGramasi = 0;
		createdRecipes.forEach((r) => {
			const ratio = r.gramasi / 100;
			totalEnergi += (r.bahan.energi_kkal || 0) * ratio;
			totalProtein += (r.bahan.protein_g || 0) * ratio;
			totalGramasi += r.gramasi;
		});
		console.log(
			`\n📊 Estimasi Nutrisi Menu Baru: Gramasi: ${totalGramasi.toFixed(
				0,
			)}g, Energi: ${totalEnergi.toFixed(
				1,
			)} kkal, Protein: ${totalProtein.toFixed(1)}g`,
		);

		const scientificAlternatives = ingredientResults
			.filter((r) => r.scientific_alternative)
			.map((r) => r.scientific_alternative);
		const response = {
			...newMenu,
			ai_analysis: {
				suggested_ingredients_count: suggested_ingredients.length,
				ingredients_found: finalFoundCount,
				ingredients_not_found: finalNotFoundCount,
				direct_match: directMatchCount,
				scientific_alternatives_used: scientificCount,
				ingredient_details: ingredientResults,
				scientific_alternatives: scientificAlternatives,
				recipes_created: recipesToCreate.length,
				estimated_nutrition: {
					total_gramasi_g: parseFloat(totalGramasi.toFixed(2)),
					energi_kkal: parseFloat(totalEnergi.toFixed(2)),
					protein_g: parseFloat(totalProtein.toFixed(2)),
				},
				status:
					scientificCount > 0
						? `Menu dibuat dengan ${directMatchCount} bahan langsung + ${scientificCount} alternatif scientific`
						: `Menu dibuat dengan ${directMatchCount} bahan (100% match langsung)`,
				warning:
					finalNotFoundCount > 0
						? `${finalNotFoundCount} bahan tidak ditemukan alternatif scientific-nya.`
						: null,
			},
		};
		console.log(`\n🎉 Proses selesai! Menu "${newMenu.nama}" siap digunakan.`);
		return res.status(201).json(response);
	} catch (error) {
		console.error("Error saat suggestMenu:", error);
		return res
			.status(500)
			.json({ message: "Terjadi kesalahan", error: error.message });
	}
};

// =================================================================
// BAGIAN 4: createMenu (untuk Chef membuat resep baru)
// =================================================================
async function createMenu(req, res) {
	const { menuName, ingredients } = req.body;

	if (!menuName || !ingredients || ingredients.length === 0) {
		return res
			.status(400)
			.json({ message: "Nama menu dan bahan tidak boleh kosong." });
	}

	try {
		// Calculate total nutrition to determine kategori
		let totalNutrition = {
			energi_kkal: 0,
			protein_g: 0,
			lemak_g: 0,
			karbohidrat_g: 0,
			serat_g: 0,
			vitamin_c_mg: 0,
			kalsium_mg: 0,
		};

		for (const item of ingredients) {
			if (item.nutrisi) {
				const ratio = (item.gramasi || 100) / 100;
				totalNutrition.energi_kkal += (item.nutrisi.energi_kkal || 0) * ratio;
				totalNutrition.protein_g += (item.nutrisi.protein_g || 0) * ratio;
				totalNutrition.lemak_g += (item.nutrisi.lemak_g || 0) * ratio;
				totalNutrition.karbohidrat_g +=
					(item.nutrisi.karbohidrat_g || 0) * ratio;
				totalNutrition.serat_g += (item.nutrisi.serat_g || 0) * ratio;
				totalNutrition.vitamin_c_mg += (item.nutrisi.vitamin_c_mg || 0) * ratio;
				totalNutrition.kalsium_mg += (item.nutrisi.kalsium_mg || 0) * ratio;
			}
		}

		// Determine kategori based on dominant nutrient
		let kategori = "side_dish"; // Default
		const {
			karbohidrat_g,
			protein_g,
			vitamin_c_mg,
			serat_g,
			kalsium_mg,
			lemak_g,
		} = totalNutrition;

		if (
			kalsium_mg > karbohidrat_g &&
			kalsium_mg > protein_g &&
			kalsium_mg > vitamin_c_mg &&
			kalsium_mg > lemak_g
		) {
			kategori = "kalsium";
		} else if (
			lemak_g > karbohidrat_g &&
			lemak_g > protein_g &&
			lemak_g > vitamin_c_mg &&
			lemak_g > kalsium_mg
		) {
			kategori = "fat";
		} else if (
			karbohidrat_g > protein_g &&
			karbohidrat_g > vitamin_c_mg &&
			karbohidrat_g > lemak_g &&
			karbohidrat_g > kalsium_mg
		) {
			kategori = "karbo";
		} else if (
			protein_g > karbohidrat_g &&
			protein_g > vitamin_c_mg &&
			protein_g > lemak_g &&
			protein_g > kalsium_mg
		) {
			kategori = "protein";
		} else if (
			vitamin_c_mg > karbohidrat_g &&
			vitamin_c_mg > protein_g &&
			vitamin_c_mg > lemak_g &&
			vitamin_c_mg > kalsium_mg
		) {
			kategori = serat_g > vitamin_c_mg ? "serat" : "vitamin";
		}

		console.log(
			`🎯 Determined kategori: ${kategori} based on total nutrition:`,
			totalNutrition,
		);

		const result = await prisma.$transaction(async (tx) => {
			// 1. Create new menu
			const newMenu = await tx.menu.create({
				data: {
					nama: menuName.toLowerCase(),
					kategori: kategori,
				},
			});

			console.log(`✅ Menu baru dibuat:`, newMenu);

			const resepData = [];

			// 2. Process each ingredient
			for (const item of ingredients) {
				let bahanId;

				// Check if bahanId already exists
				if (item.bahanId) {
					console.log(
						`✅ Menggunakan bahan existing ID: ${item.bahanId} (${item.name})`,
					);
					bahanId = item.bahanId;
				} else if (item.status === "found") {
					// Fallback: Search by name
					const existingBahan = await tx.bahan.findFirst({
						where: { nama: item.name.toLowerCase() },
					});

					if (!existingBahan) {
						throw new Error(
							`Bahan "${item.name}" tidak ditemukan di database.`,
						);
					}

					bahanId = existingBahan.id;
					console.log(`✅ Found bahan via nama: ${item.name} (ID: ${bahanId})`);
				} else if (item.status === "generated" && item.nutrisi) {
					// New ingredient from AI - SAVE with COMPLETE NUTRITION DATA
					console.log(`🆕 Creating new ingredient from AI: ${item.name}`);

					const newBahan = await tx.bahan.create({
						data: {
							nama: item.name.toLowerCase(),
							isValidated: false,
							validatedBy: "AI",

							// Save ALL nutrition data from AI
							energi_kkal: item.nutrisi.energi_kkal || 0,
							protein_g: item.nutrisi.protein_g || 0,
							lemak_g: item.nutrisi.lemak_g || 0,
							karbohidrat_g: item.nutrisi.karbohidrat_g || 0,
							serat_g: item.nutrisi.serat_g || 0,
							abu_g: item.nutrisi.abu_g || 0,
							kalsium_mg: item.nutrisi.kalsium_mg || 0,
							fosfor_mg: item.nutrisi.fosfor_mg || 0,
							besi_mg: item.nutrisi.besi_mg || 0,
							natrium_mg: item.nutrisi.natrium_mg || 0,
							kalium_mg: item.nutrisi.kalium_mg || 0,
							tembaga_mg: item.nutrisi.tembaga_mg || 0,
							seng_mg: item.nutrisi.seng_mg || 0,
							retinol_mcg: item.nutrisi.retinol_mcg || 0,
							b_kar_mcg: item.nutrisi.b_kar_mcg || 0,
							karoten_total_mcg: item.nutrisi.karoten_total_mcg || 0,
							thiamin_mg: item.nutrisi.thiamin_mg || 0,
							riboflavin_mg: item.nutrisi.riboflavin_mg || 0,
							niasin_mg: item.nutrisi.niasin_mg || 0,
							vitamin_c_mg: item.nutrisi.vitamin_c_mg || 0,
						},
					});

					bahanId = newBahan.id;
					console.log(`✅ New ingredient created with ID: ${bahanId}`);
				} else {
					throw new Error(
						`Bahan "${item.name}" tidak valid atau tidak memiliki data nutrisi.`,
					);
				}

				// 3. Add to recipe
				if (bahanId) {
					resepData.push({
						menu_id: newMenu.id,
						bahan_id: bahanId,
						gramasi: parseFloat(item.gramasi) || 0,
					});
				}
			}

			// 4. Save all recipes at once
			await tx.resep.createMany({
				data: resepData,
			});

			return newMenu;
		});

		// 5. Return success
		res.status(201).json({
			success: true,
			message: `Menu "${result.nama}" berhasil disimpan!`,
			menu: result,
		});
	} catch (error) {
		console.error("❌ Error creating menu:", error);
		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
}

// =================================================================
// BAGIAN 5: getRecipeNutritionById (Get nutrisi per resep individual)
// =================================================================
async function getRecipeNutritionById(req, res) {
	try {
		const { recipeId } = req.params;

		console.log(`\n📊 Getting nutrition for recipe ID: ${recipeId}`);

		if (!recipeId) {
			return res.status(400).json({
				success: false,
				message: "Recipe ID required",
			});
		}

		const menu = await prisma.menu.findUnique({
			where: { id: parseInt(recipeId) },
			select: { id: true, nama: true, kategori: true },
		});

		if (!menu) {
			return res.status(404).json({
				success: false,
				message: "Resep tidak ditemukan",
			});
		}

		console.log(`✅ Found menu: ${menu.nama} (${menu.kategori})`);

		const recipes = await prisma.resep.findMany({
			where: { menu_id: parseInt(recipeId) },
			include: {
				bahan: true,
			},
		});

		if (recipes.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Resep ini tidak memiliki bahan",
			});
		}

		console.log(`📦 Found ${recipes.length} ingredients`);

		let totalGizi = {
			energi_kkal: 0,
			protein_g: 0,
			lemak_g: 0,
			karbohidrat_g: 0,
			serat_g: 0,
			abu_g: 0,
			kalsium_mg: 0,
			fosfor_mg: 0,
			besi_mg: 0,
			natrium_mg: 0,
			kalium_mg: 0,
			tembaga_mg: 0,
			seng_mg: 0,
			retinol_mcg: 0,
			b_kar_mcg: 0,
			karoten_total_mcg: 0,
			thiamin_mg: 0,
			riboflavin_mg: 0,
			niasin_mg: 0,
			vitamin_c_mg: 0,
		};

		let totalGramasi = 0;
		const detailBahan = [];
		const detailBahanForLp = {};

		recipes.forEach((resep) => {
			const { gramasi, bahan } = resep;
			if (!bahan) return;

			totalGramasi += gramasi;
			const ratio = gramasi / 100;
			const giziBahanIni = {};

			for (const key in totalGizi) {
				if (bahan[key] !== null && bahan[key] !== undefined) {
					const nilaiGiziBahan = (bahan[key] || 0) * ratio;
					totalGizi[key] += nilaiGiziBahan;
					giziBahanIni[key] = parseFloat(nilaiGiziBahan.toFixed(2));
				}
			}

			detailBahan.push({
				id: bahan.id,
				nama: bahan.nama,
				gramasi: gramasi,
				isValidated: bahan.isValidated,
				validatedBy: bahan.validatedBy,
				gizi: giziBahanIni,
			});

			detailBahanForLp[bahan.nama] = {
				gramasi: gramasi,
				...giziBahanIni,
			};

			console.log(
				`  - ${bahan.nama}: ${gramasi}g (${(bahan.energi_kkal * ratio).toFixed(
					1,
				)} kkal)`,
			);
		});

		for (const key in totalGizi) {
			totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));
		}

		console.log(`\n📊 Total: ${totalGramasi}g, ${totalGizi.energi_kkal} kkal`);

		const calculateAkg = (value, dailyValue) => {
			if (!dailyValue || !value) return "0%";
			const percentage = (value / dailyValue) * 100;
			if (percentage > 0 && percentage < 1) return "<1%";
			return `${Math.round(percentage)}%`;
		};

		const rekomendasi = getAllRecommendation(detailBahanForLp, totalGizi, 1);
		console.log("REKOMENDASI FROM RECIPE ", rekomendasi);
		const persenAkgAll = computeAkgAll(totalGizi);
		console.log(
			"[AKG KESELURUHAN] Hasil persentase AKG per kategori: ",
			persenAkgAll,
		);

		const response = {
			success: true,
			menu: {
				id: menu.id,
				nama: menu.nama,
				kategori: menu.kategori,
			},
			totalLabel: {
				takaran_saji_g: parseFloat(totalGramasi.toFixed(2)),
				informasi_nilai_gizi: {
					...totalGizi,
					energi_dari_lemak_kkal: parseFloat(
						(totalGizi.lemak_g * 9).toFixed(2),
					),
				},
				persen_akg: {
					lemak_g: calculateAkg(totalGizi.lemak_g, 67),
					protein_g: calculateAkg(totalGizi.protein_g, 60),
					karbohidrat_g: calculateAkg(totalGizi.karbohidrat_g, 300),
					natrium_mg: calculateAkg(totalGizi.natrium_mg, 1500),
					kalsium_mg: calculateAkg(totalGizi.kalsium_mg, 1200),
					besi_mg: calculateAkg(totalGizi.besi_mg, 18),
					vitamin_c_mg: calculateAkg(totalGizi.vitamin_c_mg, 90),
					kalium_mg: calculateAkg(totalGizi.kalium_mg, 3900),
					besi_mg: calculateAkg(totalGizi.kalium_mg, 8),
					serat_g: calculateAkg(totalGizi.kalium_mg, 28),
				},
				persen_akg_all: persenAkgAll,
			},
			detailPerhitungan: {
				jumlah_bahan: recipes.length,
				rincian_per_bahan: detailBahan,
			},
			rekomendasi: rekomendasi,
		};

		console.log(`✅ Nutrition calculation complete\n`);

		return res.status(200).json(response);
	} catch (error) {
		console.error("❌ Error getting recipe nutrition:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
}

// =================================================================
// BAGIAN 6: saveMenuComposition (Simpan komposisi menu baru)
// =================================================================
async function saveMenuComposition(req, res) {
	try {
		const { nama, komposisi } = req.body;

		console.log("📥 [Backend] Menerima komposisi baru:", { nama, komposisi });

		if (!nama || !nama.trim()) {
			return res.status(400).json({
				success: false,
				message: "Nama menu tidak boleh kosong",
			});
		}

		const validIds = Object.values(komposisi).filter(
			(id) => id !== null && id !== undefined && id !== 0,
		);

		if (validIds.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Minimal 1 resep harus dipilih",
			});
		}

		const result = await prisma.$transaction(async (tx) => {
			// 1. Create new composition menu
			const newMenu = await tx.menu.create({
				data: {
					nama: nama.toLowerCase().trim(),
					kategori: "komposisiChef",
				},
			});

			console.log("✅ Menu baru dibuat:", newMenu);

			// 2. Get all recipes from selected menus WITH source menu info
			const selectedMenuIds = validIds;
			const recipesToCopy = await tx.resep.findMany({
				where: {
					menu_id: { in: selectedMenuIds },
				},
				include: {
					menu: { select: { id: true, nama: true, kategori: true } }, // ✅ INCLUDE source menu
				},
			});

			console.log(
				`📋 Found ${recipesToCopy.length} recipes from ${selectedMenuIds.length} menus`,
			);

			// 3. ✅ PERBAIKAN: Copy recipes WITH metadata about source
			if (recipesToCopy.length > 0) {
				// Group by source menu to preserve structure
				const recipesBySource = {};

				recipesToCopy.forEach((recipe) => {
					const sourceMenuId = recipe.menu_id;
					const sourceMenuName = recipe.menu.nama;
					const sourceMenuKategori = recipe.menu.kategori;

					if (!recipesBySource[sourceMenuId]) {
						recipesBySource[sourceMenuId] = {
							source_id: sourceMenuId,
							source_name: sourceMenuName,
							source_kategori: sourceMenuKategori,
							recipes: [],
						};
					}

					recipesBySource[sourceMenuId].recipes.push({
						bahan_id: recipe.bahan_id,
						gramasi: recipe.gramasi,
					});
				});

				// Create metadata tracking (simple approach: create comment or use existing structure)
				for (const sourceId in recipesBySource) {
					const sourceData = recipesBySource[sourceId];

					console.log(
						`  📦 Copying ${sourceData.recipes.length} recipes from "${sourceData.source_name}" (${sourceData.source_kategori})`,
					);

					// Copy recipes (they will reference the composition menu, but we track source in query)
					await tx.resep.createMany({
						data: sourceData.recipes.map((recipe) => ({
							menu_id: newMenu.id,
							bahan_id: recipe.bahan_id,
							gramasi: recipe.gramasi,
						})),
					});
				}

				console.log(
					`✅ Total ${recipesToCopy.length} recipes copied to new menu`,
				);
			}

			return { newMenu, selectedMenuIds };
		});

		console.log(
			"✅ [Backend] Menu komposisi berhasil disimpan:",
			result.newMenu,
		);

		return res.status(201).json({
			success: true,
			message: "Menu komposisi berhasil disimpan",
			id: result.newMenu.id,
			nama: result.newMenu.nama,
			source_menus: result.selectedMenuIds, // ✅ Return source IDs
		});
	} catch (error) {
		console.error("❌ [Backend] Error saving composition:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
}

// =================================================================
// BAGIAN 7: getMenuNutritionById (Get nutrisi menu dengan rekomendasi)
// =================================================================
async function getMenuNutritionById(req, res) {
	try {
		const { id } = req.params;
		const { target } = req.query;

		console.log(
			`\n📊 Getting nutrition for menu ID: ${id}, target: ${
				target || "default"
			}`,
		);

		if (!id) {
			return res.status(400).json({
				success: false,
				message: "Menu ID required",
			});
		}

		// 1. Get menu data
		const menu = await prisma.menu.findUnique({
			where: { id: parseInt(id) },
			select: { id: true, nama: true, kategori: true },
		});

		if (!menu) {
			return res.status(404).json({
				success: false,
				message: "Menu tidak ditemukan",
			});
		}

		console.log(`✅ Found menu: ${menu.nama} (${menu.kategori})`);

		// 2. Get all recipes
		const recipes = await prisma.resep.findMany({
			where: { menu_id: parseInt(id) },
			include: {
				bahan: true,
			},
		});

		if (recipes.length === 0) {
			return res.status(404).json({
				success: false,
				message: "Menu ini tidak memiliki resep",
			});
		}

		// ✅ 3. DETEKSI SOURCE MENUS (UNTUK KOMPOSISI CHEF)
		let sourceMenusMap = {}; // Map bahan_id ke source menu

		if (menu.kategori === "komposisiChef") {
			console.log("🔍 Detecting source menus for composition...");

			// Get ingredient IDs dari komposisi ini
			const compositionBahanIds = recipes.map((r) => r.bahan_id);

			// Cari menu lain yang punya ingredient yang sama
			const otherMenuRecipes = await prisma.resep.findMany({
				where: {
					bahan_id: { in: compositionBahanIds },
					menu_id: { not: parseInt(id) }, // Exclude komposisi itu sendiri
				},
				include: {
					menu: {
						select: { id: true, nama: true, kategori: true },
					},
				},
			});

			// Group by menu untuk deteksi complete match
			const menuIngredients = {};
			otherMenuRecipes.forEach((recipe) => {
				const menuId = recipe.menu_id;
				if (!menuIngredients[menuId]) {
					menuIngredients[menuId] = {
						menu: recipe.menu,
						ingredients: new Set(),
					};
				}
				menuIngredients[menuId].ingredients.add(recipe.bahan_id);
			});

			// ✅ MAPPING: Untuk setiap bahan di komposisi, cari source menu yang lengkap
			recipes.forEach((recipe) => {
				const bahanId = recipe.bahan_id;

				// Cari menu yang:
				// 1. Punya bahan ini
				// 2. Semua bahannya ada di komposisi (complete match)
				for (const [menuId, data] of Object.entries(menuIngredients)) {
					if (data.ingredients.has(bahanId)) {
						// Check apakah semua ingredient dari menu ini ada di komposisi
						const allIngredientsInComposition = Array.from(
							data.ingredients,
						).every((ingId) => compositionBahanIds.includes(ingId));

						if (allIngredientsInComposition) {
							sourceMenusMap[bahanId] = {
								menu_id: parseInt(menuId),
								nama: data.menu.nama,
								kategori: data.menu.kategori,
							};
							break; // Found source, stop searching
						}
					}
				}
			});

			console.log(
				`✅ Detected ${
					Object.keys(
						recipes.reduce((acc, r) => {
							if (sourceMenusMap[r.bahan_id]) {
								acc[sourceMenusMap[r.bahan_id].menu_id] = true;
							}
							return acc;
						}, {}),
					).length
				} source menus`,
			);
		}

		// 4. Calculate nutrition dengan tracking per source menu
		let totalGizi = {
			energi_kkal: 0,
			protein_g: 0,
			lemak_g: 0,
			karbohidrat_g: 0,
			serat_g: 0,
			abu_g: 0,
			kalsium_mg: 0,
			fosfor_mg: 0,
			besi_mg: 0,
			natrium_mg: 0,
			kalium_mg: 0,
			tembaga_mg: 0,
			seng_mg: 0,
			retinol_mcg: 0,
			b_kar_mcg: 0,
			karoten_total_mcg: 0,
			thiamin_mg: 0,
			riboflavin_mg: 0,
			niasin_mg: 0,
			vitamin_c_mg: 0,
		};

		let totalGramasi = 0;
		const detailBahan = [];
		const nutrisiPerSourceMenu = {}; // For recommendation
		const groupedBySourceMenu = {}; // For DetailResultCard
		const individualRecipes = {}; // ✅ For NutritionPerRecipeCard

		recipes.forEach((resep) => {
			const { gramasi, bahan } = resep;
			if (!bahan) return;

			totalGramasi += gramasi;
			const ratio = gramasi / 100;
			const giziBahanIni = {};

			// ✅ DETERMINE SOURCE MENU
			let sourceMenuId, sourceMenuName, sourceMenuKategori;

			if (menu.kategori === "komposisiChef" && sourceMenusMap[bahan.id]) {
				// Untuk komposisi, gunakan detected source
				sourceMenuId = sourceMenusMap[bahan.id].menu_id;
				sourceMenuName = sourceMenusMap[bahan.id].nama;
				sourceMenuKategori = sourceMenusMap[bahan.id].kategori;
			} else {
				// Untuk menu biasa, menu itu sendiri adalah source
				sourceMenuId = menu.id;
				sourceMenuName = menu.nama;
				sourceMenuKategori = menu.kategori;
			}

			// ✅ Initialize tracking per source menu
			if (!individualRecipes[sourceMenuId]) {
				individualRecipes[sourceMenuId] = {
					menu_id: sourceMenuId,
					nama_menu: sourceMenuName,
					kategori: sourceMenuKategori,
					total_gramasi: 0,
					nutrisi: { ...totalGizi },
					rincian_bahan: [], // ✅ TAMBAH untuk DetailResultCard
				};
			}

			if (!nutrisiPerSourceMenu[sourceMenuName]) {
				nutrisiPerSourceMenu[sourceMenuName] = { ...totalGizi };
			}

			if (!groupedBySourceMenu[sourceMenuName]) {
				groupedBySourceMenu[sourceMenuName] = {
					nama_menu: sourceMenuName,
					kategori: sourceMenuKategori,
					rincian_bahan: [],
					total_gramasi: 0,
				};
			}

			// Calculate nutrition
			for (const key in totalGizi) {
				if (bahan[key] !== null && bahan[key] !== undefined) {
					const nilaiGiziBahan = (bahan[key] || 0) * ratio;
					totalGizi[key] += nilaiGiziBahan;
					giziBahanIni[key] = parseFloat(nilaiGiziBahan.toFixed(2));

					individualRecipes[sourceMenuId].nutrisi[key] += nilaiGiziBahan;
					nutrisiPerSourceMenu[sourceMenuName][key] += nilaiGiziBahan;
				}
			}

			individualRecipes[sourceMenuId].total_gramasi += gramasi;

			const bahanDetail = {
				nama: bahan.nama,
				gramasi: gramasi,
				isValidated: bahan.isValidated,
				validatedBy: bahan.validatedBy,
				gizi: giziBahanIni,
			};

			detailBahan.push(bahanDetail);
			individualRecipes[sourceMenuId].rincian_bahan.push(bahanDetail);
			groupedBySourceMenu[sourceMenuName].rincian_bahan.push(bahanDetail);
			groupedBySourceMenu[sourceMenuName].total_gramasi += gramasi;
		});

		// Round all values
		for (const key in totalGizi) {
			totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));
		}

		for (const menuName in nutrisiPerSourceMenu) {
			for (const key in nutrisiPerSourceMenu[menuName]) {
				nutrisiPerSourceMenu[menuName][key] = parseFloat(
					nutrisiPerSourceMenu[menuName][key].toFixed(2),
				);
			}
		}

		for (const menuId in individualRecipes) {
			for (const key in individualRecipes[menuId].nutrisi) {
				individualRecipes[menuId].nutrisi[key] = parseFloat(
					individualRecipes[menuId].nutrisi[key].toFixed(2),
				);
			}
		}

		console.log(`\n📊 Total: ${totalGramasi}g, ${totalGizi.energi_kkal} kkal`);
		console.log(
			`📋 Unique source menus: ${Object.keys(individualRecipes).length}`,
		);

		const calculateAkg = (value, dailyValue) => {
			if (!dailyValue || !value) return "0%";
			const percentage = (value / dailyValue) * 100;
			if (percentage > 0 && percentage < 1) return "<1%";
			return `${Math.round(percentage)}%`;
		};

		const getCategoryLabel = (kategori) => {
			const labels = {
				karbohidrat: "Karbohidrat",
				proteinHewani: "Protein Hewani",
				sayur: "Sayur",
				proteinTambahan: "Protein Tambahan",
				buah: "Buah",
				komposisiChef: "Komposisi Chef",
			};
			return labels[kategori] || kategori;
		};

		// Get recommendation
		const targetValue = target ? parseInt(target) : 1;
		const rekomendasi = getRecommendation(
			nutrisiPerSourceMenu,
			totalGizi,
			1,
			targetValue,
		);

		const getClassName = (kelas) => {
			const map = {
				1: "TK A",
				2: "TK B",
				3: "SD Kelas 1",
				4: "SD Kelas 2",
				5: "SD Kelas 3",
				6: "SD Kelas 4",
				7: "SD Kelas 5",
				8: "SD Kelas 6",
				9: "SMP Kelas 1",
				10: "SMP Kelas 2",
				11: "SMP Kelas 3",
				12: "SMA Kelas 1",
				13: "SMA Kelas 2",
				14: "SMA Kelas 3",
			};
			return map[kelas] || `Kelas ${kelas}`;
		};

		const formattedRekomendasi = {
			combinedKekurangan:
				rekomendasi.kekurangan?.map((item) => ({
					kelas: getClassName(targetValue),
					menu: item.menu,
					kurang: item.kurang,
				})) || [],
			combinedSaran:
				rekomendasi.saran?.map((item) => ({
					kelas: getClassName(targetValue),
					nama: item.nama,
					serving: item.serving,
				})) || [],
		};

		// ✅ FORMAT detailPerResep untuk NutritionPerRecipeCard
		const detailPerResep = Object.values(individualRecipes).map((recipe) => ({
			menu_id: recipe.menu_id,
			menu_nama: recipe.nama_menu,
			nama_menu: recipe.nama_menu,
			kategori: recipe.kategori,
			kategori_label: getCategoryLabel(recipe.kategori),
			gramasi: recipe.total_gramasi,
			nutrisi: recipe.nutrisi,
			rincian_bahan: recipe.rincian_bahan, // ✅ UNTUK DetailResultCard
		}));

		// ✅ FORMAT detailPerResepGrouped untuk DetailResultCard
		const detailPerResepGrouped = Object.values(groupedBySourceMenu).map(
			(group) => ({
				nama_menu: group.nama_menu,
				kategori: group.kategori,
				kategori_label: getCategoryLabel(group.kategori),
				total_gramasi: group.total_gramasi,
				rincian_bahan: group.rincian_bahan,
			}),
		);

		const response = {
			success: true,
			menu: {
				id: menu.id,
				nama: menu.nama,
				kategori: menu.kategori,
			},
			totalLabel: {
				takaran_saji_g: parseFloat(totalGramasi.toFixed(2)),
				informasi_nilai_gizi: {
					...totalGizi,
					energi_dari_lemak_kkal: parseFloat(
						(totalGizi.lemak_g * 9).toFixed(2),
					),
				},
				persen_akg: {
					lemak_g: calculateAkg(totalGizi.lemak_g, 67),
					protein_g: calculateAkg(totalGizi.protein_g, 60),
					karbohidrat_g: calculateAkg(totalGizi.karbohidrat_g, 300),
					natrium_mg: calculateAkg(totalGizi.natrium_mg, 1500),
					kalsium_mg: calculateAkg(totalGizi.kalsium_mg, 1200),
					besi_mg: calculateAkg(totalGizi.besi_mg, 18),
					vitamin_c_mg: calculateAkg(totalGizi.vitamin_c_mg, 90),
					kalium_mg: calculateAkg(totalGizi.kalium_mg, 3900),
					besi_mg: calculateAkg(totalGizi.kalium_mg, 8),
					serat_g: calculateAkg(totalGizi.kalium_mg, 28),
				},
			},
			detailPerhitungan: {
				jumlah_bahan: recipes.length,
				rincian_per_bahan: detailBahan,
				rincian_per_bahan_grouped: detailPerResepGrouped,
				log: [
					`Menu: ${menu.nama}`,
					`Kategori: ${menu.kategori}`,
					`Target: ${getClassName(targetValue)}`,
					`Total bahan: ${recipes.length}`,
					`Resep sumber: ${Object.keys(individualRecipes).length}`,
				],
			},
			rekomendasi: formattedRekomendasi,
			detailPerResep: detailPerResep, // ✅ Individual recipes
		};

		console.log(`✅ Nutrition calculation complete\n`);

		return res.status(200).json(response);
	} catch (error) {
		console.error("❌ Error getting menu nutrition:", error);
		return res.status(500).json({
			success: false,
			message: "Server error",
			error: error.message,
		});
	}
}
// =================================================================
// EXPORTS
// =================================================================
module.exports = {
	getMenus,
	generateNutrition,
	suggestMenu,
	searchMenus,
	createMenu,
	getRecipeNutritionById,
	saveMenuComposition,
	getMenuNutritionById,
};
