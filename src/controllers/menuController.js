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
// Di menuController.js, fungsi searchMenus
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
      take: 20, // ✅ Naikkan limit untuk debug
    });

    // ✅ TAMBAHKAN LOG INI
    console.log(`🔍 Search query: "${query}"`);
    console.log(`📊 Total results:`, menus.length);
    console.log(
      `📋 All menus:`,
      menus.map((m) => ({ id: m.id, nama: m.nama, kategori: m.kategori }))
    );

    res.status(200).json(menus);
  } catch (error) {
    console.error("❌ Search error:", error);
    res.status(500).json({ message: "Gagal mencari menu" });
  }
};
// =================================================================
// FUNGSI getMenus LAMA
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
      { karbo: [], lauk: [], sayur: [], side_dish: [], buah: [] }
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
    const { karbo_id, lauk_id, sayur_id, side_dish_id, buah_id, target } =
      req.body;

    const selectedIds = [karbo_id, lauk_id, sayur_id, side_dish_id, buah_id]
      .filter((id) => id !== null && id !== undefined)
      .map((id) => parseInt(id));

    console.log(`\n--- MEMULAI KALKULASI GIZI ---`);
    console.log(`[DETEKTOR 1] Menerima ID Menu:`, selectedIds);

    if (selectedIds.length === 0)
      return res.status(400).json({ message: "Tidak ada menu yang dipilih." });

    const selectedMenus = await prisma.menu.findMany({
      where: { id: { in: selectedIds } },
      select: { id: true, nama: true, kategori: true },
    });

    const recipes = await prisma.resep.findMany({
      where: { menu_id: { in: selectedIds } },
      include: {
        bahan: true,
        menu: { select: { nama: true, kategori: true } },
      },
    });

    console.log(
      `[DETEKTOR 2] Menemukan ${recipes.length} bahan resep di database.`
    );

    const menuAnalysis = [];
    for (const menu of selectedMenus) {
      const menuRecipes = recipes.filter((r) => r.menu_id === menu.id);
      const availableIngredients = menuRecipes.map((r) => ({
        nama: r.bahan.nama,
        gramasi: r.gramasi,
      }));

      menuAnalysis.push({
        menu_nama: menu.nama,
        kategori: menu.kategori,
        jumlah_bahan_tersedia: menuRecipes.length,
        bahan_tersedia: availableIngredients,
      });

      console.log(`\n[TRANSPARANSI] Menu: "${menu.nama}" (${menu.kategori})`);
      console.log(`  └─ Bahan tersedia di DB: ${menuRecipes.length} item`);
      if (menuRecipes.length === 0) {
        console.log(`      PERINGATAN: Menu ini tidak memiliki resep!`);
      } else {
        availableIngredients.forEach((b, idx) => {
          console.log(`     ${idx + 1}. ${b.nama} (${b.gramasi}g)`);
        });
      }
    }

    if (recipes.length === 0) {
      console.error("\n KESALAHAN KRITIS: Tidak ada resep yang ditemukan!");
      return res.status(404).json({
        message: "Tidak ada resep yang ditemukan untuk menu yang dipilih.",
        detail: "Pastikan menu sudah memiliki resep di database.",
        menu_dipilih: selectedMenus.map((m) => m.nama),
      });
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
    const detailBahan = [];
    const nutrisiPerResep = {};

    recipes.forEach((resep) => {
      const { gramasi, bahan, menu } = resep;
      if (!bahan) return;

      totalGramasi += gramasi;
      const ratio = gramasi / 100;
      const giziBahanIni = {};

      if (!nutrisiPerResep[menu.nama]) {
        nutrisiPerResep[menu.nama] = {};
      }

      for (const key in totalGizi) {
        if (bahan[key] !== null && bahan[key] !== undefined) {
          const nilaiGiziBahan = (bahan[key] || 0) * ratio;
          totalGizi[key] += nilaiGiziBahan;
          giziBahanIni[key] = parseFloat(nilaiGiziBahan.toFixed(2));

          if (!nutrisiPerResep[menu.nama][key]) {
            nutrisiPerResep[menu.nama][key] = 0;
          }
          nutrisiPerResep[menu.nama][key] += nilaiGiziBahan;
        }
      }

      detailBahan.push({
        nama: bahan.nama,
        gramasi: gramasi,
        gizi: giziBahanIni,
      });
    });

    console.log(`\n[DETEKTOR 3] Total gramasi: ${totalGramasi}g`);
    console.log(
      `[DETEKTOR 3.1] Total energi: ${totalGizi.energi_kkal.toFixed(2)} kkal`
    );

    for (const key in totalGizi)
      totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));

    const calculateAkg = (value, dailyValue) => {
      if (!dailyValue || !value) return "0%";
      const percentage = (value / dailyValue) * 100;
      if (percentage > 0 && percentage < 1) return "<1%";
      return `${Math.round(percentage)}%`;
    };

    console.log("\n[REKOMENDASI] Memanggil sistem rekomendasi...");
    console.log(
      "[REKOMENDASI] nutrisiPerResep keys:",
      Object.keys(nutrisiPerResep)
    );
    console.log("[REKOMENDASI] totalGizi:", totalGizi);

    const rekomendasi = getAllRecommendation(nutrisiPerResep, totalGizi, 1);

    console.log(
      "[REKOMENDASI] Result combinedSaran:",
      rekomendasi.combinedSaran?.length || 0
    );
    console.log(
      "[REKOMENDASI] Result combinedKekurangan:",
      rekomendasi.combinedKekurangan?.length || 0
    );
    console.log(
      "[REKOMENDASI] Full result:",
      JSON.stringify(rekomendasi, null, 2)
    );

    // ======================================
    // 👇 BAGIAN YANG DIUBAH UNTUK FRONTEND
    // ======================================

    const { combinedKekurangan = [], combinedSaran = [] } = rekomendasi || {};

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
        9: "SMP Kelas 7",
        10: "SMP Kelas 8",
        11: "SMP Kelas 9",
        12: "SMA Kelas 10",
        13: "SMA Kelas 11",
        14: "SMA Kelas 12",
      };
      return map[kelas] || `Kelas ${kelas}`;
    };

    const analisisKekurangan = combinedKekurangan.map((item) => ({
      kelas: getClassName(item.kelas),
      menu: item.menu,
      kekurangan: item.kurang,
    }));

    const saranPenambahan = combinedSaran.map((item) => ({
      kelas: getClassName(item.kelas),
      menu: item.nama,
      jumlah_porsi: `+ ${item.serving.toFixed(1)} porsi`,
    }));

    // ======================================
    // 💬 RESPONSE KE FRONTEND
    // ======================================

    // Di menuController.js, GANTI bagian response (line ~420) dengan:

    const response = {
      totalLabel: {
        takaran_saji_g: parseFloat(totalGramasi.toFixed(2)),
        informasi_nilai_gizi: {
          ...totalGizi,
          energi_dari_lemak_kkal: parseFloat(
            (totalGizi.lemak_g * 9).toFixed(2)
          ),
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
      },
      detailPerhitungan: {
        log: [
          `Total ${selectedMenus.length} menu dihitung.`,
          `Total ${recipes.length} bahan resep ditemukan.`,
          `Total gramasi akhir: ${totalGramasi.toFixed(0)}g`,
        ],
        rincian_per_bahan: detailBahan,
        rincian_per_menu: menuAnalysis,
      },
      rekomendasi: rekomendasi, // ← INI PENTING! Direct pass dari getAllRecommendation
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
    console.log(`\n Meminta saran AI untuk: "${new_menu_name}"...`);
    const allMenus = await prisma.menu.findMany({ select: { nama: true } });
    const existingMenuNames = allMenus.map((menu) => menu.nama);
    const allBahanInDb = await prisma.bahan.findMany({
      select: { id: true, nama: true },
    });
    const bahanNameList = allBahanInDb.map((b) => b.nama);
    console.log(` Database memiliki ${bahanNameList.length} bahan tersedia`);

    // Panggil AI (seperti sebelumnya)
    const suggestion = await getAiSuggestion(new_menu_name, existingMenuNames);
    console.log(" Hasil AI suggestion:", JSON.stringify(suggestion, null, 2));

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

    // --- TAMBAHKAN SET UNTUK MELACAK ID BAHAN YANG SUDAH DIPROSES ---
    const processedBahanIds = new Set();

    for (const ingredient of suggested_ingredients) {
      if (!ingredient.nama || typeof ingredient.gramasi === "undefined") {
        // Cek gramasi juga
        console.log(`    Format ingredient tidak valid:`, ingredient);
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
          `     "${ingredient.nama}" → DITEMUKAN: "${
            searchResult.bahan.nama
          }" (${searchResult.matchType}, ${searchResult.confidence * 100}%)`
        );
      } else {
        console.log(
          `     "${ingredient.nama}" → TIDAK DITEMUKAN di database, perlu alternatif.`
        );
        missingIngredients.push({
          nama: ingredient.nama,
          gramasi: gramasiToUse,
        });
        statusLog = { status: "pending_alternative" }; // Tandai sebagai menunggu
      }

      // Catat hasil pencarian awal (termasuk yang pending)
      ingredientResults.push({
        nama_dicari: ingredient.nama,
        gramasi_saran: gramasiToUse,
        bahan_id: bahanIdToUse,
        ...statusLog,
      });

      // --- PENGECEKAN DUPLIKASI SEBELUM MENAMBAH KE recipesToCreate ---
      if (bahanIdToUse !== null) {
        if (!processedBahanIds.has(bahanIdToUse)) {
          recipesToCreate.push({
            bahan_id: bahanIdToUse,
            gramasi: gramasiToUse,
          });
          processedBahanIds.add(bahanIdToUse); // Tandai ID ini sudah dipakai
        } else {
          console.log(
            `     -> DUPLIKAT Terdeteksi untuk bahan ID ${bahanIdToUse} ("${searchResult.bahan.nama}"), dilewati.`
          );
          // Opsional: Anda bisa menjumlahkan gramasi jika mau
          // const existingRecipe = recipesToCreate.find(r => r.bahan_id === bahanIdToUse);
          // if (existingRecipe) existingRecipe.gramasi += gramasiToUse;
        }
      }
    }

    console.log(
      `\n Ringkasan Pencarian Awal: Ditemukan langsung ${processedBahanIds.size}/${suggested_ingredients.length}, Perlu alternatif: ${missingIngredients.length}`
    );

    // Proses bahan yang hilang
    if (missingIngredients.length > 0) {
      console.log(
        `\n Mencari alternatif / data nutrisi untuk ${missingIngredients.length} bahan...`
      );
      for (const missing of missingIngredients) {
        console.log(`\n    Analisis: "${missing.nama}"`);
        let foundViaAlternative = false;

        const logEntry = ingredientResults.find(
          (entry) =>
            entry.nama_dicari === missing.nama &&
            entry.status === "pending_alternative"
        );

        const altResult = await findIngredientAlternative(
          missing.nama,
          bahanNameList
        );

        if (altResult.alternative_found && altResult.alternative_name) {
          const altBahan = await prisma.bahan.findFirst({
            where: { nama: altResult.alternative_name },
          });
          if (altBahan) {
            console.log(
              `      ALTERNATIF DITEMUKAN: "${altBahan.nama}" (Scientific)`
            );
            console.log(`        └─ Alasan: ${altResult.scientific_reason}`);
            console.log(
              `        └─ Confidence: ${(
                altResult.similarity_score * 100
              ).toFixed(0)}%`
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
                `     -> DUPLIKAT (via Alternatif) Terdeteksi untuk bahan ID ${altBahan.id} ("${altBahan.nama}"), dilewati.`
              );
            }
            foundViaAlternative = true;
          } else {
            console.log(
              `      Alternatif "${altResult.alternative_name}" (disarankan AI) tidak ditemukan di DB`
            );
          }
        } else {
          console.log(
            `      Tidak ada alternatif scientific untuk "${missing.nama}"`
          );
          console.log(`        └─ ${altResult.scientific_reason}`);
        }

        if (!foundViaAlternative) {
          console.log(
            `      -> Mencoba generate nutrisi via AI untuk "${missing.nama}"...`
          );
          const generatedNutrition = await getIngredientNutrition(missing.nama);

          if (generatedNutrition) {
            const newOrUpdatedBahan = await prisma.bahan.upsert({
              where: { nama: generatedNutrition.nama.toLowerCase() },
              update: generatedNutrition,
              create: generatedNutrition,
            });
            console.log(
              `      -> Data nutrisi AI untuk "${newOrUpdatedBahan.nama}" disimpan/diupdate di DB (ID: ${newOrUpdatedBahan.id}).`
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
                `     -> DUPLIKAT (via AI Generate) Terdeteksi untuk bahan ID ${newOrUpdatedBahan.id} ("${newOrUpdatedBahan.nama}"), dilewati.`
              );
            }
          } else {
            console.log(
              `      -> AI juga GAGAL mendapatkan data nutrisi untuk "${missing.nama}". Bahan ini tidak akan dimasukkan.`
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
      (r) => r.status === "found" || r.status === "scientific_alternative"
    ).length;
    const finalNotFoundCount = ingredientResults.filter(
      (r) => r.status === "not_found" || r.status === "pending_alternative"
    ).length;
    const scientificCount = ingredientResults.filter(
      (r) => r.status === "scientific_alternative"
    ).length;
    const directMatchCount = finalFoundCount - scientificCount;
    console.log(
      `\n Ringkasan Akhir: Total bahan valid: ${finalFoundCount}/${suggested_ingredients.length} (Direct: ${directMatchCount}, Scientific: ${scientificCount}), Gagal: ${finalNotFoundCount}`
    );

    // Buat Menu Baru
    const newMenu = await prisma.menu.create({
      data: { nama: new_menu_name.toLowerCase(), kategori: suggested_category },
    });
    console.log(
      `\n Menu "${newMenu.nama}" berhasil dibuat di kategori "${suggested_category}"`
    );
    console.log(
      `\n Membuat ${recipesToCreate.length} resep unik untuk menu "${newMenu.nama}"...`
    );

    // Buat Resep Unik
    for (const recipe of recipesToCreate) {
      await prisma.resep.create({
        data: {
          menu_id: newMenu.id,
          bahan_id: recipe.bahan_id,
          gramasi: recipe.gramasi,
        },
      });
    }
    console.log(`  Berhasil membuat ${recipesToCreate.length} resep unik.`);

    // Estimasi Nutrisi
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
      `\n Estimasi Nutrisi Menu Baru: Gramasi: ${totalGramasi.toFixed(
        0
      )}g, Energi: ${totalEnergi.toFixed(
        1
      )} kkal, Protein: ${totalProtein.toFixed(1)}g`
    );

    // Siapkan Respons
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

async function createMenu(req, res) {
  const { menuName, kategori, ingredients } = req.body;

  if (!menuName || !ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Nama menu dan bahan tidak boleh kosong." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Menu baru
      const newMenu = await tx.menu.create({
        data: {
          nama: menuName.toLowerCase(),
          kategori: kategori,
        },
      });

      const resepData = [];

      // 2. Process setiap bahan
      for (const item of ingredients) {
        let bahanId;

        // ✅ PERBAIKAN KRITIS: Cek dulu apakah bahanId sudah ada
        if (item.bahanId) {
          // Bahan sudah ada di DB (status: found atau generated yang sudah tersimpan)
          console.log(
            `✅ Menggunakan bahan existing ID: ${item.bahanId} (${item.name})`
          );
          bahanId = item.bahanId;
        } else if (item.status === "found") {
          // Fallback: Cari bahan berdasarkan nama
          const existingBahan = await tx.bahan.findFirst({
            where: { nama: item.name.toLowerCase() },
          });

          if (!existingBahan) {
            throw new Error(
              `Bahan "${item.name}" tidak ditemukan di database.`
            );
          }

          bahanId = existingBahan.id;
          console.log(`✅ Found bahan via nama: ${item.name} (ID: ${bahanId})`);
        } else if (item.status === "generated" && item.nutrisi) {
          // Bahan baru dari AI - SIMPAN dengan DATA NUTRISI LENGKAP
          console.log(`🆕 Creating new ingredient from AI: ${item.name}`);

          // ✅ KUNCI: Buat bahan baru dengan nutrisi lengkap
          const newBahan = await tx.bahan.create({
            data: {
              nama: item.name.toLowerCase(),
              isValidated: false,
              validatedBy: "AI",

              // ✅ Simpan SEMUA data nutrisi dari AI
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
            `Bahan "${item.name}" tidak valid atau tidak memiliki data nutrisi.`
          );
        }

        // 3. Tambahkan ke resep
        if (bahanId) {
          resepData.push({
            menu_id: newMenu.id,
            bahan_id: bahanId,
            gramasi: parseFloat(item.gramasi) || 0,
          });
        }
      }

      // 4. Simpan semua resep sekaligus
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
    console.error("Error creating menu:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

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

    // 1. Get recipe data
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

    // 2. Get all ingredients for this recipe
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

    // 3. Calculate total nutrition
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
        nama: bahan.nama,
        gramasi: gramasi,
        isValidated: bahan.isValidated,
        validatedBy: bahan.validatedBy,
        gizi: giziBahanIni,
      });

      console.log(
        `  - ${bahan.nama}: ${gramasi}g (${(bahan.energi_kkal * ratio).toFixed(
          1
        )} kkal)`
      );
    });

    // Round all values
    for (const key in totalGizi) {
      totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));
    }

    console.log(`\n📊 Total: ${totalGramasi}g, ${totalGizi.energi_kkal} kkal`);

    // 4. Calculate AKG percentages
    const calculateAkg = (value, dailyValue) => {
      if (!dailyValue || !value) return "0%";
      const percentage = (value / dailyValue) * 100;
      if (percentage > 0 && percentage < 1) return "<1%";
      return `${Math.round(percentage)}%`;
    };

    // 5. Prepare response
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
            (totalGizi.lemak_g * 9).toFixed(2)
          ),
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
      },
      detailPerhitungan: {
        jumlah_bahan: recipes.length,
        rincian_per_bahan: detailBahan,
      },
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
      (id) => id !== null && id !== undefined && id !== 0
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Minimal 1 resep harus dipilih",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat menu komposisi baru dengan kategori "komposisiChef"
      const newMenu = await tx.menu.create({
        data: {
          nama: nama.toLowerCase().trim(),
          kategori: "komposisiChef", // ✅ UBAH JADI INI
        },
      });

      console.log("✅ Menu baru dibuat:", newMenu);

      // 2. Ambil semua resep dari menu yang dipilih
      const selectedMenuIds = validIds;
      const recipesToCopy = await tx.resep.findMany({
        where: {
          menu_id: { in: selectedMenuIds },
        },
        select: {
          bahan_id: true,
          gramasi: true,
        },
      });

      console.log(`📋 Found ${recipesToCopy.length} recipes to copy`);

      // 3. Copy semua resep ke menu baru
      if (recipesToCopy.length > 0) {
        await tx.resep.createMany({
          data: recipesToCopy.map((recipe) => ({
            menu_id: newMenu.id,
            bahan_id: recipe.bahan_id,
            gramasi: recipe.gramasi,
          })),
        });

        console.log(`✅ Copied ${recipesToCopy.length} recipes to new menu`);
      }

      return newMenu;
    });

    console.log("✅ [Backend] Menu komposisi berhasil disimpan:", result);

    return res.status(201).json({
      success: true,
      message: "Menu komposisi berhasil disimpan",
      id: result.id,
      nama: result.nama,
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

async function getMenuNutritionById(req, res) {
  try {
    const { id } = req.params;
    const { target } = req.query; // Target ID dari user

    console.log(
      `\n📊 Getting nutrition for menu ID: ${id}, target: ${
        target || "default"
      }`
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

    // 2. Get all recipes for this menu WITH menu names
    const recipes = await prisma.resep.findMany({
      where: { menu_id: parseInt(id) },
      include: {
        bahan: true,
        menu: { select: { nama: true, kategori: true } },
      },
    });

    if (recipes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu ini tidak memiliki resep",
      });
    }

    console.log(`📦 Found ${recipes.length} recipes`);

    // 3. Calculate nutrition
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
    const nutrisiPerResep = {};

    recipes.forEach((resep) => {
      const { gramasi, bahan, menu: sourceMenu } = resep;
      if (!bahan) return;

      totalGramasi += gramasi;
      const ratio = gramasi / 100;
      const giziBahanIni = {};

      const sourceMenuName = sourceMenu?.nama || "Unknown";
      if (!nutrisiPerResep[sourceMenuName]) {
        nutrisiPerResep[sourceMenuName] = { ...totalGizi };
      }

      for (const key in totalGizi) {
        if (bahan[key] !== null && bahan[key] !== undefined) {
          const nilaiGiziBahan = (bahan[key] || 0) * ratio;
          totalGizi[key] += nilaiGiziBahan;
          giziBahanIni[key] = parseFloat(nilaiGiziBahan.toFixed(2));
          nutrisiPerResep[sourceMenuName][key] += nilaiGiziBahan;
        }
      }

      detailBahan.push({
        nama: bahan.nama,
        gramasi: gramasi,
        isValidated: bahan.isValidated,
        validatedBy: bahan.validatedBy,
        gizi: giziBahanIni,
      });
    });

    // Round values
    for (const key in totalGizi) {
      totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));
    }

    for (const menuName in nutrisiPerResep) {
      for (const key in nutrisiPerResep[menuName]) {
        nutrisiPerResep[menuName][key] = parseFloat(
          nutrisiPerResep[menuName][key].toFixed(2)
        );
      }
    }

    console.log(`\n📊 Total: ${totalGramasi}g, ${totalGizi.energi_kkal} kkal`);

    const calculateAkg = (value, dailyValue) => {
      if (!dailyValue || !value) return "0%";
      const percentage = (value / dailyValue) * 100;
      if (percentage > 0 && percentage < 1) return "<1%";
      return `${Math.round(percentage)}%`;
    };

    // ✅ PERBAIKAN: Gunakan getRecommendation (SINGULAR) untuk 1 target saja
    console.log("\n[REKOMENDASI] Memanggil sistem rekomendasi...");
    const targetValue = target ? parseInt(target) : 1;

    // ✅ GUNAKAN getRecommendation BUKAN getAllRecommendation
    const rekomendasi = getRecommendation(
      nutrisiPerResep,
      totalGizi,
      1, // serving size
      targetValue // target class (1-14)
    );

    console.log("[REKOMENDASI] Result:", JSON.stringify(rekomendasi, null, 2));

    // ✅ FORMAT REKOMENDASI untuk frontend (TANPA KELAS, karena sudah 1 target)
    const getClassName = (kelas) => {
      const map = {
        1: "TK A & TK B & SD Kelas 1",
        2: "SD Kelas 2",
        3: "SD Kelas 3",
        4: "SD Kelas 4",
        5: "SD Kelas 5",
        6: "SD Kelas 6",
        7: "SMP Kelas 1",
        8: "SMP Kelas 2",
        9: "SMP Kelas 3",
        10: "SMA Kelas 1",
        11: "SMA Kelas 2",
        12: "SMA Kelas 3",
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

    const detailPerResep = Object.entries(nutrisiPerResep).map(
      ([menuNama, gizi]) => ({
        menu_nama: menuNama,
        nutrisi: gizi,
      })
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
            (totalGizi.lemak_g * 9).toFixed(2)
          ),
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
      },
      detailPerhitungan: {
        jumlah_bahan: recipes.length,
        rincian_per_bahan: detailBahan,
        log: [
          `Menu: ${menu.nama}`,
          `Kategori: ${menu.kategori}`,
          `Target: ${getClassName(targetValue)}`,
          `Total bahan: ${recipes.length}`,
          `Total sumber menu: ${Object.keys(nutrisiPerResep).length}`,
        ],
      },
      rekomendasi: formattedRekomendasi, // ✅ FORMATTED UNTUK 1 TARGET
      detailPerResep: detailPerResep,
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
// Jangan lupa export
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
