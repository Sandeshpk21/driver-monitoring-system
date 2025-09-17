import { DatabaseSession, DatabaseAlert, DatabaseMetric, SessionData, AlertData, MetricData } from '@/types';
import InMemoryDatabase from './databaseFallback';

class DatabaseManager {
  private fallbackDb: InMemoryDatabase;

  constructor() {
    // Use in-memory database as fallback for Expo Go
    this.fallbackDb = new InMemoryDatabase();
    console.log('Using in-memory database fallback for Expo Go');
  }


  // Session operations
  async createSession(session: Omit<DatabaseSession, 'created_at'>): Promise<void> {
    return this.fallbackDb.createSession(session);
  }

  async updateSession(sessionId: string, updates: Partial<DatabaseSession>): Promise<void> {
    return this.fallbackDb.updateSession(sessionId, updates);
  }

  async getSession(sessionId: string): Promise<DatabaseSession | null> {
    return this.fallbackDb.getSession(sessionId);
  }

  async getSessions(driverId: string, limit: number = 50): Promise<DatabaseSession[]> {
    return this.fallbackDb.getSessions(driverId, limit);
  }

  async getUnsyncedSessions(): Promise<DatabaseSession[]> {
    return this.fallbackDb.getUnsyncedSessions();
  }

  // Alert operations
  async createAlert(alert: Omit<DatabaseAlert, 'created_at'>): Promise<void> {
    return this.fallbackDb.createAlert(alert);
  }

  async getAlerts(sessionId: string): Promise<DatabaseAlert[]> {
    return this.fallbackDb.getAlerts(sessionId);
  }

  async getUnsyncedAlerts(): Promise<DatabaseAlert[]> {
    return this.fallbackDb.getUnsyncedAlerts();
  }

  // Metrics operations
  async createMetric(metric: Omit<DatabaseMetric, 'created_at'>): Promise<void> {
    return this.fallbackDb.createMetric(metric);
  }

  async getMetrics(sessionId: string): Promise<DatabaseMetric[]> {
    return this.fallbackDb.getMetrics(sessionId);
  }

  async getUnsyncedMetrics(): Promise<DatabaseMetric[]> {
    return this.fallbackDb.getUnsyncedMetrics();
  }

  // Settings operations
  async setSetting(key: string, value: string): Promise<void> {
    return this.fallbackDb.setSetting(key, value);
  }

  async getSetting(key: string): Promise<string | null> {
    return this.fallbackDb.getSetting(key);
  }

  // Calibration operations
  async saveCalibration(gazeCenter: number, headCenterX: number, headCenterY: number): Promise<void> {
    return this.fallbackDb.saveCalibration(gazeCenter, headCenterX, headCenterY);
  }

  async getActiveCalibration(): Promise<{ gazeCenter: number; headCenterX: number; headCenterY: number; timestamp: string } | null> {
    return this.fallbackDb.getActiveCalibration();
  }

  // Bulk sync status updates
  async markSessionsSynced(sessionIds: string[]): Promise<void> {
    return this.fallbackDb.markSessionsSynced(sessionIds);
  }

  async markAlertsSynced(alertIds: string[]): Promise<void> {
    return this.fallbackDb.markAlertsSynced(alertIds);
  }

  async markMetricsSynced(metricIds: string[]): Promise<void> {
    return this.fallbackDb.markMetricsSynced(metricIds);
  }

  // Statistics and analytics
  async getSessionStats(driverId: string, days: number = 30): Promise<any> {
    return this.fallbackDb.getSessionStats(driverId, days);
  }

  async getAlertStats(driverId: string, days: number = 30): Promise<any> {
    return this.fallbackDb.getAlertStats(driverId, days);
  }

  // Cleanup operations
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    return this.fallbackDb.cleanupOldData(daysToKeep);
  }
}

export const db = new DatabaseManager();
export default db;