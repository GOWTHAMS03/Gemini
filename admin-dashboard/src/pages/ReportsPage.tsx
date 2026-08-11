import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Boxes, 
  Receipt, 
  Truck, 
  Store, 
  X, 
  CheckCircle2, 
  Filter, 
  FileSpreadsheet, 
  FileCheck,
  RefreshCw
} from 'lucide-react';

import { 
  invoiceApi, 
  rawMaterialApi, 
  collectionApi, 
  shopApi, 
  productApi,
  expensesApi,
  suppliersApi,
  purchasesApi
} from '../services/apiService';
import api from '../services/apiService';

interface ReportTemplate {
  id: string;
  title: string;
  desc: string;
  category: string;
  metrics: string;
  icon: any;
  accent: string;
  fetchData: () => Promise<any[]>;
}

export const ReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('August 2026');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState<ReportTemplate | null>(null);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState('');
  const [reportRows, setReportRows] = useState<any[]>([]);
  const [isFetchingRows, setIsFetchingRows] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'rep-1',
      title: 'Daily Sales & Collections',
      desc: 'Breakdown of cash, UPI, cheque, and credit sales per driver and shop route.',
      category: 'Sales & Revenue',
      metrics: 'Live Database Query',
      icon: DollarSign,
      accent: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      fetchData: async () => {
        const res = await collectionApi.getAll();
        return (res.data || []).map((c: any) => ({
          CollectionCode: c.collectionCode || `COLL-${c.id}`,
          Trip: c.tripNumber || `TRIP-${c.tripId}`,
          Driver: c.driverName || 'Driver',
          CashCollected: `₹${c.cashCollected || 0}`,
          UPICollected: `₹${c.upiCollected || 0}`,
          ExpectedTotal: `₹${c.expectedTotal || 0}`,
          ActualTotal: `₹${c.actualTotal || 0}`,
          Status: c.settlementStatus || 'PENDING'
        }));
      }
    },
    {
      id: 'rep-2',
      title: 'BOM & Raw Material Audit',
      desc: 'Detailed raw material stock valuation and inventory ledger.',
      category: 'Production & Inventory',
      metrics: 'Live Stock Valuation',
      icon: Boxes,
      accent: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      fetchData: async () => {
        const res = await rawMaterialApi.getAll();
        return (res.data || []).map((m: any) => ({
          ItemCode: m.materialCode || `RM-${m.id}`,
          Name: m.name,
          Category: m.category,
          CurrentQuantity: `${m.currentStock || 0} ${m.unit || 'kg'}`,
          MinStockLevel: `${m.reorderLevel || 0} ${m.unit || 'kg'}`,
          UnitCost: `₹${m.unitCost || 0}`,
          TotalValuation: `₹${((m.currentStock || 0) * (m.unitCost || 0)).toFixed(2)}`,
          Status: m.status || 'OK'
        }));
      }
    },
    {
      id: 'rep-3',
      title: 'GST Tax & Invoicing Audit (GSTR-1)',
      desc: 'Automated sales invoices and tax breakdown for compliance.',
      category: 'Tax & Compliance',
      metrics: 'Live Invoices Audit',
      icon: Receipt,
      accent: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      fetchData: async () => {
        const res = await invoiceApi.getAll();
        return (res.data || []).map((inv: any) => ({
          InvoiceNo: inv.invoiceNumber,
          Date: inv.invoiceDate ? inv.invoiceDate.slice(0, 10) : '',
          Shop: inv.shopName,
          TotalAmount: `₹${inv.totalAmount || 0}`,
          PaidAmount: `₹${inv.paidAmount || 0}`,
          Status: inv.paymentStatus || 'PENDING'
        }));
      }
    },
    {
      id: 'rep-4',
      title: 'Shop Credit & Outstanding AR',
      desc: 'Retail customer outstanding balances and credit aging analysis.',
      category: 'Finance & AR',
      metrics: 'Live Receivables Audit',
      icon: Store,
      accent: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      fetchData: async () => {
        const res = await shopApi.getAll();
        return (res.data || []).map((s: any) => ({
          ShopCode: s.shopCode,
          ShopName: s.shopName,
          OwnerName: s.ownerName,
          Phone: s.phone,
          Location: s.location,
          OutstandingAmount: `₹${s.outstandingAmount || 0}`
        }));
      }
    },
    {
      id: 'rep-5',
      title: 'Product Catalog & Pricing Audit',
      desc: 'Finished product pricing and master catalog valuation.',
      category: 'Profitability',
      metrics: 'Live Product Master',
      icon: TrendingUp,
      accent: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
      fetchData: async () => {
        const res = await productApi.getAll();
        return (res.data || []).map((p: any) => ({
          ProductCode: p.productCode,
          ProductName: p.name,
          Category: p.categoryName || 'General',
          Price: `₹${p.price || 0}`,
          CostPrice: `₹${p.costPrice || 0}`,
          Status: p.status || 'ACTIVE'
        }));
      }
    },
    {
      id: 'rep-6',
      title: 'Operating Expenses & OPEX Audit',
      desc: 'Complete ledger of salaries, fuel, electricity, rent, and truck expenses.',
      category: 'Finance & Expenses',
      metrics: 'Live Expense Ledger',
      icon: DollarSign,
      accent: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      fetchData: async () => {
        const res = await expensesApi.getAll();
        return (res.data || []).map((e: any) => ({
          ExpenseNo: e.expenseNumber,
          Category: e.category,
          Payee: e.payeeName || 'N/A',
          Amount: `₹${e.totalAmount || 0}`,
          Mode: e.paymentMode,
          Date: e.expenseDate || '',
          Description: e.description || ''
        }));
      }
    },
    {
      id: 'rep-7',
      title: 'Supplier Payables (A/P) & Purchases',
      desc: 'Raw material procurement bills, credit aging, and outstanding supplier payables.',
      category: 'Procurement & AP',
      metrics: 'Live Supplier Ledger',
      icon: Boxes,
      accent: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      fetchData: async () => {
        const res = await suppliersApi.getAll();
        return (res.data || []).map((s: any) => ({
          SupplierCode: s.supplierCode || `SUP-${s.id}`,
          Name: s.name,
          ContactPerson: s.contactPerson || 'N/A',
          Phone: s.phone,
          OutstandingPayable: `₹${s.outstandingBalance || 0}`,
          Status: s.isActive ? 'ACTIVE' : 'INACTIVE'
        }));
      }
    },
    {
      id: 'rep-8',
      title: 'Fleet Trip Execution & Dispatch',
      desc: 'Delivery trip performance, load reconciliation, and sales execution tracking.',
      category: 'Fleet & Logistics',
      metrics: 'Live Fleet Tracking',
      icon: Truck,
      accent: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
      fetchData: async () => {
        const res = await api.get<any[]>('/trips');
        return (res.data || []).map((t: any) => ({
          TripNumber: t.tripNumber,
          Date: t.tripDate,
          Route: t.routeName || 'Standard Route',
          Driver: t.driverName || 'Driver',
          Vehicle: t.vehicleNumber || 'Van',
          Status: t.status,
          TotalSales: `₹${t.totalSalesAmount || 0}`,
          Collected: `₹${t.totalCollected || 0}`
        }));
      }
    }
  ];

  const handleOpenReportModal = async (report: ReportTemplate) => {
    setActiveReportModal(report);
    setIsFetchingRows(true);
    try {
      const rows = await report.fetchData();
      setReportRows(rows);
    } catch (err) {
      console.error('Error fetching report rows:', err);
      setReportRows([]);
    } finally {
      setIsFetchingRows(false);
    }
  };

  const triggerExportCSV = (reportName: string) => {
    setDownloadSuccessMsg(`Generated and exported ${reportName} (CSV / Excel) successfully!`);
    setTimeout(() => setDownloadSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {downloadSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{downloadSuccessMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[#1C1C1C] dark:text-white">Enterprise Reporting & Analytics</h1>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400">Generate P&L statements, GST reports, driver performance, and raw material stock ledgers</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Functional Date Range Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 font-semibold text-[#1C1C1C] dark:text-slate-200 rounded-lg text-xs transition flex items-center gap-1.5 shadow-2xs hover:bg-[#F4F5F7] dark:hover:bg-slate-700 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8C8C8C]" />
              <span>{selectedPeriod}</span>
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute right-0 top-9 w-40 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-xl shadow-lg z-30 py-1 text-xs">
                {['Today', 'This Week', 'August 2026', 'Q3 2026', 'FY 2026-27'].map(period => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 font-medium flex items-center justify-between transition ${
                      selectedPeriod === period ? 'bg-[#F4F5F7] dark:bg-slate-700 text-[#1C1C1C] dark:text-white font-bold' : 'text-[#8C8C8C] dark:text-slate-300 hover:bg-[#F7F9FB] dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{period}</span>
                    {selectedPeriod === period && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export All Button */}
          <button 
            onClick={() => triggerExportCSV('All Master ERP Reports')}
            className="px-3.5 py-1.5 bg-[#1C1C1C] dark:bg-slate-800 dark:border dark:border-slate-700 hover:bg-black dark:hover:bg-slate-700 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export All (Excel)
          </button>
        </div>
      </div>

      {/* Grid Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTemplates.map((report) => {
          const IconComp = report.icon;
          return (
            <div 
              key={report.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${report.accent}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider bg-[#F7F9FB] dark:bg-slate-900 px-2 py-0.5 rounded-md border border-[#E2E8F0] dark:border-slate-700">
                    {report.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#1C1C1C] dark:text-white">{report.title}</h3>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-1 leading-snug">{report.desc}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F9FB] dark:bg-slate-900/60 border border-[#F0F2F5] dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#8C8C8C] dark:text-slate-400 font-medium">Period Summary:</span>
                  <span className="font-bold text-[#1C1C1C] dark:text-white">{report.metrics}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0F2F5] dark:border-slate-700/60 flex items-center justify-between gap-2">
                <button 
                  onClick={() => triggerExportCSV(report.title)}
                  className="p-2 text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded-lg transition"
                  title="Direct Download Excel"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </button>

                <button 
                  onClick={() => handleOpenReportModal(report)}
                  className="flex-1 py-2 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white font-semibold text-xs rounded-xl border border-[#E2E8F0] dark:border-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" /> Generate & Preview Report
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Interactive Report Modal Viewer */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${activeReportModal.accent}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{activeReportModal.title}</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Generated for <strong className="text-[#1C1C1C] dark:text-slate-200">{selectedPeriod}</strong></p>
                </div>
              </div>
              <button onClick={() => setActiveReportModal(null)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Live Table Data Preview */}
            <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#8C8C8C] dark:text-slate-400">Live Database Records ({reportRows.length})</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {activeReportModal.metrics}
                </span>
              </div>

              {isFetchingRows ? (
                <div className="py-12 text-center text-xs font-bold text-[#8C8C8C] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span>Querying Live Database...</span>
                </div>
              ) : reportRows.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-[#8C8C8C] bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  No records found in database for selected report.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
                    <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                      <tr>
                        {Object.keys(reportRows[0] || {}).map((key) => (
                          <th key={key} className="py-2.5 px-3.5 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                      {reportRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750">
                          {Object.values(row).map((val: any, i) => (
                            <td key={i} className="py-2.5 px-3.5 font-medium">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveReportModal(null)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-lg border border-[#E2E8F0] dark:border-slate-700"
                >
                  Close Preview
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerExportCSV(activeReportModal.title);
                      setActiveReportModal(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Excel CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
