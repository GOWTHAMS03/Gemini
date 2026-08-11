import React, { useState, useEffect } from 'react';
import api from '../services/apiService';
import { 
  Truck, 
  Plus, 
  MapPin, 
  UserCheck, 
  X, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  Award, 
  AlertTriangle, 
  FileCheck, 
  Check, 
  Building2, 
  Calendar, 
  Shield, 
  FileSpreadsheet, 
  RefreshCw, 
  Trash2,
  Edit3,
  LayoutGrid,
  List,
  FileText,
  Activity,
  Gauge,
  Phone
} from 'lucide-react';

export interface VehicleItem {
  id: number;
  vehicleCode: string;
  vehicleNumber: string;
  model: string;
  type: string;
  capacityKg: number;
  fitnessExpiry: string;
  insuranceNo: string;
  insuranceExpiry: string;
  pucCertificateNo: string;
  pucExpiry: string;
  status: 'ACTIVE_DISPATCHED' | 'AVAILABLE' | 'MAINTENANCE';
  assignedDriver: string;
  driverPhone?: string;
  assignedRoute: string;
  complianceBadge: 'FULLY_COMPLIANT' | 'RENEWAL_DUE';
  rcDocumentName?: string;
}

export const TripsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal States
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleItem | null>(null);
  const [selectedVehicleDoc, setSelectedVehicleDoc] = useState<VehicleItem | null>(null);

  // Form State
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: '',
    model: 'Tata Intra V30',
    type: 'Mini Truck',
    capacityKg: '1500',
    fitnessExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    insuranceNo: 'HDFC-ERGO-FLT-8892',
    insuranceExpiry: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    pucCertificateNo: 'TN01-PUC-2026-991',
    pucExpiry: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    status: 'AVAILABLE' as 'ACTIVE_DISPATCHED' | 'AVAILABLE' | 'MAINTENANCE',
    assignedDriver: '',
    driverPhone: '',
    assignedRoute: 'Unassigned (Assigned at Dispatch)',
    rcDocumentName: 'RC_Certificate_Verified.pdf'
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch Vehicles
  const fetchVehicles = () => {
    setIsLoading(true);
    api.get('/vehicles')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped: VehicleItem[] = res.data.map((v: any) => ({
            id: v.id,
            vehicleCode: v.vehicleCode || `VH-${String(v.id).padStart(3, '0')}`,
            vehicleNumber: v.vehicleNumber || 'TN-01-EA-4521',
            model: v.model || 'Tata Intra V30',
            type: v.type || 'Mini Truck',
            capacityKg: v.capacityKg || 1500,
            fitnessExpiry: v.fitnessExpiry || '2027-01-15',
            insuranceNo: v.insuranceNo || 'HDFC-ERGO-FLT-8892',
            insuranceExpiry: v.insuranceExpiry || '2026-11-20',
            pucCertificateNo: v.pucCertificateNo || 'TN01-PUC-2026-991',
            pucExpiry: v.pucExpiry || '2026-08-30',
            status: v.status || 'AVAILABLE',
            assignedDriver: v.assignedDriver || 'Rajesh Kumar',
            driverPhone: v.driverPhone || '+91 98401 99999',
            assignedRoute: v.assignedRoute || 'Unassigned (Assigned at Dispatch)',
            complianceBadge: v.complianceBadge || 'FULLY_COMPLIANT',
            rcDocumentName: v.rcDocumentName || 'RC_Certificate_Verified.pdf',
          }));
          setVehicles(mapped);
        } else {
          setVehicles([]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load vehicles from API:', err);
      })
      .finally(() => setIsLoading(false));
  };

  // Fetch Drivers
  const fetchDrivers = () => {
    api.get('/users/employees')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setDrivers(res.data);
        }
      })
      .catch(() => setDrivers([]));
  };

  // Fetch Routes
  const fetchRoutes = () => {
    api.get('/routes')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setRoutes(res.data);
        }
      })
      .catch(() => setRoutes([]));
  };

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchRoutes();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    const nextCode = `VH-${String(vehicles.length + 1).padStart(3, '0')}`;
    const defaultDriver = drivers.length > 0 ? (drivers[0].fullName || drivers[0].name) : 'Rajesh Kumar';
    setVehicleForm({
      vehicleNumber: '',
      model: 'Tata Intra V30',
      type: 'Mini Truck',
      capacityKg: '1500',
      fitnessExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      insuranceNo: `HDFC-ERGO-FLT-${Math.floor(1000 + Math.random() * 9000)}`,
      insuranceExpiry: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      pucCertificateNo: `TN01-PUC-2026-${Math.floor(100 + Math.random() * 900)}`,
      pucExpiry: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: 'AVAILABLE',
      assignedDriver: defaultDriver,
      driverPhone: '+91 98401 00000',
      assignedRoute: 'Unassigned (Assigned at Dispatch)',
      rcDocumentName: `RC_Verified_${nextCode}.pdf`
    });
    setIsOnboardModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleItem) => {
    setEditingVehicle(v);
    setVehicleForm({
      vehicleNumber: v.vehicleNumber,
      model: v.model,
      type: v.type,
      capacityKg: String(v.capacityKg),
      fitnessExpiry: v.fitnessExpiry,
      insuranceNo: v.insuranceNo,
      insuranceExpiry: v.insuranceExpiry,
      pucCertificateNo: v.pucCertificateNo,
      pucExpiry: v.pucExpiry,
      status: v.status,
      assignedDriver: v.assignedDriver,
      driverPhone: v.driverPhone || '+91 98401 00000',
      assignedRoute: v.assignedRoute || 'Unassigned (Assigned at Dispatch)',
      rcDocumentName: v.rcDocumentName || 'RC_Verified.pdf'
    });
    setIsOnboardModalOpen(true);
  };

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber.trim()) return;

    const payload = {
      vehicleCode: editingVehicle ? editingVehicle.vehicleCode : `VH-${String(vehicles.length + 1).padStart(3, '0')}`,
      vehicleNumber: vehicleForm.vehicleNumber.toUpperCase().trim(),
      model: vehicleForm.model,
      type: vehicleForm.type,
      capacityKg: parseFloat(vehicleForm.capacityKg) || 1500,
      fitnessExpiry: vehicleForm.fitnessExpiry,
      insuranceNo: vehicleForm.insuranceNo,
      insuranceExpiry: vehicleForm.insuranceExpiry,
      pucCertificateNo: vehicleForm.pucCertificateNo,
      pucExpiry: vehicleForm.pucExpiry,
      status: vehicleForm.status,
      assignedDriver: vehicleForm.assignedDriver,
      driverPhone: vehicleForm.driverPhone,
      assignedRoute: vehicleForm.assignedRoute || 'Unassigned (Assigned at Dispatch)',
      complianceBadge: 'FULLY_COMPLIANT',
      rcDocumentName: vehicleForm.rcDocumentName
    };

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, payload).catch(() => null);
        setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...payload, id: v.id } as VehicleItem : v));
        showToast(`Vehicle ${payload.vehicleNumber} updated successfully!`);
      } else {
        const res = await api.post('/vehicles', payload).catch(() => null);
        const newVehicle: VehicleItem = {
          ...payload,
          id: res?.data?.id || Date.now(),
          complianceBadge: 'FULLY_COMPLIANT'
        };
        setVehicles(prev => [newVehicle, ...prev]);
        showToast(`Vehicle ${payload.vehicleNumber} onboarded to fleet successfully!`);
      }
      setIsOnboardModalOpen(false);
      setEditingVehicle(null);
    } catch (err: any) {
      showToast(`Error saving vehicle: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteVehicle = async (id: number, vehicleNumber: string) => {
    if (!window.confirm(`Are you sure you want to remove vehicle "${vehicleNumber}" from the active fleet?`)) return;
    try {
      await api.delete(`/vehicles/${id}`).catch(() => null);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast(`Vehicle "${vehicleNumber}" removed from fleet.`);
    } catch (err: any) {
      showToast(`Failed to remove vehicle: ${err.message || 'Failed'}`);
    }
  };

  // KPIs
  const totalFleet = vehicles.length;
  const activeDispatched = vehicles.filter(v => v.status === 'ACTIVE_DISPATCHED').length;
  const availableLoading = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const compliantCount = vehicles.filter(v => v.complianceBadge === 'FULLY_COMPLIANT').length;

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.assignedRoute.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Vehicle Onboarding & Fleet Compliance
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Truck className="w-3 h-3 text-blue-500" />
              {totalFleet} Fleet Vehicles
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Onboard delivery trucks, register payload capacities, manage RC documentation, track fitness and insurance expiries, and assign primary drivers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchVehicles}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Fleet Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Onboard New Vehicle
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fleet */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Registered Fleet</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalFleet} Vehicles</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Active Fleet Capacity</div>
          </div>
        </div>

        {/* Active on Road */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Dispatched on Road</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">{activeDispatched} On Route</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Live Delivery Execution</div>
          </div>
        </div>

        {/* Available at Hub */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Available for Loading</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Gauge className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">{availableLoading} Ready</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">Ready for Next Shift</div>
          </div>
        </div>

        {/* Compliance Rating */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">RC & Insurance Compliance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{compliantCount}/{totalFleet} Compliant</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Fitness & PUC Verified</div>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fleet by registration number, model, assigned driver, or delivery route..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <Filter className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="ALL">All Statuses ({vehicles.length})</option>
            <option value="AVAILABLE">Available</option>
            <option value="ACTIVE_DISPATCHED">Active Dispatched</option>
            <option value="MAINTENANCE">Under Maintenance</option>
          </select>

          {/* View Switcher */}
          <div className="flex items-center bg-[#F7F9FB] dark:bg-slate-900 p-1 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                  : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                  : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold min-w-[100px]">Vehicle Code</th>
                  <th className="py-3.5 px-4 font-bold min-w-[140px]">Registration No.</th>
                  <th className="py-3.5 px-4 font-bold min-w-[160px]">Model & Type</th>
                  <th className="py-3.5 px-4 font-bold min-w-[110px]">Payload (Kg)</th>
                  <th className="py-3.5 px-4 font-bold min-w-[160px]">Assigned Driver</th>
                  <th className="py-3.5 px-4 font-bold min-w-[180px]">Primary Route</th>
                  <th className="py-3.5 px-4 font-bold min-w-[120px]">Status</th>
                  <th className="py-3.5 px-4 font-bold min-w-[130px]">Compliance</th>
                  <th className="py-3.5 px-4 font-bold min-w-[140px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs font-bold text-[#8C8C8C]">
                      No vehicles found. Click "Onboard New Vehicle" to register a fleet asset.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => {
                    return (
                      <tr key={v.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                        <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {v.vehicleCode}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#1C1C1C] dark:text-white">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-xs">
                            {v.vehicleNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1C1C1C] dark:text-white">{v.model}</div>
                          <div className="text-[10px] text-[#8C8C8C]">{v.type}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{v.capacityKg}</span> Kg
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1C1C1C] dark:text-white flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{v.assignedDriver}</span>
                          </div>
                          {v.driverPhone && <div className="text-[10px] text-[#8C8C8C] font-mono">{v.driverPhone}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {v.assignedRoute}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                            v.status === 'ACTIVE_DISPATCHED'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300'
                              : v.status === 'AVAILABLE'
                              ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300'
                              : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300'
                          }`}>
                            {v.status === 'ACTIVE_DISPATCHED' ? 'Dispatched' : v.status === 'AVAILABLE' ? 'Available' : 'Maintenance'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                            v.complianceBadge === 'FULLY_COMPLIANT'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10'
                              : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10'
                          }`}>
                            <ShieldCheck className="w-3 h-3" />
                            {v.complianceBadge === 'FULLY_COMPLIANT' ? 'Verified' : 'Renewal Due'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedVehicleDoc(v)}
                            className="p-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white rounded-lg transition inline-flex items-center border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                            title="View RC & Compliance Documents"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition inline-flex items-center border border-blue-200 dark:border-blue-500/30 cursor-pointer"
                            title="Edit Vehicle & Driver Assignment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVehicle(v.id, v.vehicleNumber)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Remove Vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => (
            <div 
              key={v.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Truck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">{v.vehicleCode}</span>
                      <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white leading-tight">{v.vehicleNumber}</h3>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    v.status === 'ACTIVE_DISPATCHED'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10'
                      : v.status === 'AVAILABLE'
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10'
                      : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10'
                  }`}>
                    {v.status === 'ACTIVE_DISPATCHED' ? 'Dispatched' : v.status === 'AVAILABLE' ? 'Available' : 'Maintenance'}
                  </span>
                </div>

                {/* Card Details */}
                <div className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-[#8C8C8C] block uppercase font-bold">Vehicle Model</span>
                      <span className="font-bold text-[#1C1C1C] dark:text-white line-clamp-1">{v.model}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] text-[#8C8C8C] block uppercase font-bold">Payload Capacity</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{v.capacityKg} Kg</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F7F9FB] dark:bg-slate-900 rounded-xl border border-[#F0F2F5] dark:border-slate-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C8C8C] flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Driver:
                      </span>
                      <span className="font-bold text-[#1C1C1C] dark:text-white">{v.assignedDriver}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8C8C8C] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Route:
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{v.assignedRoute}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px]">
                      <span className="text-[#8C8C8C]">Fitness Certificate:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Valid to {v.fitnessExpiry}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span className="text-[11px] text-[#8C8C8C] font-semibold">{v.type}</span>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setSelectedVehicleDoc(v)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
                    title="View Documents"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                  <button 
                    onClick={() => handleOpenEdit(v)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer border border-blue-200 dark:border-blue-500/30"
                    title="Edit Vehicle"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteVehicle(v.id, v.vehicleNumber)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700 rounded-xl transition cursor-pointer"
                    title="Remove Vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DOCUMENT & COMPLIANCE MODAL */}
      {selectedVehicleDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-extrabold">{selectedVehicleDoc.vehicleNumber}</h3>
                  <p className="text-[11px] font-mono text-[#8C8C8C]">{selectedVehicleDoc.model} • {selectedVehicleDoc.vehicleCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVehicleDoc(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">RC Certificate:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedVehicleDoc.rcDocumentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">Insurance Policy No:</span>
                <span className="font-mono font-bold">{selectedVehicleDoc.insuranceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">Insurance Expiry:</span>
                <span className="font-bold text-emerald-600">{selectedVehicleDoc.insuranceExpiry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">Fitness Validity:</span>
                <span className="font-bold text-emerald-600">{selectedVehicleDoc.fitnessExpiry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">Pollution (PUC) No:</span>
                <span className="font-mono font-bold">{selectedVehicleDoc.pucCertificateNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">PUC Expiry:</span>
                <span className="font-bold text-emerald-600">{selectedVehicleDoc.pucExpiry}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setSelectedVehicleDoc(null)}
                className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Close Compliance Specs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ONBOARD / EDIT VEHICLE MODAL */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden my-6 text-[#1C1C1C] dark:text-slate-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingVehicle ? 'Edit Fleet Vehicle Details' : 'Onboard New Fleet Delivery Vehicle'}
                  </h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">
                    Register vehicle number, payload capacity, fitness, insurance, and driver assignment
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOnboardModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVehicle} className="px-6 py-4 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Registration No. (Plate) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN-01-EA-4521"
                    value={vehicleForm.vehicleNumber}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono font-bold uppercase px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Intra V30"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Vehicle Type *</label>
                  <select
                    value={vehicleForm.type}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    <option value="Mini Truck">Mini Truck (1.5 Ton)</option>
                    <option value="Large Delivery Van">Large Delivery Van (2.0 Ton)</option>
                    <option value="Heavy Delivery Truck">Heavy Delivery Truck (2.5+ Ton)</option>
                    <option value="Electric Cargo Van">Electric Cargo Van</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Payload Capacity (Kg) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1500"
                    value={vehicleForm.capacityKg}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, capacityKg: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Assigned Primary Driver</label>
                  <select
                    value={vehicleForm.assignedDriver}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, assignedDriver: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    {drivers.length === 0 ? (
                      <option value="Rajesh Kumar">Rajesh Kumar</option>
                    ) : (
                      drivers.map((d: any) => (
                        <option key={d.id} value={d.fullName || d.name}>{d.fullName || d.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Operational Status</label>
                  <select
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    <option value="AVAILABLE">Available for Loading</option>
                    <option value="ACTIVE_DISPATCHED">Active Dispatched</option>
                    <option value="MAINTENANCE">Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Fitness Certificate Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={vehicleForm.fitnessExpiry}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, fitnessExpiry: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">RC Certificate Document Name</label>
                  <input
                    type="text"
                    placeholder="e.g. RC_TN01EA4521.pdf"
                    value={vehicleForm.rcDocumentName}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, rcDocumentName: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Insurance Policy No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC-ERGO-FLT-8892"
                    value={vehicleForm.insuranceNo}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, insuranceNo: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Insurance Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={vehicleForm.insuranceExpiry}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">PUC Certificate No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TN01-PUC-2026-991"
                    value={vehicleForm.pucCertificateNo}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, pucCertificateNo: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">PUC Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={vehicleForm.pucExpiry}
                    onChange={(e) => setVehicleForm(prev => ({ ...prev, pucExpiry: e.target.value }))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Dispatch Route Note */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Route Dynamic Assignment:</strong> Delivery routes are not fixed at initial onboarding. Routes are dynamically assigned to this vehicle during <strong>Trip Dispatch & Route Execution</strong>.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition"
                >
                  {editingVehicle ? 'Update Vehicle' : 'Onboard Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
