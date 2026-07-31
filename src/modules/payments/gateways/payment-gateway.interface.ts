export interface CreatePaymentIntentParams {
  orderId: string;
  amount: number;
  currency: string;
  idempotencyKey?: string | undefined;
}

export interface CreatePaymentIntentResult {
  transactionId: string;
  clientSecret: string;
  status: "PENDING" | "PROCESSING" | "PAID";
  gatewayReference: string;
}

export interface VerifyPaymentResult {
  isSuccess: boolean;
  status: "PAID" | "FAILED" | "PENDING";
  gatewayReference: string;
  failureReason?: string | undefined;
}

export interface ProcessRefundParams {
  paymentId: string;
  transactionId: string;
  amount: number;
  reason?: string | undefined;
  idempotencyKey?: string | undefined;
}

export interface ProcessRefundResult {
  refundId: string;
  isSuccess: boolean;
  status: "COMPLETED" | "FAILED";
}

export interface PaymentGateway {
  name: string;
  createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<CreatePaymentIntentResult>;
  verifyPayment(transactionId: string): Promise<VerifyPaymentResult>;
  processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult>;
  verifyWebhookSignature(payload: string, signature?: string, secret?: string): boolean;
}
