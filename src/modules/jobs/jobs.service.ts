import { jobQueueManager } from "./job-queue.manager.js";
import { logger } from "../../config/logger.js";
import type { EnqueueJobInput } from "./jobs.schema.js";
import type { JobOptions } from "./jobs.types.js";
import { ForbiddenError, NotFoundError } from "../../common/errors/index.js";
import type { UserContext } from "../../common/policies/policy.types.js";

export class JobsService {
  constructor() {
    this.registerDefaultWorkers();
  }

  /**
   * Register default worker processors for each system queue.
   */
  private registerDefaultWorkers() {
    // Notification queue worker
    jobQueueManager.registerWorker("notifications", async (job) => {
      logger.info(
        `[Worker: notifications] Processing job '${job.jobName}' for payload: ${JSON.stringify(job.payload)}`,
      );
      return { status: "DELIVERED", sentAt: new Date() };
    });

    // Orders queue worker (order timeout expiration check)
    jobQueueManager.registerWorker("orders", async (job) => {
      logger.info(
        `[Worker: orders] Processing order state task '${job.jobName}' payload: ${JSON.stringify(job.payload)}`,
      );
      return { status: "PROCESSED", orderId: job.payload.orderId };
    });

    // Payments queue worker
    jobQueueManager.registerWorker("payments", async (job) => {
      logger.info(
        `[Worker: payments] Processing payment job '${job.jobName}' payload: ${JSON.stringify(job.payload)}`,
      );
      return { status: "VERIFIED", transactionId: job.payload.transactionId };
    });

    // Cleanup queue worker
    jobQueueManager.registerWorker("cleanup", async (job) => {
      logger.info(`[Worker: cleanup] Running task '${job.jobName}'`);
      return { status: "CLEANED", cleanedAt: new Date() };
    });
  }

  /**
   * Enqueue a job into worker queue.
   */
  async enqueueJob<T = Record<string, unknown>>(
    userContext: UserContext,
    input: EnqueueJobInput,
  ) {
    this.ensureAdmin(userContext);
    return jobQueueManager.enqueue(
      input.queueName,
      input.jobName,
      input.payload as T,
      input.options as JobOptions,
    );
  }

  /**
   * Get queue statistics and metrics.
   */
  getQueueStats(userContext: UserContext) {
    this.ensureAdmin(userContext);
    return jobQueueManager.getStats();
  }

  /**
   * Get list of failed (dead-letter) jobs.
   */
  getFailedJobs(userContext: UserContext) {
    this.ensureAdmin(userContext);
    return jobQueueManager.getFailedJobs();
  }

  /**
   * Retry a failed job.
   */
  async retryFailedJob(userContext: UserContext, jobId: string) {
    this.ensureAdmin(userContext);
    try {
      return await jobQueueManager.retryJob(jobId);
    } catch (err) {
      throw new NotFoundError(
        `Job '${jobId}' not found or not in FAILED state: ${(err as Error).message}`,
      );
    }
  }

  private ensureAdmin(userContext: UserContext) {
    const isAdmin =
      Boolean(userContext.roles?.includes("SUPER_ADMIN")) ||
      Boolean(userContext.roles?.includes("ADMIN"));
    if (!isAdmin) {
      throw new ForbiddenError(
        "Only administrators can access background worker queue management",
      );
    }
  }
}

export const jobsService = new JobsService();
