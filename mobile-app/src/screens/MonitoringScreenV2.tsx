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
import { useCameraPermissions } from 'expo-camera';
import { RootState } from '../store';
import { startSession, stopSession } from '../store/slices/sessionSlice';
import FaceDetectionProcessor from '../components/FaceDetectionProcessor';
import { db } from '../utils/database';
import { addAlert } from '../store/slices/alertSlice';

export default function MonitoringScreenV2() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isMonitoring, detections, sessionId, startTime } = useSelector((state: RootState) => state.session);
  const user = useSelector((state: RootState) => state.auth.user);
  const alerts = useSelector((state: RootState) => state.alerts.alerts);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleStartStop = async () => {
    if (isMonitoring) {
      Alert.alert(
        'Stop Monitoring',
        'Are you sure you want to stop the monitoring session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: async () => {
              // Save session to database before stopping
              await saveSessionToDatabase();

              dispatch(stopSession());
              setElapsedTime(0);

              // Show session summary
              showSessionSummary();
            },
          },
        ]
      );
    } else {
      const newSessionId = Date.now().toString();
      dispatch(startSession(newSessionId));

      // Create session in database
      try {
        const driverId = user?.id || 'driver-1';
        await db.createSession({
          id: newSessionId,
          driver_id: driverId,
          start_time: new Date().toISOString(),
          device_info: JSON.stringify({
            platform: 'mobile',
            model: 'expo-app',
          }),
          sync_status: 'pending',
        });
      } catch (error) {
        console.error('Error creating session in database:', error);
      }
    }
  };

  const saveSessionToDatabase = async () => {
    if (!sessionId) return;

    try {
      // Update session with end time and duration
      const endTime = new Date().toISOString();
      const duration = elapsedTime;

      await db.updateSession(sessionId, {
        end_time: endTime,
        duration_seconds: duration,
        trip_distance_km: Math.random() * 50, // Mock distance for now
      });

      // Save alerts to database
      for (const alert of alerts) {
        await db.createAlert({
          id: alert.id,
          session_id: sessionId,
          alert_type: alert.type,
          severity: alert.type === 'drowsy' ? 'moderate' : 'mild',
          message: alert.message,
          timestamp: alert.timestamp,
          confidence_score: 0.85 + Math.random() * 0.15,
          sync_status: 'pending',
        });
      }

      // Save detection metrics
      const metricTypes = ['drowsy', 'phoneUse', 'distracted'];
      for (const type of metricTypes) {
        const count = detections[type as keyof typeof detections];
        if (count > 0) {
          await db.createMetric({
            id: `${sessionId}-${type}-${Date.now()}`,
            session_id: sessionId,
            metric_type: type,
            value: count,
            timestamp: new Date().toISOString(),
            sync_status: 'pending',
          });
        }
      }

      console.log('Session saved successfully to database');
    } catch (error) {
      console.error('Error saving session to database:', error);
    }
  };

  const showSessionSummary = () => {
    const total = detections.drowsy + detections.phoneUse + detections.distracted;
    const duration = formatTime(elapsedTime);

    Alert.alert(
      'Session Complete',
      `Duration: ${duration}\n` +
      `Total Alerts: ${total}\n` +
      `Drowsy: ${detections.drowsy}\n` +
      `Phone Use: ${detections.phoneUse}\n` +
      `Distracted: ${detections.distracted}\n\n` +
      `Safety Score: ${calculateSafetyScore()}%`,
      [
        {
          text: 'View History',
          onPress: () => {
            // Clear alerts after navigation
            dispatch({ type: 'alerts/clearAlerts' });
            navigation.navigate('History' as never);
          }
        },
        {
          text: 'Done',
          onPress: () => {
            // Clear alerts after navigation
            dispatch({ type: 'alerts/clearAlerts' });
            navigation.goBack();
          }
        },
      ]
    );
  };

  const calculateSafetyScore = (): number => {
    const totalAlerts = detections.drowsy + detections.phoneUse + detections.distracted;
    const maxScore = 100;
    const penaltyPerAlert = 5;
    const score = Math.max(0, maxScore - (totalAlerts * penaltyPerAlert));
    return score;
  };

  const toggleCameraType = () => {
    setCameraType(current => current === 'back' ? 'front' : 'back');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Permission handling
  if (!permission) {
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
        <FaceDetectionProcessor
          isMonitoring={isMonitoring}
          cameraType={cameraType}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.cameraOverlay}>
            {/* Face detection guide */}
            <View style={styles.faceGuide}>
              <View style={styles.faceGuideCorner} />
              <View style={[styles.faceGuideCorner, styles.topRight]} />
              <View style={[styles.faceGuideCorner, styles.bottomLeft]} />
              <View style={[styles.faceGuideCorner, styles.bottomRight]} />
            </View>

            {/* Camera controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraType}
              >
                <Ionicons name="camera-reverse" size={30} color="white" />
              </TouchableOpacity>

              {isMonitoring && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>AI MONITORING</Text>
                </View>
              )}
            </View>
          </View>
        </FaceDetectionProcessor>
      </View>

      <View style={styles.infoContainer}>
        {/* Session Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerLabel}>Session Duration</Text>
          <Text style={styles.timerValue}>{formatTime(elapsedTime)}</Text>
          {isMonitoring && (
            <View style={styles.safetyScore}>
              <Text style={styles.safetyScoreLabel}>Safety Score</Text>
              <Text style={[
                styles.safetyScoreValue,
                { color: calculateSafetyScore() > 80 ? '#10B981' :
                         calculateSafetyScore() > 60 ? '#F59E0B' : '#EF4444' }
              ]}>
                {calculateSafetyScore()}%
              </Text>
            </View>
          )}
        </View>

        {/* Detection Statistics */}
        <View style={styles.detectionsContainer}>
          <Text style={styles.detectionsTitle}>Real-time Detections</Text>
          <View style={styles.detectionsGrid}>
            <View style={styles.detectionItem}>
              <View style={styles.detectionIcon}>
                <Ionicons name="eye-off-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.detectionCount}>{detections.drowsy}</Text>
              <Text style={styles.detectionLabel}>Drowsy</Text>
            </View>
            <View style={styles.detectionItem}>
              <View style={styles.detectionIcon}>
                <Ionicons name="phone-portrait-outline" size={24} color="#EF4444" />
              </View>
              <Text style={styles.detectionCount}>{detections.phoneUse}</Text>
              <Text style={styles.detectionLabel}>Phone Use</Text>
            </View>
            <View style={styles.detectionItem}>
              <View style={styles.detectionIcon}>
                <Ionicons name="alert-circle-outline" size={24} color="#6366F1" />
              </View>
              <Text style={styles.detectionCount}>{detections.distracted}</Text>
              <Text style={styles.detectionLabel}>Distracted</Text>
            </View>
          </View>
        </View>

        {/* Control Button */}
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
            {isMonitoring ? 'Stop Monitoring' : 'Start AI Monitoring'}
          </Text>
        </TouchableOpacity>

        {/* Status Indicator */}
        {isMonitoring && (
          <View style={styles.statusContainer}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>
              MediaPipe Face Detection Active
            </Text>
          </View>
        )}

        {/* Info Text */}
        {!isMonitoring && (
          <Text style={styles.infoText}>
            AI-powered monitoring using MediaPipe face mesh detection
          </Text>
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
    height: '50%',
    backgroundColor: 'black',
    overflow: 'hidden',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  faceGuide: {
    position: 'absolute',
    top: '15%',
    left: '20%',
    width: '60%',
    height: '70%',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 2,
    borderRadius: 20,
  },
  faceGuideCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#3B82F6',
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  cameraControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 25,
  },
  liveIndicator: {
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
    opacity: 1,
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
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  timerLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  timerValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  safetyScore: {
    alignItems: 'center',
  },
  safetyScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  safetyScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  detectionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detectionsTitle: {
    fontSize: 16,
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
  detectionIcon: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  detectionCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  detectionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
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
    marginTop: 12,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});