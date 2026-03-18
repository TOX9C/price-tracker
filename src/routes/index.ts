import { Router } from 'express';
import authRoutes from './auth.routes.js';
import itemsRoutes from './items.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemsRoutes);

export default router;
