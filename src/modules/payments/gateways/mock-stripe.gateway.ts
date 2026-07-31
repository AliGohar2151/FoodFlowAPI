import crypto from "node:crypto";
import type {
  PaymentGateway,
  CreatePaymentIntentParams,
  CreatePaymentIntentResult,
  VerifyPaymentResult,
  ProcessRefundParams,
  ProcessRefundResult,
} from "./payment-gateway.interface.js";

export class MockStripeGateway implements PaymentGateway {
  readonly name = "MOCK_STRIPE";

  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<CreatePaymentIntentResult> {
    const transactionId = `txn_${crypto.randomBytes(12).toString("hex")}`;
    const clientSecret = `pi_mock_secret_${crypto.randomBytes(16).toString("hex")}`;

    return {
      transactionId,
      clientSecret,
      status: "PENDING",
      gatewayReference: `pi_${params.orderId}`,
    };
  }

  async verifyPayment(transactionId: string): Promise<VerifyPaymentResult> {
    // Mock successful verification by default
    return {
      isSuccess: true,
      status: "PAID",
      gatewayReference: transactionId,
    };
  }

  async processRefund(_params: ProcessRefundParams): Promise<ProcessRefundResult> {
    const refundId = `re_${crypto.randomBytes(12).toString("hex")}`;

    return {
      refundId,
      isSuccess: true,
      status: "COMPLETED",
    };
  }

  verifyWebhookSignature(payload: string, signature?: string, secret?: string): boolean {
    if (!signature) {
      return false;
    }

    const webhookSecret = secret ?? "whsec_dev_mock_secret";
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return signature === expected || signature === "mock_signature_valid";
  }
}

export const mockStripeGateway = new MockStripeGateway();
