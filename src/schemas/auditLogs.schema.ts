import { z } from "zod";

export const CreateAuditLogSchema = z.object({
  userId: z.uuid().optional(),
  eventType: z.string(),
  meta: z.any().optional(),
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;
