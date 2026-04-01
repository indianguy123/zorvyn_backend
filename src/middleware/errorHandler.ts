import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/appError';
import { sendError } from '../shared/responseHelper';
import { env } from '../config/env';

/**
 * Global error handler — the single place all errors funnel through.
 * Differentiates between operational errors (AppError) and unexpected crashes.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle known operational errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.errors, err.statusCode);
    return;
  }

  // Handle JWT-specific errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 'Invalid token', null, 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 'Token has expired', null, 401);
    return;
  }

  // Handle Prisma-specific errors
  if (err.name === 'PrismaClientKnownRequestError') {
    sendError(res, 'Database operation failed', null, 400);
    return;
  }

  // Log unexpected errors
  if (env.NODE_ENV === 'development') {
    console.error('🔥 Unexpected error:', err);
  } else {
    console.error('🔥 Unexpected error:', err.message);
  }

  sendError(res, 'Internal server error', null, 500);
};
