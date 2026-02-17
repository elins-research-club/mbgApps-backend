const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { determineCategory } = require("../controllers/foodCategorization");
// KAMUS ALIAS BAHAN
const stillMissing = [
  "bakso",
  "bumbu kacang/ gado2",
  "bunga lawang",
  "daging patties",
  "daging top side",
  "daun jeruk",
  "garam",
  "green peas",
  "ikan",
  "jintn bubuk",
  "kapulaga",
  "kayu manis",
  "krupuk",
  "krupuk finna",
  "mayonaise",
  "minyak goreng",
  "nika",
  "nugget ayam",
  "otak otak",
  "penyedap",
  "roti burger",
  "saus tiram",
  "saus tomat",
  "saus tomat bakso",
  "saus tomat sachet",
  "tepung roti",
];

const bahanAliasMapping = {
  ayam: "ayam, daging, segar",
  "ayam filet": "ayam, daging, segar",
  "ayam fillet": "ayam, daging, segar",
  "ayam paha fillet": "ayam, daging, segar",
  "ayam patties": "ayam, daging, segar",
  bandeng: "ikan bandeng, segar",
  "bawang goreng": "bawang merah, segar",
  "bawang merah": "bawang merah, segar",
  "bawang putih": "bawang putih, segar",
  "bawang putih bubuk": "bawang putih, segar",
  "blue band": "margarin",
  daging: "sapi, daging, kornet",
  "daun bawang": "daun bawang merah, segar",
  "daun salam": "daun salam, bubuk",
  dori: "ikan patin, segar",
  gula: "gula putih",
  "gula merah": "gula aren",
  "gula pasir": "gula putih",
  "ikan bandeng": "ikan bandeng, segar",
  "ikan dori": "ikan patin, segar",
  jahe: "jahe, segar",
  "kecap abc": "kecap",
  "kecap inggris": "kecap",
  "kecap manis": "kecap",
  kentang: "kentang, segar",
  ketumbar: "ketumbar, kering",
  "ketumbar bubuk": "ketumbar, kering",
  kunyit: "kunyit, segar",
  "kunyit bubuk": "kunyit, segar",
  lengkuas: "boros laja (lengkuas), segar",
  margarine: "margarin",
  merica: "merica, kering",
  selada: "selada, segar",
  tahu: "tahu, mentah",
  tapioka: "tepung singkong/ tapioka",
  telor: "telur ayam ras, segar",
  telur: "telur ayam ras, segar",
  tempe: "tempe kedelai murni, mentah",
  "tepung s biru": "tepung terigu",
  "tepung tapioka": "tepung singkong/ tapioka",
  timun: "ketimun, segar",
  tomat: "tomat merah, segar",
  wijen: "wijen, mentah",
};
function cleanString(str) {
  if (typeof str !== "string") return "";
  // 1. Ganti semua jenis spasi (termasuk yang tak terlihat) dengan spasi biasa
  // 2. Hapus spasi di awal dan akhir
  // 3. Ubah ke huruf kecil
  return str.replace(/\s+/g, " ").trim().toLowerCase();
}

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
      // console.log(row);
      if (cleanString(row["2"]) == "olahan") continue;
      const namaBahan = cleanString(row["3"]); // Gunakan pembersih
      if (!namaBahan) continue;
      const parseValue = (value) =>
        parseFloat(String(value).replace(",", ".")) || 0;
      await prisma.bahan.upsert({
        where: { nama: namaBahan },
        update: {},
        create: {
          nama: namaBahan,
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
          kelompok_makanan: row["26"],
          kategori_makanan: determineCategory(namaBahan, {
            gramasi: 100,
            energi_kkal: parseValue(row["5"]),
            protein_g: parseValue(row["6"]),
            lemak_g: parseValue(row["7"]),
            karbohidrat_g: parseValue(row["8"]),
            serat_g: parseValue(row["9"]),
            natrium_mg: parseValue(row["14"]),
            kalsium_mg: parseValue(row["11"]),
            besi_mg: parseValue(row["13"]),
            vitamin_c_mg: parseValue(row["24"]),
            retinol_mcg: parseValue(row["18"]),
          }),
          isValidated: true,
          validatedBy: "TKPI",
        },
      });
    }
  }
  // Tambahkan alias sebagai baris baru dengan data nutrisi yang sama
  for (const [alias, canonical] of Object.entries(bahanAliasMapping)) {
    const aliasName = cleanString(alias);
    const canonicalName = cleanString(canonical);
    const existingAlias = await prisma.bahan.findUnique({
      where: { nama: aliasName },
    });
    if (!existingAlias) {
      const canonicalBahan = await prisma.bahan.findUnique({
        where: { nama: canonicalName },
      });
      if (canonicalBahan) {
        // Salin data nutrisi
        const {
          energi_kkal,
          protein_g,
          lemak_g,
          karbohidrat_g,
          serat_g,
          abu_g,
          kalsium_mg,
          fosfor_mg,
          besi_mg,
          natrium_mg,
          kalium_mg,
          tembaga_mg,
          seng_mg,
          retinol_mcg,
          b_kar_mcg,
          karoten_total_mcg,
          thiamin_mg,
          riboflavin_mg,
          niasin_mg,
          vitamin_c_mg,
          isValidated,
          validatedBy,
        } = canonicalBahan;
        await prisma.bahan.create({
          data: {
            nama: aliasName,
            energi_kkal,
            protein_g,
            lemak_g,
            karbohidrat_g,
            serat_g,
            abu_g,
            kalsium_mg,
            fosfor_mg,
            besi_mg,
            natrium_mg,
            kalium_mg,
            tembaga_mg,
            seng_mg,
            retinol_mcg,
            b_kar_mcg,
            karoten_total_mcg,
            thiamin_mg,
            riboflavin_mg,
            niasin_mg,
            vitamin_c_mg,
            isValidated,
            validatedBy,
          },
        });
      }
    }
  }
  console.log("✅ Kamus gizi berhasil dimasukkan.");
}

// --- FUNGSI DENGAN PERBAIKAN: MENAMBAHKAN 'return allMenus' ---
async function seedMenu() {
  console.log("🍽 Tahap 2: Membaca daftar menu utama...");
  const allMenus = [];
  const filePath = path.join(__dirname, "../data/csv/menu.csv");
  const records = await processCsv(filePath, { headers: false, skipLines: 1 });
  const kategoriMapping = {
    Karbohidrat: "karbohidrat", // bukan "karbo"
    "Protein hewani": "proteinHewani", // bukan "lauk"
    Sayuran: "sayur",
    "Protein tambahan": "proteinTambahan", // bukan "side_dish"
    Buah: "buah",
  };
  for (const row of records) {
    const kategori = kategoriMapping[row["0"]];
    if (kategori) {
      for (let i = 2; i < Object.keys(row).length; i++) {
        const namaMenu = cleanString(row[String(i)]); // Gunakan pembersih
        if (namaMenu) {
          allMenus.push(namaMenu);
          await prisma.menu.upsert({
            where: { nama: namaMenu },
            update: {},
            create: { nama: namaMenu, kategori: kategori },
          });
        }
      }
    }
  }
  console.log("✅ Daftar menu berhasil dimasukkan.");
  return allMenus;
}

// Fungsi helper untuk menentukan kategori berdasarkan nama file resep
function determineMenuCategory(recipeFileName) {
  if (recipeFileName.includes("nasi-putih")) return "karbohidrat";
  if (recipeFileName.includes("protein.csv")) return "proteinHewani";
  if (recipeFileName.includes("sayuran")) return "sayur";
  if (recipeFileName.includes("protein-tambahan")) return "proteinTambahan";
  if (recipeFileName.includes("buahSusu")) return "buah";
  return "karbohidrat"; 
}

async function seedMenuByBahan() {
  console.log("🍽 Tahap 4: Membuat menu paket dari menu.csv...");
  const filePath = path.join(__dirname, "../data/csv/menu.csv");
  const records = await processCsv(filePath, { headers: false });

  const menus = {}; 
  let currentMenuHeaders = [];
  let categoryIndex = 0;

  for (const row of records) {
    const values = Object.values(row);
    const fullLine = values.join(",");

    const hasMenuHeader = values.some(
      (v) => typeof v === "string" && v.trim().match(/^MENU \d+$/)
    );

    if (hasMenuHeader) {
      currentMenuHeaders = [];
      for (let i = 0; i < values.length; i++) {
        const val = (values[i] || "").trim();
        if (val.match(/^MENU \d+$/)) {
          const menuName = cleanString(val);
          currentMenuHeaders.push({ colIndex: i, menuName });
          if (!menus[menuName]) menus[menuName] = [];
        }
      }
      categoryIndex = 0;
      continue;
    }

    if (
      fullLine.replace(/,/g, "").trim() === "" ||
      fullLine.includes("SPESIFIKASI")
    ) {
      continue;
    }

    if (currentMenuHeaders.length > 0 && categoryIndex < 5) {
      for (const { colIndex, menuName } of currentMenuHeaders) {
        const recipeName = cleanString(row[String(colIndex)] || "");
        if (recipeName) {
          menus[menuName].push(recipeName);
        }
      }
      categoryIndex++;
    }
  }

  let totalMenusCreated = 0;
  let totalBahanLinked = 0;

  for (const [menuName, recipes] of Object.entries(menus)) {
    const combinedMenu = await prisma.menu.upsert({
      where: { nama: menuName },
      update: { kategori: "paket" },
      create: { nama: menuName, kategori: "paket" },
    });
    totalMenusCreated++;

    console.log(`\n  📦 ${menuName}:`);

    for (const recipeName of recipes) {
      const recipeMenu = await prisma.menu.findUnique({
        where: { nama: recipeName },
      });

      if (recipeMenu) {
        const resepEntries = await prisma.resep.findMany({
          where: { menu_id: recipeMenu.id },
          include: { bahan: true },
        });

        for (const entry of resepEntries) {
          await prisma.resep.create({
            data: {
              menu_id: combinedMenu.id,
              bahan_id: entry.bahan_id,
              gramasi: entry.gramasi,
            },
          });
          totalBahanLinked++;
        }
        console.log(
          `    ✓ ${recipeName}: ${resepEntries.length} bahan ditambahkan`
        );
      } else {
        console.log(`    ⚠️  Resep tidak ditemukan di DB: ${recipeName}`);
      }
    }
  }

  console.log(
    `\n✅ ${totalMenusCreated} menu paket dibuat, ${totalBahanLinked} total bahan terhubung.`
  );
  return Object.keys(menus);
}

async function seedResep() {
  console.log("🍳 Tahap 3: Membaca dan menghubungkan semua resep...");
  const recipeFiles = [
    "nasi-putih.csv",
    "protein.csv",
    "sayuran.csv",
    "protein-tambahan.csv",
    "buahSusu.csv",
  ];
  const successfullyLinkedMenus = new Set();
  for (const file of recipeFiles) {
    const filePath = path.join(__dirname, `../data/csv/${file}`);
    const rows = await processCsv(filePath, { headers: false });
    let currentRecipeName = null;
    for (const row of rows) {
      const fullLine = Object.values(row).join(",");
      if (fullLine.includes("Receipe Name")) {
        const parts = fullLine.split(":");
        if (parts.length > 1)
          currentRecipeName = cleanString(parts[1].replace(/,/g, "")); // Gunakan pembersih
        continue;
      }
      const isIngredientRow = !isNaN(parseInt(row["0"]));
      const originalIngredientName = cleanString(row["1"]); // Gunakan pembersih
      const quantity = parseFloat(row["3"]);
      if (
        currentRecipeName &&
        isIngredientRow &&
        originalIngredientName &&
        !isNaN(quantity)
      ) {
        const finalIngredientName =
          bahanAliasMapping[originalIngredientName] || originalIngredientName;
        const menu = await prisma.menu.findUnique({
          where: { nama: currentRecipeName },
        });
        let bahan = await prisma.bahan.findUnique({
          where: { nama: finalIngredientName },
        });
        if (!bahan)
          bahan = await prisma.bahan.findFirst({
            where: { nama: { startsWith: finalIngredientName } },
          });
        if (menu && bahan) {
          await prisma.resep.create({
            data: { menu_id: menu.id, bahan_id: bahan.id, gramasi: quantity },
          });
          successfullyLinkedMenus.add(menu.nama);
        }
      }
    }
  }
  return successfullyLinkedMenus;
}

// TODO: remove olahan from nutrisurvey database
async function parseDataNutrisurvey() {
  const records = [];
  const filePath = path.join(__dirname, `../data/csv/foods_content.csv`);
  // Wrap stream in a Promise so we can await it
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({})) // Use ";" if your CSV uses semicolon
      .on("data", (row) => {
        // still wrong tho, need to get the pattern
        if(row["Code"].startsWith("B") || row["Code"].startsWith("C") || row["Code"].startsWith("D")) return;
        const bahanData = {
          nama: row.Foods || row["Foods"],
          energi_kkal: parseFloat(row.energy) / 4.184 || 0,
          protein_g: parseFloat(row.protein) || 0,
          lemak_g: parseFloat(row.fat) || 0,
          karbohidrat_g: parseFloat(row["carbohydr."]) || 0,
          serat_g: parseFloat(row["dietary fiber"]) || 0,
          abu_g: parseFloat(row.minerals) || 0,
          kalsium_mg: parseFloat(row.calcium) || 0,
          fosfor_mg: parseFloat(row.phosporus) || 0,
          besi_mg: parseFloat(row.iron) || 0,
          natrium_mg: parseFloat(row.sodium) || 0,
          kalium_mg: parseFloat(row.potassium) || 0,
          tembaga_mg: parseFloat(row.copper) || 0,
          seng_mg: parseFloat(row.zinc) || 0,
          retinol_mcg: parseFloat(row.retinol) || 0,
          b_kar_mcg: parseFloat(row.carotene) || 0,
          karoten_total_mcg: parseFloat(row.carotene) || 0,
          thiamin_mg: parseFloat(row.thiamin_mg) || 0,
          riboflavin_mg: parseFloat(row.riboflavin_mg) || 0,
          niasin_mg: parseFloat(row.niacine) || 0,
          vitamin_c_mg: parseFloat(row["Vit. C"]) || 0,
          kelompok_makanan: null,
          kategori_makanan: determineCategory(row.Foods || row["Foods"], {
            gramasi: 100,
            energi_kkal: parseFloat(row["energy"]),
            protein_g: parseFloat(row["protein"]),
            lemak_g: parseFloat(row["fat"]),
            karbohidrat_g: parseFloat(row["carbohydr."]),
            serat_g: parseFloat(row["dietary fiber"]),
            natrium_mg: parseFloat(row["sodium"]),
            kalsium_mg: parseFloat(row["calcium"]),
            besi_mg: parseFloat(row["iron"]),
            vitamin_c_mg: parseFloat(row["Vit. C"]),
            retinol_mcg: parseFloat(row["retinol"]),
          }),
          isValidated: true,
          validatedBy: "www.nutrisurvey.com",
        };
        records.push(bahanData);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  // Upsert each row to avoid duplicates
  for (const row of records) {
    if (!row.nama || row.nama.trim() === "") continue; // skip invalid rows
    await prisma.bahan.upsert({
      where: { nama: row.nama },
      update: row, // update existing record
      create: row, // create new record if not exists
    });
  }

  console.log(`Processed ${records.length} rows from CSV.`);
}

async function main() {
  console.log("--- MENGHAPUS DATA LAMA ---");
  await prisma.resep.deleteMany({});
  await prisma.menu.deleteMany({});
  await prisma.bahan.deleteMany({});
  console.log("--- MEMULAI PROSES SEEDING ---");
  await seedBahan();
  const allMenusInDb = await seedMenu();
  const linkedMenus = await seedResep();
  const paketMenus = await seedMenuByBahan();
  await parseDataNutrisurvey();

  console.log("\n\n--- LAPORAN HASIL SEEDING ---");
  console.log(
    `✅ Total menu individual (resep): ${allMenusInDb.length}`,
  );
  console.log(
    `🔗 Menu individual yang terhubung dengan bahan: ${linkedMenus.size}`,
  );
  console.log(
    `📦 Total menu paket (MENU 1, MENU 2, ...): ${paketMenus.length}`,
  );
  const unlinkedMenus = allMenusInDb.filter((menu) => !linkedMenus.has(menu));
  if (unlinkedMenus.length > 0) {
    console.error(
      `\n❌ DITEMUKAN ${unlinkedMenus.length} MENU YANG RESEPNYA TIDAK ADA:`,
    );
    unlinkedMenus.forEach((menu) => console.log(`  - ${menu}`));
    console.error(
      "\nSOLUSI: Pastikan nama menu di atas sama persis dengan 'Receipe Name' di dalam file CSV resep yang sesuai.",
    );
  } else {
    console.log("🎉 Selamat! Semua menu berhasil terhubung dengan resepnya.");
  }
  console.log("--- -------------------- ---\n");
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
