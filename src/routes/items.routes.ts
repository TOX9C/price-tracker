import { Router } from 'express';
import { itemsController } from '../controllers/items.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Item CRUD
router.post('/',
  itemsController.validateCreate,
  itemsController.create
);

router.get('/',
  itemsController.validateList,
  itemsController.list
);

// Queue stats (must come before /:id routes)
router.get('/queue/stats',
  itemsController.getQueueStats
);

// Preview URL (must come before /:id routes)
router.get('/preview',
  itemsController.validatePreview,
  itemsController.preview
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

// Price check queue
router.post('/:id/check',
  itemsController.validateParams,
  itemsController.queueCheck
);

router.get('/:id/check/:jobId',
  itemsController.validateJobParams,
  itemsController.getCheckStatus
);

// URL management
router.post('/:id/urls',
  itemsController.validateParams,
  itemsController.validateAddUrl,
  itemsController.addUrl
);

router.delete('/:id/urls/:urlId',
  itemsController.validateParams,
  itemsController.removeUrl
);

export default router;
