import { Router, type IRouter } from "express";
import { jobsController } from "./jobs.controller.js";
import { enqueueJobSchema } from "./jobs.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All background jobs management endpoints require authentication
router.use(asyncHandler(authenticate));

router.post(
  "/enqueue",
  validate({ body: enqueueJobSchema }),
  asyncHandler((req, res) => jobsController.enqueueJob(req, res)),
);

router.get(
  "/stats",
  asyncHandler((req, res) => jobsController.getQueueStats(req, res)),
);

router.get(
  "/failed",
  asyncHandler((req, res) => jobsController.getFailedJobs(req, res)),
);

router.post(
  "/retry/:jobId",
  asyncHandler((req, res) => jobsController.retryFailedJob(req, res)),
);

export default router;
