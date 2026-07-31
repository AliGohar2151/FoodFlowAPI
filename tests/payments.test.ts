import { describe, it, expect } from "vitest";
import {
  initiatePaymentSchema,
  processRefundSchema,
  webhookPayloadSchema,
} from "../src/modules/payments/payments.schema.js";
import { MockStripeGateway } from "../src/modules/payments/gateways/mock-stripe.gateway.js";

describe("Payments Module — Schema & Gateway Unit Tests", () => {
  const gateway = new MockStripeGateway();

  it("should validate initiate payment schema", () => {
    const valid = initiatePaymentSchema.safeParse({
      orderId: "cjld2cjxh0000qzrmn831i7rn",
      method: "CREDIT_CARD",
      idempotencyKey: "idemp_12345",
    });
    expect(valid.success).toBe(true);
  });

  it("should validate process refund schema", () => {
    const valid = processRefundSchema.safeParse({
      amount: 25.5,
      reason: "Customer requested cancellation",
    });
    expect(valid.success).toBe(true);

    const invalid = processRefundSchema.safeParse({
      amount: -10,
    });
    expect(invalid.success).toBe(false);
  });

  it("should validate webhook payload schema", () => {
    const valid = webhookPayloadSchema.safeParse({
      event: "payment.intent.succeeded",
      transactionId: "txn_12345",
      orderId: "ord_12345",
    });
    expect(valid.success).toBe(true);
  });

  it("should mock create payment intent successfully via gateway", async () => {
    const intent = await gateway.createPaymentIntent({
      orderId: "ord_999",
      amount: 45.0,
      currency: "USD",
    });

    expect(intent.transactionId).toMatch(/^txn_/);
    expect(intent.clientSecret).toMatch(/^pi_mock_secret_/);
    expect(intent.status).toBe("PENDING");
  });

  it("should verify webhook signature correctly", () => {
    const isValidMock = gateway.verifyWebhookSignature("{}", "mock_signature_valid");
    expect(isValidMock).toBe(true);

    const isMissing = gateway.verifyWebhookSignature("{}");
    expect(isMissing).toBe(false);
  });
});
