// Detection Types (based on dmsv7.py algorithms)
export interface DetectionConfig {
  earThreshold: number;
  eyeClosedFramesThreshold: number;
  blinkRateThreshold: number;
  marThreshold: number;
  yawnThreshold: number;
  gazeDeviationThreshold: number;
  headTurnThreshold: number;
  handNearFaceDistance: number;
}

export interface DetectionResult {
  eyeClosure: {
    leftEAR: number;
    rightEAR: number;
    averageEAR: number;
    isEyesClosed: boolean;
    closureFrames: number;
    severity: 'normal' | 'warning' | 'alert';
  };
  headPose: {
    x: number;
    y: number;
    pitch: number;
    yaw: number;
    roll: number;
    turn: 'none' | 'mild' | 'moderate' | 'severe';
    tilt: 'none' | 'mild' | 'moderate' | 'severe';
    droop: 'none' | 'mild' | 'moderate' | 'severe';
  };
  gaze: {
    x: number;
    y: number;
    deviation: number;
    lookingAway: boolean;
  };
  mouth: {
    MAR: number;
    isYawning: boolean;
    yawnCount: number;
  };
  hands: {
    nearEar: boolean;
    nearFace: boolean;
    possibleTexting: boolean;
    phoneUsage: boolean;
  };
  drowsiness: {
    level: 'none' | 'mild' | 'moderate' | 'severe';
    indicators: string[];
  };
  distraction: {
    level: 'none' | 'mild' | 'moderate' | 'severe';
    indicators: string[];
  };
}

export interface AlertData {
  id: string;
  type: AlertType;
  severity: 'mild' | 'moderate' | 'severe';
  message: string;
  timestamp: Date;
  confidenceScore?: number;
  location?: Location;
  metadata?: any;
  sessionId: string;
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

// Session Types
export interface SessionData {
  id: string;
  driverId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  locationStart?: Location;
  locationEnd?: Location;
  distance?: number;
  deviceInfo: DeviceInfo;
  alerts: AlertData[];
  metrics: MetricData[];
  syncStatus: 'pending' | 'synced' | 'failed';
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

export interface MetricData {
  id: string;
  sessionId: string;
  type: MetricType;
  value: number;
  timestamp: Date;
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

// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'driver' | 'admin' | 'manager';
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

// App State Types
export interface AppState {
  user: Driver | null;
  isAuthenticated: boolean;
  currentSession: SessionData | null;
  isMonitoring: boolean;
  detectionConfig: DetectionConfig;
  calibrationData?: CalibrationData;
  networkStatus: 'online' | 'offline';
  syncQueue: SyncQueueItem[];
}

export interface CalibrationData {
  gazeCenter: number;
  headCenterX: number;
  headCenterY: number;
  timestamp: Date;
}

export interface SyncQueueItem {
  id: string;
  type: 'session' | 'alert' | 'metric';
  data: any;
  retryCount: number;
  lastAttempt?: Date;
}

// API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Driver;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Monitor: undefined;
  History: undefined;
  Settings: undefined;
  Calibration: undefined;
  Profile: undefined;
};

// Component Props Types
export interface MonitoringScreenProps {
  navigation: any;
}

export interface AlertDisplayProps {
  alerts: AlertData[];
  onDismiss: (alertId: string) => void;
}

export interface SessionStatsProps {
  session: SessionData;
  realTime?: boolean;
}

// Settings Types
export interface AppSettings {
  alertSounds: boolean;
  vibration: boolean;
  autoSync: boolean;
  cameraQuality: 'low' | 'medium' | 'high';
  detectionSensitivity: 'low' | 'medium' | 'high';
  locationTracking: boolean;
  backgroundMonitoring: boolean;
}

// Camera and ML Types
export interface FaceDetectionResult {
  landmarks: Landmark[];
  boundingBox: BoundingBox;
  confidence: number;
}

export interface HandDetectionResult {
  landmarks: Landmark[];
  boundingBox: BoundingBox;
  confidence: number;
  handedness: 'left' | 'right';
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraFrame {
  width: number;
  height: number;
  timestamp: number;
  data: ArrayBuffer;
}

// Database Types (SQLite)
export interface DatabaseSession {
  id: string;
  driver_id: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  location_start?: string;
  location_end?: string;
  trip_distance_km?: number;
  device_info: string;
  sync_status: string;
  created_at: string;
}

export interface DatabaseAlert {
  id: string;
  session_id: string;
  alert_type: string;
  severity: string;
  message: string;
  confidence_score?: number;
  timestamp: string;
  location?: string;
  metadata?: string;
  sync_status: string;
  created_at: string;
}

export interface DatabaseMetric {
  id: string;
  session_id: string;
  metric_type: string;
  value: number;
  timestamp: string;
  sync_status: string;
  created_at: string;
}