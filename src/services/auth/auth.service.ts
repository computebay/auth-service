import prisma from "../../config/db";
import type { RegisterUserInput } from "../../validators/user.schema";
import type { LoginUserCredential } from "../../validators/userCredential.schema";
import logger from "../../libs/logger";
import { AppError } from "../../utils/error";
import { hashPassword, verifyPassword } from "../../utils/crypto";
import { logAudit } from "../../utils/audit";
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
        const user = await prisma.user.findUnique({
            where: {
                email: data.email
            },
            include: {
                credentials: true,
                memberships: true
            }
        })

        if (!user || !user.credentials) {
            throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
        }

        const valid = await verifyPassword(
            data.password,
            user.credentials.passwordHash,
        )

        if (!valid) {
            throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS")
        }

        const membership = user.memberships[0];

        const accessToken = signAccessToken({
            sub: user.id,
            orgId: membership?.orgId,
            role: membership?.role
        })

        const { token, hash } = generateRefreshToken();

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            }
        })

        await logAudit("USER_LOGIN", user.id, {
            email: user.email,
        });

        return {
            accessToken,
            refreshToken: token,
        };
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
