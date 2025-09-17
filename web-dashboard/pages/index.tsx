import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../src/components/Layout/DashboardLayout';
import { withAuth } from '../src/hooks/useAuth';
import { apiService } from '../src/services/api';
import { SessionStats, AlertStats } from '../src/types';

interface DashboardMetrics {
  totalDrivers: number;
  activeSessions: number;
  totalAlerts: number;
  severeAlerts: number;
  avgSessionDuration: number;
  totalDistance: number;
}

const Dashboard: NextPage = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sessionData, alertData] = await Promise.all([
          apiService.getSessionStats({ days: 30 }),
          apiService.getAlertStats({ days: 30 }),
        ]);

        setSessionStats(sessionData);
        setAlertStats(alertData);

        // Calculate dashboard metrics
        const severeAlerts = alertData.bySeverity.find(s => s.severity === 'severe')?.total || 0;
        const totalAlerts = alertData.bySeverity.reduce((sum, s) => sum + s.total, 0);

        setMetrics({
          totalDrivers: 0, // Would need a separate endpoint
          activeSessions: 0, // Would need a separate endpoint
          totalAlerts,
          severeAlerts,
          avgSessionDuration: sessionData.averageSessionDuration,
          totalDistance: sessionData.totalDistance,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (km: number): string => {
    if (km >= 1000) {
      return `${(km / 1000).toFixed(1)}K km`;
    }
    return `${km.toFixed(1)} km`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="alert-error">
          <p>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Drivers</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics?.totalDrivers || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sessions</dt>
                  <dd className="text-lg font-medium text-gray-900">{sessionStats?.totalSessions || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics?.totalAlerts || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-danger-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Severe Alerts</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics?.severeAlerts || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Driving Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Driving Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessionStats ? formatDuration(sessionStats.totalDrivingTime) : '0m'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Average Session</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessionStats ? formatDuration(sessionStats.averageSessionDuration) : '0m'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Distance</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessionStats ? formatDistance(sessionStats.totalDistance) : '0 km'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Breakdown</h3>
            <div className="space-y-3">
              {alertStats?.bySeverity.map((item) => (
                <div key={item.severity} className="flex justify-between">
                  <span className={`text-sm capitalize ${
                    item.severity === 'severe' ? 'text-danger-600' :
                    item.severity === 'moderate' ? 'text-warning-600' :
                    'text-yellow-600'
                  }`}>
                    {item.severity}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Trends</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Period</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessionStats?.period || 'Last 30 days'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Daily Average</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessionStats ? Math.round(sessionStats.totalSessions / 30) : 0} sessions
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Alert Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {sessionStats && metrics
                    ? ((metrics.totalAlerts / sessionStats.totalSessions) || 0).toFixed(1)
                    : '0'} per session
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/analytics"
              className="btn-primary flex items-center justify-center"
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              View Analytics
            </a>
            <a
              href="/alerts"
              className="btn-secondary flex items-center justify-center"
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              View Alerts
            </a>
            <a
              href="/sessions"
              className="btn-secondary flex items-center justify-center"
            >
              <ClockIcon className="h-5 w-5 mr-2" />
              View Sessions
            </a>
            <a
              href="/drivers"
              className="btn-secondary flex items-center justify-center"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Manage Drivers
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default withAuth(Dashboard);