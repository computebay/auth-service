import type { Request, Response, NextFunction } from "express";
import type { Role } from "../generated/prisma/enums";

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as Role | undefined;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User role not found",
        error: {
          code: "FORBIDDEN",
        },
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden`,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          requiredRoles: allowedRoles,
          userRole: userRole,
        },
      });
    }

    next();
  };
};
