import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/appError';
import { UserRoleType } from '../shared/constants';

/**
 * OCP-compliant role guard middleware.
 * Accepts a list of allowed roles — add new roles without modifying this function.
 *
 * Usage: authorize(UserRole.ADMIN, UserRole.ANALYST)
 */
export const authorize = (...allowedRoles: UserRoleType[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role as UserRoleType)) {
      throw AppError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};
