import { Router, type IRouter } from "express";
import { reviewsController } from "./reviews.controller.js";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
} from "./reviews.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// Public route — view restaurant reviews & rating aggregation
router.get(
  "/restaurant/:restaurantId",
  validate({ query: reviewQuerySchema }),
  asyncHandler((req, res) => reviewsController.getRestaurantReviews(req, res)),
);

// Authenticated routes
router.use(asyncHandler(authenticate));

router.post(
  "/",
  validate({ body: createReviewSchema }),
  asyncHandler((req, res) => reviewsController.createReview(req, res)),
);

router.put(
  "/:id",
  validate({ body: updateReviewSchema }),
  asyncHandler((req, res) => reviewsController.updateReview(req, res)),
);

router.delete(
  "/:id",
  asyncHandler((req, res) => reviewsController.deleteReview(req, res)),
);

router.get(
  "/mine",
  validate({ query: reviewQuerySchema }),
  asyncHandler((req, res) => reviewsController.getMyReviews(req, res)),
);

export default router;
