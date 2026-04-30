const prisma = require("../lib/prisma");

/**
 * Middleware to check if the user's organization is approved
 * This should be used on routes that require an active organization
 */
async function requireApprovedOrg(req, res, next) {
  // If userId is not set, skip (let requireAuth handle it)
  if (!req.userId) {
    return next();
  }

  try {
    // Check if user has any active membership in an approved organization
    const membership = await prisma.membership.findFirst({
      where: {
        user_id: req.userId,
        status: "active",
      },
      include: {
        Organizations: {
          select: {
            id: true,
            status: true,
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return next(); // User not in any org, let route handle it
    }

    if (membership.Organizations.status !== "active") {
      return res.status(403).json({
        error: "Your organization is pending approval. Please wait for admin approval before accessing this feature.",
        organizationStatus: membership.Organizations.status,
        organizationName: membership.Organizations.name,
      });
    }

    // Attach org info to request for downstream use
    req.userOrgId = membership.Organizations.id;
    req.userOrgStatus = membership.Organizations.status;

    return next();
  } catch (error) {
    console.error("Error checking organization approval:", error);
    return next(); // Continue on error, don't block
  }
}

/**
 * Middleware to check if a specific organization is approved
 * Use this when operating on a specific org (e.g., /organizations/:id/...)
 */
async function requireApprovedOrgById(req, res, next) {
  const orgId = req.params.id || req.params.orgId || req.params.parentOrgId;

  if (!orgId) {
    return next(); // No org ID in params, skip
  }

  try {
    const organization = await prisma.organizations.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        status: true,
        name: true,
      },
    });

    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    if (organization.status !== "active") {
      return res.status(403).json({
        error: "This organization is pending approval. Please wait for admin approval.",
        organizationStatus: organization.status,
        organizationName: organization.name,
      });
    }

    return next();
  } catch (error) {
    console.error("Error checking organization approval:", error);
    return res.status(500).json({ error: "Failed to verify organization status" });
  }
}

module.exports = {
  requireApprovedOrg,
  requireApprovedOrgById,
};
