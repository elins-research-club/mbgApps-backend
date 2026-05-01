const { goals, multipliers } = require("../utils/goals");

function optimizeFoodPortions(currentFoods, goalDaily, goalId) {
  const goal = {
    energi_kkal: goalDaily.energi_kkal * multipliers[goalId],
    protein_g: goalDaily.protein_g * multipliers[goalId],
    lemak_g: goalDaily.lemak_g * multipliers[goalId],
    karbohidrat_g: goalDaily.karbohidrat_g * multipliers[goalId],
  };

  const foodsList = Object.keys(currentFoods);
  const nutrients = ["energi_kkal", "protein_g", "lemak_g", "karbohidrat_g"];

  const foodsPerGram = {};
  foodsList.forEach((foodName) => {
    const food = currentFoods[foodName];
    foodsPerGram[foodName] = {};
    nutrients.forEach((nutrient) => {
      foodsPerGram[foodName][nutrient] = food[nutrient] / food.gramasi;
    });
  });

  const nutrientMatrix = nutrients.map((nutrient) =>
    foodsList.map((foodName) => foodsPerGram[foodName][nutrient]),
  );

  const goalVector = nutrients.map((nutrient) => goal[nutrient]);
  const weights = [1.5, 2.0, 1.5, 1.5];

  // Only penalize shortfall, never excess
  function objective(portions) {
    const achieved = nutrientMatrix.map((row) =>
      row.reduce((sum, val, j) => sum + val * portions[j], 0),
    );

    let weightedError = 0;
    for (let i = 0; i < nutrients.length; i++) {
      const ratio = achieved[i] / goalVector[i];
      if (ratio < 1.0) {
        weightedError += weights[i] * Math.pow(1.0 - ratio, 2);
      }
    }

    return weightedError;
  }

  function gradient(portions) {
    const grad = [];
    const epsilon = 1e-5;
    const f0 = objective(portions);
    for (let i = 0; i < portions.length; i++) {
      const portsPlus = [...portions];
      portsPlus[i] += epsilon;
      const fPlus = objective(portsPlus);
      grad.push((fPlus - f0) / epsilon);
    }
    return grad;
  }

  // Start at original portions
  let portions = foodsList.map((foodName) => currentFoods[foodName].gramasi);

  // Min is original gramasi — no reductions allowed
  const bounds = foodsList.map((foodName) => {
    const original = currentFoods[foodName].gramasi;
    return {
      min: original,
      max: Math.min(400, original * 3),
    };
  });

  let learningRate = 10.0;
  const momentum = 0.9;
  let velocity = new Array(portions.length).fill(0);

  for (let iter = 0; iter < 10000; iter++) {
    const grad = gradient(portions);
    for (let i = 0; i < portions.length; i++) {
      velocity[i] = momentum * velocity[i] - learningRate * grad[i];
      portions[i] += velocity[i];
      portions[i] = Math.max(
        bounds[i].min,
        Math.min(bounds[i].max, portions[i]),
      );
    }
    if (iter % 100 === 0) {
      learningRate *= 0.95;
    }
  }

  const achievedNutrients = nutrientMatrix.map((row) =>
    row.reduce((sum, val, j) => sum + val * portions[j], 0),
  );

  const response = {
    success: true,
    portions: {},
    nutritional_achievement: {},
    total_weight_g: portions.reduce((sum, p) => sum + p, 0),
  };

  foodsList.forEach((foodName, i) => {
    const original = currentFoods[foodName].gramasi;
    const optimized = portions[i];
    const servings = optimized / original;
    response.portions[foodName] = {
      recommended_grams: Math.round(optimized * 10) / 10,
      original_grams: original,
      servings: Math.round(servings * 100) / 100,
    };
  });

  nutrients.forEach((nutrient, i) => {
    const goalVal = goalVector[i];
    const achievedVal = achievedNutrients[i];
    const gap = goalVal - achievedVal;
    const percent = (achievedVal / goalVal) * 100;

    let status = "short";
    if (percent >= 95) status = "achieved";
    else if (percent >= 80) status = "close";

    response.nutritional_achievement[nutrient] = {
      goal_per_meal: Math.round(goalVal * 10) / 10,
      achieved_per_meal: Math.round(achievedVal * 10) / 10,
      gap: Math.round(gap * 10) / 10,
      percentage: Math.round(percent * 10) / 10,
      status,
    };
  });

  // Flag if any nutrient still couldn't be reached
  const allAchieved = Object.values(response.nutritional_achievement).every(
    (n) => n.percentage >= 95,
  );

  response.success = allAchieved;
  response.note = allAchieved
    ? "All targets met"
    : "Some nutrients could not be reached with the available foods";

  return response;
}

async function getAllRecommendation(currentFoods) {
  const combinedSaran = [];

  for (const goalId in goals) {
    const goalDaily = goals[goalId];
    const result = optimizeFoodPortions(currentFoods, goalDaily, goalId);

    combinedSaran.push({
      goal_id: goalId,
      goal_daily: goalDaily,
      recommendation: result,
    });
  }

  return {
    success: true,
    total_goals: combinedSaran.length,
    combinedSaran: combinedSaran,
  };
}

async function getAllRecommendationHandler(req, res) {
  try {
    const currentFoods = req.body;
    const data = await getAllRecommendation(currentFoods);
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
module.exports = {
  getAllRecommendation,
  getAllRecommendationHandler,
};
