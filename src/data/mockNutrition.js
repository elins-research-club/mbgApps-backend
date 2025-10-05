const mockNutritionResult = {
  takaran_saji_g: 350,
  jumlah_sajian_per_kemasan: 1,
  informasi_nilai_gizi: {
    energi_total_kkal: 580.7,
    energi_dari_lemak_kkal: 155.2,
    lemak_total_g: 17.2,
    lemak_jenuh_g: 4.5,
    kolesterol_mg: 75,
    protein_g: 25.8,
    karbohidrat_total_g: 78.3,
    serat_pangan_g: 8.1,
    gula_g: 15.4,
    natrium_mg: 450.6,
  },
  persen_akg: {
    lemak_total: "26%",
    protein: "43%",
    karbohidrat_total: "26%",
    natrium: "19%",
  },
  detail_menu_terpilih: [
    { kategori: "Nasi", nama: "Nasi Putih", gramasi: 100 },
    { kategori: "Lauk", nama: "Ayam saus mentega", gramasi: 100 },
    { kategori: "Sayur", nama: "kacang panjang tumis", gramasi: 50 },
    { kategori: "Side Dish", nama: "tahu goreng tepung", gramasi: 40 },
    { kategori: "Buah", nama: "Pisang", gramasi: 60 },
  ],
};

module.exports = mockNutritionResult;
