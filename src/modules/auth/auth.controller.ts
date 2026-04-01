import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { sendSuccess } from '../../shared/responseHelper';
import * as authService from './auth.service';

/**
 * POST /api/auth/register
 * Register a new user and return a JWT.
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.registerUser(req.body);
  sendSuccess(res, result, 'User registered successfully', 201);
});

/**
 * POST /api/auth/login
 * Authenticate user and return a JWT.
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.loginUser(req.body);
  sendSuccess(res, result, 'Login successful');
});
