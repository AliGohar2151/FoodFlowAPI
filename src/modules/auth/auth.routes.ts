import { Router, type IRouter } from "express";
import { authController } from "./auth.controller.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from "./auth.schema.js";
import { validate, asyncHandler, authenticate } from "../../common/middleware/index.js";

const router: IRouter = Router();

// Public auth endpoints
router.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler((req, res) => authController.register(req, res)),
);

router.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler((req, res) => authController.login(req, res)),
);

router.post(
  "/refresh",
  validate({ body: refreshTokenSchema }),
  asyncHandler((req, res) => authController.refreshToken(req, res)),
);

router.post(
  "/logout",
  validate({ body: refreshTokenSchema }),
  asyncHandler((req, res) => authController.logout(req, res)),
);

// Protected auth endpoints
router.get(
  "/me",
  asyncHandler(authenticate),
  asyncHandler((req, res) => authController.getProfile(req, res)),
);

router.post(
  "/logout-all",
  asyncHandler(authenticate),
  asyncHandler((req, res) => authController.logoutAll(req, res)),
);

router.post(
  "/change-password",
  asyncHandler(authenticate),
  validate({ body: changePasswordSchema }),
  asyncHandler((req, res) => authController.changePassword(req, res)),
);

export default router;
