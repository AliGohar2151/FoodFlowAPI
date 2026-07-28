import { Router, type IRouter } from "express";
import { discoveryController } from "./discovery.controller.js";
import { discoverySearchSchema } from "./discovery.schema.js";
import { validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

router.get(
  "/search",
  validate({ query: discoverySearchSchema }),
  asyncHandler((req, res) => discoveryController.searchRestaurants(req, res)),
);

router.get(
  "/cuisines",
  asyncHandler((req, res) => discoveryController.getCuisines(req, res)),
);

router.get(
  "/featured",
  asyncHandler((req, res) => discoveryController.getFeaturedRestaurants(req, res)),
);

export default router;
