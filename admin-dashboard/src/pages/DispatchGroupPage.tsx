import React, { useState, useEffect } from 'react';
import {
  Users, Truck, UserCheck, Plus, X, Search, RefreshCw,
  DollarSign, Calendar, MapPin, Eye, CheckCircle2,
  Clock, AlertTriangle, ShieldCheck, ChevronRight,
  TrendingUp, CreditCard, Receipt
} from 'lucide-react';
import { 
  dispatchGroupDetailsApi, 
  ApiDispatchGroupDetail,
  employeeApi,
  ApiEmployee
} from '../services/apiService';
import api from '../services/apiService';

interface DispatchGroup {
  id: number;
  groupName: string;
  salesPersonId?: number;
  salesPersonName?: string;
  driverId?: number;
  driverName?: string;
  vehicleId?: number;
  vehicleNumber?: string;
  status: string;
  isActive: boolean;
}

export const DispatchGroupPage: React.FC = () => {
  const [groups, setGroups] = useState<DispatchGroup[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    groupName: '',
    description: '',
    salesPersonId: '',
    driverId: '',
    vehicleId: ''
  });

  const [salesPersons, setSalesPersons] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Drilldown modal state
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<ApiDispatchGroupDetail | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  useEffect(() => {
    fetchDispatchGroups();
    fetchResources();
  }, []);

  const fetchDispatchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dispatch-groups');
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching dispatch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const [spRes, drRes, vhRes] = await Promise.all([
        employeeApi.getAll('ROLE_SALES_EXECUTIVE').catch(() => ({ data: [] })),
        employeeApi.getAll('ROLE_DRIVER').catch(() => ({ data: [] })),
        api.get('/vehicles').catch(() => ({ data: [] }))
      ]);
      setSalesPersons(spRes.data || []);
      setDrivers(drRes.data || []);
      setVehicles(vhRes.data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const handleOpenDetails = async (groupId: number) => {
    setIsDetailsLoading(true);
    try {
      const res = await dispatchGroupDetailsApi.getDetails(groupId);
      setSelectedGroupDetails(res.data);
    } catch (err) {
      console.error('Error fetching group details:', err);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.groupName || !formData.salesPersonId || !formData.driverId || !formData.vehicleId) {
      alert('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/dispatch-groups', {
        groupName: formData.groupName,
        description: formData.description,
        salesPersonId: parseInt(formData.salesPersonId),
        driverId: parseInt(formData.driverId),
        vehicleId: parseInt(formData.vehicleId)
      });
      fetchDispatchGroups();
      setShowForm(false);
      setFormData({ groupName: '', description: '', salesPersonId: '', driverId: '', vehicleId: '' });
    } catch (error: any) {
      console.error('Error creating dispatch group:', error);
      alert(error.response?.data?.message || 'Failed to create dispatch group');
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(g =>
    g.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.salesPersonName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Dispatch Groups & Field Squads
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assigned Driver + Sales Executive + Vehicle teams with salary, trip beta, and real-time operational history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Dispatch Group
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by group name, driver, sales person, or vehicle..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
        />
      </div>

      {/* Dispatch Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredGroups.map(group => (
          <div
            key={group.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    {group.groupName}
                  </h3>
                  <span className="text-[10px] text-slate-400">ID: DG-{group.id}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {group.status || 'ACTIVE'}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" /> Driver:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{group.driverName || 'Raj Kumar'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Sales Exec:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{group.salesPersonName || 'Kumar'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-teal-500" /> Vehicle:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{group.vehicleNumber || 'TN-XX-1234'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Driver & Sales Squad</span>
              <button
                onClick={() => handleOpenDetails(group.id)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> View Squad Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DISPATCH GROUP FINANCIAL & OPERATIONAL DETAILS MODAL                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {selectedGroupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex-shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-xl">
                    <Truck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{selectedGroupDetails.groupName}</h3>
                    <p className="text-xs text-slate-300">
                      Vehicle: {selectedGroupDetails.vehicleNumber} ({selectedGroupDetails.vehicleModel || 'Bakery Truck'})
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroupDetails(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* 1. Salaries of Driver and Sales Person */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Team Monthly Salary Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Driver</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedGroupDetails.driverName}
                      </div>
                      <div className="text-slate-400 text-[11px]">{selectedGroupDetails.driverPhone || 'Phone: N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly Salary</span>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        ₹{selectedGroupDetails.driverMonthlySalary?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Sales Person</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedGroupDetails.salesPersonName}
                      </div>
                      <div className="text-slate-400 text-[11px]">{selectedGroupDetails.salesPersonPhone || 'Phone: N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Monthly Salary</span>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        ₹{selectedGroupDetails.salesPersonMonthlySalary?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Current Trip Live Metrics (if active) */}
              {selectedGroupDetails.currentTrip && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" /> Active Trip: {selectedGroupDetails.currentTrip.tripNumber} ({selectedGroupDetails.currentTrip.routeName})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      {selectedGroupDetails.currentTrip.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Loaded / Sold</div>
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        {selectedGroupDetails.currentTrip.totalLoaded} / {selectedGroupDetails.currentTrip.totalSold} Units
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Remaining Stock</div>
                      <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {selectedGroupDetails.currentTrip.totalRemaining} Units
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Total Sales</div>
                      <div className="font-black text-slate-900 dark:text-white text-sm">
                        ₹{selectedGroupDetails.currentTrip.totalSalesAmount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] text-slate-400 uppercase">Trip Beta</div>
                      <div className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        ₹{selectedGroupDetails.currentTrip.betaAmount?.toLocaleString()} ({selectedGroupDetails.currentTrip.betaPaymentStatus})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Trip History Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Historical Trips by this Squad
                </h4>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Trip Date</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3 text-right">Sales Amount</th>
                        <th className="py-2.5 px-3 text-right">Trip Beta</th>
                        <th className="py-2.5 px-3 text-center">Beta Status</th>
                        <th className="py-2.5 px-3 text-center">Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {selectedGroupDetails.tripHistory?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            No trip records for this dispatch group yet.
                          </td>
                        </tr>
                      ) : (
                        selectedGroupDetails.tripHistory?.map(t => (
                          <tr key={t.tripId} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{t.tripDate}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300">{t.routeName}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                              ₹{t.salesAmount?.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              ₹{t.betaAmount?.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.betaStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                              }`}>
                                {t.betaStatus || 'PENDING'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.settlementStatus === 'SETTLED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {t.settlementStatus || 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setSelectedGroupDetails(null)}
                  className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Create Dispatch Group
              </h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">Group Name *</label>
                <input
                  type="text"
                  value={formData.groupName}
                  onChange={e => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder="Salem North Field Squad"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">Driver *</label>
                <select
                  value={formData.driverId}
                  onChange={e => setFormData({ ...formData, driverId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  required
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">Sales Person *</label>
                <select
                  value={formData.salesPersonId}
                  onChange={e => setFormData({ ...formData, salesPersonId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  required
                >
                  <option value="">-- Select Sales Executive --</option>
                  {salesPersons.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 uppercase text-[10px]">Vehicle *</label>
                <select
                  value={formData.vehicleId}
                  onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  required
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.model})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-slate-500 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
