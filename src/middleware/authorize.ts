import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors/AppError';

/**
 * Role-based authorization middleware factory.
 * 
 * Usage: authorize('ADMIN', 'ANALYST')
 * 
 * Design decision: This is a higher-order function that returns
 * middleware. This pattern allows clean, declarative route definitions:
 * 
 *   router.get('/records', authenticate, authorize('ADMIN', 'ANALYST'), getRecords)
 * 
 * The role check runs AFTER authentication, so req.user is guaranteed
 * to exist when this middleware executes.
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Role '${req.user.role}' does not have permission to perform this action. Required: ${allowedRoles.join(' or ')}`
        )
      );
      return;
    }

    next();
  };
}
