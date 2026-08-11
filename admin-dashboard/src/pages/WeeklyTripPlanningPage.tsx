import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Plus, X, Search, RefreshCw, ChevronRight, ChevronLeft, ChevronDown,
  Truck, Users, MapPin, Store, Send, XCircle, Clock, CheckCircle2,
  AlertTriangle, Eye, ArrowRight, Route as RouteIcon, Calendar as CalendarIcon, Filter,
  Sparkles, TrendingUp, Check, Building2, User, Trash2, Edit3, Navigation, Layers, CheckSquare
} from 'lucide-react';
import api, {
  weeklyPlanApi, routeApi, salesDeliveryApi,
  ApiWeeklyPlan, ApiDailyTrip, ApiDailyShop,
  ApiDeliveryRoute, ApiWeeklyPlanCreate
} from '../services/apiService';

// ─── Interfaces & Helpers ───────────────────────────────────────────────────────

interface DispatchGroupOption {
  id: number;
  groupName: string;
  salesPersonName?: string;
  driverName?: string;
  vehicleNumber?: string;
  salesPersons?: { id: number; fullName: string }[];
  driver?: { id: number; fullName: string };
  vehicle?: { id: number; vehicleNumber: string };
  status: string;
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function formatDateShort(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short'
  });
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
    case 'PLANNED':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
    case 'PUBLISHED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700';
    case 'IN_PROGRESS':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700';
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700';
    case 'CANCELLED':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-700';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────────

export const WeeklyTripPlanningPage: React.FC = () => {
  // Page View Tabs: CALENDAR vs TABLE_LIST
  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'TABLE_LIST'>('CALENDAR');

  // Master Data
  const [plans, setPlans] = useState<ApiWeeklyPlan[]>([]);
  const [dispatchGroups, setDispatchGroups] = useState<DispatchGroupOption[]>([]);
  const [routes, setRoutes] = useState<ApiDeliveryRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllSalesAndDeliveryData = async () => {
    try {
      setIsClearing(true);
      await salesDeliveryApi.clearAll();
      showToast('🗑️ All Sales and Delivery data purged successfully!');
      setPlans([]);
      setSelectedPlan(null);
      setSelectedDay(null);
      setShowClearModal(false);
      loadPlans();
    } catch (err: any) {
      console.error('Failed to clear sales and delivery data:', err);
      showToast(err?.response?.data?.message || 'Failed to clear sales and delivery data');
    } finally {
      setIsClearing(false);
    }
  };

  // Calendar Week Navigation State
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);

  // Create/Edit Modal State (Stepper Form)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [formStep, setFormStep] = useState<number>(1);
  const [selectedWeekVal, setSelectedWeekVal] = useState<string>('');
  const [createForm, setCreateForm] = useState<ApiWeeklyPlanCreate>({
    dispatchGroupId: 0,
    weekStartDate: '',
    weekEndDate: '',
    notes: '',
  });
  const [formDayRoutes, setFormDayRoutes] = useState<Record<string, number>>({});

  // Duplicate Modal State
  const [duplicatingPlan, setDuplicatingPlan] = useState<ApiWeeklyPlan | null>(null);
  const [targetDuplicateWeek, setTargetDuplicateWeek] = useState<string>('');

  // Selected Plan Modal & Route Assignment State
  const [selectedPlan, setSelectedPlan] = useState<ApiWeeklyPlan | null>(null);
  const [selectedDay, setSelectedDay] = useState<ApiDailyTrip | null>(null);
  const [assignRouteModal, setAssignRouteModal] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(0);

  // Matrix Grid: expanded group row
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDuplicateSubmit = async () => {
    if (!duplicatingPlan) return;
    let targetStartDate: string | undefined = undefined;
    if (targetDuplicateWeek) {
      const [year, week] = targetDuplicateWeek.split('-W').map(Number);
      const dayOfYear = 1 + (week - 1) * 7;
      const mondayDate = new Date(year, 0, dayOfYear);
      mondayDate.setDate(mondayDate.getDate() - ((mondayDate.getDay() + 6) % 7));
      targetStartDate = mondayDate.toISOString().split('T')[0];
    }

    try {
      setIsLoading(true);
      const res = await weeklyPlanApi.duplicate(duplicatingPlan.id, targetStartDate);
      showToast(`Successfully duplicated plan ${duplicatingPlan.planNumber} to target week!`);
      setDuplicatingPlan(null);
      setTargetDuplicateWeek('');
      loadPlans();
      setSelectedPlan(res.data);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to duplicate plan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadDispatchGroups();
    loadRoutes();
  }, []);

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res = await weeklyPlanApi.getAll();
      setPlans(res.data || []);
    } catch (err: any) {
      showToast('Error loading weekly plans');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDispatchGroups = async () => {
    try {
      const res = await api.get('/dispatch-groups');
      setDispatchGroups(res.data || []);
    } catch (err) { console.error(err); }
  };

  const loadRoutes = async () => {
    try {
      const res = await routeApi.getAll();
      setRoutes(res.data || []);
    } catch (err) { console.error(err); }
  };

  // ─── Active Week Calculator ──────────────────────────────────────────────────

  const activeCalendarWeek = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + currentWeekOffset * 7);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    return {
      monday,
      saturday,
      mondayStr: monday.toISOString().split('T')[0],
      saturdayStr: saturday.toISOString().split('T')[0],
      label: `${formatDate(monday.toISOString())} — ${formatDate(saturday.toISOString())}`,
    };
  }, [currentWeekOffset]);

  const currentWeekPlan = useMemo(() => {
    return plans.find(p => {
      if (!p.weekStartDate) return false;
      return p.weekStartDate <= activeCalendarWeek.mondayStr && p.weekEndDate >= activeCalendarWeek.mondayStr;
    });
  }, [plans, activeCalendarWeek]);

  const selectedFormGroup = useMemo(() => {
    return dispatchGroups.find(g => g.id === createForm.dispatchGroupId);
  }, [dispatchGroups, createForm.dispatchGroupId]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const handleWeekChange = (val: string) => {
    setSelectedWeekVal(val);
    if (val) {
      const [year, week] = val.split('-W').map(Number);
      const dayOfYear = 1 + (week - 1) * 7;
      const mondayDate = new Date(year, 0, dayOfYear);
      mondayDate.setDate(mondayDate.getDate() - ((mondayDate.getDay() + 6) % 7));
      const satDate = new Date(mondayDate);
      satDate.setDate(mondayDate.getDate() + 5);

      setCreateForm(f => ({
        ...f,
        weekStartDate: mondayDate.toISOString().split('T')[0],
        weekEndDate: satDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleCreateOrUpdatePlan = async (publishImmediately: boolean = false) => {
    if (!createForm.dispatchGroupId || !createForm.weekStartDate) {
      showToast('Please select a dispatch group and calendar week');
      return;
    }

    try {
      setIsLoading(true);
      let planRes: ApiWeeklyPlan;

      if (editingPlanId) {
        const res = await weeklyPlanApi.update(editingPlanId, createForm);
        planRes = res.data;
      } else {
        const res = await weeklyPlanApi.create(createForm);
        planRes = res.data;
      }

      for (const day of DAY_ORDER) {
        const routeId = formDayRoutes[day];
        if (routeId) {
          await weeklyPlanApi.assignRoute(planRes.id, day, { routeId });
        }
      }

      if (publishImmediately) {
        await weeklyPlanApi.publish(planRes.id);
        showToast('Weekly plan created and published successfully!');
      } else {
        showToast(editingPlanId ? 'Weekly plan updated!' : 'Weekly plan created as Draft!');
      }

      setShowCreateModal(false);
      resetForm();
      loadPlans();
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCreateForm({ dispatchGroupId: 0, weekStartDate: '', weekEndDate: '', notes: '' });
    setSelectedWeekVal('');
    setFormDayRoutes({});
    setEditingPlanId(null);
    setFormStep(1);
  };

  const handleEditPlan = (plan: ApiWeeklyPlan) => {
    setEditingPlanId(plan.id);
    setCreateForm({
      dispatchGroupId: plan.dispatchGroupId,
      weekStartDate: plan.weekStartDate,
      weekEndDate: plan.weekEndDate,
      notes: plan.notes || '',
    });
    const dayMap: Record<string, number> = {};
    plan.dailyTrips?.forEach(d => {
      if (d.routeId) dayMap[d.dayOfWeek] = d.routeId;
    });
    setFormDayRoutes(dayMap);
    setShowCreateModal(true);
  };

  const handleDeletePlan = async (planId: number, planNumber: string) => {
    if (!confirm(`Are you sure you want to delete weekly plan ${planNumber}?`)) return;
    try {
      await weeklyPlanApi.delete(planId);
      showToast(`Plan ${planNumber} deleted`);
      loadPlans();
      if (selectedPlan?.id === planId) setSelectedPlan(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handlePublish = async (planId: number) => {
    if (!confirm('Publish this weekly plan? This will send daily trip notifications to all assigned team members.')) return;
    try {
      await weeklyPlanApi.publish(planId);
      showToast('Plan published and notifications sent!');
      loadPlans();
      if (selectedPlan?.id === planId) {
        const res = await weeklyPlanApi.getById(planId);
        setSelectedPlan(res.data);
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to publish plan');
    }
  };

  const handleAssignRoute = async () => {
    if (!selectedPlan || !selectedDay || !selectedRouteId) return;
    try {
      await weeklyPlanApi.assignRoute(selectedPlan.id, selectedDay.dayOfWeek, { routeId: selectedRouteId });
      showToast(`Route assigned to ${selectedDay.dayOfWeek}`);
      const res = await weeklyPlanApi.getById(selectedPlan.id);
      setSelectedPlan(res.data);
      const updatedDay = res.data.dailyTrips.find(d => d.dayOfWeek === selectedDay.dayOfWeek);
      if (updatedDay) setSelectedDay(updatedDay);
      setAssignRouteModal(false);
      setSelectedRouteId(0);
      loadPlans();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to assign route');
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      const matchSearch = !searchQuery ||
        p.planNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.dispatchGroupName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [plans, searchQuery, selectedStatus]);

  const stats = useMemo(() => {
    const total = plans.length;
    const draft = plans.filter(p => p.status === 'DRAFT').length;
    const published = plans.filter(p => p.status === 'PUBLISHED').length;
    const inProgress = plans.filter(p => p.status === 'IN_PROGRESS').length;
    const totalShops = plans.reduce((sum, p) => sum + (p.totalShops || 0), 0);
    return { total, draft, published, inProgress, totalShops };
  }, [plans]);

  // ─── Weekly Matrix: Dispatch Group × Day grid ────────────────────────────────
  const weeklyMatrix = useMemo(() => {
    return dispatchGroups.map(group => {
      // Find plan for this group matching the active calendar week
      const plan = plans.find(p => {
        if (p.dispatchGroupId !== group.id) return false;
        if (!p.weekStartDate) return false;
        return p.weekStartDate <= activeCalendarWeek.mondayStr && p.weekEndDate >= activeCalendarWeek.mondayStr;
      });

      const dayAssignments: Record<string, { assigned: boolean; routeName?: string; shopCount?: number; routeId?: number | null; distanceKm?: number }> = {};
      DAY_ORDER.forEach(day => {
        const dt = plan?.dailyTrips?.find(d => d.dayOfWeek === day);
        dayAssignments[day] = {
          assigned: dt?.routeId != null,
          routeName: dt?.routeName || undefined,
          shopCount: dt?.totalShops || 0,
          routeId: dt?.routeId,
          distanceKm: dt?.totalDistanceKm || 0,
        };
      });

      const assignedDays = Object.values(dayAssignments).filter(d => d.assigned).length;

      return { group, plan, dayAssignments, assignedDays };
    });
  }, [dispatchGroups, plans, activeCalendarWeek]);

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-slate-900 text-emerald-400 border border-emerald-500/50 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 right-6 z-[999999] max-w-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white hover:opacity-75 cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Styled Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Weekly Trip Dispatch & Route Planning
            </h1>
            <span className="text-[10px] font-extrabold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
              Weekly Route Manager
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Design weekly schedules, assign routes & shops to specific days, and notify drivers and sales representatives.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadPlans}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800"
            title="Delete All Sales and Delivery Data"
          >
            <Trash2 className="w-4 h-4" /> Purge All Sales Data
          </button>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black dark:hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Weekly Plan
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Plans */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Total Weekly Plans</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white">{stats.total}</span>
          </div>
        </div>

        {/* Card 2: Draft Plans */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Draft Plans</span>
            <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white">{stats.draft}</span>
          </div>
        </div>

        {/* Card 3: Published Plans */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Published Plans</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.published}</span>
          </div>
        </div>

        {/* Card 4: In Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">In Progress</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.inProgress}</span>
          </div>
        </div>

        {/* Card 5: Shops Scheduled */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Shops Scheduled</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.totalShops}</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border shrink-0 flex items-center gap-2 ${
              activeTab === 'CALENDAR'
                ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C] dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Weekly Calendar Schedule
          </button>
          <button
            onClick={() => setActiveTab('TABLE_LIST')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border shrink-0 flex items-center gap-2 ${
              activeTab === 'TABLE_LIST'
                ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C] dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> All Weekly Plans ({plans.length})
          </button>
        </div>

        {activeTab === 'CALENDAR' && (
          <div className="flex items-center gap-3 bg-[#F8F9FA] dark:bg-slate-900 p-1.5 rounded-xl border border-[#E9ECEF] dark:border-slate-700">
            <button
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1.5 hover:bg-[#E9ECEF] dark:hover:bg-slate-700 rounded-lg text-[#1C1C1C] dark:text-slate-200"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-[#1C1C1C] dark:text-white px-2">
              {activeCalendarWeek.label}
            </span>
            <button
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1.5 hover:bg-[#E9ECEF] dark:hover:bg-slate-700 rounded-lg text-[#1C1C1C] dark:text-slate-200"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {currentWeekOffset !== 0 && (
              <button
                onClick={() => setCurrentWeekOffset(0)}
                className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[11px] font-bold border border-purple-500/20"
              >
                Current Week
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: WEEKLY CALENDAR SCHEDULE MATRIX                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-4">
          {/* Matrix Summary Strip */}
          <div className="bg-[#1C1C1C] dark:bg-slate-900 text-white p-4 rounded-2xl shadow-2xs border border-[#1C1C1C] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-400/30">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold">Dispatch Group × Week Matrix</h3>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">
                  {weeklyMatrix.length} Groups • {weeklyMatrix.filter(r => r.plan).length} Plans Created • {weeklyMatrix.reduce((s, r) => s + r.assignedDays, 0)} Days Assigned
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Assigned</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500"></span> Unassigned</span>
            </div>
          </div>

          {/* ─── Matrix Grid Table ─────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[minmax(200px,2fr)_repeat(6,1fr)] bg-[#F8F9FA] dark:bg-slate-900 border-b border-[#E9ECEF] dark:border-slate-700">
              <div className="px-4 py-3 text-[10px] font-black text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Dispatch Group
              </div>
              {DAY_ORDER.map((dayName, idx) => {
                const dayDate = new Date(activeCalendarWeek.monday);
                dayDate.setDate(dayDate.getDate() + idx);
                return (
                  <div key={dayName} className="px-2 py-3 text-center border-l border-[#E9ECEF] dark:border-slate-700">
                    <span className="text-[10px] font-black text-[#1C1C1C] dark:text-white uppercase tracking-wider block">{dayName.slice(0, 3)}</span>
                    <span className="text-[10px] font-semibold text-[#8C8C8C] dark:text-slate-400">{formatDateShort(dayDate.toISOString().split('T')[0])}</span>
                  </div>
                );
              })}
            </div>

            {/* Table Body: Dispatch Group Rows */}
            {weeklyMatrix.length === 0 ? (
              <div className="text-center py-16 text-[#8C8C8C]">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-bold">No Dispatch Groups Found</p>
                <p className="text-xs mt-1">Create dispatch groups first to plan weekly trips.</p>
              </div>
            ) : (
              weeklyMatrix.map((row, rowIdx) => (
                <React.Fragment key={row.group.id}>
                  {/* ── Group Row ── */}
                  <div
                    onClick={() => setExpandedGroupId(prev => prev === row.group.id ? null : row.group.id)}
                    className={`grid grid-cols-[minmax(200px,2fr)_repeat(6,1fr)] cursor-pointer transition-all duration-200 group/row hover:bg-purple-50/50 dark:hover:bg-purple-950/20 ${
                      rowIdx < weeklyMatrix.length - 1 && expandedGroupId !== row.group.id ? 'border-b border-[#F0F2F5] dark:border-slate-700/60' : ''
                    } ${expandedGroupId === row.group.id ? 'bg-purple-50/60 dark:bg-purple-950/30' : ''}`}
                  >
                    {/* Group Name Cell */}
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition ${
                        row.plan ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-[#F0F2F5] dark:bg-slate-700 text-[#8C8C8C]'
                      }`}>
                        {expandedGroupId === row.group.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-[#1C1C1C] dark:text-white truncate">{row.group.groupName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {row.group.driverName && (
                            <span className="text-[10px] text-[#8C8C8C] dark:text-slate-400 flex items-center gap-1 truncate">
                              <Truck className="w-3 h-3" />{row.group.driverName}
                            </span>
                          )}
                          {row.group.vehicleNumber && (
                            <span className="text-[10px] text-[#8C8C8C] dark:text-slate-400 truncate">
                              • {row.group.vehicleNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      {row.plan ? (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider shrink-0 ${getStatusBadgeClass(row.plan.status)}`}>
                          {row.plan.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-700 text-[#8C8C8C] dark:text-slate-400 border border-slate-200 dark:border-slate-600 uppercase tracking-wider shrink-0">
                          No Plan
                        </span>
                      )}
                    </div>

                    {/* Day Assignment Cells */}
                    {DAY_ORDER.map(dayName => {
                      const da = row.dayAssignments[dayName];
                      return (
                        <div key={dayName} className="px-2 py-3 flex items-center justify-center border-l border-[#F0F2F5] dark:border-slate-700/60">
                          {da.assigned ? (
                            <div className="text-center group/cell">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto transition group-hover/cell:scale-110">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 truncate max-w-[80px]">{da.shopCount} shops</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="w-7 h-7 rounded-lg bg-[#F0F2F5] dark:bg-slate-700 border border-[#E9ECEF] dark:border-slate-600 flex items-center justify-center mx-auto">
                                <X className="w-3.5 h-3.5 text-[#C4C4C4] dark:text-slate-500" />
                              </div>
                              <p className="text-[9px] font-medium text-[#C4C4C4] dark:text-slate-500 mt-1">—</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Expanded Detail Panel ── */}
                  {expandedGroupId === row.group.id && (
                    <div className="border-b border-[#E9ECEF] dark:border-slate-700 bg-gradient-to-b from-purple-50/40 to-white dark:from-purple-950/20 dark:to-slate-800">
                      {row.plan ? (
                        <div className="p-5 space-y-4">
                          {/* Plan Info Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/15 rounded-xl border border-purple-500/20">
                                <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">{row.plan.planNumber}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(row.plan.status)}`}>
                                    {row.plan.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                                  {row.plan.totalShops || 0} Shops • {row.plan.totalDistanceKm?.toFixed(1) || '0'} KM Total
                                  {row.plan.driver?.fullName ? ` • Driver: ${row.plan.driver.fullName}` : ''}
                                  {row.plan.vehicle?.registrationNumber ? ` • ${row.plan.vehicle.registrationNumber}` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); weeklyPlanApi.getById(row.plan!.id).then(res => setSelectedPlan(res.data)); }}
                                className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border border-[#E9ECEF] dark:border-slate-600 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> View
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditPlan(row.plan!); }}
                                className="px-3 py-1.5 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black dark:hover:bg-purple-500 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Edit Routes
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setDuplicatingPlan(row.plan!); }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" /> Repeat
                              </button>
                              {row.plan.status === 'DRAFT' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePublish(row.plan!.id); }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" /> Publish
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Day-by-Day Route Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                            {DAY_ORDER.map((dayName, idx) => {
                              const dayDate = new Date(activeCalendarWeek.monday);
                              dayDate.setDate(dayDate.getDate() + idx);
                              const dt = row.plan!.dailyTrips?.find(d => d.dayOfWeek === dayName);
                              const hasRoute = dt?.routeId != null;
                              const shops = dt?.shops || [];

                              return (
                                <div key={dayName} className={`rounded-xl border overflow-hidden transition-all ${
                                  hasRoute
                                    ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900/40 shadow-sm'
                                    : 'bg-[#FAFAFA] dark:bg-slate-800/60 border-[#E9ECEF] dark:border-slate-700/60'
                                }`}>
                                  <div className={`px-3 py-2 flex items-center justify-between ${
                                    hasRoute ? 'bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/30' : 'bg-[#F5F5F5] dark:bg-slate-900/40 border-b border-[#ECECEC] dark:border-slate-700/50'
                                  }`}>
                                    <div>
                                      <span className="text-[10px] font-black text-[#1C1C1C] dark:text-white uppercase">{dayName.slice(0, 3)}</span>
                                      <span className="text-[10px] font-medium text-[#8C8C8C] dark:text-slate-400 ml-1.5">{formatDateShort(dayDate.toISOString().split('T')[0])}</span>
                                    </div>
                                    {hasRoute ? (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                        {shops.length} shops
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-medium text-[#C4C4C4]">Off</span>
                                    )}
                                  </div>
                                  <div className="p-2.5">
                                    {hasRoute ? (
                                      <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold text-[#1C1C1C] dark:text-white truncate flex items-center gap-1">
                                          <RouteIcon className="w-3 h-3 text-purple-600 shrink-0" />
                                          {dt?.routeName}
                                        </p>
                                        <p className="text-[9px] text-[#8C8C8C]">{dt?.totalDistanceKm?.toFixed(1) || 0} KM</p>
                                        {shops.length > 0 && (
                                          <div className="space-y-1 mt-1">
                                            {shops.slice(0, 3).map((shop, sIdx) => (
                                              <div key={shop.id || sIdx} className="flex items-center gap-1.5 text-[10px]">
                                                <span className="w-3.5 h-3.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-[8px] flex items-center justify-center shrink-0">
                                                  {shop.visitSequence}
                                                </span>
                                                <span className="text-[#1C1C1C] dark:text-slate-300 truncate">{shop.shopName}</span>
                                              </div>
                                            ))}
                                            {shops.length > 3 && (
                                              <p className="text-[9px] text-purple-600 font-bold">+{shops.length - 3} more</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center py-3 text-[#C4C4C4] dark:text-slate-500">
                                        <MapPin className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                        <p className="text-[10px]">No Route</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* No plan for this group — prompt to create */
                        <div className="p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-[#1C1C1C] dark:text-white">No plan created for <strong>{row.group.groupName}</strong> this week</p>
                              <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400 mt-0.5">{activeCalendarWeek.label}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              resetForm();
                              setCreateForm(f => ({
                                ...f,
                                dispatchGroupId: row.group.id,
                                weekStartDate: activeCalendarWeek.mondayStr,
                                weekEndDate: activeCalendarWeek.saturdayStr
                              }));
                              setShowCreateModal(true);
                            }}
                            className="px-4 py-2 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black dark:hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Create Plan
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: TABULAR LIST OF ALL WEEKLY PLANS                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'TABLE_LIST' && (
        <div className="space-y-4">
          {/* Status Pill Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['ALL', 'DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'].map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border shrink-0 ${
                    selectedStatus === st
                      ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                      : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C] dark:hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'All Statuses' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#8C8C8C] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search plan #, group name..."
                className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs text-[#1C1C1C] dark:text-white"
              />
            </div>
          </div>

          {/* Cards List */}
          {filteredPlans.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-[#E9ECEF] dark:border-slate-700 p-8">
              <CalendarDays className="w-12 h-12 text-[#8C8C8C] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-extrabold text-[#1C1C1C] dark:text-white">No Weekly Trip Plans Found</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => {
                    weeklyPlanApi.getById(plan.id).then(res => setSelectedPlan(res.data));
                  }}
                  className="bg-white dark:bg-slate-800 border border-[#F0F2F5] dark:border-slate-700 rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer group space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0F2F5] dark:border-slate-700">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-[#1C1C1C] dark:text-white">
                            {plan.planNumber}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(plan.status)}`}>
                            {plan.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#8C8C8C] dark:text-slate-400 font-medium mt-0.5">
                          Group: <strong className="text-[#1C1C1C] dark:text-slate-200">{plan.dispatchGroupName}</strong> • Range: <strong className="text-[#1C1C1C] dark:text-slate-200">{formatDate(plan.weekStartDate)} — {formatDate(plan.weekEndDate)}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-4 text-center">
                        <div>
                          <p className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">{plan.totalShops || 0}</p>
                          <p className="text-[10px] font-bold text-[#8C8C8C] uppercase">Shops</p>
                        </div>
                        <div className="h-6 w-px bg-[#E9ECEF] dark:bg-slate-700" />
                        <div>
                          <p className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">{plan.totalDistanceKm?.toFixed(1) || '0'}</p>
                          <p className="text-[10px] font-bold text-[#8C8C8C] uppercase">KM</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="p-2 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] text-[#1C1C1C] dark:text-slate-200 rounded-xl transition"
                          title="Edit Plan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDuplicatingPlan(plan)}
                          className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl transition"
                          title="Repeat Schedule for Target Week"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {plan.status === 'DRAFT' && (
                          <button
                            onClick={() => handlePublish(plan.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" /> Publish
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.planNumber)}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STEPPER CREATE / EDIT MODAL                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#F0F2F5] dark:border-slate-700 bg-[#1C1C1C] dark:bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5" />
                <h3 className="text-base font-extrabold">
                  {editingPlanId ? 'Edit Weekly Trip Plan' : 'Create Weekly Trip Plan'}
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Steps Bar */}
            <div className="px-6 py-3 bg-[#F8F9FA] dark:bg-slate-900 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-around flex-shrink-0">
              {[
                { step: 1, label: '1. Basic Setup' },
                { step: 2, label: '2. Daily Routes Setup' },
                { step: 3, label: '3. Review & Save' },
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setFormStep(s.step)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    formStep === s.step
                      ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C]'
                      : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {formStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1C1C1C] dark:text-slate-300 uppercase mb-1.5">
                      Select Dispatch Group *
                    </label>
                    <select
                      value={createForm.dispatchGroupId}
                      onChange={e => setCreateForm(f => ({ ...f, dispatchGroupId: Number(e.target.value) }))}
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-white"
                    >
                      <option value={0}>-- Select Group --</option>
                      {dispatchGroups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.groupName} {g.driverName ? `(Driver: ${g.driverName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFormGroup && (
                    <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1.5 text-xs">
                      <p className="font-bold text-purple-700 dark:text-purple-300">Team Composition Preview:</p>
                      <p className="text-[#1C1C1C] dark:text-slate-200">Driver: <strong>{selectedFormGroup.driverName || 'Not assigned'}</strong></p>
                      <p className="text-[#1C1C1C] dark:text-slate-200">Vehicle: <strong>{selectedFormGroup.vehicleNumber || 'Not assigned'}</strong></p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#1C1C1C] dark:text-slate-300 uppercase mb-1.5">
                      Select Calendar Week (Mon - Sat) *
                    </label>
                    <input
                      type="week"
                      value={selectedWeekVal}
                      onChange={e => handleWeekChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-white"
                    />
                    {createForm.weekStartDate && (
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">
                        Range: {formatDate(createForm.weekStartDate)} to {formatDate(createForm.weekEndDate)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1C1C1C] dark:text-slate-300 uppercase mb-1.5">
                      Plan Notes / Objectives
                    </label>
                    <textarea
                      value={createForm.notes || ''}
                      onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      placeholder="Special instructions..."
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs text-[#1C1C1C] dark:text-white"
                    />
                  </div>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#8C8C8C] uppercase">
                    Assign Delivery Routes to Monday – Saturday:
                  </p>
                  {DAY_ORDER.map(day => (
                    <div key={day} className="flex items-center justify-between p-3 bg-[#F8F9FA] dark:bg-slate-900 rounded-xl border border-[#E9ECEF] dark:border-slate-700 gap-3">
                      <span className="text-xs font-bold text-[#1C1C1C] dark:text-white w-24">{day}</span>
                      <select
                        value={formDayRoutes[day] || 0}
                        onChange={e => setFormDayRoutes(prev => ({ ...prev, [day]: Number(e.target.value) }))}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs text-[#1C1C1C] dark:text-white"
                      >
                        <option value={0}>-- No Route Assigned --</option>
                        {routes.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.routeName} ({r.totalShops || 0} shops • {r.totalDistanceKm?.toFixed(1) || 0} KM)
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {formStep === 3 && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 space-y-2">
                    <h4 className="font-extrabold text-[#1C1C1C] dark:text-white text-sm">Plan Summary</h4>
                    <p>Dispatch Group: <strong>{selectedFormGroup?.groupName || 'Selected Group'}</strong></p>
                    <p>Week Range: <strong>{formatDate(createForm.weekStartDate)} — {formatDate(createForm.weekEndDate)}</strong></p>
                    <p>Configured Routes: <strong>{Object.values(formDayRoutes).filter(v => v > 0).length} Days Assigned</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] dark:bg-slate-900 border-t border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setFormStep(prev => Math.max(1, prev - 1))}
                disabled={formStep === 1}
                className="px-4 py-2 text-xs font-bold text-[#8C8C8C] disabled:opacity-30 cursor-pointer"
              >
                Back
              </button>

              <div className="flex items-center gap-2">
                {formStep < 3 ? (
                  <button
                    onClick={() => setFormStep(prev => Math.min(3, prev + 1))}
                    className="px-4 py-2 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleCreateOrUpdatePlan(false)}
                      className="px-4 py-2 bg-[#F8F9FA] hover:bg-[#E9ECEF] text-[#1C1C1C] dark:bg-slate-700 dark:text-white rounded-xl text-xs font-bold border border-[#E9ECEF] transition cursor-pointer"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => handleCreateOrUpdatePlan(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      Publish Plan & Notify
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PLAN DETAIL CENTERED MODAL                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => { setSelectedPlan(null); setSelectedDay(null); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#F0F2F5] dark:border-slate-700 bg-[#1C1C1C] dark:bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <CalendarDays className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-extrabold">{selectedPlan.planNumber}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(selectedPlan.status)}`}>
                      {selectedPlan.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C8C8C] mt-0.5">
                    Group: <strong className="text-white">{selectedPlan.dispatchGroupName}</strong> • Range: {formatDate(selectedPlan.weekStartDate)} - {formatDate(selectedPlan.weekEndDate)}
                  </p>
                </div>
              </div>
              <button onClick={() => { setSelectedPlan(null); setSelectedDay(null); }} className="p-1 text-white/80 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Team Composition Info Strip */}
              <div className="grid grid-cols-3 gap-3 bg-[#F8F9FA] dark:bg-slate-900 p-4 rounded-2xl border border-[#E9ECEF] dark:border-slate-700">
                <div>
                  <p className="text-[10px] font-bold text-[#8C8C8C] uppercase">Sales Squad</p>
                  <p className="text-xs font-extrabold text-[#1C1C1C] dark:text-white mt-0.5">
                    {selectedPlan.salesPersons?.map(sp => sp.fullName).join(', ') || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8C8C8C] uppercase">Assigned Driver</p>
                  <p className="text-xs font-extrabold text-[#1C1C1C] dark:text-white mt-0.5">
                    {selectedPlan.driver?.fullName || 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#8C8C8C] uppercase">Vehicle</p>
                  <p className="text-xs font-extrabold text-[#1C1C1C] dark:text-white mt-0.5">
                    {selectedPlan.vehicle?.registrationNumber || 'Not assigned'}
                  </p>
                </div>
              </div>

              <h3 className="text-xs font-bold text-[#8C8C8C] uppercase tracking-wider">
                Day-by-Day Route & Shop Details (Monday – Saturday)
              </h3>

              <div className="space-y-3">
                {DAY_ORDER.map(dayName => {
                  const dt = selectedPlan.dailyTrips?.find(d => d.dayOfWeek === dayName);
                  const hasRoute = dt?.routeId != null;
                  const shops = dt?.shops || [];

                  return (
                    <div key={dayName} className="border border-[#F0F2F5] dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                            hasRoute ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' : 'bg-[#F8F9FA] text-[#8C8C8C]'
                          }`}>
                            {dayName.slice(0, 3)}
                          </div>
                          <div>
                            <span className="text-xs font-extrabold text-[#1C1C1C] dark:text-white">{dayName}</span>
                            <p className="text-[11px] text-[#8C8C8C]">
                              {hasRoute ? `${dt?.routeName} • ${dt?.totalShops || 0} Shops scheduled` : 'No route assigned'}
                            </p>
                          </div>
                        </div>

                        {dt && (
                          <button
                            onClick={() => { setSelectedDay(dt); setAssignRouteModal(true); }}
                            className="px-3 py-1.5 bg-[#F8F9FA] dark:bg-slate-700 text-[#1C1C1C] dark:text-white text-xs font-bold rounded-xl border border-[#E9ECEF] dark:border-slate-600 hover:bg-[#E9ECEF] transition cursor-pointer"
                          >
                            {hasRoute ? 'Change Route' : 'Assign Route'}
                          </button>
                        )}
                      </div>

                      {/* Display Shop Pills inside day card */}
                      {hasRoute && shops.length > 0 && (
                        <div className="pt-2 border-t border-[#F0F2F5] dark:border-slate-700/60 flex items-center gap-2 flex-wrap">
                          {shops.map((s, idx) => (
                            <span key={s.id || idx} className="px-2.5 py-1 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-lg text-[11px] font-medium text-[#1C1C1C] dark:text-slate-200">
                              {s.visitSequence}. {s.shopName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-[#F8F9FA] dark:bg-slate-900 border-t border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => { setSelectedPlan(null); setSelectedDay(null); }}
                className="px-4 py-2 text-xs font-bold text-[#8C8C8C] cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const planToEdit = selectedPlan;
                    setSelectedPlan(null);
                    handleEditPlan(planToEdit);
                  }}
                  className="px-4 py-2 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Edit Weekly Plan
                </button>
                {selectedPlan.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(selectedPlan.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                  >
                    Publish & Notify Team
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Route Dialog */}
      {assignRouteModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-700 bg-[#1C1C1C] dark:bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-extrabold">Assign Route to {selectedDay.dayOfWeek}</h3>
              <button onClick={() => setAssignRouteModal(false)} className="p-1 text-white/80"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {routes.map(r => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRouteId(r.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer ${selectedRouteId === r.id ? 'border-purple-600 bg-purple-500/10' : 'border-[#E9ECEF]'}`}
                >
                  <p className="text-sm font-bold text-[#1C1C1C] dark:text-white">{r.routeName}</p>
                  <p className="text-xs text-[#8C8C8C]">{r.totalShops || 0} Shops • {r.totalDistanceKm?.toFixed(1) || 0} KM</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-[#F8F9FA] dark:bg-slate-900 border-t flex justify-end gap-3">
              <button onClick={() => setAssignRouteModal(false)} className="px-4 py-2 text-xs font-bold text-[#8C8C8C]">Cancel</button>
              <button onClick={handleAssignRoute} disabled={!selectedRouteId} className="px-4 py-2 bg-[#1C1C1C] dark:bg-purple-600 text-white text-xs font-bold rounded-xl">Assign Route</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DUPLICATE PLAN FOR TARGET WEEK MODAL                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {duplicatingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F0F2F5] dark:border-slate-700 bg-[#1C1C1C] dark:bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold">Repeat Schedule for Next Week</h3>
              </div>
              <button onClick={() => setDuplicatingPlan(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs space-y-1">
                <p className="font-extrabold text-indigo-700 dark:text-indigo-300">Source Plan: {duplicatingPlan.planNumber}</p>
                <p className="text-[#1C1C1C] dark:text-slate-200">Dispatch Group: <strong>{duplicatingPlan.dispatchGroupName}</strong></p>
                <p className="text-[#1C1C1C] dark:text-slate-200">Routes & Shops: <strong>{duplicatingPlan.totalShops || 0} Shops across 6 Days</strong></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1C1C1C] dark:text-slate-300 uppercase mb-1.5">
                  Select Target Week (Optional - Defaults to Next Week)
                </label>
                <input
                  type="week"
                  value={targetDuplicateWeek}
                  onChange={e => setTargetDuplicateWeek(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-white"
                />
                <p className="text-[11px] text-[#8C8C8C] mt-1">
                  This will duplicate all daily route assignments and shop visit sequences to the target week as a new Draft plan.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F8F9FA] dark:bg-slate-900 border-t border-[#F0F2F5] dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setDuplicatingPlan(null)} className="px-4 py-2 text-xs font-bold text-[#8C8C8C]">
                Cancel
              </button>
              <button
                onClick={handleDuplicateSubmit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Duplicate Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Purging All Sales & Delivery Data */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Delete All Sales & Delivery Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanent Bulk Data Cleanup</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to purge <strong>ALL created sales, delivery dispatches, and weekly plans</strong>?
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <li>All Weekly & Daily Trip Plans</li>
              <li>All Trip Dispatches & Loaded Stock</li>
              <li>All Shop Visits & Deliveries</li>
              <li>All Sales Invoices & Credit Notes</li>
            </ul>

            <p className="text-xs text-rose-500 font-medium">⚠️ This action cannot be undone!</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllSalesAndDeliveryData}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Purging...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Yes, Delete All Sales & Delivery Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyTripPlanningPage;
