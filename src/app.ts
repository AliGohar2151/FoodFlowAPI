import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";

import { config } from "./config/index.js";
import apiRouter from "./routes/index.js";
import swaggerRouter from "./docs/swagger.js";
import {
  requestIdMiddleware,
  notFoundHandler,
  globalErrorHandler,
} from "./common/middleware/index.js";

const app: Application = express();

// ── Security Middleware ──────────────────────────────────────────────────────

// Attach unique request ID to every request
app.use(requestIdMiddleware);

// Set secure HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for Swagger UI assets inline styling
  }),
);

// CORS
app.use(
  cors({
    origin: config.security.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  }),
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later",
      error: { code: "TOO_MANY_REQUESTS", details: null },
    },
  }),
);

// ── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── API Documentation & Routes ───────────────────────────────────────────────

const apiPrefix = config.app.apiPrefix;

// Interactive Swagger OpenAPI UI
app.use("/docs", swaggerRouter);

// API v1 routes
app.use(apiPrefix, apiRouter);

// ── Fallback Handlers ────────────────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
