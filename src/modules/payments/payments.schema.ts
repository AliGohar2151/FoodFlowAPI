import { z } from "zod";
import { PaymentMethod } from "../../generated/prisma/client.js";

export const initiatePaymentSchema = z.object({
  orderId: z.string().cuid({ message: "Invalid order ID format" }),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CREDIT_CARD),
  idempotencyKey: z.string().max(100).optional(),
});

export const processRefundSchema = z.object({
  amount: z.coerce.number().positive({ message: "Refund amount must be positive" }),
  reason: z.string().max(300).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const webhookPayloadSchema = z.object({
  event: z.enum([
    "payment.intent.succeeded",
    "payment.intent.failed",
    "refund.succeeded",
  ]),
  transactionId: z.string(),
  orderId: z.string(),
  failureReason: z.string().optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type ProcessRefundInput = z.infer<typeof processRefundSchema>;
export type WebhookPayloadInput = z.infer<typeof webhookPayloadSchema>;
