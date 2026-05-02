const { Prisma } = require("@prisma/client");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { ensureFixedRoles } = require("./roleController");
const supabase = require("../lib/supabase");

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:3000";

function hashInviteToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildInvitationUrl(token) {
  return `${appUrl}/invite/accept?token=${encodeURIComponent(token)}`;
}

function normalizeEmail(email) {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
}

async function findAuthUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw new ApiError(500, `Failed to lookup users: ${error.message}`);
  }

  return data?.users?.find((user) => user.email?.toLowerCase() === email) || null;
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

async function ensureCanInviteToOrg(tx, userId, orgId) {
  const org = await tx.organizations.findUnique({
    where: { id: orgId },
    select: { id: true, owner_id: true },
  });

  if (!org) {
    throw new ApiError(404, "Organization not found");
  }

  if (org.owner_id === userId) {
    return org;
  }

  const membership = await tx.membership.findFirst({
    where: {
      org_id: org.id,
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
    throw new ApiError(403, "You are not allowed to invite members to this organization");
  }

  return org;
}

/**
 * Create invitations for a list of email addresses.
 * Existing Supabase users get a pending membership immediately.
 * New users get a Supabase invite email and join after the callback completes.
 */
async function inviteMembersFromEmails(tx, orgId, orgName, invitedByUserId, memberEmails = []) {
  if (!Array.isArray(memberEmails) || memberEmails.length === 0) {
    return { created: [], errors: [] };
  }

  const results = [];
  const errors = [];

  for (const email of memberEmails) {
    try {
      const trimmedEmail = normalizeEmail(email);
      if (!trimmedEmail) continue;

      const authUser = await findAuthUserByEmail(trimmedEmail);
      const invitationToken = crypto.randomUUID();
      const tokenHash = hashInviteToken(invitationToken);

      const existingMembership = authUser
        ? await tx.membership.findUnique({
            where: {
              org_id_user_id: {
                org_id: orgId,
                user_id: authUser.id,
              },
            },
            select: { id: true, status: true, user_id: true },
          })
        : null;

      if (existingMembership?.status === "active") {
        errors.push({ email: trimmedEmail, reason: "Already active member" });
        continue;
      }

      const invitationData = {
        org_id: orgId,
        email: trimmedEmail,
        token_hash: tokenHash,
        status: "pending",
        invited_by: invitedByUserId ?? null,
        invite_method: "email",
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      };

      let membership = existingMembership;

      if (authUser) {
        if (!membership) {
          membership = await tx.membership.create({
            data: {
              org_id: orgId,
              user_id: authUser.id,
              status: "pending",
              invite_method: "email",
              invited_by: invitedByUserId ?? null,
            },
          });
        }

        const invitation = await tx.organizationInvitation.upsert({
          where: {
            org_id_email: {
              org_id: orgId,
              email: trimmedEmail,
            },
          },
          update: {
            user_id: authUser.id,
            membership_id: membership.id,
            token_hash: tokenHash,
            status: "pending",
            invited_by: invitedByUserId ?? null,
            invite_method: "email",
            expires_at: invitationData.expires_at,
            accepted_at: null,
            updated_at: new Date(),
          },
          create: {
            ...invitationData,
            user_id: authUser.id,
            membership_id: membership.id,
          },
        });

        results.push({
          email: trimmedEmail,
          userId: authUser.id,
          membershipId: membership.id,
          invitationId: invitation.id,
          inviteUrl: buildInvitationUrl(invitationToken),
          delivery: "existing-user-pending",
        });
        continue;
      }

      const invitation = await tx.organizationInvitation.upsert({
        where: {
          org_id_email: {
            org_id: orgId,
            email: trimmedEmail,
          },
        },
        update: {
          token_hash: tokenHash,
          status: "pending",
          invited_by: invitedByUserId ?? null,
          invite_method: "email",
          expires_at: invitationData.expires_at,
          accepted_at: null,
          updated_at: new Date(),
        },
        create: invitationData,
      });

      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(trimmedEmail, {
        redirectTo: buildInvitationUrl(invitationToken),
        data: {
          orgId,
          orgName,
          invitationToken,
        },
      });

      if (inviteError) {
        await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: {
            status: "failed",
            updated_at: new Date(),
          },
        });
        errors.push({ email: trimmedEmail, reason: inviteError.message });
        continue;
      }

      results.push({
        email: trimmedEmail,
        invitationId: invitation.id,
        inviteUrl: buildInvitationUrl(invitationToken),
        delivery: "email-invite",
      });
    } catch (error) {
      errors.push({
        email: typeof email === "string" ? email.trim() : "",
        reason: error.message,
      });
    }
  }

  return { created: results, errors };
}

async function createOrganization(userId, { name, description, memberEmails = [] }) {
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

    await ensureFixedRoles(org.id, tx);

    // Create invitations from email addresses
    const emailResults = await inviteMembersFromEmails(tx, org.id, org.name, userId, memberEmails);

    return { org, emailResults };
  });

  return {
    organization: mapOrganization(organization.org),
    invitations: organization.emailResults,
  };
}

async function createSubOrganization(userId, parentOrgId, { name, description, ownerId = null, memberEmails = [] }) {
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

    // Validate optional ownerId if provided
    let finalOwnerId = userId;
    if (ownerId) {
      if (!isUuid(ownerId)) throw new ApiError(422, "Invalid ownerId");
      // ensure owner user exists
      const ownerUser = await tx.userext.findUnique({ where: { id: ownerId }, select: { id: true } });
      if (!ownerUser) throw new ApiError(404, "Provided owner user not found");
      finalOwnerId = ownerId;
    }

    const newOrg = await tx.organizations.create({
      data: {
        name: normalizedName,
        description: normalizeDescription(description),
        owner_id: finalOwnerId,
        parent_id: parentOrg.id,
        depth: newDepth,
        status: "active",
        approved_at: new Date(),
        approved_by: userId,
      },
    });

    // create membership for the owner (active)
    await tx.membership.create({
      data: {
        org_id: newOrg.id,
        user_id: finalOwnerId,
        status: "active",
        invite_method: "owner",
        joined_at: new Date(),
      },
    });

    await ensureFixedRoles(newOrg.id, tx);

    // if the creator is different than owner, also add creator as active member
    if (finalOwnerId !== userId) {
      await tx.membership.create({
        data: {
          org_id: newOrg.id,
          user_id: userId,
          status: "active",
          invite_method: "owner",
          joined_at: new Date(),
        },
      });
    }

    // Create invitations from email addresses
    const emailResults = await inviteMembersFromEmails(tx, newOrg.id, newOrg.name, userId, memberEmails);

    return { org: newOrg, emailResults };
  });

  return {
    organization: mapOrganization(organization.org),
    invitations: organization.emailResults,
  };
}

async function getOrganization(orgId) {
  const organization = await prisma.organizations.findUnique({ where: { id: orgId } });
  
  if (!organization) throw new ApiError(404, "Organization not found");

  const counts = await getAggregatedMemberCounts(orgId);

  return {
    ...mapOrganization(organization),
    memberCounts: counts,
  };
}

/**
 * Get aggregated member counts for an organization and all its children
 * Returns counts for both direct and nested organizations
 */
async function getAggregatedMemberCounts(orgId) {
  // Get all descendants (including the org itself) using recursive CTE
  const descendants = await prisma.$queryRaw`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM "public"."Organizations" WHERE id = ${orgId}::uuid
      UNION ALL
      SELECT o.id FROM "public"."Organizations" o
      INNER JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT id FROM org_tree;
  `;

  const descendantIds = descendants.map((row) => row.id);

  // Get member counts by status for all descendants
  const counts = await prisma.membership.groupBy({
    by: ["status"],
    where: {
      org_id: { in: descendantIds },
    },
    _count: {
      id: true,
    },
  });

  const result = {
    activeCount: 0,
    pendingCount: 0,
    totalCount: 0,
  };

  for (const count of counts) {
    const countValue = count._count.id;
    result.totalCount += countValue;
    if (count.status === "active") result.activeCount = countValue;
    if (count.status === "pending") result.pendingCount = countValue;
  }

  return result;
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

  // Add aggregated member counts for each sub-organization
  const organizationsWithCounts = await Promise.all(
    organizations.map(async (org) => {
      const counts = await getAggregatedMemberCounts(org.id);
      return {
        ...mapOrganization(org),
        memberCounts: counts,
      };
    })
  );

  return {
    organizations: organizationsWithCounts,
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

async function acceptOrganizationInvitation(userId, userEmail, token) {
  if (!userId) {
    throw new ApiError(401, "Not authenticated");
  }

  const normalizedEmail = normalizeEmail(userEmail);
  const rawToken = typeof token === "string" ? token.trim() : "";
  if (!rawToken) {
    throw new ApiError(422, "Invitation token is required");
  }

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token_hash: hashInviteToken(rawToken) },
  });

  if (!invitation) {
    throw new ApiError(404, "Invitation not found");
  }

  if (invitation.status === "accepted") {
    return {
      invitationId: invitation.id,
      membershipId: invitation.membership_id,
      orgId: invitation.org_id,
      status: invitation.status,
    };
  }

  if (invitation.expires_at && invitation.expires_at < new Date()) {
    throw new ApiError(410, "Invitation has expired");
  }

  if (invitation.email && normalizedEmail && invitation.email !== normalizedEmail) {
    throw new ApiError(403, "This invitation was sent to a different email address");
  }

  if (invitation.user_id && invitation.user_id !== userId) {
    throw new ApiError(403, "This invitation is linked to another user");
  }

  const org = await prisma.organizations.findUnique({
    where: { id: invitation.org_id },
    select: { id: true },
  });

  if (!org) {
    throw new ApiError(404, "Organization not found");
  }

  const isOwner = await prisma.organizations.findFirst({
    where: { owner_id: userId },
    select: { id: true },
  });

  if (!isOwner) {
    const otherActive = await prisma.membership.findFirst({
      where: { user_id: userId, status: "active", org_id: { not: invitation.org_id } },
      select: { id: true },
    });

    if (otherActive) {
      throw new ApiError(409, "User already has active membership in another organization");
    }
  }

  let membership;
  if (invitation.membership_id) {
    membership = await prisma.membership.update({
      where: { id: invitation.membership_id },
      data: {
        status: "active",
        joined_at: new Date(),
      },
    });
  } else {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        org_id_user_id: {
          org_id: invitation.org_id,
          user_id: userId,
        },
      },
      select: { id: true, status: true },
    });

    if (existingMembership) {
      membership = await prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          status: "active",
          joined_at: new Date(),
        },
      });
    } else {
      membership = await prisma.membership.create({
        data: {
          org_id: invitation.org_id,
          user_id: userId,
          status: "active",
          invite_method: "email",
          invited_by: invitation.invited_by ?? null,
          joined_at: new Date(),
        },
      });
    }
  }

  const updatedInvitation = await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: {
      user_id: userId,
      membership_id: membership.id,
      status: "accepted",
      accepted_at: new Date(),
      updated_at: new Date(),
    },
  });

  return {
    invitationId: updatedInvitation.id,
    membershipId: membership.id,
    orgId: updatedInvitation.org_id,
    status: updatedInvitation.status,
  };
}

async function inviteOrganizationMembers(orgId, userId, memberEmails = []) {
  if (!isUuid(orgId)) {
    throw new ApiError(422, "Invalid organization ID");
  }

  const result = await prisma.$transaction(async (tx) => {
    const org = await ensureCanInviteToOrg(tx, userId, orgId);
    return inviteMembersFromEmails(tx, org.id, org.name || "", userId, memberEmails);
  });

  return result;
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
  acceptOrganizationInvitation,
  inviteOrganizationMembers,
};
