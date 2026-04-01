import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../shared/responseHelper';

type ValidationSource = 'body' | 'query' | 'params';

/**
 * Zod validation middleware — Fail Fast principle.
 * Validates the specified request source against a Zod schema.
 * Returns structured field-level error messages on failure.
 *
 * OCP: Add new schemas without modifying this middleware.
 */
export const validate = (schema: ZodSchema, source: ValidationSource = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      sendError(res, 'Validation failed', fieldErrors, 400);
      return;
    }

    // Replace the source with parsed (and potentially transformed) data
    req[source] = result.data;
    next();
  };
};

/**
 * Converts Zod errors into a structured field → messages map.
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return fieldErrors;
};
