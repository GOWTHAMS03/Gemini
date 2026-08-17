import React, { useState, useEffect } from 'react';
import { invoiceApi, productApi, shopApi, salesDeliveryApi, ApiProduct, ApiShop } from '../services/apiService';
import {
  calculateProductSellingPrice,
  validateShopMinimumPrice,
  normalizeCustomerType,
  PricingProduct,
  PricingBuyer
} from '../services/pricingService';
import { CustomSelect } from '../components/common';
import { 
  Download, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  X, 
  Printer, 
  Building2, 
  Receipt,
  User,
  Truck,
  MapPin,
  ShieldCheck,
  Tag,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Layers,
  Store,
  Users
} from 'lucide-react';

export interface InvoiceItemData {
  id: number;
  invoiceNumber: string;
  shop: string;
  shopAddress: string;
  shopGstin: string;
  customerType: 'SHOP' | 'WHOLESALE_DEALER' | 'CUSTOMER';
  discountPercent: number;
  discountAmount: number;
  driver: string;
  route: string;
  subtotal: number;
  taxAmount: number;
  amount: number;
  mode: 'UPI' | 'CASH' | 'CREDIT';
  status: 'PAID' | 'PENDING';
  date: string;
  items: { name: string; qty: number; unitPrice: number; total: number }[];
}

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceItemData[]>([]);
  const [products, setProducts] = useState<PricingProduct[]>([]);
  const [shops, setShops] = useState<PricingBuyer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'UPI' | 'CASH' | 'CREDIT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Invoices from Backend API
  const fetchInvoices = () => {
    setIsLoading(true);
    invoiceApi.getAll()
      .then((res) => {
        if (res.data) {
          const mapped: InvoiceItemData[] = res.data.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            shop: inv.shop?.name || 'Retail Outlet',
            shopAddress: inv.shop?.address || 'Main Road, Tamil Nadu',
            shopGstin: inv.shop?.gstin || '33AAAAA0000A1Z5',
            customerType: normalizeCustomerType(inv.customerType || inv.shop?.customerType),
            discountPercent: inv.discountPercent || 0,
            discountAmount: inv.discountAmount || 0,
            driver: inv.driver?.fullName || 'Field Sales Rep',
            route: inv.shop?.routeName || 'Main Sector Route',
            subtotal: inv.subtotal || inv.totalAmount,
            taxAmount: inv.taxAmount || 0,
            amount: inv.netPayableAmount || inv.totalAmount,
            mode: inv.paymentMode || 'CASH',
            status: inv.paymentStatus || 'PAID',
            date: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString() : new Date().toLocaleString(),
            items: inv.items?.map((item: any) => ({
              name: item.product?.name || 'Finished Bread SKU',
              qty: item.quantity,
              unitPrice: item.unitPrice,
              total: item.totalPrice || (item.quantity * item.unitPrice),
            })) || [],
          }));
          setInvoices(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load invoices from API:', err);
      })
      .finally(() => setIsLoading(false));
  };

  // Fetch Products and Registered Shops/Buyers for Live Pricing
  const fetchProductsAndShops = () => {
    productApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        setProducts(res.data.map(p => ({
          id: p.id,
          productCode: p.productCode,
          name: p.name,
          mrp: p.mrp || 50,
          minimumSellingPrice: p.minimumSellingPrice != null ? p.minimumSellingPrice : 48,
          dealerPrice: p.dealerPrice || 35,
          wholesalePrice: p.wholesalePrice || 38,
          retailPrice: p.retailPrice || 45
        })));
      } else {
        // Fallback default products if database is fresh
        setProducts([
          { id: 1, productCode: 'PRD-001', name: 'White Bread (400g)', mrp: 50, minimumSellingPrice: 48, dealerPrice: 35, retailPrice: 50 },
          { id: 2, productCode: 'PRD-002', name: 'Wheat Bread (400g)', mrp: 55, minimumSellingPrice: 52, dealerPrice: 38, retailPrice: 55 },
          { id: 3, productCode: 'PRD-003', name: 'Sweet Milk Bun (150g)', mrp: 30, minimumSellingPrice: 28, dealerPrice: 20, retailPrice: 30 },
          { id: 4, productCode: 'PRD-004', name: 'Garlic Toast Rusk (200g)', mrp: 60, minimumSellingPrice: 56, dealerPrice: 42, retailPrice: 60 },
        ]);
      }
    }).catch(() => {
      setProducts([
        { id: 1, productCode: 'PRD-001', name: 'White Bread (400g)', mrp: 50, minimumSellingPrice: 48, dealerPrice: 35, retailPrice: 50 },
        { id: 2, productCode: 'PRD-002', name: 'Wheat Bread (400g)', mrp: 55, minimumSellingPrice: 52, dealerPrice: 38, retailPrice: 55 },
        { id: 3, productCode: 'PRD-003', name: 'Sweet Milk Bun (150g)', mrp: 30, minimumSellingPrice: 28, dealerPrice: 20, retailPrice: 30 },
      ]);
    });

    shopApi.getAll().then(res => {
      if (res.data && res.data.length > 0) {
        setShops(res.data.map(s => ({
          id: s.id,
          name: s.name,
          customerType: s.customerType || 'SHOP',
          discountPercent: s.discountPercent != null ? s.discountPercent : (s.customerType?.includes('WHOLESALE') ? 10 : 0)
        })));
      } else {
        setShops([
          { id: 1, name: 'Sri Lakshmi Stores', customerType: 'SHOP', discountPercent: 0 },
          { id: 2, name: 'ABC Distributors (Dealer A)', customerType: 'WHOLESALE_DEALER', discountPercent: 10 },
          { id: 3, name: 'XYZ Traders (Dealer B)', customerType: 'WHOLESALE_DEALER', discountPercent: 15 },
          { id: 4, name: 'Super Wholesale Hub (Dealer C)', customerType: 'WHOLESALE_DEALER', discountPercent: 20 },
        ]);
      }
    }).catch(() => {
      setShops([
        { id: 1, name: 'Sri Lakshmi Stores', customerType: 'SHOP', discountPercent: 0 },
        { id: 2, name: 'ABC Distributors (Dealer A)', customerType: 'WHOLESALE_DEALER', discountPercent: 10 },
        { id: 3, name: 'XYZ Traders (Dealer B)', customerType: 'WHOLESALE_DEALER', discountPercent: 15 },
      ]);
    });
  };

  useEffect(() => {
    fetchInvoices();
    fetchProductsAndShops();
  }, []);

  // Modal & Notification states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItemData | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAllSalesAndDeliveryData = async () => {
    try {
      setIsClearing(true);
      await salesDeliveryApi.clearAll();
      showToast('🗑️ All created Sales and Delivery data purged successfully!');
      setInvoices([]);
      setSelectedInvoice(null);
      setShowClearModal(false);
      fetchInvoices();
    } catch (err: any) {
      console.error('Failed to clear sales data:', err);
      showToast(err.response?.data?.message || 'Failed to clear sales and delivery data');
    } finally {
      setIsClearing(false);
    }
  };

  // ─── Live Dynamic Form State for Buyer-Type Aware Invoicing ───────────────────
  const [buyerType, setBuyerType] = useState<'SHOP' | 'WHOLESALE_DEALER' | 'CUSTOMER'>('SHOP');
  const [selectedShopId, setSelectedShopId] = useState<number>(1);
  const [directCustomerName, setDirectCustomerName] = useState<string>('Ravi');
  const [selectedProductId, setSelectedProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<string>('10');
  const [enteredPrice, setEnteredPrice] = useState<string>('48');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'CREDIT'>('CASH');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Get active product and buyer
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0] || {
    id: 1, name: 'White Bread (400g)', mrp: 50, minimumSellingPrice: 48, dealerPrice: 35, retailPrice: 50
  };

  const activeShop = shops.find(s => s.id === selectedShopId) || shops[0] || {
    id: 1, name: 'Sri Lakshmi Stores', customerType: 'SHOP', discountPercent: 0
  };

  // When active product or buyer type changes, adjust default entered price
  useEffect(() => {
    if (activeProduct) {
      if (buyerType === 'SHOP') {
        setEnteredPrice(String(activeProduct.minimumSellingPrice || 48));
      } else if (buyerType === 'WHOLESALE_DEALER') {
        const disc = activeShop?.discountPercent || 10;
        const calcPrice = ((activeProduct.mrp || 50) * (1 - disc / 100)).toFixed(2);
        setEnteredPrice(calcPrice);
      } else {
        setEnteredPrice(String(activeProduct.retailPrice || 47));
      }
    }
  }, [selectedProductId, buyerType, selectedShopId]);

  // Centralized Live Calculation & Validation
  const livePriceResult = calculateProductSellingPrice(
    activeProduct,
    buyerType === 'CUSTOMER' ? { customerType: 'CUSTOMER' } : activeShop,
    parseFloat(enteredPrice) || undefined,
    parseInt(quantity) || 1
  );

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) {
      showToast('Please enter a valid quantity greater than 0.');
      return;
    }

    // Strict Shop validation
    if (buyerType === 'SHOP') {
      const priceVal = parseFloat(enteredPrice) || 0;
      const minVal = activeProduct.minimumSellingPrice || 48;
      if (priceVal < minVal) {
        showToast(`Minimum selling price for this product is ₹${minVal.toFixed(2)}.`);
        return;
      }
    }

    const unitSellingPrice = livePriceResult.unitSellingPrice;
    const buyerName = buyerType === 'CUSTOMER' ? directCustomerName : activeShop.name;

    try {
      await invoiceApi.create({
        shopId: buyerType === 'CUSTOMER' ? 1 : activeShop.id || 1,
        customerType: buyerType,
        discountPercent: livePriceResult.discountPercent || 0,
        items: [
          {
            productId: activeProduct.id,
            quantity: qty,
            unitPrice: unitSellingPrice
          }
        ],
        paymentMode: paymentMode
      });

      fetchInvoices();
      setIsCreateModalOpen(false);
      showToast(`Generated invoice for ${buyerName} at ₹${unitSellingPrice} per unit (Total: ₹${livePriceResult.totalPrice})!`);
    } catch (err: any) {
      showToast(`Invoice creation failed: ${err.message || 'Validation error'}`);
    }
  };

  const handleDeleteInvoice = async (id: number, invNum: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice "${invNum}"?`)) return;
    try {
      await invoiceApi.delete(id);
      showToast(`Deleted invoice ${invNum}`);
      fetchInvoices();
    } catch (err: any) {
      showToast(`Failed to delete invoice: ${err.message || 'Failed'}`);
    }
  };

  // KPIs
  const totalRevenue = invoices.reduce((acc, i) => acc + i.amount, 0);
  const collectedAmount = invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + i.amount, 0);
  const pendingCredit = invoices.filter(i => i.status === 'PENDING').reduce((acc, i) => acc + i.amount, 0);
  const totalInvoicesCount = invoices.length;

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.shop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.route.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || inv.customerType === typeFilter;
    const matchesMode = modeFilter === 'ALL' || inv.mode === modeFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;

    return matchesSearch && matchesType && matchesMode && matchesStatus;
  });

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

      {/* Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Customer-Type Sales & Invoicing Management
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Receipt className="w-3 h-3 text-blue-500" />
              {totalInvoicesCount} Invoices Issued
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Centralized buyer-type pricing rules: Shop Minimum Selling Price enforcement, Wholesale Dealer automated discount calculation, and Direct Customer manual sales pricing
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => { fetchInvoices(); fetchProductsAndShops(); }}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Invoices Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800"
            title="Delete All Sales and Delivery Data"
          >
            <Trash2 className="w-4 h-4" /> Purge All Sales Data
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create Sales Invoice
          </button>
        </div>
      </div>

      {/* Pricing Rule Quick Reference Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-blue-50 dark:bg-slate-800/80 rounded-2xl border border-blue-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs text-blue-900 dark:text-blue-300">1. Shop Pricing</span>
          </div>
          <p className="text-[11px] text-blue-800/80 dark:text-slate-300 leading-relaxed">
            Defined Minimum Selling Price (e.g. ₹48 for ₹50 MRP). Sale allowed at or above ₹48; strictly rejected below.
          </p>
        </div>

        <div className="p-3.5 bg-emerald-50 dark:bg-slate-800/80 rounded-2xl border border-emerald-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-300">2. Wholesale Dealer</span>
          </div>
          <p className="text-[11px] text-emerald-800/80 dark:text-slate-300 leading-relaxed">
            Configured dealer discount % (e.g. 10%, 15%, 20%). System automatically calculates and shows actual selling amount (₹45.00).
          </p>
        </div>

        <div className="p-3.5 bg-amber-50 dark:bg-slate-800/80 rounded-2xl border border-amber-200 dark:border-slate-700 space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span className="font-extrabold text-xs text-amber-900 dark:text-amber-300">3. Direct Customer</span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-slate-300 leading-relaxed">
            No onboarding discount required. Salesperson enters customer name, quantity, and manual selling price directly.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Invoiced Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Across All Customer Types</div>
          </div>
        </div>

        {/* Cash & UPI Collected */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Collected Cash / UPI</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">₹{collectedAmount.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">100% Realized Liquidity</div>
          </div>
        </div>

        {/* Credit Ledger Outstanding */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Pending Credit Line</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 leading-none">₹{pendingCredit.toLocaleString()}</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">Tracked via Shop Ledger</div>
          </div>
        </div>

        {/* Historical Invoices */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Historical Invoices</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Receipt className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalInvoicesCount} Bills</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">Permanent Price Preservation</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, route, or driver..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap justify-between md:justify-end">
          {/* Customer Type Filter */}
          <div className="w-48 shrink-0">
            <CustomSelect 
              value={typeFilter} 
              onChange={setTypeFilter}
              options={[
                { value: 'ALL', label: 'All Buyer Types' },
                { value: 'SHOP', label: 'Shop (Min Price)', badge: 'STORE' },
                { value: 'WHOLESALE_DEALER', label: 'Wholesale Dealer (% Off)', badge: 'DEALER' },
                { value: 'CUSTOMER', label: 'Direct Customer (Manual)', badge: 'RETAIL' },
              ]}
              placeholder="Buyer Type"
            />
          </div>

          {/* Payment Mode Filter */}
          <div className="w-44 shrink-0">
            <CustomSelect 
              value={modeFilter} 
              onChange={val => setModeFilter(val as any)}
              options={[
                { value: 'ALL', label: 'All Payment Modes' },
                { value: 'UPI', label: 'UPI Payment', badge: 'UPI' },
                { value: 'CASH', label: 'Cash Settlement', badge: 'CASH' },
                { value: 'CREDIT', label: 'Shop Credit Ledger', badge: 'CREDIT' },
              ]}
              placeholder="Payment Mode"
            />
          </div>

          {/* Status Filter */}
          <div className="w-48 shrink-0">
            <CustomSelect 
              value={statusFilter} 
              onChange={val => setStatusFilter(val as any)}
              options={[
                { value: 'ALL', label: 'All Settlement Statuses' },
                { value: 'PAID', label: 'PAID (Settled)', badge: 'PAID' },
                { value: 'PENDING', label: 'PENDING (Credit Line)', badge: 'DUE' },
              ]}
              placeholder="Settlement Status"
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
            <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Invoice #</th>
                <th className="py-3.5 px-4 font-bold min-w-[140px]">Buyer Type</th>
                <th className="py-3.5 px-4 font-bold min-w-[200px]">Customer / Shop Name</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">Line Items & Actual Price</th>
                <th className="py-3.5 px-4 font-bold min-w-[110px]">Net Total</th>
                <th className="py-3.5 px-4 font-bold min-w-[100px]">Payment</th>
                <th className="py-3.5 px-4 font-bold min-w-[100px]">Status</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No invoices found. Click "Create Sales Invoice" to issue a buyer-type invoice.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const typeBadgeClass = 
                    inv.customerType === 'WHOLESALE_DEALER'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : inv.customerType === 'CUSTOMER'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';

                  const typeLabel = 
                    inv.customerType === 'WHOLESALE_DEALER' 
                      ? 'Wholesale Dealer' 
                      : inv.customerType === 'CUSTOMER' 
                      ? 'Customer' 
                      : 'Shop';

                  return (
                    <tr key={inv.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${typeBadgeClass}`}>
                          {inv.customerType === 'WHOLESALE_DEALER' && <Building2 className="w-3 h-3" />}
                          {inv.customerType === 'SHOP' && <Store className="w-3 h-3" />}
                          {inv.customerType === 'CUSTOMER' && <User className="w-3 h-3" />}
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#1C1C1C] dark:text-white">
                        {inv.shop}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {inv.items.map((item, idx) => (
                            <div key={idx} className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              {item.name} × {item.qty} @ <strong className="text-emerald-600 dark:text-emerald-400">₹{item.unitPrice}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                        ₹{inv.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold">
                        {inv.mode}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" /> View Bill
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* INVOICE PREVIEW / PRINT MODAL                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-xl p-6 space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-base font-extrabold">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-[11px] font-mono text-[#8C8C8C]">Buyer Type: {selectedInvoice.customerType} • {selectedInvoice.date}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">Billed To:</span>
                <span className="font-bold">{selectedInvoice.shop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C8C8C]">Payment Mode:</span>
                <span className="font-bold">{selectedInvoice.mode} ({selectedInvoice.status})</span>
              </div>
            </div>

            {/* Line Items Table with Actual Calculated Selling Prices */}
            <div className="border border-[#E2E8F0] dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F9FB] dark:bg-slate-800 text-[#8C8C8C] text-[10px] uppercase border-b border-[#E2E8F0] dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold">{item.name}</td>
                      <td className="py-2.5 px-3">{item.qty}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">₹{item.unitPrice}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold">₹{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-[#F7F9FB] dark:bg-slate-800/80 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-1 text-xs">
              <div className="flex justify-between text-[#8C8C8C]">
                <span>Gross Subtotal:</span>
                <span className="font-bold text-[#1C1C1C] dark:text-slate-200">₹{selectedInvoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#8C8C8C]">
                <span>Field GST (5%):</span>
                <span className="font-bold text-[#1C1C1C] dark:text-slate-200">₹{selectedInvoice.taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-[#E2E8F0] dark:border-slate-700 text-[#1C1C1C] dark:text-white">
                <span>Grand Total Amount:</span>
                <span className="text-emerald-600 dark:text-emerald-400">₹{selectedInvoice.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-[#E2E8F0] dark:bg-slate-700 text-[#1C1C1C] dark:text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* USER-FRIENDLY SALES INVOICE CREATION MODAL WITH LIVE PRICING CARDS   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden my-6 text-[#1C1C1C] dark:text-slate-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">
                    Create Sales Invoice
                  </h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">
                    Select customer category, choose finished SKU, and generate instant billing
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateInvoice} className="px-6 py-4 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Step 1: Customer Type Interactive Cards */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400">
                  Step 1: Choose Buyer Category *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBuyerType('SHOP')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                      buyerType === 'SHOP'
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/30'
                        : 'bg-[#F7F9FB] dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 text-[#8C8C8C] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {buyerType === 'SHOP' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#1C1C1C] dark:text-white">Retail Shop</div>
                      <div className="text-[10px] text-[#8C8C8C] dark:text-slate-400 leading-tight">Min Price Protected</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuyerType('WHOLESALE_DEALER')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                      buyerType === 'WHOLESALE_DEALER'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/30'
                        : 'bg-[#F7F9FB] dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 text-[#8C8C8C] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {buyerType === 'WHOLESALE_DEALER' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#1C1C1C] dark:text-white">Wholesale</div>
                      <div className="text-[10px] text-[#8C8C8C] dark:text-slate-400 leading-tight">Auto Dealer Disc %</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBuyerType('CUSTOMER')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1 cursor-pointer ${
                      buyerType === 'CUSTOMER'
                        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/30'
                        : 'bg-[#F7F9FB] dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 text-[#8C8C8C] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      {buyerType === 'CUSTOMER' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-[#1C1C1C] dark:text-white">Direct Client</div>
                      <div className="text-[10px] text-[#8C8C8C] dark:text-slate-400 leading-tight">Cash Desk / Retail</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Customer / Shop Selector */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[#1C1C1C] dark:text-slate-200">
                  {buyerType === 'CUSTOMER' ? 'Direct Customer Name *' : buyerType === 'WHOLESALE_DEALER' ? 'Select Wholesale Dealer Account *' : 'Select Registered Retail Shop *'}
                </label>
                {buyerType === 'CUSTOMER' ? (
                  <input
                    type="text"
                    required
                    value={directCustomerName}
                    onChange={(e) => setDirectCustomerName(e.target.value)}
                    placeholder="e.g. Counter Cash Sale / Mr. Ravi"
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
                  />
                ) : (
                  <CustomSelect
                    value={selectedShopId}
                    onChange={val => setSelectedShopId(parseInt(val))}
                    options={shops
                      .filter(s => s.id !== undefined && (buyerType === 'WHOLESALE_DEALER' ? normalizeCustomerType(s.customerType) === 'WHOLESALE_DEALER' : normalizeCustomerType(s.customerType) !== 'WHOLESALE_DEALER'))
                      .map(s => ({
                        value: s.id ?? 0,
                        label: s.name || `Customer #${s.id}`,
                        badge: s.discountPercent ? `${s.discountPercent}% OFF` : undefined
                      }))}
                    placeholder="Select Customer / Shop"
                  />
                )}
              </div>

              {/* Step 3: Product SKU Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#1C1C1C] dark:text-slate-200">Select Bakery Product SKU *</label>
                  <span className="text-[10px] text-[#8C8C8C] font-mono">
                    MRP: ₹{activeProduct.mrp} • Min: ₹{activeProduct.minimumSellingPrice || 48}
                  </span>
                </div>
                <CustomSelect
                  value={selectedProductId}
                  onChange={val => setSelectedProductId(parseInt(val))}
                  options={products.map(p => ({
                    value: p.id,
                    label: `${p.name} (₹${p.mrp})`,
                    badge: `Min ₹${p.minimumSellingPrice || 48}`,
                    description: `MRP: ₹${p.mrp} • Min Selling Price: ₹${p.minimumSellingPrice || 48}`
                  }))}
                  placeholder="Select Product SKU"
                />
              </div>

              {/* Step 4: Quantity and Unit Price Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Quantity Stepper */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[#1C1C1C] dark:text-slate-200">Quantity (Units) *</label>
                  <div className="flex items-center bg-[#F7F9FB] dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-1">
                    <button
                      type="button"
                      onClick={() => setQuantity(String(Math.max(1, (parseInt(quantity) || 1) - 5)))}
                      className="w-7 h-7 bg-white dark:bg-slate-700 rounded-lg text-xs font-extrabold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-transparent text-center font-extrabold text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(String((parseInt(quantity) || 0) + 5))}
                      className="w-7 h-7 bg-white dark:bg-slate-700 rounded-lg text-xs font-extrabold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Selling Price per Unit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#1C1C1C] dark:text-slate-200">
                      {buyerType === 'WHOLESALE_DEALER' ? 'Unit Price (Discounted)' : 'Selling Price (₹/Unit) *'}
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      step="0.5"
                      disabled={buyerType === 'WHOLESALE_DEALER'}
                      value={enteredPrice}
                      onChange={(e) => setEnteredPrice(e.target.value)}
                      className={`w-full text-xs font-mono font-bold px-3.5 py-2.5 rounded-xl border focus:outline-none transition ${
                        !livePriceResult.isValid && buyerType === 'SHOP'
                          ? 'bg-rose-50 border-rose-400 text-rose-600 dark:bg-rose-950/30'
                          : 'bg-[#F7F9FB] dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-700 text-[#1C1C1C] dark:text-white'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8C8C8C]">
                      ₹/unit
                    </span>
                  </div>
                </div>
              </div>

              {/* Validation Warning for Minimum Price */}
              {!livePriceResult.isValid && buyerType === 'SHOP' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    Minimum allowed selling price is ₹{activeProduct.minimumSellingPrice?.toFixed(2) || '48.00'}. (MRP: ₹{activeProduct.mrp})
                  </span>
                </div>
              )}

              {/* Step 5: Live Invoice Receipt Breakdown Card */}
              <div className="p-4 bg-[#F7F9FB] dark:bg-slate-800/80 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between text-[#8C8C8C]">
                  <span>Product SKU:</span>
                  <span className="font-bold text-[#1C1C1C] dark:text-slate-200">{activeProduct.name}</span>
                </div>
                <div className="flex justify-between text-[#8C8C8C]">
                  <span>Billed Quantity:</span>
                  <span className="font-bold text-[#1C1C1C] dark:text-slate-200">{quantity || 0} Units</span>
                </div>
                <div className="flex justify-between text-[#8C8C8C]">
                  <span>Unit Rate Applied:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">₹{livePriceResult.unitSellingPrice.toFixed(2)} / unit</span>
                </div>
                {livePriceResult.discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount ({livePriceResult.discountPercent}%):</span>
                    <span>-₹{((activeProduct.mrp * (livePriceResult.discountPercent / 100)) * (parseInt(quantity) || 1)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-extrabold pt-2.5 border-t border-[#E2E8F0] dark:border-slate-700 text-[#1C1C1C] dark:text-white">
                  <span>Grand Total Payable:</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{livePriceResult.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Step 6: Payment Mode Pill Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-[#1C1C1C] dark:text-slate-200">
                  Payment Collection Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'CASH'
                        ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                        : 'bg-[#F7F9FB] dark:bg-slate-800 text-[#8C8C8C] border-[#E2E8F0] dark:border-slate-700'
                    }`}
                  >
                    💵 Cash Spot
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'UPI'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-[#F7F9FB] dark:bg-slate-800 text-[#8C8C8C] border-[#E2E8F0] dark:border-slate-700'
                    }`}
                  >
                    📱 UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CREDIT')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentMode === 'CREDIT'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-[#F7F9FB] dark:bg-slate-800 text-[#8C8C8C] border-[#E2E8F0] dark:border-slate-700'
                    }`}
                  >
                    💳 Credit Ledger
                  </button>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!livePriceResult.isValid && buyerType === 'SHOP'}
                  className="px-5 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" /> Issue Sales Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Purging All Sales & Delivery Data */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Purge All Sales & Invoicing Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanent Bulk Data Cleanup</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>ALL sales invoices, returns, credit notes, and delivery transactions</strong>?
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <li>All Sales Invoices & Line Items</li>
              <li>All Shop Ledger Debits & Credits</li>
              <li>All Delivery Dispatches & Collections</li>
              <li>All Sales Returns & Issued Credit Notes</li>
            </ul>

            <p className="text-xs text-rose-500 font-medium">⚠️ This action will permanently erase all created sales records!</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllSalesAndDeliveryData}
                disabled={isClearing}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Purging...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Yes, Delete All Sales & Delivery Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
