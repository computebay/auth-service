export interface AccessTokenPayload {
  sub: string;
  orgId?: string;
  role?: string;
  accountType?: "DEVELOPER" | "CONTRIBUTOR";
  iat?: number;
  exp?: number;
}
