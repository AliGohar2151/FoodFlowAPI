import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from "./auth.schema.js";

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    const input = req.validatedBody as RegisterInput;
    const metadata = {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    };

    const result = await authService.register(input, metadata);
    sendSuccess(res, result, {
      message: "User registered successfully",
      statusCode: 201,
    });
  }

  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    const input = req.validatedBody as LoginInput;
    const metadata = {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    };

    const result = await authService.login(input, metadata);
    sendSuccess(res, result, { message: "Login successful" });
  }

  /**
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    const input = req.validatedBody as RefreshTokenInput;
    const metadata = {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    };

    const result = await authService.refreshToken(input.refreshToken, metadata);
    sendSuccess(res, result, { message: "Token refreshed successfully" });
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    const input = req.validatedBody as RefreshTokenInput;
    await authService.logout(input.refreshToken);
    sendSuccess(res, null, { message: "Logged out successfully" });
  }

  /**
   * POST /api/v1/auth/logout-all
   */
  async logoutAll(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    await authService.logoutAll(req.user.id);
    sendSuccess(res, null, { message: "Logged out from all sessions" });
  }

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as ChangePasswordInput;
    await authService.changePassword(req.user.id, input);
    sendSuccess(res, null, {
      message: "Password changed successfully. Please log in again.",
    });
  }

  /**
   * GET /api/v1/auth/me
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    sendSuccess(res, req.user, { message: "Profile retrieved" });
  }
}

export const authController = new AuthController();
