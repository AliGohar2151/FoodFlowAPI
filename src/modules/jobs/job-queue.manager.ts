import { logger } from "../../config/logger.js";
import type { QueueName, JobRecord, JobOptions } from "./jobs.types.js";

type WorkerHandler = (job: JobRecord) => Promise<unknown>;

export class JobQueueManager {
  private jobs = new Map<string, JobRecord>();
  private workers = new Map<QueueName, WorkerHandler>();

  /**
   * Register a worker process handler for a specific queue.
   */
  registerWorker(queueName: QueueName, handler: WorkerHandler) {
    this.workers.set(queueName, handler);
    logger.info(`[Job Queue Manager] Worker registered for queue: '${queueName}'`);
  }

  /**
   * Enqueue a new background job with optional retry & backoff policies.
   */
  async enqueue<T = Record<string, unknown>>(
    queueName: QueueName,
    jobName: string,
    payload: T,
    options?: JobOptions,
  ): Promise<JobRecord<T>> {
    const timestamp = String(Date.now());
    const random = Math.random().toString(36).substring(2, 9);
    const jobId = `job_${timestamp}_${random}`;
    const job: JobRecord<T> = {
      id: jobId,
      queueName,
      jobName,
      payload,
      status: "PENDING",
      attemptsMade: 0,
      maxAttempts: options?.attempts ?? 3,
      backoffMs: options?.backoffMs ?? 1000,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job as unknown as JobRecord);
    logger.info(
      `[Job Queue Manager] Enqueued job '${jobName}' (${jobId}) on queue '${queueName}'`,
    );

    // Process job asynchronously (non-blocking)
    if (options?.delayMs && options.delayMs > 0) {
      setTimeout(() => {
        void this.processJob(jobId);
      }, options.delayMs);
    } else {
      setImmediate(() => {
        void this.processJob(jobId);
      });
    }

    return job;
  }

  /**
   * Process job execution with retry logic and exponential backoff.
   */
  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.status === "COMPLETED") return;

    const worker = this.workers.get(job.queueName);
    if (!worker) {
      logger.warn(
        `[Job Queue Manager] No worker registered for queue '${job.queueName}'. Job '${jobId}' remains pending.`,
      );
      return;
    }

    job.status = "PROCESSING";
    job.attemptsMade += 1;
    job.processedAt = new Date();

    try {
      const result = await worker(job);
      job.status = "COMPLETED";
      job.result = result;
      job.completedAt = new Date();
      logger.info(
        `[Job Queue Manager] Job '${job.jobName}' (${jobId}) completed successfully.`,
      );
    } catch (err) {
      const errorMsg = (err as Error).message;
      job.error = errorMsg;

      if (job.attemptsMade < job.maxAttempts) {
        job.status = "PENDING";
        const delay = job.backoffMs * Math.pow(2, job.attemptsMade - 1);
        logger.warn(
          `[Job Queue Manager] Job '${job.jobName}' (${jobId}) failed attempt ${String(job.attemptsMade)}/${String(job.maxAttempts)}. Retrying in ${String(delay)}ms. Error: ${errorMsg}`,
        );
        setTimeout(() => {
          void this.processJob(jobId);
        }, delay);
      } else {
        job.status = "FAILED";
        job.failedAt = new Date();
        logger.error(
          `[Job Queue Manager] Job '${job.jobName}' (${jobId}) permanently FAILED after ${String(job.attemptsMade)} attempts. Error: ${errorMsg}`,
        );
      }
    }
  }

  /**
   * Retry a failed job manually.
   */
  async retryJob(jobId: string): Promise<JobRecord> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job '${jobId}' not found`);
    }

    if (job.status !== "FAILED") {
      throw new Error(
        `Only FAILED jobs can be retried. Job '${jobId}' status is '${job.status}'`,
      );
    }

    job.status = "PENDING";
    job.attemptsMade = 0;
    job.error = undefined;
    job.failedAt = undefined;

    setImmediate(() => {
      void this.processJob(jobId);
    });

    return job;
  }

  /**
   * Get queue statistics and metrics.
   */
  getStats() {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    const byQueue: Record<
      QueueName,
      { pending: number; processing: number; completed: number; failed: number }
    > = {
      notifications: { pending: 0, processing: 0, completed: 0, failed: 0 },
      orders: { pending: 0, processing: 0, completed: 0, failed: 0 },
      payments: { pending: 0, processing: 0, completed: 0, failed: 0 },
      cleanup: { pending: 0, processing: 0, completed: 0, failed: 0 },
    };

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case "PENDING":
          pending++;
          byQueue[job.queueName].pending++;
          break;
        case "PROCESSING":
          processing++;
          byQueue[job.queueName].processing++;
          break;
        case "COMPLETED":
          completed++;
          byQueue[job.queueName].completed++;
          break;
        case "FAILED":
          failed++;
          byQueue[job.queueName].failed++;
          break;
      }
    }

    return {
      totalJobs: this.jobs.size,
      summary: { pending, processing, completed, failed },
      byQueue,
    };
  }

  /**
   * Get list of failed (dead-letter) jobs.
   */
  getFailedJobs(): JobRecord[] {
    return Array.from(this.jobs.values()).filter((j) => j.status === "FAILED");
  }

  /**
   * Get a job by ID.
   */
  getJob(jobId: string): JobRecord | undefined {
    return this.jobs.get(jobId);
  }
}

export const jobQueueManager = new JobQueueManager();
