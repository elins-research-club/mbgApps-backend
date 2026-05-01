const prisma = require("../lib/prisma");

const FIXED_ROLES = ["owner", "chef", "ahli gizi"];

function mapRole(role) {
  return {
    id: role.id,
    orgId: role.org_id,
    name: role.name,
    permissions: role.permissions,
    createdAt: role.created_at,
  };
}

function isAllowedRole(name) {
  if (!name || typeof name !== "string") return false;
  const normalized = name.trim().toLowerCase();
  return FIXED_ROLES.includes(normalized);
}

async function ensureFixedRoles(orgId, tx = prisma) {
  const existingRoles = await tx.roles.findMany({
    where: { org_id: orgId },
    select: { name: true },
  });

  const existingNames = new Set(existingRoles.map((role) => role.name.trim().toLowerCase()));
  const missingRoles = FIXED_ROLES.filter((roleName) => !existingNames.has(roleName));

  if (missingRoles.length === 0) return;

  await tx.roles.createMany({
    data: missingRoles.map((roleName) => ({
      org_id: orgId,
      name: roleName,
      permissions: roleName === "owner" ? { "org-management": true } : {},
    })),
  });
}

async function getOrgRoles(orgId) {
  await ensureFixedRoles(orgId);

  const roles = await prisma.roles.findMany({
    where: { org_id: orgId },
    orderBy: { created_at: "asc" },
  });
  
  return roles.map(mapRole);
}

async function createRole(orgId, { name, permissions }) {
  if (!isAllowedRole(name)) {
    throw new Error(`Role name must be one of: ${FIXED_ROLES.join(", ")}`);
  }

  await ensureFixedRoles(orgId);

  const existingRole = await prisma.roles.findFirst({
    where: {
      org_id: orgId,
      name: name.trim().toLowerCase(),
    },
  });

  if (existingRole) {
    return mapRole(existingRole);
  }

  const role = await prisma.roles.create({
    data: {
      org_id: orgId,
      name: name.trim().toLowerCase(),
      permissions: permissions ?? {},
    },
  });
  
  return mapRole(role);
}

async function updateRole(roleId, { name, permissions }) {
  if (name && !isAllowedRole(name)) {
    throw new Error(`Role name must be one of: ${FIXED_ROLES.join(", ")}`);
  }

  const role = await prisma.roles.update({
    where: { id: roleId },
    data: {
      name: name?.trim(),
      permissions: permissions ?? undefined,
    },
  });
  
  return mapRole(role);
}

async function deleteRole(roleId) {
  const role = await prisma.roles.findUnique({
    where: { id: roleId },
    select: { name: true },
  });

  if (role && isAllowedRole(role.name)) {
    throw new Error("Fixed roles cannot be deleted");
  }

  await prisma.roles.delete({
    where: { id: roleId },
  });
}

module.exports = {
  ensureFixedRoles,
  getOrgRoles,
  createRole,
  updateRole,
  deleteRole,
};
