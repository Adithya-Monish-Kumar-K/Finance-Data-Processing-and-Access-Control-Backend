import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError';

/**
 * Zod schema validation middleware factory.
 * 
 * Validates request body, query params, and/or URL params against
 * Zod schemas. On failure, returns a structured 400 error with
 * field-level error messages.
 * 
 * Usage:
 *   validate({ body: createUserSchema })
 *   validate({ query: listQuerySchema })
 *   validate({ body: updateSchema, params: idParamSchema })
 */

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    // Validate each provided schema
    for (const [source, schema] of Object.entries(schemas)) {
      if (!schema) continue;

      const data = req[source as keyof typeof schemas];
      const result = schema.safeParse(data);

      if (!result.success) {
        const fieldErrors = formatZodErrors(result.error);
        for (const [field, messages] of Object.entries(fieldErrors)) {
          const key = source === 'body' ? field : `${source}.${field}`;
          errors[key] = messages;
        }
      } else {
        // Replace with parsed/coerced data (Zod can transform values)
        // Note: In Express v5, req.query is a getter-only property,
        // so we use Object.assign to merge validated values.
        if (source === 'query') {
          Object.assign(req.query, result.data);
        } else {
          (req as unknown as Record<string, unknown>)[source] = result.data;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      next(new ValidationError('Validation failed', errors));
      return;
    }

    next();
  };
}

/**
 * Converts Zod errors into a field → messages map.
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}
