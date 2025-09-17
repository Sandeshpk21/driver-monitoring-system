import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Session,
  Alert,
  AlertStats,
  SessionStats,
  DriverStatistics,
  AlertTrend,
  LoginForm
} from '../types';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          // Only redirect if not already on login page
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    return Cookies.get('auth_token') || null;
  }

  private setToken(token: string): void {
    Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'strict' });
  }

  private clearToken(): void {
    Cookies.remove('auth_token');
  }

  // Authentication
  async login(credentials: LoginForm): Promise<{ user: User; token: string; refreshToken: string }> {
    const response = await this.client.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>(
      '/api/v1/auth/login',
      credentials
    );

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
      return response.data.data;
    }

    throw new Error(response.data.message || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/v1/auth/logout');
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<ApiResponse<User>>('/api/v1/auth/me');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get user data');
  }

  // Sessions
  async getSessions(params: {
    driverId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Session>> {
    const response = await this.client.get<PaginatedResponse<Session>>('/api/v1/sessions', { params });
    return response.data;
  }

  async getSession(id: string): Promise<Session> {
    const response = await this.client.get<ApiResponse<Session>>(`/api/v1/sessions/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get session');
  }

  async getSessionStats(params: {
    driverId?: string;
    days?: number;
  } = {}): Promise<SessionStats> {
    const response = await this.client.get<ApiResponse<SessionStats>>('/api/v1/sessions/stats', { params });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get session stats');
  }

  // Alerts
  async getAlerts(params: {
    driverId?: string;
    sessionId?: string;
    alertType?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<Alert>> {
    const response = await this.client.get<PaginatedResponse<Alert>>('/api/v1/alerts', { params });
    return response.data;
  }

  async getAlert(id: string): Promise<Alert> {
    const response = await this.client.get<ApiResponse<Alert>>(`/api/v1/alerts/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get alert');
  }

  async getAlertStats(params: {
    driverId?: string;
    days?: number;
  } = {}): Promise<AlertStats> {
    const response = await this.client.get<ApiResponse<AlertStats>>('/api/v1/alerts/stats', { params });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get alert stats');
  }

  async getAlertTrends(params: {
    driverId?: string;
    days?: number;
  } = {}): Promise<AlertTrend[]> {
    const response = await this.client.get<ApiResponse<AlertTrend[]>>('/api/v1/alerts/trends', { params });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get alert trends');
  }

  // Analytics
  async getDriverStatistics(): Promise<DriverStatistics[]> {
    const response = await this.client.get<ApiResponse<DriverStatistics[]>>('/api/v1/analytics/drivers');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get driver statistics');
  }

  async getDashboardMetrics(): Promise<{
    totalDrivers: number;
    activeSessions: number;
    totalAlerts: number;
    severeAlerts: number;
    avgSessionDuration: number;
    totalDistance: number;
  }> {
    // This would be implemented as a dashboard endpoint in the backend
    // For now, we'll aggregate from existing endpoints
    const [sessionStats, alertStats] = await Promise.all([
      this.getSessionStats({ days: 30 }),
      this.getAlertStats({ days: 30 }),
    ]);

    const severeAlerts = alertStats.bySeverity.find(s => s.severity === 'severe')?.total || 0;
    const totalAlerts = alertStats.bySeverity.reduce((sum, s) => sum + s.total, 0);

    return {
      totalDrivers: 0, // Would need a separate endpoint
      activeSessions: 0, // Would need a separate endpoint
      totalAlerts,
      severeAlerts,
      avgSessionDuration: sessionStats.averageSessionDuration,
      totalDistance: sessionStats.totalDistance,
    };
  }

  // Sync
  async getSyncStatus(driverId?: string): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingSessions: number;
    pendingAlerts: number;
    pendingMetrics: number;
    lastSyncAttempt?: Date;
  }> {
    const params = driverId ? { driverId } : {};
    const response = await this.client.get('/api/v1/sync/status', { params });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.message || 'Failed to get sync status');
  }

  // Utility methods
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.success === true;
    } catch {
      return false;
    }
  }

  // Generic request method for custom endpoints
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;