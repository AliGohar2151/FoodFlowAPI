import { describe, it, expect } from "vitest";
import {
  recordAuditLogSchema,
  auditLogQuerySchema,
} from "../src/modules/audit-logs/audit-logs.schema.js";

describe("Audit Logging Module — Schema Unit Tests", () => {
  it("should validate record audit log schema", () => {
    const valid = recordAuditLogSchema.safeParse({
      action: "USER_SUSPENDED",
      entityType: "User",
      entityId: "user-456",
      oldValues: { status: "ACTIVE" },
      newValues: { status: "SUSPENDED" },
    });
    expect(valid.success).toBe(true);
  });

  it("should validate audit log query schema", () => {
    const valid = auditLogQuerySchema.safeParse({
      page: 1,
      limit: 20,
      action: "ROLE_CHANGED",
      entityType: "User",
    });
    expect(valid.success).toBe(true);
  });
});
