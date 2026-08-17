import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  inventoryApi,
  productApi,
  employeeApi,
  salesExecutiveApi,
  routeApi,
  InventoryDashboardDTO,
  FinishedGoodsItemDTO,
  TransitStockItemDTO,
  StockLedgerItemDTO,
  TruckInventoryDTO,
  TruckInventoryItemDTO,
  ApiProduct,
  ApiEmployee,
  ApiSalesExecutive,
  ApiDeliveryRoute
} from '../services/apiService';
import { CustomSelect } from '../components/common';
import {
  Boxes,
  Package,
  Truck,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Layers,
  ShieldAlert,
  SlidersHorizontal,
  History,
  X,
  FileSpreadsheet,
  Building2,
  Store,
  ChevronRight,
  ShieldCheck,
  Tag,
  Eye,
  Edit3,
  Gauge,
  Phone,
  Check,
  FileText,
  Sparkles,
  Zap
} from 'lucide-react';

type ActiveTab = 'OVERVIEW' | 'FINISHED_GOODS' | 'TRANSIT_FLEET' | 'STOCK_LEDGER';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('OVERVIEW');
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<InventoryDashboardDTO | null>(null);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGoodsItemDTO[]>([]);
  const [transitStock, setTransitStock] = useState<TransitStockItemDTO[]>([]);
  const [truckInventories, setTruckInventories] = useState<TruckInventoryDTO[]>([]);
  const [stockLedger, setStockLedger] = useState<StockLedgerItemDTO[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [drivers, setDrivers] = useState<ApiEmployee[]>([]);
  const [salesReps, setSalesReps] = useState<ApiSalesExecutive[]>([]);
  const [routes, setRoutes] = useState<ApiDeliveryRoute[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('ALL');

  // Adjustment Modal (Warehouse)
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [adjustBatchNumber, setAdjustBatchNumber] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('10');
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adjustReason, setAdjustReason] = useState('AUDIT_RECONCILIATION');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Truck Refill Modal
  const [isRefillModalOpen, setIsRefillModalOpen] = useState(false);
  const [selectedTruckForRefill, setSelectedTruckForRefill] = useState<TruckInventoryDTO | null>(null);
  const [refillItems, setRefillItems] = useState<{ productId: number; quantity: number }[]>([]);
  const [refillNotes, setRefillNotes] = useState('');
  const [isSubmittingRefill, setIsSubmittingRefill] = useState(false);

  // Truck Audit / Physical Check Modal
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedTruckForAudit, setSelectedTruckForAudit] = useState<TruckInventoryDTO | null>(null);
  const [auditItems, setAuditItems] = useState<{ productId: number; actualCount: number; damagedCount: number }[]>([]);
  const [auditNotes, setAuditNotes] = useState('');
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  // ─── Manual Packaging-Based Refill & Dispatch Crew State ──────────────────
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [selectedSalesRepId, setSelectedSalesRepId] = useState<number | null>(null);
  const [selectedRouteForRefill, setSelectedRouteForRefill] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().slice(0, 10));

  // Daily Trip Start Gate Check Modal State
  const [isTripStartModalOpen, setIsTripStartModalOpen] = useState(false);
  const [selectedTruckForTripStart, setSelectedTruckForTripStart] = useState<TruckInventoryDTO | null>(null);
  const [tripStartStep, setTripStartStep] = useState<1 | 2 | 3>(1); // 1: Audit Existing, 2: Packaging Refill, 3: Gate Pass Manifest
  const [carryoverAuditItems, setCarryoverAuditItems] = useState<Array<{ productId: number; actualCount: number; damagedCount: number }>>([]);
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
  const [tripStartInspectorName, setTripStartInspectorName] = useState('Gate Incharge');
  const [tripStartGatePassId, setTripStartGatePassId] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [dashRes, fgRes, transitRes, truckRes, ledgerRes, prodRes, driverRes, salesRes, routeRes] = await Promise.all([
        inventoryApi.getDashboard().catch(() => ({ data: null })),
        inventoryApi.getFinishedGoods().catch(() => ({ data: [] })),
        inventoryApi.getTransitStock().catch(() => ({ data: [] })),
        inventoryApi.getTruckInventories().catch(() => ({ data: [] })),
        inventoryApi.getStockLedger().catch(() => ({ data: [] })),
        productApi.getAll().catch(() => ({ data: [] })),
        employeeApi.getAll('DRIVER').catch(() => ({ data: [] })),
        salesExecutiveApi.getAll().catch(() => ({ data: [] })),
        routeApi.getAll().catch(() => ({ data: [] })),
      ]);

      if (dashRes.data) setDashboardData(dashRes.data);
      if (Array.isArray(fgRes.data)) setFinishedGoods(fgRes.data);
      if (Array.isArray(transitRes.data)) setTransitStock(transitRes.data);
      if (Array.isArray(truckRes.data)) setTruckInventories(truckRes.data);
      if (Array.isArray(ledgerRes.data)) setStockLedger(ledgerRes.data);
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
      console.error('Error loading inventory data:', err);
      showToast('Error syncing inventory data from backend');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ─── Warehouse Stock Adjustment ───────────────────────────────────────────
  const handleOpenAdjust = (prodId?: number, batch?: string) => {
    if (prodId) setSelectedProductId(prodId);
    else if (products.length > 0) setSelectedProductId(products[0].id);
    setAdjustBatchNumber(batch || `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
    setAdjustQuantity('10');
    setAdjustType('ADD');
    setAdjustReason('AUDIT_RECONCILIATION');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      showToast('Please select a product');
      return;
    }
    const qtyVal = parseInt(adjustQuantity, 10);
    if (isNaN(qtyVal) || qtyVal === 0) {
      showToast('Please enter a valid non-zero adjustment quantity');
      return;
    }

    const delta = adjustType === 'ADD' ? Math.abs(qtyVal) : -Math.abs(qtyVal);

    try {
      setIsSubmittingAdjust(true);
      await inventoryApi.adjustStock({
        productId: Number(selectedProductId),
        batchNumber: adjustBatchNumber,
        adjustedQuantity: delta,
        reason: adjustReason,
        notes: adjustNotes
      });
      showToast(`Successfully adjusted stock by ${delta > 0 ? '+' : ''}${delta} units!`);
      setIsAdjustModalOpen(false);
      loadAllData();
    } catch (err: any) {
      console.error('Adjustment failed:', err);
      showToast('Adjustment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingAdjust(false);
    }
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

  // Helper to compute total units for a product based on packaging row
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

  // ─── Daily Trip Start Gate Check Open Flow ────────────────────────────────
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

    // Initialize Step 1: Existing on-truck carryover
    const initialAudit = (truck.items || []).map(item => ({
      productId: item.productId,
      actualCount: item.availableQuantity,
      damagedCount: 0
    }));
    setCarryoverAuditItems(initialAudit);

    // Initialize Step 2: Packaging-based refill rows
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

      // Sync with refillItems
      setRefillItems(oldItems => oldItems.map(item =>
        item.productId === productId ? { ...item, quantity: totalUnits } : item
      ));

      return {
        ...prev,
        [productId]: updated
      };
    });
  };

  const handleOpenTruckRefill = (truck?: TruckInventoryDTO) => {
    const targetTruck = truck || (truckInventories.length > 0 ? truckInventories[0] : null);
    setSelectedTruckForRefill(targetTruck);
    if (targetTruck?.assignedRoute) {
      setSelectedRouteForRefill(targetTruck.assignedRoute);
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

  const handleRefillQuantityChange = (productId: number, qty: number) => {
    setRefillItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity: Math.max(0, qty) } : item
    ));
  };

  const handleSaveTruckRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckForRefill) {
      showToast('Please select a truck to refill');
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

    const currentDriver = drivers.find(d => d.id === selectedDriverId) || (drivers.length > 0 ? drivers[0] : { fullName: selectedTruckForRefill.assignedDriver });
    const currentSales = salesReps.find(s => s.id === selectedSalesRepId) || (salesReps.length > 0 ? salesReps[0] : { fullName: 'Sales Representative' });

    try {
      setIsSubmittingRefill(true);
      await inventoryApi.refillTruck({
        vehicleId: selectedTruckForRefill.vehicleId,
        vehicleNumber: selectedTruckForRefill.vehicleNumber,
        driverName: currentDriver.fullName || (currentDriver as any).name || selectedTruckForRefill.assignedDriver,
        notes: refillNotes || `Crew: ${currentDriver.fullName} (Driver) & ${currentSales.fullName} (Sales) • Route: ${selectedRouteForRefill} • Date: ${dispatchDate}`,
        items: itemsToRefill
      });

      const totalRefilled = itemsToRefill.reduce((acc, curr) => acc + curr.quantityToRefill, 0);
      showToast(`⚡ Refilled ${totalRefilled} loaves! Crew: ${currentDriver.fullName} & ${currentSales.fullName} on ${selectedTruckForRefill.vehicleNumber}`);
      setIsRefillModalOpen(false);
      loadAllData();
    } catch (err: any) {
      console.error('Refill failed:', err);
      showToast('Truck refill failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingRefill(false);
    }
  };

  // ─── Truck Daily Physical Audit Flow ─────────────────────────────────────

  const handleOpenTruckAudit = (truck: TruckInventoryDTO) => {
    setSelectedTruckForAudit(truck);
    const initialAudit = (truck.items || []).map(item => ({
      productId: item.productId,
      actualCount: item.availableQuantity,
      damagedCount: 0
    }));
    setAuditItems(initialAudit);
    setAuditNotes('');
    setIsAuditModalOpen(true);
  };

  const handleAuditCountChange = (productId: number, field: 'actualCount' | 'damagedCount', val: number) => {
    setAuditItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, [field]: Math.max(0, val) } : item
    ));
  };

  const handleSaveTruckAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTruckForAudit) return;

    try {
      setIsSubmittingAudit(true);
      await inventoryApi.auditTruckStock({
        vehicleId: selectedTruckForAudit.vehicleId,
        tripId: selectedTruckForAudit.tripId,
        notes: auditNotes,
        items: auditItems.map(i => ({
          productId: i.productId,
          actualPhysicalCount: i.actualCount,
          damagedCount: i.damagedCount
        }))
      });

      showToast(`🔍 Daily stock count verified for truck ${selectedTruckForAudit.vehicleNumber}!`);
      setIsAuditModalOpen(false);
      loadAllData();
    } catch (err: any) {
      console.error('Audit failed:', err);
      showToast('Truck audit failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  // Filtered Finished Goods
  const filteredFinishedGoods = useMemo(() => {
    return finishedGoods.filter(item => {
      const matchesSearch = !searchQuery ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [finishedGoods, searchQuery, categoryFilter]);

  // Filtered Trucks
  const filteredTrucks = useMemo(() => {
    return truckInventories.filter(truck => {
      return !searchQuery ||
        truck.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.assignedDriver.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.tripNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.model.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [truckInventories, searchQuery]);

  // Filtered Ledger
  const filteredLedger = useMemo(() => {
    return stockLedger.filter(item => {
      const matchesSearch = !searchQuery ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.referenceNumber && item.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.batchNumber && item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = ledgerTypeFilter === 'ALL' || item.movementType === ledgerTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [stockLedger, searchQuery, ledgerTypeFilter]);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);

  // Refill Summary Calculation
  const refillSummary = useMemo(() => {
    let totalLoaves = 0;
    let estimatedWeightKg = 0;

    refillItems.forEach(item => {
      if (item.quantity > 0) {
        totalLoaves += item.quantity;
        const prod = products.find(p => p.id === item.productId);
        const weightGrams = prod?.weightGrams || 400;
        estimatedWeightKg += (weightGrams * item.quantity) / 1000;
      }
    });

    const currentWeight = selectedTruckForRefill?.totalWeightKg || 0;
    const newTotalWeight = currentWeight + estimatedWeightKg;
    const capacityKg = selectedTruckForRefill?.capacityKg || 1500;
    const newCapacityPct = capacityKg > 0 ? (newTotalWeight * 100) / capacityKg : 0;

    return {
      totalLoaves,
      estimatedWeightKg: Math.round(estimatedWeightKg * 10) / 10,
      newTotalWeight: Math.round(newTotalWeight * 10) / 10,
      newCapacityPct: Math.round(newCapacityPct * 10) / 10
    };
  }, [refillItems, selectedTruckForRefill, products]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── Top Header & Global Actions ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Enterprise Inventory & Fleet Truck Hub
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Boxes className="w-3 h-3 text-blue-500" />
              Live Synced
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Maintain and check daily inventory on every truck, refill from central warehouse, and track live bread stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Inventory Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenTruckRefill()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Zap className="w-4 h-4" /> Daily Truck Refill
          </button>

          <button
            onClick={() => handleOpenAdjust()}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" /> Warehouse Audit
          </button>
        </div>
      </div>

      {/* ─── Metric KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Finished Goods KPI */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Plant Finished Goods (FGI)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              {(dashboardData?.totalFinishedGoodsUnits || 0).toLocaleString()} Loaves
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">
              Valuation: ₹{(dashboardData?.totalFinishedGoodsValue || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Transit Fleet Van Stock KPI */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Trucks Transit Stock</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">
              {truckInventories.length} Trucks
            </div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">
              {dashboardData?.totalTransitFleetUnits || 0} loaves (₹{(dashboardData?.totalTransitFleetValue || 0).toLocaleString()})
            </div>
          </div>
        </div>

        {/* Raw Materials Reserve */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Raw Materials Reserve</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              {dashboardData?.totalRawMaterialCount || 0} Materials
            </div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">
              Reserve: ₹{(dashboardData?.totalRawMaterialValue || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Quality & Near Expiry Alert KPI */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Near-Expiry Watchdog</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">
              {dashboardData?.nearExpiryBatchCount || 0} Batches
            </div>
            <div className="text-[11px] text-rose-500 font-semibold pt-0.5">
              {dashboardData?.lowStockProductCount || 0} Low Stock SKUs
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Tabs Navigation ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0F2F5] dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'OVERVIEW', label: 'Command Overview', icon: TrendingUp },
            { key: 'TRANSIT_FLEET', label: 'Truck Inventory & Daily Refill', icon: Truck, count: truckInventories.length },
            { key: 'FINISHED_GOODS', label: 'Plant Finished Goods (FGI)', icon: Package, count: finishedGoods.length },
            { key: 'STOCK_LEDGER', label: 'Stock Movement Ledger', icon: History, count: stockLedger.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${isActive
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-[#F0F2F5] dark:border-slate-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Search Bar & Dedicated Module Shortcut */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, batches..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <Link
            to="/truck-inventory"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-bold transition shrink-0 whitespace-nowrap"
            title="Open Dedicated Truck Inventory & Gate Check Module"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Truck Hub ➔</span>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. OVERVIEW TAB                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Near Expiry Urgent Watchlist */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Expiring Finished Goods Alert (Within 48 Hours)
                    </h3>
                    <p className="text-[11px] text-slate-400">Refill and load these batches onto trucks first for morning delivery</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('FINISHED_GOODS')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All Batches <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {(!dashboardData?.nearExpiryItems || dashboardData.nearExpiryItems.length === 0) ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">All Batches Fresh & Within Safe Shelf Life</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No finished goods batches expiring in the next 48 hours.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                  {dashboardData.nearExpiryItems.map(item => (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                          {item.category?.slice(0, 2).toUpperCase() || 'FG'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                              {item.productName}
                            </h4>
                            <span className="px-2 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {item.batchNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Warehouse: {item.warehouseName} • Available: <strong className="text-slate-800 dark:text-white">{item.quantityAvailable} units</strong>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${item.daysUntilExpiry <= 0
                            ? 'bg-rose-500 text-white'
                            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                          }`}>
                          <Clock className="w-3.5 h-3.5" />
                          {item.daysUntilExpiry <= 0 ? 'Expires Today!' : `${item.daysUntilExpiry}d Remaining`}
                        </span>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          Valuation: ₹{(item.totalValue || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Fleet Truck Status Widget */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Fleet Trucks Overview
                    </h3>
                    <p className="text-[11px] text-slate-400">{truckInventories.length} delivery vehicles</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('TRANSIT_FLEET')}
                  className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Manage Trucks <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {truckInventories.slice(0, 4).map(t => (
                  <div key={t.vehicleId} className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono font-black text-slate-900 dark:text-white">{t.vehicleNumber}</p>
                        <span className="text-[10px] font-bold text-slate-400">({t.assignedDriver})</span>
                      </div>
                      <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                        {t.totalAvailableUnits} loaves on board • {t.totalWeightKg} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenTruckRefill(t)}
                        className="p-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-purple-700 transition"
                        title="Refill Truck"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenTruckAudit(t)}
                        className="p-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition"
                        title="Check Physical Stock"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. TRUCK INVENTORY & DAILY REFILL TAB                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'TRANSIT_FLEET' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Daily Fleet Truck Inventory & Loading Station
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  📦 Packaging & Route Associated
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Check physical stock remaining on each truck, perform morning counts, and manually load packaging units (boxes, bundles, loose) for assigned routes and dispatch groups.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => handleOpenTruckRefill()}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <Zap className="w-4 h-4" />
                Refill Delivery Truck
              </button>
            </div>
          </div>

          {/* Truck Cards Grid */}
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

                      {/* Associated Route & Dispatch Group Badge */}
                      <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
                        <span className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-[11px] flex items-center gap-1">
                          🗺️ {truck.assignedRoute || 'Route 1 - Gandhipuram Central'}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                          ⏰ Morning Batch 1 (05:30 AM)
                        </span>
                      </div>

                      {/* Payload Capacity Utilization Bar */}
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
                            className={`h-full rounded-full transition-all duration-500 ${isOverloaded ? 'bg-rose-500' : isNearCapacity ? 'bg-amber-500' : 'bg-purple-600'
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
                        <span className="text-[11px] font-mono text-slate-400">
                          Trip: {truck.tripNumber}
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
                        title="Run daily opening audit, packaging refill, and issue trip gate pass"
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
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. PLANT FINISHED GOODS INVENTORY TAB                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'FINISHED_GOODS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F2F5] dark:border-slate-700 bg-[#F8F9FA] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Product SKU</th>
                    <th className="py-3.5 px-4">Batch Number</th>
                    <th className="py-3.5 px-4 text-center">Available Units</th>
                    <th className="py-3.5 px-4 text-center">Wholesale Price</th>
                    <th className="py-3.5 px-4 text-right">Total Valuation</th>
                    <th className="py-3.5 px-4">Mfg / Expiry</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
                  {filteredFinishedGoods.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No finished goods inventory records found.
                      </td>
                    </tr>
                  ) : (
                    filteredFinishedGoods.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition">
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900 dark:text-white">{item.productName}</p>
                          <p className="font-mono text-[10px] text-slate-400">{item.productCode} • {item.category}</p>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.batchNumber}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-white">
                          {item.quantityAvailable.toLocaleString()} loaves
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          ₹{item.wholesalePrice}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{item.totalValuation.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          <div>Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '5 Days'}</div>
                          {item.isExpiringSoon && (
                            <span className="text-[10px] text-rose-600 font-bold">⚠️ Critical Expiry</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleOpenAdjust(item.productId, item.batchNumber)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 rounded-lg transition"
                            title="Audit / Correct Stock"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. STOCK MOVEMENT LEDGER TAB                                            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'STOCK_LEDGER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Movement Type:</span>
              {['ALL', 'PRODUCTION', 'TRIP_LOAD', 'SALE', 'RETURN_EXPIRED', 'RETURN_DAMAGED', 'ADJUSTMENT'].map(type => (
                <button
                  key={type}
                  onClick={() => setLedgerTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${ledgerTypeFilter === type ? 'bg-[#1C1C1C] text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredLedger.length} ledger entries
            </span>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F2F5] dark:border-slate-700 bg-[#F8F9FA] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Movement Type</th>
                    <th className="py-3.5 px-4 text-center">Quantity Delta</th>
                    <th className="py-3.5 px-4">Batch / Reference</th>
                    <th className="py-3.5 px-4">Destination / Shop / Vehicle</th>
                    <th className="py-3.5 px-4">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No stock movement ledger records found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map(item => {
                      const isPositive = item.movementType === 'PRODUCTION' || item.quantity > 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                          </td>
                          <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                            {item.productName}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${item.movementType === 'PRODUCTION'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : item.movementType === 'SALE'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                  : item.movementType === 'TRIP_LOAD'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                    : item.movementType?.includes('RETURN')
                                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                      : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                              }`}>
                              {item.movementType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                              {item.quantity > 0 ? `+${item.quantity}` : item.quantity} units
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {item.referenceNumber || item.batchNumber || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {item.shopName || item.tripNumber || item.warehouseName || 'Plant'}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400 truncate max-w-xs">
                            {item.notes || 'Automated transaction'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 5. MANUAL PACKAGING-BASED TRUCK REFILL & DISPATCH CREW MODAL            */}
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
              {/* 1. Dispatch Crew Selection (Vehicle, Driver, Sales Rep) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  1. Dispatch Crew Selection (Mobile App Linked)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Select Vehicle */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Delivery Vehicle / Truck *
                    </label>
                    <CustomSelect
                      value={selectedTruckForRefill ? String(selectedTruckForRefill.vehicleId) : ''}
                      onChange={val => {
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

                  {/* Select Driver */}
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

                  {/* Select Sales Representative */}
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

              {/* 2. Route and Dispatch Day (Date - not shift) */}
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

                        {/* Inputs for Boxes, Bundles, Covers, Tins, Loose */}
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
      {/* 6. DAILY TRIP START GATE CHECK & VEHICLE AUDIT STATION MODAL            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isTripStartModalOpen && selectedTruckForTripStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
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

            {/* Step Progress Pills */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTripStartStep(1)}
                className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${tripStartStep === 1
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <span>1. Check Existing Carryover</span>
              </button>

              <button
                type="button"
                onClick={() => setTripStartStep(2)}
                className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${tripStartStep === 2
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <span>2. Manual Packaging Refill</span>
              </button>

              <button
                type="button"
                onClick={() => setTripStartStep(3)}
                className={`flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 ${tripStartStep === 3
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                <span>3. Gate Pass & Sign-Off</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* STEP 1: AUDIT EXISTING ON-TRUCK CARRYOVER */}
              {tripStartStep === 1 && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                    <p className="font-extrabold text-amber-900 dark:text-amber-300">
                      Step 1: Inspect & Verify Physical Carryover Stock on Van
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                      Verify the loaves remaining in the vehicle from previous delivery trips. Record any damaged items to reconcile variances.
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
                              <span className={`text-xs font-mono font-bold ${variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-emerald-600' : 'text-rose-600'
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

              {/* STEP 2: MANUAL PACKAGING REFILL & ALLOCATION */}
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

              {/* STEP 3: TRIP DEPARTURE GATE PASS & MANIFEST SIGN-OFF */}
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

                          // 1. Save opening audit check
                          await inventoryApi.auditTruckStock({
                            vehicleId: selectedTruckForTripStart.vehicleId,
                            notes: `Opening daily trip audit: Gate Pass ${tripStartGatePassId} (Route: ${selectedRouteForRefill} • Date: ${dispatchDate} • Driver: ${activeDriver.fullName} • Sales: ${activeSales.fullName})`,
                            items: carryoverAuditItems.map(i => ({
                              productId: i.productId,
                              actualPhysicalCount: i.actualCount,
                              damagedCount: i.damagedCount
                            }))
                          });

                          // 2. Save packaging refill if any
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
                          loadAllData();
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
      {/* 7. TRUCK DAILY AUDIT / PHYSICAL CHECK MODAL                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAuditModalOpen && selectedTruckForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Daily Physical Stock Count Check
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Truck: {selectedTruckForAudit.vehicleNumber} • Driver: {selectedTruckForAudit.assignedDriver}
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
              <p className="text-xs text-slate-500">
                Count the actual physical loaves remaining in the van. Any variance or damaged items will be automatically recorded in the Stock Movement Ledger.
              </p>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                {auditItems.map(item => {
                  const prod = products.find(p => p.id === item.productId);
                  const originalItem = selectedTruckForAudit.items?.find(i => i.productId === item.productId);
                  const expected = originalItem ? originalItem.availableQuantity : 0;
                  const variance = item.actualCount - expected;

                  return (
                    <div key={item.productId} className="p-3.5 bg-white dark:bg-slate-800 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {prod ? prod.name : `Product #${item.productId}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          System Expected: <strong className="text-slate-700 dark:text-slate-300">{expected} loaves</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5 text-center font-bold">Physical Count</label>
                          <input
                            type="number"
                            min="0"
                            value={item.actualCount}
                            onChange={e => handleAuditCountChange(item.productId, 'actualCount', parseInt(e.target.value, 10) || 0)}
                            className="w-20 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-1 font-mono font-bold text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-rose-500 mb-0.5 text-center font-bold">Damaged</label>
                          <input
                            type="number"
                            min="0"
                            value={item.damagedCount}
                            onChange={e => handleAuditCountChange(item.productId, 'damagedCount', parseInt(e.target.value, 10) || 0)}
                            className="w-16 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl py-1 font-mono font-bold text-xs text-rose-600"
                          />
                        </div>

                        <div className="text-right w-16">
                          <span className="block text-[10px] text-slate-400 mb-0.5 font-bold">Variance</span>
                          <span className={`text-xs font-mono font-bold ${variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-emerald-600' : 'text-rose-600'
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
                  Daily Check Audit Notes
                </label>
                <input
                  type="text"
                  value={auditNotes}
                  onChange={e => setAuditNotes(e.target.value)}
                  placeholder="e.g. Verified by Gate Supervisor during morning shift"
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition flex items-center gap-1.5"
                >
                  {isSubmittingAudit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Stock Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 8. WAREHOUSE STOCK AUDIT & RECONCILIATION MODAL                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Warehouse Stock Audit & Reconciliation
                  </h3>
                  <p className="text-[11px] text-slate-400">Perform manual stock corrections with audit logging</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Product *
                </label>
                <CustomSelect
                  value={String(selectedProductId)}
                  onChange={val => setSelectedProductId(Number(val))}
                  options={products.map(p => ({
                    value: String(p.id),
                    label: `${p.name} (${p.productCode})`,
                    badge: p.category || 'BREAD'
                  }))}
                  placeholder="Select Product"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Batch Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={adjustBatchNumber}
                    onChange={e => setAdjustBatchNumber(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    placeholder="BATCH-20260815"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adjustment Type *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F8F9FA] dark:bg-slate-800 rounded-xl border border-[#E9ECEF] dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setAdjustType('ADD')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${adjustType === 'ADD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> + Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('DEDUCT')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${adjustType === 'DEDUCT' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500'
                        }`}
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> - Deduct
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (Units) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustQuantity}
                    onChange={e => setAdjustQuantity(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Reason Code *
                  </label>
                  <CustomSelect
                    value={adjustReason}
                    onChange={val => setAdjustReason(val)}
                    options={[
                      { value: 'AUDIT_RECONCILIATION', label: 'Physical Count Audit', badge: 'COUNT' },
                      { value: 'DAMAGED_IN_STORAGE', label: 'Damaged in Storage', badge: 'LOSS' },
                      { value: 'EXPIRED_SCRAP', label: 'Expired Quality Write-off', badge: 'EXPIRY' },
                      { value: 'SAMPLE_TASTING', label: 'Quality Sample Testing', badge: 'QC' },
                      { value: 'FOUND_STOCK', label: 'Surplus Unrecorded Stock', badge: 'GAIN' },
                    ]}
                    placeholder="Select Reason"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Notes / Internal Reference
                </label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={e => setAdjustNotes(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                  placeholder="e.g. Discrepancy observed during Sunday shift physical inventory count."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition flex items-center gap-1.5"
                >
                  {isSubmittingAdjust && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
