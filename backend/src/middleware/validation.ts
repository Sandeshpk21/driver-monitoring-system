import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../utils/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      logger.debug('Validation error:', { errors, body: req.body });

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      logger.debug('Query validation error:', { errors, query: req.query });

      res.status(400).json({
        success: false,
        message: 'Query validation failed',
        errors,
      });
      return;
    }

    req.query = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  // Authentication schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(1).required(),
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    fullName: Joi.string().min(2).max(255).required(),
    role: Joi.string().valid('driver').default('driver'),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required(),
  }),

  // User schemas
  updateUser: Joi.object({
    fullName: Joi.string().min(2).max(255).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    vehicleInfo: Joi.object({
      make: Joi.string().required(),
      model: Joi.string().required(),
      year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
      plateNumber: Joi.string().required(),
      color: Joi.string().optional(),
    }).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
      relationship: Joi.string().required(),
    }).optional(),
  }),

  // Session schemas
  startSession: Joi.object({
    locationStart: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().optional(),
      timestamp: Joi.date().iso().required(),
    }).optional(),
    deviceInfo: Joi.object({
      platform: Joi.string().required(),
      version: Joi.string().required(),
      model: Joi.string().required(),
      appVersion: Joi.string().required(),
    }).optional(),
  }),

  endSession: Joi.object({
    locationEnd: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().optional(),
      timestamp: Joi.date().iso().required(),
    }).optional(),
    tripDistanceKm: Joi.number().min(0).optional(),
  }),

  // Alert schemas
  createAlert: Joi.object({
    alertType: Joi.string().valid(
      'eye_closure',
      'drowsiness',
      'distraction',
      'phone_usage',
      'texting',
      'yawning',
      'head_droop',
      'head_turn',
      'gaze_deviation',
      'hand_near_face',
      'blink_rate_high'
    ).required(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
    message: Joi.string().required(),
    confidenceScore: Joi.number().min(0).max(1).optional(),
    timestamp: Joi.date().iso().required(),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().optional(),
      timestamp: Joi.date().iso().required(),
    }).optional(),
    metadata: Joi.object({
      eyeAspectRatio: Joi.number().optional(),
      mouthAspectRatio: Joi.number().optional(),
      gazeDeviation: Joi.number().optional(),
      headPoseAngles: Joi.object({
        pitch: Joi.number().required(),
        yaw: Joi.number().required(),
        roll: Joi.number().required(),
      }).optional(),
      blinkCount: Joi.number().integer().min(0).optional(),
      eyeClosureFrames: Joi.number().integer().min(0).optional(),
    }).optional(),
  }),

  // Detection metrics schemas
  createMetric: Joi.object({
    metricType: Joi.string().valid(
      'ear_left',
      'ear_right',
      'ear_average',
      'mar',
      'gaze_x',
      'gaze_y',
      'head_x',
      'head_y',
      'blink_rate',
      'yawn_count',
      'frame_processing_time'
    ).required(),
    value: Joi.number().required(),
    timestamp: Joi.date().iso().required(),
  }),

  // Query schemas
  paginationQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  dateRangeQuery: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  alertsQuery: Joi.object({
    driverId: Joi.string().uuid().optional(),
    sessionId: Joi.string().uuid().optional(),
    alertType: Joi.string().valid(
      'eye_closure',
      'drowsiness',
      'distraction',
      'phone_usage',
      'texting',
      'yawning',
      'head_droop',
      'head_turn',
      'gaze_deviation',
      'hand_near_face',
      'blink_rate_high'
    ).optional(),
    severity: Joi.string().valid('mild', 'moderate', 'severe').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),

  // Sync schemas
  syncRequest: Joi.object({
    lastSyncTimestamp: Joi.date().iso().optional(),
    deviceId: Joi.string().optional(),
  }),

  bulkSync: Joi.object({
    sessions: Joi.array().items(
      Joi.object({
        tempId: Joi.string().required(),
        driverId: Joi.string().uuid().required(),
        startTime: Joi.date().iso().required(),
        endTime: Joi.date().iso().optional(),
        durationSeconds: Joi.number().integer().min(0).optional(),
        locationStart: Joi.object({
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
          address: Joi.string().optional(),
          timestamp: Joi.date().iso().required(),
        }).optional(),
        locationEnd: Joi.object({
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
          address: Joi.string().optional(),
          timestamp: Joi.date().iso().required(),
        }).optional(),
        tripDistanceKm: Joi.number().min(0).optional(),
        deviceInfo: Joi.object({
          platform: Joi.string().required(),
          version: Joi.string().required(),
          model: Joi.string().required(),
          appVersion: Joi.string().required(),
        }).optional(),
      })
    ).optional(),

    alerts: Joi.array().items(
      Joi.object({
        tempId: Joi.string().required(),
        sessionTempId: Joi.string().required(),
        driverId: Joi.string().uuid().required(),
        alertType: Joi.string().valid(
          'eye_closure',
          'drowsiness',
          'distraction',
          'phone_usage',
          'texting',
          'yawning',
          'head_droop',
          'head_turn',
          'gaze_deviation',
          'hand_near_face',
          'blink_rate_high'
        ).required(),
        severity: Joi.string().valid('mild', 'moderate', 'severe').required(),
        message: Joi.string().required(),
        confidenceScore: Joi.number().min(0).max(1).optional(),
        timestamp: Joi.date().iso().required(),
        location: Joi.object({
          latitude: Joi.number().min(-90).max(90).required(),
          longitude: Joi.number().min(-180).max(180).required(),
          address: Joi.string().optional(),
          timestamp: Joi.date().iso().required(),
        }).optional(),
        metadata: Joi.object().optional(),
      })
    ).optional(),

    metrics: Joi.array().items(
      Joi.object({
        tempId: Joi.string().required(),
        sessionTempId: Joi.string().required(),
        driverId: Joi.string().uuid().required(),
        metricType: Joi.string().valid(
          'ear_left',
          'ear_right',
          'ear_average',
          'mar',
          'gaze_x',
          'gaze_y',
          'head_x',
          'head_y',
          'blink_rate',
          'yawn_count',
          'frame_processing_time'
        ).required(),
        value: Joi.number().required(),
        timestamp: Joi.date().iso().required(),
      })
    ).optional(),
  }),
};