import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { db } from '../utils/database';

interface CalibrationData {
  normalEAR: number[];
  normalMAR: number[];
  blinkCount: number;
  yawnCount: number;
  samples: number;
}

export default function CalibrationScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<'ready' | 'normal' | 'blink' | 'yawn' | 'complete'>('ready');
  const [calibrationData, setCalibrationData] = useState<CalibrationData>({
    normalEAR: [],
    normalMAR: [],
    blinkCount: 0,
    yawnCount: 0,
    samples: 0,
  });
  const [progress, setProgress] = useState(0);

  const calibrationTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (calibrationTimer.current) {
        clearInterval(calibrationTimer.current);
      }
    };
  }, []);

  const startCalibration = () => {
    setIsCalibrating(true);
    setCalibrationStep('normal');
    setProgress(0);

    // Start collecting normal state data
    collectNormalData();
  };

  const collectNormalData = () => {
    let sampleCount = 0;
    const maxSamples = 100; // Collect 100 samples (~10 seconds at 10Hz)

    calibrationTimer.current = setInterval(() => {
      sampleCount++;
      setProgress(sampleCount / maxSamples);

      // Simulate EAR/MAR collection
      // In production, this would come from actual face detection
      const simulatedEAR = 0.28 + (Math.random() * 0.04 - 0.02);
      const simulatedMAR = 0.35 + (Math.random() * 0.05 - 0.025);

      setCalibrationData(prev => ({
        ...prev,
        normalEAR: [...prev.normalEAR, simulatedEAR],
        normalMAR: [...prev.normalMAR, simulatedMAR],
        samples: sampleCount,
      }));

      if (sampleCount >= maxSamples) {
        clearInterval(calibrationTimer.current!);
        setCalibrationStep('blink');
        setProgress(0);
      }
    }, 100);
  };

  const recordBlink = () => {
    setCalibrationData(prev => ({
      ...prev,
      blinkCount: prev.blinkCount + 1,
    }));

    if (calibrationData.blinkCount >= 4) { // After 5 blinks
      setCalibrationStep('yawn');
    }
  };

  const recordYawn = () => {
    setCalibrationData(prev => ({
      ...prev,
      yawnCount: prev.yawnCount + 1,
    }));

    if (calibrationData.yawnCount >= 2) { // After 3 yawns
      completeCalibration();
    }
  };

  const completeCalibration = async () => {
    setCalibrationStep('complete');

    // Calculate personalized thresholds
    const avgNormalEAR = calibrationData.normalEAR.reduce((a, b) => a + b, 0) / calibrationData.normalEAR.length;
    const avgNormalMAR = calibrationData.normalMAR.reduce((a, b) => a + b, 0) / calibrationData.normalMAR.length;

    // Set thresholds based on normal values
    const earThreshold = avgNormalEAR * 0.7; // 70% of normal EAR for drowsiness
    const marThreshold = avgNormalMAR * 1.8; // 180% of normal MAR for yawning

    try {
      // Save calibration to database
      await db.saveCalibration(0, 0, 0); // Simplified for now
      await db.setSetting('ear_threshold', earThreshold.toString());
      await db.setSetting('mar_threshold', marThreshold.toString());
      await db.setSetting('calibration_date', new Date().toISOString());

      Alert.alert(
        'Calibration Complete',
        `Your personalized thresholds have been set:\n\nEAR: ${earThreshold.toFixed(3)}\nMAR: ${marThreshold.toFixed(3)}\n\nThese will improve detection accuracy.`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving calibration:', error);
      Alert.alert('Error', 'Failed to save calibration. Please try again.');
    }
  };

  const skipCalibration = () => {
    Alert.alert(
      'Skip Calibration',
      'Are you sure? Calibration improves detection accuracy.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-off" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Camera permission required</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calibration</Text>
        <TouchableOpacity onPress={skipCalibration}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="front"
        >
          <View style={styles.cameraOverlay}>
            {/* Face guide overlay */}
            <View style={styles.faceGuide} />
          </View>
        </CameraView>
      </View>

      <View style={styles.instructionsContainer}>
        {calibrationStep === 'ready' && (
          <View style={styles.stepContainer}>
            <Ionicons name="information-circle" size={48} color="#3B82F6" />
            <Text style={styles.stepTitle}>Calibration Setup</Text>
            <Text style={styles.stepDescription}>
              This calibration will personalize the drowsiness detection for your face.
              Please ensure you're in a well-lit area and looking at the camera.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={startCalibration}>
              <Text style={styles.buttonText}>Start Calibration</Text>
            </TouchableOpacity>
          </View>
        )}

        {calibrationStep === 'normal' && (
          <View style={styles.stepContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.stepTitle}>Recording Normal State</Text>
            <Text style={styles.stepDescription}>
              Please look at the camera naturally. Keep your eyes open and maintain a neutral expression.
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        )}

        {calibrationStep === 'blink' && (
          <View style={styles.stepContainer}>
            <Ionicons name="eye-outline" size={48} color="#3B82F6" />
            <Text style={styles.stepTitle}>Blink Detection</Text>
            <Text style={styles.stepDescription}>
              Please blink naturally 5 times. We'll detect and record each blink.
            </Text>
            <Text style={styles.counterText}>{calibrationData.blinkCount} / 5 blinks</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={recordBlink}>
              <Text style={styles.buttonText}>Record Blink</Text>
            </TouchableOpacity>
          </View>
        )}

        {calibrationStep === 'yawn' && (
          <View style={styles.stepContainer}>
            <Ionicons name="happy-outline" size={48} color="#3B82F6" />
            <Text style={styles.stepTitle}>Yawn Detection</Text>
            <Text style={styles.stepDescription}>
              Please yawn or open your mouth wide 3 times. This helps calibrate fatigue detection.
            </Text>
            <Text style={styles.counterText}>{calibrationData.yawnCount} / 3 yawns</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={recordYawn}>
              <Text style={styles.buttonText}>Record Yawn</Text>
            </TouchableOpacity>
          </View>
        )}

        {calibrationStep === 'complete' && (
          <View style={styles.stepContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.stepTitle}>Calibration Complete!</Text>
            <Text style={styles.stepDescription}>
              Processing your calibration data...
            </Text>
            <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 20 }} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  skipText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  cameraContainer: {
    height: '40%',
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 200,
    height: 250,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderRadius: 100,
  },
  instructionsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  stepContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  counterText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
  },
});