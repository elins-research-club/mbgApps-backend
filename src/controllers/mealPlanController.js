const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const saveMealPlan = async (req, res) => {
  try {
    const { name, targetClass, recipes, totalNutrition } = req.body;

    // Validate required fields
    if (!targetClass || !recipes || !totalNutrition) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: targetClass, recipes, or totalNutrition",
      });
    }

    // Validate recipes is an array
    if (!Array.isArray(recipes) || recipes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Recipes must be a non-empty array",
      });
    }

    // Create the meal plan
    const mealPlan = await prisma.mealPlan.create({
      data: {
        name,
        targetClass,
        recipes: JSON.stringify(recipes),
        totalNutrition: JSON.stringify(totalNutrition),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Meal plan saved successfully",
      data: {
        id: mealPlan.id,
        targetClass: mealPlan.targetClass,
        createdAt: mealPlan.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving meal plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save meal plan",
      error: error.message,
    });
  }
};


const getMealPlanById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the meal plan
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    // Parse JSON strings back to objects
    const data = {
      id: mealPlan.id,
      targetClass: mealPlan.targetClass,
      recipes: JSON.parse(mealPlan.recipes),
      totalNutrition: JSON.parse(mealPlan.totalNutrition),
      createdAt: mealPlan.createdAt,
      updatedAt: mealPlan.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error retrieving meal plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve meal plan",
      error: error.message,
    });
  }
};

const getAllMealPlans = async (req, res) => {
  try {
    const { limit = 1000, offset = 0 } = req.query;

    const mealPlans = await prisma.mealPlan.findMany({
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.mealPlan.count();

    // Parse JSON strings for each meal plan
    const data = mealPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      targetClass: plan.targetClass,
      recipes: JSON.parse(plan.recipes),
      totalNutrition: JSON.parse(plan.totalNutrition),
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error("Error retrieving meal plans:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve meal plans",
      error: error.message,
    });
  }
};

const deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if meal plan exists
    const mealPlan = await prisma.mealPlan.findUnique({
      where: { id },
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    // Delete the meal plan
    await prisma.mealPlan.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meal plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete meal plan",
      error: error.message,
    });
  }
};

module.exports = {
  saveMealPlan,
  getMealPlanById,
  getAllMealPlans,
  deleteMealPlan,
};
