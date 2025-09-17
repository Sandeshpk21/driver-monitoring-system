import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { db } from '../utils/database';
import { getSyncService } from '../services/syncService';

interface TripData {
  id: string;
  date: string;
  duration: string;
  distance: string;
  alerts: number;
  score: number;
  syncStatus?: string;
  startTime?: string;
  endTime?: string;
}

export default function HistoryScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{
    pendingSessions: number;
    lastSync?: Date;
  }>({ pendingSessions: 0 });
  const user = useSelector((state: RootState) => state.auth.user);
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

  useEffect(() => {
    loadTripsFromDatabase();
    checkSyncStatus();
  }, []);

  const loadTripsFromDatabase = async () => {
    try {
      setLoading(true);

      // Get driver ID from user state or use default for testing
      const driverId = user?.id || 'driver-1';

      // Load sessions from SQLite
      const sessions = await db.getSessions(driverId, 20);

      // Load alerts for each session
      const tripsWithAlerts = await Promise.all(
        sessions.map(async (session) => {
          const alerts = await db.getAlerts(session.id);
          const alertCount = alerts.length;

          // Calculate session duration
          let duration = '0 min';
          if (session.end_time && session.start_time) {
            const durationMs = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
            const minutes = Math.floor(durationMs / 60000);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
              duration = `${hours}h ${minutes % 60}min`;
            } else {
              duration = `${minutes} min`;
            }
          } else if (session.duration_seconds) {
            const minutes = Math.floor(session.duration_seconds / 60);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
              duration = `${hours}h ${minutes % 60}min`;
            } else {
              duration = `${minutes} min`;
            }
          }

          // Calculate safety score
          const baseScore = 100;
          const penaltyPerAlert = 5;
          const score = Math.max(0, baseScore - (alertCount * penaltyPerAlert));

          return {
            id: session.id,
            date: session.start_time,
            duration,
            distance: session.trip_distance_km ? `${session.trip_distance_km.toFixed(1)} km` : '0 km',
            alerts: alertCount,
            score,
            syncStatus: session.sync_status,
            startTime: session.start_time,
            endTime: session.end_time,
          };
        })
      );

      // If no sessions in database, show mock data for demo
      if (tripsWithAlerts.length === 0) {
        setTrips([
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
      } else {
        setTrips(tripsWithAlerts);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      // Fall back to mock data on error
      setTrips([
        {
          id: '1',
          date: '2024-01-15',
          duration: '45 min',
          distance: '25 km',
          alerts: 2,
          score: 85,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const checkSyncStatus = async () => {
    try {
      const syncService = getSyncService(process.env.EXPO_PUBLIC_API_URL);
      const status = await syncService.getSyncStatus();
      setSyncStatus({
        pendingSessions: status.pendingSessions,
        lastSync: status.lastSyncAttempt,
      });
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripsFromDatabase();
    await checkSyncStatus();

    // Try to sync if online
    try {
      const syncService = getSyncService(process.env.EXPO_PUBLIC_API_URL);
      await syncService.syncPendingData();
      await loadTripsFromDatabase(); // Reload after sync
    } catch (error) {
      console.log('Sync failed, will retry later');
    }

    setRefreshing(false);
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
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {trips.reduce((total, trip) => {
                const match = trip.duration.match(/(\d+)h?\s*(\d+)?/);
                if (match) {
                  const hours = parseInt(match[1]) || 0;
                  const minutes = parseInt(match[2]) || 0;
                  return total + (hours * 60) + minutes;
                }
                return total;
              }, 0) > 60
                ? `${Math.floor(trips.reduce((total, trip) => {
                    const match = trip.duration.match(/(\d+)h?\s*(\d+)?/);
                    if (match) {
                      const hours = parseInt(match[1]) || 0;
                      const minutes = parseInt(match[2]) || 0;
                      return total + (hours * 60) + minutes;
                    }
                    return total;
                  }, 0) / 60)}h`
                : `${trips.reduce((total, trip) => {
                    const match = trip.duration.match(/(\d+)/);
                    return total + (parseInt(match?.[1] || '0'));
                  }, 0)}min`
              }
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {trips.reduce((total, trip) => {
                const km = parseFloat(trip.distance) || 0;
                return total + km;
              }, 0).toFixed(0)}km
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {trips.length > 0
                ? Math.round(trips.reduce((sum, trip) => sum + trip.score, 0) / trips.length)
                : 0
              }
            </Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Sync Status Indicator */}
        {syncStatus.pendingSessions > 0 && (
          <View style={styles.syncStatusContainer}>
            <Ionicons name="cloud-upload-outline" size={16} color="#F59E0B" />
            <Text style={styles.syncStatusText}>
              {syncStatus.pendingSessions} sessions pending sync
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading trip history...</Text>
        </View>
      ) : (
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
                  {trip.syncStatus === 'pending' && (
                    <View style={styles.pendingSyncBadge}>
                      <Ionicons name="cloud-offline-outline" size={12} color="#F59E0B" />
                      <Text style={styles.pendingSyncText}>Not synced</Text>
                    </View>
                  )}
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
      )}

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
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  syncStatusText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  pendingSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pendingSyncText: {
    fontSize: 10,
    color: '#F59E0B',
    marginLeft: 4,
  },
});