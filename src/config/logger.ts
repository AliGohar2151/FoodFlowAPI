/**
 * Simple structured logger.
 * In development: pretty-prints to console.
 * In production: outputs JSON (ready for log aggregators).
 *
 * Replace with pino or winston in Phase 30 (Observability).
 */

import { config } from "./index.js";

type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

const currentLevelValue = LEVELS[config.logging.level];

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= currentLevelValue;
}

function formatLog(level: LogLevel, message: string, meta?: unknown): string {
  if (config.app.isDev) {
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase().padEnd(5)}]`;
    const metaStr = meta !== undefined ? ` ${JSON.stringify(meta)}` : "";
    return `${prefix} ${message}${metaStr}`;
  }
  // JSON format for production
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined ? { meta } : {}),
  });
}

export const logger = {
  fatal: (message: string, meta?: unknown) => {
    if (shouldLog("fatal")) console.error(formatLog("fatal", message, meta));
  },
  error: (message: string, meta?: unknown) => {
    if (shouldLog("error")) console.error(formatLog("error", message, meta));
  },
  warn: (message: string, meta?: unknown) => {
    if (shouldLog("warn")) console.warn(formatLog("warn", message, meta));
  },
  info: (message: string, meta?: unknown) => {
    if (shouldLog("info")) console.info(formatLog("info", message, meta));
  },
  debug: (message: string, meta?: unknown) => {
    if (shouldLog("debug")) console.debug(formatLog("debug", message, meta));
  },
  trace: (message: string, meta?: unknown) => {
    if (shouldLog("trace")) console.debug(formatLog("trace", message, meta));
  },
};
