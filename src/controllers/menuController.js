const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getAiSuggestion } = require("../services/aiService"); // Impor untuk fitur AI
const { getRecommendation } = require("./recommendationSystemController");
// =================================================================
// BAGIAN 1: FUNGSI getMenus (dari kode Anda yang sudah benar)
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
// BAGIAN 2: FUNGSI generateNutrition (dari kode Anda yang sudah benar)
// =================================================================
const generateNutrition = async (req, res) => {
	try {
		const { karbo_id, lauk_id, sayur_id, side_dish_id, buah_id } = req.body;
		const selectedIds = [karbo_id, lauk_id, sayur_id, side_dish_id, buah_id]
			.filter((id) => id)
			.map((id) => parseInt(id));

		console.log(`\n--- MEMULAI KALKULASI GIZI ---`);
		console.log(`[DETEKTOR 1] Menerima ID Menu:`, selectedIds);

		if (selectedIds.length === 0)
			return res.status(400).json({ message: "Tidak ada menu yang dipilih." });

		const recipes = await prisma.resep.findMany({
			where: { menu_id: { in: selectedIds } },
			include: {
				bahan: true,
				menu: {
					select: {
						nama: true,
					},
				},
			},
		});
		console.log(recipes);
		console.log(
			`[DETEKTOR 2] Menemukan ${recipes.length} bahan resep di database.`,
		);
		if (recipes.length === 0) {
			console.error(
				"KESALAHAN: Tidak ada resep yang cocok dengan ID di atas. Ini penyebab hasilnya nol. Periksa proses seeding Anda.",
			);
		} else {
			console.log(`[DETEKTOR 2.1] Contoh resep pertama:`, recipes[0]);
		}

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
		kumpulanResep = {};
		recipes.forEach((resep) => {
			const { gramasi, bahan } = resep;
			if (!bahan) return;
			totalGramasi += gramasi;
			const ratio = gramasi / 100;
			for (const key in totalGizi) {
				if (bahan[key] !== null && bahan[key] !== undefined) {
					totalGizi[key] += (bahan[key] || 0) * ratio;
				}
			}
			kumpulanResep[resep.nama] = { gramasi, bahan };
		});

		console.log(`[DETEKTOR 3] Total gramasi: ${totalGramasi}`);
		console.log(
			`[DETEKTOR 3.1] Total energi (sebelum dibulatkan): ${totalGizi.energi_kkal} kkal`,
		);

		for (const key in totalGizi)
			totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));

		const calculateAkg = (value, dailyValue) => {
			if (!dailyValue || !value) return "0%";
			const percentage = (value / dailyValue) * 100;
			if (percentage > 0 && percentage < 1) return "<1%";
			return `${Math.round(percentage)}%`;
		};

		const rekomendasi = getRecommendation(recipes, totalGizi);
		// nanti di verify gizi dulu, apakah udah cukup
		// kasih suggestion pake getMacroRecommendation
		// passing menunya ke sini juga

		const response = {
			takaran_saji_g: parseFloat(totalGramasi.toFixed(2)),
			informasi_nilai_gizi: {
				...totalGizi,
				energi_dari_lemak_kkal: parseFloat((totalGizi.lemak_g * 9).toFixed(2)),
			},
			persen_akg: {
				lemak_total: calculateAkg(totalGizi.lemak_g, 67),
				protein: calculateAkg(totalGizi.protein_g, 60),
				karbohidrat_total: calculateAkg(totalGizi.karbohidrat_g, 300),
				natrium: calculateAkg(totalGizi.natrium_mg, 1500),
				kalsium: calculateAkg(totalGizi.kalsium_mg, 1200),
				besi: calculateAkg(totalGizi.besi_mg, 18),
				vitamin_c: calculateAkg(totalGizi.vitamin_c_mg, 90),
			},
			rekomendasi: {...rekomendasi}
		};

		console.log(`--- KALKULASI GIZI SELESAI ---\n`);
		return res.status(200).json(response);
	} catch (error) {
		console.error("Error saat generate nutrisi:", error);
		return res.status(500).json({ message: "Server error" });
	}
};
// =================================================================
// BAGIAN 3: FUNGSI suggestMenu (Fitur AI yang baru)
// =================================================================
const suggestMenu = async (req, res) => {
	const { new_menu_name } = req.body;
	if (!new_menu_name) {
		return res
			.status(400)
			.json({ message: "Nama menu baru tidak boleh kosong." });
	}

	try {
		const allMenus = await prisma.menu.findMany({ select: { nama: true } });
		const existingMenuNames = allMenus.map((menu) => menu.nama);

		console.log(`Meminta saran AI untuk: "${new_menu_name}"...`);
		const suggestion = await getAiSuggestion(new_menu_name, existingMenuNames);
		console.log(" Hasil mentah AI suggestion:", suggestion);

		if (
			!suggestion ||
			!suggestion.suggested_category ||
			(suggestion.reference_type === "similar_menu_fallback" &&
				!suggestion.reference_menu_name)
		) {
			return res.status(500).json({
				message:
					"Respons AI tidak lengkap. Coba lagi atau periksa format JSON.",
			});
		}

		const { suggested_category, reference_menu_name, reference_type } =
			suggestion;

		let similarMenu = null;

		// kalau AI pakai fallback (mirip menu lama)
		if (reference_type === "similar_menu_fallback" && reference_menu_name) {
			similarMenu = await prisma.menu.findUnique({
				where: { nama: reference_menu_name },
			});

			if (!similarMenu) {
				return res.status(500).json({
					message: `AI menyarankan menu mirip "${reference_menu_name}", tapi tidak ditemukan.`,
				});
			}
		}

		// Buat menu baru di database
		const newMenu = await prisma.menu.create({
			data: {
				nama: new_menu_name.toLowerCase(),
				kategori: suggested_category,
			},
		});

		// Kalau pakai fallback, copy resep dari menu mirip
		if (similarMenu) {
			const recipeToCopy = await prisma.resep.findMany({
				where: { menu_id: similarMenu.id },
			});

			for (const resep of recipeToCopy) {
				await prisma.resep.create({
					data: {
						menu_id: newMenu.id,
						bahan_id: resep.bahan_id,
						gramasi: resep.gramasi,
					},
				});
			}
		}

		console.log(
			`Sukses! Menu "${newMenu.nama}" dibuat berdasarkan bahan mirip (atau fallback "${similarMenu?.nama || "tidak ada"}").`,
		);

		return res.status(201).json(newMenu);
	} catch (error) {
		if (error.code === "P2002") {
			return res
				.status(409)
				.json({ message: `Menu "${new_menu_name}" sudah ada.` });
		}
		console.error("Error di suggestMenu:", error);
		return res
			.status(500)
			.json({ message: error.message || "Terjadi kesalahan pada server." });
	}
};

// Ekspor semua fungsi yang dibutuhkan
module.exports = {
	getMenus,
	generateNutrition,
	suggestMenu,
};
