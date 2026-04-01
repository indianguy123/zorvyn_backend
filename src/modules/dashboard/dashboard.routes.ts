import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { UserRole } from '../../shared/constants';
import {
  dashboardQuerySchema,
  trendsQuerySchema,
  recentActivityQuerySchema,
} from './dashboard.schema';
import * as dashboardController from './dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Summary and recent activity — all roles can access
router.get(
  '/summary',
  authorize(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
  validate(dashboardQuerySchema, 'query'),
  dashboardController.getSummary
);

router.get(
  '/recent-activity',
  authorize(UserRole.VIEWER, UserRole.ANALYST, UserRole.ADMIN),
  validate(recentActivityQuerySchema, 'query'),
  dashboardController.getRecentActivity
);

// Analytics — analyst and admin only (viewer cannot access)
router.get(
  '/category-breakdown',
  authorize(UserRole.ANALYST, UserRole.ADMIN),
  validate(dashboardQuerySchema, 'query'),
  dashboardController.getCategoryBreakdown
);

router.get(
  '/trends',
  authorize(UserRole.ANALYST, UserRole.ADMIN),
  validate(trendsQuerySchema, 'query'),
  dashboardController.getTrends
);

export default router;
