import { DetectionConfig, DetectionResult, FaceDetectionResult, HandDetectionResult, AlertData, AlertType } from '@/types';

// Detection configuration based on dmsv7.py
const DEFAULT_CONFIG: DetectionConfig = {
  earThreshold: 0.140,
  eyeClosedFramesThreshold: 9,
  blinkRateThreshold: 5,
  marThreshold: 0.6,
  yawnThreshold: 3,
  gazeDeviationThreshold: 0.05,
  headTurnThreshold: 0.08,
  handNearFaceDistance: 200,
};

export class DetectionEngine {
  private config: DetectionConfig;
  private eyeClosureCounter: number = 0;
  private blinkCounter: number = 0;
  private yawnCounter: number = 0;
  private blinkTimer: number = Date.now();
  private marHistory: number[] = [];
  private calibrationData?: {
    gazeCenter: number;
    headCenterX: number;
    headCenterY: number;
  };
  private isCalibrated: boolean = false;
  private alertCallbacks: ((alert: AlertData) => void)[] = [];

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.marHistory = new Array(30).fill(0);
  }

  setConfig(config: Partial<DetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  setCalibration(gazeCenter: number, headCenterX: number, headCenterY: number) {
    this.calibrationData = { gazeCenter, headCenterX, headCenterY };
    this.isCalibrated = true;
  }

  addAlertCallback(callback: (alert: AlertData) => void) {
    this.alertCallbacks.push(callback);
  }

  private triggerAlert(type: AlertType, severity: 'mild' | 'moderate' | 'severe', message: string, confidence?: number, metadata?: any) {
    const alert: AlertData = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date(),
      confidenceScore: confidence,
      metadata,
      sessionId: '', // Will be set by the calling context
    };

    this.alertCallbacks.forEach(callback => callback(alert));
    return alert;
  }

  // Calculate Eye Aspect Ratio (EAR) - based on dmsv7.py logic
  private calculateEAR(eyeLandmarks: any[], frameWidth: number, frameHeight: number): number {
    const getPoint = (index: number) => ({
      x: eyeLandmarks[index].x * frameWidth,
      y: eyeLandmarks[index].y * frameHeight,
    });

    // Eye landmark indices (MediaPipe format)
    const [p1, p2, p3, p4, p5, p6] = [1, 5, 2, 4, 0, 3].map(i => getPoint(i));

    // Vertical distances
    const A = Math.hypot(p2.x - p6.x, p2.y - p6.y);
    const B = Math.hypot(p3.x - p5.x, p3.y - p5.y);
    // Horizontal distance
    const C = Math.hypot(p1.x - p4.x, p1.y - p4.y);

    return C > 0 ? (A + B) / (2.0 * C) : 0;
  }

  // Calculate Mouth Aspect Ratio (MAR) - based on dmsv7.py logic
  private calculateMAR(mouthLandmarks: any[], frameWidth: number, frameHeight: number): number {
    const getPoint = (index: number) => ({
      x: mouthLandmarks[index].x * frameWidth,
      y: mouthLandmarks[index].y * frameHeight,
    });

    // Mouth landmark indices for top, bottom, left, right
    const top = getPoint(13);
    const bottom = getPoint(14);
    const left = getPoint(78);
    const right = getPoint(308);

    const vertical = Math.hypot(top.x - bottom.x, top.y - bottom.y);
    const horizontal = Math.hypot(left.x - right.x, left.y - right.y);

    return horizontal > 0 ? vertical / horizontal : 0;
  }

  // Get iris center - based on dmsv7.py logic
  private getIrisCenter(irisLandmarks: any[], frameWidth: number, frameHeight: number): { x: number; y: number } {
    const points = irisLandmarks.map(landmark => ({
      x: landmark.x * frameWidth,
      y: landmark.y * frameHeight,
    }));

    const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    return { x: centerX, y: centerY };
  }

  // Check if hand is near ear - based on dmsv7.py logic
  private isHandNearEar(faceLandmarks: any[], handLandmarks: any[], frameWidth: number, frameHeight: number): boolean {
    const LEFT_EAR_TIP = 234;
    const RIGHT_EAR_TIP = 454;

    const leftEar = {
      x: faceLandmarks[LEFT_EAR_TIP].x * frameWidth,
      y: faceLandmarks[LEFT_EAR_TIP].y * frameHeight,
    };
    const rightEar = {
      x: faceLandmarks[RIGHT_EAR_TIP].x * frameWidth,
      y: faceLandmarks[RIGHT_EAR_TIP].y * frameHeight,
    };

    for (const landmark of handLandmarks) {
      const handPoint = {
        x: landmark.x * frameWidth,
        y: landmark.y * frameHeight,
      };

      const distanceToLeftEar = Math.hypot(handPoint.x - leftEar.x, handPoint.y - leftEar.y);
      const distanceToRightEar = Math.hypot(handPoint.x - rightEar.x, handPoint.y - rightEar.y);

      if (distanceToLeftEar < 40 || distanceToRightEar < 40) {
        return true;
      }
    }

    return false;
  }

  // Check if hand is near face - based on dmsv7.py logic
  private isHandNearFace(faceCenter: { x: number; y: number }, handLandmarks: any[], frameWidth: number, frameHeight: number): boolean {
    for (const landmark of handLandmarks) {
      const handPoint = {
        x: landmark.x * frameWidth,
        y: landmark.y * frameHeight,
      };

      const distance = Math.hypot(faceCenter.x - handPoint.x, faceCenter.y - handPoint.y);
      if (distance < this.config.handNearFaceDistance) {
        return true;
      }
    }

    return false;
  }

  // Detect possible texting - based on dmsv7.py logic
  private detectTexting(hands: HandDetectionResult[], frameWidth: number, frameHeight: number): boolean {
    if (hands.length !== 2) return false;

    const hand1Center = this.getHandCenter(hands[0].landmarks, frameWidth, frameHeight);
    const hand2Center = this.getHandCenter(hands[1].landmarks, frameWidth, frameHeight);

    const distance = Math.hypot(hand1Center.x - hand2Center.x, hand1Center.y - hand2Center.y);
    const normalizedDistance = distance / frameWidth;

    // Both hands are in lower portion of frame and close together
    const bothHandsLow = (hand1Center.y / frameHeight) > 0.6 && (hand2Center.y / frameHeight) > 0.6;
    const handsClose = normalizedDistance < 0.35;

    return bothHandsLow && handsClose;
  }

  private getHandCenter(handLandmarks: any[], frameWidth: number, frameHeight: number): { x: number; y: number } {
    const points = handLandmarks.map(landmark => ({
      x: landmark.x * frameWidth,
      y: landmark.y * frameHeight,
    }));

    return {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
    };
  }

  // Main detection processing - based on dmsv7.py algorithms
  processFrame(
    faceResult: FaceDetectionResult | null,
    handResults: HandDetectionResult[],
    frameWidth: number,
    frameHeight: number,
    sessionId: string
  ): DetectionResult {
    const currentTime = Date.now();

    // Initialize detection result
    const result: DetectionResult = {
      eyeClosure: {
        leftEAR: 0,
        rightEAR: 0,
        averageEAR: 0,
        isEyesClosed: false,
        closureFrames: this.eyeClosureCounter,
        severity: 'normal',
      },
      headPose: {
        x: 0,
        y: 0,
        pitch: 0,
        yaw: 0,
        roll: 0,
        turn: 'none',
        tilt: 'none',
        droop: 'none',
      },
      gaze: {
        x: 0.5,
        y: 0.5,
        deviation: 0,
        lookingAway: false,
      },
      mouth: {
        MAR: 0,
        isYawning: false,
        yawnCount: this.yawnCounter,
      },
      hands: {
        nearEar: false,
        nearFace: false,
        possibleTexting: false,
        phoneUsage: false,
      },
      drowsiness: {
        level: 'none',
        indicators: [],
      },
      distraction: {
        level: 'none',
        indicators: [],
      },
    };

    if (!faceResult || !faceResult.landmarks) {
      return result;
    }

    const landmarks = faceResult.landmarks;

    // Face center (nose tip)
    const NOSE_TIP = 1;
    const faceCenter = {
      x: landmarks[NOSE_TIP].x * frameWidth,
      y: landmarks[NOSE_TIP].y * frameHeight,
    };

    // Eye closure detection
    const LEFT_EYE = [33, 160, 158, 133, 153, 144];
    const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

    const leftEyeLandmarks = LEFT_EYE.map(i => landmarks[i]);
    const rightEyeLandmarks = RIGHT_EYE.map(i => landmarks[i]);

    const leftEAR = this.calculateEAR(leftEyeLandmarks, frameWidth, frameHeight);
    const rightEAR = this.calculateEAR(rightEyeLandmarks, frameWidth, frameHeight);
    const averageEAR = (leftEAR + rightEAR) / 2;

    result.eyeClosure.leftEAR = leftEAR;
    result.eyeClosure.rightEAR = rightEAR;
    result.eyeClosure.averageEAR = averageEAR;

    // Enhanced eye closure detection with iris visibility check
    const LEFT_IRIS = [474, 475, 476, 477];
    const RIGHT_IRIS = [469, 470, 471, 472];

    const leftIris = this.getIrisCenter(LEFT_IRIS.map(i => landmarks[i]), frameWidth, frameHeight);
    const rightIris = this.getIrisCenter(RIGHT_IRIS.map(i => landmarks[i]), frameWidth, frameHeight);
    const irisCenter = { x: (leftIris.x + rightIris.x) / 2, y: (leftIris.y + rightIris.y) / 2 };

    const irisYNormalized = irisCenter.y / frameHeight;
    const irisVisible = irisYNormalized <= 0.5; // Adjust threshold as needed
    const eyeClosedByEAR = averageEAR < this.config.earThreshold;

    if (eyeClosedByEAR && !irisVisible) {
      this.eyeClosureCounter++;

      if (this.eyeClosureCounter > 30) {
        result.eyeClosure.severity = 'alert';
        result.eyeClosure.isEyesClosed = true;
        this.triggerAlert('eye_closure', 'severe', 'Alert: Eyes Closed Too Long', 0.9, { ear: averageEAR, frames: this.eyeClosureCounter });
      } else if (this.eyeClosureCounter > this.config.eyeClosedFramesThreshold) {
        result.eyeClosure.severity = 'warning';
        result.eyeClosure.isEyesClosed = true;
        this.triggerAlert('eye_closure', 'moderate', 'Warning: Eyes Closed', 0.8, { ear: averageEAR, frames: this.eyeClosureCounter });
      }
    } else {
      if (this.eyeClosureCounter >= 2 && this.eyeClosureCounter < this.config.eyeClosedFramesThreshold) {
        this.blinkCounter++;
      }
      this.eyeClosureCounter = 0;
    }

    // Blink rate monitoring
    if (currentTime - this.blinkTimer > 60000) { // Check every minute
      if (this.blinkCounter >= this.config.blinkRateThreshold) {
        this.triggerAlert('blink_rate_high', 'mild', 'High Blinking Rate', 0.7, { blinkCount: this.blinkCounter });
      }
      this.blinkCounter = 0;
      this.blinkTimer = currentTime;
    }

    // Yawning detection
    const MOUTH = [13, 14, 78, 308];
    const mouthLandmarks = MOUTH.map(i => landmarks[i]);
    const mar = this.calculateMAR(mouthLandmarks, frameWidth, frameHeight);

    result.mouth.MAR = mar;
    this.marHistory.push(mar);
    this.marHistory.shift();

    if (mar > this.config.marThreshold) {
      this.yawnCounter++;
    }

    if (this.yawnCounter > this.config.yawnThreshold) {
      result.mouth.isYawning = true;
      this.triggerAlert('yawning', 'moderate', 'Warning: Yawning', 0.8, { mar, yawnCount: this.yawnCounter });
      this.yawnCounter = 0;
    }

    // Head pose estimation
    const headX = landmarks[NOSE_TIP].x;
    const headY = landmarks[NOSE_TIP].y;

    result.headPose.x = headX;
    result.headPose.y = headY;

    if (this.isCalibrated && this.calibrationData) {
      const headXOffset = Math.abs(headX - this.calibrationData.headCenterX);
      const headYOffset = Math.abs(headY - this.calibrationData.headCenterY);

      // Head turning detection
      if (headXOffset > this.config.headTurnThreshold) {
        if (headXOffset < 0.1) {
          result.headPose.turn = 'mild';
          this.triggerAlert('head_turn', 'mild', 'Mild Head Turn', 0.6);
        } else if (headXOffset < 0.2) {
          result.headPose.turn = 'moderate';
          this.triggerAlert('head_turn', 'moderate', 'Moderate Head Turn', 0.8);
        } else {
          result.headPose.turn = 'severe';
          this.triggerAlert('head_turn', 'severe', 'Severe Head Turn', 0.9);
        }
      }

      // Head tilt/droop detection
      if (Math.abs(headYOffset) > this.config.headTurnThreshold) {
        if (headY < this.calibrationData.headCenterY) {
          // Looking upward
          if (Math.abs(headYOffset) < 0.08) {
            result.headPose.tilt = 'mild';
            this.triggerAlert('head_turn', 'mild', 'Mild Looking Upward', 0.6);
          } else if (Math.abs(headYOffset) < 0.15) {
            result.headPose.tilt = 'moderate';
            this.triggerAlert('head_turn', 'moderate', 'Moderate Looking Upward', 0.8);
          } else {
            result.headPose.tilt = 'severe';
            this.triggerAlert('head_turn', 'severe', 'Severe Looking Upward', 0.9);
          }
        } else {
          // Looking downward - head droop
          if (Math.abs(headYOffset) < 0.07) {
            result.headPose.droop = 'mild';
            this.triggerAlert('head_droop', 'mild', 'Head drooping symptom', 0.7);
          } else if (Math.abs(headYOffset) < 0.12) {
            result.headPose.droop = 'moderate';
            this.triggerAlert('head_droop', 'moderate', 'Head drooping started', 0.8);
          } else {
            result.headPose.droop = 'severe';
            this.triggerAlert('head_droop', 'severe', 'Head drooped', 0.9);
          }
        }
      }

      // Gaze estimation
      const gazeXNorm = irisCenter.x / frameWidth;
      const gazeOffset = Math.abs(gazeXNorm - this.calibrationData.gazeCenter);

      result.gaze.x = gazeXNorm;
      result.gaze.deviation = gazeOffset;

      if (gazeOffset > this.config.gazeDeviationThreshold) {
        result.gaze.lookingAway = true;

        if (gazeOffset < 0.1) {
          this.triggerAlert('gaze_deviation', 'mild', 'Mild Gaze Deviation', 0.6);
        } else if (gazeOffset < 0.2) {
          this.triggerAlert('gaze_deviation', 'moderate', 'Moderate Gaze Deviation', 0.8);
        } else {
          this.triggerAlert('gaze_deviation', 'severe', 'Severe Gaze Deviation', 0.9);
        }
      }
    }

    // Hand detection and analysis
    if (handResults.length > 0) {
      for (const hand of handResults) {
        // Check for phone usage (hand near ear)
        if (this.isHandNearEar(landmarks, hand.landmarks, frameWidth, frameHeight)) {
          result.hands.nearEar = true;
          result.hands.phoneUsage = true;
          this.triggerAlert('phone_usage', 'moderate', 'Likely mobile call', 0.8);
        }

        // Check for hand near face
        if (this.isHandNearFace(faceCenter, hand.landmarks, frameWidth, frameHeight)) {
          result.hands.nearFace = true;
          this.triggerAlert('hand_near_face', 'mild', 'Hand near the face', 0.7);
        }
      }

      // Check for texting behavior
      if (this.detectTexting(handResults, frameWidth, frameHeight)) {
        result.hands.possibleTexting = true;
        this.triggerAlert('texting', 'severe', 'Possible texting observed', 0.9);
      }
    }

    // Composite drowsiness assessment
    const eyeClosureSeverity = result.eyeClosure.severity === 'alert' ? 2 : result.eyeClosure.severity === 'warning' ? 1 : 0;
    const headDroopSeverity = result.headPose.droop === 'severe' ? 3 : result.headPose.droop === 'moderate' ? 2 : result.headPose.droop === 'mild' ? 1 : 0;

    if (eyeClosureSeverity >= 2 && (headDroopSeverity >= 1 || result.mouth.isYawning)) {
      result.drowsiness.level = 'severe';
      result.drowsiness.indicators = ['prolonged eye closure', headDroopSeverity >= 1 ? 'head droop' : 'yawning'];
      this.triggerAlert('drowsiness', 'severe', 'Severe DROWSINESS Observed', 0.95);
    } else if (eyeClosureSeverity >= 1 && (headDroopSeverity >= 1 || result.mouth.isYawning)) {
      result.drowsiness.level = 'moderate';
      result.drowsiness.indicators = ['eye closure', headDroopSeverity >= 1 ? 'head droop' : 'yawning'];
      this.triggerAlert('drowsiness', 'moderate', 'Moderate DROWSINESS Observed', 0.85);
    }

    // Composite distraction assessment
    const headTurnSeverity = result.headPose.turn === 'severe' ? 3 : result.headPose.turn === 'moderate' ? 2 : result.headPose.turn === 'mild' ? 1 : 0;
    const headTiltSeverity = result.headPose.tilt === 'severe' ? 3 : result.headPose.tilt === 'moderate' ? 2 : result.headPose.tilt === 'mild' ? 1 : 0;
    const handsNotFree = result.hands.nearEar || result.hands.nearFace || result.hands.possibleTexting;

    if (((headTurnSeverity >= 2 || headTiltSeverity >= 2) && handsNotFree)) {
      result.distraction.level = 'severe';
      result.distraction.indicators = ['head movement', 'hands not free'];
      this.triggerAlert('distraction', 'severe', 'Severe DISTRACTION Observed', 0.9);
    } else if (((headTurnSeverity >= 1 || headTiltSeverity >= 1) && handsNotFree)) {
      result.distraction.level = 'moderate';
      result.distraction.indicators = ['head movement', 'hands not free'];
      this.triggerAlert('distraction', 'moderate', 'Moderate DISTRACTION Observed', 0.8);
    }

    return result;
  }

  reset() {
    this.eyeClosureCounter = 0;
    this.blinkCounter = 0;
    this.yawnCounter = 0;
    this.blinkTimer = Date.now();
    this.marHistory.fill(0);
  }
}

export const detectionEngine = new DetectionEngine();
export default detectionEngine;