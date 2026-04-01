import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  dateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
  dateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
});

export const trendsQuerySchema = z.object({
  period: z.enum(['weekly', 'monthly']).default('monthly'),
  dateFrom: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
  dateTo: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .optional(),
});

export const recentActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
export type RecentActivityQuery = z.infer<typeof recentActivityQuerySchema>;
