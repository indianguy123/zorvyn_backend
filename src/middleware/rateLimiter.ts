import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../shared/responseHelper';

/**
 * Global rate limiter for all API routes.
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX env vars.
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests. Please try again later.', null, 429);
  },
});

/**
 * Stricter rate limiter specifically for auth endpoints (login/register).
 * Prevents brute force attacks.
 * Configurable via AUTH_RATE_LIMIT_WINDOW_MS and AUTH_RATE_LIMIT_MAX env vars.
 */
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many authentication attempts. Please try again later.',
      null,
      429
    );
  },
});
