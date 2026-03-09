const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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

async function getUserProfile(userId) {
  return prisma.userext.findUnique({
    where: { id: userId },
    select: { id: true, full_name: true, phone: true },
  });
}

async function getOrgMembers(orgId) {
  const members = await prisma.membership.findMany({
    where: { org_id: orgId },
    include: {
      Roles: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const userIds = [...new Set(members.map((member) => member.user_id))];
  const userProfiles = userIds.length
    ? await prisma.userext.findMany({
        where: { id: { in: userIds } },
        select: { id: true, full_name: true, phone: true },
      })
    : [];

  const profileById = new Map(userProfiles.map((profile) => [profile.id, profile]));
  const membersWithProfiles = members.map((member) => ({
    ...normalizeMember(member, profileById.get(member.user_id) ?? null),
  }));
  
  return membersWithProfiles;
}

async function requestToJoinByCode(userId, inviteCode) {
  if (!userId) throw new Error("Not authenticated");

  // Resolve org from invite code
  const org = await prisma.organizations.findUnique({
    where: { invite_code: inviteCode.trim().toUpperCase() },
    select: { id: true, name: true },
  });
  
  if (!org) throw new Error("Kode undangan tidak valid");

  // Check if already a member
  const existing = await prisma.membership.findUnique({
    where: {
      org_id_user_id: {
        org_id: org.id,
        user_id: userId,
      },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status === "active") throw new Error("Anda sudah menjadi anggota organisasi ini");
    if (existing.status === "pending") throw new Error("Permintaan bergabung Anda sedang menunggu persetujuan");
    if (existing.status === "rejected") throw new Error("Permintaan Anda sebelumnya telah ditolak");
  }

  const member = await prisma.membership.create({
    data: {
      org_id: org.id,
      user_id: userId,
      invite_method: "code",
      status: "pending",
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

  const userProfile = await getUserProfile(userId);
  
  return {
    member: normalizeMember(member, userProfile),
    org: {
      id: org.id,
      name: org.name,
    },
  };
}

async function acceptMember(memberId) {
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

  const userProfile = await getUserProfile(member.user_id);
  
  return normalizeMember(member, userProfile);
}

async function rejectMember(memberId) {
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

  const userProfile = await getUserProfile(member.user_id);
  
  return normalizeMember(member, userProfile);
}

async function removeMember(memberId) {
  await prisma.membership.delete({
    where: { id: memberId },
  });
}

async function assignRole(memberId, roleId) {
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

  const userProfile = await getUserProfile(member.user_id);
  
  return normalizeMember(member, userProfile);
}

module.exports = {
  getOrgMembers,
  requestToJoinByCode,
  acceptMember,
  rejectMember,
  removeMember,
  assignRole,
};
