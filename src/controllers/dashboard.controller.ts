import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

/**
 * Dashboard analytics controller.
 */

export class DashboardController {
  async getOverview(_req: Request, res: Response, next: NextFunction) {
    try {
      const overview = await dashboardService.getOverview();
      sendSuccess(res, overview, 'Dashboard overview retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(_req: Request, res: Response, next: NextFunction) {
    try {
      const breakdown = await dashboardService.getCategoryBreakdown();
      sendSuccess(res, breakdown, 'Category breakdown retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const months = req.query.months ? Number(req.query.months) : 12;
      const trends = await dashboardService.getMonthlyTrends(months);
      sendSuccess(res, trends, 'Monthly trends retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const activity = await dashboardService.getRecentActivity(limit);
      sendSuccess(res, activity, 'Recent activity retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTopCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      const type = req.query.type as string | undefined;
      const categories = await dashboardService.getTopCategories(limit, type);
      sendSuccess(res, categories, 'Top categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
