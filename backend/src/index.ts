import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './utils/config';
import { db } from './utils/database';
import logger from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import alertRoutes from './routes/alerts';
import syncRoutes from './routes/sync';

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();

    res.status(dbHealth ? 200 : 503).json({
      success: dbHealth,
      message: dbHealth ? 'Service healthy' : 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use(`/api/${config.api.version}/auth`, authRoutes);
app.use(`/api/${config.api.version}/sessions`, sessionRoutes);
app.use(`/api/${config.api.version}/alerts`, alertRoutes);
app.use(`/api/${config.api.version}/sync`, syncRoutes);

// API info endpoint
app.get(`/api/${config.api.version}`, (req, res) => {
  res.json({
    success: true,
    message: 'Driver Monitoring System API',
    version: config.api.version,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: `/api/${config.api.version}/auth`,
      sessions: `/api/${config.api.version}/sessions`,
      alerts: `/api/${config.api.version}/alerts`,
      sync: `/api/${config.api.version}/sync`,
      health: '/health',
    },
  });
});

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbHealth = await db.healthCheck();
    if (!dbHealth) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    logger.info('Database connection established');

    app.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`API version: ${config.api.version}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await db.close();
    logger.info('Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;