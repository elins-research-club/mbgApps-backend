// /backend/src/api/routes.js

const express = require("express");
const {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
} = require("../controllers/menuController");
const { suggestMenuStream } = require("../controllers/streamController");
const router = express.Router();

router.get("/menus", getMenus); // Bisa dihapus nanti, tapi biarkan dulu
router.post("/generate", generateNutrition);
router.post("/suggest-menu", suggestMenu);

router.get("/search", searchMenus);
router.post("/suggest-menu-stream", suggestMenuStream);

module.exports = router;
