import type { UserStatus } from "../../generated/prisma/client.js";

export interface JwtPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserResponse {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}
