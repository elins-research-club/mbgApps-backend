// /backend/src/api/routes.js

const express = require("express");
const {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
  createMenu, // <-- 1. TAMBAHKAN 'createMenu' DI SINI
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

// --- 2. TAMBAHKAN RUTE BARU DI SINI ---
router.post("/menu", createMenu); // Endpoint untuk menyimpan resep baru

router.get("/search", searchMenus);
router.post("/suggest-menu-stream", suggestMenuStream);
router.post("/ingredients", addIngredients);
router.post("/ingredients/get-ingredients", getIngredients);
router.get("/ingredients/get-not-validated", getNotValidatedIngredients);
router.put("/ingredients/:id", editIngredientsNutritions);
router.delete("/ingredients/:id", deleteIngredients);
router.get("/ingredients/search", searchIngredients);

module.exports = router;
