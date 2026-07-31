import { Router, type IRouter } from "express";
import { paymentsController } from "./payments.controller.js";
import {
  initiatePaymentSchema,
  processRefundSchema,
  webhookPayloadSchema,
} from "./payments.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// Unauthenticated Webhook Endpoint (verified via gateway signature)
router.post(
  "/webhook",
  validate({ body: webhookPayloadSchema }),
  asyncHandler((req, res) => paymentsController.processWebhook(req, res)),
);

// Authenticated Payment Endpoints
router.post(
  "/initiate",
  asyncHandler(authenticate),
  validate({ body: initiatePaymentSchema }),
  asyncHandler((req, res) => paymentsController.initiatePayment(req, res)),
);

router.get(
  "/order/:orderId",
  asyncHandler(authenticate),
  asyncHandler((req, res) => paymentsController.getPaymentByOrderId(req, res)),
);

router.post(
  "/:paymentId/refund",
  asyncHandler(authenticate),
  validate({ body: processRefundSchema }),
  asyncHandler((req, res) => paymentsController.processRefund(req, res)),
);

export default router;
