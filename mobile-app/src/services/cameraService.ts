import { Camera, useCameraDevices, useCameraFormat } from 'react-native-vision-camera';
import { runOnJS, runOnUI } from 'react-native-reanimated';

export interface CameraFrame {
  width: number;
  height: number;
  timestamp: number;
  pixelFormat: string;
  buffer: ArrayBuffer;
}

export interface CameraServiceConfig {
  targetFps: number;
  format: 'yuv' | 'rgb';
  enableAudioRecording: boolean;
  videoStabilizationMode: 'off' | 'standard' | 'cinematic';
  enableZoomGesture: boolean;
}

const DEFAULT_CONFIG: CameraServiceConfig = {
  targetFps: 30,
  format: 'yuv',
  enableAudioRecording: false,
  videoStabilizationMode: 'standard',
  enableZoomGesture: false,
};

export class CameraService {
  private camera: React.RefObject<Camera>;
  private config: CameraServiceConfig;
  private isRecording: boolean = false;
  private frameProcessor?: (frame: CameraFrame) => void;
  private lastProcessedTimestamp: number = 0;
  private processingInterval: number = 100; // Process every 100ms (10 FPS)

  constructor(cameraRef: React.RefObject<Camera>, config?: Partial<CameraServiceConfig>) {
    this.camera = cameraRef;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setFrameProcessor(processor: (frame: CameraFrame) => void) {
    this.frameProcessor = processor;
  }

  setProcessingInterval(intervalMs: number) {
    this.processingInterval = intervalMs;
  }

  updateConfig(config: Partial<CameraServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await Camera.requestCameraPermission();

      if (cameraPermission === 'denied') {
        throw new Error('Camera permission denied');
      }

      return true;
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  getBestCameraDevice() {
    const devices = useCameraDevices();

    // Prefer front camera for driver monitoring
    if (devices.front) {
      return devices.front;
    }

    // Fallback to back camera
    if (devices.back) {
      return devices.back;
    }

    throw new Error('No camera device available');
  }

  getBestFormat(device: any) {
    const format = useCameraFormat(device, [
      { fps: this.config.targetFps },
      { videoResolution: { width: 1280, height: 720 } }, // HD resolution
      { pixelFormat: this.config.format },
    ]);

    return format;
  }

  // Frame processor for real-time detection
  private createFrameProcessor() {
    'worklet';

    return (frame: any) => {
      'worklet';

      const currentTime = Date.now();

      // Throttle processing to avoid overwhelming the detection engine
      if (currentTime - this.lastProcessedTimestamp < this.processingInterval) {
        return;
      }

      this.lastProcessedTimestamp = currentTime;

      try {
        // Convert frame to processable format
        const cameraFrame: CameraFrame = {
          width: frame.width,
          height: frame.height,
          timestamp: currentTime,
          pixelFormat: frame.pixelFormat,
          buffer: frame.buffer || new ArrayBuffer(0), // Simplified for demo
        };

        // Run frame processing on JS thread
        if (this.frameProcessor) {
          runOnJS(this.frameProcessor)(cameraFrame);
        }
      } catch (error) {
        console.error('Frame processing error:', error);
      }
    };
  }

  async startCamera(): Promise<boolean> {
    try {
      if (!this.camera.current) {
        throw new Error('Camera ref not available');
      }

      // Camera will start automatically when rendered
      return true;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return false;
    }
  }

  async stopCamera(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
    } catch (error) {
      console.error('Failed to stop camera:', error);
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      if (!this.camera.current || this.isRecording) {
        return false;
      }

      // For driver monitoring, we typically don't need video recording
      // but we can implement it for debugging purposes
      this.isRecording = true;
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.camera.current || !this.isRecording) {
        return null;
      }

      this.isRecording = false;
      return null; // Would return video path if actually recording
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  async takeSnapshot(): Promise<string | null> {
    try {
      if (!this.camera.current) {
        return null;
      }

      const photo = await this.camera.current.takePhoto({
        quality: 90,
        base64: false,
        enableShutterSound: false,
      });

      return photo.path;
    } catch (error) {
      console.error('Failed to take snapshot:', error);
      return null;
    }
  }

  async focusAt(x: number, y: number): Promise<void> {
    try {
      if (!this.camera.current) {
        return;
      }

      await this.camera.current.focus({ x, y });
    } catch (error) {
      console.error('Failed to focus camera:', error);
    }
  }

  async setZoom(factor: number): Promise<void> {
    try {
      if (!this.camera.current) {
        return;
      }

      // Clamp zoom factor between min and max
      const clampedFactor = Math.max(1, Math.min(factor, 10));

      // Note: Actual zoom implementation depends on react-native-vision-camera version
      // This is a placeholder for zoom functionality
      console.log(`Setting zoom to ${clampedFactor}`);
    } catch (error) {
      console.error('Failed to set zoom:', error);
    }
  }

  // Get camera capabilities
  async getCameraInfo() {
    try {
      const device = this.getBestCameraDevice();
      return {
        id: device.id,
        name: device.name,
        position: device.position,
        hasFlash: device.hasFlash,
        hasTorch: device.hasTorch,
        isMultiCam: device.isMultiCam,
        minZoom: device.minZoom,
        maxZoom: device.maxZoom,
        neutralZoom: device.neutralZoom,
        formats: device.formats?.length || 0,
      };
    } catch (error) {
      console.error('Failed to get camera info:', error);
      return null;
    }
  }

  // Enable/disable torch (flashlight)
  async setTorch(enabled: boolean): Promise<void> {
    try {
      if (!this.camera.current) {
        return;
      }

      // Note: Torch control implementation depends on react-native-vision-camera version
      console.log(`Setting torch: ${enabled}`);
    } catch (error) {
      console.error('Failed to set torch:', error);
    }
  }

  // Get camera status
  getStatus() {
    return {
      isRecording: this.isRecording,
      processingInterval: this.processingInterval,
      config: this.config,
    };
  }

  // Cleanup resources
  cleanup() {
    this.frameProcessor = undefined;
    this.isRecording = false;
  }
}

// Hook for using camera service
export const useCameraService = (cameraRef: React.RefObject<Camera>, config?: Partial<CameraServiceConfig>) => {
  const cameraService = new CameraService(cameraRef, config);

  const startMonitoring = async () => {
    const hasPermissions = await cameraService.requestPermissions();
    if (!hasPermissions) {
      throw new Error('Camera permissions required');
    }

    return await cameraService.startCamera();
  };

  const stopMonitoring = async () => {
    await cameraService.stopCamera();
    cameraService.cleanup();
  };

  return {
    cameraService,
    startMonitoring,
    stopMonitoring,
  };
};