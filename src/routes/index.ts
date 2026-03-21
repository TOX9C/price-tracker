import { Router } from 'express';
import authRoutes from './auth.routes.js';
import itemsRoutes from './items.routes.js';
import notificationsRoutes from './notifications.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/internal', internalRoutes);

export default router;
