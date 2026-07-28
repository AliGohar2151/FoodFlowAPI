import { describe, it, expect } from "vitest";
import {
  updateProfileSchema,
  queryUsersSchema,
  updateUserStatusSchema,
} from "../src/modules/users/users.schema.js";

describe("Users Module — Schema Validation", () => {
  it("should validate valid update profile input", () => {
    const valid = updateProfileSchema.safeParse({
      firstName: "UpdatedFirstName",
      lastName: "UpdatedLastName",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate query users pagination parameters", () => {
    const valid = queryUsersSchema.safeParse({
      page: 2,
      limit: 10,
      search: "john",
      status: "ACTIVE",
    });
    expect(valid.success).toBe(true);

    if (valid.success) {
      expect(valid.data.page).toBe(2);
      expect(valid.data.limit).toBe(10);
    }
  });

  it("should validate user status update enum", () => {
    const valid = updateUserStatusSchema.safeParse({ status: "SUSPENDED" });
    expect(valid.success).toBe(true);

    const invalid = updateUserStatusSchema.safeParse({ status: "BANNED" });
    expect(invalid.success).toBe(false);
  });
});
