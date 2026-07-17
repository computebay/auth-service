import jwt, { JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { AppError } from "./error";
import type { AccessTokenPayload } from "../types/auth";

export const signAccessToken = (payload: object) => {
  return jwt.sign(payload, Bun.env.JWT_ACCESS_SECRET!, {
    expiresIn: Bun.env.JWT_TIMEOUT,
  });
};

export const generateRefreshToken = () => {
  const token = crypto.randomBytes(64).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
};

export const verifyToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, Bun.env.JWT_ACCESS_SECRET!) as JwtPayload;

    // Runtime safety check (important)
    if (!decoded || typeof decoded !== "object" || !decoded.sub) {
      throw new AppError("Invalid token payload", 401, "INVALID_TOKEN");
    }

    return decoded as AccessTokenPayload;
  } catch {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
};
