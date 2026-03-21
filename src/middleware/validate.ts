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
 Object.assign(req.params, result.data);
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
 // Express 5 makes req.query read-only, so we attach parsed data to req
 (req as Request & { parsedQuery?: T }).parsedQuery = result.data;
 next();
 };
}
