const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function mapUserProfile(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    phone: user.phone,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

async function updateProfile(userId, { fullName, phone, bio }) {
  if (!userId) throw new Error("Not authenticated");
  const user = await prisma.userext.upsert({
    where: { id: userId },
    update: {
      full_name: fullName?.trim(),
      phone: phone?.trim(),
      updated_at: new Date(),
    },
    create: {
      id: userId,
      full_name: fullName?.trim(),
      phone: phone?.trim(),
    },
  });
  
  return mapUserProfile(user);
}

module.exports = {
  updateProfile,
};
