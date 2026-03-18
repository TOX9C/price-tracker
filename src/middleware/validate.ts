import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten();
      next(new ValidationError('Validation failed', { fields: errors.fieldErrors }));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.flatten();
      next(new ValidationError('Invalid path parameters', { fields: errors.fieldErrors }));
      return;
    }
    req.params = result.data as Record<string, string>;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.flatten();
      next(new ValidationError('Invalid query parameters', { fields: errors.fieldErrors }));
      return;
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}
