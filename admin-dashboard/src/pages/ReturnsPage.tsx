import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Receipt, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Eye, 
  Printer, 
  X, 
  Building2,
  Package,
  Trash2
} from 'lucide-react';
import { 
  returnsApi, 
  creditNotesApi, 
  ledgersApi, 
  shopApi, 
  invoiceApi, 
  productApi,
  ApiSalesReturn,
  ApiCreditNote,
  ApiExpiredProduct,
  ApiShop,
  ApiInvoice,
  ApiProduct
} from '../services/apiService';
import { CustomSelect } from '../components/common';

export const ReturnsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'returns' | 'creditNotes' | 'expiredLoss' | 'newReturn'>('returns');

  // API Data
  const [returnsList, setReturnsList] = useState<ApiSalesReturn[]>([]);
  const [creditNotesList, setCreditNotesList] = useState<ApiCreditNote[]>([]);
  const [expiredLossList, setExpiredLossList] = useState<ApiExpiredProduct[]>([]);
  const [shops, setShops] = useState<ApiShop[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form State for Return Process
  const [selectedShopId, setSelectedShopId] = useState<number | string>('');
  const [selectedOriginalInvoiceId, setSelectedOriginalInvoiceId] = useState<number | string>('');
  const [selectedInvoiceObj, setSelectedInvoiceObj] = useState<ApiInvoice | null>(null);
  const [returnReason, setReturnReason] = useState<string>('EXPIRED');
  
  // Quantities for return items { productId: returnQuantity }
  const [returnItemsInput, setReturnItemsInput] = useState<Record<number, number>>({});
  
  // Spot Fresh Replacement items { productId: quantity }
  const [isReplacementMode, setIsReplacementMode] = useState<boolean>(true);
  const [freshDeliveryInput, setFreshDeliveryInput] = useState<Record<number, number>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReturnDetails, setSelectedReturnDetails] = useState<ApiSalesReturn | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [retRes, cnRes, expRes, shopRes, invRes, prodRes] = await Promise.all([
        returnsApi.getAll(),
        creditNotesApi.getAll(),
        ledgersApi.getExpiredTracking(),
        shopApi.getAll(),
        invoiceApi.getAll(),
        productApi.getAll()
      ]);
      setReturnsList(retRes.data || []);
      setCreditNotesList(cnRes.data || []);
      setExpiredLossList(expRes.data || []);
      setShops(shopRes.data || []);
      setInvoices(invRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error loading returns data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopSelectForReturn = (shopId: number) => {
    setSelectedShopId(shopId);
    setSelectedOriginalInvoiceId('');
    setSelectedInvoiceObj(null);
    setReturnItemsInput({});
  };

  const selectedShopObj = shops.find(s => s.id === Number(selectedShopId));
  const eligibleInvoices = invoices.filter(inv => inv.shopName === selectedShopObj?.name);

  const handleInvoiceSelect = (invoiceId: number) => {
    setSelectedOriginalInvoiceId(invoiceId);
    const foundInv = invoices.find(i => i.id === invoiceId) || null;
    setSelectedInvoiceObj(foundInv);
    
    // Initialize return quantities to 0
    if (foundInv && foundInv.items) {
      const initial: Record<number, number> = {};
      foundInv.items.forEach(item => {
        const pId = item.productId || item.product?.id;
        if (pId) initial[pId] = 0;
      });
      setReturnItemsInput(initial);
    }
  };

  const handleReturnQtyChange = (productId: number, qty: number) => {
    setReturnItemsInput(prev => ({
      ...prev,
      [productId]: Math.max(0, qty)
    }));
  };

  const handleFreshQtyChange = (productId: number, qty: number) => {
    setFreshDeliveryInput(prev => ({
      ...prev,
      [productId]: Math.max(0, qty)
    }));
  };

  // Calculations for Step-by-Step Return & Spot Replacement
  const calculateReturnCreditSummary = () => {
    if (!selectedInvoiceObj || !selectedInvoiceObj.items) return { subtotal: 0, tax: 0, total: 0 };
    let subtotal = 0;
    selectedInvoiceObj.items.forEach(item => {
      const pId = item.productId || item.product?.id;
      if (pId) {
        const returnedQty = returnItemsInput[pId] || 0;
        subtotal += returnedQty * item.unitPrice;
      }
    });
    const discountRate = selectedInvoiceObj.discountPercent || 0;
    const discountedSubtotal = subtotal * (1 - discountRate / 100);
    const tax = discountedSubtotal * 0.05; // 5% GST
    return {
      subtotal: discountedSubtotal,
      tax: tax,
      total: discountedSubtotal + tax
    };
  };

  const calculateFreshSummary = () => {
    let subtotal = 0;
    Object.entries(freshDeliveryInput).forEach(([prodId, qty]) => {
      const prod = products.find(p => p.id === Number(prodId));
      if (prod && qty > 0) {
        subtotal += qty * (prod.retailPrice || prod.mrp);
      }
    });
    const tax = subtotal * 0.05;
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  };

  const handleSubmitReturnProcess = async () => {
    if (!selectedShopId || !selectedOriginalInvoiceId) {
      alert('Please select a retail shop and an original sales invoice.');
      return;
    }

    if (!selectedInvoiceObj || !selectedInvoiceObj.items) return;

    const itemsToReturn = selectedInvoiceObj.items
      .filter(item => {
        const pId = item.productId || item.product?.id;
        return pId && (returnItemsInput[pId] || 0) > 0;
      })
      .map(item => {
        const pId = item.productId || item.product?.id || 0;
        return {
          originalInvoiceItemId: item.id,
          productId: pId,
          returnedQuantity: returnItemsInput[pId] || 0
        };
      });

    if (itemsToReturn.length === 0) {
      alert('Please enter returned quantity for at least one item.');
      return;
    }

    try {
      if (isReplacementMode) {
        const replacementItems = Object.entries(freshDeliveryInput)
          .filter(([_, qty]) => qty > 0)
          .map(([productId, qty]) => ({
            productId: Number(productId),
            quantity: qty
          }));

        const payload = {
          originalInvoiceId: Number(selectedOriginalInvoiceId),
          shopId: Number(selectedShopId),
          returnReason: returnReason,
          returnedItems: itemsToReturn,
          replacementItems: replacementItems
        };

        await returnsApi.processReplacement(payload);
        alert('Spot Replacement & Net Settlement Invoice created successfully!');
      } else {
        const payload = {
          originalInvoiceId: Number(selectedOriginalInvoiceId),
          shopId: Number(selectedShopId),
          reason: returnReason,
          items: itemsToReturn
        };

        await returnsApi.create(payload);
        alert('Sales Return & Credit Note successfully generated!');
      }

      // Reset form & reload
      setSelectedShopId('');
      setSelectedOriginalInvoiceId('');
      setSelectedInvoiceObj(null);
      setReturnItemsInput({});
      setFreshDeliveryInput({});
      setActiveTab('returns');
      loadData();
    } catch (err: any) {
      alert('Error creating return: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteReturn = async (id: number, returnNum: string) => {
    if (!window.confirm(`Are you sure you want to delete sales return record "${returnNum}"?`)) return;
    try {
      await returnsApi.delete(id);
      loadData();
    } catch (err: any) {
      alert('Error deleting sales return: ' + (err.response?.data?.message || err.message));
    }
  };

  const returnSummary = calculateReturnCreditSummary();
  const freshSummary = calculateFreshSummary();
  const netPayable = Math.max(0, freshSummary.total - returnSummary.total);
  const filteredReturns = returnsList.filter(r => 
    r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.originalInvoiceNumber && r.originalInvoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pt-1">
      {/* Styled Executive Control Tower Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Sales Return & Replacement Management
            </h1>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-indigo-500" />
              {returnsList.length} Processed Sales Returns
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Process expired product returns against original sales invoices, issue credit notes, and execute spot replacements for all finished bakery SKUs
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => loadData()}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Data from API"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTab('newReturn')}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Return / Replacement
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Expired Loss Value</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              ₹{expiredLossList.reduce((sum, e) => sum + e.totalLossValue, 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-red-600 font-semibold pt-0.5">Expired Inventory Write-off</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Credit Notes Issued</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              ₹{creditNotesList.reduce((sum, c) => sum + c.totalAmount, 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold pt-0.5">Issued Customer Credits</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Applied Credit</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              ₹{creditNotesList.reduce((sum, c) => sum + c.appliedAmount, 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Adjusted in Invoices</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Returns Logged</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <RotateCcw className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{returnsList.length} Records</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">Audit Logged</div>
          </div>
        </div>
      </div>

      {/* Tabs & Data Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs space-y-4 p-4">
        {/* Tabs Segmented Switcher */}
        <div className="border-b border-[#ECEFF2] dark:border-slate-800 pb-3">
          <div className="p-0.5 bg-[#F4F5F7] dark:bg-slate-900 rounded-xl flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none max-w-full">
            <button
              onClick={() => setActiveTab('returns')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'returns'
                  ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sales Returns Log
            </button>
            <button
              onClick={() => setActiveTab('creditNotes')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'creditNotes'
                  ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Credit Notes
            </button>
            <button
              onClick={() => setActiveTab('expiredLoss')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'expiredLoss'
                  ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Expired Product Loss Audit
            </button>
            <button
              onClick={() => setActiveTab('newReturn')}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'newReturn'
                  ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Process Return & Replacement
            </button>
          </div>
        </div>

        {/* TAB 1: Sales Returns Log */}
        {activeTab === 'returns' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-3.5 h-3.5 text-[#8C8C8C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Return #, Shop Name, or Original Invoice..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 placeholder-[#8C8C8C] pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="text-xs text-[#8C8C8C] font-semibold">
                Showing {filteredReturns.length} Sales Return Log Records
              </div>
            </div>

            <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                    <th className="py-3 px-4">Return #</th>
                    <th className="py-3 px-4">Original Invoice</th>
                    <th className="py-3 px-4">Shop Name</th>
                    <th className="py-3 px-4">Returned Items</th>
                    <th className="py-3 px-4">Original Unit Price</th>
                    <th className="py-3 px-4 text-right">Credit Total</th>
                    <th className="py-3 px-4">Credit Note</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
                  {filteredReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                        No sales return records in database yet. Click "Process Return & Replacement" to log a return.
                      </td>
                    </tr>
                  ) : (
                    filteredReturns.map(ret => (
                      <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {ret.returnNumber}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#1C1C1C] dark:text-slate-200">
                          {ret.originalInvoiceNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1C1C1C] dark:text-white">
                          {ret.shopName}
                        </td>
                        <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400">
                          {ret.items.map(i => `${i.returnedQuantity}x ${i.productName}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1C1C1C] dark:text-slate-300">
                          {ret.items.map(i => `₹${i.originalUnitPrice.toFixed(2)}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{ret.totalReturnAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            <Receipt className="w-3 h-3" />
                            {ret.creditNoteNumber || 'CN-ISSUED'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => setSelectedReturnDetails(ret)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteReturn(ret.id, ret.returnNumber)}
                            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                            title="Delete Return Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Credit Notes */}
        {activeTab === 'creditNotes' && (
          <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                  <th className="py-3 px-4">Credit Note #</th>
                  <th className="py-3 px-4">Return Ref</th>
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4 text-right">Total Credit</th>
                  <th className="py-3 px-4 text-right">Applied Credit</th>
                  <th className="py-3 px-4 text-right">Remaining Credit</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
                {creditNotesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                      No credit notes issued in database yet.
                    </td>
                  </tr>
                ) : (
                  creditNotesList.map(cn => (
                    <tr key={cn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#1C1C1C] dark:text-white">
                        {cn.creditNoteNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {cn.returnNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1C1C1C] dark:text-slate-200">
                        {cn.shopName}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-[#1C1C1C] dark:text-white">
                        ₹{cn.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                        ₹{cn.appliedAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-amber-600">
                        ₹{cn.remainingAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          cn.status === 'FULLY_APPLIED'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                        }`}>
                          {cn.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: Expired Product Loss Audit */}
        {activeTab === 'expiredLoss' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-[#ECEFF2] dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1C1C] dark:text-white flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Expired Finished Goods Inventory Loss Log
              </h3>
              <span className="text-xs text-[#8C8C8C]">Tracks returned inventory loss calculations at original selling cost.</span>
            </div>
            <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                    <th className="py-3 px-4">Shop</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Expired Qty</th>
                    <th className="py-3 px-4">Original Sale Price</th>
                    <th className="py-3 px-4 text-right">Total Financial Loss</th>
                    <th className="py-3 px-4">Disposal Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
                  {expiredLossList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                        No expired product loss logged in database yet.
                      </td>
                    </tr>
                  ) : (
                    expiredLossList.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3 px-4 font-bold text-[#1C1C1C] dark:text-white">{exp.shopName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{exp.productName}</td>
                        <td className="py-3 px-4 text-red-600 font-extrabold">{exp.quantity} Packets</td>
                        <td className="py-3 px-4 font-mono font-bold">₹{exp.originalUnitPrice.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-mono font-extrabold text-red-600">₹{exp.totalLossValue.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                            {exp.disposalStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Process Return & Replacement Form */}
        {activeTab === 'newReturn' && (
          <div className="space-y-6 p-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEFF2] dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Execute Return & Spot Replacement Billing
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select retail shop, pick past invoice, enter returned expired items, and calculate spot replacement net payable.
                </p>
              </div>

              <div className="p-1 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsReplacementMode(true)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isReplacementMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Return + Spot Replacement
                </button>
                <button
                  onClick={() => setIsReplacementMode(false)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isReplacementMode ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Return Only (Credit Note)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Step 1 & 2: Select Shop & Original Sales Invoice */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    1. Select Retail Shop
                  </label>
                  <CustomSelect
                    value={selectedShopId}
                    onChange={val => handleShopSelectForReturn(Number(val))}
                    options={shops.map(s => ({
                      value: s.id,
                      label: `${s.name} (${s.shopCode})`,
                      badge: s.shopCode
                    }))}
                    placeholder="-- Choose Shop --"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. Select Original Sales Invoice
                  </label>
                  <CustomSelect
                    value={selectedOriginalInvoiceId}
                    onChange={val => handleInvoiceSelect(Number(val))}
                    disabled={!selectedShopId}
                    options={eligibleInvoices.map(inv => ({
                      value: inv.id,
                      label: `${inv.invoiceNumber} (Date: ${new Date(inv.invoiceDate || Date.now()).toLocaleDateString()}) - Total: ₹${inv.totalAmount}`,
                      badge: `₹${inv.totalAmount}`
                    }))}
                    placeholder="-- Choose Past Invoice --"
                  />
                </div>

                {selectedInvoiceObj && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-2xs">
                    <h4 className="font-extrabold text-xs text-indigo-600 uppercase tracking-wider">
                      3. Items Sold in Invoice #{selectedInvoiceObj.invoiceNumber}
                    </h4>
                    <p className="text-[11px] text-[#8C8C8C]">Enter returned quantity for expired packets below:</p>

                    <div className="space-y-2">
                      {selectedInvoiceObj.items.map(item => {
                        const pId = item.productId || item.product?.id || 0;
                        const pName = item.product?.name || 'Product Item';
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                              <span className="font-bold block text-xs">{pName}</span>
                              <span className="text-[11px] text-[#8C8C8C]">Original Unit Price: <strong>₹{item.unitPrice.toFixed(2)}</strong></span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-[#8C8C8C]">Sold: {item.quantity}</span>
                              <input
                                type="number"
                                min="0"
                                max={item.quantity}
                                value={returnItemsInput[pId] || 0}
                                onChange={e => handleReturnQtyChange(pId, Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Fresh Delivery Replacement & Net Billing */}
              <div className="space-y-4">
                {isReplacementMode && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 shadow-2xs">
                    <h4 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-500" />
                      4. Spot Fresh Product Delivery
                    </h4>
                    <p className="text-[11px] text-[#8C8C8C]">Select fresh products to deliver to the shop today:</p>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {products.map(prod => (
                        <div key={prod.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div>
                            <span className="font-bold block text-xs">{prod.name}</span>
                            <span className="text-[11px] text-emerald-600 font-bold">₹{prod.retailPrice || prod.mrp} / pkt</span>
                          </div>

                          <input
                            type="number"
                            min="0"
                            placeholder="Qty"
                            value={freshDeliveryInput[prod.id] || 0}
                            onChange={e => handleFreshQtyChange(prod.id, Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-center"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Net Settlement Calculation Summary Card */}
                <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-900/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Net Settlement Calculation</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                      Auto Calculation
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-indigo-200 font-medium">
                      <span>Returned Expired Credit Value:</span>
                      <span className="font-mono font-bold text-red-400">-₹{returnSummary.total.toFixed(2)}</span>
                    </div>

                    {isReplacementMode && (
                      <div className="flex justify-between text-indigo-200 font-medium">
                        <span>Fresh Delivery Product Invoice:</span>
                        <span className="font-mono font-bold text-emerald-400">+₹{freshSummary.total.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-indigo-800/60 font-extrabold text-sm text-white">
                      <span>{isReplacementMode ? 'Net Amount Payable by Shop:' : 'Credit Note Amount Issued:'}</span>
                      <span className="font-mono text-xl text-emerald-400">
                        ₹{isReplacementMode ? netPayable.toFixed(2) : returnSummary.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitReturnProcess}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    Confirm & Execute Net Settlement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsPage;
