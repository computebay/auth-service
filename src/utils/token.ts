import jwt from 'jsonwebtoken'
import crypto from 'crypto'


export const signAccessToken = (payload: object) => {
    jwt.sign(payload, Bun.env.JWT_ACCESS_SECRET!, {
        expiresIn: "15m"
    })
}

export const generateRefreshToken = () => {
    const token = crypto.randomBytes(64).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    return { token, hash }
}