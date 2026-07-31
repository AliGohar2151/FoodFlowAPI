import { Router, type IRouter } from "express";
import { cachingController } from "./caching.controller.js";
import { invalidateCacheSchema } from "./caching.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All caching admin endpoints require authentication
router.use(asyncHandler(authenticate));

router.get(
  "/health",
  asyncHandler((req, res) => cachingController.getCacheHealth(req, res)),
);

router.post(
  "/invalidate",
  validate({ body: invalidateCacheSchema }),
  asyncHandler((req, res) => cachingController.invalidateCache(req, res)),
);

router.post(
  "/flush",
  asyncHandler((req, res) => cachingController.flushAllCache(req, res)),
);

export default router;
