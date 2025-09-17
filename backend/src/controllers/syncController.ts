import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

export const bulkSync = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { sessions, alerts, metrics } = req.body;

    const results = {
      success: true,
      synced: {
        sessions: 0,
        alerts: 0,
        metrics: 0,
      },
      failed: {
        sessions: 0,
        alerts: 0,
        metrics: 0,
      },
      errors: [] as string[],
      mappings: {
        sessions: {} as { [tempId: string]: string },
        alerts: {} as { [tempId: string]: string },
        metrics: {} as { [tempId: string]: string },
      },
    };

    try {
      // Process sessions first (alerts and metrics depend on session IDs)
      if (sessions && Array.isArray(sessions)) {
        const sessionResults = await processSessions(sessions, req.user.id);
        results.synced.sessions = sessionResults.synced;
        results.failed.sessions = sessionResults.failed;
        results.errors.push(...sessionResults.errors);
        results.mappings.sessions = sessionResults.mappings;
      }

      // Process alerts
      if (alerts && Array.isArray(alerts)) {
        const alertResults = await processAlerts(alerts, req.user.id, results.mappings.sessions);
        results.synced.alerts = alertResults.synced;
        results.failed.alerts = alertResults.failed;
        results.errors.push(...alertResults.errors);
        results.mappings.alerts = alertResults.mappings;
      }

      // Process metrics
      if (metrics && Array.isArray(metrics)) {
        const metricResults = await processMetrics(metrics, req.user.id, results.mappings.sessions);
        results.synced.metrics = metricResults.synced;
        results.failed.metrics = metricResults.failed;
        results.errors.push(...metricResults.errors);
        results.mappings.metrics = metricResults.mappings;
      }

      results.success = results.failed.sessions === 0 && results.failed.alerts === 0 && results.failed.metrics === 0;

      logger.info(`Bulk sync completed for user ${req.user.id}: synced ${results.synced.sessions + results.synced.alerts + results.synced.metrics} items`);

      const response: ApiResponse = {
        success: results.success,
        data: results,
        message: results.success ? 'Bulk sync completed successfully' : 'Bulk sync completed with errors',
      };

      res.json(response);
    } catch (error) {
      logger.error('Bulk sync failed:', error);
      throw new CustomError('Bulk sync failed', 500);
    }
  }
);

async function processSessions(sessions: any[], driverId: string) {
  const result = {
    synced: 0,
    failed: 0,
    errors: [] as string[],
    mappings: {} as { [tempId: string]: string },
  };

  for (const session of sessions) {
    try {
      const sessionData = {
        driver_id: driverId,
        start_time: session.startTime,
        end_time: session.endTime || null,
        duration_seconds: session.durationSeconds || null,
        location_start: session.locationStart ? JSON.stringify(session.locationStart) : null,
        location_end: session.locationEnd ? JSON.stringify(session.locationEnd) : null,
        trip_distance_km: session.tripDistanceKm || null,
        device_info: JSON.stringify(session.deviceInfo),
        sync_status: 'synced',
      };

      const createdSession = await db.create('sessions', sessionData);
      result.synced++;
      result.mappings[session.tempId] = createdSession.id;

      logger.debug(`Session synced: ${session.tempId} -> ${createdSession.id}`);
    } catch (error) {
      result.failed++;
      result.errors.push(`Session ${session.tempId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error(`Failed to sync session ${session.tempId}:`, error);
    }
  }

  return result;
}

async function processAlerts(alerts: any[], driverId: string, sessionMappings: { [tempId: string]: string }) {
  const result = {
    synced: 0,
    failed: 0,
    errors: [] as string[],
    mappings: {} as { [tempId: string]: string },
  };

  for (const alert of alerts) {
    try {
      const sessionId = sessionMappings[alert.sessionTempId];

      if (!sessionId) {
        throw new Error(`Session mapping not found for temp ID: ${alert.sessionTempId}`);
      }

      const alertData = {
        session_id: sessionId,
        driver_id: driverId,
        alert_type: alert.alertType,
        severity: alert.severity,
        message: alert.message,
        confidence_score: alert.confidenceScore || null,
        timestamp: alert.timestamp,
        location: alert.location ? JSON.stringify(alert.location) : null,
        metadata: alert.metadata ? JSON.stringify(alert.metadata) : null,
        sync_status: 'synced',
      };

      const createdAlert = await db.create('alerts', alertData);
      result.synced++;
      result.mappings[alert.tempId] = createdAlert.id;

      logger.debug(`Alert synced: ${alert.tempId} -> ${createdAlert.id}`);
    } catch (error) {
      result.failed++;
      result.errors.push(`Alert ${alert.tempId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error(`Failed to sync alert ${alert.tempId}:`, error);
    }
  }

  return result;
}

async function processMetrics(metrics: any[], driverId: string, sessionMappings: { [tempId: string]: string }) {
  const result = {
    synced: 0,
    failed: 0,
    errors: [] as string[],
    mappings: {} as { [tempId: string]: string },
  };

  for (const metric of metrics) {
    try {
      const sessionId = sessionMappings[metric.sessionTempId];

      if (!sessionId) {
        throw new Error(`Session mapping not found for temp ID: ${metric.sessionTempId}`);
      }

      const metricData = {
        session_id: sessionId,
        driver_id: driverId,
        metric_type: metric.metricType,
        value: metric.value,
        timestamp: metric.timestamp,
        sync_status: 'synced',
      };

      const createdMetric = await db.create('detection_metrics', metricData);
      result.synced++;
      result.mappings[metric.tempId] = createdMetric.id;

      logger.debug(`Metric synced: ${metric.tempId} -> ${createdMetric.id}`);
    } catch (error) {
      result.failed++;
      result.errors.push(`Metric ${metric.tempId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      logger.error(`Failed to sync metric ${metric.tempId}:`, error);
    }
  }

  return result;
}

export const downloadUpdates = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { since } = req.query;
    const lastSync = since ? new Date(since as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago

    try {
      let targetDriverId = req.user.id;

      // Admins and managers can sync all data
      let driverFilter = 'WHERE driver_id = $2';
      const params = [lastSync.toISOString(), targetDriverId];

      if (req.user.role === 'admin' || req.user.role === 'manager') {
        driverFilter = '';
        params.pop(); // Remove driver ID param
      }

      // Get updated sessions
      const sessionsQuery = `
        SELECT * FROM sessions
        ${driverFilter}
        ${driverFilter ? 'AND' : 'WHERE'} updated_at >= $1
        ORDER BY updated_at DESC
        LIMIT 1000
      `;

      const sessionsResult = await db.query(sessionsQuery, params);
      const sessions = sessionsResult.rows.map((session: any) => ({
        id: session.id,
        driverId: session.driver_id,
        startTime: session.start_time,
        endTime: session.end_time,
        durationSeconds: session.duration_seconds,
        locationStart: session.location_start ? JSON.parse(session.location_start) : null,
        locationEnd: session.location_end ? JSON.parse(session.location_end) : null,
        tripDistanceKm: session.trip_distance_km,
        deviceInfo: JSON.parse(session.device_info),
        syncStatus: session.sync_status,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
      }));

      // Get updated alerts
      const alertsQuery = `
        SELECT * FROM alerts
        ${driverFilter}
        ${driverFilter ? 'AND' : 'WHERE'} created_at >= $1
        ORDER BY created_at DESC
        LIMIT 5000
      `;

      const alertsResult = await db.query(alertsQuery, params);
      const alerts = alertsResult.rows.map((alert: any) => ({
        id: alert.id,
        sessionId: alert.session_id,
        driverId: alert.driver_id,
        alertType: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        confidenceScore: alert.confidence_score,
        timestamp: alert.timestamp,
        location: alert.location ? JSON.parse(alert.location) : null,
        metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
        syncStatus: alert.sync_status,
        createdAt: alert.created_at,
      }));

      // Get updated metrics
      const metricsQuery = `
        SELECT * FROM detection_metrics
        ${driverFilter}
        ${driverFilter ? 'AND' : 'WHERE'} created_at >= $1
        ORDER BY created_at DESC
        LIMIT 10000
      `;

      const metricsResult = await db.query(metricsQuery, params);
      const metrics = metricsResult.rows.map((metric: any) => ({
        id: metric.id,
        sessionId: metric.session_id,
        driverId: metric.driver_id,
        metricType: metric.metric_type,
        value: metric.value,
        timestamp: metric.timestamp,
        syncStatus: metric.sync_status,
        createdAt: metric.created_at,
      }));

      logger.info(`Download updates for user ${req.user.id}: ${sessions.length} sessions, ${alerts.length} alerts, ${metrics.length} metrics`);

      const response: ApiResponse = {
        success: true,
        data: {
          sessions,
          alerts,
          metrics,
          syncTimestamp: new Date().toISOString(),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to download updates:', error);
      throw new CustomError('Failed to download updates', 500);
    }
  }
);

export const getSyncStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    try {
      let targetDriverId = req.user.id;
      const { driverId } = req.query;

      if (driverId && (req.user.role === 'admin' || req.user.role === 'manager')) {
        targetDriverId = driverId as string;
      }

      // Get pending sync counts
      const pendingQuery = `
        SELECT
          (SELECT COUNT(*) FROM sessions WHERE driver_id = $1 AND sync_status = 'pending') as pending_sessions,
          (SELECT COUNT(*) FROM alerts WHERE driver_id = $1 AND sync_status = 'pending') as pending_alerts,
          (SELECT COUNT(*) FROM detection_metrics WHERE driver_id = $1 AND sync_status = 'pending') as pending_metrics
      `;

      const pendingResult = await db.query(pendingQuery, [targetDriverId]);
      const pending = pendingResult.rows[0];

      // Get last sync operation
      const lastSyncQuery = `
        SELECT MAX(completed_at) as last_sync
        FROM sync_operations
        WHERE driver_id = $1 AND status = 'completed'
      `;

      const lastSyncResult = await db.query(lastSyncQuery, [targetDriverId]);
      const lastSync = lastSyncResult.rows[0].last_sync;

      const response: ApiResponse = {
        success: true,
        data: {
          pendingSessions: parseInt(pending.pending_sessions),
          pendingAlerts: parseInt(pending.pending_alerts),
          pendingMetrics: parseInt(pending.pending_metrics),
          lastSync: lastSync ? new Date(lastSync) : null,
          driverId: targetDriverId,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw new CustomError('Failed to get sync status', 500);
    }
  }
);

export const triggerSync = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      throw new CustomError('Access denied', 403);
    }

    const { driverId } = req.body;

    try {
      // Create sync operation record
      const syncOperation = await db.create('sync_operations', {
        driver_id: driverId || req.user.id,
        operation_type: 'download',
        table_name: 'all',
        status: 'pending',
      });

      // In a real implementation, you would trigger background sync process here
      // For now, we'll just mark it as completed
      await db.update('sync_operations', syncOperation.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      logger.info(`Sync triggered by ${req.user.id} for driver ${driverId || req.user.id}`);

      const response: ApiResponse = {
        success: true,
        data: {
          syncOperationId: syncOperation.id,
        },
        message: 'Sync triggered successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to trigger sync:', error);
      throw new CustomError('Failed to trigger sync', 500);
    }
  }
);