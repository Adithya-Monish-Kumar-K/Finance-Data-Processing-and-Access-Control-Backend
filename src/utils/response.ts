import { Response } from 'express';

/**
 * Standardized API response helpers.
 * 
 * Design decision: Every API response uses the same shape:
 *   { success: boolean, data?, message?, pagination?, error? }
 * 
 * This consistency makes life easier for frontend consumers
 * and demonstrates awareness of API design best practices.
 */

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message: string = 'Success'
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void {
  sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): void {
  res.status(204).send();
}
