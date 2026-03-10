const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

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

  const organization = await prisma.organizations.create({
    data: {
      name: normalizedName,
      description: normalizeDescription(description),
      owner_id: userId,
      parent_id: null,
      depth: 0,
    },
  });

  return mapOrganization(organization);
}

async function createSubOrganization(userId, parentOrgId, { name, description }) {
  if (!userId) throw new ApiError(401, "Not authenticated");

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

    return tx.organizations.create({
      data: {
        name: normalizedName,
        description: normalizeDescription(description),
        owner_id: userId,
        parent_id: parentOrg.id,
        depth: newDepth,
      },
    });
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

module.exports = {
  ApiError,
  createOrganization,
  createSubOrganization,
  getOrganization,
  getSubOrganizations,
  updateOrganization,
};
