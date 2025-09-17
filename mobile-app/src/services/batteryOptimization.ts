import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BatteryOptimizationConfig {
  lowBatteryThreshold: number;
  criticalBatteryThreshold: number;
  adaptiveFrameRate: boolean;
  reducedProcessingMode: boolean;
  autoStopOnLowBattery: boolean;
}

const DEFAULT_CONFIG: BatteryOptimizationConfig = {
  lowBatteryThreshold: 0.2,       // 20%
  criticalBatteryThreshold: 0.1,  // 10%
  adaptiveFrameRate: true,
  reducedProcessingMode: true,
  autoStopOnLowBattery: false,
};

export class BatteryOptimizationService {
  private config: BatteryOptimizationConfig;
  private currentBatteryLevel: number = 1;
  private isCharging: boolean = false;
  private batteryStateListener: Battery.Subscription | null = null;

  constructor(config?: Partial<BatteryOptimizationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initialize();
  }

  private async initialize() {
    // Get initial battery state
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();

    this.currentBatteryLevel = batteryLevel;
    this.isCharging = batteryState === Battery.BatteryState.CHARGING;

    // Listen for battery state changes
    this.batteryStateListener = Battery.addBatteryStateListener((batteryState) => {
      this.handleBatteryStateChange(batteryState);
    });

    // Load saved configuration
    await this.loadConfig();
  }

  private async loadConfig() {
    try {
      const savedConfig = await AsyncStorage.getItem('battery_optimization_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.error('Error loading battery optimization config:', error);
    }
  }

  private async saveConfig() {
    try {
      await AsyncStorage.setItem('battery_optimization_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving battery optimization config:', error);
    }
  }

  private handleBatteryStateChange(batteryState: Battery.BatteryState) {
    this.isCharging = batteryState === Battery.BatteryState.CHARGING;

    // Update battery level
    Battery.getBatteryLevelAsync().then(level => {
      this.currentBatteryLevel = level;
    });
  }

  /**
   * Get recommended frame rate based on battery level
   */
  public getOptimizedFrameRate(): number {
    if (!this.config.adaptiveFrameRate || this.isCharging) {
      return 30; // Full performance when charging
    }

    if (this.currentBatteryLevel <= this.config.criticalBatteryThreshold) {
      return 10; // Minimum frame rate for critical battery
    }

    if (this.currentBatteryLevel <= this.config.lowBatteryThreshold) {
      return 15; // Reduced frame rate for low battery
    }

    // Normal operation
    return 30;
  }

  /**
   * Get frame skip count for processing optimization
   */
  public getFrameSkipCount(): number {
    if (!this.config.reducedProcessingMode || this.isCharging) {
      return 0; // Process every frame when charging
    }

    if (this.currentBatteryLevel <= this.config.criticalBatteryThreshold) {
      return 4; // Process every 5th frame on critical battery
    }

    if (this.currentBatteryLevel <= this.config.lowBatteryThreshold) {
      return 2; // Process every 3rd frame on low battery
    }

    // Normal operation
    return 1; // Process every 2nd frame
  }

  /**
   * Get processing quality level
   */
  public getProcessingQuality(): 'high' | 'medium' | 'low' {
    if (this.isCharging) {
      return 'high';
    }

    if (this.currentBatteryLevel <= this.config.criticalBatteryThreshold) {
      return 'low';
    }

    if (this.currentBatteryLevel <= this.config.lowBatteryThreshold) {
      return 'medium';
    }

    return 'high';
  }

  /**
   * Check if monitoring should be stopped due to low battery
   */
  public shouldStopMonitoring(): boolean {
    return this.config.autoStopOnLowBattery &&
           this.currentBatteryLevel <= this.config.criticalBatteryThreshold &&
           !this.isCharging;
  }

  /**
   * Get battery optimization recommendations
   */
  public getOptimizationRecommendations(): {
    message: string;
    severity: 'info' | 'warning' | 'critical';
    recommendations: string[];
  } | null {
    if (this.isCharging) {
      return null; // No recommendations when charging
    }

    if (this.currentBatteryLevel <= this.config.criticalBatteryThreshold) {
      return {
        message: 'Critical battery level detected',
        severity: 'critical',
        recommendations: [
          'Consider stopping monitoring to save battery',
          'Connect charger to continue monitoring',
          'Processing quality reduced to minimum',
        ],
      };
    }

    if (this.currentBatteryLevel <= this.config.lowBatteryThreshold) {
      return {
        message: 'Low battery level detected',
        severity: 'warning',
        recommendations: [
          'Frame rate reduced for battery optimization',
          'Consider connecting charger for better performance',
          'Some features may be limited',
        ],
      };
    }

    return null;
  }

  /**
   * Get current battery status
   */
  public getBatteryStatus(): {
    level: number;
    isCharging: boolean;
    optimizationActive: boolean;
    currentFrameRate: number;
    processingQuality: 'high' | 'medium' | 'low';
  } {
    return {
      level: this.currentBatteryLevel,
      isCharging: this.isCharging,
      optimizationActive: !this.isCharging && this.currentBatteryLevel <= this.config.lowBatteryThreshold,
      currentFrameRate: this.getOptimizedFrameRate(),
      processingQuality: this.getProcessingQuality(),
    };
  }

  /**
   * Update configuration
   */
  public async updateConfig(config: Partial<BatteryOptimizationConfig>) {
    this.config = { ...this.config, ...config };
    await this.saveConfig();
  }

  /**
   * Cleanup
   */
  public cleanup() {
    if (this.batteryStateListener) {
      this.batteryStateListener.remove();
      this.batteryStateListener = null;
    }
  }
}

// Singleton instance
let batteryOptimizationInstance: BatteryOptimizationService | null = null;

export const getBatteryOptimization = (config?: Partial<BatteryOptimizationConfig>): BatteryOptimizationService => {
  if (!batteryOptimizationInstance) {
    batteryOptimizationInstance = new BatteryOptimizationService(config);
  }
  return batteryOptimizationInstance;
};

export default BatteryOptimizationService;