// User and Authentication Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'driver' | 'admin' | 'manager';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver extends User {
  licenseNumber?: string;
  phoneNumber?: string;
  vehicleInfo?: VehicleInfo;
  emergencyContact?: EmergencyContact;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Session Types
export interface Session {
  id: string;
  driverId: string;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  locationStart?: Location;
  locationEnd?: Location;
  tripDistanceKm?: number;
  deviceInfo?: DeviceInfo;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: Date;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  appVersion: string;
}

// Alert Types (based on dmsv7.py detection logic)
export interface Alert {
  id: string;
  sessionId: string;
  driverId: string;
  alertType: AlertType;
  severity: 'mild' | 'moderate' | 'severe';
  message: string;
  confidenceScore?: number;
  timestamp: Date;
  location?: Location;
  metadata?: AlertMetadata;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
}

export type AlertType =
  | 'eye_closure'
  | 'drowsiness'
  | 'distraction'
  | 'phone_usage'
  | 'texting'
  | 'yawning'
  | 'head_droop'
  | 'head_turn'
  | 'gaze_deviation'
  | 'hand_near_face'
  | 'blink_rate_high';

export interface AlertMetadata {
  eyeAspectRatio?: number;
  mouthAspectRatio?: number;
  gazeDeviation?: number;
  headPoseAngles?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  blinkCount?: number;
  eyeClosureFrames?: number;
}

// Detection Metrics Types
export interface DetectionMetric {
  id: string;
  sessionId: string;
  driverId: string;
  metricType: MetricType;
  value: number;
  timestamp: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
}

export type MetricType =
  | 'ear_left'
  | 'ear_right'
  | 'ear_average'
  | 'mar'
  | 'gaze_x'
  | 'gaze_y'
  | 'head_x'
  | 'head_y'
  | 'blink_rate'
  | 'yawn_count'
  | 'frame_processing_time';

// Sync Types
export interface SyncOperation {
  id: string;
  driverId: string;
  operationType: 'upload' | 'download';
  tableName: string;
  recordId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errorMessage?: string;
  retryCount: number;
  startedAt: Date;
  completedAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: 'driver';
}

// Analytics Types
export interface DriverStatistics {
  id: string;
  fullName: string;
  email: string;
  totalSessions: number;
  totalDrivingTimeSeconds: number;
  totalDistanceKm: number;
  totalAlerts: number;
  severeAlerts: number;
  moderateAlerts: number;
  mildAlerts: number;
}

export interface AlertTrend {
  alertDate: string;
  alertType: AlertType;
  severity: 'mild' | 'moderate' | 'severe';
  alertCount: number;
}

// Request/Query Types
export interface GetAlertsQuery {
  driverId?: string;
  sessionId?: string;
  alertType?: AlertType;
  severity?: 'mild' | 'moderate' | 'severe';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetSessionsQuery {
  driverId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SyncRequest {
  lastSyncTimestamp?: string;
  deviceId?: string;
}

export interface SyncResponse {
  sessions: Session[];
  alerts: Alert[];
  metrics: DetectionMetric[];
  syncTimestamp: string;
}