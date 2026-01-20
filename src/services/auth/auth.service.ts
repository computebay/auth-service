import prisma from "../../config/db";
import type {
  UpdateRefreshTokenInput,
  RegisterUserInput,
  LoginUserCredential,
  RefreshTokenInput,
} from "../../validators";
import logger from "../../libs/logger";
import { AppError } from "../../utils/error";
import { hashPassword, verifyPassword } from "../../utils/crypto";
import { logAudit } from "../../utils/audit";
import crypto from "crypto";
import { signAccessToken, generateRefreshToken } from "../../utils/token";

export const registerUser = async (data: RegisterUserInput) => {
  try {
    const existsingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

    if (existsingUser) {
      logger.warn(`Attempt to register with existing email: ${data.email}`);
      throw new AppError("User already exists", 400, "USER_EXISTS");
    }

    const hashedPassword = await hashPassword(data.password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,

          name: data.name,

          credentials: {
            create: {
              passwordHash: hashedPassword,
            },
          },
        },
      });

      const org = await tx.organization.create({
        data: {
          name: `${data.email}'s org`,
          ownerId: user.id,
        },
      });

      await tx.membership.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: "OWNER",
        },
      });

      const accessToken = signAccessToken({
        sub: user.id,
        orgId: org.id,
        role: "OWNER",
      });

      const { token, hash } = generateRefreshToken();

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), //1month
        },
      });
      await tx.auditLogs.create({
        data: {
          userId: user.id,
          eventType: "USER_REGISTERED",
          meta: {
            provider: "local",
            email: user.email,
          },
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        org: {
          id: org.id,
          role: "OWNER",
        },
        accessToken,
        refreshToken: token,
      };
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const loginUser = async (data: LoginUserCredential) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          email: data.email,
        },
        include: {
          credentials: true,
          memberships: true,
        },
      });

      if (!user || !user.credentials) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      }

      const valid = await verifyPassword(
        data.password,
        user.credentials.passwordHash,
      );

      if (!valid) {
        throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      }

      const membership = user.memberships[0];

      const accessToken = signAccessToken({
        sub: user.id,
        orgId: membership?.orgId,
        role: membership?.role,
      });

      const { token, hash } = generateRefreshToken();

      await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });

      await tx.auditLogs.create({
        data: {
          userId: user.id,
          eventType: "USER_LOGIN",
          meta: {
            provider: "local",
            email: user.email,
          },
        },
      });

      return {
        accessToken,
        refreshToken: token,
      };
    });

    return result;
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};
export const refreshAuthToken = async (refreshToken: string) => {
  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken, "utf8")
      .digest("hex");

    const result = await prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: {
          user: {
            include: {
              memberships: true,
            },
          },
        },
      });

      if (!storedToken) {
        throw new AppError(
          "Invalid refresh token",
          401,
          "INVALID_REFRESH_TOKEN",
        );
      }

      if (storedToken.revoked) {
        throw new AppError("Refresh token revoked", 401, "TOKEN_REVOKED");
      }

      if (storedToken.expiresAt < new Date()) {
        throw new AppError("Refresh token expired", 401, "TOKEN_EXPIRED");
      }

      const membership = storedToken.user.memberships[0];
      if (!membership) {
        throw new AppError("No org membership found", 403, "NO_MEMBERSHIP");
      }

      // rotate refresh token
      const { token: newRefreshToken, hash: newHash } = generateRefreshToken();

      const newToken = await tx.refreshToken.create({
        data: {
          userId: storedToken.userId,
          tokenHash: newHash,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        },
      });

      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revoked: true,
          replacedBy: newToken.id,
        },
      });

      const accessToken = signAccessToken({
        sub: storedToken.userId,
        orgId: membership.orgId,
        role: membership.role,
      });

      await tx.auditLogs.create({
        data: {
          userId: storedToken.userId,
          eventType: "TOKEN_REFRESHED",
          meta: {
            oldTokenId: storedToken.id,
            newTokenId: newToken.id,
          },
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
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
export const logoutUser = async (refreshToken: string) => {
  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken, "utf8")
      .digest("hex");

    await prisma.$transaction(async (tx) => {
      const storedToken = await tx.refreshToken.findUnique({
        where: { tokenHash },
      });

      // idempotent logout
      if (!storedToken || storedToken.revoked) {
        return;
      }

      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revoked: true,
        },
      });

      await tx.auditLogs.create({
        data: {
          userId: storedToken.userId,
          eventType: "USER_LOGOUT",
          meta: {
            tokenId: storedToken.id,
          },
        },
      });
    });
  } catch (error: any) {
    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const getCurrentUser = async (userId: string) => {
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

export const forgotPassword = async (data: { email: string }) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Return generic message for security
      logger.warn(
        `Forgot password attempt for non-existent email: ${data.email}`,
      );
      return {
        message:
          "If an account exists with this email, you will receive an OTP",
      };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = crypto
      .createHash("sha256")
      .update(otp, "utf8")
      .digest("hex");

    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await prisma.oTP.create({
      data: {
        userId: user.id,
        codeHash,
        type: "PASSWORD_RESET",
        expiresAt,
      },
    });

    logger.info(`OTP generated for user ${user.id}: ${otp}`);
    const resp = await fetch(
      `${Bun.env.NOTIFICATION_SERVICE_URL}/reset-password`,
      {
        method: "POST",
        body: JSON.stringify({
          to: user.email,
          otp,
        }),
        headers: { "Content-Type": "application/json" },
      },
    );
    logger.info(resp.json());

    await prisma.auditLogs.create({
      data: {
        userId: user.id,
        eventType: "PASSWORD_RESET_REQUESTED",
        meta: {
          email: user.email,
        },
      },
    });

    return {
      message: "If an account exists with this email, you will receive an OTP",
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};

export const verifyOTP = async (data: {
  email: string;
  code: string;
  type: string;
}) => {
  try {
    const codeHash = crypto
      .createHash("sha256")
      .update(data.code, "utf8")
      .digest("hex");

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const otp = await prisma.oTP.findFirst({
      where: {
        userId: user.id,
        codeHash,
        type: data.type,
        consumed: false,
      },
    });

    if (!otp) {
      throw new AppError("Invalid OTP", 400, "INVALID_OTP");
    }

    if (otp.expiresAt < new Date()) {
      throw new AppError("OTP expired", 400, "OTP_EXPIRED");
    }

    if (otp.attempts >= 5) {
      await prisma.oTP.update({
        where: { id: otp.id },
        data: { consumed: true },
      });
      throw new AppError("Too many failed attempts", 429, "TOO_MANY_ATTEMPTS");
    }

    // Mark OTP as consumed
    await prisma.oTP.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    // Mark email as verified if type is EMAIL_VERIFICATION
    if (data.type === "EMAIL_VERIFICATION") {
      await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    await prisma.auditLogs.create({
      data: {
        userId: user.id,
        eventType: "OTP_VERIFIED",
        meta: {
          type: data.type,
        },
      },
    });

    return {
      message: "OTP verified successfully",
      verified: true,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;

    logger.error({
      message: error.message,
      stack: error.stack,
    });

    throw new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }
};
export const resetPassword = async (data: {
  email: string;
  otp: string;
  newPassword: string;
}) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { email: data.email },
      include: { credentials: true },
    });

    if (!user || !user.credentials) {
      throw new AppError("Invalid request", 400, "INVALID_REQUEST");
    }

    const codeHash = crypto
      .createHash("sha256")
      .update(data.otp, "utf8")
      .digest("hex");

    const otp = await tx.oTP.findFirst({
      where: {
        userId: user.id,
        type: "PASSWORD_RESET",
        consumed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new AppError("Invalid or expired OTP", 400, "INVALID_OTP");
    }

    if (otp.codeHash !== codeHash) {
      await tx.oTP.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError("Invalid OTP", 400, "INVALID_OTP");
    }

    const passwordHash = await hashPassword(data.newPassword);

    await tx.userCredential.update({
      where: { userId: user.id },
      data: { passwordHash },
    });

    await tx.oTP.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    await tx.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    });

    await tx.auditLogs.create({
      data: {
        userId: user.id,
        eventType: "PASSWORD_RESET_COMPLETED",
      },
    });

    return { message: "Password reset successful" };
  });
};
