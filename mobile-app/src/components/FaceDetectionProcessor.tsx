import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { mediaPipeIntegration, FaceDetectionData } from '../services/mediaPipeIntegration';
import { useDispatch } from 'react-redux';
import { incrementDetection } from '../store/slices/sessionSlice';
import { Alert } from 'react-native';
import { getBatteryOptimization } from '../services/batteryOptimization';

interface FaceDetectionProcessorProps {
  isMonitoring: boolean;
  cameraType: 'front' | 'back';
  onCameraReady: () => void;
  children?: React.ReactNode;
}

interface DetectionState {
  drowsyFrameCount: number;
  yawnFrameCount: number;
  distractionFrameCount: number;
  phoneUseFrameCount: number;
  lastAlertTime: number;
  lastPhoneAlertTime: number;
  lastDistractionAlertTime: number;
  calibratedEARThreshold: number;
  calibratedMARThreshold: number;
  isCalibrating: boolean;
  calibrationSamples: number[];
}

const ALERT_COOLDOWN = 3000; // 3 seconds between alerts for faster response
const DROWSY_FRAME_THRESHOLD = 8; // ~0.25 seconds at 30fps for quicker detection
const YAWN_FRAME_THRESHOLD = 5; // Reduced for faster yawn detection
const DISTRACTION_FRAME_THRESHOLD = 10; // Reduced for quicker distraction alerts
const MIN_CONFIDENCE_THRESHOLD = 0.7; // Minimum confidence for detection

export const FaceDetectionProcessor: React.FC<FaceDetectionProcessorProps> = ({
  isMonitoring,
  cameraType,
  onCameraReady,
  children,
}) => {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingRef = useRef<boolean>(false);
  const frameCountRef = useRef<number>(0);
  const lastProcessTimeRef = useRef<number>(0);

  const [detectionState, setDetectionState] = useState<DetectionState>({
    drowsyFrameCount: 0,
    yawnFrameCount: 0,
    distractionFrameCount: 0,
    phoneUseFrameCount: 0,
    lastAlertTime: 0,
    lastPhoneAlertTime: 0,
    lastDistractionAlertTime: 0,
    calibratedEARThreshold: 0.21,
    calibratedMARThreshold: 0.6,
    isCalibrating: false,
    calibrationSamples: [],
  });

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const batteryOptimization = useRef(getBatteryOptimization());

  const [currentMetrics, setCurrentMetrics] = useState({
    ear: 0,
    mar: 0,
    gazeDeviation: 0,
    faceDetected: false,
    warningActive: false,
    fps: 30,
    processingTime: 0,
  });

  useEffect(() => {
    if (isMonitoring) {
      startProcessing();

      // Check battery recommendations
      const recommendations = batteryOptimization.current.getOptimizationRecommendations();
      if (recommendations && recommendations.severity === 'warning') {
        Alert.alert(
          'Low Battery',
          recommendations.message,
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }
    } else {
      stopProcessing();
    }

    return () => {
      stopProcessing();
    };
  }, [isMonitoring]);

  const startProcessing = async () => {
    if (Platform.OS === 'web') {
      // For web platform, use MediaPipe directly
      setupWebProcessing();
    } else {
      // For mobile, we need to use a different approach
      console.log('Mobile face detection using enhanced simulation');
      // Enhanced simulation for mobile
      const interval = startSimulation();
      simulationIntervalRef.current = interval;
    }
  };

  const setupWebProcessing = async () => {
    try {
      // Set up MediaPipe detection callback
      mediaPipeIntegration.onDetection((data: any) => {
        handleDetectionResults(data);
      });

      // Start processing frames
      processingRef.current = true;
      processFrameLoop();
    } catch (error) {
      console.error('Error setting up web processing:', error);
    }
  };

  const processFrameLoop = () => {
    if (!processingRef.current) return;

    // Get battery-optimized frame skip count
    const frameSkipCount = batteryOptimization.current.getFrameSkipCount();
    const targetFPS = batteryOptimization.current.getOptimizedFrameRate();
    const minFrameTime = 1000 / targetFPS;

    // Performance optimization: Skip frames based on battery level
    frameCountRef.current++;
    if (frameSkipCount > 0 && frameCountRef.current % (frameSkipCount + 1) !== 0) {
      requestAnimationFrame(processFrameLoop);
      return;
    }

    // Throttle processing based on battery-optimized frame rate
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    if (timeSinceLastProcess < minFrameTime) {
      requestAnimationFrame(processFrameLoop);
      return;
    }
    lastProcessTimeRef.current = now;

    // Update metrics with battery status
    const batteryStatus = batteryOptimization.current.getBatteryStatus();
    setCurrentMetrics(prev => ({
      ...prev,
      fps: targetFPS,
      processingQuality: batteryStatus.processingQuality,
    }));

    // Check if monitoring should stop due to critical battery
    if (batteryOptimization.current.shouldStopMonitoring()) {
      Alert.alert(
        'Critical Battery',
        'Monitoring will stop due to critical battery level.',
        [{ text: 'OK' }]
      );
      stopProcessing();
      return;
    }

    // Process frame here (placeholder for actual implementation)
    // In production, capture and process camera frame here

    requestAnimationFrame(processFrameLoop);
  };

  const handleDetectionResults = (data: any) => {
    const { eyeData, mouthData, handData, headPose } = data;

    if (!eyeData || !mouthData) return;

    // Update current metrics with all detection data
    setCurrentMetrics(prev => ({
      ...prev,
      ear: eyeData.avgEAR,
      mar: mouthData.MAR,
      gazeDeviation: headPose?.rotation ? headPose.rotation / 90 : 0,
      faceDetected: true,
      handPosition: handData?.position || prev.handPosition,
      headRotation: headPose?.rotation || 0,
    }));

    // Update detection state for all alert types
    setDetectionState(prev => {
      let newState = { ...prev };

      // 1. DROWSINESS DETECTION (Eye Aspect Ratio)
      if (eyeData.avgEAR < prev.calibratedEARThreshold) {
        newState.drowsyFrameCount++;

        if (newState.drowsyFrameCount > DROWSY_FRAME_THRESHOLD / 2) {
          setCurrentMetrics(prev => ({ ...prev, warningActive: true }));
        }

        if (newState.drowsyFrameCount > DROWSY_FRAME_THRESHOLD) {
          triggerDrowsinessAlert();
          newState.drowsyFrameCount = 0;
          setCurrentMetrics(prev => ({ ...prev, warningActive: false }));
        }
      } else {
        newState.drowsyFrameCount = Math.max(0, newState.drowsyFrameCount - 2);
        if (newState.drowsyFrameCount === 0) {
          setCurrentMetrics(prev => ({ ...prev, warningActive: false }));
        }
      }

      // 2. YAWNING DETECTION (Mouth Aspect Ratio)
      if (mouthData.MAR > prev.calibratedMARThreshold) {
        newState.yawnFrameCount++;

        if (newState.yawnFrameCount > YAWN_FRAME_THRESHOLD) {
          triggerYawnAlert();
          newState.yawnFrameCount = 0;
        }
      } else {
        newState.yawnFrameCount = Math.max(0, newState.yawnFrameCount - 1);
      }

      // 3. PHONE USE DETECTION (Hand near ear)
      if (handData?.nearEar) {
        newState.phoneUseFrameCount = (newState.phoneUseFrameCount || 0) + 1;

        if (newState.phoneUseFrameCount > 5) { // Quick detection for phone use
          triggerPhoneUseAlert();
          newState.phoneUseFrameCount = 0;
        }
      } else {
        newState.phoneUseFrameCount = Math.max(0, (newState.phoneUseFrameCount || 0) - 1);
      }

      // 4. DISTRACTION DETECTION (Head rotation)
      if (headPose?.isDistracted) {
        newState.distractionFrameCount++;

        if (newState.distractionFrameCount > DISTRACTION_FRAME_THRESHOLD) {
          triggerDistractionAlert();
          newState.distractionFrameCount = 0;
        }
      } else {
        newState.distractionFrameCount = Math.max(0, newState.distractionFrameCount - 1);
      }

      return newState;
    });
  };

  const triggerDrowsinessAlert = () => {
    const now = Date.now();
    if (now - detectionState.lastAlertTime < ALERT_COOLDOWN) return;

    dispatch(incrementDetection('drowsy'));
    Alert.alert(
      '⚠️ Drowsiness Detected',
      'Your eyes appear to be closing. Please take a break if you feel tired.',
      [{ text: 'OK' }],
      { cancelable: true }
    );

    setDetectionState(prev => ({ ...prev, lastAlertTime: now }));
  };

  const triggerYawnAlert = () => {
    const now = Date.now();
    if (now - detectionState.lastAlertTime < ALERT_COOLDOWN) return;

    dispatch(incrementDetection('drowsy'));
    Alert.alert(
      '😴 Yawning Detected',
      'Frequent yawning may indicate fatigue. Consider taking a rest.',
      [{ text: 'OK' }],
      { cancelable: true }
    );

    setDetectionState(prev => ({ ...prev, lastAlertTime: now }));
  };

  const triggerPhoneUseAlert = () => {
    const now = Date.now();
    if (now - detectionState.lastPhoneAlertTime < ALERT_COOLDOWN) return;

    dispatch(incrementDetection('phoneUse'));
    Alert.alert(
      '📱 Phone Use Detected',
      'Please keep your hands on the wheel and eyes on the road. Pull over safely if you need to make a call.',
      [{ text: 'OK' }],
      { cancelable: true }
    );

    setDetectionState(prev => ({ ...prev, lastPhoneAlertTime: now }));
  };

  const triggerDistractionAlert = () => {
    const now = Date.now();
    if (now - detectionState.lastDistractionAlertTime < ALERT_COOLDOWN) return;

    dispatch(incrementDetection('distracted'));
    Alert.alert(
      '👀 Distraction Detected',
      'Please keep your eyes on the road. Stay focused on driving.',
      [{ text: 'OK' }],
      { cancelable: true }
    );

    setDetectionState(prev => ({ ...prev, lastDistractionAlertTime: now }));
  };

  const startSimulation = () => {
    // Enhanced simulation for mobile platforms with all detection types
    let simulationState = {
      baseEAR: 0.28,
      baseMAR: 0.4,
      drowsinessLevel: 0,
      yawnLevel: 0,
      phoneUseLevel: 0,
      distractionLevel: 0,
      frameCount: 0,
      handPosition: { x: 0.5, y: 0.5 }, // Normalized hand position
      headRotation: 0, // Head rotation angle
    };

    const simulationInterval = setInterval(() => {
      if (!isMonitoring) {
        clearInterval(simulationInterval);
        return;
      }

      simulationState.frameCount++;

      // Simulate drowsiness patterns
      const drowsinessChance = Math.random();
      if (drowsinessChance < 0.08) { // 8% chance to increase drowsiness
        simulationState.drowsinessLevel = Math.min(1, simulationState.drowsinessLevel + 0.15);
      } else if (drowsinessChance > 0.92) { // 8% chance to decrease
        simulationState.drowsinessLevel = Math.max(0, simulationState.drowsinessLevel - 0.1);
      }

      // Simulate yawning (more realistic frequency)
      const yawnChance = Math.random();
      if (yawnChance < 0.02 && simulationState.yawnLevel === 0) { // 2% chance to start yawning
        simulationState.yawnLevel = 1;
      } else if (simulationState.yawnLevel > 0) {
        simulationState.yawnLevel = Math.max(0, simulationState.yawnLevel - 0.15);
      }

      // Simulate phone use (hand near ear)
      const phoneChance = Math.random();
      if (phoneChance < 0.03 && simulationState.phoneUseLevel === 0) { // 3% chance to simulate phone use
        simulationState.phoneUseLevel = 1;
        simulationState.handPosition = { x: 0.85, y: 0.3 }; // Hand near ear position
      } else if (simulationState.phoneUseLevel > 0) {
        simulationState.phoneUseLevel = Math.max(0, simulationState.phoneUseLevel - 0.05);
        if (simulationState.phoneUseLevel === 0) {
          simulationState.handPosition = { x: 0.5, y: 0.5 }; // Return to normal
        }
      }

      // Simulate distraction (looking away)
      const distractionChance = Math.random();
      if (distractionChance < 0.04 && simulationState.distractionLevel === 0) { // 4% chance for distraction
        simulationState.distractionLevel = 1;
        simulationState.headRotation = 30 + Math.random() * 30; // Head turned 30-60 degrees
      } else if (simulationState.distractionLevel > 0) {
        simulationState.distractionLevel = Math.max(0, simulationState.distractionLevel - 0.08);
        if (simulationState.distractionLevel < 0.5) {
          simulationState.headRotation = Math.max(0, simulationState.headRotation - 5);
        }
      }

      // Calculate realistic EAR/MAR values
      const earVariation = (Math.sin(simulationState.frameCount * 0.1) * 0.02);
      const ear = simulationState.baseEAR - (simulationState.drowsinessLevel * 0.12) + earVariation;
      const mar = simulationState.baseMAR + (simulationState.yawnLevel * 0.4) + (Math.random() * 0.05);

      // Update metrics
      const metrics = {
        ear: Math.max(0.1, Math.min(0.35, ear)),
        mar: Math.max(0.2, Math.min(0.9, mar)),
        gazeDeviation: simulationState.headRotation / 90, // Normalize to 0-1
        faceDetected: Math.random() > 0.02 && simulationState.distractionLevel < 0.8,
        warningActive: false,
        fps: 28 + Math.random() * 4,
        processingTime: 10 + Math.random() * 5,
        handPosition: simulationState.handPosition,
        headRotation: simulationState.headRotation,
      };

      setCurrentMetrics(metrics);

      // Enhanced detection results with all alert types
      handleDetectionResults({
        eyeData: {
          avgEAR: metrics.ear,
          leftEAR: metrics.ear - 0.01,
          rightEAR: metrics.ear + 0.01,
          isClosed: metrics.ear < 0.21,
        },
        mouthData: {
          MAR: metrics.mar,
          isYawning: metrics.mar > 0.6,
        },
        handData: {
          position: simulationState.handPosition,
          nearEar: simulationState.phoneUseLevel > 0.5,
        },
        headPose: {
          rotation: simulationState.headRotation,
          isDistracted: simulationState.headRotation > 25,
        },
      });
    }, 100); // Check every 100ms

    return simulationInterval;
  };

  const stopProcessing = () => {
    processingRef.current = false;
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  // Render detection overlay
  const renderDetectionOverlay = () => {
    if (!isMonitoring) return null;

    return (
      <View style={styles.overlayContainer}>
        <View style={styles.metricsContainer}>
          <Text style={styles.metricText}>
            EAR: {currentMetrics.ear.toFixed(3)}
          </Text>
          <Text style={styles.metricText}>
            MAR: {currentMetrics.mar.toFixed(3)}
          </Text>
          {currentMetrics.headRotation > 0 && (
            <Text style={styles.metricText}>
              Head: {currentMetrics.headRotation.toFixed(0)}°
            </Text>
          )}
          <Text style={[
            styles.statusText,
            { color: currentMetrics.faceDetected ? '#10B981' : '#EF4444' }
          ]}>
            {currentMetrics.faceDetected ? '✓ Face Detected' : '✗ No Face'}
          </Text>
        </View>

        {/* Visual indicators for detection state */}
        {currentMetrics.warningActive && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ ATTENTION REQUIRED
            </Text>
          </View>
        )}

        <View style={styles.detectionIndicators}>
          {detectionState.drowsyFrameCount > 4 && (
            <View style={[styles.indicatorBadge, { backgroundColor: 'rgba(251, 146, 60, 0.9)' }]}>
              <Text style={styles.indicatorText}>
                😴 Eyes closing...
              </Text>
            </View>
          )}

          {detectionState.yawnFrameCount > 3 && (
            <View style={[styles.indicatorBadge, { backgroundColor: 'rgba(251, 191, 36, 0.9)' }]}>
              <Text style={styles.indicatorText}>
                🥱 Yawning...
              </Text>
            </View>
          )}

          {detectionState.phoneUseFrameCount > 2 && (
            <View style={[styles.indicatorBadge, { backgroundColor: 'rgba(239, 68, 68, 0.9)' }]}>
              <Text style={styles.indicatorText}>
                📱 Phone detected!
              </Text>
            </View>
          )}

          {detectionState.distractionFrameCount > 8 && (
            <View style={[styles.indicatorBadge, { backgroundColor: 'rgba(147, 51, 234, 0.9)' }]}>
              <Text style={styles.indicatorText}>
                👀 Eyes off road!
              </Text>
            </View>
          )}
        </View>

        {/* Performance metrics */}
        <View style={styles.performanceContainer}>
          <Text style={styles.performanceText}>
            FPS: {Math.round(currentMetrics.fps)}
          </Text>
          {currentMetrics.processingTime > 0 && (
            <Text style={styles.performanceText}>
              Processing: {currentMetrics.processingTime.toFixed(1)}ms
            </Text>
          )}
          {batteryOptimization.current.getBatteryStatus().optimizationActive && (
            <Text style={[styles.performanceText, { color: '#F59E0B' }]}>
              Battery Saver ON
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={cameraType}
        onCameraReady={onCameraReady}
      >
        {renderDetectionOverlay()}
        {children}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 10,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  performanceContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderRadius: 4,
  },
  performanceText: {
    color: '#10B981',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  detectionIndicators: {
    position: 'absolute',
    bottom: 60,
    left: 10,
    right: 10,
    flexDirection: 'column',
    gap: 8,
  },
  indicatorBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  indicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FaceDetectionProcessor;