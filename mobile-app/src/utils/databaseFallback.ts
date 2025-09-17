// Fallback in-memory database for when SQLite is not available (e.g., Expo Go)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DatabaseSession, DatabaseAlert, DatabaseMetric } from '@/types';

class InMemoryDatabase {
  private sessions: Map<string, DatabaseSession> = new Map();
  private alerts: Map<string, DatabaseAlert[]> = new Map();
  private metrics: Map<string, DatabaseMetric[]> = new Map();
  private settings: Map<string, string> = new Map();
  private calibration: any = null;

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const sessionsData = await AsyncStorage.getItem('sessions_fallback');
      const alertsData = await AsyncStorage.getItem('alerts_fallback');
      const settingsData = await AsyncStorage.getItem('settings_fallback');

      if (sessionsData) {
        const sessions = JSON.parse(sessionsData);
        sessions.forEach((s: DatabaseSession) => this.sessions.set(s.id, s));
      }

      if (alertsData) {
        const alerts = JSON.parse(alertsData);
        Object.entries(alerts).forEach(([sessionId, sessionAlerts]) => {
          this.alerts.set(sessionId, sessionAlerts as DatabaseAlert[]);
        });
      }

      if (settingsData) {
        const settings = JSON.parse(settingsData);
        Object.entries(settings).forEach(([key, value]) => {
          this.settings.set(key, value as string);
        });
      }
    } catch (error) {
      console.log('No previous data in fallback storage');
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem(
        'sessions_fallback',
        JSON.stringify(Array.from(this.sessions.values()))
      );

      const alertsObj: any = {};
      this.alerts.forEach((value, key) => {
        alertsObj[key] = value;
      });
      await AsyncStorage.setItem('alerts_fallback', JSON.stringify(alertsObj));

      const settingsObj: any = {};
      this.settings.forEach((value, key) => {
        settingsObj[key] = value;
      });
      await AsyncStorage.setItem('settings_fallback', JSON.stringify(settingsObj));
    } catch (error) {
      console.error('Error saving to fallback storage:', error);
    }
  }

  async createSession(session: Omit<DatabaseSession, 'created_at'>): Promise<void> {
    this.sessions.set(session.id, {
      ...session,
      created_at: new Date().toISOString(),
    } as DatabaseSession);
    await this.saveToStorage();
  }

  async updateSession(sessionId: string, updates: Partial<DatabaseSession>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.set(sessionId, { ...session, ...updates });
      await this.saveToStorage();
    }
  }

  async getSession(sessionId: string): Promise<DatabaseSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getSessions(driverId: string, limit: number = 50): Promise<DatabaseSession[]> {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.driver_id === driverId)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, limit);
    return sessions;
  }

  async getUnsyncedSessions(): Promise<DatabaseSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.sync_status === 'pending');
  }

  async createAlert(alert: Omit<DatabaseAlert, 'created_at'>): Promise<void> {
    const sessionAlerts = this.alerts.get(alert.session_id) || [];
    sessionAlerts.push({
      ...alert,
      created_at: new Date().toISOString(),
    } as DatabaseAlert);
    this.alerts.set(alert.session_id, sessionAlerts);
    await this.saveToStorage();
  }

  async getAlerts(sessionId: string): Promise<DatabaseAlert[]> {
    return this.alerts.get(sessionId) || [];
  }

  async getUnsyncedAlerts(): Promise<DatabaseAlert[]> {
    const allAlerts: DatabaseAlert[] = [];
    this.alerts.forEach(alerts => {
      allAlerts.push(...alerts.filter(a => a.sync_status === 'pending'));
    });
    return allAlerts;
  }

  async createMetric(metric: Omit<DatabaseMetric, 'created_at'>): Promise<void> {
    const sessionMetrics = this.metrics.get(metric.session_id) || [];
    sessionMetrics.push({
      ...metric,
      created_at: new Date().toISOString(),
    } as DatabaseMetric);
    this.metrics.set(metric.session_id, sessionMetrics);
  }

  async getMetrics(sessionId: string): Promise<DatabaseMetric[]> {
    return this.metrics.get(sessionId) || [];
  }

  async getUnsyncedMetrics(): Promise<DatabaseMetric[]> {
    const allMetrics: DatabaseMetric[] = [];
    this.metrics.forEach(metrics => {
      allMetrics.push(...metrics.filter(m => m.sync_status === 'pending'));
    });
    return allMetrics;
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.settings.set(key, value);
    await this.saveToStorage();
  }

  async getSetting(key: string): Promise<string | null> {
    return this.settings.get(key) || null;
  }

  async saveCalibration(gazeCenter: number, headCenterX: number, headCenterY: number): Promise<void> {
    this.calibration = { gazeCenter, headCenterX, headCenterY, timestamp: new Date().toISOString() };
  }

  async getActiveCalibration(): Promise<any> {
    return this.calibration;
  }

  async markSessionsSynced(sessionIds: string[]): Promise<void> {
    sessionIds.forEach(id => {
      const session = this.sessions.get(id);
      if (session) {
        session.sync_status = 'synced';
      }
    });
    await this.saveToStorage();
  }

  async markAlertsSynced(alertIds: string[]): Promise<void> {
    this.alerts.forEach(alerts => {
      alerts.forEach(alert => {
        if (alertIds.includes(alert.id)) {
          alert.sync_status = 'synced';
        }
      });
    });
    await this.saveToStorage();
  }

  async markMetricsSynced(metricIds: string[]): Promise<void> {
    this.metrics.forEach(metrics => {
      metrics.forEach(metric => {
        if (metricIds.includes(metric.id)) {
          metric.sync_status = 'synced';
        }
      });
    });
  }

  async getSessionStats(driverId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = Array.from(this.sessions.values()).filter(
      s => s.driver_id === driverId && new Date(s.start_time) >= since
    );

    return {
      total_sessions: sessions.length,
      total_driving_time: sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
      total_distance: sessions.reduce((sum, s) => sum + (s.trip_distance_km || 0), 0),
      avg_session_duration: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length
        : 0,
    };
  }

  async getAlertStats(driverId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sessions = Array.from(this.sessions.values()).filter(
      s => s.driver_id === driverId && new Date(s.start_time) >= since
    );

    const alertsByType: any = {};
    sessions.forEach(session => {
      const sessionAlerts = this.alerts.get(session.id) || [];
      sessionAlerts.forEach(alert => {
        const key = `${alert.alert_type}_${alert.severity}`;
        if (!alertsByType[key]) {
          alertsByType[key] = {
            alert_type: alert.alert_type,
            severity: alert.severity,
            count: 0,
          };
        }
        alertsByType[key].count++;
      });
    });

    return Object.values(alertsByType);
  }

  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Remove old synced sessions
    this.sessions.forEach((session, id) => {
      if (session.sync_status === 'synced' && new Date(session.start_time) < cutoffDate) {
        this.sessions.delete(id);
        this.alerts.delete(id);
        this.metrics.delete(id);
      }
    });

    await this.saveToStorage();
  }
}

export default InMemoryDatabase;