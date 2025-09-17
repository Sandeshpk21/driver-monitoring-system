import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CustomError, asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import logger from '../utils/logger';
import { ApiResponse, PaginatedResponse, Session } from '../types';

export const createSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { locationStart, deviceInfo } = req.body;

    try {
      const sessionData = {
        driver_id: req.user.id,
        start_time: new Date().toISOString(),
        location_start: locationStart ? JSON.stringify(locationStart) : null,
        device_info: JSON.stringify(deviceInfo),
        sync_status: 'synced', // Since it's created on server
      };

      const session = await db.create('sessions', sessionData);

      logger.info(`Session created: ${session.id} for user: ${req.user.id}`);

      const response: ApiResponse<Session> = {
        success: true,
        data: {
          id: session.id,
          driverId: session.driver_id,
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : undefined,
          durationSeconds: session.duration_seconds,
          locationStart: session.location_start ? JSON.parse(session.location_start) : undefined,
          locationEnd: session.location_end ? JSON.parse(session.location_end) : undefined,
          tripDistanceKm: session.trip_distance_km,
          deviceInfo: JSON.parse(session.device_info),
          syncStatus: session.sync_status,
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at),
        },
        message: 'Session created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new CustomError('Failed to create session', 500);
    }
  }
);

export const endSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { locationEnd, tripDistanceKm } = req.body;

    try {
      const session = await db.findById('sessions', id);

      if (!session) {
        throw new CustomError('Session not found', 404);
      }

      if (session.driver_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        throw new CustomError('Access denied', 403);
      }

      if (session.end_time) {
        throw new CustomError('Session already ended', 400);
      }

      const endTime = new Date();
      const startTime = new Date(session.start_time);
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const updateData = {
        end_time: endTime.toISOString(),
        duration_seconds: durationSeconds,
        location_end: locationEnd ? JSON.stringify(locationEnd) : null,
        trip_distance_km: tripDistanceKm || null,
      };

      const updatedSession = await db.update('sessions', id, updateData);

      logger.info(`Session ended: ${id} for user: ${req.user.id}, duration: ${durationSeconds}s`);

      const response: ApiResponse<Session> = {
        success: true,
        data: {
          id: updatedSession.id,
          driverId: updatedSession.driver_id,
          startTime: new Date(updatedSession.start_time),
          endTime: new Date(updatedSession.end_time),
          durationSeconds: updatedSession.duration_seconds,
          locationStart: updatedSession.location_start ? JSON.parse(updatedSession.location_start) : undefined,
          locationEnd: updatedSession.location_end ? JSON.parse(updatedSession.location_end) : undefined,
          tripDistanceKm: updatedSession.trip_distance_km,
          deviceInfo: JSON.parse(updatedSession.device_info),
          syncStatus: updatedSession.sync_status,
          createdAt: new Date(updatedSession.created_at),
          updatedAt: new Date(updatedSession.updated_at),
        },
        message: 'Session ended successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to end session:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to end session', 500);
    }
  }
);

export const getSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { id } = req.params;

    try {
      const session = await db.findById('sessions', id);

      if (!session) {
        throw new CustomError('Session not found', 404);
      }

      if (session.driver_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        throw new CustomError('Access denied', 403);
      }

      const response: ApiResponse<Session> = {
        success: true,
        data: {
          id: session.id,
          driverId: session.driver_id,
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : undefined,
          durationSeconds: session.duration_seconds,
          locationStart: session.location_start ? JSON.parse(session.location_start) : undefined,
          locationEnd: session.location_end ? JSON.parse(session.location_end) : undefined,
          tripDistanceKm: session.trip_distance_km,
          deviceInfo: JSON.parse(session.device_info),
          syncStatus: session.sync_status,
          createdAt: new Date(session.created_at),
          updatedAt: new Date(session.updated_at),
        },
      };

      res.json(response);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get session', 500);
    }
  }
);

export const getSessions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const {
      driverId,
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
      const conditions: any = { driver_id: targetDriverId };

      // Add date filters
      let dateFilter = '';
      const params = [targetDriverId];

      if (startDate) {
        dateFilter += ' AND start_time >= $' + (params.length + 1);
        params.push(startDate);
      }

      if (endDate) {
        dateFilter += ' AND start_time <= $' + (params.length + 1);
        params.push(endDate);
      }

      const query = `
        SELECT * FROM sessions
        WHERE driver_id = $1${dateFilter}
        ORDER BY start_time DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit.toString(), offset.toString());

      const result = await db.query(query, params);
      const sessions = result.rows;

      // Get total count
      const countQuery = `
        SELECT COUNT(*) FROM sessions
        WHERE driver_id = $1${dateFilter}
      `;
      const countResult = await db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);

      const formattedSessions = sessions.map((session: any) => ({
        id: session.id,
        driverId: session.driver_id,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : undefined,
        durationSeconds: session.duration_seconds,
        locationStart: session.location_start ? JSON.parse(session.location_start) : undefined,
        locationEnd: session.location_end ? JSON.parse(session.location_end) : undefined,
        tripDistanceKm: session.trip_distance_km,
        deviceInfo: JSON.parse(session.device_info),
        syncStatus: session.sync_status,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      }));

      const response: PaginatedResponse<Session> = {
        success: true,
        data: formattedSessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get sessions:', error);
      throw new CustomError('Failed to get sessions', 500);
    }
  }
);

export const deleteSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new CustomError('User not authenticated', 401);
    }

    const { id } = req.params;

    try {
      const session = await db.findById('sessions', id);

      if (!session) {
        throw new CustomError('Session not found', 404);
      }

      if (session.driver_id !== req.user.id && req.user.role !== 'admin') {
        throw new CustomError('Access denied', 403);
      }

      await db.delete('sessions', id);

      logger.info(`Session deleted: ${id} by user: ${req.user.id}`);

      const response: ApiResponse = {
        success: true,
        message: 'Session deleted successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to delete session:', error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete session', 500);
    }
  }
);

export const getSessionStats = asyncHandler(
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

      const statsQuery = `
        SELECT
          COUNT(*) as total_sessions,
          SUM(duration_seconds) as total_driving_time,
          SUM(trip_distance_km) as total_distance,
          AVG(duration_seconds) as avg_session_duration
        FROM sessions
        WHERE driver_id = $1 AND start_time >= $2
      `;

      const result = await db.query(statsQuery, [targetDriverId, since.toISOString()]);
      const stats = result.rows[0];

      const response: ApiResponse = {
        success: true,
        data: {
          totalSessions: parseInt(stats.total_sessions) || 0,
          totalDrivingTime: parseInt(stats.total_driving_time) || 0,
          totalDistance: parseFloat(stats.total_distance) || 0,
          averageSessionDuration: parseFloat(stats.avg_session_duration) || 0,
          period: `${days} days`,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get session stats:', error);
      throw new CustomError('Failed to get session stats', 500);
    }
  }
);