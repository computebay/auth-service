import type { Request, Response } from "express";
import { AppError } from "../../../../utils/error";
import { googleOAuthService } from "../../../../services/auth/oauth/oauthGoogle.service";
import { githubOAuthService } from "../../../../services/auth/oauth/oauthGithub.service";
import { handleOAuthLogin } from "../../../../services/auth/oauth/oauthLogin.service";
import logger from "../../../../libs/logger";

const providerMap = {
    google: googleOAuthService,
    github: githubOAuthService,
} as const;

type Provider = keyof typeof providerMap;

export const startOAuth = async (req: Request, res: Response) => {
    const provider = req.params.provider as Provider;

    const service = providerMap[provider];
    if (!service) {
        throw new AppError("Unsupported OAuth provider", 400, "INVALID_PROVIDER");
    }

    const redirectUrl = service.getAuthUrl();
    return res.redirect(302, redirectUrl);
};

export const oauthCallback = async (req: Request, res: Response) => {
    const provider = req.params.provider as Provider;
    const { code, state } = req.query as { code?: string; state?: string };

    const service = providerMap[provider];
    if (!service) {
        throw new AppError("Unsupported OAuth provider", 400, "INVALID_PROVIDER");
    }
    logger.info(`Service : ${service} , Code : ${code} , State : ${state}`)
    if (!code || !state) {
        throw new AppError("Missing OAuth params", 400, "OAUTH_INVALID_CALLBACK");
    }

    const profile = (await service.getUserProfile(code, state)) as {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
    };
    logger.info(`profile : ${profile}`)

    // Common login / register logic
    const { accessToken, refreshToken } = await handleOAuthLogin({
        provider,
        providerUserId: profile.id,
        email: profile.email,
        name: profile.name,
        emailVerified: profile.emailVerified,
    });

    // For now: redirect with tokens (can later switch to cookies)
    return res.redirect(
        `${process.env.FRONTEND_URL}/oauth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
};
