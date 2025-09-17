import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TripData {
  id: string;
  date: string;
  duration: string;
  distance: string;
  alerts: number;
  score: number;
}

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<TripData[]>([
    {
      id: '1',
      date: '2024-01-15',
      duration: '45 min',
      distance: '25 km',
      alerts: 2,
      score: 85,
    },
    {
      id: '2',
      date: '2024-01-14',
      duration: '30 min',
      distance: '15 km',
      alerts: 0,
      score: 95,
    },
    {
      id: '3',
      date: '2024-01-13',
      duration: '1h 15min',
      distance: '60 km',
      alerts: 5,
      score: 72,
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch latest trips from API
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>This Week Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8.5h</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>350km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>87</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>
      </View>

      <View style={styles.tripsContainer}>
        <Text style={styles.sectionTitle}>Recent Trips</Text>
        {trips.map(trip => (
          <TouchableOpacity key={trip.id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripInfo}>
                <Text style={styles.tripDate}>{formatDate(trip.date)}</Text>
                <View style={styles.tripDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{trip.duration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{trip.distance}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="alert-circle-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{trip.alerts} alerts</Text>
                  </View>
                </View>
              </View>
              <View style={styles.scoreContainer}>
                <Text
                  style={[
                    styles.scoreValue,
                    { color: getScoreColor(trip.score) },
                  ]}
                >
                  {trip.score}
                </Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {trips.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyText}>No trips recorded yet</Text>
          <Text style={styles.emptySubtext}>
            Start monitoring to record your driving sessions
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  summaryContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  tripsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tripCard: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripInfo: {
    flex: 1,
  },
  tripDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tripDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});