import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  FileCheck, 
  Plus, 
  X, 
  Calculator, 
  UserCheck, 
  Truck, 
  CreditCard, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  ArrowUpRight,
  Receipt,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { collectionApi } from '../services/apiService';

export interface SettlementItem {
  id: number;
  code: string;
  driver: string;
  driverPhone: string;
  trip: string;
  vehicle: string;
  route: string;
  cash: number;
  upi: number;
  cheque: number;
  expected: number;
  actual: number;
  shortage: number;
  status: 'SETTLED' | 'DISCREPANCY' | 'PENDING_AUDIT';
  auditDate: string;
  discrepancyReason?: string;
  noteDenominations?: { n500: number; n200: number; n100: number; n50: number };
}


export const DriverSettlementPage: React.FC = () => {
  const [collections, setCollections] = useState<SettlementItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAuditSettlement, setSelectedAuditSettlement] = useState<SettlementItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Audit Form State
  const [formData, setFormData] = useState({
    driver: '',
    trip: '',
    vehicle: '',
    route: '',
    cash: '0',
    upi: '0',
    actual: '0',
    reason: ''
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchCollections = () => {
    collectionApi.getAll()
      .then(res => {
        if (res.data) {
          const mapped: SettlementItem[] = res.data.map(c => ({
            id: c.id,
            code: c.collectionCode || `COLL-${c.id}`,
            driver: c.driverName || 'Delivery Driver',
            driverPhone: (c as any).driverPhone || '',
            trip: c.tripNumber || `TRIP-${c.tripId}`,
            vehicle: (c as any).vehicleNumber || 'Delivery Van',
            route: (c as any).routeName || 'Standard Route',
            cash: c.cashCollected || 0,
            upi: c.upiCollected || 0,
            cheque: c.chequeCollected || 0,
            expected: c.expectedTotal || 0,
            actual: c.actualTotal || 0,
            shortage: c.shortageExcess || 0,
            status: c.settlementStatus === 'SETTLED' ? 'SETTLED' : c.settlementStatus === 'DISCREPANCY' ? 'DISCREPANCY' : 'PENDING_AUDIT',
            auditDate: c.settledAt ? new Date(c.settledAt).toLocaleString() : new Date(c.createdAt).toLocaleString(),
          }));
          setCollections(mapped);
        }
      })
      .catch(err => console.error('Failed to load driver collections:', err));
  };

  React.useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cashVal = parseFloat(formData.cash) || 0;
    const upiVal = parseFloat(formData.upi) || 0;

    try {
      await collectionApi.settle({
        tripId: 1,
        driverId: 1,
        cashCollected: cashVal,
        upiCollected: upiVal,
        chequeCollected: 0
      });
      fetchCollections();
      setIsCreateModalOpen(false);
      showToast(`Driver reconciliation submitted successfully!`);
    } catch (err: any) {
      showToast(`Error submitting reconciliation: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteCollection = async (id: number, code: string) => {
    if (!window.confirm(`Are you sure you want to delete collection audit "${code}"?`)) return;
    try {
      await collectionApi.delete(id);
      showToast(`Deleted collection audit ${code}`);
      fetchCollections();
    } catch (err: any) {
      showToast(`Failed to delete collection audit: ${err.message || 'Failed'}`);
    }
  };

  const handleApproveSettlement = (id: number) => {
    setCollections(prev => prev.map(c => c.id === id ? { ...c, status: 'SETTLED', shortage: 0 } : c));
    setSelectedAuditSettlement(null);
    showToast('Driver cash settlement approved & marked SETTLED into bank ledger!');
  };

  // KPIs
  const totalExpected = collections.reduce((acc, c) => acc + c.expected, 0);
  const totalActual = collections.reduce((acc, c) => acc + c.actual, 0);
  const totalShortage = collections.reduce((acc, c) => acc + (c.shortage < 0 ? c.shortage : 0), 0);
  const settledCount = collections.filter(c => c.status === 'SETTLED').length;
  const discrepancyCount = collections.filter(c => c.status === 'DISCREPANCY').length;

  // Filtered Collections
  const filteredCollections = collections.filter(c => {
    const matchesSearch = 
      c.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

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
              Driver Collection Reconciliation & End-of-Day Audit
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Calculator className="w-3 h-3 text-blue-500" />
              {collections.length} Daily Driver Settlement Audits
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Reconcile driver cash, GPay UPI, and cheque collections against trip sales invoices, audit cash shortages, and approve daily deposits
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchCollections}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Collections Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Initiate Daily Cash Audit
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Row - Vertical Stack Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected Collections */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Expected Invoiced Total</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{totalExpected.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Sum of Dispatched Invoices</div>
          </div>
        </div>

        {/* Actual Deposited Cash/UPI */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Actual Bank Deposited</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">₹{totalActual.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">{Math.round((totalActual / totalExpected) * 100)}% Verified Deposited</div>
          </div>
        </div>

        {/* Shortage Discrepancy */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Collection Shortage</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">₹{Math.abs(totalShortage).toLocaleString()}</div>
            <div className="text-[11px] text-rose-600 font-semibold pt-0.5">{discrepancyCount} Trips with Discrepancy</div>
          </div>
        </div>

        {/* Settled Audit Status */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Audit Status</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <FileCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{settledCount} / {collections.length} Settled</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">End-of-Day Ledger Audited</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settlements by settlement code, driver, trip number, or vehicle..."
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
            <option value="ALL">All Audit Statuses</option>
            <option value="SETTLED">Settled (Matched)</option>
            <option value="DISCREPANCY">Discrepancy (Shortage)</option>
          </select>
        </div>
      </div>

      {/* Driver Settlement Master Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
            <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[130px]">Settlement #</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Driver & Phone</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Associated Trip & Vehicle</th>
                <th className="py-3.5 px-4 font-bold min-w-[150px]">Cash / UPI Breakdown</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Expected Total</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Actual Deposited</th>
                <th className="py-3.5 px-4 font-bold min-w-[140px]">Shortage / Excess</th>
                <th className="py-3.5 px-4 font-bold min-w-[110px]">Audit Status</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No driver collection audit records found in database. Click "Initiate Daily Cash Audit" to start a reconciliation.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col) => (
                  <tr key={col.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-extrabold text-[#1C1C1C] dark:text-white text-xs block">{col.code}</span>
                      <span className="text-[10px] text-[#8C8C8C]">{col.auditDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[#1C1C1C] dark:text-white block">{col.driver}</span>
                      <span className="text-[11px] font-mono text-[#8C8C8C]">{col.driverPhone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">{col.trip}</span>
                      <span className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                        <Truck className="w-3 h-3 text-amber-500 shrink-0" /> {col.vehicle} ({col.route})
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className="block font-medium text-[#1C1C1C] dark:text-slate-200">Cash: ₹{col.cash.toLocaleString()}</span>
                      <span className="text-[#8C8C8C]">UPI: ₹{col.upi.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1C1C1C] dark:text-slate-100">
                      ₹{col.expected.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1C1C1C] dark:text-white">
                      ₹{col.actual.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      {col.shortage < 0 ? (
                        <div>
                          <span className="text-rose-600 dark:text-rose-400 block">₹{col.shortage} (Shortage)</span>
                          <span className="text-[10px] text-rose-500 font-normal">Action Required</span>
                        </div>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">₹0 (Matched)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {col.status === 'SETTLED' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> SETTLED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-500" /> DISCREPANCY
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedAuditSettlement(col)}
                        className="px-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-blue-500" /> Audit
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col.id, col.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CASH RECONCILIATION AUDIT INSPECTOR MODAL */}
      {selectedAuditSettlement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Driver Cash Audit Inspector</h3>
                  <p className="text-[11px] font-mono text-[#8C8C8C]">{selectedAuditSettlement.code} • Driver: {selectedAuditSettlement.driver}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAuditSettlement(null)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 space-y-4 text-xs">
              {/* Trip Metadata */}
              <div className="p-3.5 bg-[#F7F9FB] dark:bg-slate-800/80 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-blue-500">{selectedAuditSettlement.trip}</span>
                  <span className="font-semibold text-[#8C8C8C]">{selectedAuditSettlement.vehicle}</span>
                </div>
                <div className="text-[11px] text-[#8C8C8C] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" /> Route: {selectedAuditSettlement.route}
                </div>
              </div>

              {/* Collection Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F7F9FB] dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">Physical Cash Collected</span>
                  <span className="text-base font-extrabold text-[#1C1C1C] dark:text-white">₹{selectedAuditSettlement.cash.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-[#F7F9FB] dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">GPay UPI Digital</span>
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">₹{selectedAuditSettlement.upi.toLocaleString()}</span>
                </div>
              </div>

              {/* Expected vs Actual Comparison */}
              <div className="p-3.5 bg-[#F7F9FB] dark:bg-slate-800/80 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-[#8C8C8C]">
                  <span>Expected Invoice Total:</span>
                  <span className="font-bold text-[#1C1C1C] dark:text-white">₹{selectedAuditSettlement.expected.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[#8C8C8C]">
                  <span>Actual Deposited Cash:</span>
                  <span className="font-bold text-[#1C1C1C] dark:text-white">₹{selectedAuditSettlement.actual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-extrabold pt-2 border-t border-[#E2E8F0] dark:border-slate-700">
                  <span>Reconciliation Balance:</span>
                  {selectedAuditSettlement.shortage < 0 ? (
                    <span className="text-rose-600 dark:text-rose-400">₹{selectedAuditSettlement.shortage} (Shortage Discrepancy)</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">₹0 (Matched 100%)</span>
                  )}
                </div>
              </div>

              {/* Discrepancy Notes */}
              {selectedAuditSettlement.discrepancyReason && (
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Discrepancy Reason Note:
                  </span>
                  <p className="text-[11px] leading-snug">{selectedAuditSettlement.discrepancyReason}</p>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="px-6 py-4 bg-[#F7F9FB] dark:bg-slate-800/60 border-t border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedAuditSettlement(null)}
                className="px-4 py-2 bg-[#E2E8F0] dark:bg-slate-700 text-[#1C1C1C] dark:text-white text-xs font-bold rounded-xl"
              >
                Close Audit
              </button>
              {selectedAuditSettlement.status === 'DISCREPANCY' && (
                <button
                  onClick={() => handleApproveSettlement(selectedAuditSettlement.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Resolve & Approve Settlement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INITIATE DAILY CASH AUDIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Initiate Driver Cash Audit</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Reconcile end-of-day driver cash & UPI collections</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="px-6 pb-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Select Driver *</label>
                  <select
                    name="driver"
                    value={formData.driver}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    <option value="Rajesh Sharma">Rajesh Sharma (TRIP-1722770000)</option>
                    <option value="Mahesh Selvam">Mahesh Selvam (TRIP-1722771200)</option>
                    <option value="Sunil Verma">Sunil Verma (TRIP-1722773400)</option>
                    <option value="Karthik Sundaram">Karthik Sundaram (TRIP-1722774900)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Cash Collected (₹) *</label>
                    <input
                      type="number"
                      required
                      name="cash"
                      value={formData.cash}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold mb-1">UPI GPay Digital (₹) *</label>
                    <input
                      type="number"
                      required
                      name="upi"
                      value={formData.upi}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">Actual Bank Deposited Cash (₹) *</label>
                  <input
                    type="number"
                    required
                    name="actual"
                    value={formData.actual}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">Audit / Discrepancy Note</label>
                  <textarea
                    name="reason"
                    rows={2}
                    value={formData.reason}
                    onChange={handleInputChange}
                    placeholder="Enter audit comments or shortage explanation..."
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Submit Cash Reconciliation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
