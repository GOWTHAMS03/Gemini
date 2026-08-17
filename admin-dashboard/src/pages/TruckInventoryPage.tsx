import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  Check, 
  Zap, 
  Search, 
  RefreshCw, 
  Gauge, 
  Phone, 
  ShieldCheck, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  TrendingUp,
  Sparkles,
  List,
  LayoutGrid,
  ArrowRight,
  Layers,
  Factory,
  ClipboardCheck,
  Fuel,
  FileCheck
} from 'lucide-react';
import { 
  inventoryApi, 
  productApi, 
  employeeApi, 
  salesExecutiveApi, 
  routeApi, 
  ApiProduct, 
  TruckInventoryDTO, 
  ApiEmployee, 
  ApiSalesExecutive, 
  ApiDeliveryRoute 
} from '../services/apiService';
import { CustomSelect, Toast } from '../components/common';

export const TruckInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [truckInventories, setTruckInventories] = useState<TruckInventoryDTO[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [drivers, setDrivers] = useState<ApiEmployee[]>([]);
  const [salesReps, setSalesReps] = useState<ApiSalesExecutive[]>([]);
  const [routes, setRoutes] = useState<ApiDeliveryRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ON_ROUTE' | 'AT_PLANT' | 'LOW_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ─── Refill Modal State ──────────────────────────────────────────────────
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [selectedTruckForRefill, setSelectedTruckForRefill] = useState<TruckInventoryDTO | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<number | null>(null);
  const [selectedRouteForRefill, setSelectedRouteForRefill] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [refillItems, setRefillItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [packagingRefillRows, setPackagingRefillRows] = useState<Record<number, {
    boxCount: number;
    unitsPerBox: number;
    bundleCount: number;
    unitsPerBundle: number;
    coverCount: number;
    unitsPerCover: number;
    tinCount: number;
    looseUnits: number;
  }>>({});
  const [refillNotes, setRefillNotes] = useState('');
  const [isSubmittingRefill, setIsSubmittingRefill] = useState(false);

  // ─── Trip Start Gate Check Modal State ───────────────────────────────────
  const [isTripStartModalOpen, setIsTripStartModalOpen] = useState(false);
  const [selectedTruckForTripStart, setSelectedTruckForTripStart] = useState<TruckInventoryDTO | null>(null);
  const [tripStartStep, setTripStartStep] = useState<1 | 2 | 3>(1);
  const [carryoverAuditItems, setCarryoverAuditItems] = useState<Array<{ productId: number; actualCount: number; damagedCount: number }>>([]);
  const [tripStartInspectorName, setTripStartInspectorName] = useState('Gate Incharge');
  const [tripStartGatePassId, setTripStartGatePassId] = useState('');

  // ─── Audit Modal State ───────────────────────────────────────────────────
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedTruckForAudit, setSelectedTruckForAudit] = useState<TruckInventoryDTO | null>(null);
  const [auditItems, setAuditItems] = useState<{ productId: number; actualCount: number; damagedCount: number }[]>([]);
  const [auditNotes, setAuditNotes] = useState('');
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Helper to determine packaging defaults for a product
  const getProductPackagingDefaults = (prod: ApiProduct | any) => {
    const name = (prod.name || '').toLowerCase();
    if (name.includes('bun')) {
      return { unitsPerBox: 0, unitsPerBundle: 12, unitsPerCover: 0, isTin: false };
    }
    if (name.includes('30') && name.includes('rusk')) {
      return { unitsPerBox: 0, unitsPerBundle: 0, unitsPerCover: 63, isTin: false };
    }
    if (name.includes('20') && name.includes('rusk')) {
      return { unitsPerBox: 30, unitsPerBundle: 10, unitsPerCover: 0, isTin: false };
    }
    if (name.includes('3kg') || name.includes('din') || name.includes('tin')) {
      return { unitsPerBox: 0, unitsPerBundle: 0, unitsPerCover: 0, isTin: true };
    }
    if (name.includes('rusk') || name.includes('toster')) {
      return { unitsPerBox: 40, unitsPerBundle: 12, unitsPerCover: 0, isTin: false };
    }
    // Standard Bread
    return { unitsPerBox: 24, unitsPerBundle: 10, unitsPerCover: 0, isTin: false };
  };

  const computeProductPackagingUnits = (pkg: {
    boxCount: number;
    unitsPerBox: number;
    bundleCount: number;
    unitsPerBundle: number;
    coverCount: number;
    unitsPerCover: number;
    tinCount: number;
    looseUnits: number;
  }) => {
    return (
      (pkg.boxCount * pkg.unitsPerBox) +
      (pkg.bundleCount * pkg.unitsPerBundle) +
      (pkg.coverCount * pkg.unitsPerCover) +
      (pkg.tinCount * 3) +
      pkg.looseUnits
    );
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [truckRes, prodRes, driverRes, salesRes, routeRes] = await Promise.all([
        inventoryApi.getTruckInventories().catch(() => ({ data: [] })),
        productApi.getAll().catch(() => ({ data: [] })),
        employeeApi.getAll('DRIVER').catch(() => ({ data: [] })),
        salesExecutiveApi.getAll().catch(() => ({ data: [] })),
        routeApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (Array.isArray(truckRes.data)) setTruckInventories(truckRes.data);
      if (Array.isArray(prodRes.data)) setProducts(prodRes.data);
      if (Array.isArray(driverRes.data)) {
        setDrivers(driverRes.data);
        if (driverRes.data.length > 0 && !selectedDriverId) {
          setSelectedDriverId(driverRes.data[0].id);
        }
      }
      if (Array.isArray(salesRes.data)) {
        setSalesReps(salesRes.data);
        if (salesRes.data.length > 0 && !selectedSalesRepId) {
          setSelectedSalesRepId(salesRes.data[0].id);
        }
      }
      if (Array.isArray(routeRes.data)) {
        setRoutes(routeRes.data);
        if (routeRes.data.length > 0 && !selectedRouteForRefill) {
          setSelectedRouteForRefill(routeRes.data[0].routeName);
        }
      }
    } catch (err) {
      console.error('Error loading truck inventory data:', err);
      showToast('Error syncing data from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Open Refill Modal ───────────────────────────────────────────────────
  const handleOpenTruckRefill = (truck?: TruckInventoryDTO) => {
    const target = truck || (truckInventories.length > 0 ? truckInventories[0] : null);
    setSelectedTruckForRefill(target);
    if (target?.assignedRoute) {
      setSelectedRouteForRefill(target.assignedRoute);
    } else if (routes.length > 0 && !selectedRouteForRefill) {
      setSelectedRouteForRefill(routes[0].routeName);
    }

    const initialItems = products.map(p => ({ productId: p.id, quantity: 0 }));
    const initialPkgRows: Record<number, any> = {};
    products.forEach(p => {
      const defaults = getProductPackagingDefaults(p);
      initialPkgRows[p.id] = {
        boxCount: 0,
        unitsPerBox: defaults.unitsPerBox || 24,
        bundleCount: 0,
        unitsPerBundle: defaults.unitsPerBundle || 10,
        coverCount: 0,
        unitsPerCover: defaults.unitsPerCover || 63,
        tinCount: 0,
        looseUnits: 0
      };
    });

    setPackagingRefillRows(initialPkgRows);
    setRefillItems(initialItems);
    setRefillNotes('');
    setIsRefillModalOpen(true);
  };

  const handlePackagingQtyChange = (
    productId: number, 
    field: 'boxCount' | 'bundleCount' | 'coverCount' | 'tinCount' | 'looseUnits', 
    val: number
  ) => {
    setPackagingRefillRows(prev => {
      const current = prev[productId] || {
        boxCount: 0,
        unitsPerBox: 24,
        bundleCount: 0,
        unitsPerBundle: 10,
        coverCount: 0,
        unitsPerCover: 63,
        tinCount: 0,
        looseUnits: 0
      };

      const updated = {
        ...current,
        [field]: Math.max(0, val)
      };

      const totalUnits = computeProductPackagingUnits(updated);

      setRefillItems(oldItems => oldItems.map(item => 
        item.productId === productId ? { ...item, quantity: totalUnits } : item
      ));

      return {
        ...prev,
        [productId]: updated
      };
    });
  };

  const handleSaveTruckRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckForRefill) {
      showToast('Please select a truck to load');
      return;
    }

    const itemsToRefill = refillItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        productId: item.productId,
        quantityToRefill: item.quantity
      }));

    if (itemsToRefill.length === 0) {
      showToast('Please specify at least one product quantity to refill');
      return;
    }

    const currentDriver = drivers.find(d => d.id === selectedDriverId) || (drivers.length > 0 ? drivers[0] : { name: selectedTruckForRefill.assignedDriver, fullName: selectedTruckForRefill.assignedDriver });
    const currentSales = salesReps.find(s => s.id === selectedSalesRepId) || (salesReps.length > 0 ? salesReps[0] : { fullName: 'Field Sales' });

    try {
      setIsSubmittingRefill(true);
      await inventoryApi.refillTruck({
        vehicleId: selectedTruckForRefill.vehicleId,
        vehicleNumber: selectedTruckForRefill.vehicleNumber,
        driverName: currentDriver.fullName || (currentDriver as any).name || selectedTruckForRefill.assignedDriver,
        notes: refillNotes || `Crew: ${currentDriver.fullName || (currentDriver as any).name} (Driver) & ${currentSales.fullName} (Sales) • Route: ${selectedRouteForRefill} • Date: ${dispatchDate}`,
        items: itemsToRefill
      });

      const totalRefilled = itemsToRefill.reduce((acc, curr) => acc + curr.quantityToRefill, 0);
      showToast(`⚡ Refilled ${totalRefilled} loaves onto ${selectedTruckForRefill.vehicleNumber}!`);
      setIsRefillModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Refill failed:', err);
      showToast('Truck refill failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingRefill(false);
    }
  };

  // ─── Open Daily Trip Start Gate Check ────────────────────────────────────
  const handleOpenTripStartGateCheck = (truck: TruckInventoryDTO) => {
    setSelectedTruckForTripStart(truck);
    if (truck.assignedRoute) {
      setSelectedRouteForRefill(truck.assignedRoute);
    } else if (routes.length > 0 && !selectedRouteForRefill) {
      setSelectedRouteForRefill(routes[0].routeName);
    }
    setDispatchDate(new Date().toISOString().slice(0, 10));
    setTripStartStep(1);
    setTripStartGatePassId(`GATE-${truck.vehicleNumber.replace(/[^A-Za-z0-9]/g, '')}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);

    const initialAudit = (truck.items || []).map(item => ({
      productId: item.productId,
      actualCount: item.availableQuantity,
      damagedCount: 0
    }));
    setCarryoverAuditItems(initialAudit);

    const initialPkgRows: Record<number, any> = {};
    const initialItems: { productId: number; quantity: number }[] = [];

    products.forEach(p => {
      const defaults = getProductPackagingDefaults(p);
      initialPkgRows[p.id] = {
        boxCount: 0,
        unitsPerBox: defaults.unitsPerBox || 24,
        bundleCount: 0,
        unitsPerBundle: defaults.unitsPerBundle || 10,
        coverCount: 0,
        unitsPerCover: defaults.unitsPerCover || 63,
        tinCount: 0,
        looseUnits: 0
      };
      initialItems.push({ productId: p.id, quantity: 0 });
    });

    setPackagingRefillRows(initialPkgRows);
    setRefillItems(initialItems);
    setIsTripStartModalOpen(true);
  };

  // ─── Open Audit Modal ────────────────────────────────────────────────────
  const handleOpenTruckAudit = (truck: TruckInventoryDTO) => {
    setSelectedTruckForAudit(truck);
    setAuditItems((truck.items || []).map(item => ({
      productId: item.productId,
      actualCount: item.availableQuantity,
      damagedCount: 0
    })));
    setAuditNotes(`Physical stock audit on ${truck.vehicleNumber}`);
    setIsAuditModalOpen(true);
  };

  const handleSaveTruckAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckForAudit) return;

    try {
      setIsSubmittingAudit(true);
      await inventoryApi.auditTruckStock({
        vehicleId: selectedTruckForAudit.vehicleId,
        notes: auditNotes,
        items: auditItems.map(item => ({
          productId: item.productId,
          actualPhysicalCount: item.actualCount,
          damagedCount: item.damagedCount
        }))
      });

      showToast(`✓ Stock audit completed for ${selectedTruckForAudit.vehicleNumber}`);
      setIsAuditModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('Error recording audit: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  // Refill Summary Computation
  const refillSummary = useMemo(() => {
    const totalLoaves = refillItems.reduce((acc, item) => acc + item.quantity, 0);
    const estimatedWeightKg = Math.round(totalLoaves * 0.4);
    const currentWeight = selectedTruckForRefill?.totalWeightKg || 0;
    const capacityKg = selectedTruckForRefill?.capacityKg || 1500;
    const newTotalWeight = currentWeight + estimatedWeightKg;
    const newCapacityPct = Math.min(100, Math.round((newTotalWeight / capacityKg) * 100));

    return { totalLoaves, estimatedWeightKg, newTotalWeight, newCapacityPct };
  }, [refillItems, selectedTruckForRefill]);

  // Filtered Trucks
  const filteredTrucks = useMemo(() => {
    return truckInventories.filter(truck => {
      const matchesSearch = 
        truck.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (truck.assignedRoute && truck.assignedRoute.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'ON_ROUTE') return truck.totalAvailableUnits > 0;
      if (statusFilter === 'AT_PLANT') return truck.totalAvailableUnits === 0;
      if (statusFilter === 'LOW_STOCK') return truck.payloadCapacityPercentage < 30;

      return true;
    });
  }, [truckInventories, searchQuery, statusFilter]);

  // Aggregate Stats
  const totalFleetLoaves = useMemo(() => {
    return truckInventories.reduce((acc, t) => acc + t.totalAvailableUnits, 0);
  }, [truckInventories]);

  const totalFleetValue = useMemo(() => {
    return truckInventories.reduce((acc, t) => acc + t.totalStockValue, 0);
  }, [truckInventories]);

  const totalFleetCapacity = useMemo(() => {
    const totalCap = truckInventories.reduce((acc, t) => acc + t.capacityKg, 0);
    const totalUsed = truckInventories.reduce((acc, t) => acc + t.totalWeightKg, 0);
    return totalCap > 0 ? Math.round((totalUsed / totalCap) * 100) : 0;
  }, [truckInventories]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification (Bottom Center) */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* ─── Modern Page Header ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
                Fleet Truck Inventory & Dispatch Station
              </h1>
              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                <Truck className="w-3 h-3 text-purple-500" />
                Plant Fleet Hub
              </span>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Live On-Board Stock
              </span>
            </div>
            <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
              Real-time on-board stock tracking, dispatch crew assignments, daily opening audits, and packaging-based van loading.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => handleOpenTruckRefill()}
              className="px-4 py-2 bg-[#1C1C1C] dark:bg-amber-600 hover:bg-black dark:hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4" /> + Refill & Load Delivery Truck
            </button>
          </div>
        </div>

        {/* Linked Workflow Modules Navigation Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#F0F2F5] dark:border-slate-700/60 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Plant Logistics Workflow:
          </span>
          <button
            onClick={() => navigate('/production')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#F8F9FA] dark:bg-slate-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-300 rounded-xl text-xs font-semibold border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition cursor-pointer"
          >
            <Factory className="w-3.5 h-3.5 text-amber-500" />
            <span>Plant Production Hub</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#F8F9FA] dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl text-xs font-semibold border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>Finished Goods Inventory</span>
            <ArrowRight className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => navigate('/truck-dispatch')}
            className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800 transition cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            <span>Truck Dispatch Module</span>
            <ArrowRight className="w-3 h-3 text-purple-400" />
          </button>
        </div>
      </div>

      {/* ─── 4 KPI Metrics Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Active Fleet Trucks</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {truckInventories.length} <span className="text-xs font-normal text-slate-400 font-sans">Vehicles</span>
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            ✓ Ready for daily dispatch runs
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Total Units in Transit</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalFleetLoaves.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">Units</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Across {truckInventories.length} delivery vans
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">On-Board Stock Value</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{totalFleetValue.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">
            Wholesale value on route
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-bold">Fleet Payload Capacity</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalFleetCapacity}%
          </p>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
              style={{ width: `${Math.min(100, totalFleetCapacity)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* ─── Unified Control Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs">
        {/* Left: View Mode Toggle + Divider + Status Filter Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle (Standardized Icon-Only Pill) */}
          <div className="flex items-center p-1 bg-[#F4F5F7] dark:bg-slate-900 rounded-2xl border border-[#E9ECEF] dark:border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">
              STATUS:
            </span>
            {[
              { key: 'ALL', label: 'All Fleet' },
              { key: 'ON_ROUTE', label: '🚚 Loaded / On Route' },
              { key: 'AT_PLANT', label: '🏭 Empty / At Plant' },
              { key: 'LOW_STOCK', label: '⚠️ Low Stock (<30%)' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                    : 'bg-[#F4F5F7] dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search vehicle #, driver, route..."
            className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs"
          />
        </div>
      </div>

      {/* ─── VIEW 1: ENTERPRISE TABLE VIEW ───────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          {filteredTrucks.length === 0 ? (
            <div className="py-16 text-center">
              <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Fleet Trucks Found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
                <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700 font-extrabold">
                  <tr>
                    <th className="py-3.5 px-4">Vehicle & Model</th>
                    <th className="py-3.5 px-4">Assigned Crew</th>
                    <th className="py-3.5 px-4">Assigned Route</th>
                    <th className="py-3.5 px-4 text-center">On-Board Units</th>
                    <th className="py-3.5 px-4">Payload Capacity</th>
                    <th className="py-3.5 px-4 text-right">Stock Value</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60 font-medium">
                  {filteredTrucks.map(truck => {
                    const isOverloaded = truck.payloadCapacityPercentage > 100;
                    const isNearCapacity = truck.payloadCapacityPercentage > 85;
                    const isOnRoute = truck.totalAvailableUnits > 0;

                    return (
                      <tr key={truck.vehicleId} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-700/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-extrabold font-mono text-slate-900 dark:text-white block">
                                {truck.vehicleNumber}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {truck.model} • Cap: {truck.capacityKg} kg
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {truck.assignedDriver}
                          </span>
                          {truck.driverPhone && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> {truck.driverPhone}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[10px] inline-flex items-center gap-1">
                            🗺️ {truck.assignedRoute || 'Route 1 - Central'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                            Trip #{truck.tripNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-black font-mono text-sm text-slate-900 dark:text-white block">
                            {truck.totalAvailableUnits.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {truck.items?.length || 0} Products
                          </span>
                        </td>

                        <td className="py-3.5 px-4 min-w-[150px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                            <span>{truck.totalWeightKg} kg</span>
                            <span className="font-bold">{truck.payloadCapacityPercentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                isOverloaded ? 'bg-rose-500' : isNearCapacity ? 'bg-amber-500' : 'bg-purple-600'
                              }`} 
                              style={{ width: `${Math.min(100, truck.payloadCapacityPercentage)}%` }} 
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{truck.totalStockValue.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isOnRoute ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ON ROUTE
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                              AT PLANT
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenTripStartGateCheck(truck)}
                              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 transition cursor-pointer"
                              title="Daily Trip Start Gate Check & Pass"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenTruckRefill(truck)}
                              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 transition cursor-pointer"
                              title="Refill Truck Stock"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenTruckAudit(truck)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Physical Stock Audit"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── VIEW 2: DETAILED CARDS GRID VIEW ────────────────────────────── */}
      {viewMode === 'grid' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredTrucks.length === 0 ? (
          <div className="col-span-2 py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Fleet Trucks Found</p>
            <p className="text-xs text-slate-400 mt-1">Onboard vehicles in Vehicle Onboarding to begin tracking truck inventory</p>
          </div>
        ) : (
          filteredTrucks.map(truck => {
            const isOverloaded = truck.payloadCapacityPercentage > 100;
            const isNearCapacity = truck.payloadCapacityPercentage > 85;

            return (
              <div
                key={truck.vehicleId}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs hover:shadow-md transition p-6 flex flex-col justify-between space-y-5"
              >
                {/* Truck Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black font-mono text-slate-900 dark:text-white">
                            {truck.vehicleNumber}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                            {truck.model}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Driver: <strong className="text-slate-700 dark:text-slate-200">{truck.assignedDriver}</strong></span>
                          {truck.driverPhone && (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                              <Phone className="w-3 h-3" /> {truck.driverPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-slate-900 dark:text-white block">
                        ₹{truck.totalStockValue.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">On-Board Stock Value</span>
                    </div>
                  </div>

                  {/* Route & Trip Badge */}
                  <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
                    <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] flex items-center gap-1">
                      🗺️ {truck.assignedRoute || 'Route 1 - Gandhipuram Central'}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      Trip #{truck.tripNumber}
                    </span>
                  </div>

                  {/* Payload Utilization Bar */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-purple-500" />
                        Payload Weight Utilization
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {truck.totalWeightKg} kg / {truck.capacityKg} kg ({truck.payloadCapacityPercentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverloaded ? 'bg-rose-500' : isNearCapacity ? 'bg-amber-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${Math.min(100, truck.payloadCapacityPercentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* On-Board Products Table */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Current Stock on Truck ({truck.totalAvailableUnits} loaves)
                    </span>
                  </div>

                  {(!truck.items || truck.items.length === 0) ? (
                    <div className="py-6 text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                      Truck is currently empty. Click <strong>"Refill Packaging"</strong> to load loaves for delivery.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">
                            <th className="py-2 px-3">Product</th>
                            <th className="py-2 px-3 text-center">Loaded</th>
                            <th className="py-2 px-3 text-center">Sold</th>
                            <th className="py-2 px-3 text-center">Avail</th>
                            <th className="py-2 px-3 text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                          {truck.items.map(item => (
                            <tr key={item.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                {item.productName}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-slate-500">
                                {item.loadedQuantity}
                              </td>
                              <td className="py-2 px-3 text-center font-mono text-emerald-600 font-bold">
                                {item.soldQuantity}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-black text-purple-600 dark:text-purple-400">
                                {item.availableQuantity}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                                ₹{item.lineTotalValue.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Truck Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => handleOpenTripStartGateCheck(truck)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    title="Run opening audit, refill packaging, and issue trip gate pass"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    🚚 Daily Trip Start Gate Check
                  </button>

                  <button
                    onClick={() => handleOpenTruckRefill(truck)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    title="Refill Truck with Packaging (Boxes, Bundles, Covers & Tins)"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Refill Packaging
                  </button>

                  <button
                    onClick={() => handleOpenTruckAudit(truck)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Check Physical Stock Variance"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Audit Count
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MANUAL PACKAGING-BASED TRUCK REFILL & DISPATCH CREW MODAL               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isRefillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <Zap className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Manual Truck Inventory Loading & Dispatch Crew Assignment
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Assign delivery crew (vehicle, driver, sales rep), route & dispatch day (mobile app linked)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRefillModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTruckRefill} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* 1. Dispatch Crew Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  1. Dispatch Crew Selection (Mobile App Linked)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Delivery Vehicle / Truck *
                    </label>
                    <CustomSelect
                      value={selectedTruckForRefill ? String(selectedTruckForRefill.vehicleId) : ''}
                      onChange={(val: string) => {
                        const matched = truckInventories.find(t => t.vehicleId === Number(val));
                        setSelectedTruckForRefill(matched || null);
                        if (matched?.assignedRoute) {
                          setSelectedRouteForRefill(matched.assignedRoute);
                        }
                      }}
                      options={truckInventories.map(t => ({
                        value: String(t.vehicleId),
                        label: `${t.vehicleNumber} (${t.model})`,
                        badge: `${t.totalAvailableUnits} ON VAN`
                      }))}
                      placeholder="Select Vehicle"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Driver *
                    </label>
                    <CustomSelect
                      value={selectedDriverId ? String(selectedDriverId) : ''}
                      onChange={(val: string) => setSelectedDriverId(Number(val))}
                      options={drivers.map(d => ({
                        value: String(d.id),
                        label: `${d.fullName} (${d.phone || d.username})`,
                        badge: 'DRIVER'
                      }))}
                      placeholder="Select Driver"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sales Person / Rep *
                    </label>
                    <CustomSelect
                      value={selectedSalesRepId ? String(selectedSalesRepId) : ''}
                      onChange={(val: string) => setSelectedSalesRepId(Number(val))}
                      options={salesReps.map(s => ({
                        value: String(s.id),
                        label: `${s.fullName} (${s.email || 'Sales'})`,
                        badge: 'SALES'
                      }))}
                      placeholder="Select Sales Rep"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Route & Dispatch Day (Date) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  2. Route & Dispatch Day
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Associated Delivery Route *
                    </label>
                    <CustomSelect
                      value={selectedRouteForRefill}
                      onChange={(val: string) => setSelectedRouteForRefill(val)}
                      options={routes.map(r => ({
                        value: r.routeName,
                        label: r.routeName,
                        badge: 'ROUTE'
                      }))}
                      placeholder="Select Delivery Route"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Dispatch Day (Date) *
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDispatchDate(new Date().toISOString().slice(0, 10))}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tom = new Date();
                            tom.setDate(tom.getDate() + 1);
                            setDispatchDate(tom.toISOString().slice(0, 10));
                          }}
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          Tomorrow
                        </button>
                      </div>
                    </div>
                    <input
                      type="date"
                      required
                      value={dispatchDate}
                      onChange={e => setDispatchDate(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Truck Capacity Live Indicator */}
              {selectedTruckForRefill && (
                <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-purple-900 dark:text-purple-300">
                      Truck: {selectedTruckForRefill.vehicleNumber} • Driver: {drivers.find(d => d.id === selectedDriverId)?.fullName || selectedTruckForRefill.assignedDriver} • Sales: {salesReps.find(s => s.id === selectedSalesRepId)?.fullName || 'Sales Executive'}
                    </span>
                    <span className="text-purple-700 dark:text-purple-400 font-mono">
                      Current on Van: {selectedTruckForRefill.totalAvailableUnits} loaves ({selectedTruckForRefill.totalWeightKg} kg)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-200/60 dark:border-purple-800/60">
                    <span>Adding: <strong>+{refillSummary.totalLoaves} loaves (+{refillSummary.estimatedWeightKg} kg)</strong></span>
                    <span>New Total: <strong>{refillSummary.newTotalWeight} kg / {selectedTruckForRefill.capacityKg} kg ({refillSummary.newCapacityPct}%)</strong></span>
                  </div>
                </div>
              )}

              {/* 4. Load Inventory (Boxes, Bundles & Loose Units) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>3. Load Inventory (Boxes, Bundles & Loose Units)</span>
                  <span className="text-[10px] text-purple-600 font-bold font-mono">Total to Load: {refillSummary.totalLoaves} loaves</span>
                </label>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  {products.map(prod => {
                    const pkg = packagingRefillRows[prod.id] || {
                      boxCount: 0,
                      unitsPerBox: 24,
                      bundleCount: 0,
                      unitsPerBundle: 10,
                      coverCount: 0,
                      unitsPerCover: 63,
                      tinCount: 0,
                      looseUnits: 0
                    };
                    const totalProdLoaves = computeProductPackagingUnits(pkg);

                    return (
                      <div key={prod.id} className="p-3 bg-white dark:bg-slate-800 space-y-2 hover:bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {prod.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">{prod.productCode} • {prod.category}</span>
                          </div>
                          <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">
                            {totalProdLoaves} loaves
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                          <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">Boxes ({pkg.unitsPerBox || 24}/b)</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.boxCount || ''}
                              onChange={e => handlePackagingQtyChange(prod.id, 'boxCount', parseInt(e.target.value, 10) || 0)}
                              placeholder="0"
                              className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">Bundles ({pkg.unitsPerBundle || 10}/b)</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.bundleCount || ''}
                              onChange={e => handlePackagingQtyChange(prod.id, 'bundleCount', parseInt(e.target.value, 10) || 0)}
                              placeholder="0"
                              className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">Covers (63/c)</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.coverCount || ''}
                              onChange={e => handlePackagingQtyChange(prod.id, 'coverCount', parseInt(e.target.value, 10) || 0)}
                              placeholder="0"
                              className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">3kg Tins</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.tinCount || ''}
                              onChange={e => handlePackagingQtyChange(prod.id, 'tinCount', parseInt(e.target.value, 10) || 0)}
                              placeholder="0"
                              className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] text-slate-400 mb-0.5">Loose Loaves</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.looseUnits || ''}
                              onChange={e => handlePackagingQtyChange(prod.id, 'looseUnits', parseInt(e.target.value, 10) || 0)}
                              placeholder="0"
                              className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Notes
                </label>
                <input
                  type="text"
                  value={refillNotes}
                  onChange={e => setRefillNotes(e.target.value)}
                  placeholder={`Manual loading for ${selectedRouteForRefill} (Date: ${dispatchDate})`}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRefillModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefill || refillSummary.totalLoaves === 0}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition flex items-center gap-1.5"
                >
                  {isSubmittingRefill && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Packaging Refill (+{refillSummary.totalLoaves} Loaves)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DAILY TRIP START GATE CHECK & VEHICLE AUDIT STATION MODAL               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isTripStartModalOpen && selectedTruckForTripStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <ShieldCheck className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm">
                      Daily Trip Start Gate Check & Vehicle Audit Station
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded">
                      {tripStartGatePassId}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    Truck: <strong>{selectedTruckForTripStart.vehicleNumber}</strong> • Driver: <strong>{selectedTruckForTripStart.assignedDriver}</strong> • Capacity: <strong>{selectedTruckForTripStart.capacityKg} kg</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTripStartModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTripStartStep(1)}
                className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                  tripStartStep === 1
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>1. Check Existing Carryover</span>
              </button>

              <button
                type="button"
                onClick={() => setTripStartStep(2)}
                className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                  tripStartStep === 2
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>2. Manual Packaging Refill</span>
              </button>

              <button
                type="button"
                onClick={() => setTripStartStep(3)}
                className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${
                  tripStartStep === 3
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>3. Gate Pass & Sign-Off</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* STEP 1 */}
              {tripStartStep === 1 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                    <p className="font-extrabold text-amber-900 dark:text-amber-300">
                      Step 1: Inspect & Verify Physical Carryover Stock on Van
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Verify loaves remaining in the vehicle from previous delivery trips. Record any damaged items to reconcile variances.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    {carryoverAuditItems.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const originalItem = selectedTruckForTripStart.items?.find(i => i.productId === item.productId);
                      const expected = originalItem ? originalItem.availableQuantity : 0;
                      const variance = item.actualCount - expected;

                      return (
                        <div key={item.productId} className="p-3.5 bg-white dark:bg-slate-800 flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {prod ? prod.name : `Product #${item.productId}`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              System Carryover: <strong className="text-slate-700 dark:text-slate-300">{expected} loaves</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5 text-center font-bold">Physical Count</label>
                              <input
                                type="number"
                                min="0"
                                value={item.actualCount}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setCarryoverAuditItems(prev => prev.map(i => i.productId === item.productId ? { ...i, actualCount: val } : i));
                                }}
                                className="w-20 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1 font-mono font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-rose-500 mb-0.5 text-center font-bold">Damaged</label>
                              <input
                                type="number"
                                min="0"
                                value={item.damagedCount}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setCarryoverAuditItems(prev => prev.map(i => i.productId === item.productId ? { ...i, damagedCount: val } : i));
                                }}
                                className="w-16 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl py-1 font-mono font-bold text-xs text-rose-600"
                              />
                            </div>

                            <div className="text-right w-16">
                              <span className="block text-[9px] text-slate-400 mb-0.5 font-bold">Variance</span>
                              <span className={`text-xs font-mono font-bold ${
                                variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {variance > 0 ? `+${variance}` : variance}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setTripStartStep(2)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      Carryover Verified ➔ Proceed to Manual Packaging Refill <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {tripStartStep === 2 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 text-xs space-y-2">
                    <p className="font-extrabold text-purple-900 dark:text-purple-300">
                      Step 2: Dispatch Crew & Packaging Top-Up (Boxes, Bundles & Loose Units)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-800 dark:text-purple-300 mb-0.5">Driver:</label>
                        <CustomSelect
                          value={selectedDriverId ? String(selectedDriverId) : ''}
                          onChange={(val: string) => setSelectedDriverId(Number(val))}
                          options={drivers.map(d => ({ value: String(d.id), label: d.fullName }))}
                          placeholder="Select Driver"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-800 dark:text-purple-300 mb-0.5">Sales Person:</label>
                        <CustomSelect
                          value={selectedSalesRepId ? String(selectedSalesRepId) : ''}
                          onChange={(val: string) => setSelectedSalesRepId(Number(val))}
                          options={salesReps.map(s => ({ value: String(s.id), label: s.fullName }))}
                          placeholder="Select Sales Rep"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-800 dark:text-purple-300 mb-0.5">Dispatch Day (Date):</label>
                        <input
                          type="date"
                          value={dispatchDate}
                          onChange={e => setDispatchDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Packaging Input Rows */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                    {products.map(prod => {
                      const pkg = packagingRefillRows[prod.id] || {
                        boxCount: 0,
                        unitsPerBox: 24,
                        bundleCount: 0,
                        unitsPerBundle: 10,
                        coverCount: 0,
                        unitsPerCover: 63,
                        tinCount: 0,
                        looseUnits: 0
                      };
                      const totalProdLoaves = computeProductPackagingUnits(pkg);

                      return (
                        <div key={prod.id} className="p-3 bg-white dark:bg-slate-800 space-y-2 hover:bg-slate-50/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {prod.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-mono">{prod.productCode} • {prod.category}</span>
                            </div>
                            <span className="text-xs font-mono font-black text-purple-600 dark:text-purple-400">
                              +{totalProdLoaves} loaves
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[10px]">
                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5">Boxes ({pkg.unitsPerBox || 24}/b)</label>
                              <input
                                type="number"
                                min="0"
                                value={pkg.boxCount || ''}
                                onChange={e => handlePackagingQtyChange(prod.id, 'boxCount', parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5">Bundles ({pkg.unitsPerBundle || 10}/b)</label>
                              <input
                                type="number"
                                min="0"
                                value={pkg.bundleCount || ''}
                                onChange={e => handlePackagingQtyChange(prod.id, 'bundleCount', parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5">Covers (63/c)</label>
                              <input
                                type="number"
                                min="0"
                                value={pkg.coverCount || ''}
                                onChange={e => handlePackagingQtyChange(prod.id, 'coverCount', parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5">3kg Tins</label>
                              <input
                                type="number"
                                min="0"
                                value={pkg.tinCount || ''}
                                onChange={e => handlePackagingQtyChange(prod.id, 'tinCount', parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] text-slate-400 mb-0.5">Loose</label>
                              <input
                                type="number"
                                min="0"
                                value={pkg.looseUnits || ''}
                                onChange={e => handlePackagingQtyChange(prod.id, 'looseUnits', parseInt(e.target.value, 10) || 0)}
                                placeholder="0"
                                className="w-full text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1 font-bold text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setTripStartStep(1)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripStartStep(3)}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      Refill Configured ➔ Review Gate Pass Manifest <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {tripStartStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white block">GEMINI FOODS B2B • TRIP DEPARTURE MANIFEST</span>
                        <span className="text-[10px] text-slate-400">Pass ID: {tripStartGatePassId} • Vehicle: {selectedTruckForTripStart.vehicleNumber}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold text-[10px]">
                        ✓ AUDIT & GATE PASS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 text-[9px] block">DELIVERY ROUTE:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{selectedRouteForRefill}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] block">DISPATCH DAY:</span>
                        <strong className="text-purple-600 dark:text-purple-400">{dispatchDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] block">ASSIGNED DRIVER:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{drivers.find(d => d.id === selectedDriverId)?.fullName || selectedTruckForTripStart.assignedDriver}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[9px] block">SALES REP:</span>
                        <strong className="text-slate-800 dark:text-slate-200">{salesReps.find(s => s.id === selectedSalesRepId)?.fullName || 'Sales Executive'}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px]">EXISTING AUDITED:</span>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {carryoverAuditItems.reduce((acc, i) => acc + i.actualCount, 0)} loaves
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">MORNING REFILLED:</span>
                        <strong className="text-purple-600 dark:text-purple-400">
                          +{refillSummary.totalLoaves} loaves
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px]">NET DEPARTURE TOTAL:</span>
                        <strong className="text-emerald-600 text-sm">
                          {carryoverAuditItems.reduce((acc, i) => acc + i.actualCount, 0) + refillSummary.totalLoaves} loaves
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Gate Incharge / Supervisor Sign-off *
                    </label>
                    <input
                      type="text"
                      required
                      value={tripStartInspectorName}
                      onChange={e => setTripStartInspectorName(e.target.value)}
                      className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTripStartStep(2)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 rounded-xl"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setIsSubmittingRefill(true);
                          const activeDriver = drivers.find(d => d.id === selectedDriverId) || (drivers.length > 0 ? drivers[0] : { fullName: selectedTruckForTripStart.assignedDriver });
                          const activeSales = salesReps.find(s => s.id === selectedSalesRepId) || (salesReps.length > 0 ? salesReps[0] : { fullName: 'Sales Representative' });

                          await inventoryApi.auditTruckStock({
                            vehicleId: selectedTruckForTripStart.vehicleId,
                            notes: `Opening daily trip audit: Gate Pass ${tripStartGatePassId} (Route: ${selectedRouteForRefill} • Date: ${dispatchDate} • Driver: ${activeDriver.fullName} • Sales: ${activeSales.fullName})`,
                            items: carryoverAuditItems.map(i => ({
                              productId: i.productId,
                              actualPhysicalCount: i.actualCount,
                              damagedCount: i.damagedCount
                            }))
                          });

                          const itemsToRefill = refillItems
                            .filter(i => i.quantity > 0)
                            .map(i => ({
                              productId: i.productId,
                              quantityToRefill: i.quantity
                            }));

                          if (itemsToRefill.length > 0) {
                            await inventoryApi.refillTruck({
                              vehicleId: selectedTruckForTripStart.vehicleId,
                              vehicleNumber: selectedTruckForTripStart.vehicleNumber,
                              driverName: activeDriver.fullName || (activeDriver as any).name || selectedTruckForTripStart.assignedDriver,
                              notes: `Trip Start Refill: ${selectedRouteForRefill} (Date: ${dispatchDate}) • Crew: ${activeDriver.fullName} & ${activeSales.fullName} by ${tripStartInspectorName}`,
                              items: itemsToRefill
                            });
                          }

                          showToast(`🚚 Trip Gate Pass ${tripStartGatePassId} confirmed! ${selectedTruckForTripStart.vehicleNumber} is departure-ready.`);
                          setIsTripStartModalOpen(false);
                          loadData();
                        } catch (err: any) {
                          showToast('Error issuing trip gate pass: ' + (err.response?.data?.message || err.message));
                        } finally {
                          setIsSubmittingRefill(false);
                        }
                      }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      🔒 Confirm Departure & Lock Trip Gate Pass
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* AUDIT COUNT MODAL                                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAuditModalOpen && selectedTruckForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <Check className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Physical Stock Audit — {selectedTruckForAudit.vehicleNumber}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Verify physical count and record damages to reconcile variance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTruckAudit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                {auditItems.map(item => {
                  const prod = products.find(p => p.id === item.productId);
                  const truckItem = selectedTruckForAudit.items?.find(i => i.productId === item.productId);
                  const expected = truckItem ? truckItem.availableQuantity : 0;
                  const variance = item.actualCount - expected;

                  return (
                    <div key={item.productId} className="p-3.5 bg-white dark:bg-slate-800 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {prod ? prod.name : `Product #${item.productId}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          System Stock: <strong className="text-slate-700 dark:text-slate-300">{expected} loaves</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <label className="block text-[9px] text-slate-400 mb-0.5 text-center font-bold">Counted</label>
                          <input
                            type="number"
                            min="0"
                            value={item.actualCount}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setAuditItems(prev => prev.map(i => i.productId === item.productId ? { ...i, actualCount: val } : i));
                            }}
                            className="w-20 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1 font-mono font-bold text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-rose-500 mb-0.5 text-center font-bold">Damaged</label>
                          <input
                            type="number"
                            min="0"
                            value={item.damagedCount}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10) || 0;
                              setAuditItems(prev => prev.map(i => i.productId === item.productId ? { ...i, damagedCount: val } : i));
                            }}
                            className="w-16 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl py-1 font-mono font-bold text-xs text-rose-600"
                          />
                        </div>

                        <div className="text-right w-14">
                          <span className="block text-[9px] text-slate-400 mb-0.5 font-bold">Variance</span>
                          <span className={`text-xs font-mono font-bold ${
                            variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {variance > 0 ? `+${variance}` : variance}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Notes / Reason for Discrepancy
                </label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={e => setAuditNotes(e.target.value)}
                  placeholder="e.g. Returned damaged loaves from Route 1"
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAudit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition flex items-center gap-1.5"
                >
                  {isSubmittingAudit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Audit Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
