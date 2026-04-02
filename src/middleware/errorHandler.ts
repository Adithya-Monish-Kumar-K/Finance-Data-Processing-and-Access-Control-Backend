import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

/**
 * Global error handling middleware.
 * 
 * Design decision: A single centralized error handler ensures consistent
 * error response format across all endpoints. Route handlers and services
 * simply throw errors — this middleware catches them and formats the response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging (in production, you'd use a proper logger)
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  // Handle our custom application errors
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
    });
    return;
  }

  // Fallback for unexpected errors — don't leak internal details
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
