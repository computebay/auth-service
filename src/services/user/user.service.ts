import prisma  from "../../config/db";
import { AppError } from "../../utils/error";
import logger from "../../libs/logger";


export interface UpdateUserInput {
  name?: string;
  phone?: string;
}

export const getAllUsers = async () => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        memberships: {
          select: {
            org: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
          },
        },
      },
    });

    return users;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const getUserById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
        memberships: {
          select: {
            org: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const updateUser = async (userId: string, data: UpdateUserInput) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
      },
    });

    await prisma.auditLogs.create({
      data: {
        userId,
        eventType: "USER_UPDATED",
        meta: {
          updatedFields: Object.keys(data),
        },
      },
    });

    return updatedUser;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.auditLogs.create({
      data: {
        userId,
        eventType: "USER_DELETED",
        meta: {
          email: user.email,
        },
      },
    });

    return { message: "User deleted successfully" };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};
