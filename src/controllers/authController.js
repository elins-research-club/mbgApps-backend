const crypto = require("crypto");

const prisma = require("../lib/prisma");
const supabase = require("../lib/supabase");

/**
 * Sign up a new user
 * Creates: Auth user + Userext profile
 * Note: Organization must be created separately by user
 */
async function signUp(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: "Email, password, and full name are required"
      });
    }

    // Step 1: Create user in Supabase Auth (auto-confirm)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,  // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: "Failed to create user" });
    }

    const userId = authData.user.id;
    console.log("✅ Auth user created:", userId);

    // Step 2: Create Userext profile ONLY (no organization)
    console.log("📝 Creating Userext profile for user:", userId);
    let userext;
    try {
      userext = await prisma.userext.create({
        data: {
          id: userId,
          full_name: fullName,
          role: "User",  // Default role (not Org Owner yet)
          is_super_admin: false,
        },
      });
      console.log("✅ Userext profile created:", userext.id);
    } catch (userextError) {
      console.error("❌ Userext creation failed:", userextError);
      console.error("Error details:", userextError.message);
      console.error("Error code:", userextError.code);

      // Try to check if Userext already exists
      const existingUserext = await prisma.userext.findUnique({
        where: { id: userId },
      });

      if (existingUserext) {
        console.log("⚠️ Userext already exists, using existing record");
        userext = existingUserext;
      } else {
        // Cleanup auth user
        await supabase.auth.admin.deleteUser(userId);
        throw new Error("Failed to create Userext profile: " + userextError.message);
      }
    }

    // Return success - organization creation is optional
    res.status(201).json({
      message: "User created successfully",
      userId: userId,
      email: email,
      hasOrganization: false,  // User doesn't have org yet (optional)
    });
  } catch (error) {
    console.error("Sign up error:", error);

    // Rollback: If something failed, try to clean up
    if (req.body.email) {
      try {
        await supabase.auth.admin.deleteUser(req.body.email);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError.message);
      }
    }

    res.status(500).json({
      error: "Failed to create user",
      details: error.message
    });
  }
}

/**
 * Sign in user
 */
async function signIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get user profile
    const userext = await prisma.userext.findUnique({
      where: { id: data.user.id },
      select: {
        id: true,
        full_name: true,
        role: true,
        is_super_admin: true,
      },
    });

    // Get user's organization
    const org = await prisma.organizations.findFirst({
      where: { owner_id: data.user.id },
      select: {
        id: true,
        name: true,
        status: true,
        rejection_reason: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        profile: userext,
      },
      organization: org,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    res.status(500).json({ error: "Failed to sign in" });
  }
}

/**
 * Sign out user
 */
async function signOut(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : null;

    if (token) {
      await supabase.auth.admin.signOut(token);
    }

    res.json({ message: "Signed out successfully" });
  } catch (error) {
    console.error("Sign out error:", error);
    res.status(500).json({ error: "Failed to sign out" });
  }
}

/**
 * Admin Sign In
 * Checks is_super_admin flag and returns admin data
 */
async function adminSignIn(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }

    // Step 1: Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    const userId = authData.user.id;
    console.log("✅ Admin auth successful:", userId);

    // Step 2: Check if user is super admin
    const userext = await prisma.userext.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        role: true,
        is_super_admin: true,
        created_at: true,
      },
    });

    if (!userext) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: "User profile not found" });
    }

    if (!userext.is_super_admin) {
      await supabase.auth.signOut();
      return res.status(403).json({ error: "Admin access required. Super admin privileges needed." });
    }

    console.log("✅ Admin access granted:", userext.full_name);

    // Return admin data with tokens
    res.json({
      admin: {
        id: userext.id,
        fullName: userext.full_name,
        role: userext.role,
        is_super_admin: userext.is_super_admin,
      },
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      message: "Admin login successful",
    });
  } catch (error) {
    console.error("Admin sign in error:", error);
    res.status(500).json({ error: "Failed to sign in as admin" });
  }
}

/**
 * Verify Admin Session
 * Called by frontend to check if current user is admin
 */
async function verifyAdmin(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Validate token
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Check if super admin
    const userext = await prisma.userext.findUnique({
      where: { id: data.user.id },
      select: {
        id: true,
        full_name: true,
        role: true,
        is_super_admin: true,
      },
    });

    if (!userext || !userext.is_super_admin) {
      return res.status(403).json({ error: "Admin access denied" });
    }

    res.json({
      isAdmin: true,
      admin: {
        id: userext.id,
        fullName: userext.full_name,
        role: userext.role,
      },
    });
  } catch (error) {
    console.error("Verify admin error:", error);
    res.status(500).json({ error: "Failed to verify admin" });
  }
}

/**
 * Middleware: Require Super Admin
 * Express middleware to protect admin routes
 */
function requireSuperAdminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  supabase.auth.getUser(token)
    .then(async ({ data, error }) => {
      if (error || !data.user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      req.userId = data.user.id;
      req.user = data.user;

      // Check if super admin
      const userext = await prisma.userext.findUnique({
        where: { id: data.user.id },
        select: { is_super_admin: true },
      });

      if (!userext || !userext.is_super_admin) {
        return res.status(403).json({ error: "Super admin privileges required" });
      }

      req.isSuperAdmin = true;
      next();
    })
    .catch((error) => {
      console.error("Super admin middleware error:", error);
      res.status(500).json({ error: "Failed to verify admin privileges" });
    });
}

module.exports = {
  signUp,
  signIn,
  signOut,
  adminSignIn,
  verifyAdmin,
  requireSuperAdminMiddleware,
};
