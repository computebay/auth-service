import crypto from "crypto";
import { codec } from "zod";
import { AppError } from "../../../utils/error";
import logger from "../../../libs/logger";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_PROFILE_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export const googleOAuthService = {
  getAuthUrl() {
    const state = crypto.randomUUID();

    const params = new URLSearchParams({
      client_id: Bun.env.GOOGLE_OAUTH_CLIENT_ID!,
      redirect_uri: Bun.env.GOOGLE_OAUTH_REDIRECT_URI!,
      response_type: "code",
      scope: "openid email profile",
      state,
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  },

  async getUserProfile(code: string, _state: string) {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Bun.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: Bun.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        code,
        redirect_uri: Bun.env.GOOGLE_OAUTH_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => "unable to read error body");
      console.error("[GOOGLE_OAUTH_TOKEN_ERROR]", {
        status: tokenRes.status,
        statusText: tokenRes.statusText,
        body: errText,
      });
      throw new Error(`Google token fetch failed: ${tokenRes.status}`);
    }

    let tokenData: { access_token?: string };
    try {
      tokenData = (await tokenRes.json()) as { access_token?: string };
    } catch (e) {
      console.error("[GOOGLE_OAUTH_TOKEN_PARSE_ERROR]", e);
      throw new Error("Failed to parse Google token response");
    }

    if (!tokenData?.access_token) {
      console.error("[GOOGLE_OAUTH_TOKEN_MISSING]", {
        response: tokenData,
      });
      throw new Error("No access_token in Google token response");
    }


    const profileRes = await fetch(GOOGLE_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    
    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      name: string;
      email_verified: boolean;
    };

    return {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      emailVerified: profile.email_verified,
    };
  },
};
