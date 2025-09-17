import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';
import { validate, validateQuery, schemas } from '../middleware/validation';
import { authenticate, requireSelfOrAdmin } from '../middleware/auth';

const router = Router();

// All session routes require authentication
router.use(authenticate);

// Session CRUD operations
router.post('/', validate(schemas.startSession), sessionController.createSession);
router.get('/stats', validateQuery(schemas.dateRangeQuery), sessionController.getSessionStats);
router.get('/', validateQuery(schemas.dateRangeQuery), sessionController.getSessions);
router.get('/:id', sessionController.getSession);
router.patch('/:id/end', validate(schemas.endSession), sessionController.endSession);
router.delete('/:id', requireSelfOrAdmin, sessionController.deleteSession);

export default router;