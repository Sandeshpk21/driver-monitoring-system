import { Router } from 'express';
import * as alertController from '../controllers/alertController';
import { validate, validateQuery, schemas } from '../middleware/validation';
import { authenticate, authorize, requireSelfOrAdmin } from '../middleware/auth';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

// Alert CRUD operations
router.post('/', validate(schemas.createAlert), alertController.createAlert);
router.get('/stats', validateQuery(schemas.dateRangeQuery), alertController.getAlertStats);
router.get('/trends', authorize(['admin', 'manager']), validateQuery(schemas.dateRangeQuery), alertController.getAlertTrends);
router.get('/', validateQuery(schemas.alertsQuery), alertController.getAlerts);
router.get('/:id', alertController.getAlert);
router.delete('/:id', requireSelfOrAdmin, alertController.deleteAlert);

export default router;