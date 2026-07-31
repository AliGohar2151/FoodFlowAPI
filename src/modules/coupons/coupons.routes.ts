import { Router, type IRouter } from "express";
import { couponsController } from "./coupons.controller.js";
import {
  createCouponSchema,
  updateCouponSchema,
  validateCouponSchema,
  couponQuerySchema,
} from "./coupons.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All coupon endpoints require authentication
router.use(asyncHandler(authenticate));

router.post(
  "/",
  validate({ body: createCouponSchema }),
  asyncHandler((req, res) => couponsController.createCoupon(req, res)),
);

router.post(
  "/validate",
  validate({ body: validateCouponSchema }),
  asyncHandler((req, res) => couponsController.validateCoupon(req, res)),
);

router.put(
  "/:id",
  validate({ body: updateCouponSchema }),
  asyncHandler((req, res) => couponsController.updateCoupon(req, res)),
);

router.patch(
  "/:id/status",
  asyncHandler((req, res) => couponsController.toggleCouponStatus(req, res)),
);

router.get(
  "/",
  validate({ query: couponQuerySchema }),
  asyncHandler((req, res) => couponsController.listCoupons(req, res)),
);

export default router;
