import type { Request, Response } from "express";
import { registerUser, loginUser, refreshAuthToken } from "../../../services/auth/auth.service";
import { AppError } from "../../../utils/error";

export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
      error: null,
      meta: {
        version: "v1",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || null,
      },
    });
  } catch (err: any) {
    // APP ERROR HANDLING
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

    // UNEXPECTED ERROR HANDLING
    console.error("Unexpected error in register:", err);

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

export const login = async (req: Request, res: Response) => {
  try {
    const user = await loginUser(req.body);

    return res.status(201).json({
      success: true,
      message: "User login successfully",
      data: user,
      error: null,
      meta: {
        version: "v1",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || null,
      },
    });
  } catch (err: any) {
    // APP ERROR HANDLING
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

    // UNEXPECTED ERROR HANDLING
    console.error("Unexpected error in login:", err);

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
}


export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  try {
    const token = await refreshAuthToken(refreshToken);

    return res.status(201).json({
      success: true,
      message: "Token refreshed",
      data: token,
      error: null,
      meta: {
        version: "v1",
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || null,
      },
    });
  } catch (err: any) {
    // APP ERROR HANDLING
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

    // UNEXPECTED ERROR HANDLING
    console.error("Unexpected error in token refresh:", err);

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
