import { describe, it, expect } from "vitest";
import { enqueueJobSchema } from "../src/modules/jobs/jobs.schema.js";
import { JobQueueManager } from "../src/modules/jobs/job-queue.manager.js";

describe("Background Jobs Module — Schema & Manager Unit Tests", () => {
  it("should validate enqueue job schema", () => {
    const valid = enqueueJobSchema.safeParse({
      queueName: "notifications",
      jobName: "sendEmailNotification",
      payload: { userId: "user-123", email: "test@example.com" },
      options: { attempts: 3, backoffMs: 100 },
    });
    expect(valid.success).toBe(true);
  });

  it("should enqueue and process job with registered worker", async () => {
    const manager = new JobQueueManager();
    let processedPayload: unknown = null;

    manager.registerWorker("orders", async (job) => {
      processedPayload = job.payload;
      return { status: "OK" };
    });

    const job = await manager.enqueue("orders", "cancelExpiredOrder", {
      orderId: "order-999",
    });

    expect(job.status).toBe("PENDING");

    // Wait short time for async setImmediate execution
    await new Promise((resolve) => setTimeout(resolve, 50));

    const stats = manager.getStats();
    expect(stats.byQueue.orders.completed).toBe(1);
    expect(processedPayload).toEqual({ orderId: "order-999" });
  });

  it("should retry job on failure up to maxAttempts and then mark FAILED", async () => {
    const manager = new JobQueueManager();
    let attempts = 0;

    manager.registerWorker("payments", async () => {
      attempts++;
      throw new Error("Payment gateway connection timeout");
    });

    await manager.enqueue(
      "payments",
      "processRefund",
      { paymentId: "pay-1" },
      { attempts: 2, backoffMs: 10 },
    );

    // Wait for initial attempt + 1 retry with 10ms backoff
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(attempts).toBe(2);
    const failedJobs = manager.getFailedJobs();
    expect(failedJobs.length).toBe(1);
    expect(failedJobs[0]?.status).toBe("FAILED");
  });
});
