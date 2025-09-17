import * as SQLite from 'expo-sqlite';
import { DatabaseSession, DatabaseAlert, DatabaseMetric, SessionData, AlertData, MetricData } from '@/types';

class DatabaseManager {
  private db: SQLite.WebSQLDatabase;

  constructor() {
    this.db = SQLite.openDatabase('driver_monitoring.db');
    this.initializeTables();
  }

  private initializeTables() {
    this.db.transaction(tx => {
      // Sessions table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          driver_id TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_seconds INTEGER,
          location_start TEXT,
          location_end TEXT,
          trip_distance_km REAL,
          device_info TEXT,
          sync_status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Alerts table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS alerts (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT NOT NULL,
          confidence_score REAL,
          timestamp TEXT NOT NULL,
          location TEXT,
          metadata TEXT,
          sync_status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      // Detection metrics table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS detection_metrics (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          metric_type TEXT NOT NULL,
          value REAL NOT NULL,
          timestamp TEXT NOT NULL,
          sync_status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions (id)
        )
      `);

      // User settings table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Calibration data table
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS calibration_data (
          id INTEGER PRIMARY KEY,
          gaze_center REAL NOT NULL,
          head_center_x REAL NOT NULL,
          head_center_y REAL NOT NULL,
          timestamp TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Create indexes for better performance
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_sessions_driver_id ON sessions (driver_id)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions (start_time)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_alerts_session_id ON alerts (session_id)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts (timestamp)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON detection_metrics (session_id)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_sync_status ON sessions (sync_status)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_alerts_sync_status ON alerts (sync_status)');
      tx.executeSql('CREATE INDEX IF NOT EXISTS idx_metrics_sync_status ON detection_metrics (sync_status)');
    });
  }

  // Session operations
  async createSession(session: Omit<DatabaseSession, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO sessions (id, driver_id, start_time, location_start, device_info, sync_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            session.id,
            session.driver_id,
            session.start_time,
            session.location_start || null,
            session.device_info,
            session.sync_status
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateSession(sessionId: string, updates: Partial<DatabaseSession>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE sessions SET ${fields} WHERE id = ?`,
          [...values, sessionId],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getSession(sessionId: string): Promise<DatabaseSession | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM sessions WHERE id = ?',
          [sessionId],
          (_, { rows }) => {
            resolve(rows.length > 0 ? rows._array[0] : null);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getSessions(driverId: string, limit: number = 50): Promise<DatabaseSession[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM sessions WHERE driver_id = ? ORDER BY start_time DESC LIMIT ?',
          [driverId, limit],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUnsynced

Sessions(): Promise<DatabaseSession[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM sessions WHERE sync_status = ? ORDER BY start_time ASC',
          ['pending'],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Alert operations
  async createAlert(alert: Omit<DatabaseAlert, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO alerts (id, session_id, alert_type, severity, message, confidence_score, timestamp, location, metadata, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            alert.id,
            alert.session_id,
            alert.alert_type,
            alert.severity,
            alert.message,
            alert.confidence_score || null,
            alert.timestamp,
            alert.location || null,
            alert.metadata || null,
            alert.sync_status
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAlerts(sessionId: string): Promise<DatabaseAlert[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM alerts WHERE session_id = ? ORDER BY timestamp DESC',
          [sessionId],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUnsyncedAlerts(): Promise<DatabaseAlert[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM alerts WHERE sync_status = ? ORDER BY timestamp ASC',
          ['pending'],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Metrics operations
  async createMetric(metric: Omit<DatabaseMetric, 'created_at'>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO detection_metrics (id, session_id, metric_type, value, timestamp, sync_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            metric.id,
            metric.session_id,
            metric.metric_type,
            metric.value,
            metric.timestamp,
            metric.sync_status
          ],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getMetrics(sessionId: string): Promise<DatabaseMetric[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM detection_metrics WHERE session_id = ? ORDER BY timestamp ASC',
          [sessionId],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUnsyncedMetrics(): Promise<DatabaseMetric[]> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM detection_metrics WHERE sync_status = ? ORDER BY timestamp ASC',
          ['pending'],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Settings operations
  async setSetting(key: string, value: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `INSERT OR REPLACE INTO user_settings (key, value, updated_at)
           VALUES (?, ?, CURRENT_TIMESTAMP)`,
          [key, value],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getSetting(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT value FROM user_settings WHERE key = ?',
          [key],
          (_, { rows }) => {
            resolve(rows.length > 0 ? rows._array[0].value : null);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Calibration operations
  async saveCalibration(gazeCenter: number, headCenterX: number, headCenterY: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Deactivate previous calibrations
        tx.executeSql('UPDATE calibration_data SET is_active = 0');

        // Insert new calibration
        tx.executeSql(
          `INSERT INTO calibration_data (gaze_center, head_center_x, head_center_y, timestamp, is_active)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)`,
          [gazeCenter, headCenterX, headCenterY],
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getActiveCalibration(): Promise<{ gazeCenter: number; headCenterX: number; headCenterY: number; timestamp: string } | null> {
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM calibration_data WHERE is_active = 1 ORDER BY timestamp DESC LIMIT 1',
          [],
          (_, { rows }) => {
            if (rows.length > 0) {
              const row = rows._array[0];
              resolve({
                gazeCenter: row.gaze_center,
                headCenterX: row.head_center_x,
                headCenterY: row.head_center_y,
                timestamp: row.timestamp
              });
            } else {
              resolve(null);
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Bulk sync status updates
  async markSessionsSynced(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) return;

    const placeholders = sessionIds.map(() => '?').join(',');
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE sessions SET sync_status = 'synced' WHERE id IN (${placeholders})`,
          sessionIds,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async markAlertsSynced(alertIds: string[]): Promise<void> {
    if (alertIds.length === 0) return;

    const placeholders = alertIds.map(() => '?').join(',');
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE alerts SET sync_status = 'synced' WHERE id IN (${placeholders})`,
          alertIds,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async markMetricsSynced(metricIds: string[]): Promise<void> {
    if (metricIds.length === 0) return;

    const placeholders = metricIds.map(() => '?').join(',');
    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `UPDATE detection_metrics SET sync_status = 'synced' WHERE id IN (${placeholders})`,
          metricIds,
          () => resolve(),
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Statistics and analytics
  async getSessionStats(driverId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT
             COUNT(*) as total_sessions,
             SUM(duration_seconds) as total_driving_time,
             SUM(trip_distance_km) as total_distance,
             AVG(duration_seconds) as avg_session_duration
           FROM sessions
           WHERE driver_id = ? AND start_time >= ?`,
          [driverId, since.toISOString()],
          (_, { rows }) => {
            resolve(rows._array[0]);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAlertStats(driverId: string, days: number = 30): Promise<any> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        tx.executeSql(
          `SELECT
             alert_type,
             severity,
             COUNT(*) as count
           FROM alerts a
           JOIN sessions s ON a.session_id = s.id
           WHERE s.driver_id = ? AND a.timestamp >= ?
           GROUP BY alert_type, severity
           ORDER BY count DESC`,
          [driverId, since.toISOString()],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  // Cleanup operations
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return new Promise((resolve, reject) => {
      this.db.transaction(tx => {
        // Delete old synced data
        tx.executeSql(
          `DELETE FROM sessions
           WHERE sync_status = 'synced' AND start_time < ?`,
          [cutoffDate.toISOString()]
        );

        tx.executeSql(
          `DELETE FROM alerts
           WHERE sync_status = 'synced' AND timestamp < ?`,
          [cutoffDate.toISOString()]
        );

        tx.executeSql(
          `DELETE FROM detection_metrics
           WHERE sync_status = 'synced' AND timestamp < ?`,
          [cutoffDate.toISOString()]
        );
      },
      error => reject(error),
      () => resolve()
      );
    });
  }
}

export const db = new DatabaseManager();
export default db;