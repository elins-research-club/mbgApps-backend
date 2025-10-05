// /backend/src/controllers/menuController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getMenus = async (req, res) => {
  try {
    const allMenus = await prisma.menu.findMany({ orderBy: { nama: "asc" } });
    const groupedMenus = allMenus.reduce(
      (acc, menu) => {
        if (acc[menu.kategori])
          acc[menu.kategori].push({ id: menu.id, nama: menu.nama });
        return acc;
      },
      { karbo: [], lauk: [], sayur: [], side_dish: [], buah: [] }
    );
    res.status(200).json(groupedMenus);
  } catch (error) {
    console.error("Error saat mengambil menu:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const generateNutrition = async (req, res) => {
  try {
    const { karbo_id, lauk_id, sayur_id, side_dish_id, buah_id } = req.body;
    const selectedIds = [karbo_id, lauk_id, sayur_id, side_dish_id, buah_id]
      .filter((id) => id)
      .map((id) => parseInt(id));
    if (selectedIds.length === 0)
      return res.status(400).json({ message: "Tidak ada menu yang dipilih." });

    const recipes = await prisma.resep.findMany({
      where: { menu_id: { in: selectedIds } },
      include: { bahan: true },
    });

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

    recipes.forEach((resep) => {
      const { gramasi, bahan } = resep;
      if (!bahan) return;
      totalGramasi += gramasi;
      const ratio = gramasi / 100;
      for (const key in totalGizi) {
        if (bahan[key] !== null && bahan[key] !== undefined) {
          totalGizi[key] += (bahan[key] || 0) * ratio;
        }
      }
    });

    for (const key in totalGizi)
      totalGizi[key] = parseFloat(totalGizi[key].toFixed(2));

    const calculateAkg = (value, dailyValue) => {
      if (!dailyValue || !value) return "0%";
      const percentage = (value / dailyValue) * 100;
      if (percentage > 0 && percentage < 1) return "<1%";
      return `${Math.round(percentage)}%`;
    };

    const response = {
      takaran_saji_g: parseFloat(totalGramasi.toFixed(2)),
      informasi_nilai_gizi: {
        ...totalGizi,
        energi_dari_lemak_kkal: parseFloat((totalGizi.lemak_g * 9).toFixed(2)),
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
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error saat generate nutrisi:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getMenus, generateNutrition };
