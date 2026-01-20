import crypto from "crypto"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_PROFILE_URL = "https://www.googleapis.com/oauth2/v3/userinfo";


export const googleOauthService = {
    getAuthUrl() {
        const state = crypto.randomUUID()

        const params = new URLSearchParams({
            client_id: Bun.env.GOOGLE_OAUTH_CLIENT_ID!,
            redirect_uri: Bun.env.GOOGLE_OAUTH_REDIRECT_URI!,

        })
    }
}