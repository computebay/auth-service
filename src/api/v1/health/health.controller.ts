import type { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    service: "Auth Service",
    timestamp: new Date().toISOString(),
  });
};
