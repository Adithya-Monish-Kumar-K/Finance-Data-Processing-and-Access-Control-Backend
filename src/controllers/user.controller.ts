import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { sendSuccess, sendCreated, sendPaginatedSuccess } from '../utils/response';

/**
 * User management controller.
 */

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { users, pagination } = await userService.getUsers(req.query as Record<string, string>);
      sendPaginatedSuccess(res, users, pagination, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(req.params.id as string);
      sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      sendCreated(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateUser(req.params.id as string, req.body);
      sendSuccess(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateRole(req.params.id as string, req.body.role);
      sendSuccess(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateStatus(req.params.id as string, req.body.status);
      sendSuccess(res, user, 'User status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deleteUser(req.params.id as string);
      sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
