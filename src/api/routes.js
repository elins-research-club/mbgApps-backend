// /backend/src/api/routes.js

const express = require("express");
const {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
} = require("../controllers/menuController");
const { suggestMenuStream } = require("../controllers/streamController");
const { getIngredients, getNotValidatedIngredients, editIngredientsNutritions, deleteIngredients, addIngredients } = require("../controllers/ingredientController")

const router = express.Router();

router.get("/menus", getMenus); // Bisa dihapus nanti, tapi biarkan dulu
router.post("/generate", generateNutrition);
router.post("/suggest-menu", suggestMenu);

router.get("/search", searchMenus);
router.post("/suggest-menu-stream", suggestMenuStream);
router.post("/ingredients", addIngredients);
router.post("/ingredients/get-ingredients", getIngredients); // POST bcz we need the name in req.body
router.get("/ingredients/get-not-validated", getNotValidatedIngredients);
router.put("/ingredients/:id", editIngredientsNutritions);
router.delete("/ingredients/:id", deleteIngredients);

module.exports = router;
