export type QueueName = "notifications" | "orders" | "payments" | "cleanup";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface JobOptions {
  attempts?: number;
  backoffMs?: number;
  delayMs?: number;
}

export interface JobRecord<T = Record<string, unknown>> {
  id: string;
  queueName: QueueName;
  jobName: string;
  payload: T;
  status: JobStatus;
  attemptsMade: number;
  maxAttempts: number;
  backoffMs: number;
  error?: string | undefined;
  result?: unknown;
  createdAt: Date;
  processedAt?: Date | undefined;
  completedAt?: Date | undefined;
  failedAt?: Date | undefined;
}
