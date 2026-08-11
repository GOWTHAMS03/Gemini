import React, { useState, useEffect } from 'react';
import { shopApi } from '../services/apiService';
import { 
  Plus, 
  Store, 
  X, 
  Search, 
  Filter, 
  CreditCard, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  DollarSign, 
  FileText, 
  Download, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  TrendingUp,
  UserCheck,
  RefreshCw,
  Trash2
} from 'lucide-react';

import { LocationPickerMap } from '../components/LocationPickerMap';
import { ShopDirectoryMap } from '../components/ShopDirectoryMap';

const inputClass = "w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition";
const labelClass = "block text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase mb-1.5 tracking-wider";
const selectClass = "w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-[#1C1C1C] dark:text-slate-200 focus:outline-none focus:border-purple-500 transition appearance-none";

export interface ShopItem {
  id: number;
  shopCode: string;
  name: string;
  owner: string;
  phone: string;
  gstin: string;
  address: string;
  areaName?: string;
  route: string;
  customerType: 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER';
  discountPercent: number;
  outstanding: number;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  registeredDate: string;
  status: 'ACTIVE' | 'CREDIT_HOLD' | 'INACTIVE';
  lastOrderDate: string;
}

export interface LedgerTransaction {
  id: number;
  date: string;
  type: 'INVOICE' | 'PAYMENT_RECEIVED' | 'CREDIT_ADJUSTMENT';
  refNo: string;
  description: string;
  amount: number;
  balanceAfter: number;
}

const DEFAULT_DISCOUNTS: Record<'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER', number> = {
  WHOLESALE_AGENT: 15,
  SHOP: 8,
  RETAIL_CUSTOMER: 2
};

export const ShopsPage: React.FC = () => {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [creditFilter, setCreditFilter] = useState('ALL');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'map'>('table');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Shops from Backend API
  const fetchShops = () => {
    setIsLoading(true);
    shopApi.getAll()
      .then((res) => {
        if (res.data) {
          const mapped = res.data.map((s: any) => ({
            id: s.id,
            shopCode: s.shopCode,
            name: s.name,
            owner: s.ownerName,
            phone: s.phone,
            gstin: s.gstin || '33AAAAA0000A1Z5',
            address: s.address,
            areaName: s.areaName || 'Salem City Center',
            route: s.routeName || 'Salem North Route',
            customerType: s.customerType || 'SHOP',
            discountPercent: s.discountPercent || 8,
            outstanding: s.outstandingAmount,
            latitude: s.latitude ? Number(s.latitude) : 10.787252191240228,
            longitude: s.longitude ? Number(s.longitude) : 79.57505803846621,
            locationAccuracy: s.locationAccuracy ? Number(s.locationAccuracy) : 5.0,
            registeredDate: s.createdAt ? s.createdAt.substring(0, 10) : '2026-08-01',
            status: (s.outstandingAmount > 0 ? 'CREDIT_HOLD' : 'ACTIVE') as 'ACTIVE' | 'CREDIT_HOLD' | 'INACTIVE',
            lastOrderDate: '2026-08-04',
          }));
          setShops(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load shops from API:', err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // Modal & Drawer states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLedgerShop, setSelectedLedgerShop] = useState<ShopItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    phone: '',
    gstin: '',
    address: '14, Fort Main Road, Salem, Tamil Nadu',
    areaName: 'Fort Area, Salem',
    route: 'Salem North Commercial Route',
    customerType: 'WHOLESALE_AGENT' as 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER',
    discountPercent: '15',
        latitude: 10.787252191240228,
        longitude: 79.57505803846621,
    locationAccuracy: 4.5,
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'customerType') {
      const newType = value as 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER';
      const defaultDiscount = DEFAULT_DISCOUNTS[newType] || 8;
      setFormData(prev => ({
        ...prev,
        customerType: newType,
        discountPercent: defaultDiscount.toString()
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationPicked = (lat: number, lng: number, address?: string, areaName?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address,
      areaName: areaName || prev.areaName,
    }));
  };

  const handleRegisterShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.owner.trim()) return;

    const discountVal = parseFloat(formData.discountPercent) || 0;

    try {
      await shopApi.create({
        shopCode: `SHP-${Date.now().toString().slice(-4)}`,
        name: formData.name,
        ownerName: formData.owner,
        phone: formData.phone || '+91 98400 00000',
        address: formData.address || '#1, Fort Main Road, Salem',
        areaName: formData.areaName,
        routeName: formData.route,
        customerType: formData.customerType,
        discountPercent: discountVal,
        outstandingAmount: 0,
        latitude: formData.latitude,
        longitude: formData.longitude,
        locationAccuracy: formData.locationAccuracy,
      });
      fetchShops();
      setIsModalOpen(false);
      showToast(`Onboarded shop "${formData.name}" with GPS coordinates (${formData.latitude.toFixed(4)}, ${formData.longitude.toFixed(4)})!`);
      setFormData({
        name: '',
        owner: '',
        phone: '',
        gstin: '',
        address: '14, Fort Main Road, Salem, Tamil Nadu',
        areaName: 'Fort Area, Salem',
        route: 'Salem North Commercial Route',
        customerType: 'WHOLESALE_AGENT',
        discountPercent: '15',
        latitude: 10.787252191240228,
        longitude: 79.57505803846621,
        locationAccuracy: 4.5,
      });
    } catch (err: any) {
      showToast(`Error onboarding customer: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteShop = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      await shopApi.delete(id);
      showToast(`Customer "${name}" deleted successfully.`);
      fetchShops();
    } catch (err: any) {
      showToast(`Failed to delete customer: ${err.message || 'Failed'}`);
    }
  };

  // KPIs
  const totalShops = shops.length;
  const wholesaleAgentsCount = shops.filter(s => s.customerType === 'WHOLESALE_AGENT').length;
  const retailOutletsCount = shops.filter(s => s.customerType === 'SHOP').length;
  const totalOutstanding = shops.reduce((acc, s) => acc + s.outstanding, 0);
    
  // Filtered Shops
  const filteredShops = shops.filter(shop => {
    const matchesSearch = 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.shopCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.route.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRoute = routeFilter === 'ALL' || shop.route === routeFilter;
    const matchesCustomerType = customerTypeFilter === 'ALL' || shop.customerType === customerTypeFilter;

    let matchesCredit = true;
    if (creditFilter === 'OUTSTANDING') matchesCredit = shop.outstanding > 0;
        if (creditFilter === 'CLEAR') matchesCredit = shop.outstanding === 0;

    return matchesSearch && matchesRoute && matchesCredit && matchesCustomerType;
  });

  const renderCustomerTypeBadge = (type: 'SHOP' | 'WHOLESALE_AGENT' | 'RETAIL_CUSTOMER', discount: number) => {
    if (type === 'WHOLESALE_AGENT') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-purple-500" /> Wholesale Agent
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            {discount}% OFF
          </span>
        </div>
      );
    }
    if (type === 'RETAIL_CUSTOMER') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-teal-500" /> Direct Customer
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">
            {discount}% OFF
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 flex items-center gap-1">
          <Store className="w-3 h-3 text-blue-500" /> Retail Store
        </span>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
          {discount}% OFF
        </span>
      </div>
    );
  };

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

      {/* Styled Container Header Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Customer Onboarding & Directory
            </h1>
            <span className="text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-purple-500" />
              {wholesaleAgentsCount} Wholesale Agents
            </span>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Store className="w-3 h-3 text-blue-500" />
              {retailOutletsCount} Retail Stores
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Manage Shops, Wholesale Agents, & Direct Customers with customized discount structures (e.g. 15% Wholesale Agent Off), credit lines, and automated field billing
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchShops}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Customers Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Onboard New Customer
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Onboarded Customers</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Store className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalShops} Accounts</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">{wholesaleAgentsCount} Wholesale Agents</div>
          </div>
        </div>

        {/* Total Outstanding Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Outstanding</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">₹{totalOutstanding.toLocaleString()}</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">Pending Driver Collection</div>
          </div>
        </div>

        {/* Sanctioned Credit Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Sanctioned Credit Line</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
          </div>
        </div>

        {/* Credit Risk Alerts Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Credit Risk Alerts</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Over 80% Credit Used</div>
          </div>
        </div>
      </div>

      {/* Filter & View Switcher Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, owner, type (Wholesale Agent/Shop), GSTIN..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end flex-wrap">
          <select 
            value={customerTypeFilter} 
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="ALL">All Customer Types</option>
            <option value="WHOLESALE_AGENT">Wholesale Agents (15% Off)</option>
            <option value="SHOP">Retail Outlets / Stores (8% Off)</option>
            <option value="RETAIL_CUSTOMER">Direct Retail Customers (2% Off)</option>
          </select>

          <select 
            value={routeFilter} 
            onChange={(e) => setRouteFilter(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="ALL">All Delivery Routes</option>
            <option value="North Chennai Route A">North Chennai Route A</option>
            <option value="South Chennai Route B">South Chennai Route B</option>
            <option value="Chennai Central Express">Chennai Central Express</option>
            <option value="East Coast Industrial">East Coast Industrial</option>
          </select>

          <select 
            value={creditFilter} 
            onChange={(e) => setCreditFilter(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="ALL">All Credit Status</option>
            <option value="OUTSTANDING">Has Outstanding Balance</option>
            <option value="NEAR_LIMIT">Near Credit Limit (&gt;80%)</option>
            <option value="CLEAR">Clear (Zero Due)</option>
          </select>

          {/* View Mode Switcher Buttons */}
          <div className="flex items-center bg-[#F7F9FB] dark:bg-slate-900 p-1 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                  : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                  : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'map' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
              }`}
              title="Interactive Map View"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-[11px] font-semibold pr-1">Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 3: INTERACTIVE SHOP DIRECTORY MAP VIEW */}
      {viewMode === 'map' && (
        <div className="space-y-3">
          <ShopDirectoryMap shops={filteredShops} />
        </div>
      )}

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold min-w-[260px]">Account Code & Name</th>
                  <th className="py-3.5 px-4 font-bold min-w-[160px]">Customer Type & Discount</th>
                  <th className="py-3.5 px-4 font-bold min-w-[140px]">Owner & Phone</th>
                  <th className="py-3.5 px-4 font-bold min-w-[140px]">GSTIN Number</th>
                  <th className="py-3.5 px-4 font-bold min-w-[160px]">Assigned Route</th>
                  <th className="py-3.5 px-4 font-bold min-w-[100px]">Credit Limit</th>
                  <th className="py-3.5 px-4 font-bold min-w-[140px]">Outstanding Ledger</th>
                  <th className="py-3.5 px-4 font-bold min-w-[110px]">Status</th>
                  <th className="py-3.5 px-4 font-bold min-w-[120px] text-right">Ledger & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                      No customer records found in database. Click "Onboard New Customer" to register a shop.
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((shop) => {
                  

                  return (
                    <tr key={shop.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                      {/* Shop Code & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-blue-500/20">
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-[#1C1C1C] dark:text-white block leading-snug">{shop.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/20 shrink-0">
                                {shop.shopCode}
                              </span>
                              <span className="text-[11px] text-[#8C8C8C] dark:text-slate-400 truncate max-w-[180px]">{shop.address}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Type & Discount */}
                      <td className="py-3.5 px-4">
                        {renderCustomerTypeBadge(shop.customerType, shop.discountPercent)}
                      </td>

                      {/* Owner Name & Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#1C1C1C] dark:text-slate-200 block">{shop.owner}</span>
                        <span className="text-[11px] font-mono text-[#8C8C8C]">{shop.phone}</span>
                      </td>

                      {/* GSTIN */}
                      <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {shop.gstin}
                      </td>

                      {/* Route */}
                      <td className="py-3.5 px-4 font-medium text-xs">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          {shop.route}
                        </span>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-4 font-semibold text-[#1C1C1C] dark:text-slate-100">
                        
                      </td>

                      {/* Outstanding Ledger */}
                      <td className="py-3.5 px-4">
                        {shop.outstanding > 0 ? (
                          <div>
                            <span className="font-extrabold text-rose-600 dark:text-rose-400 block">₹{shop.outstanding.toLocaleString()}</span>
                            <div className="w-24 bg-[#E2E8F0] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                              <div 
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Clear (Zero Due)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {shop.status === 'CREDIT_HOLD' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> CREDIT HOLD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button 
                          onClick={() => setSelectedLedgerShop(shop)}
                          className="px-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500" /> View Ledger
                        </button>
                        <button 
                          onClick={() => handleDeleteShop(shop.id, shop.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredShops.map((shop) => {
            

            return (
              <div 
                key={shop.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 hover:shadow-md transition-all duration-200"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 block">{shop.shopCode}</span>
                      <span className="text-[10px] font-mono text-[#8C8C8C]">{shop.gstin}</span>
                    </div>
                  </div>
                  {shop.status === 'CREDIT_HOLD' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> HOLD
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ACTIVE
                    </span>
                  )}
                </div>

                {/* Body Details */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white leading-tight">{shop.name}</h3>
                  </div>
                  {renderCustomerTypeBadge(shop.customerType, shop.discountPercent)}
                  <p className="text-xs text-[#8C8C8C] leading-snug">{shop.address}</p>

                  <div className="pt-2 border-t border-[#F0F2F5] dark:border-slate-700/60 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8C8C8C]">Owner Name:</span>
                      <span className="font-bold text-[#1C1C1C] dark:text-slate-200">{shop.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C8C8C]">Phone Contact:</span>
                      <span className="font-mono font-bold">{shop.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8C8C8C]">Delivery Route:</span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">{shop.route}</span>
                    </div>
                  </div>

                  {/* Credit Bar */}
                  <div className="space-y-1 bg-[#F7F9FB] dark:bg-slate-900 p-3 rounded-xl border border-[#F0F2F5] dark:border-slate-700">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-[#8C8C8C]">Outstanding Ledger:</span>
                      <span className={shop.outstanding > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}>
                        ₹{shop.outstanding.toLocaleString()} / 
                      </span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-1 flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedLedgerShop(shop)}
                    className="flex-1 py-2 bg-[#1C1C1C] dark:bg-slate-700 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> View Ledger
                  </button>
                  <button 
                    onClick={() => handleDeleteShop(shop.id, shop.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700 rounded-xl transition cursor-pointer"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RETAILER LEDGER INSPECTOR DRAWER / MODAL */}
      {selectedLedgerShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">{selectedLedgerShop.name}</h3>
                  <p className="text-[11px] font-mono text-[#8C8C8C]">Code: {selectedLedgerShop.shopCode} • GSTIN: {selectedLedgerShop.gstin}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLedgerShop(null)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 space-y-4 text-xs">
              {/* Financial Metrics Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F7F9FB] dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                  <span className="text-[10px] font-bold text-[#8C8C8C] uppercase block">Sanctioned Credit Limit</span>
                </div>

                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Current Outstanding</span>
                  <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">₹{selectedLedgerShop.outstanding.toLocaleString()}</span>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Available Credit</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  </span>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#8C8C8C]">Recent Statement Transactions</h4>
                  <span className="text-[11px] text-blue-500 font-semibold">Real-time ERP Audit Trail</span>
                </div>

                <div className="border border-[#F0F2F5] dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F9FB] dark:bg-slate-800 text-[#8C8C8C] text-[10px] uppercase border-b border-[#F0F2F5] dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3">Date & Time</th>
                        <th className="py-2.5 px-3">Ref Invoice #</th>
                        <th className="py-2.5 px-3">Transaction Description</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-800">
                      {([
                        { id: 99, date: '2026-08-04 08:00 AM', type: 'INVOICE' as const, refNo: 'INV-1722770011', description: 'Fresh Bread Dispatch', amount: selectedLedgerShop.outstanding, balanceAfter: selectedLedgerShop.outstanding }
                      ] as LedgerTransaction[]).map((tx: LedgerTransaction) => (
                        <tr key={tx.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-800">
                          <td className="py-2.5 px-3 text-[11px] text-[#8C8C8C]">{tx.date}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-500">{tx.refNo}</td>
                          <td className="py-2.5 px-3 font-medium">{tx.description}</td>
                          <td className="py-2.5 px-3 font-bold text-rose-600">₹{tx.amount.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">₹{tx.balanceAfter.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#F7F9FB] dark:bg-slate-800/60 border-t border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-[#8C8C8C]">Assigned Route: <strong className="text-[#1C1C1C] dark:text-white">{selectedLedgerShop.route}</strong></span>
              <button
                onClick={() => setSelectedLedgerShop(null)}
                className="px-4 py-2 bg-[#1C1C1C] dark:bg-slate-700 text-white text-xs font-bold rounded-xl"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER / ONBOARD CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F8F9FA] dark:bg-slate-700 border border-[#E9ECEF] dark:border-slate-600 text-[#1C1C1C] dark:text-white rounded-xl">
                  <UserCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C1C1C] dark:text-white">
                    Onboard New Customer Account
                  </h3>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400">Select Customer Type (Wholesale Agent / Shop / Direct), set discount & credit</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterShop} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-4">
                {/* Customer Type Selection */}
                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-2xl space-y-3">
                  <label className="block text-[11px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    Buyer / Customer Category *
                  </label>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="SHOP">Shop / Retail Store (Adheres to Product Minimum Selling Prices)</option>
                    <option value="WHOLESALE_AGENT">Wholesale Dealer (Configured Individual Discount %)</option>
                    <option value="RETAIL_CUSTOMER">Customer (Manual Price Entry per Invoice, No Onboarding Discount)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={formData.customerType === 'WHOLESALE_AGENT' ? '' : 'sm:col-span-2'}>
                    <label className={labelClass}>
                      {formData.customerType === 'RETAIL_CUSTOMER' ? 'Customer Name *' : formData.customerType === 'WHOLESALE_AGENT' ? 'Wholesale Dealer Name *' : 'Shop / Store Name *'}
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={formData.customerType === 'RETAIL_CUSTOMER' ? 'e.g. Ravi Kumar' : formData.customerType === 'WHOLESALE_AGENT' ? 'e.g. ABC Distributors' : 'e.g. Sri Lakshmi Stores'}
                      className={inputClass}
                    />
                  </div>

                  {/* Wholesale Dealer: Individual Discount Configuration */}
                  {formData.customerType === 'WHOLESALE_AGENT' && (
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1.5 tracking-wider">
                        Dealer Discount % *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="discountPercent"
                          required
                          step="0.5"
                          min="0"
                          max="100"
                          value={formData.discountPercent}
                          onChange={handleInputChange}
                          className={`${inputClass} text-emerald-600 dark:text-emerald-400 font-bold`}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C8C8C]">% OFF</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation Banners based on Buyer Type */}
                {formData.customerType === 'SHOP' && (
                  <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-100 dark:border-sky-800/50 text-[11px] text-sky-800 dark:text-sky-300">
                    <span className="font-bold mr-1">ℹ Shop Pricing:</span> Products have a defined Minimum Selling Price in the Product Master (e.g. ₹48 on ₹50 MRP). The shop can purchase at or above that price, but never below it.
                  </div>
                )}

                {formData.customerType === 'WHOLESALE_AGENT' && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 text-[11px] text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold mr-1">ℹ Wholesale Pricing:</span> System will automatically calculate the final unit selling price (e.g. ₹50 - {formData.discountPercent}% = ₹{(50 - (50 * Number(formData.discountPercent || 0))/100).toFixed(2)}) and display the actual amount on invoices.
                  </div>
                )}

                {formData.customerType === 'RETAIL_CUSTOMER' && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300">
                    <span className="font-bold mr-1">ℹ Customer Pricing:</span> No discount configuration required during onboarding. You will enter the selling price and quantity manually during sales invoice generation.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Owner Name *</label>
                    <input
                      type="text"
                      name="owner"
                      required
                      value={formData.owner}
                      onChange={handleInputChange}
                      placeholder="e.g. Rajesh Sharma"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Contact *</label>
                    <input
                      type="text"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98400 99881"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>GSTIN Number</label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleInputChange}
                    placeholder="33AAACR9910F1Z2"
                    className={`${inputClass} uppercase`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Address *</label>
                  <textarea
                    name="address"
                    rows={2}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="#88, Fort Main Road, Salem, Tamil Nadu"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* GPS Location Picker Map */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase flex items-center gap-1.5 tracking-wider">
                    <MapPin className="w-4 h-4" /> Shop Location (Click Map or Search Address)
                  </div>
                  <LocationPickerMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    accuracyMeters={formData.locationAccuracy}
                    onLocationChange={handleLocationPicked}
                    className="h-64 w-full rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Delivery Route *</label>
                    <select
                      name="route"
                      value={formData.route}
                      onChange={handleInputChange}
                      className={selectClass}
                    >
                      <option value="Salem North Commercial Route">Salem North Commercial Route</option>
                      <option value="Salem South Route">Salem South Route</option>
                      <option value="Attur - Mettur Route">Attur - Mettur Route</option>
                      <option value="Omalur Industrial Route">Omalur Industrial Route</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-6 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8C8C8C] hover:text-[#1C1C1C] dark:text-slate-400 dark:hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black dark:hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Save & Onboard Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
