export type JwtPayload = {
  sub: number;
  email: string;
  iat?: string;
  exp?: string;
};
