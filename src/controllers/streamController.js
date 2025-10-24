// /backend/src/controllers/streamController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  getAiSuggestion,
  findIngredientAlternative,
  getIngredientNutrition,
} = require("../services/aiService");

// Fungsi helper untuk mengirim log
function sendLog(res, message, type = "info") {
  const logData = JSON.stringify({ type, message, timestamp: Date.now() });
  res.write(`data: ${logData}\n\n`);
}

// Helper: Fungsi pencarian bahan (sama seperti sebelumnya)
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

// ENDPOINT STREAMING UNTUK AI GENERATION
const suggestMenuStream = async (req, res) => {
  const { new_menu_name } = req.body;

  if (!new_menu_name) {
    return res
      .status(400)
      .json({ message: "Nama menu baru tidak boleh kosong." });
  }

  // Set headers untuk SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    sendLog(res, `🔍 Memulai analisis untuk menu: "${new_menu_name}"`, "start");
    sendLog(res, "📊 Mengambil data dari database...");

    const allMenus = await prisma.menu.findMany({ select: { nama: true } });
    const existingMenuNames = allMenus.map((menu) => menu.nama);

    const allBahanInDb = await prisma.bahan.findMany({
      select: { id: true, nama: true },
    });
    const bahanNameList = allBahanInDb.map((b) => b.nama);

    sendLog(res, `✅ Database memiliki ${bahanNameList.length} bahan tersedia`);
    sendLog(res, "🤖 Menghubungi Asisten AI untuk analisis resep...");

    // Panggil AI
    const suggestion = await getAiSuggestion(new_menu_name, existingMenuNames);

    if (
      !suggestion ||
      !suggestion.suggested_category ||
      !Array.isArray(suggestion.suggested_ingredients)
    ) {
      sendLog(res, "❌ AI tidak memberikan respons yang valid", "error");
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: "Respons AI tidak valid",
        })}\n\n`
      );
      return res.end();
    }

    const { suggested_category, suggested_ingredients } = suggestion;

    sendLog(res, `✨ AI menyarankan kategori: "${suggested_category}"`);
    sendLog(
      res,
      `📝 Total ${suggested_ingredients.length} bahan direkomendasikan`
    );
    sendLog(res, "🔬 Memulai pencarian bahan di database...");

    const ingredientResults = [];
    const recipesToCreate = [];
    const missingIngredients = [];
    const processedBahanIds = new Set();

    // Proses setiap bahan
    for (let i = 0; i < suggested_ingredients.length; i++) {
      const ingredient = suggested_ingredients[i];

      if (!ingredient.nama || typeof ingredient.gramasi === "undefined") {
        continue;
      }

      sendLog(
        res,
        `  [${i + 1}/${suggested_ingredients.length}] Mencari: "${
          ingredient.nama
        }"`
      );

      const searchResult = await findBestMatchingBahan(ingredient.nama);
      let bahanIdToUse = null;
      let gramasiToUse = ingredient.gramasi;
      let statusLog = {};

      if (searchResult.bahan) {
        bahanIdToUse = searchResult.bahan.id;
        const confidence = Math.round(searchResult.confidence * 100);

        sendLog(
          res,
          `     ✓ Ditemukan: "${searchResult.bahan.nama}" (${confidence}% match)`,
          "success"
        );

        statusLog = {
          status: "found",
          match_type: searchResult.matchType,
          confidence: searchResult.confidence,
          bahan_digunakan: searchResult.bahan.nama,
        };

        if (!processedBahanIds.has(bahanIdToUse)) {
          recipesToCreate.push({
            bahan_id: bahanIdToUse,
            gramasi: gramasiToUse,
          });
          processedBahanIds.add(bahanIdToUse);
        }
      } else {
        sendLog(
          res,
          `     ⚠ Tidak ditemukan, mencari alternatif...`,
          "warning"
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
    }

    sendLog(
      res,
      `📊 Ringkasan: ${processedBahanIds.size} bahan ditemukan, ${missingIngredients.length} perlu alternatif`
    );

    // Proses bahan yang hilang
    if (missingIngredients.length > 0) {
      sendLog(
        res,
        "🔄 Mencari alternatif scientific untuk bahan yang hilang..."
      );

      for (let i = 0; i < missingIngredients.length; i++) {
        const missing = missingIngredients[i];
        sendLog(
          res,
          `  [${i + 1}/${missingIngredients.length}] Analisis: "${
            missing.nama
          }"`
        );

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
            sendLog(res, `     ✓ Alternatif: "${altBahan.nama}"`, "success");
            sendLog(res, `       Alasan: ${altResult.scientific_reason}`);

            if (logEntry) {
              logEntry.status = "scientific_alternative";
              logEntry.bahan_digunakan = altBahan.nama;
              logEntry.bahan_id = altBahan.id;
              logEntry.scientific_alternative = {
                original: missing.nama,
                alternative: altBahan.nama,
                reason: altResult.scientific_reason,
              };
            }

            if (!processedBahanIds.has(altBahan.id)) {
              recipesToCreate.push({
                bahan_id: altBahan.id,
                gramasi: missing.gramasi,
              });
              processedBahanIds.add(altBahan.id);
            }
            foundViaAlternative = true;
          }
        }

        if (!foundViaAlternative) {
          sendLog(res, `     🤖 Menggunakan AI untuk generate data nutrisi...`);
          const generatedNutrition = await getIngredientNutrition(missing.nama);

          if (generatedNutrition) {
            const newOrUpdatedBahan = await prisma.bahan.upsert({
              where: { nama: generatedNutrition.nama.toLowerCase() },
              update: generatedNutrition,
              create: generatedNutrition,
            });

            sendLog(
              res,
              `     ✓ Data nutrisi berhasil dibuat untuk "${newOrUpdatedBahan.nama}"`,
              "success"
            );

            if (logEntry) {
              logEntry.status = "ai_generated";
              logEntry.bahan_digunakan = newOrUpdatedBahan.nama;
              logEntry.bahan_id = newOrUpdatedBahan.id;
            }

            if (!processedBahanIds.has(newOrUpdatedBahan.id)) {
              recipesToCreate.push({
                bahan_id: newOrUpdatedBahan.id,
                gramasi: missing.gramasi,
              });
              processedBahanIds.add(newOrUpdatedBahan.id);
            }
          } else {
            sendLog(
              res,
              `     ✗ Gagal mendapatkan data untuk "${missing.nama}"`,
              "error"
            );
            if (logEntry) {
              logEntry.status = "not_found";
            }
          }
        }
      }
    }

    // Buat Menu Baru
    sendLog(res, "💾 Menyimpan menu baru ke database...");
    const newMenu = await prisma.menu.create({
      data: {
        nama: new_menu_name.toLowerCase(),
        kategori: suggested_category,
      },
    });

    sendLog(res, `✅ Menu "${newMenu.nama}" berhasil dibuat!`, "success");
    sendLog(res, `📝 Membuat ${recipesToCreate.length} resep...`);

    // Buat Resep
    for (const recipe of recipesToCreate) {
      await prisma.resep.create({
        data: {
          menu_id: newMenu.id,
          bahan_id: recipe.bahan_id,
          gramasi: recipe.gramasi,
        },
      });
    }

    sendLog(res, "✅ Semua resep berhasil dibuat!", "success");
    sendLog(res, "🔢 Menghitung estimasi nutrisi...");

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

    sendLog(
      res,
      `📊 Nutrisi: ${totalGramasi.toFixed(0)}g, ${totalEnergi.toFixed(
        1
      )} kkal, ${totalProtein.toFixed(1)}g protein`,
      "success"
    );
    sendLog(res, "🎉 Proses selesai! Menampilkan hasil...", "complete");

    // Kirim hasil akhir
    const finalResult = {
      type: "complete",
      data: {
        id: newMenu.id,
        nama: newMenu.nama,
        kategori: newMenu.kategori,
        ai_analysis: {
          ingredients_found: ingredientResults.filter(
            (r) => r.status === "found" || r.status === "scientific_alternative"
          ).length,
          recipes_created: recipesToCreate.length,
          estimated_nutrition: {
            total_gramasi_g: parseFloat(totalGramasi.toFixed(2)),
            energi_kkal: parseFloat(totalEnergi.toFixed(2)),
            protein_g: parseFloat(totalProtein.toFixed(2)),
          },
        },
      },
    };

    res.write(`data: ${JSON.stringify(finalResult)}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error saat suggestMenuStream:", error);
    sendLog(res, `❌ Error: ${error.message}`, "error");
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
    );
    res.end();
  }
};

module.exports = { suggestMenuStream };
