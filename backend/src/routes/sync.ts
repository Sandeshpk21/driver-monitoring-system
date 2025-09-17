import { Router } from 'express';
import * as syncController from '../controllers/syncController';
import { validate, validateQuery, schemas } from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All sync routes require authentication
router.use(authenticate);

// Sync operations
router.post('/bulk', validate(schemas.bulkSync), syncController.bulkSync);
router.get('/download', validateQuery(schemas.syncRequest), syncController.downloadUpdates);
router.get('/status', validateQuery(schemas.paginationQuery), syncController.getSyncStatus);
router.post('/trigger', authorize(['admin', 'manager']), syncController.triggerSync);

export default router;