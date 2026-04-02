import { authorize } from '../../../src/middleware/authorize';
import { ForbiddenError, UnauthorizedError } from '../../../src/errors/AppError';
import { Request, Response, NextFunction } from 'express';

/**
 * Unit tests for the authorize middleware.
 * 
 * These tests verify that role-based access control works correctly
 * without needing a database or HTTP server.
 */

describe('authorize middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call next() when user has an allowed role', () => {
    mockReq.user = { id: '1', email: 'admin@test.com', role: 'ADMIN' };
    const middleware = authorize('ADMIN', 'ANALYST');
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should pass ForbiddenError when user role is not allowed', () => {
    mockReq.user = { id: '1', email: 'viewer@test.com', role: 'VIEWER' };
    const middleware = authorize('ADMIN');
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should pass UnauthorizedError when no user is attached', () => {
    const middleware = authorize('ADMIN');
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('should allow multiple roles', () => {
    mockReq.user = { id: '1', email: 'analyst@test.com', role: 'ANALYST' };
    const middleware = authorize('ADMIN', 'ANALYST', 'VIEWER');
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject when role does not match any allowed role', () => {
    mockReq.user = { id: '1', email: 'viewer@test.com', role: 'VIEWER' };
    const middleware = authorize('ADMIN', 'ANALYST');
    middleware(mockReq as Request, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('should include helpful error message with required roles', () => {
    mockReq.user = { id: '1', email: 'viewer@test.com', role: 'VIEWER' };
    const middleware = authorize('ADMIN', 'ANALYST');
    middleware(mockReq as Request, mockRes as Response, mockNext);
    
    const error = mockNext.mock.calls[0][0] as ForbiddenError;
    expect(error.message).toContain('VIEWER');
    expect(error.message).toContain('ADMIN');
    expect(error.message).toContain('ANALYST');
  });
});
