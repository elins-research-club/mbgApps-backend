// /backend/src/api/routes.js

const express = require("express");
const {
  getMenus,
  generateNutrition,
  suggestMenu,
  searchMenus,
  createMenu,
  getRecipeNutritionById,
  saveMenuComposition,
  getMenuNutritionById,
  editMenu,
  getRecipeById,
  updateRecipe,
  getAllRecipes,
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
const {
  saveMealPlan,
  getMealPlanById,
  getAllMealPlans,
  deleteMealPlan,
} = require("../controllers/mealPlanController");
const {
  getAllRecommendationHandler,
} = require("../controllers/recommendationSystemController");
const {
  ApiError,
  createOrganization,
  createSubOrganization,
  getOrganization,
  getSubOrganizations,
  updateOrganization,
  approveOrganization,
  rejectOrganization,
  getAllOrganizations,
  getPendingOrganizations,
  suspendOrganization,
  unsuspendOrganization,
} = require("../controllers/organizationController");
const { getOrgMembers, requestToJoinByCode, acceptMember, rejectMember, removeMember, assignRole } = require("../controllers/membershipController");
const { getOrgRoles, createRole, updateRole, deleteRole } = require("../controllers/roleController");
const { updateProfile } = require("../controllers/userController");
const { getAllUsers, approveUser, rejectUser, updateUserRole, deleteUser } = require("../controllers/adminController");
const { signUp, signIn, signOut, adminSignIn, verifyAdmin, requireSuperAdminMiddleware } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

function sendError(res, error, fallbackStatus = 400) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }

  const status = typeof error?.status === "number" ? error.status : fallbackStatus;
  return res.status(status).json({ error: error.message });
}

// Auth routes
router.post("/auth/sign-up", signUp);
router.post("/auth/sign-in", signIn);
router.post("/auth/sign-out", signOut);

// Admin auth routes
router.post("/auth/admin/sign-in", adminSignIn);
router.get("/auth/admin/verify", verifyAdmin);

// Admin routes (protected by backend middleware)
router.get("/admin/users", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const users = await getAllUsers(req.query);
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/admin/users/:id/approve", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const user = await approveUser(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/admin/users/:id/reject", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await rejectUser(req.params.id, reason);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/admin/users/:id/role", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { roleId } = req.body;
    const user = await updateUserRole(req.params.id, roleId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/admin/users/:id", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Organization approval routes (protected)
router.get("/organizations/pending", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const organizations = await getPendingOrganizations();
    res.json(organizations);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:id/approve", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const org = await approveOrganization(req.params.id, req.userId);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:id/reject", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const org = await rejectOrganization(req.params.id, req.userId, reason);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.get("/menus", getMenus);
router.post("/generate", generateNutrition);
router.post("/suggest-menu", suggestMenu);
router.post("/menu", createMenu);
router.post("/menu/composition", saveMenuComposition);
router.put("/menu/:id", editMenu);
router.get("/menu/:id", getMenuNutritionById);
router.get("/search", searchMenus);
router.post("/suggest-menu-stream", suggestMenuStream);
router.post("/ingredients", addIngredients);
router.post("/ingredients/get-ingredients", getIngredients);
router.get("/ingredients/get-not-validated", getNotValidatedIngredients);
router.put("/ingredients/:id", editIngredientsNutritions);
router.delete("/ingredients/:id", deleteIngredients);
router.get("/ingredients/search", searchIngredients);
router.get("/recipes/:recipeId/nutrition", getRecipeNutritionById);
router.get("/recipes/:id", getRecipeById);
router.put("/recipes/:id", updateRecipe);
router.get("/recipes", getAllRecipes);
router.post("/get_all_recommendations", getAllRecommendationHandler);
// Meal Plans routes
router.post("/meal-plans", saveMealPlan);
router.get("/meal-plans", getAllMealPlans);
router.get("/meal-plans/:id", getMealPlanById);
router.delete("/meal-plans/:id", deleteMealPlan);


// Organization routes
router.post("/organizations", requireAuth, async (req, res) => {
  try {
    const org = await createOrganization(req.userId, req.body);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:parentOrgId/sub-organizations", requireAuth, async (req, res) => {
  try {
    const result = await createSubOrganization(req.userId, req.params.parentOrgId, req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.get("/organizations", async (req, res) => {
  try {
    const result = await getAllOrganizations(req.query);
    res.json(result);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.get("/organizations/pending", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const organizations = await getPendingOrganizations();
    res.json(organizations);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:id/approve", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const org = await approveOrganization(req.params.id, req.userId);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:id/reject", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const org = await rejectOrganization(req.params.id, req.userId, reason);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:id/suspend", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { reason, suspendedUntil } = req.body;
    const org = await suspendOrganization(req.params.id, req.userId, reason, suspendedUntil);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.post("/organizations/:id/unsuspend", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const org = await unsuspendOrganization(req.params.id);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

router.get("/organizations/:id", async (req, res) => {
  try {
    const org = await getOrganization(req.params.id);
    res.json(org);
  } catch (error) {
    sendError(res, error, 404);
  }
});

router.get("/organizations/:id/sub-organizations", async (req, res) => {
  try {
    const result = await getSubOrganizations(req.params.id);
    res.json(result);
  } catch (error) {
    sendError(res, error, 404);
  }
});

router.put("/organizations/:id", async (req, res) => {
  try {
    const org = await updateOrganization(req.params.id, req.body);
    res.json(org);
  } catch (error) {
    sendError(res, error, 400);
  }
});

// membership routes
router.get("/organizations/:id/members", async (req, res) => {
  try {
    const members = await getOrgMembers(req.params.id);
    res.json(members);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/organizations/join-by-code", requireAuth, async (req, res) => {
  try {
    const result = await requestToJoinByCode(req.userId, req.body.inviteCode);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/organizations/members/:memberId/accept", async (req, res) => {
  try {
    const member = await acceptMember(req.params.memberId);
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/organizations/members/:memberId/reject", async (req, res) => {
  try {
    const member = await rejectMember(req.params.memberId);
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.delete("/organizations/members/:memberId", async (req, res) => {
  try {
    await removeMember(req.params.memberId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.put("/organizations/members/:memberId/role", async (req, res) => {
  try {
    const member = await assignRole(req.params.memberId, req.body.roleId);
    res.json(member);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// role routes
router.get("/organizations/:id/roles", async (req, res) => {
  try {
    const roles = await getOrgRoles(req.params.id);
    res.json(roles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.post("/organizations/:id/roles", async (req, res) => {
  try {
    const role = await createRole(req.params.id, req.body);
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.put("/organizations/roles/:roleId", async (req, res) => {
  try {
    const role = await updateRole(req.params.roleId, req.body);
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.delete("/organizations/roles/:roleId", async (req, res) => {
  try {
    await deleteRole(req.params.roleId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// user routes
router.put("/users/profile", requireAuth, async (req, res) => {
  try {
    const user = await updateProfile(req.userId, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// admin routes (require super admin)
router.get("/admin/users", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const users = await getAllUsers(req.query);
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/admin/users/:id/approve", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const user = await approveUser(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/admin/users/:id/reject", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await rejectUser(req.params.id, reason);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put("/admin/users/:id/role", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const { roleId } = req.body;
    const user = await updateUserRole(req.params.id, roleId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/admin/users/:id", requireSuperAdminMiddleware, async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
