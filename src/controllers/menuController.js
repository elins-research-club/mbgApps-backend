// /backend/src/controllers/menuController.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getMenus = async (req, res) => {
  try {
    const allProducts = await prisma.produkPangan.findMany({
      orderBy: { nama: "asc" },
    });

    const groupedProducts = allProducts.reduce(
      (acc, product) => {
        const { kategori, id, nama } = product;
        if (acc[kategori]) {
          acc[kategori].push({ id, nama });
        }
        return acc;
      },
      { karbo: [], lauk: [], sayur: [], side_dish: [], buah: [] }
    ); // DIUBAH

    res.status(200).json(groupedProducts);
  } catch (error) {
    console.error("Error saat mengambil produk pangan:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

const generateNutrition = async (req, res) => {
  try {
    // Ubah nama properti dari nasi_id menjadi karbo_id
    const { karbo_id, lauk_id, sayur_id, side_dish_id, buah_id } = req.body;
    const selectedIds = [
      karbo_id,
      lauk_id,
      sayur_id,
      side_dish_id,
      buah_id,
    ].map((id) => parseInt(id));

    const selectedProducts = await prisma.produkPangan.findMany({
      where: { id: { in: selectedIds } },
    });

    let totalGizi = {
      energi_total_kkal: 0,
      protein_g: 0,
      lemak_g: 0,
      karbohidrat_total_g: 0,
    };

    selectedProducts.forEach((product) => {
      totalGizi.energi_total_kkal += product.energi_kkal || 0;
      totalGizi.protein_g += product.protein_g || 0;
      totalGizi.lemak_g += product.lemak_g || 0;
      totalGizi.karbohidrat_total_g += product.karbohidrat_g || 0;
    });

    const response = {
      takaran_saji_g: 100 * selectedProducts.length,
      informasi_nilai_gizi: {
        energi_total_kkal: parseFloat(totalGizi.energi_total_kkal.toFixed(1)),
        energi_dari_lemak_kkal: parseFloat((totalGizi.lemak_g * 9).toFixed(1)),
        lemak_total_g: parseFloat(totalGizi.lemak_g.toFixed(1)),
        protein_g: parseFloat(totalGizi.protein_g.toFixed(1)),
        karbohidrat_total_g: parseFloat(
          totalGizi.karbohidrat_total_g.toFixed(1)
        ),
        natrium_mg: 0,
      },
      persen_akg: {
        lemak_total: `${Math.round((totalGizi.lemak_g / 67) * 100)}%`,
        protein: `${Math.round((totalGizi.protein_g / 60) * 100)}%`,
        karbohidrat_total: `${Math.round(
          (totalGizi.karbohidrat_total_g / 300) * 100
        )}%`,
        natrium: "0%",
      },
      detail_menu_terpilih: selectedProducts.map((p) => ({
        kategori: p.kategori,
        nama: p.nama,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error saat generate nutrisi:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

module.exports = {
  getMenus,
  generateNutrition,
};
