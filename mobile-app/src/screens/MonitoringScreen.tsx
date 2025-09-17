import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RootState } from '../store';
import { startSession, stopSession, incrementDetection } from '../store/slices/sessionSlice';

export default function MonitoringScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isMonitoring, detections } = useSelector((state: RootState) => state.session);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let simulationInterval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Simulate random detections for demo
      simulationInterval = setInterval(() => {
        const random = Math.random();
        if (random < 0.1) {
          dispatch(incrementDetection('drowsy'));
          Alert.alert(
            '⚠️ Drowsiness Detected',
            'Please take a break if you feel tired',
            [{ text: 'OK' }],
            { cancelable: true }
          );
        } else if (random < 0.15) {
          dispatch(incrementDetection('phoneUse'));
          Alert.alert(
            '📱 Phone Use Detected',
            'Please keep your eyes on the road',
            [{ text: 'OK' }],
            { cancelable: true }
          );
        } else if (random < 0.2) {
          dispatch(incrementDetection('distracted'));
          Alert.alert(
            '👀 Distraction Detected',
            'Please focus on driving',
            [{ text: 'OK' }],
            { cancelable: true }
          );
        }
      }, 8000); // Check every 8 seconds
    }

    return () => {
      clearInterval(interval);
      clearInterval(simulationInterval);
    };
  }, [isMonitoring, dispatch]);

  const handleStartStop = () => {
    if (isMonitoring) {
      Alert.alert(
        'Stop Monitoring',
        'Are you sure you want to stop the monitoring session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: () => {
              dispatch(stopSession());
              setElapsedTime(0);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      dispatch(startSession(Date.now().toString()));
    }
  };

  const toggleCameraType = () => {
    setCameraType(current =>
      current === 'back' ? 'front' : 'back'
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="camera-off" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Camera permission required</Text>
          <Text style={styles.errorSubtext}>
            We need camera access to monitor driver safety
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={requestPermission}
          >
            <Text style={styles.backButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: '#6B7280', marginTop: 12 }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing={cameraType}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.cameraOverlay}>
            {/* Face detection guide */}
            <View style={styles.faceGuide}>
              <View style={styles.faceGuideCorner} />
            </View>

            {/* Camera flip button */}
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </TouchableOpacity>

            {/* Live indicators */}
            {isMonitoring && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>MONITORING</Text>
              </View>
            )}
          </View>
        </CameraView>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Session Duration</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
        </View>

        <View style={styles.detectionsContainer}>
          <Text style={styles.detectionsTitle}>Detections</Text>
          <View style={styles.detectionsGrid}>
            <View style={styles.detectionItem}>
              <Ionicons name="eye-off-outline" size={24} color="#F59E0B" />
              <Text style={styles.detectionCount}>{detections.drowsy}</Text>
              <Text style={styles.detectionLabel}>Drowsy</Text>
            </View>
            <View style={styles.detectionItem}>
              <Ionicons name="phone-portrait-outline" size={24} color="#EF4444" />
              <Text style={styles.detectionCount}>{detections.phoneUse}</Text>
              <Text style={styles.detectionLabel}>Phone Use</Text>
            </View>
            <View style={styles.detectionItem}>
              <Ionicons name="alert-circle-outline" size={24} color="#6366F1" />
              <Text style={styles.detectionCount}>{detections.distracted}</Text>
              <Text style={styles.detectionLabel}>Distracted</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isMonitoring ? styles.stopButton : styles.startButton,
          ]}
          onPress={handleStartStop}
        >
          <Ionicons
            name={isMonitoring ? 'stop-circle' : 'play-circle'}
            size={32}
            color="white"
          />
          <Text style={styles.actionButtonText}>
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Text>
        </TouchableOpacity>

        {isMonitoring && (
          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>AI Analysis Active (Demo)</Text>
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
  cameraContainer: {
    height: '45%',
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  faceGuide: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    width: '50%',
    height: '60%',
    borderColor: 'rgba(59, 130, 246, 0.5)',
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'dashed',
  },
  faceGuideCorner: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#3B82F6',
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
  },
  liveIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  timerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  detectionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  detectionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  detectionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detectionItem: {
    alignItems: 'center',
  },
  detectionCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  detectionLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
});