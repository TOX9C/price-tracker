import { Router } from 'express';
import { itemsController } from '../controllers/items.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { apiRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.use(requireAuth);
router.use(apiRateLimiter);

router.post('/',
  itemsController.validateCreate,
  itemsController.create
);

router.get('/',
  itemsController.validateList,
  itemsController.list
);

router.get('/:id',
  itemsController.validateParams,
  itemsController.get
);

router.put('/:id',
  itemsController.validateParams,
  itemsController.validateUpdate,
  itemsController.update
);

router.delete('/:id',
  itemsController.validateParams,
  itemsController.delete
);

router.post('/:id/urls',
  itemsController.validateParams,
  itemsController.validateAddUrl,
  itemsController.addUrl
);

router.delete('/:id/urls/:urlId',
  itemsController.validateParams,
  itemsController.removeUrl
);

router.post('/:id/check',
  itemsController.validateParams,
  itemsController.manualCheck
);

export default router;
