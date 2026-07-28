import { Router, type IRouter } from "express";
import { usersController } from "./users.controller.js";
import {
  updateProfileSchema,
  queryUsersSchema,
  updateUserStatusSchema,
} from "./users.schema.js";
import {
  authenticate,
  requirePermission,
  validate,
  asyncHandler,
} from "../../common/middleware/index.js";

const router: IRouter = Router();

// All user routes require authentication
router.use(asyncHandler(authenticate));

// Self profile routes
router.get(
  "/me",
  asyncHandler((req, res) => usersController.getMyProfile(req, res)),
);

router.put(
  "/me",
  validate({ body: updateProfileSchema }),
  asyncHandler((req, res) => usersController.updateMyProfile(req, res)),
);

// Admin list & search users
router.get(
  "/",
  requirePermission("users.read"),
  validate({ query: queryUsersSchema }),
  asyncHandler((req, res) => usersController.listUsers(req, res)),
);

// Specific user profile routes
router.get(
  "/:id",
  asyncHandler((req, res) => usersController.getUserById(req, res)),
);

router.put(
  "/:id",
  validate({ body: updateProfileSchema }),
  asyncHandler((req, res) => usersController.updateUserProfile(req, res)),
);

// Admin update user status (suspend/activate)
router.patch(
  "/:id/status",
  requirePermission("users.suspend"),
  validate({ body: updateUserStatusSchema }),
  asyncHandler((req, res) => usersController.updateUserStatus(req, res)),
);

export default router;
