import { z } from 'zod';

/**
 * Dashboard query validation schemas.
 */

export const monthlyTrendsQuerySchema = z.object({
  months: z
    .string()
    .optional()
    .default('12')
    .transform((val) => Math.min(24, Math.max(1, parseInt(val, 10)))),
});

export const recentActivityQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => Math.min(50, Math.max(1, parseInt(val, 10)))),
});

export const topCategoriesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('5')
    .transform((val) => Math.min(20, Math.max(1, parseInt(val, 10)))),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
});
