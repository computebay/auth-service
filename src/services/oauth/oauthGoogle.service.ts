import crypto from "crypto"
import { codec } from "zod";
import { AppError } from "../../utils/error";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_PROFILE_URL = "https://www.googleapis.com/oauth2/v3/userinfo";


export const googleOAuthService = {
    getAuthUrl() {
        const state = crypto.randomUUID()

        const params = new URLSearchParams({
            client_id: Bun.env.GOOGLE_OAUTH_CLIENT_ID!,
            redirect_uri: Bun.env.GOOGLE_OAUTH_REDIRECT_URI!,
            response_type: "code",
            scope: "openid email profile",
            state

        })

        return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    },

    async getUserProfile(code: string, _state: string) {
        const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: Bun.env.GOOGLE_CLIENT_ID!,
                client_secret: Bun.env.GOOGLE_CLIENT_SECRET!,
                code,
                redirect_uri: Bun.env.GOOGLE_REDIRECT_URI!,
                grant_type: "authorization_code",
            }),
        });

        const tokenData = await tokenRes.json() as { access_token: string };
        if (!tokenData || !tokenData.access_token) {
            return new Error("No tokenData fetched")
        }

        const profileRes = await fetch(GOOGLE_PROFILE_URL, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const profile = await profileRes.json() as { sub: string; email: string; name: string; email_verified: boolean };
        
        return {
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            emailVerified: profile.email_verified,
        };

    }
}