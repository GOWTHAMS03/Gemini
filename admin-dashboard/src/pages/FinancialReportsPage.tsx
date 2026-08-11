import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, 
  Printer, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  Building2,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { financeReportsApi, ApiProfitAndLoss, ApiBalanceSheet } from '../services/apiService';

export const FinancialReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PNL' | 'BALANCE_SHEET' | 'CASH_FLOW'>('PNL');
  const [startDate, setStartDate] = useState<string>('2026-08-01');
  const [endDate, setEndDate] = useState<string>('2026-08-31');
  const [pnlData, setPnlData] = useState<ApiProfitAndLoss | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<ApiBalanceSheet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const [pnlRes, bsRes] = await Promise.all([
        financeReportsApi.getProfitAndLoss(),
        financeReportsApi.getBalanceSheet()
      ]);
      setPnlData(pnlRes.data);
      setBalanceSheetData(bsRes.data);
    } catch (err) {
      console.error('Error fetching financial reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

    const pnl = {
    grossSalesRevenue: pnlData?.grossSales ?? 0.00,
    discountsGiven: pnlData?.salesReturns ?? 0.00,
    netSalesRevenue: pnlData?.netSalesRevenue ?? 0.00,
    costOfGoodsSold: pnlData?.costOfGoodsSold ?? 0.00,
    grossProfit: pnlData?.grossProfit ?? 0.00,
    salariesExpense: pnlData?.expenseBreakdown?.['SALARIES'] ?? 0.00,
    fuelExpense: pnlData?.expenseBreakdown?.['FUEL'] ?? 0.00,
    electricityExpense: pnlData?.expenseBreakdown?.['ELECTRICITY'] ?? 0.00,
    rentExpense: pnlData?.expenseBreakdown?.['RENT'] ?? 0.00,
    totalOperatingExpenses: pnlData?.totalOperatingExpenses ?? 0.00,
    netProfitBeforeTax: pnlData?.netProfitBeforeTax ?? 0.00
  };

    const bs = {
    cashBalance: balanceSheetData?.cashOnHand ?? 0.00,
    bankBalance: balanceSheetData?.bankBalance ?? 0.00,
    customerAccountsReceivable: balanceSheetData?.accountsReceivable ?? 0.00,
    rawMaterialInventoryValue: balanceSheetData?.rawMaterialInventoryValue ?? 0.00,
    finishedGoodsInventoryValue: balanceSheetData?.finishedGoodsInventoryValue ?? 0.00,
    totalAssets: balanceSheetData?.totalAssets ?? 0.00,
    supplierAccountsPayable: balanceSheetData?.accountsPayable ?? 0.00,
    taxPayable: balanceSheetData?.gstPayable ?? 0.00,
    totalLiabilities: balanceSheetData?.totalCurrentLiabilities ?? 0.00,
    ownerEquity: balanceSheetData?.totalEquity ?? 0.00
  };

  return (
    <div className="space-y-6 pt-1">
      {/* Styled Executive Control Tower Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Financial Statements & Accounting Reports
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-500" />
              Double-Entry General Ledger Statements
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Audit-ready Profit & Loss (P&L) statements, Balance Sheet assets vs liabilities, GST tax ledgers, and cash flow reports
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchReports}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Financial Statement"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4" /> Print Financial Statement
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Net Invoiced Sales</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{pnl.netSalesRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Top-Line Revenue</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Gross Profit</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <PieChart className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">₹{pnl.grossProfit.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">After COGS Deductions</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Operating Outflow</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{pnl.totalOperatingExpenses.toLocaleString()}</div>
            <div className="text-[11px] text-red-600 font-semibold pt-0.5">Salaries, Fuel, Utilities</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Net Operating Income</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">₹{pnl.netProfitBeforeTax.toLocaleString()}</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">Net Profit Before Tax</div>
          </div>
        </div>
      </div>

      {/* Tabs & Date Toolbar Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-4 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ECEFF2] dark:border-slate-800 pb-3">
          <div className="p-0.5 bg-[#F4F5F7] dark:bg-slate-900 rounded-xl flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-full">
            {[
              { id: 'PNL', label: 'Profit & Loss Statement (P&L)' },
              { id: 'BALANCE_SHEET', label: 'Balance Sheet (Assets vs Liabilities)' },
              { id: 'CASH_FLOW', label: 'Cash Flow & Tax Summary' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                    : 'text-[#8C8C8C] dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8C8C8C]" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-[#F7F9FB] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold"
            />
            <span className="text-xs text-[#8C8C8C]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-[#F7F9FB] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold"
            />
          </div>
        </div>

        {/* Tab Content Views */}
        {activeTab === 'PNL' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1C1C1C] dark:text-white uppercase tracking-wider">
              Income Statement ({startDate} to {endDate})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenue & COGS Block */}
              <div className="border border-[#ECEFF2] dark:border-slate-800 rounded-xl p-4 space-y-3 bg-[#F7F9FB] dark:bg-slate-900/50">
                <h4 className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Revenue & COGS</h4>
                <div className="space-y-2 text-xs divide-y divide-[#ECEFF2] dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#8C8C8C]">Gross Sales Revenue:</span>
                    <span className="font-mono font-bold text-[#1C1C1C] dark:text-white">₹{pnl.grossSalesRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-red-500">Less Customer Discounts:</span>
                    <span className="font-mono font-bold text-red-500">-₹{pnl.discountsGiven.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-[#1C1C1C] dark:text-white">
                    <span>Net Sales Revenue:</span>
                    <span className="font-mono">₹{pnl.netSalesRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-slate-700 dark:text-slate-300">
                    <span>Less Cost of Goods Sold (Raw Material Flour, Yeast):</span>
                    <span className="font-mono font-bold text-red-500">-₹{pnl.costOfGoodsSold.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    <span>Gross Profit:</span>
                    <span className="font-mono">₹{pnl.grossProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses Block */}
              <div className="border border-[#ECEFF2] dark:border-slate-800 rounded-xl p-4 space-y-3 bg-[#F7F9FB] dark:bg-slate-900/50">
                <h4 className="text-xs font-extrabold text-red-600 uppercase tracking-wider">Operating Expenses (OPEX)</h4>
                <div className="space-y-2 text-xs divide-y divide-[#ECEFF2] dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#8C8C8C]">Salaries & Wages:</span>
                    <span className="font-mono font-bold">₹{pnl.salariesExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Fuel & Truck Transport:</span>
                    <span className="font-mono font-bold">₹{pnl.fuelExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Electricity & Power:</span>
                    <span className="font-mono font-bold">₹{pnl.electricityExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Rent & Premises:</span>
                    <span className="font-mono font-bold">₹{pnl.rentExpense.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-red-600">
                    <span>Total OPEX Outflow:</span>
                    <span className="font-mono">-₹{pnl.totalOperatingExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    <span>Net Income Before Tax:</span>
                    <span className="font-mono">₹{pnl.netProfitBeforeTax.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'BALANCE_SHEET' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1C1C1C] dark:text-white uppercase tracking-wider">
              Balance Sheet Statement (As of {endDate})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assets Block */}
              <div className="border border-[#ECEFF2] dark:border-slate-800 rounded-xl p-4 space-y-3 bg-[#F7F9FB] dark:bg-slate-900/50">
                <h4 className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">Assets (Current & Inventory)</h4>
                <div className="space-y-2 text-xs divide-y divide-[#ECEFF2] dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#8C8C8C]">Cash Drawer Balance:</span>
                    <span className="font-mono font-bold">₹{bs.cashBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Bank Account Balance:</span>
                    <span className="font-mono font-bold">₹{bs.bankBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Customer Receivables (A/R):</span>
                    <span className="font-mono font-bold text-amber-600">₹{bs.customerAccountsReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Raw Material Inventory:</span>
                    <span className="font-mono font-bold">₹{bs.rawMaterialInventoryValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    <span>Total Company Assets:</span>
                    <span className="font-mono">₹{bs.totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Block */}
              <div className="border border-[#ECEFF2] dark:border-slate-800 rounded-xl p-4 space-y-3 bg-[#F7F9FB] dark:bg-slate-900/50">
                <h4 className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">Liabilities & Owner Equity</h4>
                <div className="space-y-2 text-xs divide-y divide-[#ECEFF2] dark:divide-slate-800">
                  <div className="flex justify-between pt-1">
                    <span className="text-[#8C8C8C]">Supplier Payables (A/P):</span>
                    <span className="font-mono font-bold text-red-500">₹{bs.supplierAccountsPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">GST Output Tax Payable:</span>
                    <span className="font-mono font-bold">₹{bs.taxPayable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-bold text-red-600">
                    <span>Total Liabilities:</span>
                    <span className="font-mono">₹{bs.totalLiabilities.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8C8C8C]">Retained Capital & Equity:</span>
                    <span className="font-mono font-bold text-purple-600">₹{bs.ownerEquity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                    <span>Total Liabilities & Equity:</span>
                    <span className="font-mono">₹{(bs.totalLiabilities + bs.ownerEquity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'CASH_FLOW' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#1C1C1C] dark:text-white uppercase tracking-wider">
              Cash Flow & Tax Summary ({startDate} to {endDate})
            </h3>
            
            <div className="p-4 border border-[#ECEFF2] dark:border-slate-800 rounded-xl bg-[#F7F9FB] dark:bg-slate-900/50 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#ECEFF2] dark:border-slate-800">
                <span className="font-bold text-[#1C1C1C] dark:text-white">Operating Cash Inflow (Sales & Debtors Collection)</span>
                <span className="font-mono font-bold text-emerald-600">+₹{pnl.grossSalesRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#ECEFF2] dark:border-slate-800">
                <span className="font-bold text-[#1C1C1C] dark:text-white">Operating Cash Outflow (Flour Purchases & OPEX)</span>
                <span className="font-mono font-bold text-red-500">-₹{(pnl.costOfGoodsSold + pnl.totalOperatingExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center font-extrabold text-sm text-indigo-600 dark:text-indigo-400 pt-1">
                <span>Net Cash Generated During Period</span>
                <span className="font-mono">{(pnl.grossSalesRevenue - (pnl.costOfGoodsSold + pnl.totalOperatingExpenses)) >= 0 ? '+' : ''}₹{(pnl.grossSalesRevenue - (pnl.costOfGoodsSold + pnl.totalOperatingExpenses)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReportsPage;
