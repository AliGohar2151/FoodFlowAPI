import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { config } from "../../config/index.js";
import { prisma } from "../../infrastructure/database/index.js";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from "../../common/errors/index.js";
import type { RegisterInput, LoginInput, ChangePasswordInput } from "./auth.schema.js";
import type { AuthResponse, AuthTokens, JwtPayload, UserResponse } from "./auth.types.js";

export interface SessionMetadata {
  userAgent?: string | null;
  ipAddress?: string | null;
}

/**
 * Hash raw refresh token for database storage using SHA-256.
 */
function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generate Access and Refresh JWT tokens.
 */
function generateTokens(userId: string, email: string): AuthTokens {
  const accessPayload: JwtPayload = {
    userId,
    email,
    type: "access",
  };

  const refreshPayload: JwtPayload = {
    userId,
    email,
    type: "refresh",
  };

  const accessToken = jwt.sign(accessPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as unknown as jwt.SignOptions);

  const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as unknown as jwt.SignOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiresIn,
  };
}

/**
 * Maps DB User model to safe API response object.
 */
function toUserResponse(user: {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

export class AuthService {
  /**
   * Register a new user account.
   */
  async register(
    input: RegisterInput,
    metadata: SessionMetadata = {},
  ): Promise<AuthResponse> {
    // 1. Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // 2. Check existing phone if provided
    if (input.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: input.phone },
      });
      if (existingPhone) {
        throw new ConflictError("User with this phone number already exists");
      }
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(input.password, config.security.bcryptRounds);

    // 4. Find CUSTOMER role
    const customerRole = await prisma.role.findUnique({
      where: { name: "CUSTOMER" },
    });

    // 5. Create User + assign role in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone ?? null,
          status: "ACTIVE", // Set ACTIVE for ease of testing
        },
      });

      if (customerRole) {
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: customerRole.id,
          },
        });
      }

      return newUser;
    });

    // 6. Issue tokens & store session
    const tokens = generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken, metadata);

    return {
      user: toUserResponse(user),
      tokens,
    };
  }

  /**
   * Authenticate user credentials and start session.
   */
  async login(input: LoginInput, metadata: SessionMetadata = {}): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status === "SUSPENDED") {
      throw new UnauthorizedError("Your account has been suspended");
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = generateTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken, metadata);

    return {
      user: toUserResponse(user),
      tokens,
    };
  }

  /**
   * Rotate Refresh Token — issue new access + refresh token, revoke old one.
   * Includes automatic reuse detection: if a revoked token is reused, all user sessions are revoked.
   */
  async refreshToken(
    rawRefreshToken: string,
    metadata: SessionMetadata = {},
  ): Promise<AuthResponse> {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(rawRefreshToken, config.jwt.refreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    // Reuse detection: if token doesn't exist or is already revoked
    if (!storedToken || storedToken.revokedAt) {
      if (storedToken) {
        // Automatic security response: Revoke ALL tokens for this user family
        await prisma.refreshToken.updateMany({
          where: { userId: storedToken.userId },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedError(
        "Invalid session — token reuse detected or session revoked",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status === "SUSPENDED") {
      throw new UnauthorizedError("User account not active");
    }

    const newTokens = generateTokens(user.id, user.email);

    // Atomically revoke old token and insert new token with chain reference
    await prisma.$transaction(async (tx) => {
      const newHash = hashToken(newTokens.refreshToken);
      const newStoredToken = await tx.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: newHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          userAgent: metadata.userAgent ?? null,
          ipAddress: metadata.ipAddress ?? null,
        },
      });

      await tx.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: newStoredToken.id,
        },
      });
    });

    return {
      user: toUserResponse(user),
      tokens: newTokens,
    };
  }

  /**
   * Logout current session by revoking the given refresh token.
   */
  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all active sessions for a user.
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Change user password.
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User");
    }

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new BadRequestError("Incorrect current password");
    }

    const newPasswordHash = await bcrypt.hash(
      input.newPassword,
      config.security.bcryptRounds,
    );

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Security best practice: revoke all active refresh tokens after password change
    await this.logoutAll(userId);
  }

  /**
   * Store refresh token hash in DB.
   */
  private async storeRefreshToken(
    userId: string,
    rawRefreshToken: string,
    metadata: SessionMetadata,
  ): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30d
        userAgent: metadata.userAgent ?? null,
        ipAddress: metadata.ipAddress ?? null,
      },
    });
  }
}

export const authService = new AuthService();
