import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
  Scale,
  Percent,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { financeReportsApi, salaryApi, ApiFinanceDashboard, ApiSalaryExpenseDashboard } from '../services/apiService';

export const FinanceDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ApiFinanceDashboard | null>(null);
  const [salaryDash, setSalaryDash] = useState<ApiSalaryExpenseDashboard | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'THIS_WEEK' | 'MTD' | 'ALL_TIME'>('MTD');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDashboard();
  }, [selectedPeriod]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [res, salRes] = await Promise.all([
        financeReportsApi.getDashboard(selectedPeriod),
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

  const periodSales = data?.periodSalesRevenue ?? data?.todaySalesRevenue ?? 0;
  const periodPurchases = data?.periodPurchasesAmount ?? data?.todayPurchasesAmount ?? 0;
  const cashBal = data?.currentCashBalance ?? 0;
  const bankBal = data?.currentBankBalance ?? 0;
  const custOut = data?.totalCustomerOutstanding ?? 0;
  const supOut = data?.totalSupplierOutstanding ?? 0;
  const grossProf = data?.grossProfit ?? 0;
  const netProf = data?.netProfit ?? 0;
  const workingCapital = data?.workingCapital ?? ((cashBal + bankBal + custOut) - supOut);
  const grossMargin = data?.grossProfitMarginPct ?? 0;
  const netMargin = data?.netProfitMarginPct ?? 0;

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
              Automated Double-Entry General Ledger
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Real-time financial analytics, liquid treasury monitoring, customer A/R receivables, supplier A/P payables, and GAAP statements
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Period Filter Selector */}
          <div className="flex items-center gap-1 bg-[#F8F9FA] dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
            {[
              { id: 'TODAY', label: "Today" },
              { id: 'THIS_WEEK', label: 'This Week' },
              { id: 'MTD', label: 'Month-to-Date' },
              { id: 'ALL_TIME', label: 'All Time' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  selectedPeriod === p.id
                    ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadDashboard}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Finance Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/cash-bank')}
          className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center gap-3 transition group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">Cash & Bank Treasury</div>
            <div className="text-[10px] text-slate-400">Drawer & Bank Transfers</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/financial-reports')}
          className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center gap-3 transition group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">Financial Statements</div>
            <div className="text-[10px] text-slate-400">P&L, Balance Sheet, GST</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/expenses')}
          className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center gap-3 transition group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition">Operating Expenses</div>
            <div className="text-[10px] text-slate-400">Payroll, Fuel & Utilities</div>
          </div>
        </button>

        <button
          onClick={() => navigate('/purchases')}
          className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-left flex items-center gap-3 transition group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">Purchase Billing</div>
            <div className="text-[10px] text-slate-400">Raw Materials & Suppliers</div>
          </div>
        </button>
      </div>

      {/* Top Financial KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Sales Revenue */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs flex flex-col justify-between min-h-[140px] transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {selectedPeriod === 'MTD' ? 'MTD SALES' : `${selectedPeriod.replace('_', ' ')} SALES`}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-mono">
              ₹{periodSales.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Invoiced B2B Sales
            </div>
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs flex flex-col justify-between min-h-[140px] transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {selectedPeriod === 'MTD' ? 'MTD PURCHASES' : `${selectedPeriod.replace('_', ' ')} PURCHASES`}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-mono">
              ₹{periodPurchases.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Raw Material Flour Bills
            </div>
          </div>
        </div>

        {/* Cash Drawer Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs flex flex-col justify-between min-h-[140px] transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              CASH DRAWER TREASURY
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/40">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-mono">
              ₹{cashBal.toLocaleString()}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
              Physical Cash on Hand
            </div>
          </div>
        </div>

        {/* Bank Account Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs flex flex-col justify-between min-h-[140px] transition-all hover:shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              HDFC BANK TREASURY
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/40">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none font-mono">
              ₹{bankBal.toLocaleString()}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              100% Reconciled
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding & Net Profit Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Customer Accounts Receivable Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              CUSTOMER RECEIVABLES (A/R)
            </span>
            <span className="text-[10px] font-extrabold px-3 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/50 rounded-full shrink-0">
              Credit Outstanding
            </span>
          </div>
          <div className="text-3xl font-extrabold text-amber-500 dark:text-amber-400 font-mono tracking-tight">
            ₹{custOut.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Total credit balance owed by retail shops and wholesale distributors.
          </p>
        </div>

        {/* Supplier Accounts Payable Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              SUPPLIER PAYABLES (A/P)
            </span>
            <span className="text-[10px] font-extrabold px-3 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/80 dark:border-rose-700/50 rounded-full shrink-0">
              Vendor Liability
            </span>
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            ₹{supOut.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Total outstanding balance owed to raw material suppliers and packaging vendors.
          </p>
        </div>

        {/* Net Profit Summary Card */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-5 sm:p-6 border border-slate-800/80 shadow-md space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
              ESTIMATED NET PROFIT ({selectedPeriod})
            </span>
            <span className="text-[10px] font-extrabold px-3 py-0.5 bg-[#064E3B]/70 text-[#34D399] border border-emerald-500/30 rounded-full shrink-0">
              {netMargin}% Margin
            </span>
          </div>
          <div className="text-3xl font-black text-[#10B981] font-mono tracking-tight">
            ₹{netProf.toLocaleString()}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold font-mono pt-1">
            <span>Gross: ₹{grossProf.toLocaleString()} ({grossMargin}%)</span>
            <span>OPEX: ₹{(data?.monthlyExpenses ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Working Capital Indicator Banner */}
      <div className="p-5 bg-[#0F172A] text-white rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
              NET WORKING CAPITAL POSITION: ₹{workingCapital.toLocaleString()}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">
              Liquid Current Assets (Cash, Bank, A/R & Stock Valuations) exceeding Current Supplier Payables.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/financial-reports')}
          className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
        >
          View Full Balance Sheet Statement →
        </button>
      </div>

      {/* Expense Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Expense Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              EXPENSE CATEGORY BREAKDOWN ({selectedPeriod})
            </h3>
            <button 
              onClick={() => navigate('/expenses')} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {data?.expensesByCategory && Object.keys(data.expensesByCategory).length > 0 ? (
              Object.entries(data.expensesByCategory).map(([cat, amt]) => {
                const totalExp = Object.values(data.expensesByCategory).reduce((a, b) => a + b, 1);
                const pct = Math.round((amt / totalExp) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-[#1C1C1C] dark:text-slate-300 font-mono">
                      <span className="font-sans capitalize">{cat.toLowerCase().replace(/_/g, ' ')}</span>
                      <span className="font-bold">₹{amt.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-400 dark:text-slate-500 py-8 text-center text-xs">
                No expense logs recorded for this period.
              </div>
            )}
          </div>
        </div>

        {/* Recent Financial Transactions Audit Trail */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              RECENT FINANCIAL TRANSACTIONS AUDIT TRAIL
            </h3>
            <button 
              onClick={() => navigate('/financial-reports')} 
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 transition cursor-pointer"
            >
              Journal →
            </button>
          </div>

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
              <div className="text-slate-400 dark:text-slate-500 py-8 text-center text-xs">
                No recent financial transactions found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
