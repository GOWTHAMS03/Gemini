import React, { useState, useEffect } from 'react';
import { 
  dashboardApi, 
  ApiDashboardKpis, 
  ApiDashboardAnalytics 
} from '../services/apiService';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Factory,
  Boxes,
  Activity,
  RefreshCw,
  ArrowUpRight,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'production' | 'sales' | 'operating'>('production');
  const [showThisYear, setShowThisYear] = useState(true);
  const [showTarget, setShowTarget] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'Today' | 'This Week' | 'This Month' | 'This Year'>('Today');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Live KPI Data State from Backend API
  const [kpis, setKpis] = useState<ApiDashboardKpis>({
    todayProductionUnits: 0,
    todaySalesRevenue: 0,
    activeDispatchesCount: 0,
    completedDeliveriesCount: 0,
    totalVehiclesCount: 0,
    totalPendingPayments: 0,
    lowStockAlertsCount: 0,
    lowStockItemsDescription: 'All Stock Healthy',
    expiringBatchesCount: 0,
    productionEfficiencyPercentage: 100.0,
    productionChangePercentage: 0.0,
    salesChangePercentage: 0.0,
    fleetDispatchPercentage: 0.0,
  });

  // Live Analytics Data State from Backend API
  const [analytics, setAnalytics] = useState<ApiDashboardAnalytics>({
    productionVelocity: [],
    weeklyRevenue: [],
    machineEfficiency: [],
    rawMaterialStocks: [],
    routeCoverageShare: [],
  });

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, anaRes] = await Promise.all([
        dashboardApi.getKpis(),
        dashboardApi.getAnalytics().catch(() => ({ data: null })),
      ]);

      if (kpiRes && kpiRes.data) {
        setKpis(kpiRes.data);
      }
      if (anaRes && anaRes.data) {
        setAnalytics(anaRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format chart data based on active tab
  const getActiveChartData = () => {
    if (activeTab === 'sales') {
      return (analytics.weeklyRevenue || []).map(item => ({
        time: item.day,
        thisYear: item.revenue || 0,
        target: item.target || 0,
        sales: item.revenue || 0,
      }));
    }
    if (activeTab === 'operating') {
      return (analytics.machineEfficiency || []).map(item => ({
        time: item.name,
        thisYear: item.actualOutput || 0,
        target: item.targetOutput || 0,
        sales: item.actualOutput || 0,
      }));
    }
    return (analytics.productionVelocity || []).map(item => ({
      time: item.time,
      thisYear: item.actual || 0,
      target: item.target || 0,
      sales: item.actual || 0,
    }));
  };

  const currentChartData = getActiveChartData();

  return (
    <div className="space-y-6 pt-1">
      {/* Executive Control Tower Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Bread Factory ERP Executive Control Tower
            </h1>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              100% Real-Time Database Metrics
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Live telemetry for factory output batches, sales invoices, fleet route execution, raw material safety levels, and receivables
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadDashboardData}
            className="p-2 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-xs text-[#1C1C1C] dark:text-slate-200 font-bold bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 px-3.5 py-2 rounded-xl shadow-2xs hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
              <span>{timePeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-11 w-40 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl shadow-lg z-30 py-1 text-xs">
                {(['Today', 'This Week', 'This Month', 'This Year'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setTimePeriod(option);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 font-semibold flex items-center justify-between transition ${
                      timePeriod === option ? 'bg-[#F4F5F7] dark:bg-slate-700 text-[#1C1C1C] dark:text-white font-extrabold' : 'text-[#8C8C8C] dark:text-slate-300 hover:bg-[#F7F9FB] dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{option}</span>
                    {timePeriod === option && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Production */}
        <div className="bg-[#E5ECF6] dark:bg-[#1D2636] border border-transparent dark:border-[#2D3A50] rounded-2xl p-5 space-y-3 transition-all duration-200 hover:-translate-y-0.5 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1C1C1C] dark:text-slate-300">Today Production</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-600 dark:text-indigo-300">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
                {kpis.todayProductionUnits?.toLocaleString() || 0}
              </span>
              <span className="text-xs font-semibold text-[#8C8C8C] dark:text-slate-400">Pkts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-0.5">
                {kpis.productionEfficiencyPercentage}% Efficiency <TrendingUp className="w-3 h-3" />
              </span>
              <span className="text-[10px] text-[#8C8C8C] dark:text-slate-400 font-medium">Live Output</span>
            </div>
          </div>
        </div>

        {/* Today Invoiced Sales */}
        <div className="bg-[#E3F5FF] dark:bg-[#152A38] border border-transparent dark:border-[#203D52] rounded-2xl p-5 space-y-3 transition-all duration-200 hover:-translate-y-0.5 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1C1C1C] dark:text-slate-300">Today Invoiced Sales</span>
            <div className="p-2 rounded-xl bg-sky-500/10 dark:bg-sky-400/20 text-sky-600 dark:text-sky-300">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
                ₹{kpis.todaySalesRevenue?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-0.5">
                Real-time <ArrowUpRight className="w-3 h-3" />
              </span>
              <span className="text-[10px] text-[#8C8C8C] dark:text-slate-400 font-medium">Billed Sales</span>
            </div>
          </div>
        </div>

        {/* Fleet Trucks Dispatched */}
        <div className="bg-[#F3E8FF] dark:bg-[#281D38] border border-transparent dark:border-[#3D2C54] rounded-2xl p-5 space-y-3 transition-all duration-200 hover:-translate-y-0.5 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1C1C1C] dark:text-slate-300">Fleet Trucks Dispatched</span>
            <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-400/20 text-purple-600 dark:text-purple-300">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
                {kpis.activeDispatchesCount || 0} Vans
              </span>
              <span className="text-xs font-semibold text-emerald-600">
                {kpis.totalVehiclesCount > 0 ? `${kpis.fleetDispatchPercentage}% Active` : 'Fleet Ready'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20 inline-flex items-center gap-0.5">
                {kpis.totalVehiclesCount || 0} Total Vehicles
              </span>
              <span className="text-[10px] text-[#8C8C8C] dark:text-slate-400 font-medium">{kpis.completedDeliveriesCount || 0} Delivered</span>
            </div>
          </div>
        </div>

        {/* Raw Material Reorder Alerts */}
        <div className="bg-[#E5F2FE] dark:bg-[#1A2C3D] border border-transparent dark:border-[#263E57] rounded-2xl p-5 space-y-3 transition-all duration-200 hover:-translate-y-0.5 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1C1C1C] dark:text-slate-300">Raw Material Reorder</span>
            <div className={`p-2 rounded-xl ${kpis.lowStockAlertsCount > 0 ? 'bg-rose-500/10 dark:bg-rose-400/20 text-rose-600 dark:text-rose-300' : 'bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-300'}`}>
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-extrabold tracking-tight ${kpis.lowStockAlertsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {kpis.lowStockAlertsCount || 0} Items
              </span>
              <span className="text-xs font-semibold text-[#8C8C8C] dark:text-slate-400">
                {kpis.lowStockAlertsCount > 0 ? 'Below Min' : 'Healthy'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-0.5 ${
                kpis.lowStockAlertsCount > 0 
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20' 
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              }`}>
                {kpis.lowStockItemsDescription || 'All Stock Healthy'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CHART SECTION 1: DYNAMIC VELOCITY AREA CHART WITH REAL DB DATA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0F2F5] dark:border-slate-700 pb-3">
            <div className="flex gap-4 text-xs font-bold">
              <button 
                onClick={() => setActiveTab('production')}
                className={`pb-3 -mb-3 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'production' 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold' 
                    : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C]'
                }`}
              >
                <Package className="w-3.5 h-3.5" /> Production Hourly Velocity
              </button>

              <button 
                onClick={() => setActiveTab('sales')}
                className={`pb-3 -mb-3 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'sales' 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold' 
                    : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" /> Weekly Revenue Trend
              </button>

              <button 
                onClick={() => setActiveTab('operating')}
                className={`pb-3 -mb-3 transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'operating' 
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-extrabold' 
                    : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Machine Line Efficiency
              </button>
            </div>

            <div className="flex gap-4 text-xs font-semibold">
              <button 
                onClick={() => setShowThisYear(!showThisYear)}
                className={`flex items-center gap-1.5 transition cursor-pointer ${
                  showThisYear ? 'text-[#1C1C1C] dark:text-slate-200 font-bold' : 'text-[#A0A0A0] line-through'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showThisYear ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                <span>Actual Output</span>
              </button>

              <button 
                onClick={() => setShowTarget(!showTarget)}
                className={`flex items-center gap-1.5 transition cursor-pointer ${
                  showTarget ? 'text-[#8C8C8C] dark:text-slate-400 font-bold' : 'text-[#A0A0A0] line-through'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showTarget ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                <span>Shift Target</span>
              </button>
            </div>
          </div>

          <div className="h-[270px] min-h-[270px] w-full">
            {currentChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8C8C8C] dark:text-slate-400 space-y-2">
                <Factory className="w-8 h-8 opacity-40" />
                <p className="text-xs">No active production runs or invoices recorded yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={currentChartData}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#34D399" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                    tickFormatter={(val) => {
                      if (activeTab === 'sales') return `₹${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`;
                      if (activeTab === 'operating') return `${val}`;
                      return `${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`;
                    }} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                    formatter={(value: any, name: any) => [
                      activeTab === 'sales' ? `₹${value.toLocaleString()}` : `${value.toLocaleString()} Pkts`,
                      name === 'thisYear' ? 'Actual Quantity' : 'Shift Target'
                    ]}
                  />
                  {showThisYear && (
                    <Area type="monotone" dataKey="thisYear" stroke="#38BDF8" strokeWidth={3} fillOpacity={1} fill="url(#actualGradient)" />
                  )}
                  {showTarget && (
                    <Area type="monotone" dataKey="target" stroke="#34D399" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#targetGradient)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Route Delivery Coverage Share Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-500" />
              Route Delivery Coverage Share
            </h3>
            <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Live delivery completion across active routes</p>
          </div>

          <div className="space-y-4">
            {(!analytics.routeCoverageShare || analytics.routeCoverageShare.length === 0) ? (
              <div className="py-8 text-center text-[#8C8C8C] dark:text-slate-400 text-xs">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>No delivery routes created in database yet.</span>
              </div>
            ) : (
              analytics.routeCoverageShare.map((route, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1C1C1C] dark:text-slate-200 truncate max-w-[180px]">{route.name}</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">{route.value}% ({route.count} Outlets)</span>
                  </div>
                  <div className="w-full bg-[#F4F5F7] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${route.value}%`, backgroundColor: route.color || '#38BDF8' }}></div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] font-semibold flex items-center justify-between">
            <span>Overall Active Dispatches:</span>
            <strong className="text-blue-600 dark:text-blue-400 font-extrabold">{kpis.activeDispatchesCount || 0} On Route</strong>
          </div>
        </div>
      </div>

      {/* CHART SECTION 2: MACHINE EFFICIENCY & REAL RAW MATERIAL THRESHOLDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Factory Line Yield Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                <Factory className="w-4 h-4 text-blue-500" />
                Factory Line Output & Yield Comparison
              </h3>
              <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Actual produced vs planned targets from database</p>
            </div>
          </div>

          <div className="h-[250px] min-h-[250px] w-full">
            {(!analytics.machineEfficiency || analytics.machineEfficiency.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-[#8C8C8C] dark:text-slate-400 space-y-2">
                <Factory className="w-8 h-8 opacity-30" />
                <p className="text-xs">No active production runs available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.machineEfficiency} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: '#F8FAFC', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [
                      `${value.toLocaleString()} Pkts`,
                      name === 'actualOutput' ? 'Actual Yield' : 'Target Target'
                    ]}
                  />
                  <Bar dataKey="actualOutput" radius={[6, 6, 0, 0]}>
                    {analytics.machineEfficiency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#38BDF8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Real Raw Material Inventory Thresholds */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-500" />
                Raw Material Stock vs Reorder Safety Threshold
              </h3>
              <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Current warehouse inventory levels compared against minimum safety alerts</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {(!analytics.rawMaterialStocks || analytics.rawMaterialStocks.length === 0) ? (
              <div className="py-10 text-center text-[#8C8C8C] dark:text-slate-400 text-xs">
                <Boxes className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>No raw materials found in warehouse catalog.</span>
              </div>
            ) : (
              analytics.rawMaterialStocks.map((mat, i) => (
                <div key={i} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[#1C1C1C] dark:text-slate-100 flex items-center gap-1.5">
                      {mat.name}
                      {mat.isLow && (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                          LOW ALERT
                        </span>
                      )}
                    </span>
                    <span className={`font-bold ${mat.isLow ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {mat.currentStock?.toLocaleString() || 0} / {mat.minStock?.toLocaleString() || 0} Min
                    </span>
                  </div>
                  <div className="w-full bg-[#F4F5F7] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${mat.isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.max(5, mat.fillPercent || 0))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

