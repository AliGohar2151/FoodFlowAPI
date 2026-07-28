import { describe, it, expect, beforeAll } from "vitest";
import { authService } from "../src/modules/auth/auth.service.js";

describe("Auth Module — Service Logic", () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: "Password123!",
    firstName: "Test",
    lastName: "User",
  };

  it("should format register schema correctly", async () => {
    const { registerSchema } = await import("../src/modules/auth/auth.schema.js");

    const validResult = registerSchema.safeParse(testUser);
    expect(validResult.success).toBe(true);

    const invalidResult = registerSchema.safeParse({
      ...testUser,
      password: "weak",
    });
    expect(invalidResult.success).toBe(false);
  });
});
