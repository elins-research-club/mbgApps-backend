const express = require("express");
const {
  getMenus,
  generateNutrition,
} = require("../controllers/menuController");
const router = express.Router();

// Definisikan alamat API kita
router.get("/menus", getMenus);
router.post("/generate", generateNutrition);

module.exports = router;
