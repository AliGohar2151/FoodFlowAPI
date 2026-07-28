import { Router, type IRouter } from "express";
import { cartsController } from "./carts.controller.js";
import { addToCartSchema, updateCartItemSchema } from "./carts.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// All cart endpoints require authentication
router.use(asyncHandler(authenticate));

router.get(
  "/mine",
  asyncHandler((req, res) => cartsController.getCart(req, res)),
);

router.post(
  "/items",
  validate({ body: addToCartSchema }),
  asyncHandler((req, res) => cartsController.addToCart(req, res)),
);

router.patch(
  "/items/:itemId",
  validate({ body: updateCartItemSchema }),
  asyncHandler((req, res) => cartsController.updateCartItem(req, res)),
);

router.delete(
  "/items/:itemId",
  asyncHandler((req, res) => cartsController.removeCartItem(req, res)),
);

router.delete(
  "/mine",
  asyncHandler((req, res) => cartsController.clearCart(req, res)),
);

export default router;
