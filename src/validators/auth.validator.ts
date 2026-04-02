import { z } from 'zod';

/**
 * Auth request validation schemas.
 * 
 * Zod provides both runtime validation AND TypeScript type inference.
 * This means we define the shape once and get both validation + types.
 */

export const registerSchema = z.object({
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

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

// Infer TypeScript types from schemas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
