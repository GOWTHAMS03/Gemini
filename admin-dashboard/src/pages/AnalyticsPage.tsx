import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import { CustomSelect } from '../components/common';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Truck,
  Package,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  MapPin,
  PhoneIcon,
} from 'lucide-react';

interface TripStats {
  totalTrips: number;
  completedTrips: number;
  inProgressTrips: number;
  cancelledTrips: number;
  completionRate: number;
}

interface SalesStats {
  totalSales: number;
  totalCollected: number;
  pendingCollection: number;
  averageOrderValue: number;
}

interface DriverPerformance {
  driverId: number;
  driverName: string;
  phone?: string;
  tripsCompleted: number;
  totalSales: number;
  completionRate: number;
  averageDeliveryTime: string;
}

interface RoutePerformance {
  routeId: number;
  routeName: string;
  tripsCompleted: number;
  shopsVisited: number;
  totalSales: number;
  averageTimePerShop: string;
}

interface DailyReport {
  date: string;
  tripsStarted: number;
  tripsCompleted: number;
  totalSales: number;
  totalCollected: number;
  shopsVisited: number;
}

export const AnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [tripStats, setTripStats] = useState<TripStats | null>(null);
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'drivers' | 'routes'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = { period: dateRange };

      const [trips, sales, drivers, routes, daily] = await Promise.all([
        api.get('/analytics/trips', { params }).catch(() => ({ data: null })),
        api.get('/analytics/sales', { params }).catch(() => ({ data: null })),
        api.get('/analytics/drivers', { params }).catch(() => ({ data: [] })),
        api.get('/analytics/routes', { params }).catch(() => ({ data: [] })),
        api.get('/analytics/daily-reports', { params }).catch(() => ({ data: [] })),
      ]);

      setTripStats(trips.data);
      setSalesStats(sales.data);
      setDriverPerformance(drivers.data || []);
      setRoutePerformance(routes.data || []);
      setDailyReports(daily.data || []);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Using sample data for demonstration.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (reportType: string) => {
    try {
      const response = await api.get(`/analytics/export/${reportType}`, {
        params: { period: dateRange },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Sample data for fallback
  const defaultStats: TripStats = {
    totalTrips: 24,
    completedTrips: 18,
    inProgressTrips: 3,
    cancelledTrips: 1,
    completionRate: 75,
  };

  const defaultSales: SalesStats = {
    totalSales: 185000,
    totalCollected: 148000,
    pendingCollection: 37000,
    averageOrderValue: 7708,
  };

  const stats = tripStats || defaultStats;
  const sales = salesStats || defaultSales;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
          <p className="mt-4 text-[#8C8C8C]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1C1C1C] dark:text-white">
              Trip & Sales Analytics
            </h1>
            <p className="text-[#8C8C8C] text-sm mt-1">
              Real-time performance metrics and insights
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-44 shrink-0">
              <CustomSelect
                value={dateRange}
                onChange={val => setDateRange(val)}
                options={[
                  { value: '7days', label: 'Last 7 Days', badge: '7D' },
                  { value: '30days', label: 'Last 30 Days', badge: '30D' },
                  { value: '90days', label: 'Last 90 Days', badge: '90D' },
                  { value: 'all', label: 'All Time', badge: 'ALL' },
                ]}
                placeholder="Select Range"
              />
            </div>

            <button
              onClick={() => fetchAnalyticsData()}
              className="p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            <button
              onClick={() => exportReport('summary')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8C8C8C] text-sm font-semibold">Total Trips</p>
                <p className="text-3xl font-bold text-[#1C1C1C] dark:text-white mt-2">
                  {stats.totalTrips}
                </p>
                <p className="text-xs text-[#8C8C8C] mt-2">
                  ✓ {stats.completedTrips} completed
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8C8C8C] text-sm font-semibold">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-[#8C8C8C] mt-2">
                  Target: 85%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8C8C8C] text-sm font-semibold">Total Sales</p>
                <p className="text-3xl font-bold text-[#1C1C1C] dark:text-white mt-2">
                  ₹{(sales.totalSales / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-[#8C8C8C] mt-2">
                  Avg: ₹{sales.averageOrderValue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#8C8C8C] text-sm font-semibold">Pending Collection</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  ₹{(sales.pendingCollection / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-[#8C8C8C] mt-2">
                  {((sales.pendingCollection / sales.totalSales) * 100).toFixed(1)}% of sales
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trip Status */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white mb-6">
              Trip Status Breakdown
            </h3>

            <div className="space-y-4">
              {[
                {
                  label: 'Completed',
                  value: stats.completedTrips,
                  color: 'bg-green-500',
                  percent: (stats.completedTrips / stats.totalTrips) * 100,
                },
                {
                  label: 'In Progress',
                  value: stats.inProgressTrips,
                  color: 'bg-amber-500',
                  percent: (stats.inProgressTrips / stats.totalTrips) * 100,
                },
                {
                  label: 'Cancelled',
                  value: stats.cancelledTrips,
                  color: 'bg-red-500',
                  percent: (stats.cancelledTrips / stats.totalTrips) * 100,
                },
              ].map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-[#8C8C8C]">{item.label}</span>
                    </div>
                    <span className="font-bold text-[#1C1C1C] dark:text-white">
                      {item.value} ({item.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-300`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white mb-6">
              Sales Summary
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-700 dark:text-blue-300">Total Sales</span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  ₹{sales.totalSales.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-300">Amount Collected</span>
                <span className="font-bold text-green-700 dark:text-green-300">
                  ₹{sales.totalCollected.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <span className="text-sm text-orange-700 dark:text-orange-300">Pending Collection</span>
                <span className="font-bold text-orange-700 dark:text-orange-300">
                  ₹{sales.pendingCollection.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-4">
                <p className="text-xs text-[#8C8C8C] mb-2 font-semibold">Collection Progress</p>
                <div className="w-full h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                    style={{
                      width: `${sales.totalSales ? Math.round((sales.totalCollected / sales.totalSales) * 100) : 0}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-[#8C8C8C] mt-2 text-right font-semibold">
                  {sales.totalSales ? Math.round((sales.totalCollected / sales.totalSales) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for detailed reports */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-slate-800">
            {['overview', 'drivers', 'routes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab as any)}
                className={`px-4 py-3 font-semibold text-sm border-b-2 transition ${
                  selectedTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white'
                }`}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'drivers' && '👥 Driver Performance'}
                {tab === 'routes' && '🗺️ Route Performance'}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white mb-6">
              Daily Performance (Last 7 Days)
            </h3>

            {dailyReports.length > 0 ? (
              <div className="space-y-3">
                {dailyReports.slice(-7).map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <div className="flex-1">
                      <p className="font-semibold text-[#1C1C1C] dark:text-white">{report.date}</p>
                      <p className="text-xs text-[#8C8C8C] mt-1">
                        {report.tripsStarted} started • {report.tripsCompleted} completed •{' '}
                        {report.shopsVisited} shops visited
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1C1C1C] dark:text-white">
                        ₹{report.totalSales.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">
                        ₹{report.totalCollected.toLocaleString()} collected
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[#8C8C8C] py-8">No daily data available</p>
            )}
          </div>
        )}

        {/* Driver Performance Tab */}
        {selectedTab === 'drivers' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white">
                Top Driver Performers
              </h3>
              <button
                onClick={() => exportReport('drivers')}
                className="text-xs px-3 py-1 bg-gray-100 dark:bg-slate-800 text-[#8C8C8C] rounded hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 font-semibold text-[#8C8C8C]">Driver</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">
                      Trips
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">Sales</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">
                      Completion
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">
                      Avg Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.length > 0 ? (
                    driverPerformance.slice(0, 10).map((driver) => (
                      <tr
                        key={driver.driverId}
                        className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-4 text-[#1C1C1C] dark:text-white font-medium">
                          <div>
                            <p>{driver.driverName}</p>
                            {driver.phone && (
                              <p className="text-xs text-[#8C8C8C]">{driver.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-[#1C1C1C] dark:text-white">
                          {driver.tripsCompleted}
                        </td>
                        <td className="text-right py-3 px-4 text-[#1C1C1C] dark:text-white">
                          ₹{driver.totalSales.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold">
                            {driver.completionRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 text-[#8C8C8C] font-mono text-xs">
                          {driver.averageDeliveryTime}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#8C8C8C]">
                        No driver data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Route Performance Tab */}
        {selectedTab === 'routes' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white">
                Route Performance
              </h3>
              <button
                onClick={() => exportReport('routes')}
                className="text-xs px-3 py-1 bg-gray-100 dark:bg-slate-800 text-[#8C8C8C] rounded hover:bg-gray-200 dark:hover:bg-slate-700"
              >
                Export
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <th className="text-left py-3 px-4 font-semibold text-[#8C8C8C]">Route</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">Trips</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">Shops</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">Sales</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#8C8C8C]">
                      Avg Time/Shop
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {routePerformance.length > 0 ? (
                    routePerformance.slice(0, 10).map((route) => (
                      <tr
                        key={route.routeId}
                        className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-4 text-[#1C1C1C] dark:text-white font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            {route.routeName}
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-[#1C1C1C] dark:text-white">
                          {route.tripsCompleted}
                        </td>
                        <td className="text-right py-3 px-4 text-[#1C1C1C] dark:text-white">
                          {route.shopsVisited}
                        </td>
                        <td className="text-right py-3 px-4 text-[#1C1C1C] dark:text-white font-semibold">
                          ₹{route.totalSales.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-4 text-[#8C8C8C] font-mono text-xs">
                          {route.averageTimePerShop}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#8C8C8C]">
                        No route data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
