import prisma from "../../config/db";
import { signAccessToken, generateRefreshToken } from "../../utils/token";

export const handleOAuthLogin = async (data: {
    provider: "google" | "github";
    providerUserId: string;
    email: string;
    name: string;
    emailVerified: boolean;
}) => {
    return prisma.$transaction(async (tx) => {
        let user = await tx.user.findUnique({
            where: { email: data.email },
        });

        if (!user) {
            user = await tx.user.create({
                data: {
                    email: data.email,
                    name: data.name,
                    isEmailVerified: data.emailVerified,
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
        }

        const accessToken = signAccessToken({ sub: user.id });
        const { token: refreshToken, hash } = generateRefreshToken();

        await tx.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: hash,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        return { accessToken, refreshToken };
    });
};
