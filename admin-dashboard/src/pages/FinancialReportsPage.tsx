import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  FileText, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  Building2,
  CheckCircle2,
  Receipt,
  Scale,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Sparkles,
  ShieldCheck,
  Percent,
  Wallet
} from 'lucide-react';
import { 
  financeReportsApi, 
  ApiProfitAndLoss, 
  ApiBalanceSheet, 
  ApiCashFlow, 
  ApiTrialBalance, 
  ApiGstSummary, 
  ApiJournalEntry 
} from '../services/apiService';
import { CustomDatePicker } from '../components/common';

export const FinancialReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PNL' | 'BALANCE_SHEET' | 'CASH_FLOW' | 'TRIAL_BALANCE' | 'JOURNAL_ENTRIES' | 'GST_RETURNS'>('PNL');
  
  // Default to current month-to-date
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonthStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  
  const [startDate, setStartDate] = useState<string>(firstOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [asOfDate, setAsOfDate] = useState<string>(todayStr);

  const [pnlData, setPnlData] = useState<ApiProfitAndLoss | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<ApiBalanceSheet | null>(null);
  const [cashFlowData, setCashFlowData] = useState<ApiCashFlow | null>(null);
  const [trialBalanceData, setTrialBalanceData] = useState<ApiTrialBalance | null>(null);
  const [gstData, setGstData] = useState<ApiGstSummary | null>(null);
  const [journalEntries, setJournalEntries] = useState<ApiJournalEntry[]>([]);

  const [journalSearch, setJournalSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, asOfDate, activeTab]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'PNL') {
        const res = await financeReportsApi.getProfitAndLoss(startDate, endDate);
        setPnlData(res.data);
      } else if (activeTab === 'BALANCE_SHEET') {
        const res = await financeReportsApi.getBalanceSheet(asOfDate);
        setBalanceSheetData(res.data);
      } else if (activeTab === 'CASH_FLOW') {
        const res = await financeReportsApi.getCashFlow(startDate, endDate);
        setCashFlowData(res.data);
      } else if (activeTab === 'TRIAL_BALANCE') {
        const res = await financeReportsApi.getTrialBalance(asOfDate);
        setTrialBalanceData(res.data);
      } else if (activeTab === 'GST_RETURNS') {
        const res = await financeReportsApi.getGstSummary(startDate, endDate);
        setGstData(res.data);
      } else if (activeTab === 'JOURNAL_ENTRIES') {
        const res = await financeReportsApi.getJournalEntries();
        setJournalEntries(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching financial reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setPresetRange = (preset: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'YTD' | 'ALL') => {
    const today = new Date();
    let s = new Date();
    let e = new Date();

    switch (preset) {
      case 'TODAY':
        s = today;
        e = today;
        break;
      case 'THIS_WEEK':
        s = new Date(today);
        s.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
        e = today;
        break;
      case 'THIS_MONTH':
        s = new Date(today.getFullYear(), today.getMonth(), 1);
        e = today;
        break;
      case 'LAST_MONTH':
        s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        e = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'YTD':
        s = new Date(today.getFullYear(), 0, 1);
        e = today;
        break;
      case 'ALL':
        s = new Date(2025, 0, 1);
        e = today;
        break;
    }

    setStartDate(s.toISOString().slice(0, 10));
    setEndDate(e.toISOString().slice(0, 10));
    setAsOfDate(e.toISOString().slice(0, 10));
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredJournalEntries = journalEntries.filter(je => {
    if (!journalSearch) return true;
    const query = journalSearch.toLowerCase();
    return (
      je.entryNumber.toLowerCase().includes(query) ||
      (je.referenceNumber && je.referenceNumber.toLowerCase().includes(query)) ||
      (je.description && je.description.toLowerCase().includes(query)) ||
      je.lines.some(l => l.accountCode.includes(query) || (l.memo && l.memo.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="space-y-6 pt-1">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Financial Statements & Accounting Hub
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-500" />
              GAAP & Double-Entry Aligned
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Audit-ready Profit & Loss (P&L), Balance Sheet, Cash Flow statement, Trial Balance verification, GST Tax returns, and General Ledger journal entries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchReports}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Financial Statement"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" /> Print Statement
          </button>
        </div>
      </div>

      {/* Tabs Bar & Range Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-4 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#ECEFF2] dark:border-slate-800 pb-3">
          {/* Tabs */}
          <div className="p-0.5 bg-[#F4F5F7] dark:bg-slate-900 rounded-xl flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-full">
            {[
              { id: 'PNL', label: '1. Profit & Loss (P&L)', icon: TrendingUp },
              { id: 'BALANCE_SHEET', label: '2. Balance Sheet', icon: Scale },
              { id: 'CASH_FLOW', label: '3. Cash Flow', icon: Wallet },
              { id: 'TRIAL_BALANCE', label: '4. Trial Balance', icon: BookOpen },
              { id: 'JOURNAL_ENTRIES', label: '5. Journal Entries', icon: Receipt },
              { id: 'GST_RETURNS', label: '6. GST Tax Returns', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                      : 'text-[#8C8C8C] dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Date Range Selector & Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F8F9FA] dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'Week' },
                { id: 'THIS_MONTH', label: 'MTD' },
                { id: 'LAST_MONTH', label: 'Last Mo' },
                { id: 'YTD', label: 'YTD' },
                { id: 'ALL', label: 'All' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPresetRange(p.id as any)}
                  className="px-2 py-0.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {activeTab === 'BALANCE_SHEET' || activeTab === 'TRIAL_BALANCE' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">As of Date:</span>
                <div className="w-36">
                  <CustomDatePicker value={asOfDate} onChange={setAsOfDate} placeholder="As of Date" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-36">
                  <CustomDatePicker value={startDate} onChange={setStartDate} placeholder="Start Date" />
                </div>
                <span className="text-xs font-bold text-[#8C8C8C]">to</span>
                <div className="w-36">
                  <CustomDatePicker value={endDate} onChange={setEndDate} placeholder="End Date" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── TAB 1: PROFIT & LOSS STATEMENT ─────────────────────────────────── */}
        {activeTab === 'PNL' && pnlData && (
          <div className="space-y-5 animate-in fade-in">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Net Sales Revenue</span>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-200 font-mono">₹{pnlData.netSalesRevenue.toLocaleString()}</div>
                <div className="text-[11px] text-blue-600 font-semibold">Gross ₹{pnlData.grossSales.toLocaleString()} - Ret ₹{(pnlData.salesReturns ?? 0).toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Gross Profit (Margin)</span>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">₹{pnlData.grossProfit.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Percent className="w-3 h-3" /> {pnlData.grossProfitMarginPct ?? 0}% Gross Margin
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Operating Expenses (OPEX)</span>
                <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">₹{pnlData.totalOperatingExpenses.toLocaleString()}</div>
                <div className="text-[11px] text-amber-600 font-semibold">Salaries, Fuel, Rent, Utilities</div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Net Operating Profit</span>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-200 font-mono">₹{pnlData.netProfit.toLocaleString()}</div>
                <div className="text-[11px] text-purple-600 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {pnlData.netProfitMarginPct ?? 0}% Net Profit Margin
                </div>
              </div>
            </div>

            {/* Income Statement Detailed Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Income Statement Breakdown ({startDate} to {endDate})
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">Currency: INR (₹)</span>
              </div>

              <div className="p-5 space-y-4 text-xs font-mono">
                {/* 1. Operating Revenue */}
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-sans font-extrabold text-indigo-600 uppercase">1. Revenue from Sales</span>
                    <span>AMOUNT</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-300">
                    <span className="font-sans">Gross Sales Invoices</span>
                    <span>₹{pnlData.grossSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-red-500">
                    <span className="font-sans">Less Customer Line Discounts</span>
                    <span>-₹{(pnlData.customerDiscounts ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-red-500">
                    <span className="font-sans">Less Sales Returns & Credit Notes</span>
                    <span>-₹{(pnlData.salesReturns ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pl-4 pt-1 font-bold text-slate-900 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span className="font-sans font-bold">Net Sales Revenue</span>
                    <span>₹{pnlData.netSalesRevenue.toLocaleString()}</span>
                  </div>
                </div>

                {/* 2. Cost of Goods Sold */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-sans font-extrabold text-amber-600 uppercase">2. Cost of Goods Sold (BOM Recipe Calculation)</span>
                    <span></span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600 dark:text-slate-300">
                    <span className="font-sans">Direct Raw Material Consumption (Flour, Yeast, Butter, Sugar, Salt)</span>
                    <span className="text-red-500">-₹{pnlData.costOfGoodsSold.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pl-4 pt-1 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm border-t border-slate-200 dark:border-slate-700">
                    <span className="font-sans">GROSS PROFIT</span>
                    <span>₹{pnlData.grossProfit.toLocaleString()} ({pnlData.grossProfitMarginPct ?? 0}%)</span>
                  </div>
                </div>

                {/* 3. Operating Expenses */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-sans font-extrabold text-red-600 uppercase">3. Operating Expenses (OPEX)</span>
                    <span></span>
                  </div>
                  {pnlData.expenseBreakdown && Object.keys(pnlData.expenseBreakdown).length > 0 ? (
                    Object.entries(pnlData.expenseBreakdown).map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between pl-4 text-slate-600 dark:text-slate-300">
                        <span className="font-sans capitalize">{cat.toLowerCase().replace(/_/g, ' ')}</span>
                        <span>₹{amt.toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="pl-4 text-slate-400 italic">No operating expenses recorded for period.</div>
                  )}
                  <div className="flex justify-between pl-4 pt-1 font-bold text-red-600 border-t border-dashed border-slate-200 dark:border-slate-700">
                    <span className="font-sans font-bold">Total Operating Expenses</span>
                    <span>-₹{pnlData.totalOperatingExpenses.toLocaleString()}</span>
                  </div>
                </div>

                {/* 4. Net Profit */}
                <div className="pt-3 border-t-2 border-slate-900 dark:border-slate-600">
                  <div className="flex justify-between font-black text-base text-purple-700 dark:text-purple-300">
                    <span className="font-sans">NET INCOME / PROFIT (AFTER OPEX)</span>
                    <span>₹{pnlData.netProfit.toLocaleString()} ({pnlData.netProfitMarginPct ?? 0}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: BALANCE SHEET STATEMENT ─────────────────────────────────── */}
        {activeTab === 'BALANCE_SHEET' && balanceSheetData && (
          <div className="space-y-5 animate-in fade-in">
            {/* Double Entry Balancing Banner */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
              balanceSheetData.isBalanced !== false
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="font-extrabold text-xs">Double-Entry General Ledger Balance Status: 100% Balanced</h4>
                  <p className="text-[11px] opacity-80">
                    Total Assets (₹{balanceSheetData.totalAssets.toLocaleString()}) strictly matches Total Liabilities & Equity (₹{balanceSheetData.totalLiabilitiesAndEquity.toLocaleString()})
                  </p>
                </div>
              </div>
              <div className="font-mono font-black text-sm">
                Assets = Liabilities + Equity
              </div>
            </div>

            {/* Assets vs Liabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Assets Block */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800 flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Company Assets (Current & Stock)
                  </h4>
                  <span className="font-mono font-bold text-emerald-700 text-xs">₹{balanceSheetData.totalCurrentAssets.toLocaleString()}</span>
                </div>
                <div className="p-4 space-y-2.5 text-xs font-mono divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="font-sans text-slate-600 dark:text-slate-300">1000 • Cash on Hand (Drawer Treasury)</span>
                    <span className="font-bold">₹{balanceSheetData.cashOnHand.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">1100 • HDFC Bank Account</span>
                    <span className="font-bold">₹{balanceSheetData.bankBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">1200 • Accounts Receivable (Shop Debtors)</span>
                    <span className="font-bold text-amber-600">₹{balanceSheetData.accountsReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">1300 • Raw Material Warehouse Inventory</span>
                    <span className="font-bold">₹{balanceSheetData.rawMaterialInventoryValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">1400 • Finished Goods Inventory (Warehouse Loaves)</span>
                    <span className="font-bold">₹{balanceSheetData.finishedGoodsInventoryValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    <span className="font-sans">TOTAL ASSETS</span>
                    <span>₹{balanceSheetData.totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Block */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-800 flex justify-between items-center">
                  <h4 className="text-xs font-extrabold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                    Liabilities & Owner Equity
                  </h4>
                  <span className="font-mono font-bold text-purple-700 text-xs">₹{balanceSheetData.totalLiabilitiesAndEquity.toLocaleString()}</span>
                </div>
                <div className="p-4 space-y-2.5 text-xs font-mono divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="font-sans text-slate-600 dark:text-slate-300">2000 • Accounts Payable (Supplier Creditors)</span>
                    <span className="font-bold text-red-500">₹{balanceSheetData.accountsPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">2100 • GST Output Tax Payable</span>
                    <span className="font-bold">₹{balanceSheetData.gstPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-red-600">
                    <span className="font-sans">Total Current Liabilities</span>
                    <span>₹{balanceSheetData.totalCurrentLiabilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">3000 • Owner's Capital Base</span>
                    <span className="font-bold">₹{(balanceSheetData.ownersCapital ?? 100000).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-sans text-slate-600 dark:text-slate-300">3100 • Cumulative Retained Earnings</span>
                    <span className="font-bold text-purple-600">₹{balanceSheetData.retainedEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-black text-purple-600 dark:text-purple-400 text-sm">
                    <span className="font-sans">TOTAL LIABILITIES & EQUITY</span>
                    <span>₹{balanceSheetData.totalLiabilitiesAndEquity.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: CASH FLOW STATEMENT ────────────────────────────────────── */}
        {activeTab === 'CASH_FLOW' && cashFlowData && (
          <div className="space-y-5 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Operating Cash Inflow</span>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">+₹{cashFlowData.totalOperatingCashInflow.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600">Sales Invoices & Route Collections</div>
              </div>

              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 space-y-1">
                <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Operating Cash Outflow</span>
                <div className="text-2xl font-black text-red-900 dark:text-red-200 font-mono">-₹{cashFlowData.totalOperatingCashOutflow.toLocaleString()}</div>
                <div className="text-[11px] text-red-600">Raw Materials & OPEX Outflows</div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Net Treasury Movement</span>
                <div className="text-2xl font-black text-indigo-900 dark:text-indigo-200 font-mono">{cashFlowData.netOperatingCashFlow >= 0 ? '+' : ''}₹{cashFlowData.netOperatingCashFlow.toLocaleString()}</div>
                <div className="text-[11px] text-indigo-600">Closing Cash & Bank: ₹{cashFlowData.closingCashAndBank.toLocaleString()}</div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Direct Cash Flow Statement ({startDate} to {endDate})
              </h4>
              <div className="space-y-2 text-xs font-mono divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between pt-1">
                  <span className="font-sans font-bold text-emerald-600">Cash Collections from Immediate Sales (Cash / UPI)</span>
                  <span className="text-emerald-600">+₹{cashFlowData.cashFromSalesInvoices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-sans font-bold text-emerald-600">Collections from Credit Customers (A/R Cleared)</span>
                  <span className="text-emerald-600">+₹{cashFlowData.cashFromCustomerDebtors.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-sans font-bold text-red-500">Payments to Raw Material & Packaging Suppliers</span>
                  <span className="text-red-500">-₹{cashFlowData.cashPaidForRawMaterials.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="font-sans font-bold text-red-500">Operating Expenses (Payroll, Fuel, Utilities, Rent)</span>
                  <span className="text-red-500">-₹{cashFlowData.cashPaidForExpensesAndSalaries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 font-black text-sm text-indigo-600 dark:text-indigo-400 border-t-2 border-slate-900 dark:border-slate-600">
                  <span className="font-sans">NET OPERATING CASH FLOW GENERATED</span>
                  <span>{cashFlowData.netOperatingCashFlow >= 0 ? '+' : ''}₹{cashFlowData.netOperatingCashFlow.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: TRIAL BALANCE ─────────────────────────────────────────── */}
        {activeTab === 'TRIAL_BALANCE' && trialBalanceData && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Trial Balance Verification (As of {asOfDate})
                </h4>
                <p className="text-[11px] text-slate-500">Double-entry debit and credit verification across all active chart of accounts.</p>
              </div>
              <div className="text-right font-mono">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                  trialBalanceData.isBalanced
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  {trialBalanceData.isBalanced ? '✓ DEBITS EQUAL CREDITS (BALANCED)' : '⚠️ DISCREPANCY DETECTED'}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider font-sans font-bold">
                  <tr>
                    <th className="p-3">Account Code</th>
                    <th className="p-3">Account Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Debit Balance (₹)</th>
                    <th className="p-3 text-right">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {trialBalanceData.accounts.map(acc => (
                    <tr key={acc.accountCode} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">{acc.accountCode}</td>
                      <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{acc.accountName}</td>
                      <td className="p-3 font-sans text-slate-500">{acc.accountType}</td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {acc.debitBalance > 0 ? `₹${acc.debitBalance.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {acc.creditBalance > 0 ? `₹${acc.creditBalance.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 dark:bg-slate-800 font-black text-sm border-t-2 border-slate-900 dark:border-slate-600">
                    <td colSpan={3} className="p-3 font-sans uppercase">Total Trial Balance</td>
                    <td className="p-3 text-right text-emerald-600">₹{trialBalanceData.totalDebits.toLocaleString()}</td>
                    <td className="p-3 text-right text-emerald-600">₹{trialBalanceData.totalCredits.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 5: JOURNAL ENTRIES AUDIT TRAIL ────────────────────────────── */}
        {activeTab === 'JOURNAL_ENTRIES' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search journal entries, reference, memo..."
                  value={journalSearch}
                  onChange={e => setJournalSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                />
              </div>
              <span className="text-xs font-bold text-slate-500">{filteredJournalEntries.length} Double-Entry Vouchers Logged</span>
            </div>

            <div className="space-y-3">
              {filteredJournalEntries.map(entry => (
                <div key={entry.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{entry.entryNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        {entry.referenceType || 'GENERAL_JOURNAL'}
                      </span>
                      {entry.referenceNumber && (
                        <span className="text-slate-400 font-mono text-[11px]">Ref: {entry.referenceNumber}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] font-mono">
                      <span>Date: {entry.entryDate ? new Date(entry.entryDate).toLocaleString() : ''}</span>
                      <span className="font-bold text-slate-900 dark:text-white">Total: ₹{entry.totalDebit.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300">{entry.description}</p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[10px] uppercase font-sans">
                        <tr>
                          <th className="p-2">Account Code</th>
                          <th className="p-2">Line Memo</th>
                          <th className="p-2 text-right">Debit (₹)</th>
                          <th className="p-2 text-right">Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {entry.lines.map(line => (
                          <tr key={line.id}>
                            <td className="p-2 font-bold text-indigo-600">{line.accountCode}</td>
                            <td className="p-2 font-sans text-slate-600 dark:text-slate-300">{line.memo || entry.description}</td>
                            <td className="p-2 text-right font-bold">{line.debitAmount > 0 ? `₹${line.debitAmount.toFixed(2)}` : '-'}</td>
                            <td className="p-2 text-right font-bold">{line.creditAmount > 0 ? `₹${line.creditAmount.toFixed(2)}` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 6: GST TAX RETURNS ─────────────────────────────────────────── */}
        {activeTab === 'GST_RETURNS' && gstData && (
          <div className="space-y-5 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-1">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Output GST Collected (Sales)</span>
                <div className="text-2xl font-black text-blue-900 dark:text-blue-200 font-mono">₹{gstData.totalOutputGst.toLocaleString()}</div>
                <div className="text-[11px] text-blue-600">CGST ₹{gstData.outputCgst.toLocaleString()} + SGST ₹{gstData.outputSgst.toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Input Tax Credit (ITC Purchases)</span>
                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">₹{gstData.totalInputTaxCredit.toLocaleString()}</div>
                <div className="text-[11px] text-emerald-600">CGST ₹{gstData.inputCgst.toLocaleString()} + SGST ₹{gstData.inputSgst.toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-1">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Net GST Liability Payable</span>
                <div className="text-2xl font-black text-purple-900 dark:text-purple-200 font-mono">₹{gstData.netGstPayable.toLocaleString()}</div>
                <div className="text-[11px] text-purple-600">ITC Carry Forward: ₹{gstData.itcCarryForward.toLocaleString()}</div>
              </div>
            </div>

            {/* Sales Tax Invoices Table */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Outward Supplies (GSTR-1 Sales Invoices)
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500">{gstData.salesTaxInvoices.length} Invoices</span>
              </div>
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase font-sans">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Customer Shop</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Taxable Value (₹)</th>
                    <th className="p-3 text-right">GST Rate</th>
                    <th className="p-3 text-right">GST Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {gstData.salesTaxInvoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-bold text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">{inv.partyName}</td>
                      <td className="p-3 text-slate-500">{inv.gstin}</td>
                      <td className="p-3">{inv.date}</td>
                      <td className="p-3 text-right font-bold">₹{inv.taxableValue.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold">{inv.gstRate}%</td>
                      <td className="p-3 text-right font-black text-blue-600">₹{inv.gstAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReportsPage;
