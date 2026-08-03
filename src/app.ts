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
  globalRateLimiter,
} from "./common/middleware/index.js";

const app: Application = express();

// ── Production Security & Proxy Configuration ──────────────────────────────

// Enable trust proxy for reverse-proxies (Nginx, Cloudflare, AWS ALB)
app.set("trust proxy", 1);

// Disable explicit Express framework header
app.disable("x-powered-by");

// Attach unique request ID to every request
app.use(requestIdMiddleware);

// Set secure HTTP headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for Swagger UI inline CSS/JS
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
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

// Global rate limiting
app.use(globalRateLimiter);

// ── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

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
