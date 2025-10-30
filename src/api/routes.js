// /backend/src/api/routes.js

const express = require("express");
const {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
  createMenu,
  saveCompositionMenu,
  getMenuNutritionByIdHandler, // ✅ BARU: Import route handler untuk get menu by ID
} = require("../controllers/menuController");
const { suggestMenuStream } = require("../controllers/streamController");
const {
  getIngredients,
  getNotValidatedIngredients,
  editIngredientsNutritions,
  deleteIngredients,
  addIngredients,
  searchIngredients,
} = require("../controllers/ingredientController");

const router = express.Router();

router.get("/menus", getMenus);
router.post("/generate", generateNutrition);
router.post("/suggest-menu", suggestMenu);

// --- TAMBAHAN: Route untuk get nutrition by menu ID ---
router.get("/menu/:id", getMenuNutritionByIdHandler); // ✅ BARU: Endpoint untuk get menu by ID

router.post("/menu", createMenu); // Endpoint untuk menyimpan resep baru
router.post("/menu/composition", saveCompositionMenu);
router.get("/search", searchMenus);
router.post("/suggest-menu-stream", suggestMenuStream);
router.post("/ingredients", addIngredients);
router.post("/ingredients/get-ingredients", getIngredients);
router.get("/ingredients/get-not-validated", getNotValidatedIngredients);
router.put("/ingredients/:id", editIngredientsNutritions);
router.delete("/ingredients/:id", deleteIngredients);
router.get("/ingredients/search", searchIngredients);

module.exports = router;
