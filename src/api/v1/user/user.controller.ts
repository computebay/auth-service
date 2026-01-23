import type { Request, Response } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../../services/user/user.service";
import { AppError } from "../../../utils/error";

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
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

    console.error("Unexpected error in listUsers:", err);

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

export const getUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if(!userId){
      throw new Error("user id not provided")
    }
    const user = await getUserById(userId);

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
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

    console.error("Unexpected error in getUser:", err);

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

export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const user = await updateUser(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
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

    console.error("Unexpected error in updateCurrentUser:", err);

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

export const deleteCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const result = await deleteUser(userId);

    return res.status(200).json({
      success: true,
      message: result.message,
      data: null,
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

    console.error("Unexpected error in deleteCurrentUser:", err);

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
