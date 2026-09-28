import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/**
 * Standardized API rate limiters to prevent DoS and credential stuffing attacks
 * Configured safely for cloud container environments (Cloud Run / reverse proxy).
 */

const getClientIp = (req: any): string => {
  const forwarded = req.headers["forwarded"];
  if (typeof forwarded === "string") {
    const match = forwarded.match(/for="?([^;,"]+)"?/i);
    if (match && match[1]) return match[1].trim();
  }
  const xForwardedFor = req.headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string") {
    return xForwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
};

const baseLimiterConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => ipKeyGenerator(getClientIp(req)),
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
};

// General API limiter: 300 requests per minute per IP
export const generalApiLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 60 * 1000,
  max: 300,
  message: {
    success: false,
    error: "Too many requests from this IP. Please wait before retrying.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

// Strict Authentication limiter: 60 attempts per 15 minutes (successful auth skipped)
export const authRateLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 15 * 60 * 1000,
  max: 60,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: "Too many login/registration attempts. Please wait 15 minutes.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
});

// AI Gateway & Chat limiter: 60 requests per minute
export const aiRateLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: "AI inference rate limit reached. Please wait a moment before sending more queries.",
    code: "AI_RATE_LIMIT_EXCEEDED",
  },
});

// Heavy Ingestion & Training limiter: 15 requests per 15 minutes
export const heavyTaskLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    success: false,
    error: "Upload/processing rate limit reached. Please allow previous tasks to complete.",
    code: "HEAVY_TASK_RATE_LIMIT_EXCEEDED",
  },
});

// Admin limiter: 30 requests per minute
export const adminRateLimiter = rateLimit({
  ...baseLimiterConfig,
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: "Admin rate limit exceeded.",
    code: "ADMIN_RATE_LIMIT_EXCEEDED",
  },
});
