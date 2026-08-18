import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  Filter, 
  X, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  KeyRound, 
  CheckCircle2, 
  LayoutGrid, 
  List, 
  Plus, 
  MapPin, 
  Building2, 
  Clock, 
  TrendingUp, 
  Award,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Play,
  Truck,
  Navigation,
  Check
} from 'lucide-react';
import { salesExecutiveApi, tripApi, ApiSalesExecutive } from '../services/apiService';
import { CustomSelect } from '../components/common';

export const SalesExecutivesPage: React.FC = () => {
  const [salesExecutives, setSalesExecutives] = useState<ApiSalesExecutive[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Start & End Trip Verification State
  const [tripToStart, setTripToStart] = useState<any | null>(null);
  const [tripToEnd, setTripToEnd] = useState<any | null>(null);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [isEndingTrip, setIsEndingTrip] = useState(false);
  const [startVerificationChecked, setStartVerificationChecked] = useState(false);
  const [endVerificationChecked, setEndVerificationChecked] = useState(false);

  // Onboard / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExecutive, setEditingExecutive] = useState<ApiSalesExecutive | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [mobileAccessEnabled, setMobileAccessEnabled] = useState<boolean>(true);
  const [permissionsInput, setPermissionsInput] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [execsRes, tripsRes] = await Promise.all([
        salesExecutiveApi.getAll(),
        tripApi.getAll().catch(() => ({ data: [] }))
      ]);
      setSalesExecutives(execsRes.data || []);
      setTrips(tripsRes.data || []);
    } catch (err) {
      console.error('Error loading sales executives:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActiveTripForExec = (exec: ApiSalesExecutive) => {
    return trips.find(t => 
      (t.salesPersonId === exec.id || t.salesPersonName?.toLowerCase() === exec.fullName?.toLowerCase()) &&
      (t.status === 'IN_PROGRESS' || t.status === 'DISPATCHED' || t.status === 'DRAFT')
    );
  };

  const handleStartTripConfirmed = async () => {
    if (!tripToStart) return;
    try {
      setIsStartingTrip(true);
      await tripApi.startTrip(tripToStart.id);
      showToast(`🚀 Trip #${tripToStart.tripNumber} started successfully for ${tripToStart.salesPersonName}!`);
      setTripToStart(null);
      setStartVerificationChecked(false);
      loadData();
    } catch (err: any) {
      showToast('Failed to start trip: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleEndTripConfirmed = async () => {
    if (!tripToEnd) return;
    try {
      setIsEndingTrip(true);
      await tripApi.completeTrip(tripToEnd.id);
      showToast(`🏁 Trip #${tripToEnd.tripNumber} completed and reconciled!`);
      setTripToEnd(null);
      setEndVerificationChecked(false);
      loadData();
    } catch (err: any) {
      showToast('Failed to complete trip: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsEndingTrip(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setMobileAccessEnabled(true);
    setPermissionsInput('');
    setEditingExecutive(null);
  };

  const openOnboardModal = (exec?: ApiSalesExecutive) => {
    if (exec) {
      setEditingExecutive(exec);
      setFullName(exec.fullName);
      setUsername(exec.username);
      setPassword(''); // Keep empty unless resetting password
      setEmail(exec.email || '');
      setPhone(exec.phone || '');
      setMobileAccessEnabled(exec.mobileAccessEnabled ?? true);
      setPermissionsInput(exec.permissions ? exec.permissions.join(', ') : '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      showToast('Please fill in Full Name and Username.');
      return;
    }

    try {
      if (editingExecutive) {
        await salesExecutiveApi.update(editingExecutive.id, {
          fullName,
          email,
          phone,
          password: password.trim() ? password : undefined,
          mobileAccessEnabled,
          permissions: permissionsInput.split(',').map((p) => p.trim()).filter(Boolean),
        });
        showToast(`Sales Executive "${fullName}" updated successfully.`);
      } else {
        if (!password.trim()) {
          showToast('Password is required for onboarding a new Sales Executive.');
          return;
        }
        await salesExecutiveApi.create({
          fullName,
          username,
          password,
          email,
          phone,
          isActive: true,
          mobileAccessEnabled,
          permissions: permissionsInput.split(',').map((p) => p.trim()).filter(Boolean),
        });
        showToast(`Sales Executive "${fullName}" onboarded successfully! Mobile login ready.`);
      }

      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data || 'Failed to save Sales Executive credentials.';
      showToast(`Error: ${msg}`);
    }
  };

  const handleToggleStatus = async (exec: ApiSalesExecutive) => {
    try {
      await salesExecutiveApi.update(exec.id, { isActive: !exec.isActive });
      showToast(`Status updated for ${exec.fullName}`);
      loadData();
    } catch (err) {
      showToast('Failed to update status.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete Sales Executive "${name}"?`)) return;
    try {
      await salesExecutiveApi.delete(id);
      showToast(`Sales Executive "${name}" deleted.`);
      loadData();
    } catch (err) {
      showToast('Failed to delete user.');
    }
  };

  const filteredExecutives = salesExecutives.filter((exec) => {
    const matchesSearch =
      exec.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exec.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exec.phone && exec.phone.includes(searchQuery)) ||
      (exec.email && exec.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && exec.isActive) ||
      (statusFilter === 'INACTIVE' && !exec.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalCount = salesExecutives.length;
  const activeCount = salesExecutives.filter((e) => e.isActive).length;
  const inactiveCount = totalCount - activeCount;

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-4 bg-slate-900 text-emerald-400 border border-emerald-500/50 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 right-6 z-[999999] max-w-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white hover:opacity-75 cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header Container */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              Field Sales Executives
            </h1>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              {activeCount} Active Personnel
            </span>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-emerald-500" />
              Mobile App Access Ready
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Onboard Field Sales Representatives, create mobile app login credentials, assign delivery routes, and manage staff statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => openOnboardModal()}
            className="px-4 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Onboard Sales Executive
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider">Total Sales Staff</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#1C1C1C] dark:text-white tracking-tight">{totalCount}</span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
              Registered Staff
            </span>
          </div>
        </div>

        {/* Active Staff */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider">Active Field Staff</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#1C1C1C] dark:text-white tracking-tight">{activeCount}</span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% Active
            </span>
          </div>
        </div>

        {/* Inactive Staff */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider">Inactive Staff</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#1C1C1C] dark:text-white tracking-tight">{inactiveCount}</span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
              On Hold
            </span>
          </div>
        </div>

        {/* Mobile App Login Enabled */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider">Mobile Access</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-[#1C1C1C] dark:text-white tracking-tight">100%</span>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
              JWT Secured
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search name, username, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 text-[#1C1C1C] dark:text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Status Filter */}
          <div className="w-48 shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={val => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active Staff Only', badge: 'ACTIVE' },
                { value: 'INACTIVE', label: 'Inactive Staff Only', badge: 'OFF' },
              ]}
              placeholder="Status Filter"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center p-1 bg-[#F4F5F7] dark:bg-slate-900 rounded-2xl border border-[#E9ECEF] dark:border-slate-800 shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-xl transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
            }`}
            title="Table View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 text-center text-xs font-bold text-[#8C8C8C] dark:text-slate-400">
          Loading sales executive records from database...
        </div>
      ) : filteredExecutives.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 text-center space-y-3">
          <UserCheck className="w-12 h-12 text-[#8C8C8C] dark:text-slate-500 mx-auto" />
          <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">No Field Sales Personnel Found</h3>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-sm mx-auto">
            Click "Onboard Sales Executive" to register sales representatives for field orders and mobile app access.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExecutives.map((exec) => {
            const activeTrip = getActiveTripForExec(exec);
            return (
              <div
                key={exec.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                        {exec.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[#1C1C1C] dark:text-white">{exec.fullName}</h3>
                        <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">@{exec.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(exec)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition border ${
                        exec.isActive
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {exec.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>

                  <div className="space-y-2 pt-2 text-xs text-[#8C8C8C] dark:text-slate-400">
                    {exec.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{exec.phone}</span>
                      </div>
                    )}
                    {exec.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{exec.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Active Trip Status & Quick Controls */}
                  {activeTrip ? (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-[11px]">
                          <Navigation className="w-3.5 h-3.5 text-blue-600" />
                          {activeTrip.routeName || 'Assigned Route'}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-black font-mono ${
                          activeTrip.status === 'IN_PROGRESS'
                            ? 'bg-purple-600 text-white animate-pulse'
                            : 'bg-blue-600 text-white'
                        }`}>
                          {activeTrip.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'DISPATCHED'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-blue-700 dark:text-blue-400 font-mono">
                        <span>Trip #{activeTrip.tripNumber}</span>
                        <span>{activeTrip.totalLoadedQuantity || 0} Pkts Loaded</span>
                      </div>

                      <div className="pt-1 border-t border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1.5">
                        {activeTrip.status !== 'IN_PROGRESS' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTripToStart(activeTrip);
                              setStartVerificationChecked(false);
                            }}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" /> Start Trip Now
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTripToEnd(activeTrip);
                              setEndVerificationChecked(false);
                            }}
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-lg flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" /> End & Reconcile Trip
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-[11px] text-slate-400 font-medium">
                      Standby (No Active Trip)
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400">
                    ID: #{exec.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openOnboardModal(exec)}
                      className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-[#F8F9FA] dark:hover:bg-slate-700 rounded-lg transition"
                      title="Edit Sales Executive"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exec.id, exec.fullName)}
                      className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-[#F8F9FA] dark:hover:bg-slate-700 rounded-lg transition"
                      title="Delete Staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] dark:bg-slate-900 border-b border-[#F0F2F5] dark:border-slate-700 text-[#8C8C8C] dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Executive Name</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Mobile Access</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700 text-xs">
                {filteredExecutives.map((exec) => (
                  <tr key={exec.id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-700/50 transition">
                    <td className="p-4 font-bold text-[#1C1C1C] dark:text-white flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-white text-xs">
                        {exec.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span>{exec.fullName}</span>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">@{exec.username}</td>
                    <td className="p-4 text-[#8C8C8C] dark:text-slate-300">{exec.phone || 'N/A'}</td>
                    <td className="p-4 text-[#8C8C8C] dark:text-slate-300">{exec.email || 'N/A'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <KeyRound className="w-3 h-3 text-emerald-500" /> Active JWT
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(exec)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition border ${
                          exec.isActive
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        }`}
                      >
                        {exec.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => openOnboardModal(exec)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition"
                        title="Edit Executive"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exec.id, exec.fullName)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition"
                        title="Delete Executive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboard / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 border border-[#F0F2F5] dark:border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4 animate-in fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-base font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-500" />
                {editingExecutive ? 'Edit Sales Executive' : 'Onboard Field Sales Executive'}
              </h2>
              <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                {editingExecutive
                  ? 'Update staff profile details or reset password.'
                  : 'Register credentials for field sales and mobile app authorization.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1">
                  Mobile Login Username *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingExecutive}
                  placeholder="e.g. sales_arun"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1">
                  {editingExecutive ? 'New Password (Leave blank to keep unchanged)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingExecutive}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98400 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="arun@geminifood.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1">
                    Other Permissions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADD_SHOP, EDIT_PRICE (comma separated)"
                    value={permissionsInput}
                    onChange={(e) => setPermissionsInput(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mobileAccessEnabled}
                      onChange={(e) => setMobileAccessEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-[#F8F9FA] dark:bg-slate-900 border-[#E9ECEF] dark:border-slate-700 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-[#1C1C1C] dark:text-slate-200">
                      Enable Mobile App Access
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
                >
                  {editingExecutive ? 'Save Changes' : 'Onboard Executive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VERIFY & START SALES PERSON TRIP                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tripToStart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Verify & Start Sales Person Trip
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Trip #{tripToStart.tripNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setTripToStart(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Route:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{tripToStart.routeName || 'Standard Route'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sales Executive:</span>
                <strong className="text-indigo-600 font-bold">{tripToStart.salesPersonName || 'Executive'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Driver & Vehicle:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{tripToStart.driverName || 'Driver'} • {tripToStart.vehicleNumber || 'Van'}</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700 font-mono">
                <span className="text-slate-500 font-bold">Loaded Stock on Truck:</span>
                <span className="text-purple-600 font-black text-sm">{tripToStart.totalLoadedQuantity || 0} Pkts</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={startVerificationChecked}
                onChange={e => setStartVerificationChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-900 dark:text-emerald-200 leading-snug">
                I verify that the vehicle is inspected, stock is physically loaded, and the sales team is departing on this route now.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTripToStart(null)}
                disabled={isStartingTrip}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartTripConfirmed}
                disabled={!startVerificationChecked || isStartingTrip}
                className="px-5 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isStartingTrip ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Starting Trip...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Confirm & Start Trip Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VERIFY & END SALES PERSON TRIP (RECONCILIATION)                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tripToEnd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Verify & End Sales Person Trip
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">Trip #{tripToEnd.tripNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setTripToEnd(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Route:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{tripToEnd.routeName || 'Standard Route'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sales Executive:</span>
                <strong className="text-indigo-600 font-bold">{tripToEnd.salesPersonName || 'Executive'}</strong>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 font-bold">Total Stock Loaded:</span>
                <span className="text-purple-600 font-black">{tripToEnd.totalLoadedQuantity || 0} Pkts</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 cursor-pointer">
              <input
                type="checkbox"
                checked={endVerificationChecked}
                onChange={e => setEndVerificationChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-xs text-purple-900 dark:text-purple-200 leading-snug">
                I verify that all customer invoices, collected cash/UPI, and remaining truck bread returns have been reconciled for this trip.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTripToEnd(null)}
                disabled={isEndingTrip}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndTripConfirmed}
                disabled={!endVerificationChecked || isEndingTrip}
                className="px-5 py-2.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isEndingTrip ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ending Trip...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm & End Trip Now
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

export default SalesExecutivesPage;
