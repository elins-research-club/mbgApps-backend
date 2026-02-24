// ============================================================
// OPTIMAL CATEGORIZATION: Use ALL available data
// ============================================================

function determineCategory(name, data) {
  const nameLower = name.toLowerCase();

  // Extract ALL nutrition values (per 100g for consistency)
  const gramasi = data.gramasi || 100;
  const per100g = {
    energy: ((data.energi_kkal || 0) / gramasi) * 100,
    protein: ((data.protein_g || 0) / gramasi) * 100,
    carbs: ((data.karbohidrat_g || 0) / gramasi) * 100,
    fat: ((data.lemak_g || 0) / gramasi) * 100,
    fiber: ((data.serat_g || 0) / gramasi) * 100,

    // Additional nutrients for better categorization
    sodium: ((data.natrium_mg || 0) / gramasi) * 100,
    calcium: ((data.kalsium_mg || 0) / gramasi) * 100,
    iron: ((data.besi_mg || 0) / gramasi) * 100,
    vitaminC: ((data.vitamin_c_mg || 0) / gramasi) * 100,
    retinol: ((data.retinol_mcg || 0) / gramasi) * 100,
  };

  // ============================================================
  // PRIORITY 1: EXCLUDE NON-MAIN FOODS (for LP filtering)
  // ============================================================

  // CATEGORY: CONDIMENTS/SEASONINGS
  // High sodium is the strongest indicator
  if (
    per100g.sodium > 800 || // Very high sodium
    (per100g.sodium > 400 && per100g.energy < 100) || // High sodium + low energy
    isCondimentKeyword(nameLower)
  ) {
    return "condiment"; // EXCLUDE from LP
  }

  // CATEGORY: OILS/FATS
  // Pure fats are unrealistic in large portions
  if (
    per100g.fat > 70 ||
    (per100g.fat > 50 && per100g.energy > 700) ||
    isOilKeyword(nameLower)
  ) {
    return "oil"; // EXCLUDE from LP
  }

  // CATEGORY: SUGARS/SWEETENERS
  // Pure carbs with very high energy density
  if (per100g.carbs > 90 && per100g.protein < 2 && per100g.fat < 2) {
    return "sugar"; // EXCLUDE from LP
  }

  // CATEGORY: RAW INGREDIENTS (flour, raw grains, etc.)
  // These are not ready to eat
  if (isRawIngredientKeyword(nameLower)) {
    return "raw_ingredient"; // EXCLUDE from LP
  }

  // CATEGORY: BEVERAGES
  // Usually not solid food recommendations
  if (isBeverageKeyword(nameLower) || (per100g.energy < 100 && gramasi < 50)) {
    return "beverage"; // EXCLUDE from LP
  }

  // ============================================================
  // PRIORITY 2: KEYWORD-BASED CATEGORIZATION (Most Reliable)
  // Check name keywords FIRST before nutrition-based rules
  // ============================================================

  // CARBS: Check for rice, noodles, bread keywords first
  if (isCarbKeyword(nameLower)) {
    if (
      per100g.fiber > 3 ||
      nameLower.includes("merah") ||
      nameLower.includes("coklat")
    ) {
      return "carb_high_fiber"; // Brown rice, whole wheat
    }
    return "carb_refined"; // White rice, white bread
  }

  // VEGETABLES: Check for vegetable keywords
  if (isVegetableKeyword(nameLower)) {
    if (
      per100g.iron > 1.5 ||
      per100g.calcium > 100 ||
      nameLower.includes("hijau")
    ) {
      return "vegetable_leafy";
    }
    return "vegetable_other";
  }

  // FRUITS: Check for fruit keywords
  if (isFruitKeyword(nameLower)) {
    return "fruit";
  }

  // PROTEIN: Check for protein source keywords
  if (isProteinKeyword(nameLower)) {
    if (per100g.fat > 15) {
      return "protein_fatty";
    }
    return "protein_lean";
  }

  // ============================================================
  // PRIORITY 3: NUTRITION-BASED CATEGORIZATION (Fallback)
  // Only use if keywords didn't match
  // ============================================================

  // CATEGORY: PROTEIN SOURCES (Animal & Plant)
  // High protein is key indicator
  if (per100g.protein > 15) {
    if (per100g.fat > 15) {
      return "protein_fatty"; // Meat, fatty fish
    }
    return "protein_lean"; // Chicken breast, white fish, tofu
  }

  // CATEGORY: CARBOHYDRATE SOURCES
  // HIGH ENERGY + HIGH CARBS = Staple food (rice, bread, potatoes)
  // This catches things like "nasi merah" if keyword check missed it
  if (per100g.carbs > 50 && per100g.energy > 300 && per100g.protein < 15) {
    if (per100g.fiber > 3) {
      return "carb_high_fiber"; // Whole grains, sweet potato
    }
    return "carb_refined"; // White rice, white bread
  }

  // CATEGORY: VEGETABLES
  // LOW ENERGY + LOW CARBS = Vegetables
  if (per100g.energy < 100 && per100g.carbs < 20 && per100g.protein < 5) {
    // Green leafy vegetables (high iron, calcium, vitamin C)
    if (per100g.iron > 1.5 || per100g.calcium > 100 || per100g.vitaminC > 20) {
      return "vegetable_leafy"; // Spinach, kale, kangkung
    }

    return "vegetable_other"; // Carrots, tomatoes, etc.
  }

  // CATEGORY: FRUITS
  // MODERATE CARBS + LOW ENERGY = Fruits (but not as high as rice/grains)
  if (
    per100g.carbs > 10 &&
    per100g.carbs < 50 &&
    per100g.protein < 3 &&
    per100g.energy < 200
  ) {
    return "fruit";
  }

  // CATEGORY: LEGUMES
  // Both protein and carbs, high fiber
  if (per100g.protein > 8 && per100g.carbs > 20 && per100g.fiber > 5) {
    return "legume"; // Beans, lentils, chickpeas
  }

  // CATEGORY: DAIRY
  // Moderate protein, calcium, often from name
  if (
    (per100g.protein > 5 && per100g.calcium > 100) ||
    isDairyKeyword(nameLower)
  ) {
    return "dairy";
  }

  // CATEGORY: NUTS/SEEDS
  // High fat, moderate protein, high energy
  if (per100g.fat > 30 && per100g.protein > 10 && per100g.energy > 400) {
    return "nuts_seeds";
  }

  // DEFAULT: Mixed/Processed Food
  if (per100g.energy > 30) {
    return "mixed"; // Include but with lower priority
  }

  return "unknown"; // EXCLUDE if we can't categorize
}

// ============================================================
// HELPER FUNCTIONS: Keyword Detection
// ============================================================

// ============================================================
// HELPER FUNCTIONS: Keyword Detection
// ============================================================

function isCarbKeyword(name) {
  const keywords = [
    // Rice
    "nasi",
    "rice",
    "beras",

    // Noodles
    "mie",
    "mee",
    "noodle",
    "pasta",
    "bihun",
    "soun",
    "kwetiau",

    // Bread & wheat products
    "roti",
    "bread",
    "gandum",
    "wheat",
    "tepung",

    // Potatoes & tubers
    "kentang",
    "potato",
    "ubi",
    "singkong",
    "cassava",
    "talas",

    // Other carb sources
    "jagung",
    "corn",
    "oat",
    "haver",
    "sereal",
    "cereal",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isVegetableKeyword(name) {
  const keywords = [
    // Leafy greens
    "bayam",
    "spinach",
    "kangkung",
    "sawi",
    "kale",
    "selada",
    "lettuce",
    "daun singkong",
    "daun pepaya",
    "daun katuk",

    // Common vegetables
    "wortel",
    "carrot",
    "tomat",
    "tomato",
    "terong",
    "eggplant",
    "brokoli",
    "broccoli",
    "kembang kol",
    "cauliflower",
    "buncis",
    "bean",
    "kacang panjang",
    "long bean",
    "labu",
    "pumpkin",
    "zucchini",
    "timun",
    "cucumber",
    "paprika",
    "pepper",
    "cabai" + " besar", // cabai besar (not sambal)
    "pare",
    "bitter melon",
    "oyong",
    "gambas",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isFruitKeyword(name) {
  const keywords = [
    "apel",
    "apple",
    "jeruk",
    "orange",
    "pisang",
    "banana",
    "mangga",
    "mango",
    "pepaya",
    "papaya",
    "semangka",
    "watermelon",
    "melon",
    "anggur",
    "grape",
    "strawberry",
    "stroberi",
    "nanas",
    "pineapple",
    "jambu",
    "guava",
    "salak",
    "rambutan",
    "manggis",
    "mangosteen",
    "durian",
    "alpukat",
    "avocado",
    "kelengkeng",
    "longan",
    "pir",
    "pear",
    "kiwi",
    "belimbing",
    "starfruit",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isProteinKeyword(name) {
  const keywords = [
    // Meat
    "daging",
    "meat",
    "sapi",
    "beef",
    "kambing",
    "goat",
    "ayam",
    "chicken",
    "bebek",
    "duck",

    // Fish & seafood
    "ikan",
    "fish",
    "tuna",
    "salmon",
    "kakap",
    "gurame",
    "udang",
    "shrimp",
    "cumi",
    "squid",
    "kerang",
    "shellfish",

    // Eggs
    "telur",
    "egg",

    // Soy products
    "tempe",
    "tempeh",
    "tahu",
    "tofu",
    "kedelai",
    "soybean",

    // Other protein
    "kacang", // will be refined by legume check
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isCondimentKeyword(name) {
  const keywords = [
    // Spices & seasonings
    "garam",
    "salt",
    "merica",
    "lada",
    "pepper",
    "bawang",
    "onion",
    "garlic",
    "jahe",
    "ginger",
    "kunyit",
    "turmeric",
    "lengkuas",
    "galangal",
    "serai",
    "lemongrass",
    "daun salam",
    "bay leaf",
    "daun jeruk",
    "lime leaf",
    "pandan",

    // Sauces & condiments (but NOT foods containing them)
    "kecap",
    "soy sauce",
    "sambal",
    "saos",
    "sauce",
    "terasi",
    "shrimp paste",
    "petis",
    "msg",
    "penyedap",
    "kaldu",
    "stock",
    "bumbu",

    // Processed seasonings
    "rempah",
    "spice",
    "masako",
    "royco",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isOilKeyword(name) {
  const keywords = [
    "minyak",
    "oil",
    "mentega",
    "butter",
    "margarin",
    "margarine",
    "lemak",
    "fat",
    "shortening",
    "lard",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isBeverageKeyword(name) {
  const keywords = [
    "jus",
    "juice",
    "susu",
    "milk",
    "teh",
    "tea",
    "kopi",
    "coffee",
    "minuman",
    "drink",
    "air",
    "water",
    "soda",
    "sirup",
    "syrup",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isDairyKeyword(name) {
  const keywords = [
    "susu",
    "milk",
    "keju",
    "cheese",
    "yogurt",
    "yoghurt",
    "krim",
    "cream",
  ];
  return keywords.some((kw) => name.includes(kw));
}

function isRawIngredientKeyword(name) {
  const keywords = [
    // Flours & powders
    "tepung",
    "flour",
    "powder",

    // Raw grains
    "beras mentah",
    "raw rice",
    "gabah",

    // Raw beans/legumes (not cooked)
    "kedelai mentah",
    "raw soybean",
    "kacang mentah",
    "raw bean",

    // Baking ingredients
    "ragi",
    "yeast",
    "soda kue",
    "baking soda",
    "baking powder",
    "pengembang",

    // Other raw ingredients
    "agar-agar",
    "gelatin",
    "pati",
    "starch",
    "tapioka",
    "tapioca",
    "maizena",
    "cornstarch",
  ];
  return keywords.some((kw) => name.includes(kw));
}

// ============================================================
// FILTERING FOR LP: Only use main food categories
// ============================================================

function isMainFoodCategory(category) {
  const mainCategories = [
    "protein_lean",
    "protein_fatty",
    "carb_high_fiber",
    "carb_refined",
    "vegetable_leafy",
    "vegetable_other",
    "fruit",
    "legume",
    "dairy",
    "mixed",
  ];
  return mainCategories.includes(category);
}

// Categories that should be EXCLUDED from recommendations
function isExcludedCategory(category) {
  const excludedCategories = [
    "condiment",
    "oil",
    "sugar",
    "beverage",
    "raw_ingredient", // NEW: exclude raw ingredients
    "nuts_seeds", // Optional: often used as snacks, not meal components
    "unknown",
  ];
  return excludedCategories.includes(category);
}

function filterForLP(allFoods) {
  return Object.fromEntries(
    Object.entries(allFoods).filter(([name, data]) => {
      // Must have valid category
      if (!data.kategori_makanan) return false;

      // Must NOT be in excluded categories
      if (isExcludedCategory(data.kategori_makanan)) return false;

      // Must be a main food category
      if (!isMainFoodCategory(data.kategori_makanan)) return false;

      // Additional safety checks
      const gramasi = data.gramasi || 100;
      const energyPer100g = ((data.energi_kkal || 0) / gramasi) * 100;

      // Must have reasonable energy density
      if (energyPer100g < 20) return false;

      // Must have reasonable portion size
      if (gramasi < 10 || gramasi > 2000) return false;

      return true;
    }),
  );
}

// ============================================================
// ANALYSIS TOOLS: Review your categorization
// ============================================================

function analyzeCategorization(foods) {
  const report = {
    total: 0,
    byCategory: {},
    mainFoodCount: 0,
    excludedCount: 0,
  };

  for (const [name, data] of Object.entries(foods)) {
    report.total++;
    const category = data.kategori_makanan || "uncategorized";

    if (!report.byCategory[category]) {
      report.byCategory[category] = {
        count: 0,
        examples: [],
      };
    }

    report.byCategory[category].count++;
    if (report.byCategory[category].examples.length < 5) {
      report.byCategory[category].examples.push(name);
    }

    if (isMainFoodCategory(category)) {
      report.mainFoodCount++;
    } else {
      report.excludedCount++;
    }
  }

  console.log("=== CATEGORIZATION REPORT ===");
  console.log(`Total foods: ${report.total}`);
  console.log(
    `Main foods (for LP): ${report.mainFoodCount} (${((report.mainFoodCount / report.total) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Excluded foods: ${report.excludedCount} (${((report.excludedCount / report.total) * 100).toFixed(1)}%)`,
  );
  console.log("\nBy Category:");

  for (const [category, info] of Object.entries(report.byCategory)) {
    const isMain = isMainFoodCategory(category) ? "✓ INCLUDE" : "✗ EXCLUDE";
    console.log(`\n${category} [${isMain}]: ${info.count} foods`);
    console.log(`  Examples: ${info.examples.join(", ")}`);
  }

  return report;
}

module.exports = {
  determineCategory,
  isMainFoodCategory,
  filterForLP,
  analyzeCategorization,
};

