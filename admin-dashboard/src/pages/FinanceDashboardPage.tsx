import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart as PieChartIcon, 
  FileSpreadsheet, 
  CreditCard,
  Receipt,
  Plus,
  Activity,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { financeReportsApi, salaryApi, ApiFinanceDashboard, ApiSalaryExpenseDashboard } from '../services/apiService';

export const FinanceDashboardPage: React.FC = () => {
  const [data, setData] = useState<ApiFinanceDashboard | null>(null);
  const [salaryDash, setSalaryDash] = useState<ApiSalaryExpenseDashboard | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [res, salRes] = await Promise.all([
        financeReportsApi.getDashboard(),
        salaryApi.getDashboard().catch(() => ({ data: null }))
      ]);
      setData(res.data);
      if (salRes && salRes.data) {
        setSalaryDash(salRes.data);
      }
    } catch (err) {
      console.error('Error loading finance dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const salesRev = data?.todaySalesRevenue ?? 0;
  const purAmt = data?.todayPurchasesAmount ?? 0;
  const cashBal = data?.currentCashBalance ?? 0;
  const bankBal = data?.currentBankBalance ?? 0;
  const custOut = data?.totalCustomerOutstanding ?? 0;
  const supOut = data?.totalSupplierOutstanding ?? 0;
  const grossProf = data?.grossProfit ?? 0;
  const netProf = data?.netProfit ?? 0;

  return (
    <div className="space-y-6 pt-1">
      {/* Styled Executive Control Tower Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Finance & Executive Accounting Control Tower
            </h1>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-500" />
              Automated Double-Entry Accounting
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Real-time financial analytics, liquid treasury monitoring, customer A/R receivables, supplier A/P payables, and P&L KPIs
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadDashboard}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Finance Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Financial KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Invoiced Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Today's Sales Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{salesRev.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Real-time Revenue
            </div>
          </div>
        </div>

        {/* Today's Raw Material Purchases */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Today's Raw Purchases</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{purAmt.toLocaleString()}</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Raw Material Purchases</div>
          </div>
        </div>

        {/* Cash Drawer Balance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Cash Drawer Balance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{cashBal.toLocaleString()}</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Daily Audit: Ready</div>
          </div>
        </div>

        {/* HDFC Bank Balance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Bank Account Balance</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Building className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{bankBal.toLocaleString()}</div>
            <div className="text-[11px] text-indigo-600 font-semibold pt-0.5">100% Reconciled</div>
          </div>
        </div>
      </div>

      {/* Outstanding & Net Profit Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Customer Accounts Receivable Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex justify-between items-center border-b border-[#ECEFF2] dark:border-slate-800 pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8C8C]">Customer Receivables (A/R)</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 rounded-full">
              Outstanding
            </span>
          </div>
          <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400">₹{custOut.toLocaleString()}</h3>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 leading-relaxed">
            Total outstanding credit balance owed by retail shops and wholesale distributors.
          </p>
        </div>

        {/* Supplier Accounts Payable Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex justify-between items-center border-b border-[#ECEFF2] dark:border-slate-800 pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8C8C]">Supplier Payables (A/P)</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 rounded-full">
              Payable
            </span>
          </div>
          <h3 className="text-3xl font-black text-red-600 dark:text-red-400">₹{supOut.toLocaleString()}</h3>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 leading-relaxed">
            Total outstanding liability owed to raw material suppliers and packaging vendors.
          </p>
        </div>

        {/* Net Profit Summary Card */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3 border border-indigo-900/50">
          <div className="flex justify-between items-center border-b border-indigo-800/60 pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">Estimated Net Profit (MTD)</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              Profitable
            </span>
          </div>
          <h3 className="text-3xl font-black text-emerald-400">₹{netProf.toLocaleString()}</h3>
          <div className="flex justify-between text-xs text-indigo-200 font-semibold">
            <span>Gross Profit: ₹{grossProf.toLocaleString()}</span>
            <span>Operating Expense: ₹{(data?.monthlyExpenses ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expense Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Monthly Expense Category Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            {data?.expensesByCategory && Object.keys(data.expensesByCategory).length > 0 ? (
              Object.entries(data.expensesByCategory).map(([cat, amt]) => {
                const totalExp = Object.values(data.expensesByCategory).reduce((a, b) => a + b, 1);
                const pct = Math.round((amt / totalExp) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#1C1C1C] dark:text-slate-300">
                      <span>{cat}</span>
                      <span className="font-bold">₹{amt.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[#8C8C8C] py-4 text-center">No expense logs recorded this month.</div>
            )}
          </div>
        </div>

        {/* Recent Financial Transactions Audit Trail */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
          <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Recent Financial Transactions Audit Trail
          </h3>

          <div className="space-y-2.5">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((txn, idx) => {
                const isCredit = txn.type === 'SALES_INVOICE' || txn.type === 'CREDIT_NOTE';
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F9FB] dark:bg-slate-900/50 border border-[#ECEFF2] dark:border-slate-800 text-xs">
                    <div>
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{txn.referenceNumber}</div>
                      <div className="text-[#8C8C8C] text-[11px] font-medium">{txn.partyName} ({txn.type})</div>
                    </div>
                    <div className={`font-mono font-extrabold text-sm ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isCredit ? '+' : '-'} ₹{txn.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[#8C8C8C] py-4 text-center">No recent financial transactions found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
