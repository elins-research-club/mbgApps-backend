// AKG targets
const goals = {
  1: {
    // TK A
    energi_kkal: 1350,
    protein_g: 20,
    lemak_g: 45,
    karbohidrat_g: 215,
    serat_g: 19,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 500,
    besi_mg: 10,
    natrium_mg: 1000,
    kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    vitamin_c_mg: 45,
  },
  2: {
    // TK B
    energi_kkal: 1400,
    protein_g: 25,
    lemak_g: 50,
    karbohidrat_g: 250,
    serat_g: 20,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 500,
    besi_mg: 10,
    natrium_mg: 1000,
    kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    vitamin_c_mg: 45,
  },
  3: {
    //SD 1
    energi_kkal: 1650,
    protein_g: 40,
    lemak_g: 55,
    karbohidrat_g: 250,
    serat_g: 23,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 500,
    besi_mg: 10,
    natrium_mg: 1000,
    kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    vitamin_c_mg: 45,
  },
  4: {
    // SD 2
    energi_kkal: 1650,
    protein_g: 40,
    lemak_g: 55,
    karbohidrat_g: 250,
    serat_g: 23,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 500,
    besi_mg: 10,
    natrium_mg: 1000,
    kalium_mg: 3200,
    // tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    vitamin_c_mg: 45,
  },
  5: {
    //SD 3
    energi_kkal: 1650,
    protein_g: 40,
    lemak_g: 55,
    karbohidrat_g: 250,
    serat_g: 23,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 500,
    // besi_mg: 10,
    natrium_mg: 1000,
    kalium_mg: 3200,
    tembaga_mg: 570,
    // seng_mg: 5,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.1,
    // niasin_mg: 10,
    vitamin_c_mg: 45,
  },
  6: {
    //SD 4
    energi_kkal: 2000,
    protein_g: 50,
    lemak_g: 65,
    karbohidrat_g: 300,
    serat_g: 28,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 1250,
    besi_mg: 8,
    natrium_mg: 1300,
    kalium_mg: 3900,
    // tembaga_mg: 700,
    // seng_mg: 8,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.3,
    // niasin_mg: 12,
    vitamin_c_mg: 50,
  },
  7: {
    //SD 5
    energi_kkal: 2000,
    protein_g: 50,
    lemak_g: 65,
    karbohidrat_g: 300,
    serat_g: 28,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 1250,
    // besi_mg: 8,
    natrium_mg: 1300,
    kalium_mg: 3900,
    tembaga_mg: 700,
    // seng_mg: 8,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.3,
    // niasin_mg: 12,
    vitamin_c_mg: 50,
  },
  8: {
    //SD 6
    energi_kkal: 2000,
    protein_g: 50,
    lemak_g: 65,
    karbohidrat_g: 300,
    serat_g: 28,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1000,
    // fosfor_mg: 1250,
    // besi_mg: 8,
    natrium_mg: 1300,
    kalium_mg: 3900,
    tembaga_mg: 700,
    // seng_mg: 8,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.1,
    // riboflavin_mg: 1.3,
    // niasin_mg: 12,
    vitamin_c_mg: 50,
  },
  9: {
    // SMP 1
    energi_kkal: 2400,
    protein_g: 70,
    lemak_g: 80,
    karbohidrat_g: 350,
    serat_g: 34,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1200,
    // fosfor_mg: 1250,
    besi_mg: 11,
    natrium_mg: 1500,
    kalium_mg: 4800,
    // tembaga_mg: 795,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    vitamin_c_mg: 75,
  },
  10: {
    //SMP 2
    energi_kkal: 2400,
    protein_g: 70,
    lemak_g: 80,
    karbohidrat_g: 350,
    serat_g: 34,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1200,
    // fosfor_mg: 1250,
    besi_mg: 11,
    natrium_mg: 1500,
    kalium_mg: 4800,
    // tembaga_mg: 795,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    vitamin_c_mg: 75,
  },
  11: {
    //SMP 3
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1200,
    // fosfor_mg: 1250,
    besi_mg: 9,
    natrium_mg: 1700,
    kalium_mg: 5300,
    // tembaga_mg: 890,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    vitamin_c_mg: 90,
  },
  12: {
    //SMA 1
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1200,
    // fosfor_mg: 1250,
    besi_mg: 9,
    natrium_mg: 1700,
    kalium_mg: 5300,
    // tembaga_mg: 890,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    vitamin_c_mg: 90,
  },
  13: {
    //SMA 2
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1200,
    // fosfor_mg: 1250,
    besi_mg: 9,
    natrium_mg: 1700,
    kalium_mg: 5300,
    // tembaga_mg: 890,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    vitamin_c_mg: 90,
  },
  14: {
    //SMA 3
    energi_kkal: 2650,
    protein_g: 75,
    lemak_g: 85,
    karbohidrat_g: 400,
    serat_g: 37,
    // abu_g: 5, // optional, tidak tercantum di AKG resmi
    kalsium_mg: 1200,
    // fosfor_mg: 700,
    besi_mg: 9,
    natrium_mg: 1700,
    kalium_mg: 5300,
    // tembaga_mg: 900,
    // seng_mg: 11,
    // retinol_mcg: 500,
    // b_kar_mcg: 3600,
    // karoten_total_mcg: 4000,
    // thiamin_mg: 1.2,
    // riboflavin_mg: 1.3,
    // niasin_mg: 16,
    vitamin_c_mg: 90,
  },
};

const classNames = {
  1: "TK A",
  2: "TK B",
  3: "SD Kelas 1",
  4: "SD Kelas 2",
  5: "SD Kelas 3",
  6: "SD Kelas 4",
  7: "SD Kelas 5",
  8: "SD Kelas 6",
  9: "SMP Kelas 1",
  10: "SMP Kelas 2",
  11: "SMP Kelas 3",
  12: "SMA Kelas 1",
  13: "SMA Kelas 2",
  14: "SMA Kelas 3",
};

const multipliers = {
  1: 0.2, // TK/PAUD: 20-25% AKG pagi
  2: 0.2, // TK/PAUD: 20-25% AKG pagi
  3: 0.2, // SD kelas 1-3: 20-25% AKG pagi
  4: 0.2, // SD kelas 1-3: 20-25% AKG pagi
  5: 0.2, // SD kelas 1-3: 20-25% AKG pagi
  6: 0.3, // SD kelas 4-6: 30-35% AKG siang
  7: 0.3, // SD kelas 4-6: 30-35% AKG siang
  8: 0.3, // SD kelas 4-6: 30-35% AKG siang
  9: 0.3, // SMP/MTs: 30-35% AKG siang
  10: 0.3, // SMP/MTs: 30-35% AKG siang
  11: 0.3, // SMP/MTs: 30-35% AKG siang
  12: 0.3, // SMA/MA: 30-35% AKG Harian
  13: 0.3, // SMA/MA: 30-35% AKG Harian
  14: 0.3, // SMA/MA: 30-35% AKG Harian
};

const NUTRIENT_LABELS = {
  energi_kkal: "energi",
  protein_g: "protein",
  lemak_g: "lemak",
  karbohidrat_g: "karbohidrat",
  serat_g: "serat",
  // abu_g: "Abu (g)",
  // kalsium_mg: "Kalsium (mg)",
  // fosfor_mg: "Fosfor (mg)",
  // besi_mg: "Besi (mg)",
  // natrium_mg: "Natrium (mg)",
  // kalium_mg: "Kalium (mg)",
  // tembaga_mg: "Tembaga (mg)",
  // seng_mg: "Seng (mg)",
  // retinol_mcg: "Retinol (mcg)",
  // b_kar_mcg: "Beta-Karoten (mcg)",
  // karoten_total_mcg: "Karoten Total (mcg)",
  // thiamin_mg: "Thiamin (mg)",
  // riboflavin_mg: "Riboflavin (mg)",
  // niasin_mg: "Niasin (mg)",
  // vitamin_c_mg: "Vitamin C (mg)",
};

const weight_map = {
  // Energy: Moderate penalties - slight deficit OK, excess leads to weight gain
  energi_kkal: { under: 3, over: 5 },

  // Protein: HIGH penalty for under, low for over - critical for body function
  // Most people struggle to get enough protein
  protein_g: { under: 10, over: 1 },

  // Carbs: Moderate under penalty, higher over penalty - excess stored as fat
  karbohidrat_g: { under: 5, over: 10 },

  // Fat: Balanced but prefer slight deficit - calorie dense
  lemak_g: { under: 3, over: 6 },

  // Fiber: HIGH penalty for under - most people don't get enough
  // Can't really "over-consume" fiber from whole foods
  serat_g: { under: 5, over: 1 },

  // Micronutrients (if you add them later)
  // vitamin_c: { under: 5, over: 1 },
  // kalsium_mg: { under: 8, over: 2 },
  // zat_besi_mg: { under: 10, over: 3 },

  default: { under: 3, over: 2 },
};

const category_max_portion = {
  protein_lean: 150,
  protein_fatty: 120,
  carb_high_fiber: 180,
  carb_refined: 200,
  vegetable_leafy: 120,
  vegetable_other: 150,
  fruit: 150,
  legume: 120,
  dairy: 200,
  mixed: 100,
};

module.exports = { goals, multipliers };
