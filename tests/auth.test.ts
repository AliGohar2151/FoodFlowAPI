import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from "../src/modules/auth/auth.schema.js";

describe("Auth Module — Schema Unit Tests", () => {
  describe("registerSchema", () => {
    const baseUser = {
      email: "test@example.com",
      password: "Password123!",
      firstName: "John",
      lastName: "Doe",
    };

    it("should accept valid registration input", () => {
      const result = registerSchema.safeParse(baseUser);
      expect(result.success).toBe(true);
    });

    it("should accept valid registration with optional phone", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        phone: "+14155552671",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        password: "Abc1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase letter", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        password: "alllowercase1",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without digit", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        password: "AllLettersNoDig!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty firstName", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        firstName: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject firstName exceeding 50 characters", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        firstName: "A".repeat(51),
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid phone number format", () => {
      const result = registerSchema.safeParse({
        ...baseUser,
        phone: "not-a-phone",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing email", () => {
      const result = loginSchema.safeParse({ password: "somepass" });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("changePasswordSchema", () => {
    it("should accept valid password change input", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "NewSecure99",
      });
      expect(result.success).toBe(true);
    });

    it("should reject short new password", () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: "OldPass123",
        newPassword: "Short1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("forgotPasswordSchema", () => {
    it("should accept valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "user@test.com" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "bad" });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema", () => {
    it("should accept valid reset token and new password", () => {
      const result = resetPasswordSchema.safeParse({
        token: "valid-token-string",
        newPassword: "NewPass1234",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty reset token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        newPassword: "NewPass1234",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("verifyEmailSchema", () => {
    it("should accept valid verification token", () => {
      const result = verifyEmailSchema.safeParse({ token: "some-verify-token" });
      expect(result.success).toBe(true);
    });

    it("should reject missing token", () => {
      const result = verifyEmailSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("refreshTokenSchema", () => {
    it("should accept valid refresh token", () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: "valid-jwt-token" });
      expect(result.success).toBe(true);
    });

    it("should reject empty refresh token", () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: "" });
      expect(result.success).toBe(false);
    });
  });
});
