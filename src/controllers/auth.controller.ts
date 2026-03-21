import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { validateBody } from '../middleware/validate.js';
import { AuthRequest } from '../middleware/auth.js';

const registerSchema = z.object({
 email: z.string().email('Invalid email address'),
 password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
 email: z.string().email('Invalid email address'),
 password: z.string().min(1, 'Password is required'),
});

export const authController = {
 validateRegister: validateBody(registerSchema),
 validateLogin: validateBody(loginSchema),

 async register(req: Request, res: Response, next: NextFunction): Promise<void> {
 try {
 const result = await authService.register(req.body);
 res.status(201).json({
 user: result.user,
 token: result.token,
 refreshToken: result.refreshToken,
 });
 } catch (error) {
 next(error);
 }
 },

 async login(req: Request, res: Response, next: NextFunction): Promise<void> {
 try {
 const result = await authService.login(req.body);
 res.json({
 user: result.user,
 token: result.token,
 refreshToken: result.refreshToken,
 });
 } catch (error) {
 next(error);
 }
 },

 async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
 try {
 const userId = (req as AuthRequest).userId;
 const result = await authService.refresh(userId);
 res.json({
 token: result.token,
 refreshToken: result.refreshToken,
 });
 } catch (error) {
 next(error);
 }
 },

 async logout(_req: Request, res: Response, _next: NextFunction): Promise<void> {
 res.status(204).send();
 },

 async me(req: Request, res: Response, next: NextFunction): Promise<void> {
 try {
 const userId = (req as AuthRequest).userId;
 const user = await authService.getUserById(userId);
 if (!user) {
 res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
 return;
 }
 res.json({ data: user });
 } catch (error) {
 next(error);
 }
 },
};
