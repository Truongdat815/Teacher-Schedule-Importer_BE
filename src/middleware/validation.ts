import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: {
  body?: ZodObject<any>;
  query?: ZodObject<any>;
  params?: ZodObject<any>;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body, query, and params
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        const parsed = await schema.query.parseAsync(req.query);
        Object.assign(req.query, parsed);
      }
      if (schema.params) {
        const parsed = await schema.params.parseAsync(req.params);
        Object.assign(req.params, parsed);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        const validationError = new ValidationError('Validation failed');
        // Attach validation details to error for better error messages
        (validationError as any).details = errors;
        return next(validationError);
      }
      next(error);
    }
  };
};
