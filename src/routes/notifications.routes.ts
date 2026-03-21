import { Router } from 'express';
import { notificationsController } from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', notificationsController.list);
router.get('/unread-count', notificationsController.getUnreadCount);
router.post('/mark-all-read', notificationsController.markAllAsRead);
router.post('/:id/read', notificationsController.markAsRead);

export default router;
