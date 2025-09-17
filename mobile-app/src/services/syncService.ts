import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { db } from '@/utils/database';
import { ApiResponse, SessionData, AlertData, MetricData } from '@/types';

export interface SyncConfig {
  maxRetries: number;
  retryInterval: number;
  batchSize: number;
  autoSyncEnabled: boolean;
  syncOnlyOnWifi: boolean;
}

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryInterval: 30000, // 30 seconds
  batchSize: 50,
  autoSyncEnabled: true,
  syncOnlyOnWifi: false,
};

export class SyncService {
  private config: SyncConfig;
  private isOnline: boolean = false;
  private isSyncing: boolean = false;
  private syncTimer?: NodeJS.Timeout;
  private apiBaseUrl: string;
  private authToken?: string;

  constructor(apiBaseUrl: string, config?: Partial<SyncConfig>) {
    this.apiBaseUrl = apiBaseUrl;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.initializeNetworkListener();
    this.loadAuthToken();
  }

  private async loadAuthToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      this.authToken = token || undefined;
    } catch (error) {
      console.error('Failed to load auth token:', error);
    }
  }

  setAuthToken(token: string) {
    this.authToken = token;
    AsyncStorage.setItem('auth_token', token);
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected || false;

      if (!wasOnline && this.isOnline && this.config.autoSyncEnabled) {
        // Just came online, trigger sync
        this.startAutoSync();
      } else if (!this.isOnline) {
        // Went offline, stop auto sync
        this.stopAutoSync();
      }
    });
  }

  updateConfig(config: Partial<SyncConfig>) {
    this.config = { ...this.config, ...config };

    if (this.config.autoSyncEnabled && this.isOnline) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  private startAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncPendingData().catch(error => {
          console.error('Auto sync failed:', error);
        });
      }
    }, this.config.retryInterval);

    // Trigger immediate sync
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingData().catch(error => {
        console.error('Initial sync failed:', error);
      });
    }
  }

  private stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  async syncPendingData(): Promise<{ success: boolean; synced: number; failed: number; errors: string[] }> {
    if (!this.isOnline || this.isSyncing || !this.authToken) {
      return { success: false, synced: 0, failed: 0, errors: ['Not online, already syncing, or not authenticated'] };
    }

    this.isSyncing = true;

    const results = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Sync sessions first
      const sessionResult = await this.syncSessions();
      results.synced += sessionResult.synced;
      results.failed += sessionResult.failed;
      results.errors.push(...sessionResult.errors);

      // Then sync alerts
      const alertResult = await this.syncAlerts();
      results.synced += alertResult.synced;
      results.failed += alertResult.failed;
      results.errors.push(...alertResult.errors);

      // Finally sync metrics
      const metricResult = await this.syncMetrics();
      results.synced += metricResult.synced;
      results.failed += metricResult.failed;
      results.errors.push(...metricResult.errors);

      results.success = results.failed === 0;

    } catch (error) {
      results.success = false;
      results.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  private async syncSessions(): Promise<{ synced: number; failed: number; errors: string[] }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] };

    try {
      const unsyncedSessions = await db.getUnsyncedSessions();

      if (unsyncedSessions.length === 0) {
        return result;
      }

      const batches = this.createBatches(unsyncedSessions, this.config.batchSize);

      for (const batch of batches) {
        try {
          const response = await this.uploadSessions(batch);

          if (response.success) {
            // Mark sessions as synced
            const sessionIds = batch.map(s => s.id);
            await db.markSessionsSynced(sessionIds);
            result.synced += batch.length;
          } else {
            result.failed += batch.length;
            result.errors.push(`Session batch upload failed: ${response.message}`);
          }
        } catch (error) {
          result.failed += batch.length;
          result.errors.push(`Session batch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Session sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async syncAlerts(): Promise<{ synced: number; failed: number; errors: string[] }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] };

    try {
      const unsyncedAlerts = await db.getUnsyncedAlerts();

      if (unsyncedAlerts.length === 0) {
        return result;
      }

      const batches = this.createBatches(unsyncedAlerts, this.config.batchSize);

      for (const batch of batches) {
        try {
          const response = await this.uploadAlerts(batch);

          if (response.success) {
            // Mark alerts as synced
            const alertIds = batch.map(a => a.id);
            await db.markAlertsSynced(alertIds);
            result.synced += batch.length;
          } else {
            result.failed += batch.length;
            result.errors.push(`Alert batch upload failed: ${response.message}`);
          }
        } catch (error) {
          result.failed += batch.length;
          result.errors.push(`Alert batch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Alert sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async syncMetrics(): Promise<{ synced: number; failed: number; errors: string[] }> {
    const result = { synced: 0, failed: 0, errors: [] as string[] };

    try {
      const unsyncedMetrics = await db.getUnsyncedMetrics();

      if (unsyncedMetrics.length === 0) {
        return result;
      }

      const batches = this.createBatches(unsyncedMetrics, this.config.batchSize);

      for (const batch of batches) {
        try {
          const response = await this.uploadMetrics(batch);

          if (response.success) {
            // Mark metrics as synced
            const metricIds = batch.map(m => m.id);
            await db.markMetricsSynced(metricIds);
            result.synced += batch.length;
          } else {
            result.failed += batch.length;
            result.errors.push(`Metric batch upload failed: ${response.message}`);
          }
        } catch (error) {
          result.failed += batch.length;
          result.errors.push(`Metric batch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Metric sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async uploadSessions(sessions: any[]): Promise<ApiResponse> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/sync/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ sessions }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private async uploadAlerts(alerts: any[]): Promise<ApiResponse> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/sync/alerts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ alerts }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private async uploadMetrics(metrics: any[]): Promise<ApiResponse> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/sync/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ metrics }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  // Manual sync trigger
  async forcSync(): Promise<{ success: boolean; synced: number; failed: number; errors: string[] }> {
    return await this.syncPendingData();
  }

  // Download latest data from server
  async downloadUpdates(lastSyncTimestamp?: Date): Promise<{
    sessions: SessionData[];
    alerts: AlertData[];
    metrics: MetricData[];
    success: boolean;
    error?: string;
  }> {
    if (!this.isOnline || !this.authToken) {
      return {
        sessions: [],
        alerts: [],
        metrics: [],
        success: false,
        error: 'Not online or not authenticated',
      };
    }

    try {
      const queryParams = new URLSearchParams();
      if (lastSyncTimestamp) {
        queryParams.append('since', lastSyncTimestamp.toISOString());
      }

      const response = await fetch(`${this.apiBaseUrl}/api/v1/sync/download?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        sessions: data.sessions || [],
        alerts: data.alerts || [],
        metrics: data.metrics || [],
        success: true,
      };
    } catch (error) {
      return {
        sessions: [],
        alerts: [],
        metrics: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingSessions: number;
    pendingAlerts: number;
    pendingMetrics: number;
    lastSyncAttempt?: Date;
  }> {
    const [unsyncedSessions, unsyncedAlerts, unsyncedMetrics] = await Promise.all([
      db.getUnsyncedSessions(),
      db.getUnsyncedAlerts(),
      db.getUnsyncedMetrics(),
    ]);

    const lastSyncTimestamp = await AsyncStorage.getItem('last_sync_attempt');

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingSessions: unsyncedSessions.length,
      pendingAlerts: unsyncedAlerts.length,
      pendingMetrics: unsyncedMetrics.length,
      lastSyncAttempt: lastSyncTimestamp ? new Date(lastSyncTimestamp) : undefined,
    };
  }

  // Clean up old synced data
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    await db.cleanupOldData(daysToKeep);
  }

  cleanup() {
    this.stopAutoSync();
  }
}

// Global sync service instance
let syncServiceInstance: SyncService | null = null;

export const getSyncService = (apiBaseUrl?: string, config?: Partial<SyncConfig>): SyncService => {
  if (!syncServiceInstance && apiBaseUrl) {
    syncServiceInstance = new SyncService(apiBaseUrl, config);
  }

  if (!syncServiceInstance) {
    throw new Error('SyncService not initialized. Call getSyncService with apiBaseUrl first.');
  }

  return syncServiceInstance;
};

export default SyncService;