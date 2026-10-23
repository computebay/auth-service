export interface AdminCandidate {
  role?: string | null;
}

/** Platform admins are users whose `role` column is set to ADMIN. */
export function isPlatformAdmin(user: AdminCandidate): boolean {
  return user.role === "ADMIN";
}
