const prisma = require("../lib/prisma");

function mapRole(role) {
  return {
    id: role.id,
    orgId: role.org_id,
    name: role.name,
    permissions: role.permissions,
    createdAt: role.created_at,
  };
}

async function getOrgRoles(orgId) {
  const roles = await prisma.roles.findMany({
    where: { org_id: orgId },
    orderBy: { created_at: "asc" },
  });
  
  return roles.map(mapRole);
}

async function createRole(orgId, { name, permissions }) {
  const role = await prisma.roles.create({
    data: {
      org_id: orgId,
      name: name.trim(),
      permissions: permissions ?? {},
    },
  });
  
  return mapRole(role);
}

async function updateRole(roleId, { name, permissions }) {
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
  await prisma.roles.delete({
    where: { id: roleId },
  });
}

module.exports = {
  getOrgRoles,
  createRole,
  updateRole,
  deleteRole,
};
