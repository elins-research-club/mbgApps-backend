// /backend/src/services/aiService.js
require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Gunakan env var supaya gampang ganti kalau model berubah
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

async function getAiSuggestion(newMenuName, existingMenus) {
  const prompt = `
    Anda adalah seorang ahli gizi dan koki profesional. Tugas Anda adalah menganalisis nama menu baru dan memberikan saran resep berdasarkan menu yang sudah ada.

    Nama Menu Baru: "${newMenuName}"

    Tugas:
    1.  Tentukan **kategori** yang paling cocok untuk menu ini dari daftar berikut: [karbo, lauk, sayur, side_dish, buah].
    2.  Pilih satu **menu yang paling mirip** dari daftar menu yang sudah ada ini sebagai dasar resepnya: [${existingMenus.join(
      ", "
    )}].

    Berikan jawaban Anda HANYA dalam format JSON yang valid, tanpa teks tambahan apapun sebelum atau sesudahnya. Contoh format:
    {
      "new_menu_name": "${newMenuName.toLowerCase()}",
      "suggested_category": "lauk",
      "similar_menu_name": "nama menu yang paling mirip"
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
