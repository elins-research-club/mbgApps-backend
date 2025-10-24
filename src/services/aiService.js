// /backend/src/services/aiService.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function getAiSuggestion(newMenuName, existingMenus) {
  const prompt = `
Anda adalah seorang ahli gizi dan food scientist yang memiliki akses ke database TKPI (Tabel Komposisi Pangan Indonesia).
Tugas Anda adalah membuat rekomendasi menu baru dengan RESEP LENGKAP (termasuk gramasi/takaran) berdasarkan nama menu yang diberikan.

Nama Menu Baru: "${newMenuName}"

Panduan tugas:
1. Analisis nama menu di atas dan tentukan **kategori** yang paling sesuai: [karbo, lauk, sayur, side_dish, buah]

2. Buat **resep lengkap** dengan bahan dan gramasi yang realistis:
   - Untuk LAUK (protein hewani): Total gramasi 100-150g untuk bahan utama (daging/ikan/ayam)
   - Untuk KARBO: Total gramasi 50-100g untuk nasi/mie/kentang
   - Untuk SAYUR: Total gramasi 50-100g untuk sayuran, bumbu 5-20g
   - Untuk BUAH: Total gramasi 80-150g
   - Bumbu pelengkap: 1-10g per item (bawang, garam, merica, dll)
   - Minyak goreng: 10-20g jika digoreng

3. Gunakan nama bahan yang umum ada di TKPI Indonesia, contoh:
   - "daging ayam, mentah" BUKAN "ayam fillet"
   - "bawang merah, segar" BUKAN "bawang bombay"
   - "cabai merah" BUKAN "cabe keriting"
   - "minyak kelapa sawit" BUKAN "minyak sayur"
   - "beras giling, mentah" BUKAN "nasi"
   - "tomat, segar" BUKAN "tomat cherry"

4. **PENTING**: Setiap bahan HARUS memiliki gramasi dalam gram (g), tidak boleh ada yang kosong.

Berikan hasil dalam format JSON **valid**, tanpa teks tambahan, komentar, atau markdown apapun.

Format yang BENAR:
{
  "new_menu_name": "${newMenuName.toLowerCase()}",
  "suggested_category": "lauk",
  "suggested_ingredients": [
    {"nama": "daging ayam, mentah", "gramasi": 100},
    {"nama": "bawang merah, segar", "gramasi": 5},
    {"nama": "bawang putih, segar", "gramasi": 3},
    {"nama": "cabai merah", "gramasi": 10},
    {"nama": "tomat, segar", "gramasi": 20},
    {"nama": "minyak kelapa sawit", "gramasi": 15},
    {"nama": "garam", "gramasi": 2}
  ],
  "note": "Penjelasan singkat tentang menu dan bahan yang dipilih"
}

JANGAN gunakan format ini (SALAH):
{
  "suggested_ingredients": ["ayam", "bawang", "cabai"]  // SALAH: tidak ada gramasi
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseErr) {
      const first = cleanedText.indexOf("{");
      const last = cleanedText.lastIndexOf("}");
      if (first !== -1 && last !== -1 && last > first) {
        const sub = cleanedText.substring(first, last + 1);
        try {
          return JSON.parse(sub);
        } catch (subErr) {
          console.error("Gagal parse substring JSON dari respons AI:", sub);
          throw new Error("Respons AI tidak dalam format JSON yang valid.");
        }
      }
      console.error("Gagal parse respons AI, isi lengkap:", cleanedText);
      throw new Error("Respons AI tidak dalam format JSON yang valid.");
    }
  } catch (error) {
    if (error && error.status === 404) {
      console.error(
        `Model "${MODEL_NAME}" tidak ditemukan (404). Coba ganti MODEL_NAME ke gemini-2.5-flash atau cek daftar model yang tersedia.`
      );
    } else {
      console.error("Error saat berkomunikasi dengan Google AI:", error);
    }
    throw new Error("Gagal mendapatkan saran dari AI.");
  }
}

// FUNGSI BARU: Cari alternatif bahan secara scientific
async function findIngredientAlternative(
  missingIngredientName,
  availableBahanList
) {
  const prompt = `
Anda adalah seorang food scientist dan ahli gizi profesional.

TUGAS: Cari bahan ALTERNATIF yang paling mirip untuk bahan yang tidak tersedia di database.

Bahan yang TIDAK ADA: "${missingIngredientName}"

Bahan yang TERSEDIA di database TKPI:
${availableBahanList.slice(0, 200).join(", ")}
... (dan ${availableBahanList.length - 200} bahan lainnya)

KRITERIA PEMILIHAN ALTERNATIF (urutan prioritas):
1. **Kategori taksonomi**: Genus/familia yang sama atau mirip
   Contoh: "daun woku" (tidak ada) → "daun kemangi" atau "daun jeruk" (sama-sama daun aromatik)
   
2. **Profil nutrisi**: Kandungan protein, lemak, karbohidrat yang serupa
   Contoh: "daging kalkun" → "daging ayam" (protein unggas mirip)
   
3. **Fungsi kuliner**: Peran dalam masakan (pemberi aroma, pewarna, tekstur, dll)
   Contoh: "kunyit bubuk" → "kunyit, segar" (sama-sama pewarna kuning)
   
4. **Karakteristik fisik**: Tekstur, rasa, aroma
   Contoh: "brokoli" → "kembang kol" (sayuran cruciferous)

ATURAN PENTING:
- Pilih HANYA SATU bahan alternatif terbaik dari daftar yang tersedia
- Jika tidak ada alternatif yang masuk akal sama sekali, return null
- Berikan penjelasan scientific singkat tentang kenapa bahan ini dipilih

Format JSON output:
{
  "missing_ingredient": "${missingIngredientName}",
  "alternative_found": true,
  "alternative_name": "nama bahan dari daftar yang tersedia",
  "similarity_score": 0.85,
  "scientific_reason": "Penjelasan singkat berdasarkan taksonomi/nutrisi/fungsi kuliner",
  "category_match": "sama-sama daun aromatik dari familia Lamiaceae"
}

Jika tidak ada alternatif:
{
  "missing_ingredient": "${missingIngredientName}",
  "alternative_found": false,
  "alternative_name": null,
  "scientific_reason": "Tidak ada bahan dengan karakteristik serupa di database"
}

Berikan HANYA JSON, tanpa penjelasan tambahan.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseErr) {
      const first = cleanedText.indexOf("{");
      const last = cleanedText.lastIndexOf("}");
      if (first !== -1 && last !== -1 && last > first) {
        const sub = cleanedText.substring(first, last + 1);
        return JSON.parse(sub);
      }
      throw new Error("Gagal parse respons AI untuk alternatif bahan");
    }
  } catch (error) {
    console.error("Error saat mencari alternatif bahan:", error);
    return {
      missing_ingredient: missingIngredientName,
      alternative_found: false,
      alternative_name: null,
      scientific_reason: "Error dalam pencarian alternatif",
    };
  }
}

async function getIngredientNutrition(ingredientName) {
  const prompt = `
    Berikan data nutrisi per 100 gram untuk bahan makanan: "${ingredientName}".
    Fokus utama pada kandungan Natrium (mg). Untuk nutrisi lain (Energi, Protein, Lemak, Karbohidrat, Serat, Kalsium, Fosfor, Besi, dll.), jika tidak relevan atau tidak diketahui, berikan nilai 0.

    Berikan jawaban HANYA dalam format JSON yang valid, tanpa teks tambahan. Kunci JSON harus cocok persis dengan ini (gunakan 0 jika tidak ada data):
    {
      "nama": "${ingredientName.toLowerCase()}",
      "energi_kkal": 0,
      "protein_g": 0,
      "lemak_g": 0,
      "karbohidrat_g": 0,
      "serat_g": 0,
      "abu_g": 0, // Usually 0 for simple ingredients
      "kalsium_mg": 0,
      "fosfor_mg": 0,
      "besi_mg": 0,
      "natrium_mg": /* Nilai Natrium di sini */,
      "kalium_mg": 0,
      "tembaga_mg": 0,
      "seng_mg": 0,
      "retinol_mcg": 0,
      "b_kar_mcg": 0,
      "karoten_total_mcg": 0,
      "thiamin_mg": 0,
      "riboflavin_mg": 0,
      "niasin_mg": 0,
      "vitamin_c_mg": 0
    }
  `;

  try {
    console.log(
      `      -> Meminta AI untuk data nutrisi "${ingredientName}"...`
    );
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const nutritionData = JSON.parse(cleanedText);

    // Validasi dasar
    if (nutritionData && typeof nutritionData.natrium_mg !== "undefined") {
      console.log(
        `      -> AI berhasil mendapatkan data nutrisi untuk "${ingredientName}". Natrium: ${nutritionData.natrium_mg}mg`
      );
      return nutritionData;
    } else {
      console.warn(
        `      -> AI mengembalikan format JSON yang tidak valid untuk "${ingredientName}".`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `      -> Error saat AI mencari nutrisi "${ingredientName}":`,
      error
    );
    return null; // Return null if AI fails
  }
}

module.exports = {
  getAiSuggestion,
  findIngredientAlternative,
  getIngredientNutrition,
};
