import type { Request, Response } from "express";
import { getAdminStats } from "../../../services/admin/admin.service";
import { AppError } from "../../../utils/error";

export const getStats = async (req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();

    return res.status(200).json({
      success: true,
      message: "Admin statistics retrieved successfully",
      data: stats,
      error: null,
      meta: {
        version: "v1",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || null,
      },
    });
  } catch (err: any) {
    if (err instanceof AppError) {
      return res.status(err.status).json({
        success: false,
        message: err.message,
        data: null,
        error: { code: err.code, details: err.details },
        meta: {
          version: "v1",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || null,
        },
      });
    }

    console.error("Unexpected error in getStats:", err);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      meta: {
        version: "v1",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || null,
      },
    });
  }
};
