const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function mapOrganization(organization) {
  return {
    id: organization.id,
    name: organization.name,
    description: organization.description,
    ownerId: organization.owner_id,
    inviteCode: organization.invite_code,
    createdAt: organization.created_at,
    updatedAt: organization.updated_at,
  };
}

async function createOrganization(userId, { name, description }) {
  if (!userId) throw new Error("Not authenticated");

  const organization = await prisma.organizations.create({
    data: {
      name: name.trim(),
      description: description?.trim(),
      owner_id: userId,
    },
  });

  return mapOrganization(organization);
}

async function getOrganization(orgId) {
  const organization = await prisma.organizations.findUnique({ where: { id: orgId } });
  
  if (!organization) throw new Error("Organization not found");
  return mapOrganization(organization);
}

async function updateOrganization(orgId, { name, description }) {
  const organization = await prisma.organizations.update({
    where: { id: orgId },
    data: {
      name: name?.trim(),
      description: description?.trim(),
    },
  });
  
  return mapOrganization(organization);
}

module.exports = {
  createOrganization,
  getOrganization,
  updateOrganization,
};
