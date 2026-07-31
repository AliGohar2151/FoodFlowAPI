import type { Request, Response } from "express";
import { paymentsService } from "./payments.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type {
  InitiatePaymentInput,
  ProcessRefundInput,
  WebhookPayloadInput,
} from "./payments.schema.js";

export class PaymentsController {
  /**
   * POST /api/v1/payments/initiate
   */
  async initiatePayment(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as InitiatePaymentInput;
    const payment = await paymentsService.initiatePayment(req.user.id, input);
    sendSuccess(res, payment, { message: "Payment initiated", statusCode: 201 });
  }

  /**
   * GET /api/v1/payments/order/:orderId
   */
  async getPaymentByOrderId(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { orderId } = req.params as { orderId: string };
    const payment = await paymentsService.getPaymentByOrderId(req.user, orderId);
    sendSuccess(res, payment, { message: "Payment details retrieved" });
  }

  /**
   * POST /api/v1/payments/webhook
   */
  async processWebhook(req: Request, res: Response): Promise<void> {
    const signature =
      (req.headers["x-stripe-signature"] as string | undefined) ??
      (req.headers["stripe-signature"] as string | undefined);
    const rawPayload = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    const body = req.validatedBody as WebhookPayloadInput;

    const result = await paymentsService.processWebhook(rawPayload, signature, body);
    sendSuccess(res, result, { message: "Webhook processed" });
  }

  /**
   * POST /api/v1/payments/:paymentId/refund
   */
  async processRefund(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { paymentId } = req.params as { paymentId: string };
    const input = req.validatedBody as ProcessRefundInput;
    const refund = await paymentsService.processRefund(req.user, paymentId, input);
    sendSuccess(res, refund, { message: "Refund processed successfully" });
  }
}

export const paymentsController = new PaymentsController();
