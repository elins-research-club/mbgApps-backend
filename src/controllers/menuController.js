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

// ✅ PERBAIKAN: Gunakan konstanta yang konsisten
const KOMPOSISI_CHEF_KATEGORI = "komposisi_chef";

// =================================================================
// HELPER BARU: Mengambil dan Memformat Preview Komposisi
// =================================================================
async function getCompositionPreview(menuId) {
  const components = await prisma.menuKomposisi.findMany({
    where: { menu_induk_id: menuId },
    select: {
      tipe_komponen: true,
      menu_anak: {
        select: { nama: true },
      },
    },
    orderBy: { tipe_komponen: "asc" }, // Urutkan untuk konsistensi
  });

  if (components.length === 0) {
    return null;
  }

  // Format menjadi string preview: "Karbo: Nasi, Lauk: Ayam, Sayur: Bayam, ..."
  const previewString = components
    .map((c) => {
      let label = c.tipe_komponen;
      // Singkatan untuk tampilan lebih ringkas
      if (c.tipe_komponen === "proteinHewani") label = "Lauk";
      else if (c.tipe_komponen === "proteinTambahan") label = "Side";
      else if (c.tipe_komponen === "karbohidrat") label = "Karbo";
      else if (c.tipe_komponen === "sayur") label = "Sayur";
      else if (c.tipe_komponen === "buah") label = "Buah";

      return `${label}: ${c.menu_anak.nama}`;
    })
    .join(", ");

  return previewString;
}

// =================================================================
// HELPER: Fungsi pencarian bahan (TIDAK BERUBAH)
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
// BARU: Fungsi Rekursif Perhitungan Gizi Menu
// =================================================================
async function getMenuNutritionById(menuId, target = 1) {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu) {
    throw new Error("Menu tidak ditemukan.");
  }

  if (menu.kategori === KOMPOSISI_CHEF_KATEGORI) {
    const components = await prisma.menuKomposisi.findMany({
      where: { menu_induk_id: menuId },
      include: {
        menu_anak: { select: { id: true, nama: true, kategori: true } },
      },
      orderBy: { tipe_komponen: "asc" },
    });

    if (components.length === 0) {
      return {
        totalLabel: null,
        detailPerhitungan: null,
        detailPerResep: null,
        rekomendasi: { saran: [], kekurangan: [] }, // aman
      };
    }

    let combinedNutrition = {};
    let combinedDetails = [];
    let detailPerResep = [];

    for (const component of components) {
      const componentResult = await getMenuNutritionById(
        component.menu_anak_id
      );

      if (componentResult?.totalLabel) {
        const categoryLabels = {
          karbohidrat: "Karbohidrat",
          proteinHewani: "Protein Hewani",
          sayur: "Sayur",
          proteinTambahan: "Protein Tambahan",
          buah: "Buah",
        };

        detailPerResep.push({
          kategori: component.tipe_komponen,
          kategori_label:
            categoryLabels[component.tipe_komponen] || component.tipe_komponen,
          nama_menu: component.menu_anak.nama,
          menu_id: component.menu_anak.id,
          nutrisi: componentResult.totalLabel.informasi_nilai_gizi,
          gramasi: componentResult.totalLabel.takaran_saji_g,
          rincian_bahan:
            componentResult.detailPerhitungan?.rincian_per_bahan || [],
        });
      }

      if (componentResult?.totalLabel?.informasi_nilai_gizi) {
        for (const key in componentResult.totalLabel.informasi_nilai_gizi) {
          const val = componentResult.totalLabel.informasi_nilai_gizi[key];
          combinedNutrition[key] = (combinedNutrition[key] || 0) + val;
        }
      }

      if (componentResult?.detailPerhitungan?.rincian_per_bahan) {
        combinedDetails.push(
          ...componentResult.detailPerhitungan.rincian_per_bahan
        );
      }
    }

    // ✅ Tambahkan pemanggilan getRecommendation() di sini
    const rekomendasi = getRecommendation(
      detailPerResep.reduce((acc, r) => {
        acc[r.nama_menu] = r.nutrisi;
        return acc;
      }, {}),
      combinedNutrition,
      1,
      1 // classGrade default (bisa diganti sesuai target kalau ada)
    );

    return {
      totalLabel: {
        takaran_saji_g: combinedDetails.reduce(
          (sum, b) => sum + (b.gramasi || 0),
          0
        ),
        informasi_nilai_gizi: combinedNutrition,
      },
      detailPerhitungan: {
        rincian_per_bahan: combinedDetails,
        log: ["Menu Komposisi dihitung dari komponennya."],
      },
      detailPerResep,
      rekomendasi, // ✅ hasil rekomendasi
    };
  } else {
    // --- LOGIKA MENU BIASA ---
    const resepList = await prisma.resep.findMany({
      where: { menu_id: menuId },
      include: { bahan: true },
    });

    if (resepList.length === 0) {
      return {
        totalLabel: { informasi_nilai_gizi: {} },
        detailPerhitungan: { rincian_per_bahan: [] },
        rekomendasi: { saran: [], kekurangan: [] }, // aman
      };
    }

    let totalGizi = {};
    let detailBahan = [];

    resepList.forEach((resep) => {
      const ratio = resep.gramasi / 100;
      for (const key in resep.bahan) {
        if (typeof resep.bahan[key] === "number") {
          totalGizi[key] = (totalGizi[key] || 0) + resep.bahan[key] * ratio;
        }
      }
      detailBahan.push({
        nama: resep.bahan.nama,
        gramasi: resep.gramasi,
        gizi: resep.bahan,
      });
    });

    // ✅ Tambahkan rekomendasi juga di menu biasa
    const rekomendasi = getRecommendation(
      { [menu.nama]: totalGizi },
      totalGizi,
      1,
      1
    );

    return {
      totalLabel: {
        takaran_saji_g: resepList.reduce((sum, r) => sum + r.gramasi, 0),
        informasi_nilai_gizi: totalGizi,
      },
      detailPerhitungan: {
        rincian_per_bahan: detailBahan,
        log: ["Menu biasa dihitung dari resep dan bahan."],
      },
      rekomendasi, // ✅ hasil rekomendasi
    };
  }
}

// =================================================================
// FUNGSI UNTUK SEARCH BOX (REVISI: MEMANGGIL HELPER BARU, ROBUST)
// =================================================================
const searchMenus = async (req, res) => {
  try {
    const query = (req.query.q || "").toLowerCase().trim();
    const type = (req.query.type || "component").toLowerCase().trim();

    if (query.length < 2) {
      return res.json([]);
    }

    let menus;

    // ===============================
    // 🔹 CASE 1 — TYPE: composition
    // ===============================
    if (type === "composition") {
      // ✅ PERBAIKAN: Gunakan konstanta yang konsisten
      const rawMenus = await prisma.menu.findMany({
        where: {
          nama: {
            contains: query,
          },
          kategori: {
            equals: KOMPOSISI_CHEF_KATEGORI,
          },
        },
        select: {
          id: true,
          nama: true,
          kategori: true,
        },
        take: 20,
      });

      // ✅ BARU: Tambahkan preview komposisi untuk setiap menu
      menus = await Promise.all(
        rawMenus.map(async (menu) => {
          // Ambil komponen menu dari tabel MenuKomposisi
          const components = await prisma.menuKomposisi.findMany({
            where: { menu_induk_id: menu.id },
            include: {
              menu_anak: {
                select: { nama: true },
              },
            },
            orderBy: { tipe_komponen: "asc" },
          });

          // Format preview komposisi
          let previewText = "";
          if (components.length > 0) {
            const componentLabels = {
              karbohidrat: "Karbo",
              proteinHewani: "Lauk",
              sayur: "Sayur",
              proteinTambahan: "Protein+",
              buah: "Buah",
            };

            const previewParts = components.map((comp) => {
              const label =
                componentLabels[comp.tipe_komponen] || comp.tipe_komponen;
              return `${label}: ${comp.menu_anak.nama}`;
            });

            previewText = previewParts.join(" • ");
          }

          return {
            ...menu,
            preview_komposisi: previewText || null,
          };
        })
      );
    }

    // ===============================
    // 🔹 CASE 2 — TYPE: component
    // ===============================
    else if (type === "component") {
      // ✅ PERBAIKAN: Untuk resep dasar, ambil semua kecuali komposisi_chef
      menus = await prisma.menu.findMany({
        where: {
          nama: {
            contains: query,
          },
          NOT: {
            kategori: {
              equals: KOMPOSISI_CHEF_KATEGORI,
            },
          },
        },
        select: {
          id: true,
          nama: true,
          kategori: true,
        },
        take: 20,
      });
    }

    // ===============================
    // 🔹 CASE 3 — DEFAULT / fallback
    // ===============================
    else {
      menus = await prisma.menu.findMany({
        where: {
          nama: {
            contains: query,
          },
        },
        select: {
          id: true,
          nama: true,
          kategori: true,
        },
        take: 20,
      });
    }

    console.log(`🔍 [searchMenus] Type: ${type}, Hasil: ${menus.length}`);
    return res.json(menus);
  } catch (error) {
    console.error("❌ Error di searchMenus:", error);
    console.error(error.stack);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan saat pencarian menu." });
  }
};

// =================================================================
// FUNGSI getMenus LAMA
// =================================================================
const getMenus = async (req, res) => {
  try {
    // ✅ PERBAIKAN: Filter menu komposisi
    const allMenus = await prisma.menu.findMany({
      where: {
        NOT: {
          kategori: KOMPOSISI_CHEF_KATEGORI,
        },
      },
      orderBy: { nama: "asc" },
    });

    const groupedMenus = {
      karbohidrat: [],
      proteinHewani: [],
      sayur: [],
      proteinTambahan: [],
      buah: [],
    };

    allMenus.forEach((menu) => {
      // ✅ Gunakan kategori langsung dari database
      if (groupedMenus[menu.kategori]) {
        groupedMenus[menu.kategori].push({ id: menu.id, nama: menu.nama });
      }
    });

    return res.status(200).json(groupedMenus);
  } catch (error) {
    console.error("Error saat mengambil menu:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =================================================================
// BAGIAN 2: generateNutrition
// =================================================================
const TARGET_NUTRITION_REQUIREMENTS = {
  1: { Energi: 1500, Protein: 45, Lemak: 50, Karbohidrat: 220 },
  2: { Energi: 1600, Protein: 50, Lemak: 55, Karbohidrat: 240 },
};

const generateNutrition = async (req, res) => {
  try {
    const { karbo_id, lauk_id, sayur_id, side_dish_id, buah_id, target } =
      req.body;

    const selectedIds = [karbo_id, lauk_id, sayur_id, side_dish_id, buah_id]
      .filter((id) => id !== null && id !== undefined)
      .map((id) => parseInt(id));

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
        menu: { select: { nama: true } },
      },
    });

    if (recipes.length === 0) {
      return res.status(404).json({
        message: "Tidak ada resep yang ditemukan untuk menu yang dipilih.",
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

          if (!nutrisiPerResep[resep.menu.nama]) {
            nutrisiPerResep[resep.menu.nama] = {};
          }
          nutrisiPerResep[resep.menu.nama][key] =
            (nutrisiPerResep[resep.menu.nama][key] || 0) + nilaiGiziBahan;
        }
      }

      detailBahan.push({
        nama: bahan.nama,
        gramasi: gramasi,
        gizi: giziBahanIni,
      });
    });

    for (const key in totalGizi)
      totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));

    const calculateAkg = (value, dailyValue) => {
      if (!dailyValue || !value) return "0%";
      const percentage = (value / dailyValue) * 100;
      if (percentage > 0 && percentage < 1) return "<1%";
      return `${Math.round(percentage)}%`;
    };

    // ✅ Ini bagian penting — sesuai versi kamu yang berfungsi
    const rekomendasi = getRecommendation(
      nutrisiPerResep,
      totalGizi,
      1,
      target
    );

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
        rincian_per_bahan: detailBahan,
        rincian_per_menu: selectedMenus,
      },
      rekomendasi,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error saat generate nutrisi:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =================================================================
// BAGIAN 3: suggestMenu (TIDAK BERUBAH - Terlalu panjang)
// =================================================================
const suggestMenu = async (req, res) => {
  const { new_menu_name } = req.body;
  if (!new_menu_name) {
    return res
      .status(400)
      .json({ message: "Nama menu baru tidak boleh kosong." });
  }

  try {
    console.log(`\n🔍 Meminta saran AI untuk: "${new_menu_name}"...`);
    const allMenus = await prisma.menu.findMany({ select: { nama: true } });
    const existingMenuNames = allMenus.map((menu) => menu.nama);
    const allBahanInDb = await prisma.bahan.findMany({
      select: { id: true, nama: true },
    });
    const bahanNameList = allBahanInDb.map((b) => b.nama);
    console.log(`📦 Database memiliki ${bahanNameList.length} bahan tersedia`);

    const suggestion = await getAiSuggestion(new_menu_name, existingMenuNames);
    console.log("🤖 Hasil AI suggestion:", JSON.stringify(suggestion, null, 2));

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
        console.log(`⚠️  Format ingredient tidak valid:`, ingredient);
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
          `✅   "${ingredient.nama}" → DITEMUKAN: "${
            searchResult.bahan.nama
          }" (${searchResult.matchType}, ${searchResult.confidence * 100}%)`
        );
      } else {
        console.log(
          `❌   "${ingredient.nama}" → TIDAK DITEMUKAN di database, perlu alternatif.`
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
            `⚠️   -> DUPLIKAT Terdeteksi untuk bahan ID ${bahanIdToUse}, dilewati.`
          );
        }
      }
    }

    console.log(
      `\n📊 Ringkasan Pencarian Awal: Ditemukan langsung ${processedBahanIds.size}/${suggested_ingredients.length}, Perlu alternatif: ${missingIngredients.length}`
    );

    if (missingIngredients.length > 0) {
      console.log(
        `\n🔬 Mencari alternatif / data nutrisi untuk ${missingIngredients.length} bahan...`
      );
      for (const missing of missingIngredients) {
        console.log(`\n    🔍 Analisis: "${missing.nama}"`);
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
              `      ✅ ALTERNATIF DITEMUKAN: "${altBahan.nama}" (Scientific)`
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
                `      ⚠️  -> DUPLIKAT (via Alternatif) untuk bahan ID ${altBahan.id}, dilewati.`
              );
            }
            foundViaAlternative = true;
          } else {
            console.log(
              `      ❌ Alternatif "${altResult.alternative_name}" tidak ditemukan di DB`
            );
          }
        } else {
          console.log(
            `      ❌ Tidak ada alternatif scientific untuk "${missing.nama}"`
          );
          console.log(`        └─ ${altResult.scientific_reason}`);
        }

        if (!foundViaAlternative) {
          console.log(
            `      🤖 -> Mencoba generate nutrisi via AI untuk "${missing.nama}"...`
          );
          const generatedNutrition = await getIngredientNutrition(missing.nama);

          if (generatedNutrition) {
            const newOrUpdatedBahan = await prisma.bahan.upsert({
              where: { nama: generatedNutrition.nama.toLowerCase() },
              update: generatedNutrition,
              create: generatedNutrition,
            });
            console.log(
              `      ✅ -> Data nutrisi AI untuk "${newOrUpdatedBahan.nama}" disimpan (ID: ${newOrUpdatedBahan.id}).`
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
                `      ⚠️  -> DUPLIKAT (via AI Generate) untuk bahan ID ${newOrUpdatedBahan.id}, dilewati.`
              );
            }
          } else {
            console.log(
              `      ❌ -> AI GAGAL mendapatkan data nutrisi untuk "${missing.nama}".`
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
      `\n📊 Ringkasan Akhir: Total bahan valid: ${finalFoundCount}/${suggested_ingredients.length} (Direct: ${directMatchCount}, Scientific: ${scientificCount}), Gagal: ${finalNotFoundCount}`
    );

    const newMenu = await prisma.menu.create({
      data: { nama: new_menu_name.toLowerCase(), kategori: suggested_category },
    });
    console.log(
      `\n✅ Menu "${newMenu.nama}" berhasil dibuat di kategori "${suggested_category}"`
    );
    console.log(
      `\n💾 Membuat ${recipesToCreate.length} resep unik untuk menu "${newMenu.nama}"...`
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
    console.log(`  ✅ Berhasil membuat ${recipesToCreate.length} resep unik.`);

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
        0
      )}g, Energi: ${totalEnergi.toFixed(
        1
      )} kkal, Protein: ${totalProtein.toFixed(1)}g`
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
// FUNGSI LAMA: createMenu
// =================================================================
async function createMenu(req, res) {
  const { menuName, kategori, ingredients } = req.body;

  if (!menuName || !ingredients || ingredients.length === 0) {
    return res
      .status(400)
      .json({ message: "Nama menu dan bahan tidak boleh kosong." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newMenu = await tx.menu.create({
        data: {
          nama: menuName,
          kategori: kategori,
        },
      });

      const resepData = [];

      for (const item of ingredients) {
        let bahanId;

        if (item.status === "found") {
          const existingBahan = await tx.bahan.findUnique({
            where: { nama: item.name },
          });

          if (!existingBahan) {
            throw new Error(`Bahan "${item.name}" tidak ditemukan.`);
          }
          bahanId = existingBahan.id;
        } else if (item.status === "generated") {
          const newBahan = await tx.bahan.upsert({
            where: { nama: item.name },
            update: {},
            create: {
              nama: item.name,
              isValidated: false,
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

        if (bahanId) {
          resepData.push({
            menu_id: newMenu.id,
            bahan_id: bahanId,
            gramasi: parseFloat(item.gramasi) || 0,
          });
        }
      }

      await tx.resep.createMany({
        data: resepData,
      });

      return newMenu;
    });

    res.status(201).json({
      success: true,
      message: `Menu "${result.nama}" berhasil disimpan!`,
      menu: result,
    });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// =================================================================
// FUNGSI BARU: saveCompositionMenu
// =================================================================
const saveCompositionMenu = async (req, res) => {
  const { nama, komposisi } = req.body;

  const compositionKeys = [
    "karbo_id",
    "lauk_id",
    "sayur_id",
    "side_dish_id",
    "buah_id",
  ];
  const componentMap = {
    karbo_id: "karbohidrat",
    lauk_id: "proteinHewani",
    sayur_id: "sayur",
    side_dish_id: "proteinTambahan",
    buah_id: "buah",
  };

  const validComponents = compositionKeys
    .map((key) => {
      const menu_id = komposisi[key];
      if (menu_id !== null && menu_id !== undefined && menu_id !== 0) {
        return [componentMap[key], menu_id];
      }
      return null;
    })
    .filter(Boolean);

  if (validComponents.length === 0) {
    return res
      .status(400)
      .json({ message: "Minimal satu resep komponen harus dipilih." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // ✅ PERBAIKAN: Gunakan konstanta yang konsisten
      const newMenu = await tx.menu.create({
        data: {
          nama: nama,
          kategori: KOMPOSISI_CHEF_KATEGORI,
        },
      });

      const compositionData = validComponents.map(([tipe, menu_anak_id]) => ({
        menu_induk_id: newMenu.id,
        menu_anak_id: menu_anak_id,
        tipe_komponen: tipe,
      }));

      await tx.menuKomposisi.createMany({
        data: compositionData,
      });

      return newMenu;
    });

    const response = {
      id: result.id,
      nama: result.nama,
      message: `Menu komposisi "${result.nama}" berhasil disimpan.`,
    };

    console.log(
      `\n🎉 Menu komposisi "${result.nama}" (ID: ${result.id}) berhasil disimpan.`
    );
    return res.status(201).json(response);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: `Nama menu "${nama}" sudah ada. Silakan gunakan nama lain.`,
      });
    }
    console.error("Error saat menyimpan komposisi menu:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =================================================================
// ROUTE HANDLER: Get Menu Nutrition by ID
// =================================================================
const getMenuNutritionByIdHandler = async (req, res) => {
  try {
    const menuId = parseInt(req.params.id);
    const target = parseInt(req.query.target) || 1; // ✅ BACA TARGET DARI QUERY

    if (isNaN(menuId)) {
      return res.status(400).json({ message: "ID menu tidak valid." });
    }

    console.log(
      `\n📋 [getMenuNutritionByIdHandler] Request untuk menu ID: ${menuId}, target: ${target}`
    );

    // ✅ Teruskan target ke fungsi perhitungan
    const result = await getMenuNutritionById(menuId, target);

    if (!result || !result.totalLabel) {
      return res.status(404).json({
        message: "Menu tidak ditemukan atau tidak memiliki data gizi.",
      });
    }

    console.log(
      `✅ [getMenuNutritionByIdHandler] Berhasil mengirim data untuk menu ID: ${menuId} (target ${target})`
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error di getMenuNutritionByIdHandler:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data gizi menu.",
      error: error.message,
    });
  }
};

module.exports = {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
  createMenu,
  saveCompositionMenu,
  getMenuNutritionByIdHandler, // ✅ BARU: Export route handler
};
