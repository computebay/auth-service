import type { Request, Response, NextFunction } from "express";
import prisma from "../config/db";
import logger from "../libs/logger";
import { isPlatformAdmin } from "../utils/admin";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.sub;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      error: { code: "UNAUTHORIZED" },
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
        error: { code: "UNAUTHORIZED" },
      });
    }

    if (!isPlatformAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: admin access required",
        error: { code: "INSUFFICIENT_PERMISSIONS" },
      });
    }

    next();
  } catch (error: any) {
    logger.error({
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: { code: "INTERNAL_ERROR" },
    });
  }
};
