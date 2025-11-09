import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validate =
    (schema: ZodSchema<any>) =>
        (req: Request, res: Response, next: NextFunction) => {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: result.error.issues,
                });
            }

            // Replace req.body with parsed & typed data
            req.body = result.data;
            next();
        };
