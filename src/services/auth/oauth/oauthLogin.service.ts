import prisma from "../../../config/db";
import { signAccessToken, generateRefreshToken } from "../../../utils/token";


const providerMap = {
  google: "GOOGLE",
  github: "GITHUB",
} as const;
export const handleOAuthLogin = async (data: {
  provider: "google" | "github";
  providerUserId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}) => {
  return prisma.$transaction(async (tx) => {
    const existingOAuth = await tx.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: providerMap[data.provider],
          providerAccountId: data.providerUserId,
        },
      },
      include: { user: true },
    });

    let user = existingOAuth?.user ?? null;

    // 2 If no OAuthAccount, try email
    if (!user) {
      user = await tx.user.findUnique({
        where: { email: data.email },
      });

      //  If still no user → create
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

      //  Link OAuthAccount
      await tx.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: data.provider.toUpperCase() as "GOOGLE" | "GITHUB",
          providerAccountId: data.providerUserId,
          email: data.email,
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
