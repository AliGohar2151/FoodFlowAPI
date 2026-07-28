import { Router, type IRouter } from "express";
import { menusController } from "./menus.controller.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  queryMenuItemsSchema,
} from "./menus.schema.js";
import { authenticate, validate, asyncHandler } from "../../common/middleware/index.js";

const router: IRouter = Router();

// ── Categories Routes ────────────────────────────────────────────────────────
router.post(
  "/restaurants/:restaurantId/categories",
  asyncHandler(authenticate),
  validate({ body: createCategorySchema }),
  asyncHandler((req, res) => menusController.createCategory(req, res)),
);

router.get(
  "/restaurants/:restaurantId/categories",
  asyncHandler((req, res) => menusController.getCategories(req, res)),
);

router.put(
  "/restaurants/:restaurantId/categories/:categoryId",
  asyncHandler(authenticate),
  validate({ body: updateCategorySchema }),
  asyncHandler((req, res) => menusController.updateCategory(req, res)),
);

router.delete(
  "/restaurants/:restaurantId/categories/:categoryId",
  asyncHandler(authenticate),
  asyncHandler((req, res) => menusController.deleteCategory(req, res)),
);

// ── Menu Items Routes ────────────────────────────────────────────────────────
router.post(
  "/restaurants/:restaurantId/items",
  asyncHandler(authenticate),
  validate({ body: createMenuItemSchema }),
  asyncHandler((req, res) => menusController.createMenuItem(req, res)),
);

router.get(
  "/restaurants/:restaurantId/items",
  validate({ query: queryMenuItemsSchema }),
  asyncHandler((req, res) => menusController.getMenuItems(req, res)),
);

router.get(
  "/items/:itemId",
  asyncHandler((req, res) => menusController.getMenuItemById(req, res)),
);

router.put(
  "/restaurants/:restaurantId/items/:itemId",
  asyncHandler(authenticate),
  validate({ body: updateMenuItemSchema }),
  asyncHandler((req, res) => menusController.updateMenuItem(req, res)),
);

router.delete(
  "/restaurants/:restaurantId/items/:itemId",
  asyncHandler(authenticate),
  asyncHandler((req, res) => menusController.deleteMenuItem(req, res)),
);

export default router;
