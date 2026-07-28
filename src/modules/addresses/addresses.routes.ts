import { Router, type IRouter } from "express";
import { addressesController } from "./addresses.controller.js";
import { createAddressSchema, updateAddressSchema } from "./addresses.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All address endpoints require authentication
router.use(asyncHandler(authenticate));

router.post(
  "/",
  validate({ body: createAddressSchema }),
  asyncHandler((req, res) => addressesController.createAddress(req, res)),
);

router.get(
  "/",
  asyncHandler((req, res) => addressesController.getAddresses(req, res)),
);

router.get(
  "/:id",
  asyncHandler((req, res) => addressesController.getAddressById(req, res)),
);

router.put(
  "/:id",
  validate({ body: updateAddressSchema }),
  asyncHandler((req, res) => addressesController.updateAddress(req, res)),
);

router.patch(
  "/:id/default",
  asyncHandler((req, res) => addressesController.setDefaultAddress(req, res)),
);

router.delete(
  "/:id",
  asyncHandler((req, res) => addressesController.deleteAddress(req, res)),
);

export default router;
