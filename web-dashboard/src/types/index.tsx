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

// Alert Types
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
  metadata?: any;
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
  driverName?: string;
}

export interface AlertStats {
  period: string;
  byTypeAndSeverity: Array<{
    alertType: AlertType;
    severity: 'mild' | 'moderate' | 'severe';
    count: number;
  }>;
  bySeverity: Array<{
    severity: 'mild' | 'moderate' | 'severe';
    total: number;
  }>;
  dailyTrends: Array<{
    date: string;
    totalAlerts: number;
    severeAlerts: number;
  }>;
}

export interface SessionStats {
  totalSessions: number;
  totalDrivingTime: number;
  totalDistance: number;
  averageSessionDuration: number;
  period: string;
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

// Query Types
export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AlertsQuery extends DateRangeQuery {
  driverId?: string;
  sessionId?: string;
  alertType?: AlertType;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface SessionsQuery extends DateRangeQuery {
  driverId?: string;
}

// Dashboard Types
export interface DashboardMetrics {
  totalDrivers: number;
  activeSessions: number;
  totalAlerts: number;
  severeAlerts: number;
  avgSessionDuration: number;
  totalDistance: number;
}

export interface RecentActivity {
  id: string;
  type: 'session_started' | 'session_ended' | 'alert_severe' | 'driver_registered';
  message: string;
  timestamp: Date;
  driverId?: string;
  driverName?: string;
}

// Chart Data Types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface DateRangeForm {
  startDate: string;
  endDate: string;
}

export interface FilterForm {
  driverId?: string;
  alertType?: AlertType;
  severity?: 'mild' | 'moderate' | 'severe';
  dateRange: DateRangeForm;
}

// Table Types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
}

// Component Props
export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<any>;
  current?: boolean;
  children?: NavItem[];
}

// Error Types
export interface ErrorInfo {
  message: string;
  code?: string | number;
  details?: any;
}

// Loading States
export interface LoadingState {
  loading: boolean;
  error?: ErrorInfo;
}

// Export utility type
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;