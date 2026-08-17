import React, { useState, useEffect, useMemo } from 'react';
import { CustomSelect } from '../components/common';
import { 
  MapPin, 
  Plus, 
  Navigation, 
  Store, 
  Clock, 
  Search, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Compass, 
  Edit3, 
  ShieldCheck, 
  Route as RouteIcon,
  RefreshCw,
  Trash2,
  Map as MapIcon,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Zap
} from 'lucide-react';
import { 
  shopApi, 
  routeApi, 
  routeOptimizationApi,
  ApiDeliveryRoute, 
  ApiShop,
  ApiRouteShop,
  RouteOptimizationPreviewResponse
} from '../services/apiService';
import { RouteMap } from '../components/RouteMap';

export interface RouteShopItem {
  shopId: number;
  shopCode: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  visitOrder: number;
  latitude?: number;
  longitude?: number;
}

export const RoutesPage: React.FC = () => {
  // Master state
  const [routes, setRoutes] = useState<ApiDeliveryRoute[]>([]);
  const [masterShops, setMasterShops] = useState<ApiShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active View Modals
  const [viewRouteModal, setViewRouteModal] = useState<ApiDeliveryRoute | null>(null);
  const [mapViewModal, setMapViewModal] = useState<ApiDeliveryRoute | null>(null);
  
  // Create / Edit Two-Panel Interface State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [routeForm, setRouteForm] = useState({
    routeCode: '',
    routeName: '',
    description: '',
    startingHub: 'Salem Distribution Hub',
    status: 'ACTIVE',
    totalDistanceKm: 0
  });
  const [editorShops, setEditorShops] = useState<RouteShopItem[]>([]);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Add Shops Selection Modal State
  const [showAddShopsModal, setShowAddShopsModal] = useState(false);
  const [shopFilterQuery, setShopFilterQuery] = useState('');
  const [selectedShopIdsToAdd, setSelectedShopIdsToAdd] = useState<number[]>([]);

  // Route Optimization Modal State
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizePreview, setOptimizePreview] = useState<RouteOptimizationPreviewResponse | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApplyingOptimization, setIsApplyingOptimization] = useState(false);

  // Load API Data from PostgreSQL
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [routesRes, shopsRes] = await Promise.all([
        routeApi.getAll().catch(() => ({ data: [] })),
        shopApi.getAll().catch(() => ({ data: [] }))
      ]);

      const fetchedRoutes = routesRes.data || [];
      const fetchedShops = shopsRes.data || [];

      setRoutes(fetchedRoutes);
      setMasterShops(fetchedShops);
    } catch (err) {
      console.error('Error fetching routes master data:', err);
      showToast('error', 'Failed to load route data from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Metric KPI summaries
  const activeRoutesCount = routes.filter(r => (r.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const totalOutletsCovered = routes.reduce((acc, r) => acc + (r.shops ? r.shops.length : (r.totalShops || 0)), 0);
  const totalDistanceAllRoutes = routes.reduce((acc, r) => acc + (r.totalDistanceKm || r.distanceKm || 0), 0);

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      const name = (r.routeName || '').toLowerCase();
      const code = (r.routeCode || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesQuery = name.includes(q) || code.includes(q) || desc.includes(q);
      const rStatus = (r.status || 'ACTIVE').toUpperCase();

      if (statusFilter === 'ALL') return matchesQuery;
      return matchesQuery && rStatus === statusFilter;
    });
  }, [routes, searchQuery, statusFilter]);

  // Open Create Route Flow
  const handleOpenCreateRoute = () => {
    setEditingRouteId(null);
    setRouteForm({
      routeCode: `RT-${Math.floor(100 + Math.random() * 900)}`,
      routeName: '',
      description: '',
      startingHub: 'Salem Distribution Hub',
      status: 'ACTIVE',
      totalDistanceKm: 0
    });
    setEditorShops([]);
    setCalculatedDistanceKm(0);
    setIsEditorOpen(true);
  };

  // Open Edit Route Flow
  const handleOpenEditRoute = async (route: ApiDeliveryRoute) => {
    setEditingRouteId(route.id);
    setRouteForm({
      routeCode: route.routeCode || '',
      routeName: route.routeName || '',
      description: route.description || '',
      startingHub: route.startingHub || 'Salem Distribution Hub',
      status: route.status || 'ACTIVE',
      totalDistanceKm: route.totalDistanceKm || route.distanceKm || 0
    });

    // Populate shops from route or match from master shops by routeName
    let shopsList: RouteShopItem[] = [];
    if (route.shops && route.shops.length > 0) {
      shopsList = route.shops.map(s => ({
        shopId: s.shopId,
        shopCode: s.shopCode,
        shopName: s.shopName,
        ownerName: s.ownerName,
        phone: s.phone,
        address: s.address,
        visitOrder: s.visitOrder,
        latitude: s.latitude,
        longitude: s.longitude
      }));
    } else {
      const matched = masterShops.filter(s => s.routeName && s.routeName.trim().toLowerCase() === route.routeName.trim().toLowerCase());
      shopsList = matched.map((s, idx) => ({
        shopId: s.id,
        shopCode: s.shopCode,
        shopName: s.name,
        ownerName: s.ownerName,
        phone: s.phone,
        address: s.address,
        visitOrder: idx + 1,
        latitude: s.latitude ? Number(s.latitude) : undefined,
        longitude: s.longitude ? Number(s.longitude) : undefined
      }));
    }

    setEditorShops(shopsList);
    setCalculatedDistanceKm(route.totalDistanceKm || route.distanceKm || 0);
    setIsEditorOpen(true);
  };

  // Open Map Modal with complete route & shop details
  const handleOpenMapModal = async (route: ApiDeliveryRoute) => {
    setMapViewModal(route);
    try {
      const res = await routeApi.getById(route.id);
      if (res.data) {
        setMapViewModal(res.data);
      }
    } catch (err) {
      console.error('Failed to load full route map details:', err);
    }
  };

  // Delete Route
  const handleDeleteRoute = async (id: number, routeName: string) => {
    if (!window.confirm(`Are you sure you want to delete delivery route "${routeName}"?`)) return;
    try {
      await routeApi.delete(id);
      showToast('success', `Route "${routeName}" deleted successfully.`);
      await loadData();
    } catch (err) {
      console.error('Failed to delete route:', err);
      showToast('error', 'Failed to delete route. Please try again.');
    }
  };

  // Reorder Shops (Move Up / Down)
  const handleMoveShopOrder = (index: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === editorShops.length - 1)) {
      return;
    }
    const updated = [...editorShops];
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const resequenced = updated.map((s, idx) => ({ ...s, visitOrder: idx + 1 }));
    setEditorShops(resequenced);
  };

  // Remove shop from current route in editor
  const handleRemoveShopFromEditor = (shopId: number) => {
    const updated = editorShops
      .filter(s => s.shopId !== shopId)
      .map((s, idx) => ({ ...s, visitOrder: idx + 1 }));
    setEditorShops(updated);
  };

  // Open Add Shops modal
  const handleOpenAddShops = () => {
    setSelectedShopIdsToAdd([]);
    setShopFilterQuery('');
    setShowAddShopsModal(true);
  };

  // Toggle selection in Add Shops modal
  const handleToggleShopToAdd = (shopId: number) => {
    setSelectedShopIdsToAdd(prev => 
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  // Confirm Add Selected Shops
  const handleConfirmAddShops = () => {
    const existingShopIds = new Set(editorShops.map(s => s.shopId));
    const shopsToAdd: RouteShopItem[] = [];

    let currentOrder = editorShops.length + 1;
    selectedShopIdsToAdd.forEach(sId => {
      if (!existingShopIds.has(sId)) {
        const found = masterShops.find(s => s.id === sId);
        if (found) {
          shopsToAdd.push({
            shopId: found.id,
            shopCode: found.shopCode,
            shopName: found.name,
            ownerName: found.ownerName,
            phone: found.phone,
            address: found.address,
            visitOrder: currentOrder++,
            latitude: found.latitude ? Number(found.latitude) : undefined,
            longitude: found.longitude ? Number(found.longitude) : undefined
          });
        }
      }
    });

    setEditorShops(prev => [...prev, ...shopsToAdd]);
    setShowAddShopsModal(false);
    showToast('success', `Added ${shopsToAdd.length} shops to the route.`);
  };

  // Save Route (Create or Update)
  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.routeName.trim()) {
      showToast('error', 'Please enter a valid Route / Area Name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        routeCode: routeForm.routeCode.trim() || `RT-${Math.floor(100 + Math.random() * 900)}`,
        routeName: routeForm.routeName.trim(),
        description: routeForm.description.trim(),
        startingHub: routeForm.startingHub.trim(),
        status: routeForm.status,
        totalShops: editorShops.length,
        totalDistanceKm: calculatedDistanceKm,
        distanceKm: calculatedDistanceKm,
        shopIds: editorShops.map(s => s.shopId)
      };

      if (editingRouteId) {
        await routeApi.update(editingRouteId, payload);
        showToast('success', `Route "${payload.routeName}" updated successfully!`);
      } else {
        await routeApi.create(payload);
        showToast('success', `Route "${payload.routeName}" created successfully!`);
      }

      await loadData();
      setIsEditorOpen(false);
    } catch (err: any) {
      console.error('Failed to save route:', err);
      showToast('error', err.response?.data?.message || 'Failed to save route to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered shops in Add Shops modal
  const availableShopsToAdd = useMemo(() => {
    const existingIds = new Set(editorShops.map(s => s.shopId));
    return masterShops.filter(s => {
      const isAlreadyInRoute = existingIds.has(s.id);
      const nameMatch = (s.name || '').toLowerCase().includes(shopFilterQuery.toLowerCase());
      const codeMatch = (s.shopCode || '').toLowerCase().includes(shopFilterQuery.toLowerCase());
      const addrMatch = (s.address || '').toLowerCase().includes(shopFilterQuery.toLowerCase());
      return !isAlreadyInRoute && (nameMatch || codeMatch || addrMatch);
    });
  }, [masterShops, editorShops, shopFilterQuery]);

  // ─── Smart Route Optimization ─────────────────────────────────────────────

  const handlePreviewOptimize = async () => {
    if (!editingRouteId || editorShops.length < 2) {
      showToast('error', 'Need at least 2 shops to optimize a route. Save the route first.');
      return;
    }
    setIsOptimizing(true);
    try {
      const res = await routeOptimizationApi.previewOptimization(editingRouteId, {
        shopIds: editorShops.map(s => s.shopId),
      });
      setOptimizePreview(res.data);
      setShowOptimizeModal(true);
    } catch (err: any) {
      console.error('Optimization preview error:', err);
      showToast('error', 'Failed to generate route optimization preview.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimizedOrder = async () => {
    if (!editingRouteId || !optimizePreview) return;

    setIsApplyingOptimization(true);
    try {
      const optimizedShopIds = optimizePreview.suggestedOrder.map(s => s.shopId);
      await routeOptimizationApi.applyOptimization(editingRouteId, optimizedShopIds);

      // Update local editor shops to new optimized order
      const reorderedShops: RouteShopItem[] = optimizePreview.suggestedOrder.map((ws, idx) => ({
        shopId: ws.shopId,
        shopCode: ws.shopCode,
        shopName: ws.shopName,
        ownerName: ws.ownerName,
        phone: ws.phone,
        address: ws.address,
        visitOrder: idx + 1,
        latitude: ws.latitude,
        longitude: ws.longitude,
      }));

      setEditorShops(reorderedShops);
      setCalculatedDistanceKm(optimizePreview.optimizedDistanceKm);
      setShowOptimizeModal(false);
      setOptimizePreview(null);
      showToast('success', `Route optimized! Saved ${optimizePreview.distanceSavedKm} KM (${optimizePreview.percentageSaved}% reduction).`);
      await loadData();
    } catch (err: any) {
      console.error('Apply optimization error:', err);
      showToast('error', 'Failed to apply optimized route order.');
    } finally {
      setIsApplyingOptimization(false);
    }
  };

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`p-4 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-2xl animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 right-6 z-[999999] max-w-md border ${
          toastMsg.type === 'success' 
            ? 'bg-slate-900 text-emerald-400 border-emerald-500/50 shadow-emerald-950/40' 
            : 'bg-slate-900 text-rose-400 border-rose-500/50 shadow-rose-950/40'
        }`}>
          <div className="flex items-center gap-2.5">
            {toastMsg.type === 'success' ? <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span className="leading-snug">{toastMsg.text}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="hover:opacity-75 cursor-pointer ml-3 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Delivery Routes & Map Optimization
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              {activeRoutesCount} Active Routes
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Design distribution routes, sequence delivery stops, calculate road distances, and optimize travel paths with interactive OpenStreetMap.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadData}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Routes Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreateRoute}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Create New Route
          </button>
        </div>
      </div>

      {/* Metric Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Routes */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Active Delivery Routes</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Compass className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{isLoading ? '...' : activeRoutesCount} Routes</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">Distribution Corridors</div>
          </div>
        </div>

        {/* Shops Covered */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Shops Covered</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Store className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">{isLoading ? '...' : totalOutletsCovered} Shops</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Sequenced Customer Outlets</div>
          </div>
        </div>

        {/* Network Distance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Network Distance</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Navigation className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">{isLoading ? '...' : totalDistanceAllRoutes.toFixed(1)} KM</div>
            <div className="text-[11px] text-indigo-600 font-semibold pt-0.5">Calculated Road Coverage</div>
          </div>
        </div>

        {/* Free OpenStreetMap */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Map & Optimization</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">OSRM Routing</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Free Real-Time Optimization</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by route name, area/region, or route code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <div className="w-48 shrink-0">
            <CustomSelect 
              value={statusFilter} 
              onChange={val => setStatusFilter(val as any)}
              options={[
                { value: 'ALL', label: `All Routes (${routes.length})` },
                { value: 'ACTIVE', label: 'Active Routes', badge: 'ACTIVE' },
                { value: 'INACTIVE', label: 'Inactive Routes', badge: 'OFF' },
              ]}
              placeholder="Status Filter"
            />
          </div>
        </div>
      </div>

      {/* 1. Route List Page (Clean Table & Card Layout) */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 text-center text-xs font-bold text-[#8C8C8C] dark:text-slate-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading delivery routes from database...</span>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <RouteIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#1C1C1C] dark:text-white">No Delivery Routes Found</h3>
            <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-md mx-auto mt-1">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No routes matched your search criteria. Try clearing your filter.'
                : 'Create your first delivery route by specifying an Area/Route Name, then add shops and visualize on OpenStreetMap.'}
            </p>
          </div>
          {!searchQuery && statusFilter === 'ALL' && (
            <button
              onClick={handleOpenCreateRoute}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Create New Route
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Route Name / Area</th>
                  <th className="py-3.5 px-4 font-bold text-center">Shops</th>
                  <th className="py-3.5 px-4 font-bold text-right">Total Distance</th>
                  <th className="py-3.5 px-4 font-bold">Starting Hub</th>
                  <th className="py-3.5 px-4 font-bold text-center">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60 font-medium">
                {filteredRoutes.map((route) => {
                  const shopCount = route.shops ? route.shops.length : (route.totalShops || 0);
                  const distance = route.totalDistanceKm || route.distanceKm || 0;
                  const isActive = (route.status || 'ACTIVE').toUpperCase() === 'ACTIVE';

                  return (
                    <tr 
                      key={route.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-600">
                            {route.routeCode}
                          </span>
                          <div>
                            <div className="font-extrabold text-sm text-[#1C1C1C] dark:text-white">
                              {route.routeName}
                            </div>
                            {route.description && (
                              <div className="text-[11px] text-[#8C8C8C] dark:text-slate-400 line-clamp-1">
                                {route.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold text-xs border border-emerald-200 dark:border-emerald-500/30">
                          <Store className="w-3 h-3" />
                          {shopCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          {distance.toFixed(1)} KM
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[#8C8C8C] dark:text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{route.startingHub || 'Salem Plant Hub'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewRouteModal(route)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition font-bold text-xs flex items-center gap-1 cursor-pointer"
                            title="View Route Details"
                          >
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleOpenMapModal(route)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition font-bold text-xs flex items-center gap-1 cursor-pointer border border-blue-200 dark:border-blue-500/30"
                            title="View Route Map"
                          >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>Map</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditRoute(route)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition cursor-pointer"
                            title="Edit Route"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id, route.routeName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700 rounded-lg transition cursor-pointer"
                            title="Delete Route"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2 & 9 & 15. Create / Edit Route Two-Panel Modal Screen */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-6xl w-full p-6 space-y-5 border border-[#F0F2F5] dark:border-slate-800 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F5] dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <RouteIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1C1C1C] dark:text-white">
                    {editingRouteId ? `Edit Route: ${routeForm.routeName || 'Delivery Route'}` : 'Create Delivery Route'}
                  </h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">
                    Define the route area, add shops, sequence stops, and preview the road path on OpenStreetMap.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Two-Panel Body */}
            <form onSubmit={handleSaveRoute} className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
              {/* Left Panel (40% width): Form & Ordered Shop Sequence */}
              <div className="lg:w-5/12 flex flex-col overflow-hidden space-y-4 pr-1">
                <div className="space-y-3 overflow-y-auto pr-2 max-h-[calc(92vh-180px)]">
                  {/* Route Information Box */}
                  <div className="p-4 bg-[#F7F9FB] dark:bg-slate-800/50 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 space-y-3">
                    <h4 className="text-xs font-bold text-[#1C1C1C] dark:text-white flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span>Route Information</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Route / Area Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Salem North, Erode Main"
                          value={routeForm.routeName}
                          onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 text-[#1C1C1C] dark:text-white px-3 py-2 rounded-xl text-xs focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Status
                        </label>
                        <CustomSelect
                          value={routeForm.status}
                          onChange={val => setRouteForm({ ...routeForm, status: val })}
                          options={[
                            { value: 'ACTIVE', label: 'Active', badge: 'ACTIVE' },
                            { value: 'INACTIVE', label: 'Inactive', badge: 'OFF' },
                          ]}
                          placeholder="Select Status"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Daily morning delivery covering Salem North area"
                        value={routeForm.description}
                        onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1C1C1C] dark:text-white p-2 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Route Code
                        </label>
                        <input
                          type="text"
                          value={routeForm.routeCode}
                          onChange={(e) => setRouteForm({ ...routeForm, routeCode: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1C1C1C] dark:text-white p-2 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Starting Hub
                        </label>
                        <input
                          type="text"
                          value={routeForm.startingHub}
                          onChange={(e) => setRouteForm({ ...routeForm, startingHub: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#1C1C1C] dark:text-white p-2 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Selected Shops & Ordering Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          Selected Shops ({editorShops.length})
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Reorder shops to arrange visit sequence and calculate road distance.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingRouteId && editorShops.length >= 2 && (
                          <button
                            type="button"
                            onClick={handlePreviewOptimize}
                            disabled={isOptimizing}
                            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl text-xs transition-all transform active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50"
                          >
                            {isOptimizing ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            ) : (
                              <Zap className="w-4 h-4 fill-white text-white" />
                            )}
                            <span>{isOptimizing ? 'Optimizing Route...' : 'Optimize Route'}</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleOpenAddShops}
                          className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-400 font-extrabold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50"
                        >
                          <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Add Shops
                        </button>
                      </div>
                    </div>

                    {editorShops.length === 0 ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                        <Store className="w-6 h-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No shops added yet</p>
                        <p className="text-[11px] text-slate-400">
                          Click <strong>"Add Shops"</strong> to select shops for this route.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {editorShops.map((shop, idx) => (
                          <div 
                            key={shop.shopId}
                            className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-slate-800 text-indigo-700 dark:text-cyan-400 text-xs font-extrabold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-[#1C1C1C] dark:text-white truncate">
                                  {shop.shopName}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                                  {shop.shopCode && <span className="font-mono">{shop.shopCode} • </span>}
                                  <span>{shop.address || 'Salem'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Up / Down & Remove Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveShopOrder(idx, 'UP')}
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Move Up in Sequence"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === editorShops.length - 1}
                                onClick={() => handleMoveShopOrder(idx, 'DOWN')}
                                className="p-1 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                title="Move Down in Sequence"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveShopFromEditor(shop.shopId)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer ml-1"
                                title="Remove Shop"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Distance & Shops Summary Footer Box */}
                <div className="p-3.5 bg-indigo-50 dark:bg-slate-800/80 rounded-2xl border border-indigo-100 dark:border-slate-700 flex items-center justify-between text-xs mt-auto shrink-0">
                  <div>
                    <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase">Total Stops</div>
                    <div className="text-base font-black text-indigo-950 dark:text-white">
                      {editorShops.length} Shops
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase">Total Travel Distance</div>
                    <div className="text-base font-black text-indigo-600 dark:text-cyan-400 font-mono">
                      {calculatedDistanceKm.toFixed(1)} KM
                    </div>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingRouteId ? 'Save Route Changes' : 'Create & Save Route'}</span>
                  </button>
                </div>
              </div>

              {/* Right Panel (60% width): Interactive Live Leaflet Map */}
              <div className="lg:w-7/12 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col relative">
                <div className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shrink-0 z-10">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      Live Route Map Preview (OpenStreetMap)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-cyan-400">
                    Road Distance: {calculatedDistanceKm.toFixed(1)} KM
                  </span>
                </div>

                <div className="flex-1 w-full min-h-[380px] relative">
                  <RouteMap 
                    shops={editorShops}
                    startingHub={routeForm.startingHub}
                    onDistanceCalculated={(dist) => setCalculatedDistanceKm(dist)}
                    className="w-full h-full min-h-[380px]"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Shops Modal Dialog */}
      {showAddShopsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-extrabold text-[#1C1C1C] dark:text-white">Add Shops to Route</h3>
                <p className="text-xs text-slate-400">Search and select shops to add into this delivery route sequence.</p>
              </div>
              <button 
                onClick={() => setShowAddShopsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shop Search Bar */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by shop name, code, or address..."
                value={shopFilterQuery}
                onChange={(e) => setShopFilterQuery(e.target.value)}
                className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs text-[#1C1C1C] dark:text-white pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Shops List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {availableShopsToAdd.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <Store className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No additional shops available</p>
                  <p>All shops are either already added or no matches found.</p>
                </div>
              ) : (
                availableShopsToAdd.map(shop => {
                  const isChecked = selectedShopIdsToAdd.includes(shop.id);
                  return (
                    <div
                      key={shop.id}
                      onClick={() => handleToggleShopToAdd(shop.id)}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked 
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                          isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-[#1C1C1C] dark:text-white">
                            {shop.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px]">{shop.shopCode}</span>
                            <span>•</span>
                            <span>{shop.ownerName}</span>
                            {shop.address && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[160px]">{shop.address}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {shop.latitude && shop.longitude && (
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono shrink-0">
                          Geo GPS
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-bold">
                Selected: {selectedShopIdsToAdd.length} shops
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddShopsModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedShopIdsToAdd.length === 0}
                  onClick={handleConfirmAddShops}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Add Selected Shops ({selectedShopIdsToAdd.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Route Preview Modal (View Action) */}
      {viewRouteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="px-2.5 py-0.5 bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-cyan-400 font-mono text-[10px] font-bold rounded">
                  {viewRouteModal.routeCode}
                </span>
                <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white mt-1">
                  {viewRouteModal.routeName}
                </h3>
              </div>
              <button 
                onClick={() => setViewRouteModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hub & Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Stops</div>
                <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {viewRouteModal.shops?.length || viewRouteModal.totalShops || 0} Shops
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Road Distance</div>
                <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5 font-mono">
                  {(viewRouteModal.totalDistanceKm || viewRouteModal.distanceKm || 0).toFixed(1)} KM
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Starting Plant Hub</div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                  {viewRouteModal.startingHub || 'Salem Plant'}
                </div>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Stop-by-Stop Shop Sequence ({viewRouteModal.shops?.length || 0} Outlets)
              </h4>

              {(!viewRouteModal.shops || viewRouteModal.shops.length === 0) ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  <Store className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p>No shops are assigned to route "<strong>{viewRouteModal.routeName}</strong>" yet.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {viewRouteModal.shops.map((shop, idx) => (
                    <div key={shop.id || idx} className="relative flex items-start justify-between group">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 bg-white dark:bg-slate-900 border-indigo-500 text-indigo-600 dark:text-indigo-400">
                        {shop.visitOrder || idx + 1}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{shop.shopCode}</span>
                          <span className="font-bold text-xs text-[#1C1C1C] dark:text-white">{shop.shopName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {shop.ownerName} {shop.phone ? `• ${shop.phone}` : ''}
                        </div>
                        {shop.address && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{shop.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions in View modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  const target = viewRouteModal;
                  setViewRouteModal(null);
                  if (target) handleOpenMapModal(target);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <MapIcon className="w-4 h-4" /> View Map
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewRouteModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = viewRouteModal;
                    setViewRouteModal(null);
                    handleOpenEditRoute(target);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" /> Edit Route
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Visual Route Map Modal (Map Action) */}
      {mapViewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-4xl w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <MapIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1C1C1C] dark:text-white">
                    {mapViewModal.routeName} – OpenStreetMap
                  </h3>
                  <p className="text-xs text-slate-400">
                    {mapViewModal.shops?.length || mapViewModal.totalShops || 0} Shops • Total Road Distance: {(mapViewModal.totalDistanceKm || mapViewModal.distanceKm || 0).toFixed(1)} KM
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setMapViewModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
              <RouteMap 
                shops={mapViewModal.shops || []}
                startingHub={mapViewModal.startingHub}
                className="w-full h-full min-h-[450px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 1. Starting Shop
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Intermediate Stops
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Final Shop
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMapViewModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Close Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Route Optimization Preview Modal ─────────────────────────────── */}
      {showOptimizeModal && optimizePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl max-h-[90vh] rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-500/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                    Smart Route Optimization Preview
                  </h2>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                    AI-powered TSP solver suggests the optimal shop visit order to minimize road travel distance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowOptimizeModal(false); setOptimizePreview(null); }}
                className="p-2 hover:bg-[#F8F9FA] dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Distance Savings KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#F8F9FA] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E9ECEF] dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider block">Current Distance</span>
                  <div className="text-xl font-extrabold text-[#1C1C1C] dark:text-white font-mono">
                    {optimizePreview.currentDistanceKm.toFixed(1)} KM
                  </div>
                </div>

                <div className="bg-[#F8F9FA] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E9ECEF] dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Optimized Distance</span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {optimizePreview.optimizedDistanceKm.toFixed(1)} KM
                  </div>
                </div>

                <div className="bg-[#F8F9FA] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E9ECEF] dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Distance Saved</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {optimizePreview.distanceSavedKm.toFixed(1)} KM
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-extrabold border border-amber-500/20">
                      ↓ {optimizePreview.percentageSaved.toFixed(1)}% LESS
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested Order Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" /> Suggested Optimized Visit Order
                </h4>
                <div className="bg-[#F7F9FB] dark:bg-slate-900/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F0F2F5] dark:bg-slate-800/80 text-[#8C8C8C] dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4 w-12">#</th>
                        <th className="py-2.5 px-4">Shop Name</th>
                        <th className="py-2.5 px-4">Address / Location</th>
                        <th className="py-2.5 px-4 text-right">Coordinates (Lat / Lng)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9ECEF] dark:divide-slate-700/60">
                      {optimizePreview.suggestedOrder.map((shop, idx) => (
                        <tr key={shop.shopId} className="hover:bg-white dark:hover:bg-slate-800/60 transition">
                          <td className="py-2.5 px-4">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-white font-extrabold text-[10px] ${
                              idx === 0 ? 'bg-emerald-600' :
                              idx === optimizePreview.suggestedOrder.length - 1 ? 'bg-amber-600' :
                              'bg-blue-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-extrabold text-[#1C1C1C] dark:text-white">{shop.shopName}</span>
                            {shop.shopCode && <span className="block text-[10px] text-[#8C8C8C] font-mono">{shop.shopCode}</span>}
                          </td>
                          <td className="py-2.5 px-4 text-[#8C8C8C] dark:text-slate-400 text-xs max-w-[220px] truncate">
                            {shop.address || shop.areaName || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-[10px] text-[#8C8C8C] dark:text-slate-400">
                            {shop.latitude?.toFixed(4)}, {shop.longitude?.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="px-6 py-4 border-t border-[#F0F2F5] dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between shrink-0">
              <p className="text-[11px] font-semibold text-[#8C8C8C] dark:text-slate-400 max-w-sm">
                Applying will reorder shop stops and save the optimized visit sequence to database.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowOptimizeModal(false); setOptimizePreview(null); }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-[#1C1C1C] dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyOptimizedOrder}
                  disabled={isApplyingOptimization}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl text-xs transition-all transform active:scale-95 cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isApplyingOptimization ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Check className="w-4 h-4 text-white" />
                  )}
                  <span>{isApplyingOptimization ? 'Applying...' : 'Apply Optimized Order'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
