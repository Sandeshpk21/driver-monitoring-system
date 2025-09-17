import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { ApiResponse, PaginatedResponse, Alert } from '../types';

export const createAlert = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const {
      sessionId,
      alertType,
      severity,
      message,
      confidenceScore,
      timestamp,
      location,
      metadata,
    } = req.body;

    try {
      // Verify session exists and belongs to user
      const session = await db.findById('sessions', sessionId);

      if (!session) {
        throw new CustomError('Session not found', 404);
      }

      if (session.driver_id !== req.user.id) {
        throw new CustomError('Access denied', 403);
      }

      const alertData = {
        session_id: sessionId,
        driver_id: req.user.id,
        alert_type: alertType,
        severity,
        message,
        confidence_score: confidenceScore,
        timestamp,
        location: location ? JSON.stringify(location) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        sync_status: 'synced', // Since it's created on server
      };

      const alert = await db.create('alerts', alertData);

      logger.info(`Alert created: ${alert.id} for session: ${sessionId}`);

      const response: ApiResponse<Alert> = {
        success: true,
        data: {
          id: alert.id,
          sessionId: alert.session_id,
          driverId: alert.driver_id,
          alertType: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          confidenceScore: alert.confidence_score,
          timestamp: new Date(alert.timestamp),
          location: alert.location ? JSON.parse(alert.location) : undefined,
          metadata: alert.metadata ? JSON.parse(alert.metadata) : undefined,
          syncStatus: alert.sync_status,
          createdAt: new Date(alert.created_at),
        },
        message: 'Alert created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create alert:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create alert', 500);
    }
  }
);

export const getAlert = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { id } = req.params;

    try {
      const alert = await db.findById('alerts', id);

      if (!alert) {
        throw new CustomError('Alert not found', 404);
      }

      if (alert.driver_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        throw new CustomError('Access denied', 403);
      }

      const response: ApiResponse<Alert> = {
        success: true,
        data: {
          id: alert.id,
          sessionId: alert.session_id,
          driverId: alert.driver_id,
          alertType: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          confidenceScore: alert.confidence_score,
          timestamp: new Date(alert.timestamp),
          location: alert.location ? JSON.parse(alert.location) : undefined,
          metadata: alert.metadata ? JSON.parse(alert.metadata) : undefined,
          syncStatus: alert.sync_status,
          createdAt: new Date(alert.created_at),
        },
      };

      res.json(response);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get alert', 500);
    }
  }
);

export const getAlerts = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const {
      driverId,
      sessionId,
      alertType,
      severity,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query as any;

    try {
      let targetDriverId = req.user.id;

      // Allow admins and managers to query other drivers
      if (driverId && (req.user.role === 'admin' || req.user.role === 'manager')) {
        targetDriverId = driverId;
      }

      const offset = (page - 1) * limit;
      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Driver filter
      conditions.push(`driver_id = $${paramIndex++}`);
      params.push(targetDriverId);

      // Session filter
      if (sessionId) {
        conditions.push(`session_id = $${paramIndex++}`);
        params.push(sessionId);
      }

      // Alert type filter
      if (alertType) {
        conditions.push(`alert_type = $${paramIndex++}`);
        params.push(alertType);
      }

      // Severity filter
      if (severity) {
        conditions.push(`severity = $${paramIndex++}`);
        params.push(severity);
      }

      // Date filters
      if (startDate) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(endDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT * FROM alerts
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      params.push(limit, offset);

      const result = await db.query(query, params);
      const alerts = result.rows;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM alerts
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      const formattedAlerts = alerts.map((alert: any) => ({
        id: alert.id,
        sessionId: alert.session_id,
        driverId: alert.driver_id,
        alertType: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        confidenceScore: alert.confidence_score,
        timestamp: new Date(alert.timestamp),
        location: alert.location ? JSON.parse(alert.location) : undefined,
        metadata: alert.metadata ? JSON.parse(alert.metadata) : undefined,
        syncStatus: alert.sync_status,
        createdAt: new Date(alert.created_at),
      }));

      const response: PaginatedResponse<Alert> = {
        success: true,
        data: formattedAlerts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get alerts:', error);
      throw new CustomError('Failed to get alerts', 500);
    }
  }
);

export const getAlertStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { driverId, days = 30 } = req.query as any;

    try {
      let targetDriverId = req.user.id;

      if (driverId && (req.user.role === 'admin' || req.user.role === 'manager')) {
        targetDriverId = driverId;
      }

      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      // Get alert counts by type and severity
      const statsQuery = `
        SELECT
          alert_type,
          severity,
          COUNT(*) as count
        FROM alerts
        WHERE driver_id = $1 AND timestamp >= $2
        GROUP BY alert_type, severity
        ORDER BY count DESC
      `;

      const result = await db.query(statsQuery, [targetDriverId, since.toISOString()]);
      const alertStats = result.rows;

      // Get total counts by severity
      const totalQuery = `
        SELECT
          severity,
          COUNT(*) as total
        FROM alerts
        WHERE driver_id = $1 AND timestamp >= $2
        GROUP BY severity
      `;

      const totalResult = await db.query(totalQuery, [targetDriverId, since.toISOString()]);
      const totalStats = totalResult.rows;

      // Get daily alert trends
      const trendQuery = `
        SELECT
          DATE(timestamp) as alert_date,
          COUNT(*) as daily_count,
          COUNT(CASE WHEN severity = 'severe' THEN 1 END) as severe_count
        FROM alerts
        WHERE driver_id = $1 AND timestamp >= $2
        GROUP BY DATE(timestamp)
        ORDER BY alert_date DESC
        LIMIT 30
      `;

      const trendResult = await db.query(trendQuery, [targetDriverId, since.toISOString()]);
      const trends = trendResult.rows;

      const response: ApiResponse = {
        success: true,
        data: {
          period: `${days} days`,
          byTypeAndSeverity: alertStats.map((stat: any) => ({
            alertType: stat.alert_type,
            severity: stat.severity,
            count: parseInt(stat.count),
          })),
          bySeverity: totalStats.map((stat: any) => ({
            severity: stat.severity,
            total: parseInt(stat.total),
          })),
          dailyTrends: trends.map((trend: any) => ({
            date: trend.alert_date,
            totalAlerts: parseInt(trend.daily_count),
            severeAlerts: parseInt(trend.severe_count),
          })),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get alert stats:', error);
      throw new CustomError('Failed to get alert stats', 500);
    }
  }
);

export const deleteAlert = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { id } = req.params;

    try {
      const alert = await db.findById('alerts', id);

      if (!alert) {
        throw new CustomError('Alert not found', 404);
      }

      if (alert.driver_id !== req.user.id && req.user.role !== 'admin') {
        throw new CustomError('Access denied', 403);
      }

      await db.delete('alerts', id);

      logger.info(`Alert deleted: ${id} by user: ${req.user.id}`);

      const response: ApiResponse = {
        success: true,
        message: 'Alert deleted successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to delete alert:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete alert', 500);
    }
  }
);

export const getAlertTrends = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      throw new CustomError('Access denied', 403);
    }

    const { days = 30, driverId } = req.query as any;

    try {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days));

      let driverFilter = '';
      const params = [since.toISOString()];

      if (driverId) {
        driverFilter = ' AND a.driver_id = $2';
        params.push(driverId);
      }

      const trendsQuery = `
        SELECT
          DATE(a.timestamp) as alert_date,
          a.alert_type,
          a.severity,
          COUNT(*) as alert_count,
          u.full_name as driver_name
        FROM alerts a
        JOIN users u ON a.driver_id = u.id
        WHERE a.timestamp >= $1${driverFilter}
        GROUP BY DATE(a.timestamp), a.alert_type, a.severity, u.full_name
        ORDER BY alert_date DESC, alert_count DESC
      `;

      const result = await db.query(trendsQuery, params);
      const trends = result.rows;

      const response: ApiResponse = {
        success: true,
        data: trends.map((trend: any) => ({
          date: trend.alert_date,
          alertType: trend.alert_type,
          severity: trend.severity,
          count: parseInt(trend.alert_count),
          driverName: trend.driver_name,
        })),
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get alert trends:', error);
      throw new CustomError('Failed to get alert trends', 500);
    }
  }
);