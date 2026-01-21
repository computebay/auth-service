import prisma from "../../config/db";
import { AppError } from "../../utils/error";
import logger from "../../libs/logger";
import type { Role } from "../../generated/prisma/enums";

export interface CreateOrgInput {
  name: string;
}

export interface UpdateOrgInput {
  name?: string;
}

export interface AddMemberInput {
  userId: string;
  role: Role;
}

export const createOrganization = async (
  ownerId: string,
  data: CreateOrgInput,
) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          ownerId,
        },
      });

      await tx.membership.create({
        data: {
          userId: ownerId,
          orgId: org.id,
          role: "OWNER",
        },
      });

      await tx.auditLogs.create({
        data: {
          userId: ownerId,
          eventType: "ORGANIZATION_CREATED",
          meta: {
            orgId: org.id,
            orgName: org.name,
          },
        },
      });

      return org;
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const getOrganizationById = async (orgId: string) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        memberships: {
          select: {
            id: true,
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    return org;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const getUserOrganizations = async (userId: string) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
    });

    return memberships;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const updateOrganization = async (
  orgId: string,
  ownerId: string,
  data: UpdateOrgInput,
) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (org.ownerId !== ownerId) {
      throw new AppError(
        "Only organization owner can update organization",
        403,
        "FORBIDDEN",
      );
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: orgId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
      include: {
        memberships: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
      },
    });

    await prisma.auditLogs.create({
      data: {
        userId: ownerId,
        eventType: "ORGANIZATION_UPDATED",
        meta: {
          orgId,
          updatedFields: Object.keys(data),
        },
      },
    });

    return updatedOrg;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const deleteOrganization = async (
  orgId: string,
  ownerId: string,
) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (org.ownerId !== ownerId) {
      throw new AppError(
        "Only organization owner can delete organization",
        403,
        "FORBIDDEN",
      );
    }

    await prisma.organization.delete({
      where: { id: orgId },
    });

    await prisma.auditLogs.create({
      data: {
        userId: ownerId,
        eventType: "ORGANIZATION_DELETED",
        meta: {
          orgId,
          orgName: org.name,
        },
      },
    });

    return { message: "Organization deleted successfully" };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const addMemberToOrganization = async (
  orgId: string,
  ownerId: string,
  data: AddMemberInput,
) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (org.ownerId !== ownerId) {
      throw new AppError(
        "Only organization owner can add members",
        403,
        "FORBIDDEN",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: data.userId,
          orgId,
        },
      },
    });

    if (existingMembership) {
      throw new AppError(
        "User is already a member of this organization",
        400,
        "ALREADY_MEMBER",
      );
    }

    const membership = await prisma.membership.create({
      data: {
        userId: data.userId,
        orgId,
        role: data.role,
      },
    });

    await prisma.auditLogs.create({
      data: {
        userId: ownerId,
        eventType: "MEMBER_ADDED",
        meta: {
          orgId,
          memberId: data.userId,
          role: data.role,
        },
      },
    });

    return membership;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const removeMemberFromOrganization = async (
  orgId: string,
  ownerId: string,
  memberId: string,
) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (org.ownerId !== ownerId) {
      throw new AppError(
        "Only organization owner can remove members",
        403,
        "FORBIDDEN",
      );
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: memberId,
          orgId,
        },
      },
    });

    if (!membership) {
      throw new AppError("Member not found in organization", 404, "NOT_FOUND");
    }

    if (membership.role === "OWNER") {
      throw new AppError(
        "Cannot remove organization owner",
        400,
        "CANNOT_REMOVE_OWNER",
      );
    }

    await prisma.membership.delete({
      where: { id: membership.id },
    });

    await prisma.auditLogs.create({
      data: {
        userId: ownerId,
        eventType: "MEMBER_REMOVED",
        meta: {
          orgId,
          memberId,
        },
      },
    });

    return { message: "Member removed successfully" };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const updateMemberRole = async (
  orgId: string,
  ownerId: string,
  memberId: string,
  role: Role,
) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    }

    if (org.ownerId !== ownerId) {
      throw new AppError(
        "Only organization owner can update member roles",
        403,
        "FORBIDDEN",
      );
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: memberId,
          orgId,
        },
      },
    });

    if (!membership) {
      throw new AppError("Member not found in organization", 404, "NOT_FOUND");
    }

    if (membership.role === "OWNER") {
      throw new AppError(
        "Cannot change owner role",
        400,
        "CANNOT_CHANGE_OWNER_ROLE",
      );
    }

    const updatedMembership = await prisma.membership.update({
      where: { id: membership.id },
      data: { role },
    });

    await prisma.auditLogs.create({
      data: {
        userId: ownerId,
        eventType: "MEMBER_ROLE_UPDATED",
        meta: {
          orgId,
          memberId,
          newRole: role,
          oldRole: membership.role,
        },
      },
    });

    return updatedMembership;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};
