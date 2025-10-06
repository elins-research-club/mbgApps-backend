// /backend/src/api/routes.js

const express = require("express");
// PASTIKAN suggestMenu DIIMPOR DARI CONTROLLER
const {
  getMenus,
  generateNutrition,
  suggestMenu,
} = require("../controllers/menuController");
const router = express.Router();

router.get("/menus", getMenus);
router.post("/generate", generateNutrition);
// PASTIKAN RUTE INI TERDAFTAR DENGAN BENAR
router.post("/suggest-menu", suggestMenu);

module.exports = router;
