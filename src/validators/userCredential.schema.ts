import { z } from "zod";

export const loginUserSchema = z.object({
  email: z.string(),
  password: z.string().min(8),
  accountType: z.enum(["DEVELOPER", "CONTRIBUTOR"]).optional(),
});

export const UpdateUserCredentialSchema = z.object({
  id: z.uuid(),
  passwordHash: z.string().min(8).optional(),
  lastPasswordChange: z.date().optional(),
});

export type LoginUserCredential = z.infer<typeof loginUserSchema>;
export type UpdateUserCredentialInput = z.infer<
  typeof UpdateUserCredentialSchema
>;

/*
model UserCredential {
    id                 String   @id @default(uuid())
    userId             String   @unique
    passwordHash       String
    lastPasswordChange DateTime @default(now())
    createdAt          DateTime @default(now())
    
    user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
*/
