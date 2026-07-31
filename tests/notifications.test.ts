import { describe, it, expect } from "vitest";
import {
  sendNotificationSchema,
  notificationQuerySchema,
} from "../src/modules/notifications/notifications.schema.js";

describe("Notifications Module — Schema Unit Tests", () => {
  it("should validate send notification schema", () => {
    const valid = sendNotificationSchema.safeParse({
      userId: "cjld2cjxh0000qzrmn831i7rn",
      title: "Order Confirmed",
      message: "Your order #101 has been confirmed by the restaurant.",
      type: "ORDER_CONFIRMED",
      channel: "IN_APP",
      metadata: { orderId: "order-123" },
    });
    expect(valid.success).toBe(true);
  });

  it("should validate notification query schema", () => {
    const valid = notificationQuerySchema.safeParse({
      page: 1,
      limit: 10,
      isRead: false,
    });
    expect(valid.success).toBe(true);
  });
});
