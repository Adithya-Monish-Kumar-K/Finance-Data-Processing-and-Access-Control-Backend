import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  monthlyTrendsQuerySchema,
  recentActivityQuerySchema,
  topCategoriesQuerySchema,
} from '../validators/dashboard.validator';

/**
 * Dashboard analytics routes.
 * 
 * Access control (tiered):
 * - Overview & Recent Activity: All authenticated roles (Viewer, Analyst, Admin)
 * - Detailed analytics: Analyst and Admin only
 * 
 * Design decision: Viewers get basic overview but not detailed breakdowns.
 * This shows thoughtful access control — not just "on/off" but graduated.
 */

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: Financial overview
 *     description: All roles. Returns total income, expenses, net balance, and record counts.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview data
 */
router.get(
  '/overview',
  authorize('ADMIN', 'ANALYST', 'VIEWER'),
  dashboardController.getOverview
);

/**
 * @swagger
 * /api/v1/dashboard/category-breakdown:
 *   get:
 *     tags: [Dashboard]
 *     summary: Category breakdown
 *     description: Analyst and Admin only. Income/expense totals per category.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown data
 */
router.get(
  '/category-breakdown',
  authorize('ADMIN', 'ANALYST'),
  dashboardController.getCategoryBreakdown
);

/**
 * @swagger
 * /api/v1/dashboard/monthly-trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Monthly trends
 *     description: Analyst and Admin only. Time-series income/expense data.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *           minimum: 1
 *           maximum: 24
 *     responses:
 *       200:
 *         description: Monthly trend data
 */
router.get(
  '/monthly-trends',
  authorize('ADMIN', 'ANALYST'),
  validate({ query: monthlyTrendsQuerySchema }),
  dashboardController.getMonthlyTrends
);

/**
 * @swagger
 * /api/v1/dashboard/recent-activity:
 *   get:
 *     tags: [Dashboard]
 *     summary: Recent activity
 *     description: All roles. Latest financial transactions.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *     responses:
 *       200:
 *         description: Recent activity data
 */
router.get(
  '/recent-activity',
  authorize('ADMIN', 'ANALYST', 'VIEWER'),
  validate({ query: recentActivityQuerySchema }),
  dashboardController.getRecentActivity
);

/**
 * @swagger
 * /api/v1/dashboard/top-categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Top categories
 *     description: Analyst and Admin only. Highest-value categories.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *     responses:
 *       200:
 *         description: Top categories data
 */
router.get(
  '/top-categories',
  authorize('ADMIN', 'ANALYST'),
  validate({ query: topCategoriesQuerySchema }),
  dashboardController.getTopCategories
);

export default router;
