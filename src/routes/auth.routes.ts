import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register',
  authRateLimiter,
  authController.validateRegister,
  authController.register
);

router.post('/login',
  authRateLimiter,
  authController.validateLogin,
  authController.login
);

router.post('/refresh',
  requireAuth,
  authController.refresh
);

router.post('/logout',
  requireAuth,
  authController.logout
);

export default router;
