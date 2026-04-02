import { z } from 'zod';

/**
 * User management validation schemas.
 */

export const createUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  firstName: z
    .string({ required_error: 'First name is required' })
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .trim(),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .trim(),
  role: z
    .enum(['VIEWER', 'ANALYST', 'ADMIN'], {
      errorMap: () => ({ message: 'Role must be VIEWER, ANALYST, or ADMIN' }),
    })
    .optional()
    .default('VIEWER'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  email: z.string().email('Must be a valid email address').toLowerCase().trim().optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be VIEWER, ANALYST, or ADMIN' }),
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status must be ACTIVE or INACTIVE' }),
  }),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const listUsersQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
