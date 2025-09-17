/**
 * MediaPipe Integration Service for React Native
 * This service bridges MediaPipe face detection with React Native
 */

import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceDetectionData {
  landmarks: FaceLandmark[];
  confidence: number;
  timestamp: number;
}

export interface EyeData {
  leftEAR: number;
  rightEAR: number;
  avgEAR: number;
  isClosed: boolean;
}

export interface MouthData {
  MAR: number;
  isYawning: boolean;
}

export class MediaPipeIntegration {
  private faceMesh: FaceMesh | null = null;
  private isInitialized: boolean = false;
  private detectionCallback: ((data: FaceDetectionData) => void) | null = null;

  // Face mesh landmark indices for eyes and mouth
  private readonly LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
  private readonly RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];
  private readonly MOUTH_INDICES = [13, 14, 269, 270, 267, 271, 272];

  constructor() {
    this.initializeFaceMesh();
  }

  private async initializeFaceMesh() {
    try {
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.faceMesh.onResults(this.handleResults.bind(this));
      this.isInitialized = true;
      console.log('MediaPipe Face Mesh initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe:', error);
      this.isInitialized = false;
    }
  }

  private handleResults(results: any) {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      return;
    }

    const landmarks = results.multiFaceLandmarks[0];
    const detectionData: FaceDetectionData = {
      landmarks: landmarks,
      confidence: 0.95, // MediaPipe doesn't provide confidence directly
      timestamp: Date.now(),
    };

    // Calculate eye and mouth metrics
    const eyeData = this.calculateEyeMetrics(landmarks);
    const mouthData = this.calculateMouthMetrics(landmarks);

    // Trigger callback with enhanced data
    if (this.detectionCallback) {
      this.detectionCallback({
        ...detectionData,
        eyeData,
        mouthData,
      } as any);
    }
  }

  /**
   * Calculate Eye Aspect Ratio (EAR) for drowsiness detection
   * Based on the paper: Real-Time Eye Blink Detection using Facial Landmarks
   */
  private calculateEyeMetrics(landmarks: FaceLandmark[]): EyeData {
    const leftEAR = this.calculateEAR(landmarks, this.LEFT_EYE_INDICES);
    const rightEAR = this.calculateEAR(landmarks, this.RIGHT_EYE_INDICES);
    const avgEAR = (leftEAR + rightEAR) / 2;

    // Threshold for eye closure (calibrate based on testing)
    const EAR_THRESHOLD = 0.21;

    return {
      leftEAR,
      rightEAR,
      avgEAR,
      isClosed: avgEAR < EAR_THRESHOLD,
    };
  }

  private calculateEAR(landmarks: FaceLandmark[], indices: number[]): number {
    // Get the 6 eye landmarks
    const points = indices.map(i => landmarks[i]);

    // Calculate vertical eye distances
    const A = this.euclideanDistance(points[1], points[5]);
    const B = this.euclideanDistance(points[2], points[4]);

    // Calculate horizontal eye distance
    const C = this.euclideanDistance(points[0], points[3]);

    // Eye aspect ratio
    const ear = (A + B) / (2.0 * C);
    return ear;
  }

  /**
   * Calculate Mouth Aspect Ratio (MAR) for yawn detection
   */
  private calculateMouthMetrics(landmarks: FaceLandmark[]): MouthData {
    const MAR = this.calculateMAR(landmarks, this.MOUTH_INDICES);

    // Threshold for yawning (calibrate based on testing)
    const MAR_THRESHOLD = 0.6;

    return {
      MAR,
      isYawning: MAR > MAR_THRESHOLD,
    };
  }

  private calculateMAR(landmarks: FaceLandmark[], indices: number[]): number {
    const points = indices.map(i => landmarks[i]);

    // Calculate vertical mouth distances
    const A = this.euclideanDistance(points[1], points[6]);
    const B = this.euclideanDistance(points[2], points[5]);
    const C = this.euclideanDistance(points[3], points[4]);

    // Calculate horizontal mouth distance
    const D = this.euclideanDistance(points[0], points[6]);

    // Mouth aspect ratio
    const mar = (A + B + C) / (3.0 * D);
    return mar;
  }

  private euclideanDistance(point1: FaceLandmark, point2: FaceLandmark): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Process a camera frame for face detection
   */
  public async processFrame(imageData: ImageData | HTMLVideoElement | HTMLCanvasElement) {
    if (!this.isInitialized || !this.faceMesh) {
      console.warn('MediaPipe not initialized');
      return null;
    }

    try {
      await this.faceMesh.send({ image: imageData });
    } catch (error) {
      console.error('Error processing frame:', error);
      return null;
    }
  }

  /**
   * Set callback for detection results
   */
  public onDetection(callback: (data: FaceDetectionData) => void) {
    this.detectionCallback = callback;
  }

  /**
   * Check if service is ready
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Clean up resources
   */
  public dispose() {
    if (this.faceMesh) {
      this.faceMesh.close();
      this.faceMesh = null;
    }
    this.isInitialized = false;
    this.detectionCallback = null;
  }
}

// Singleton instance
export const mediaPipeIntegration = new MediaPipeIntegration();