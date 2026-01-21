import type { Request, Response } from "express";
import {
  createOrganization,
  getOrganizationById,
  getUserOrganizations,
  updateOrganization,
  deleteOrganization,
  addMemberToOrganization,
  removeMemberFromOrganization,
  updateMemberRole,
} from "../../../services/org/org.service";
import { AppError } from "../../../utils/error";

export const createOrg = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const org = await createOrganization(ownerId, req.body);

    return res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: org,
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

    console.error("Unexpected error in createOrg:", err);

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

export const getOrg = async (req: Request, res: Response) => {
  try {
    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }
    const org = await getOrganizationById(orgId);

    return res.status(200).json({
      success: true,
      message: "Organization retrieved successfully",
      data: org,
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

    console.error("Unexpected error in getOrg:", err);

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

export const listUserOrgs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const orgs = await getUserOrganizations(userId);

    return res.status(200).json({
      success: true,
      message: "Organizations retrieved successfully",
      data: orgs,
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

    console.error("Unexpected error in listUserOrgs:", err);

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

export const updateOrg = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const org = await updateOrganization(orgId, ownerId, req.body);

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      data: org,
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

    console.error("Unexpected error in updateOrg:", err);

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

export const deleteOrg = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const result = await deleteOrganization(orgId, ownerId);

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

    console.error("Unexpected error in deleteOrg:", err);

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

export const addMember = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { orgId } = req.params;
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID is required",
      });
    }

    const membership = await addMemberToOrganization(orgId, ownerId, req.body);

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: membership,
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

    console.error("Unexpected error in addMember:", err);

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

export const removeMember = async (req: Request, res: Response) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { orgId, memberId } = req.params;
    if (!orgId || !memberId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID and Member ID are required",
      });
    }

    const result = await removeMemberFromOrganization(
      orgId,
      ownerId,
      memberId,
    );

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

    console.error("Unexpected error in removeMember:", err);

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

export const updateMemberRoleHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const ownerId = req.user?.sub;
    if (!ownerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { orgId, memberId } = req.params;
    if (!orgId || !memberId) {
      return res.status(400).json({
        success: false,
        message: "Organization ID and Member ID are required",
      });
    }

    const { role } = req.body;

    const membership = await updateMemberRole(orgId, ownerId, memberId, role);

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: membership,
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

    console.error("Unexpected error in updateMemberRoleHandler:", err);

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