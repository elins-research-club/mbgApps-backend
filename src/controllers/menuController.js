const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  getAiSuggestion,
  findIngredientAlternative,
  analyzeNewMenu,
  findSimilarMenu,
  getIngredientNutrition,
} = require("../services/aiService");
const { getRecommendation } = require("./recommendationSystemController");

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
      select: { id: true, nama: true },
      take: 5,
    });
    res.status(200).json(menus);
  } catch (error) {
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
    // --- PERBAIKAN: Terima banyak ID dari payload frontend ---
    const { karbo_id, lauk_id, sayur_id, side_dish_id, buah_id } = req.body;

    // Kumpulkan semua ID yang valid (bukan null) ke dalam satu array
    const selectedIds = [karbo_id, lauk_id, sayur_id, side_dish_id, buah_id]
      .filter((id) => id !== null && id !== undefined) // 1. Hapus nilai null/undefined
      .map((id) => parseInt(id)); // 2. Ubah sisanya menjadi angka

    // --- AKHIR PERBAIKAN ---

    console.log(`\n--- MEMULAI KALKULASI GIZI ---`);
    console.log(`[DETEKTOR 1] Menerima ID Menu:`, selectedIds);

    // Validasi ini sekarang akan berfungsi dengan benar
    if (selectedIds.length === 0)
      return res.status(400).json({ message: "Tidak ada menu yang dipilih." });

    // Sisa kode Anda di bawah ini sudah sempurna dan tidak perlu diubah
    // karena sudah bekerja dengan array 'selectedIds'
    const selectedMenus = await prisma.menu.findMany({
      where: { id: { in: selectedIds } },
      select: { id: true, nama: true, kategori: true },
    });

    const recipes = await prisma.resep.findMany({
      where: { menu_id: { in: selectedIds } },
      include: {
        bahan: true,
        menu: { select: { nama: true } },
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
    const detailBahan = []; // Ini untuk Revisi 5 Anda
    const nutrisiPerResep = {};
    recipes.forEach((resep) => {
      const { gramasi, bahan } = resep;
      if (!bahan) return;
      totalGramasi += gramasi;
      const ratio = gramasi / 100;
      const giziBahanIni = {}; // Objek untuk menyimpan gizi per bahan
      const nutrisiResep = {};
      for (const key in totalGizi) {
        if (bahan[key] !== null && bahan[key] !== undefined) {
          const nilaiGiziBahan = (bahan[key] || 0) * ratio;
          totalGizi[key] += nilaiGiziBahan;
          giziBahanIni[key] = parseFloat(nilaiGiziBahan.toFixed(2)); // Simpan gizi bahan
          nutrisiResep[key] = nilaiGiziBahan;
        }
      }

      // Simpan rincian gizi untuk bahan ini
      detailBahan.push({
        nama: bahan.nama,
        gramasi: gramasi,
        gizi: giziBahanIni,
      });

      //simpan nutrisi tiap bahan
      nutrisiPerResep[resep.menu.nama] = nutrisiResep;
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

    // minta rekomendasi pakai linear programming
    const rekomendasi = getRecommendation(nutrisiPerResep, totalGizi);

    const response = {
      // Objek Label Gizi Total
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
      // Objek Rincian (Sesuai Revisi 5)
      detailPerhitungan: {
        log: [
          `Total ${selectedMenus.length} menu dihitung.`,
          `Total ${recipes.length} bahan resep ditemukan.`,
          `Total gramasi akhir: ${totalGramasi.toFixed(0)}g`,
        ],
        rincian_per_bahan: detailBahan, // Ini data rincian bahan
        rincian_per_menu: menuAnalysis, // Ini data transparansi Anda
      },
      // rekomendasi tambahan gizi
      rekomendasi: { ...rekomendasi },
    };
    console.log(`\n KALKULASI SELESAI`);
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

// =================================================================
// BARU: Fungsi untuk menyimpan menu baru dari Chef
// =================================================================
async function createMenu(req, res) {
  // 1. Ambil data yang dikirim dari frontend (api.js Langkah 1)
  const { menuName, kategori, ingredients } = req.body;

  if (!menuName || !ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Nama menu dan bahan tidak boleh kosong." });
  }

  try {
    // 2. Gunakan Transaksi Prisma
    // Ini memastikan jika ada 1 bahan gagal, semua proses dibatalkan
    const result = await prisma.$transaction(async (tx) => {
      // 3. Buat Menu baru di tabel 'Menu'
      const newMenu = await tx.menu.create({
        data: {
          nama: menuName,
          kategori: kategori, // <-- GANTI DENGAN INI
        },
      });

      // 4. Siapkan data untuk tabel pivot 'Resep'
      const resepData = [];

      // 5. Looping setiap bahan yang dikirim Chef
      for (const item of ingredients) {
        let bahanId;

        // Cek status bahan dari frontend
        if (item.status === "found") {
          // Jika 'found', bahan sudah ada di DB. Kita cari ID-nya
          const existingBahan = await tx.bahan.findUnique({
            where: { nama: item.name },
          });

          if (!existingBahan) {
            // Seharusnya tidak terjadi, tapi untuk jaga-jaga
            throw new Error(`Bahan "${item.name}" tidak ditemukan.`);
          }
          bahanId = existingBahan.id;
        } else if (item.status === "generated") {
          // Jika 'generated', ini bahan baru dari AI.
          // Kita 'upsert' (update jika ada, atau create jika baru)
          const newBahan = await tx.bahan.upsert({
            where: { nama: item.name }, // Cari berdasarkan nama
            update: {}, // Jika namanya sudah ada, tidak perlu di-update
            create: {
              // Jika baru, buat entri baru
              nama: item.name,

              // --- Ini adalah KUNCI alur validasi ---
              isValidated: false, // <-- PENTING: Menunggu validasi Ahli Gizi

              // Masukkan semua data nutrisi dari AI
              // Pastikan nama field di kiri (energi_kkal)
              // sama persis dengan 'schema.prisma' Anda
              energi_kkal: item.nutrisi?.energi_kkal || 0,
              protein_g: item.nutrisi?.protein_g || 0,
              lemak_g: item.nutrisi?.lemak_g || 0,
              karbohidrat_g: item.nutrisi?.karbohidrat_g || 0,
              serat_g: item.nutrisi?.serat_g || 0,
              abu_g: item.nutrisi?.abu_g || 0,
              kalsium_mg: item.nutrisi?.kalsium_mg || 0,
              fosfor_mg: item.nutrisi?.fosfor_mg || 0,
              besi_mg: item.nutrisi?.besi_mg || 0,
              natrium_mg: item.nutrisi?.natrium_mg || 0,
              kalium_mg: item.nutrisi?.kalium_mg || 0,
              tembaga_mg: item.nutrisi?.tembaga_mg || 0,
              seng_mg: item.nutrisi?.seng_mg || 0,
              retinol_mcg: item.nutrisi?.retinol_mcg || 0,
              b_kar_mcg: item.nutrisi?.b_kar_mcg || 0,
              karoten_total_mcg: item.nutrisi?.karoten_total_mcg || 0,
              thiamin_mg: item.nutrisi?.thiamin_mg || 0,
              riboflavin_mg: item.nutrisi?.riboflavin_mg || 0,
              niasin_mg: item.nutrisi?.niasin_mg || 0,
              vitamin_c_mg: item.nutrisi?.vitamin_c_mg || 0,
            },
          });
          bahanId = newBahan.id;
        }

        // 6. Tambahkan data ke list untuk tabel 'Resep'
        if (bahanId) {
          resepData.push({
            menu_id: newMenu.id, // <-- GANTI INI
            bahan_id: bahanId, // <-- GANTI INI JUGA (untuk jaga-jaga)
            gramasi: parseFloat(item.gramasi) || 0,
          });
        }
      } // Akhir dari loop 'for'

      // 7. Simpan semua data di tabel 'Resep' sekaligus
      await tx.resep.createMany({
        data: resepData,
      });

      return newMenu; // Kembalikan data menu baru jika transaksi sukses
    });

    // 8. Jika Transaksi Sukses, kirim respon 'OK' ke frontend
    res.status(201).json({
      success: true,
      message: `Menu "${result.nama}" berhasil disimpan!`,
      menu: result,
    });
  } catch (error) {
    // 9. Jika Transaksi Gagal, kirim respon error
    console.error("Error creating menu:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
  createMenu,
};
