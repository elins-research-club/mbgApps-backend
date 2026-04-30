const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function normalizeDescription(description) {
  if (typeof description !== "string") return null;
  const trimmed = description.trim();
  return trimmed.length ? trimmed : null;
}

function isUuid(value) {
  return (
    typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    )
  );
}

function mapOrganization(organization) {
  return {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    parent_id: organization.parent_id,
    parentId: organization.parent_id,
    depth: organization.depth,
    owner_id: organization.owner_id,
    ownerId: organization.owner_id,
    invite_code: organization.invite_code,
    inviteCode: organization.invite_code,
    status: organization.status,
    approvedBy: organization.approved_by,
    approvedAt: organization.approved_at,
    rejectionReason: organization.rejection_reason,
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
  };
}

function hasOrgManagementPermission(rawPermissions) {
  if (!rawPermissions) return false;

  if (Array.isArray(rawPermissions)) {
    return rawPermissions.includes("org-management");
  }

  if (typeof rawPermissions === "string") {
    return rawPermissions === "org-management";
  }

  if (typeof rawPermissions === "object") {
    return (
      rawPermissions["org-management"] === true
      || rawPermissions.orgManagement === true
      || rawPermissions.organizationManagement === true
    );
  }

  return false;
}

async function ensureCanManageOrg(tx, userId, parentOrg) {
  if (parentOrg.owner_id === userId) return;

  const membership = await tx.membership.findFirst({
    where: {
      org_id: parentOrg.id,
      user_id: userId,
      status: "active",
    },
    include: {
      Roles: {
        select: {
          permissions: true,
        },
      },
    },
  });

  const permissions = membership?.Roles?.permissions;
  if (!hasOrgManagementPermission(permissions)) {
    throw new ApiError(403, "You are not allowed to create sub-organization in this parent");
  }
}

async function createOrganization(userId, { name, description }) {
  if (!userId) throw new Error("Not authenticated");
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) throw new ApiError(422, "Organization name is required");

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organizations.create({
      data: {
        name: normalizedName,
        description: normalizeDescription(description),
        owner_id: userId,
        parent_id: null,
        depth: 0,
        status: "pending",
      },
    });

    // Auto-create membership for the owner with pending status
    await tx.membership.create({
      data: {
        org_id: org.id,
        user_id: userId,
        status: "pending",
        invite_method: "owner",
      },
    });

    return org;
  });

  return mapOrganization(organization);
}

async function createSubOrganization(userId, parentOrgId, { name, description }) {
  if (!userId) throw new ApiError(401, "Not authenticated");

  if (!isUuid(parentOrgId)) {
    throw new ApiError(422, "Invalid parent organization ID");
  }

  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) {
    throw new ApiError(422, "Organization name is required");
  }

  const organization = await prisma.$transaction(async (tx) => {
    const parentRows = await tx.$queryRaw(Prisma.sql`
      SELECT id, owner_id, depth
      FROM "public"."Organizations"
      WHERE id = ${parentOrgId}::uuid
      FOR UPDATE
    `);

    const parentOrg = parentRows[0];

    if (!parentOrg) {
      throw new ApiError(404, "Parent organization not found");
    }

    await ensureCanManageOrg(tx, userId, parentOrg);

    const newDepth = (parentOrg.depth ?? 0) + 1;
    if (newDepth > 2) {
      throw new ApiError(409, "Sub-organization depth limit reached (max 2)");
    }

    const organization = await tx.organizations.create({
      data: {
        name: normalizedName,
        description: normalizeDescription(description),
        owner_id: userId,
        parent_id: parentOrg.id,
        depth: newDepth,
        status: "active",
        approved_at: new Date(),
        approved_by: userId,
      },
    });

    await tx.membership.create({
      data: {
        org_id: organization.id,
        user_id: userId,
        status: "active",
        invite_method: "owner",
        joined_at: new Date(),
      },
    });

    return organization;
  });

  return { organization: mapOrganization(organization) };
}

async function getOrganization(orgId) {
  const organization = await prisma.organizations.findUnique({ where: { id: orgId } });
  
  if (!organization) throw new ApiError(404, "Organization not found");
  return mapOrganization(organization);
}

async function getSubOrganizations(parentOrgId) {
  const parentOrg = await prisma.organizations.findUnique({
    where: { id: parentOrgId },
    select: { id: true },
  });

  if (!parentOrg) {
    throw new ApiError(404, "Parent organization not found");
  }

  const organizations = await prisma.organizations.findMany({
    where: { parent_id: parentOrgId },
    orderBy: { created_at: "asc" },
  });

  return {
    organizations: organizations.map(mapOrganization),
  };
}

async function updateOrganization(orgId, { name, description }) {
  let organization;
  try {
    organization = await prisma.organizations.update({
      where: { id: orgId },
      data: {
        name: name?.trim(),
        description: normalizeDescription(description),
      },
    });
  } catch (error) {
    if (error?.code === "P2025") {
      throw new ApiError(404, "Organization not found");
    }
    throw error;
  }

  return mapOrganization(organization);
}

/**
 * Approve an organization (super admin only)
 */
async function approveOrganization(orgId, adminUserId) {
  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organizations.update({
      where: { id: orgId },
      data: {
        status: "active",
        approved_by: adminUserId,
        approved_at: new Date(),
        rejection_reason: null,
      },
    });

    // Auto-approve the owner's membership
    await tx.membership.updateMany({
      where: {
        org_id: orgId,
        user_id: org.owner_id,
        status: "pending",
      },
      data: {
        status: "active",
        joined_at: new Date(),
      },
    });

    return org;
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return mapOrganization(organization);
}

/**
 * Reject an organization (super admin only)
 */
async function rejectOrganization(orgId, adminUserId, reason) {
  const organization = await prisma.organizations.update({
    where: { id: orgId },
    data: {
      status: "rejected",
      approved_by: adminUserId,
      approved_at: new Date(),
      rejection_reason: reason || null,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return mapOrganization(organization);
}

/**
 * Get all organizations with optional filtering
 */
async function getAllOrganizations(query = {}) {
  const { status, page = 1, limit = 50 } = query;

  const where = {};
  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [organizations, total] = await Promise.all([
    prisma.organizations.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit, 10),
    }),
    prisma.organizations.count({ where }),
  ]);

  return {
    data: organizations.map(mapOrganization),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
}

/**
 * Get pending organizations for super admin review
 */
async function getPendingOrganizations() {
  const organizations = await prisma.organizations.findMany({
    where: { status: "pending" },
    orderBy: { created_at: "desc" },
  });

  return organizations.map(mapOrganization);
}

/**
 * Suspend an organization (super admin only)
 */
async function suspendOrganization(orgId, adminUserId, reason, suspendedUntil) {
  const organization = await prisma.organizations.update({
    where: { id: orgId },
    data: {
      status: "suspended",
      approved_by: adminUserId,
      approved_at: new Date(),
      rejection_reason: reason,
      suspension_reason: reason,
      suspended_until: suspendedUntil ? new Date(suspendedUntil) : null,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return mapOrganization(organization);
}

/**
 * Unsuspend an organization (super admin only)
 */
async function unsuspendOrganization(orgId) {
  const organization = await prisma.organizations.update({
    where: { id: orgId },
    data: {
      status: "active",
      rejection_reason: null,
      suspension_reason: null,
      suspended_until: null,
    },
  });

  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return mapOrganization(organization);
}

module.exports = {
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
};
