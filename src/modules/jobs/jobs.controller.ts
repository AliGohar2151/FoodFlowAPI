import type { Request, Response } from "express";
import { jobsService } from "./jobs.service.js";
import { sendSuccess } from "../../common/responses/index.js";
import { UnauthorizedError } from "../../common/errors/index.js";
import type { EnqueueJobInput } from "./jobs.schema.js";

export class JobsController {
  /**
   * POST /api/v1/jobs/enqueue
   */
  async enqueueJob(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const input = req.validatedBody as EnqueueJobInput;
    const job = await jobsService.enqueueJob(req.user, input);
    sendSuccess(res, job, { message: "Job enqueued successfully", statusCode: 201 });
  }

  /**
   * GET /api/v1/jobs/stats
   */
  async getQueueStats(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const stats = jobsService.getQueueStats(req.user);
    sendSuccess(res, stats, { message: "Queue statistics retrieved" });
  }

  /**
   * GET /api/v1/jobs/failed
   */
  async getFailedJobs(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const failedJobs = jobsService.getFailedJobs(req.user);
    sendSuccess(res, failedJobs, { message: "Failed dead-letter jobs retrieved" });
  }

  /**
   * POST /api/v1/jobs/retry/:jobId
   */
  async retryFailedJob(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const { jobId } = req.params as { jobId: string };
    const retriedJob = await jobsService.retryFailedJob(req.user, jobId);
    sendSuccess(res, retriedJob, { message: "Job retry initiated" });
  }
}

export const jobsController = new JobsController();
