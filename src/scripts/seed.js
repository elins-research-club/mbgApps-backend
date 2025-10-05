// /backend/src/scripts/seed.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function processCsv(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath))
      return reject(new Error(`File tidak ditemukan: ${filePath}`));
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv(options))
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

async function seedBahan() {
  console.log("📚 Tahap 1: Membaca kamus gizi...");
  const nutritionFiles = [
    "bahan-gizi-1.csv",
    "bahan-gizi-2.csv",
    "bahan-gizi-3.csv",
  ];
  for (const file of nutritionFiles) {
    const filePath = path.join(__dirname, `../data/csv/${file}`);
    const records = await processCsv(filePath, {
      separator: ";",
      headers: false,
      skipLines: 1,
    });
    for (const row of records) {
      const namaBahan = row["3"];
      if (!namaBahan || namaBahan.trim() === "") continue;
      const parseValue = (value) =>
        parseFloat(String(value).replace(",", ".")) || 0;
      await prisma.bahan.upsert({
        where: { nama: namaBahan.trim().toLowerCase() },
        update: {},
        create: {
          nama: namaBahan.trim().toLowerCase(),
          energi_kkal: parseValue(row["5"]),
          protein_g: parseValue(row["6"]),
          lemak_g: parseValue(row["7"]),
          karbohidrat_g: parseValue(row["8"]),
          serat_g: parseValue(row["9"]),
          abu_g: parseValue(row["10"]),
          kalsium_mg: parseValue(row["11"]),
          fosfor_mg: parseValue(row["12"]),
          besi_mg: parseValue(row["13"]),
          natrium_mg: parseValue(row["14"]),
          kalium_mg: parseValue(row["15"]),
          tembaga_mg: parseValue(row["16"]),
          seng_mg: parseValue(row["17"]),
          retinol_mcg: parseValue(row["18"]),
          b_kar_mcg: parseValue(row["19"]),
          karoten_total_mcg: parseValue(row["20"]),
          thiamin_mg: parseValue(row["21"]),
          riboflavin_mg: parseValue(row["22"]),
          niasin_mg: parseValue(row["23"]),
          vitamin_c_mg: parseValue(row["24"]),
        },
      });
    }
  }
  console.log("✅ Kamus gizi berhasil dimasukkan.");
}

async function seedMenu() {
  console.log("🍽️ Tahap 2: Membaca daftar menu utama...");
  const filePath = path.join(__dirname, "../data/csv/menu.csv");
  const records = await processCsv(filePath, { headers: false, skipLines: 1 });
  const kategoriMapping = {
    "Karbohidrat": "karbo",
    "Protein hewani": "lauk",
    "Sayuran": "sayur",
    "Protein tambahan": "side_dish",
    "Buah": "buah",
  };
  for (const row of records) {
    const kategori = kategoriMapping[row["0"]];
    if (kategori) {
      for (let i = 2; i < Object.keys(row).length; i++) {
        const namaMenu = row[String(i)];
        if (namaMenu && namaMenu.trim() !== "") {
          await prisma.menu.upsert({
            where: { nama: namaMenu.trim().toLowerCase() },
            update: {},
            create: { nama: namaMenu.trim().toLowerCase(), kategori: kategori },
          });
        }
      }
    }
  }
  console.log("✅ Daftar menu berhasil dimasukkan.");
}

async function seedResep() {
  console.log("🍳 Tahap 3: Membaca semua resep...");
  const recipeFiles = [
    "nasi-putih.csv",
    "protein.csv",
    "sayuran.csv",
    "protein-tambahan.csv",
    "buahSusu.csv",
  ];
  for (const file of recipeFiles) {
    const filePath = path.join(__dirname, `../data/csv/${file}`);
    const rows = await processCsv(filePath, { headers: false });
    let currentRecipeName = null;
    for (const row of rows) {
      const fullLine = Object.values(row).join(",");
      if (fullLine.includes("Receipe Name")) {
        const parts = fullLine.split(":");
        if (parts.length > 1)
          currentRecipeName = parts[1].replace(/,/g, "").trim().toLowerCase();
        continue;
      }
      const isIngredientRow = !isNaN(parseInt(row["0"]));
      const ingredientName = row["1"];
      const quantity = parseFloat(row["3"]);
      if (
        currentRecipeName &&
        isIngredientRow &&
        ingredientName &&
        !isNaN(quantity)
      ) {
        const menu = await prisma.menu.findUnique({
          where: { nama: currentRecipeName },
        });
        const bahan = await prisma.bahan.findUnique({
          where: { nama: ingredientName.trim().toLowerCase() },
        });
        if (menu && bahan) {
          await prisma.resep.create({
            data: { menu_id: menu.id, bahan_id: bahan.id, gramasi: quantity },
          });
        }
      }
    }
  }
  console.log("✅ Semua resep berhasil dihubungkan.");
}

async function main() {
  console.log("--- MENGHAPUS DATA LAMA ---");
  await prisma.resep.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.bahan.deleteMany({});
  console.log("--- MEMULAI PROSES SEEDING ---");
  await seedBahan();
  await seedMenu();
  await seedResep();
  console.log("\n🎉 Seeding selesai!");
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
