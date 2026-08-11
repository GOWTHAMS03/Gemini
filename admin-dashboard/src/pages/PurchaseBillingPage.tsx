import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  FileText, 
  PackageCheck,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { 
  purchasesApi, 
  suppliersApi, 
  rawMaterialApi, 
  ApiPurchaseInvoice, 
  ApiSupplier, 
  ApiRawMaterial 
} from '../services/apiService';

export const PurchaseBillingPage: React.FC = () => {
  const [purchases, setPurchases] = useState<ApiPurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [rawMaterials, setRawMaterials] = useState<ApiRawMaterial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Purchase Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | string>('');
  const [paymentMode, setPaymentMode] = useState<string>('CREDIT');
  const [purchaseItems, setPurchaseItems] = useState<{ rawMaterialId: number; quantity: number; unitCost: number }[]>([
    { rawMaterialId: 0, quantity: 1, unitCost: 0 }
  ]);
  const [freightCharges, setFreightCharges] = useState<number>(0);

  // Pay Supplier Modal State
  const [paySupplierModal, setPaySupplierModal] = useState<ApiPurchaseInvoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [purRes, supRes, matRes] = await Promise.all([
        purchasesApi.getAll(),
        suppliersApi.getAll(),
        rawMaterialApi.getAll()
      ]);
      setPurchases(purRes.data || []);
      setSuppliers(supRes.data || []);
      setRawMaterials(matRes.data || []);
    } catch (err) {
      console.error('Error loading purchase billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleAddItemRow = () => {
    setPurchaseItems([...purchaseItems, { rawMaterialId: 0, quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    if (field === 'rawMaterialId') {
      const matId = Number(value);
      const foundMat = rawMaterials.find(m => m.id === matId);
      updated[index].rawMaterialId = matId;
      if (foundMat) {
        updated[index].unitCost = foundMat.unitCost || 0;
      }
    } else {
      updated[index] = { ...updated[index], [field]: Number(value) };
    }
    setPurchaseItems(updated);
  };

  const handleCreateInvoice = async () => {
    if (!selectedSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    const validItems = purchaseItems.filter(i => i.rawMaterialId > 0 && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one raw material item.');
      return;
    }

    try {
      await purchasesApi.create({
        supplierId: Number(selectedSupplierId),
        paymentMode,
        freightCharges,
        additionalCharges: 0,
        items: validItems
      });

      showToast(`Purchase Invoice generated & Raw Material stock auto-incremented!`);
      setIsModalOpen(false);
      loadInitialData();
    } catch (err: any) {
      alert('Error creating purchase invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePaySupplierSubmit = async () => {
    if (!paySupplierModal || payAmount <= 0) return;
    try {
      await purchasesApi.paySupplier({
        supplierId: paySupplierModal.supplierId,
        purchaseInvoiceId: paySupplierModal.id,
        amount: payAmount,
        paymentMode: 'CASH',
        description: `Payment for Bill ${paySupplierModal.purchaseNumber}`
      });
      showToast(`Recorded supplier payment of ₹${payAmount} for Bill ${paySupplierModal.purchaseNumber}!`);
      setPaySupplierModal(null);
      loadInitialData();
    } catch (err: any) {
      alert('Error recording payment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePurchase = async (id: number, billNum: string) => {
    if (!window.confirm(`Are you sure you want to delete purchase bill "${billNum}"?`)) return;
    try {
      await purchasesApi.delete(id);
      showToast(`Deleted purchase bill ${billNum}`);
      loadInitialData();
    } catch (err: any) {
      alert('Error deleting purchase invoice: ' + (err.response?.data?.message || err.message));
    }
  };

  const totalBillSum = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalPaidSum = purchases.reduce((s, p) => s + p.paidAmount, 0);
  const totalOutstandingSum = purchases.reduce((s, p) => s + p.outstandingAmount, 0);

  const filteredPurchases = purchases.filter(p =>
    p.purchaseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.supplierName && p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
              Raw Material Purchase Billing & Invoices
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-blue-500" />
              {purchases.length} Purchase Invoices
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Generate raw material purchase bills, auto-update raw material inventory stock, track supplier payables, and issue vendor payments
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadInitialData}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Purchase Billing Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Purchase Invoice
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Purchase Value</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{totalBillSum.toLocaleString()}</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Raw Material Procurement</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Settled Payments</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <PackageCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">₹{totalPaidSum.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Paid to Vendors</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Supplier Payables (A/P)</span>
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-red-600 dark:text-red-400 leading-none">₹{totalOutstandingSum.toLocaleString()}</div>
            <div className="text-[11px] text-red-600 font-semibold pt-0.5">Pending Credit Balance</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Active Suppliers</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{suppliers.length || 3} Vendors</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">Registered Suppliers</div>
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
              placeholder="Search by Purchase # or Supplier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 placeholder-[#8C8C8C] pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
            />
          </div>

          <div className="text-xs text-[#8C8C8C] font-semibold">
            Showing {filteredPurchases.length} Invoices
          </div>
        </div>

        {/* Purchase List Table */}
        <div className="overflow-x-auto border border-[#ECEFF2] dark:border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-[#ECEFF2] dark:border-slate-800">
                <th className="py-3 px-4">Purchase Bill #</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4">Materials Bought</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No purchase invoices recorded in database yet. Click "Create Purchase Invoice" to post a new bill.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {pur.purchaseNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1C1C1C] dark:text-white">
                      {pur.supplierName || 'Supplier'}
                    </td>
                    <td className="py-3 px-4 text-[#8C8C8C] dark:text-slate-400 text-xs">
                      {pur.items.map(i => `${i.quantity}x ${i.rawMaterialName || 'Raw Material'}`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#1C1C1C] dark:text-white">
                      ₹{pur.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-emerald-600">
                      ₹{pur.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-red-600 dark:text-red-400">
                      ₹{pur.outstandingAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pur.paymentStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                      }`}>
                        {pur.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {pur.outstandingAmount > 0 && (
                        <button
                          onClick={() => { setPaySupplierModal(pur); setPayAmount(pur.outstandingAmount); }}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[11px] rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Pay Vendor
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePurchase(pur.id, pur.purchaseNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Delete Purchase Bill"
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

      {/* Create Purchase Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Generate Raw Material Purchase Bill</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Post supplier bill and auto-increment raw material inventory stock</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(Number(e.target.value))}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    <option value="">-- Choose Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.supplierCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">Payment Terms *</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    <option value="CREDIT">Supplier Credit Account</option>
                    <option value="CASH">Instant Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              {/* Raw Material Items Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">Raw Material Items</label>
                  <button
                    onClick={handleAddItemRow}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Material Item
                  </button>
                </div>

                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#F7F9FB] dark:bg-slate-800/60 p-3 rounded-xl border border-[#ECEFF2] dark:border-slate-800">
                    <div className="flex-1">
                      <select
                        value={item.rawMaterialId}
                        onChange={e => handleItemChange(idx, 'rawMaterialId', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-semibold"
                      >
                        <option value="0">-- Select Raw Material --</option>
                        {rawMaterials.map(r => (
                          <option key={r.id} value={r.id}>{r.name} (Code: {r.materialCode})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-20 sm:w-24 px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
                      />
                      <input
                        type="number"
                        placeholder="Cost (₹)"
                        value={item.unitCost}
                        onChange={e => handleItemChange(idx, 'unitCost', e.target.value)}
                        className="w-24 sm:w-28 px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-xs font-bold"
                      />
                      <div className="w-20 sm:w-24 font-extrabold text-xs text-[#1C1C1C] dark:text-white">
                        ₹{(item.quantity * item.unitCost).toFixed(2)}
                      </div>
                      {purchaseItems.length > 1 && (
                        <button onClick={() => handleRemoveItemRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                  onClick={handleCreateInvoice}
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Generate Bill & Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Supplier Modal */}
      {paySupplierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-md space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold">Record Supplier Payment</h3>
              <button onClick={() => setPaySupplierModal(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-3.5 text-xs">
              <div className="p-3 bg-[#F7F9FB] dark:bg-slate-800 rounded-xl space-y-1">
                <p className="text-[11px] text-[#8C8C8C]">Supplier: <strong className="text-[#1C1C1C] dark:text-white">{paySupplierModal.supplierName}</strong></p>
                <p className="text-[11px] text-[#8C8C8C]">Bill #: <strong className="text-indigo-600">{paySupplierModal.purchaseNumber}</strong></p>
                <p className="text-[11px] text-[#8C8C8C]">Outstanding Amount: <strong className="text-red-600">₹{paySupplierModal.outstandingAmount.toFixed(2)}</strong></p>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaySupplierModal(null)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePaySupplierSubmit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Submit Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseBillingPage;
