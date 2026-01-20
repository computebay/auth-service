import crypto from "crypto";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_PROFILE_URL = "https://api.github.com/user";
const GITHUB_EMAIL_URL = "https://api.github.com/user/emails";

export const githubOAuthService = {
  getAuthUrl() {
    const state = crypto.randomUUID();

    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
      scope: "user:email",
      state,
    });

    return `${GITHUB_AUTH_URL}?${params.toString()}`;
  },

  async getUserProfile(code: string, _state: string) {
    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID!,
        client_secret: process.env.GITHUB_CLIENT_SECRET!,
        code,
      }),
    });

    const tokenData = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch(GITHUB_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = (await profileRes.json()) as {
      id: number;
      login: string;
      email: string;
      name: string;
      email_verified: boolean;
    };

    let email = profile.email;

    if (!email) {
      const emailRes = await fetch(GITHUB_EMAIL_URL, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      const emails = (await emailRes.json()) as Array<{
        primary: boolean;
        email: string;
      }>;
      email = emails.find((e) => e.primary)?.email || "";
    }

    return {
      id: profile.id.toString(),
      email,
      name: profile.name || profile.login,
      emailVerified: true,
    };
  },
};
