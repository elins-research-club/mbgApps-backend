// /backend/src/api/routes.js

const express = require("express");
const {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
} = require("../controllers/menuController");
const {estimateIngredientWithLLM } = require("../controllers/getIngredients")
const router = express.Router();

router.get("/menus", getMenus); // Bisa dihapus nanti, tapi biarkan dulu
router.post("/generate", generateNutrition);
router.post("/suggest-menu", suggestMenu);

router.get("/search", searchMenus);
router.post("/suggest-menu-stream", suggestMenuStream);
router.post("/get-ingredients", async (req, res) => {
  try {
    const name = (req && req.body && req.body.name) || req.query.name;
    if (!name) return res.status(400).json({ error: 'Missing `name` in body or query' });
    const result = await estimateIngredientWithLLM(name);
    return res.json(result);
  } catch (err) {
    console.error('Error in /get-ingredients route:', err);
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
