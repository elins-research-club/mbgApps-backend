const prisma = require("../lib/prisma");

function mapRole(role) {
  if (!role) return null;
  return {
    id: role.id,
    orgId: role.org_id,
    name: role.name,
    permissions: role.permissions,
    createdAt: role.created_at,
  };
}

function mapUserProfile(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.full_name,
    phone: user.phone,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function normalizeMember(member, userProfile = null) {
  const { Roles, ...rest } = member;
  return {
    id: rest.id,
    orgId: rest.org_id,
    userId: rest.user_id,
    roleId: rest.role_id,
    status: rest.status,
    invitedBy: rest.invited_by,
    inviteMethod: rest.invite_method,
    joinedAt: rest.joined_at,
    createdAt: rest.created_at,
    role: mapRole(Roles),
    user: mapUserProfile(userProfile),
  };
}

/**
 * Get all users (with optional org filtering)
 */
async function getAllUsers(query = {}) {
  const { orgId, status, page = 1, limit = 50 } = query;

  const where = {};

  if (orgId) {
    where.org_id = orgId;
  }

  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [members, total] = await Promise.all([
    prisma.membership.findMany({
      where,
      include: {
        Roles: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: parseInt(limit, 10),
    }),
    prisma.membership.count({ where }),
  ]);

  const userIds = [...new Set(members.map((member) => member.user_id))];
  const userProfiles = userIds.length
    ? await prisma.userext.findMany({
        where: { id: { in: userIds } },
        select: { id: true, full_name: true, phone: true, created_at: true, updated_at: true },
      })
    : [];

  const profileById = new Map(userProfiles.map((profile) => [profile.id, profile]));
  const usersWithProfiles = members.map((member) =>
    normalizeMember(member, profileById.get(member.user_id) ?? null)
  );

  return {
    data: usersWithProfiles,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / parseInt(limit, 10)),
    },
  };
}

/**
 * Approve a pending user membership
 */
async function approveUser(memberId) {
  const member = await prisma.membership.update({
    where: { id: memberId },
    data: {
      status: "active",
      joined_at: new Date(),
    },
    include: {
      Roles: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  const userProfile = await prisma.userext.findUnique({
    where: { id: member.user_id },
    select: { id: true, full_name: true, phone: true, created_at: true, updated_at: true },
  });

  return normalizeMember(member, userProfile);
}

/**
 * Reject a user membership with optional reason
 * Note: Prisma schema doesn't support storing rejection reason in membership table
 * The reason can be logged or handled separately if needed
 */
async function rejectUser(memberId, reason) {
  // Optionally log the rejection reason (could be stored in a separate table if needed)
  if (reason) {
    console.log(`Rejection reason for membership ${memberId}: ${reason}`);
  }

  const member = await prisma.membership.update({
    where: { id: memberId },
    data: { status: "rejected" },
    include: {
      Roles: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  const userProfile = await prisma.userext.findUnique({
    where: { id: member.user_id },
    select: { id: true, full_name: true, phone: true, created_at: true, updated_at: true },
  });

  return normalizeMember(member, userProfile);
}

/**
 * Update user role within an organization
 */
async function updateUserRole(memberId, roleId) {
  // Validate role exists if roleId is provided
  if (roleId) {
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new Error("Role not found");
    }
  }

  const member = await prisma.membership.update({
    where: { id: memberId },
    data: { role_id: roleId },
    include: {
      Roles: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });

  const userProfile = await prisma.userext.findUnique({
    where: { id: member.user_id },
    select: { id: true, full_name: true, phone: true, created_at: true, updated_at: true },
  });

  return normalizeMember(member, userProfile);
}

/**
 * Delete a user membership from an organization
 */
async function deleteUser(memberId) {
  await prisma.membership.delete({
    where: { id: memberId },
  });

  return { success: true, message: "User membership deleted successfully" };
}

module.exports = {
  getAllUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  deleteUser,
};
