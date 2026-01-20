export interface AccessTokenPayload {
  sub: string;
  orgId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}
