import { describe, it, expect } from "vitest";
import swaggerDocument from "../src/docs/swagger.json" with { type: "json" };

describe("API Documentation Module — OpenAPI Spec Unit Tests", () => {
  it("should have valid OpenAPI 3.0 info structure", () => {
    expect(swaggerDocument.openapi).toBe("3.0.3");
    expect(swaggerDocument.info.title).toBe("FoodFlow API");
    expect(swaggerDocument.info.version).toBe("1.0.0");
  });

  it("should document essential core API endpoints", () => {
    const paths = Object.keys(swaggerDocument.paths);
    expect(paths).toContain("/health");
    expect(paths).toContain("/auth/register");
    expect(paths).toContain("/auth/login");
    expect(paths).toContain("/auth/me");
    expect(paths).toContain("/restaurants");
    expect(paths).toContain("/menus/restaurant/{restaurantId}");
    expect(paths).toContain("/carts/mine");
    expect(paths).toContain("/orders");
    expect(paths).toContain("/payments/process");
    expect(paths).toContain("/deliveries");
    expect(paths).toContain("/reviews");
    expect(paths).toContain("/coupons/validate");
    expect(paths).toContain("/notifications");
    expect(paths).toContain("/jobs/stats");
    expect(paths).toContain("/audit-logs");
    expect(paths).toContain("/caching/health");
  });

  it("should configure Bearer JWT security scheme", () => {
    expect(swaggerDocument.components.securitySchemes.bearerAuth.type).toBe("http");
    expect(swaggerDocument.components.securitySchemes.bearerAuth.scheme).toBe("bearer");
    expect(swaggerDocument.components.securitySchemes.bearerAuth.bearerFormat).toBe(
      "JWT",
    );
  });
});
