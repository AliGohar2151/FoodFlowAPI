import { Router, type IRouter } from "express";
import healthRoutes from "../modules/health/health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import rbacRoutes from "../modules/rbac/rbac.routes.js";
import userRoutes from "../modules/users/users.routes.js";
import restaurantRoutes from "../modules/restaurants/restaurants.routes.js";
import menuRoutes from "../modules/menus/menus.routes.js";

const router: IRouter = Router();

/**
 * Root API router.
 * All module routes are registered here.
 * Mount: app.use("/api/v1", router)
 */

// Health checks (unauthenticated)
router.use("/health", healthRoutes);

// Authentication module
router.use("/auth", authRoutes);

// RBAC & Permissions module
router.use("/rbac", rbacRoutes);

// Users module
router.use("/users", userRoutes);

// Restaurants module
router.use("/restaurants", restaurantRoutes);

// Menus module
router.use("/menus", menuRoutes);

// ── Future modules (added per phase) ────────────────────────────────────────
// router.use("/addresses", addressRoutes);
// router.use("/restaurants", discoveryRoutes);
// router.use("/carts", cartRoutes);
// router.use("/orders", orderRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/deliveries", deliveryRoutes);
// router.use("/reviews", reviewRoutes);
// router.use("/coupons", couponRoutes);

export default router;
