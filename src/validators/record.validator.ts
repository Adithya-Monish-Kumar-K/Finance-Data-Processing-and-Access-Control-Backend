import { z } from 'zod';

/**
 * Financial record validation schemas.
 */

export const createRecordSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required', invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(999999999.99, 'Amount exceeds maximum allowed value'),
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Type must be INCOME or EXPENSE' }),
  }),
  category: z
    .string({ required_error: 'Category is required' })
    .min(1, 'Category is required')
    .max(50, 'Category must not exceed 50 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
  date: z
    .string({ required_error: 'Date is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date (ISO 8601 format)')
    .transform((val) => new Date(val)),
});

export const updateRecordSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(999999999.99).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().min(1).max(50).trim().optional(),
  description: z.string().max(500).trim().optional().nullable(),
  date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Must be a valid date')
    .transform((val) => new Date(val))
    .optional(),
});

export const recordIdParamSchema = z.object({
  id: z.string().uuid('Invalid record ID format'),
});

export const listRecordsQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date')
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date')
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'category', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
