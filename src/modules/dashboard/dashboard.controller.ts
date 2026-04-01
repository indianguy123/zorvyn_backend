import { Request, Response } from 'express';
import { asyncHandler } from '../../shared/asyncHandler';
import { sendSuccess } from '../../shared/responseHelper';
import * as dashboardService from './dashboard.service';

/** GET /api/dashboard/summary — Total income, expenses, net balance */
export const getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const summary = await dashboardService.getSummary(req.query as any);
  sendSuccess(res, summary, 'Dashboard summary retrieved successfully');
});

/** GET /api/dashboard/category-breakdown — Category-wise grouped totals */
export const getCategoryBreakdown = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const breakdown = await dashboardService.getCategoryBreakdown(req.query as any);
    sendSuccess(res, breakdown, 'Category breakdown retrieved successfully');
  }
);

/** GET /api/dashboard/trends — Monthly/weekly income vs expense trends */
export const getTrends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const trends = await dashboardService.getTrends(req.query as any);
  sendSuccess(res, trends, 'Trends data retrieved successfully');
});

/** GET /api/dashboard/recent-activity — Last N records */
export const getRecentActivity = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const activity = await dashboardService.getRecentActivity(req.query as any);
    sendSuccess(res, activity, 'Recent activity retrieved successfully');
  }
);
