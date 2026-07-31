import { Router, type IRouter } from "express";
import { deliveriesController } from "./deliveries.controller.js";
import {
  updateRiderProfileSchema,
  assignDeliverySchema,
  updateDeliveryStatusSchema,
} from "./deliveries.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All delivery routes require authentication
router.use(asyncHandler(authenticate));

router.put(
  "/rider-profile",
  validate({ body: updateRiderProfileSchema }),
  asyncHandler((req, res) => deliveriesController.updateRiderProfile(req, res)),
);

router.post(
  "/assign",
  validate({ body: assignDeliverySchema }),
  asyncHandler((req, res) => deliveriesController.assignDelivery(req, res)),
);

router.patch(
  "/:id/status",
  validate({ body: updateDeliveryStatusSchema }),
  asyncHandler((req, res) => deliveriesController.updateDeliveryStatus(req, res)),
);

router.get(
  "/queue",
  asyncHandler((req, res) => deliveriesController.getAvailableDeliveriesQueue(req, res)),
);

router.get(
  "/mine",
  asyncHandler((req, res) => deliveriesController.getMyAssignedDeliveries(req, res)),
);

router.get(
  "/order/:orderId",
  asyncHandler((req, res) => deliveriesController.getDeliveryByOrderId(req, res)),
);

export default router;
