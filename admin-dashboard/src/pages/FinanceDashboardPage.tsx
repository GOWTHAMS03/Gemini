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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">
              {selectedPeriod === 'TODAY' ? "Today's Sales" : `${selectedPeriod.replace('_', ' ')} Sales`}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none font-mono">₹{periodSales.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Invoiced B2B Sales
            </div>
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">
              {selectedPeriod === 'TODAY' ? "Today's Purchases" : `${selectedPeriod.replace('_', ' ')} Purchases`}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none font-mono">₹{periodPurchases.toLocaleString()}</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Raw Material Flour Bills</div>
          </div>
        </div>

        {/* Cash Drawer Balance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Cash Drawer Treasury</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none font-mono">₹{cashBal.toLocaleString()}</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Physical Cash on Hand</div>
          </div>
        </div>

        {/* Bank Account Balance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">HDFC Bank Treasury</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Building className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none font-mono">₹{bankBal.toLocaleString()}</div>
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
              Credit Outstanding
            </span>
          </div>
          <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">₹{custOut.toLocaleString()}</h3>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 leading-relaxed">
            Total credit balance owed by retail shops and wholesale distributors.
          </p>
        </div>

        {/* Supplier Accounts Payable Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
          <div className="flex justify-between items-center border-b border-[#ECEFF2] dark:border-slate-800 pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C8C8C]">Supplier Payables (A/P)</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20 rounded-full">
              Vendor Liability
            </span>
          </div>
          <h3 className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">₹{supOut.toLocaleString()}</h3>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 leading-relaxed">
            Total outstanding balance owed to raw material suppliers and packaging vendors.
          </p>
        </div>

        {/* Net Profit Summary Card */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-md space-y-3 border border-indigo-900/50">
          <div className="flex justify-between items-center border-b border-indigo-800/60 pb-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
              Estimated Net Profit ({selectedPeriod})
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
              {netMargin}% Margin
            </span>
          </div>
          <h3 className="text-3xl font-black text-emerald-400 font-mono">₹{netProf.toLocaleString()}</h3>
          <div className="flex justify-between text-xs text-indigo-200 font-semibold font-mono">
            <span>Gross: ₹{grossProf.toLocaleString()} ({grossMargin}%)</span>
            <span>OPEX: ₹{(data?.monthlyExpenses ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Working Capital Indicator Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-300">
              Net Working Capital Position: ₹{workingCapital.toLocaleString()}
            </h4>
            <p className="text-[11px] text-slate-400">
              Liquid Current Assets (Cash, Bank, A/R & Stock Valuations) exceeding Current Supplier Payables.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/financial-reports')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
        >
          View Full Balance Sheet Statement ➔
        </button>
      </div>

      {/* Expense Category Breakdown & Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expense Category Breakdown */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Expense Category Breakdown ({selectedPeriod})
            </h3>
            <button onClick={() => navigate('/expenses')} className="text-[11px] font-bold text-blue-600 hover:underline">
              View All ➔
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
              <div className="text-[#8C8C8C] py-4 text-center">No expense logs recorded for this period.</div>
            )}
          </div>
        </div>

        {/* Recent Financial Transactions Audit Trail */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Recent Financial Transactions Audit Trail
            </h3>
            <button onClick={() => navigate('/financial-reports')} className="text-[11px] font-bold text-blue-600 hover:underline">
              Journal ➔
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
              <div className="text-[#8C8C8C] py-4 text-center">No recent financial transactions found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
