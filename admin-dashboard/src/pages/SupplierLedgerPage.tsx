import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Download,
  CheckCircle2,
  TrendingDown,
  UserCheck,
  Plus,
  RefreshCw
} from 'lucide-react';
import { supplierLedgersApi, suppliersApi, ApiSupplier, ApiSupplierLedger } from '../services/apiService';

export const SupplierLedgerPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string>('');
  const [ledgerEntries, setLedgerEntries] = useState<ApiSupplierLedger[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await suppliersApi.getAll();
      setSuppliers(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedSupplierId(res.data[0].id);
        fetchLedger(res.data[0].id);
      }
    } catch (err) {
      console.error('Error loading suppliers:', err);
    }
  };

  const fetchLedger = async (supplierId: number | string) => {
    setIsLoading(true);
    try {
      const res = await supplierLedgersApi.getLedger(Number(supplierId));
      setLedgerEntries(res.data || []);
    } catch (err) {
      console.error('Error loading supplier ledger:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSupplierSelect = (id: number) => {
    setSelectedSupplierId(id);
    fetchLedger(id);
  };

  const activeSupplier = suppliers.find(s => s.id === Number(selectedSupplierId));

  const filteredEntries = ledgerEntries.filter(e => {
    return (
      e.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.transactionType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pt-1">
      {/* Styled Executive Control Tower Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Supplier Accounts Ledger & Statement
            </h1>
            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-purple-500" />
              {suppliers.length} Registered Raw Material Vendors
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Audit vendor ledger transaction histories, track debit returns, credit purchases, and current outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadSuppliers}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Suppliers Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Ledger Statement
          </button>
        </div>
      </div>

      {/* Supplier Selector Banner & KPI Cards */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C8C8C] mb-1">
              Select Raw Material Supplier
            </label>
            <select
              value={selectedSupplierId}
              onChange={e => handleSupplierSelect(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#F7F9FB] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
            >
              {suppliers.length > 0 ? (
                suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.supplierCode})</option>
                ))
              ) : (
                <option value="">No suppliers available</option>
              )}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 bg-[#F7F9FB] dark:bg-slate-900/60 p-3.5 rounded-xl border border-[#ECEFF2] dark:border-slate-800">
            <div>
              <span className="text-[10px] text-[#8C8C8C] font-semibold uppercase block">Supplier Code:</span>
              <span className="font-mono font-bold text-xs text-[#1C1C1C] dark:text-white">{activeSupplier?.supplierCode || '-'}</span>
            </div>
            <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] text-[#8C8C8C] font-semibold uppercase block">Contact Phone:</span>
              <span className="font-bold text-xs text-[#1C1C1C] dark:text-white">{activeSupplier?.phone || '-'}</span>
            </div>
            <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-[10px] text-[#8C8C8C] font-semibold uppercase block">Current Outstanding Balance:</span>
              <span className="text-lg font-extrabold text-red-600 dark:text-red-400">
                ₹{(activeSupplier?.outstandingBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Data Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-3.5 h-3.5 text-[#8C8C8C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Reference #, Bill description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 placeholder-[#8C8C8C] pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="text-xs text-[#8C8C8C] font-semibold">
            Showing {filteredEntries.length} Ledger Postings
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Debit (Payment/Return)</th>
                <th className="py-3 px-4 text-right">Credit (Purchases)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No ledger transactions found for this supplier in database.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 font-mono text-[11px]">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        entry.transactionType === 'PURCHASE_INVOICE'
                          ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                          : entry.transactionType === 'PAYMENT_MADE'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                      }`}>
                        {entry.transactionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {entry.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 text-xs">
                      {entry.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                      ₹{entry.debitAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-red-600 dark:text-red-400">
                      ₹{entry.creditAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-[#1C1C1C] dark:text-white">
                      ₹{entry.runningBalance.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupplierLedgerPage;
