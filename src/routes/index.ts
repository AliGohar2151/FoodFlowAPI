import { Router, type IRouter } from "express";
import healthRoutes from "../modules/health/health.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import rbacRoutes from "../modules/rbac/rbac.routes.js";
import userRoutes from "../modules/users/users.routes.js";
import restaurantRoutes from "../modules/restaurants/restaurants.routes.js";
import menuRoutes from "../modules/menus/menus.routes.js";
import addressRoutes from "../modules/addresses/addresses.routes.js";
import discoveryRoutes from "../modules/discovery/discovery.routes.js";
import cartRoutes from "../modules/carts/carts.routes.js";
import orderRoutes from "../modules/orders/orders.routes.js";
import paymentRoutes from "../modules/payments/payments.routes.js";
import deliveryRoutes from "../modules/deliveries/deliveries.routes.js";
import reviewRoutes from "../modules/reviews/reviews.routes.js";
import couponRoutes from "../modules/coupons/coupons.routes.js";
import notificationRoutes from "../modules/notifications/notifications.routes.js";
import jobRoutes from "../modules/jobs/jobs.routes.js";

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

// Addresses module
router.use("/addresses", addressRoutes);

// Discovery module
router.use("/discovery", discoveryRoutes);

// Cart module
router.use("/carts", cartRoutes);

// Orders module
router.use("/orders", orderRoutes);

// Payments module
router.use("/payments", paymentRoutes);

// Deliveries module
router.use("/deliveries", deliveryRoutes);

// Reviews & Ratings module
router.use("/reviews", reviewRoutes);

// Coupons and Promotions module
router.use("/coupons", couponRoutes);

// Notifications module
router.use("/notifications", notificationRoutes);

// Background Jobs & Worker Queue module
router.use("/jobs", jobRoutes);

export default router;
