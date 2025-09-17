import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayTrips: 0,
    weekTrips: 0,
    totalAlerts: 0,
    safetyScore: 85,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch latest stats from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleStartMonitoring = () => {
    navigation.navigate('Monitoring' as never);
  };

  const handleViewHistory = () => {
    navigation.navigate('History' as never);
  };

  const handleProfile = () => {
    navigation.navigate('Profile' as never);
  };

  const handleCalibration = () => {
    navigation.navigate('Calibration' as never);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome, Driver</Text>
        <TouchableOpacity onPress={signOut}>
          <Ionicons name="log-out-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="car-outline" size={32} color="#3B82F6" />
          <Text style={styles.statValue}>{stats.todayTrips}</Text>
          <Text style={styles.statLabel}>Today's Trips</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={32} color="#10B981" />
          <Text style={styles.statValue}>{stats.weekTrips}</Text>
          <Text style={styles.statLabel}>Week Trips</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
          <Text style={styles.statValue}>{stats.totalAlerts}</Text>
          <Text style={styles.statLabel}>Total Alerts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="shield-checkmark-outline" size={32} color="#6366F1" />
          <Text style={styles.statValue}>{stats.safetyScore}%</Text>
          <Text style={styles.statLabel}>Safety Score</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionButton} onPress={handleStartMonitoring}>
          <View style={styles.actionButtonContent}>
            <Ionicons name="play-circle" size={40} color="#3B82F6" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Start Monitoring</Text>
              <Text style={styles.actionDescription}>Begin a new driving session</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleViewHistory}>
          <View style={styles.actionButtonContent}>
            <Ionicons name="time-outline" size={40} color="#10B981" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Trip History</Text>
              <Text style={styles.actionDescription}>View past driving sessions</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleProfile}>
          <View style={styles.actionButtonContent}>
            <Ionicons name="person-circle-outline" size={40} color="#6366F1" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Profile Settings</Text>
              <Text style={styles.actionDescription}>Manage your account</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleCalibration}>
          <View style={styles.actionButtonContent}>
            <Ionicons name="settings-outline" size={40} color="#F59E0B" />
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Calibrate Detection</Text>
              <Text style={styles.actionDescription}>Personalize drowsiness thresholds</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: 'white',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});