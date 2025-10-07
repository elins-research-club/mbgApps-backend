// /backend/src/services/aiService.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Gunakan env var supaya gampang ganti kalau model berubah
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function getAiSuggestion(newMenuName, existingMenus) {
  const prompt = `
    Anda adalah seorang ahli gizi dan koki profesional yang memiliki akses ke database TKPI (Tabel Komposisi Pangan Indonesia).
    Tugas Anda adalah membuat rekomendasi menu baru berdasarkan nama menu yang diberikan.

    Nama Menu Baru: "${newMenuName}"

    Panduan tugas:
    1. Analisis nama menu di atas dan tentukan **kategori** yang paling sesuai dari daftar berikut:
      [karbo, lauk, sayur, side_dish, buah].
    2. Buat **resep/menu baru** yang terinspirasi dari bahan-bahan yang mirip di database TKPI.
      - Jika bahan-bahan mirip tersedia di database TKPI, gunakan bahan-bahan tersebut untuk membentuk menu baru.
      - Jika bahan-bahan mirip tidak tersedia sama sekali, maka pilih satu **menu yang paling mirip** dari daftar berikut
       sebagai referensi: [${existingMenus.join(", ")}].
    3. Jika Anda menggunakan menu yang mirip sebagai referensi, tetap tuliskan alasannya secara ringkas di field "note".

    Berikan hasil dalam format JSON **valid**, tanpa teks tambahan, komentar, atau markdown apapun.

    Contoh format:
{
      "new_menu_name": "${newMenuName.toLowerCase()}",
      "suggested_category": "lauk",
      "reference_type": "based_on_similar_ingredients", // atau "similar_menu_fallback"
      "reference_menu_name": "nama menu dari existingMenus jika pakai fallback, jika tidak tulis null",
      "suggested_ingredients": ["daftar", "bahan", "utama", "hasil", "analisis"],
      "note": "deskripsi singkat alasan pemilihan bahan atau fallback"
}
`;

  try {
    // panggil model (pakai cara yang sebelumnya bekerja di projectmu)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();

    // bersihkan triple-backticks jika ada
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // parsing: pertama coba langsung, kalau gagal coba ekstrak objek JSON pertama dari teks
    try {
      return JSON.parse(cleanedText);
    } catch (parseErr) {
      // coba ekstrak substring antara first "{" dan last "}"
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
    // kalau 404, beri pesan yang lebih jelas (biasanya karena model tidak ada)
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

module.exports = { getAiSuggestion };
