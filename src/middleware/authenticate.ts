import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../shared/appError';
import { asyncHandler } from '../shared/asyncHandler';
import prisma from '../config/db';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        name: string;
        status: string;
      };
    }
  }
}

/**
 * Middleware that verifies the JWT from the Authorization header.
 * Attaches the authenticated user to req.user.
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw AppError.unauthorized('Token not provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true, status: true },
    });

    if (!user) {
      throw AppError.unauthorized('User associated with this token no longer exists');
    }

    if (user.status === 'inactive') {
      throw AppError.forbidden('Account has been deactivated');
    }

    req.user = user;
    next();
  }
);
