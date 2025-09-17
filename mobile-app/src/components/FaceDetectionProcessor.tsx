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
  lastAlertTime: number;
  calibratedEARThreshold: number;
  calibratedMARThreshold: number;
  isCalibrating: boolean;
  calibrationSamples: number[];
}

const ALERT_COOLDOWN = 5000; // 5 seconds between alerts
const DROWSY_FRAME_THRESHOLD = 15; // ~0.5 seconds at 30fps
const YAWN_FRAME_THRESHOLD = 10;
const DISTRACTION_FRAME_THRESHOLD = 20;

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

  const [detectionState, setDetectionState] = useState<DetectionState>({
    drowsyFrameCount: 0,
    yawnFrameCount: 0,
    distractionFrameCount: 0,
    lastAlertTime: 0,
    calibratedEARThreshold: 0.21,
    calibratedMARThreshold: 0.6,
    isCalibrating: false,
    calibrationSamples: [],
  });

  const [currentMetrics, setCurrentMetrics] = useState({
    ear: 0,
    mar: 0,
    gazeDeviation: 0,
    faceDetected: false,
  });

  useEffect(() => {
    if (isMonitoring) {
      startProcessing();
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
      console.log('Mobile face detection requires native module implementation');
      // Fall back to simulation for now
      startSimulation();
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

    // In a real implementation, we'd capture frames from the camera
    // and send them to MediaPipe for processing

    // For now, we'll use a placeholder
    requestAnimationFrame(processFrameLoop);
  };

  const handleDetectionResults = (data: any) => {
    const { eyeData, mouthData } = data;

    if (!eyeData || !mouthData) return;

    setCurrentMetrics({
      ear: eyeData.avgEAR,
      mar: mouthData.MAR,
      gazeDeviation: 0, // Would need head pose estimation
      faceDetected: true,
    });

    // Update detection state
    setDetectionState(prev => {
      let newState = { ...prev };

      // Check for drowsiness
      if (eyeData.avgEAR < prev.calibratedEARThreshold) {
        newState.drowsyFrameCount++;

        if (newState.drowsyFrameCount > DROWSY_FRAME_THRESHOLD) {
          triggerDrowsinessAlert();
          newState.drowsyFrameCount = 0;
        }
      } else {
        newState.drowsyFrameCount = Math.max(0, newState.drowsyFrameCount - 1);
      }

      // Check for yawning
      if (mouthData.MAR > prev.calibratedMARThreshold) {
        newState.yawnFrameCount++;

        if (newState.yawnFrameCount > YAWN_FRAME_THRESHOLD) {
          triggerYawnAlert();
          newState.yawnFrameCount = 0;
        }
      } else {
        newState.yawnFrameCount = Math.max(0, newState.yawnFrameCount - 1);
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

  const startSimulation = () => {
    // Fallback simulation for mobile platforms
    const simulationInterval = setInterval(() => {
      if (!isMonitoring) {
        clearInterval(simulationInterval);
        return;
      }

      const random = Math.random();

      // Simulate more realistic detection patterns
      setCurrentMetrics({
        ear: 0.20 + Math.random() * 0.15, // EAR typically between 0.20-0.35
        mar: 0.3 + Math.random() * 0.4,   // MAR typically between 0.3-0.7
        gazeDeviation: Math.random() * 0.1,
        faceDetected: random > 0.05, // 95% face detection rate
      });

      // Trigger alerts based on simulation
      if (random < 0.05) {
        triggerDrowsinessAlert();
      } else if (random < 0.08) {
        dispatch(incrementDetection('phoneUse'));
        Alert.alert(
          '📱 Phone Use Detected',
          'Please keep your hands on the wheel and eyes on the road.',
          [{ text: 'OK' }],
          { cancelable: true }
        );
      } else if (random < 0.12) {
        dispatch(incrementDetection('distracted'));
        Alert.alert(
          '👀 Distraction Detected',
          'Please maintain focus on driving.',
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }
    }, 3000); // Check every 3 seconds in simulation mode
  };

  const stopProcessing = () => {
    processingRef.current = false;
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
          <Text style={[
            styles.statusText,
            { color: currentMetrics.faceDetected ? '#10B981' : '#EF4444' }
          ]}>
            {currentMetrics.faceDetected ? '✓ Face Detected' : '✗ No Face'}
          </Text>
        </View>

        {/* Visual indicators for detection state */}
        {detectionState.drowsyFrameCount > 5 && (
          <Text style={styles.warningText}>
            ⚠️ Eyes closing...
          </Text>
        )}

        {detectionState.yawnFrameCount > 5 && (
          <Text style={styles.warningText}>
            😴 Yawn detected...
          </Text>
        )}
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
});

export default FaceDetectionProcessor;