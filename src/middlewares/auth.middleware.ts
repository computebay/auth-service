import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Auth token missing" });
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    return res.status(401).json({
      success: false,
      message,
    });
  }
};
