import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError } from '../errors/AppError';
import prisma from '../config/database';

/**
 * JWT authentication middleware.
 * 
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the user payload to req.user.
 * 
 * Design decision: We verify the user still exists and is active
 * on every request (not just token validity). This ensures that
 * deactivated users are immediately locked out, even if their
 * token hasn't expired yet.
 */

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided. Use "Authorization: Bearer <token>"');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Malformed authorization header');
    }

    // Verify token signature and expiry
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedError('User account no longer exists');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is deactivated');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token has expired'));
      return;
    }
    next(error);
  }
}
