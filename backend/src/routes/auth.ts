import { Router, Request, Response } from 'express';
import * as authController from '../controllers/authController';
import { validate, schemas } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import rateLimit, { MemoryStore } from 'express-rate-limit';

const router = Router();

// Create a memory store for rate limiting (allows reset in development)
const authLimiterStore = new MemoryStore();

// Rate limiting for auth endpoints (relaxed for development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10, // More lenient in development
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: process.env.NODE_ENV === 'development', // Don't count successful requests in dev
  store: authLimiterStore,
  skip: (req: Request) => {
    // Skip rate limiting for reset endpoint in development
    return process.env.NODE_ENV === 'development' && req.path === '/reset-rate-limit';
  },
});

// Development-only features
if (process.env.NODE_ENV === 'development') {
  // Endpoint to manually reset rate limit
  router.post('/reset-rate-limit', (req: Request, res: Response) => {
    authLimiterStore.resetAll();
    res.json({
      success: true,
      message: 'Rate limit counter reset successfully'
    });
  });

  // Auto-reset rate limits every 5 minutes in development
  setInterval(() => {
    authLimiterStore.resetAll();
    console.log('[Dev] Rate limit counters automatically reset');
  }, 5 * 60 * 1000);
}

// Apply rate limiting to auth routes
router.use(authLimiter);

// Auth routes
router.post('/login', validate(schemas.login), authController.login);
router.post('/register', validate(schemas.register), authController.register);
router.post('/refresh', validate(schemas.refreshToken), authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.patch('/change-password', authenticate, validate(schemas.changePassword), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;