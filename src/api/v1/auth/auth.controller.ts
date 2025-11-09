import type { Request, Response } from "express";
import { registerUser } from "../../../services/auth.service";


export const register = async (req: Request, res: Response) => {
  try {
    const user = await registerUser(req.body);

    res.status(201).json({
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
    console.error("Error in register:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Error registering user",
      data: null,
      error: {
        code: err.code || "INTERNAL_ERROR",
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
