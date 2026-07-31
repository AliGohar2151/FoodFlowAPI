import { prisma } from "../../infrastructure/database/index.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";
import { mockStripeGateway } from "./gateways/mock-stripe.gateway.js";
import type {
  InitiatePaymentInput,
  ProcessRefundInput,
  WebhookPayloadInput,
} from "./payments.schema.js";
import {
  OrderStatus,
  PaymentStatus,
  RefundStatus,
} from "../../generated/prisma/client.js";

export class PaymentsService {
  /**
   * Initiate payment for an order with idempotency check.
   */
  async initiatePayment(userId: string, input: InitiatePaymentInput) {
    const order = await prisma.order.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.userId !== userId) {
      throw new ForbiddenError("You are not authorized to pay for this order");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestError("Cannot initiate payment for a cancelled order");
    }

    // Check existing payment for idempotency
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: input.orderId },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.PAID) {
        throw new BadRequestError("This order has already been paid for");
      }
      return this.formatPayment(existingPayment);
    }

    const intent = await mockStripeGateway.createPaymentIntent({
      orderId: order.id,
      amount: Number(order.totalAmount),
      currency: "USD",
      idempotencyKey: input.idempotencyKey,
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        amount: order.totalAmount,
        currency: "USD",
        status: PaymentStatus.PENDING,
        method: input.method,
        transactionId: intent.transactionId,
        idempotencyKey: input.idempotencyKey ?? null,
        gatewayProvider: mockStripeGateway.name,
        paymentIntentId: intent.gatewayReference,
        clientSecret: intent.clientSecret,
      },
    });

    return this.formatPayment(payment);
  }

  /**
   * Process incoming webhook event with server-trusted signature verification and idempotency.
   */
  async processWebhook(
    rawPayload: string,
    signature: string | undefined,
    body: WebhookPayloadInput,
  ) {
    const isValid = mockStripeGateway.verifyWebhookSignature(rawPayload, signature);
    if (!isValid) {
      throw new BadRequestError("Invalid webhook signature");
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ transactionId: body.transactionId }, { orderId: body.orderId }],
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment transaction");
    }

    if (body.event === "payment.intent.succeeded") {
      if (payment.status === PaymentStatus.PAID) {
        return { received: true, idempotent: true };
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.PAID },
        });

        const currentOrder = await tx.order.findUnique({
          where: { id: payment.orderId },
        });

        if (currentOrder?.status === OrderStatus.PENDING) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: OrderStatus.CONFIRMED },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: payment.orderId,
              fromStatus: OrderStatus.PENDING,
              toStatus: OrderStatus.CONFIRMED,
              changedById: payment.userId,
              reason: "Payment verified via webhook",
            },
          });
        }
      });

      return { received: true, status: "PAID" };
    }

    if (body.event === "payment.intent.failed") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: body.failureReason ?? "Payment authorization failed",
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: OrderStatus.CANCELLED },
        });
      });

      return { received: true, status: "FAILED" };
    }

    return { received: true };
  }

  /**
   * Retrieve payment details for an order.
   */
  async getPaymentByOrderId(userContext: UserContext, orderId: string) {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
        refunds: true,
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment record for this order");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isCustomer = userContext.id === payment.userId;
    const isOwner = userContext.id === payment.order.restaurant.ownerId;

    if (!isAdmin && !isCustomer && !isOwner) {
      throw new ForbiddenError("You are not authorized to view this payment");
    }

    return {
      ...this.formatPayment(payment),
      refunds: payment.refunds.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        status: r.status,
        reason: r.reason,
        createdAt: r.createdAt,
      })),
    };
  }

  /**
   * Process refund for a paid transaction.
   */
  async processRefund(
    userContext: UserContext,
    paymentId: string,
    input: ProcessRefundInput,
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError("Payment record");
    }

    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    const isOwner = userContext.id === payment.order.restaurant.ownerId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenError("Only restaurant owners or admins can process refunds");
    }

    if (
      payment.status !== PaymentStatus.PAID &&
      payment.status !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestError(
        `Cannot process refund for payment in status '${payment.status}'`,
      );
    }

    if (input.idempotencyKey) {
      const existingRefund = await prisma.refund.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existingRefund) {
        return {
          id: existingRefund.id,
          paymentId: existingRefund.paymentId,
          amount: Number(existingRefund.amount),
          status: existingRefund.status,
          reason: existingRefund.reason,
          createdAt: existingRefund.createdAt,
        };
      }
    }

    const gatewayResult = await mockStripeGateway.processRefund({
      paymentId: payment.id,
      transactionId: payment.transactionId ?? payment.id,
      amount: input.amount,
      reason: input.reason,
      idempotencyKey: input.idempotencyKey,
    });

    const refund = await prisma.$transaction(async (tx) => {
      const createdRefund = await tx.refund.create({
        data: {
          paymentId: payment.id,
          amount: input.amount,
          reason: input.reason ?? null,
          status:
            gatewayResult.status === "COMPLETED"
              ? RefundStatus.COMPLETED
              : RefundStatus.FAILED,
          refundId: gatewayResult.refundId,
          idempotencyKey: input.idempotencyKey ?? null,
        },
      });

      const totalPaid = Number(payment.amount);
      const isFullRefund = input.amount >= totalPaid;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: isFullRefund
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
        },
      });

      return createdRefund;
    });

    return {
      id: refund.id,
      paymentId: refund.paymentId,
      amount: Number(refund.amount),
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.createdAt,
    };
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────

  private formatPayment(payment: {
    id: string;
    orderId: string;
    userId: string;
    amount: unknown;
    currency: string;
    status: string;
    method: string;
    transactionId: string | null;
    gatewayProvider: string;
    clientSecret: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      transactionId: payment.transactionId,
      gatewayProvider: payment.gatewayProvider,
      clientSecret: payment.clientSecret,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}

export const paymentsService = new PaymentsService();
