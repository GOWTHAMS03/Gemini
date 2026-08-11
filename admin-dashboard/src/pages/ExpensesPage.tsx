import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  FileText, 
  X,
  TrendingDown,
  PieChart,
  CheckCircle2,
  Receipt,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { expensesApi, ApiExpense } from '../services/apiService';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('SALARIES');
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('CASH');
  const [payeeName, setPayeeName] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await expensesApi.getAll();
      setExpenses(res.data || []);
    } catch (err) {
      console.error('Error loading expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCreateExpense = async () => {
    if (amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    try {
      await expensesApi.create({
        category,
        amount,
        taxAmount,
        paymentMode,
        payeeName,
        expenseDate,
        referenceNumber,
        description
      });

      showToast(`Expense for ${category} (₹${amount}) recorded & cash/bank account updated!`);
      setIsModalOpen(false);
      loadExpenses();
    } catch (err: any) {
      alert('Error recording expense: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteExpense = async (id: number, voucherNum: string) => {
    if (!window.confirm(`Are you sure you want to delete expense voucher "${voucherNum}"?`)) return;
    try {
      await expensesApi.delete(id);
      showToast(`Deleted expense voucher ${voucherNum}`);
      loadExpenses();
    } catch (err: any) {
      alert('Error deleting expense voucher: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesSearch = 
      e.expenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.payeeName && e.payeeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const salarySum = expenses.filter(e => e.category === 'SALARIES').reduce((s, e) => s + e.totalAmount, 0);
  const fuelSum = expenses.filter(e => e.category === 'FUEL').reduce((s, e) => s + e.totalAmount, 0);

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

      {/* Styled Executive Control Tower Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Operational Expense Management
            </h1>
            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-purple-500" />
              {expenses.length} Logged Expense Voucher Records
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Record operational overhead expenses, staff payroll vouchers, factory utilities, and fuel bills with automated ledger posting
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadExpenses}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Expense Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Log Expense Voucher
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Filtered Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{totalExpenseSum.toLocaleString()}</div>
            <div className="text-[11px] text-red-600 font-semibold pt-0.5">Operating Outflow</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Salaries & Wages</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{salarySum.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-600 font-semibold pt-0.5">Payroll Overhead</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Fuel & Logistics</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <PieChart className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{fuelSum.toLocaleString()}</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Fleet Fuel Expenses</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Expense Vouchers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{filteredExpenses.length} Records</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">100% Audited & Posted</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Data Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-3 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#8C8C8C] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Voucher #, Payee, or Notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 placeholder-[#8C8C8C] pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pb-1 max-w-full">
            {['ALL', 'SALARIES', 'TRIP_BETA', 'TRIP_EXPENSE', 'FUEL', 'VEHICLE_MAINTENANCE', 'ELECTRICITY', 'RENT', 'PACKAGING'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'bg-[#F4F5F7] dark:bg-slate-700 text-[#8C8C8C] dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee Name / Vendor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Total Outflow</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No expense vouchers recorded in database yet. Click "Log Expense Voucher" to add an expense.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 rounded-full text-[10px] font-bold">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1C1C1C] dark:text-white">
                      {exp.payeeName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 font-mono text-[11px]">
                      {exp.expenseDate}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                      {exp.paymentMode}
                    </td>
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 text-xs max-w-xs truncate">
                      {exp.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-red-600 dark:text-red-400">
                      ₹{exp.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.expenseNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Delete Voucher"
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

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Log New Expense Voucher</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Post operational expenses with category and payment mode</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                >
                  <option value="SALARIES">Salaries & Wages</option>
                  <option value="TRIP_BETA">Trip Beta Allowance (Driver/Sales)</option>
                  <option value="TRIP_EXPENSE">Trip Incidentals & En-Route Tolls</option>
                  <option value="FUEL">Fuel & Transportation</option>
                  <option value="VEHICLE_MAINTENANCE">Vehicle Maintenance</option>
                  <option value="ELECTRICITY">Electricity & Power Utilities</option>
                  <option value="RENT">Factory & Warehouse Rent</option>
                  <option value="PACKAGING">Packaging Materials</option>
                  <option value="OFFICE">Office & Stationery</option>
                  <option value="MISCELLANEOUS">Miscellaneous Expenses</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Expense Amount (₹) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Payment Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Payee / Vendor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Oil, Staff Salaries..."
                    value={payeeName}
                    onChange={e => setPayeeName(e.target.value)}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details of expense..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateExpense}
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Log Expense & Post Journal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
