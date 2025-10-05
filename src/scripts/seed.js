// /backend/src/scripts/seed.js

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ... (fungsi processCsv tetap sama)

// FUNGSI DIPERBARUI UNTUK MENGGANTI NAMA KATEGORI & MEMPERBAIKI SAYUR
function getKategori(grupPangan) {
  const grup = grupPangan ? grupPangan.toLowerCase() : "";
  if (grup.includes("serealia") || grup.includes("umbi")) {
    return "karbo"; // NAMA BARU
  }
  if (
    grup.includes("daging") ||
    grup.includes("ikan") ||
    grup.includes("telur") ||
    grup.includes("unggas")
  ) {
    return "lauk";
  }
  // Pencarian lebih fleksibel, cukup cari kata 'sayur'
  if (grup.includes("sayur")) {
    // DIPERBAIKI
    return "sayur";
  }
  if (grup.includes("kacang") || grup.includes("polong")) {
    return "side_dish";
  }
  if (grup.includes("buah") || grup.includes("susu")) {
    return "buah";
  }
  return null;
}

// ... (sisa kode seed.js lainnya sama persis seperti sebelumnya)

// SALIN SELURUH KODE DI BAWAH INI UNTUK MEMASTIKAN TIDAK ADA YANG TERLEWAT

function processCsv(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File tidak ditemukan: ${filePath}`));
    }
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";", headers: false, skipLines: 1 }))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

async function seedDatabase() {
  const nutritionFiles = [
    "bahan-gizi-1.csv",
    "bahan-gizi-2.csv",
    "bahan-gizi-3.csv",
  ];
  console.log("\n📚 Membaca semua data pangan dari file...");

  for (const file of nutritionFiles) {
    const filePath = path.join(__dirname, `../data/csv/${file}`);
    console.log(`  -> Memproses ${file}...`);

    const records = await processCsv(filePath);

    for (const row of records) {
      const namaProduk = row["3"];
      const grupPangan = row["26"];
      const kategori = getKategori(grupPangan);

      if (namaProduk && kategori) {
        const parseValue = (value) =>
          parseFloat(String(value).replace(",", ".")) || 0;

        await prisma.produkPangan.upsert({
          where: { nama: namaProduk.trim().toLowerCase() },
          update: {},
          create: {
            nama: namaProduk.trim().toLowerCase(),
            kategori: kategori,
            energi_kkal: parseValue(row["5"]),
            protein_g: parseValue(row["6"]),
            lemak_g: parseValue(row["7"]),
            karbohidrat_g: parseValue(row["8"]),
          },
        });
      }
    }
  }
  console.log("✅ Semua data pangan berhasil dimasukkan.");
}

async function main() {
  console.log("--- MENGHAPUS DATA LAMA ---");
  await prisma.produkPangan.deleteMany({});

  console.log("--- MEMULAI PROSES DATABASE SEEDING (SISTEM BARU) ---");
  await seedDatabase();
  console.log("\n🎉 Seeding dengan sistem baru selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("--- KONEKSI DATABASE DITUTUP ---");
  });
