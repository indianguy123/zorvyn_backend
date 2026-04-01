import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { sendSuccess } from '../../shared/responseHelper';
import * as usersService from './users.service';

/** GET /api/users — List all users with pagination */
export const listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await usersService.listUsers(req.query as any);
  sendSuccess(res, result, 'Users retrieved successfully');
});

/** GET /api/users/:id — Get a single user */
export const getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.getUserById(req.params.id);
  sendSuccess(res, user, 'User retrieved successfully');
});

/** PATCH /api/users/:id — Update user role/status */
export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.updateUser(req.params.id, req.body);
  sendSuccess(res, user, 'User updated successfully');
});

/** PATCH /api/users/:id/deactivate — Deactivate a user */
export const deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await usersService.deactivateUser(req.params.id);
  sendSuccess(res, user, 'User deactivated successfully');
});
