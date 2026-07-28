import { Router, type IRouter } from "express";
import { restaurantsController } from "./restaurants.controller.js";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  updateRestaurantStatusSchema,
  queryRestaurantsSchema,
} from "./restaurants.schema.js";
import {
  authenticate,
  requirePermission,
  validate,
  asyncHandler,
} from "../../common/middleware/index.js";

const router: IRouter = Router();

// Public restaurant discovery routes
router.get(
  "/",
  validate({ query: queryRestaurantsSchema }),
  asyncHandler((req, res) => restaurantsController.listRestaurants(req, res)),
);

router.get(
  "/slug/:slug",
  asyncHandler((req, res) => restaurantsController.getRestaurantBySlug(req, res)),
);

// Protected routes (require authentication)
router.get(
  "/mine",
  asyncHandler(authenticate),
  asyncHandler((req, res) => restaurantsController.getMyRestaurants(req, res)),
);

router.post(
  "/",
  asyncHandler(authenticate),
  requirePermission("restaurants.create"),
  validate({ body: createRestaurantSchema }),
  asyncHandler((req, res) => restaurantsController.createRestaurant(req, res)),
);

router.get(
  "/:id",
  asyncHandler((req, res) => restaurantsController.getRestaurantById(req, res)),
);

router.put(
  "/:id",
  asyncHandler(authenticate),
  validate({ body: updateRestaurantSchema }),
  asyncHandler((req, res) => restaurantsController.updateRestaurant(req, res)),
);

// Admin approval & status change route
router.patch(
  "/:id/status",
  asyncHandler(authenticate),
  requirePermission("restaurants.approve"),
  validate({ body: updateRestaurantStatusSchema }),
  asyncHandler((req, res) => restaurantsController.updateRestaurantStatus(req, res)),
);

export default router;
