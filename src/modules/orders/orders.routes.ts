import { Router, type IRouter } from "express";
import { ordersController } from "./orders.controller.js";
import { createOrderSchema, orderQuerySchema } from "./orders.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All order endpoints require authentication
router.use(asyncHandler(authenticate));

router.post(
  "/",
  validate({ body: createOrderSchema }),
  asyncHandler((req, res) => ordersController.createOrder(req, res)),
);

router.get(
  "/mine",
  validate({ query: orderQuerySchema }),
  asyncHandler((req, res) => ordersController.listUserOrders(req, res)),
);

router.get(
  "/restaurant/:restaurantId",
  validate({ query: orderQuerySchema }),
  asyncHandler((req, res) => ordersController.listRestaurantOrders(req, res)),
);

router.get(
  "/:id",
  asyncHandler((req, res) => ordersController.getOrderById(req, res)),
);

router.post(
  "/:id/cancel",
  asyncHandler((req, res) => ordersController.cancelOrder(req, res)),
);

export default router;
