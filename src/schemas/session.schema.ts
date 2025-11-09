import { z } from "zod";

export const CreateSessionSchema = z.object({
  userId: z.string().uuid(),
  sessionToken: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  expiresAt: z.date(),
});

export const UpdateSessionSchema = z.object({
  id: z.string().uuid(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  expiresAt: z.date().optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
