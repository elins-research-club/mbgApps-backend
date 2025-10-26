const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// KAMUS ALIAS BAHAN
const stillMissing = [
  'bakso',
  'bumbu kacang/ gado2',
  'bunga lawang',
  'daging patties',
  'daging top side',
  'daun jeruk',
  'garam',
  'green peas',
  'ikan',
  'jintn bubuk',
  'kapulaga',
  'kayu manis',
  'krupuk',
  'krupuk finna',
  'mayonaise',
  'minyak goreng',
  'nika',
  'nugget ayam',
  'otak otak',
  'penyedap',
  'roti burger',
  'saus tiram',
  'saus tomat',
  'saus tomat bakso',
  'saus tomat sachet',
  'tepung roti'
]
const bahanAliasMapping = {
  'ayam': 'ayam, daging, segar',
  'ayam filet': 'ayam, daging, segar',
  'ayam fillet': 'ayam, daging, segar',
  'ayam paha fillet': 'ayam, daging, segar',
  'ayam patties': 'ayam, daging, segar',
  'bandeng': 'ikan bandeng, segar',
  'bawang goreng': 'bawang merah, segar',
  'bawang merah': 'bawang merah, segar',
  'bawang putih': 'bawang putih, segar',
  'bawang putih bubuk': 'bawang putih, segar',
  'blue band': 'margarin',
  'daging': 'sapi, daging, kornet',
  'daun bawang': 'daun bawang merah, segar',
  'daun salam': 'daun salam, bubuk',
  'dori': 'ikan patin, segar',
  'gula': 'gula putih',
  'gula merah': 'gula aren',
  'gula pasir': 'gula putih',
  'ikan bandeng': 'ikan bandeng, segar',
  'ikan dori': 'ikan patin, segar',
  'jahe': 'jahe, segar',
  'kecap abc': 'kecap',
  'kecap inggris': 'kecap',
  'kecap manis': 'kecap',
  'kentang': 'kentang, segar',
  'ketumbar': 'ketumbar, kering',
  'ketumbar bubuk': 'ketumbar, kering',
  'kunyit': 'kunyit, segar',
  'kunyit bubuk': 'kunyit, segar',
  'lengkuas': 'boros laja (lengkuas), segar',
  'margarine': 'margarin',
  'merica': 'merica, kering',
  'selada': 'selada, segar',
  'tahu': 'tahu, mentah',
  'tapioka': 'tepung singkong/ tapioka',
  'telor': 'telur ayam ras, segar',
  'telur': 'telur ayam ras, segar',
  'tempe': 'tempe kedelai murni, mentah',
  'tepung s biru': 'tepung terigu',
  'tepung tapioka': 'tepung singkong/ tapioka',
  'timun': 'ketimun, segar',
  'tomat': 'tomat merah, segar',
  'wijen': 'wijen, mentah'
}
function cleanString (str) {
  if (typeof str !== 'string') return ''
  // 1. Ganti semua jenis spasi (termasuk yang tak terlihat) dengan spasi biasa
  // 2. Hapus spasi di awal dan akhir
  // 3. Ubah ke huruf kecil
  return str.replace(/\s+/g, ' ').trim().toLowerCase()
}

function processCsv (filePath, options = {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath))
      return reject(new Error(`File tidak ditemukan: ${filePath}`))
    const results = []
    fs.createReadStream(filePath)
      .pipe(csv(options))
      .on('data', data => results.push(data))
      .on('end', () => resolve(results))
      .on('error', error => reject(error))
  })
}

async function seedBahan () {
  console.log('📚 Tahap 1: Membaca kamus gizi...')
  const nutritionFiles = [
    'bahan-gizi-1.csv',
    'bahan-gizi-2.csv',
    'bahan-gizi-3.csv'
  ]
  for (const file of nutritionFiles) {
    const filePath = path.join(__dirname, `../data/csv/${file}`)
    const records = await processCsv(filePath, {
      separator: ';',
      headers: false,
      skipLines: 1
    })
    for (const row of records) {
      const namaBahan = cleanString(row['3']) // Gunakan pembersih
      if (!namaBahan) continue
      const parseValue = value =>
        parseFloat(String(value).replace(',', '.')) || 0
      await prisma.bahan.upsert({
        where: { nama: namaBahan },
        update: {},
        create: {
          nama: namaBahan,
          energi_kkal: parseValue(row['5']),
          protein_g: parseValue(row['6']),
          lemak_g: parseValue(row['7']),
          karbohidrat_g: parseValue(row['8']),
          serat_g: parseValue(row['9']),
          abu_g: parseValue(row['10']),
          kalsium_mg: parseValue(row['11']),
          fosfor_mg: parseValue(row['12']),
          besi_mg: parseValue(row['13']),
          natrium_mg: parseValue(row['14']),
          kalium_mg: parseValue(row['15']),
          tembaga_mg: parseValue(row['16']),
          seng_mg: parseValue(row['17']),
          retinol_mcg: parseValue(row['18']),
          b_kar_mcg: parseValue(row['19']),
          karoten_total_mcg: parseValue(row['20']),
          thiamin_mg: parseValue(row['21']),
          riboflavin_mg: parseValue(row['22']),
          niasin_mg: parseValue(row['23']),
          vitamin_c_mg: parseValue(row['24'])
          isValidated: true,
        }
      })
    }
  }
  console.log('✅ Kamus gizi berhasil dimasukkan.')
}

// --- FUNGSI DENGAN PERBAIKAN: MENAMBAHKAN 'return allMenus' ---
async function seedMenu () {
  console.log('🍽️ Tahap 2: Membaca daftar menu utama...')
  const allMenus = []
  const filePath = path.join(__dirname, '../data/csv/menu.csv')
  const records = await processCsv(filePath, { headers: false, skipLines: 1 })
  const kategoriMapping = {
    Karbohidrat: 'karbo',
    'Protein hewani': 'lauk',
    Sayuran: 'sayur',
    'Protein tambahan': 'side_dish',
    Buah: 'buah'
  }
  for (const row of records) {
    const kategori = kategoriMapping[row['0']]
    if (kategori) {
      for (let i = 2; i < Object.keys(row).length; i++) {
        const namaMenu = cleanString(row[String(i)]) // Gunakan pembersih
        if (namaMenu) {
          allMenus.push(namaMenu)
          await prisma.menu.upsert({
            where: { nama: namaMenu },
            update: {},
            create: { nama: namaMenu, kategori: kategori }
          })
        }
      }
    }
  }
  console.log('✅ Daftar menu berhasil dimasukkan.')
  return allMenus
}

async function seedResep () {
  console.log('🍳 Tahap 3: Membaca dan menghubungkan semua resep...')
  const recipeFiles = [
    'nasi-putih.csv',
    'protein.csv',
    'sayuran.csv',
    'protein-tambahan.csv',
    'buahSusu.csv'
  ]
  const successfullyLinkedMenus = new Set()
  for (const file of recipeFiles) {
    const filePath = path.join(__dirname, `../data/csv/${file}`)
    const rows = await processCsv(filePath, { headers: false })
    let currentRecipeName = null
    for (const row of rows) {
      const fullLine = Object.values(row).join(',')
      if (fullLine.includes('Receipe Name')) {
        const parts = fullLine.split(':')
        if (parts.length > 1)
          currentRecipeName = cleanString(parts[1].replace(/,/g, '')) // Gunakan pembersih
        continue
      }
      const isIngredientRow = !isNaN(parseInt(row['0']))
      const originalIngredientName = cleanString(row['1']) // Gunakan pembersih
      const quantity = parseFloat(row['3'])
      if (
        currentRecipeName &&
        isIngredientRow &&
        originalIngredientName &&
        !isNaN(quantity)
      ) {
        const finalIngredientName =
          bahanAliasMapping[originalIngredientName] || originalIngredientName
        const menu = await prisma.menu.findUnique({
          where: { nama: currentRecipeName }
        })
        let bahan = await prisma.bahan.findUnique({
          where: { nama: finalIngredientName }
        })
        if (!bahan)
          bahan = await prisma.bahan.findFirst({
            where: { nama: { startsWith: finalIngredientName } }
          })
        if (menu && bahan) {
          await prisma.resep.create({
            data: { menu_id: menu.id, bahan_id: bahan.id, gramasi: quantity }
          })
          successfullyLinkedMenus.add(menu.nama)
        }
      }
    }
  }
  return successfullyLinkedMenus
}

async function main () {
  console.log('--- MENGHAPUS DATA LAMA ---')
  await prisma.resep.deleteMany({})
  await prisma.menu.deleteMany({})
  await prisma.bahan.deleteMany({})
  console.log('--- MEMULAI PROSES SEEDING ---')
  await seedBahan()
  const allMenusInDb = await seedMenu()
  const linkedMenus = await seedResep()

  console.log('\n\n--- LAPORAN HASIL SEEDING ---')
  console.log(
    `✅ Total menu di daftar utama (menu.csv): ${allMenusInDb.length}`
  )
  console.log(
    `🔗 Total menu yang berhasil terhubung dengan resep: ${linkedMenus.size}`
  )
  const unlinkedMenus = allMenusInDb.filter(menu => !linkedMenus.has(menu))
  if (unlinkedMenus.length > 0) {
    console.error(
      `\n❌ DITEMUKAN ${unlinkedMenus.length} MENU YANG RESEPNYA TIDAK ADA:`
    )
    unlinkedMenus.forEach(menu => console.log(`  - ${menu}`))
    console.error(
      "\nSOLUSI: Pastikan nama menu di atas sama persis dengan 'Receipe Name' di dalam file CSV resep yang sesuai."
    )
  } else {
    console.log('🎉 Selamat! Semua menu berhasil terhubung dengan resepnya.')
  }
  console.log('--- -------------------- ---\n')
}

main()
  .catch(e => {
    console.error('❌ Terjadi error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('--- KONEKSI DATABASE DITUTUP ---')
  })
