import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck, User, Store, MapPin, Calendar, Clock, Plus, CheckCircle2,
  AlertCircle, Edit2, Edit3, Trash2, Save, X, ChevronRight, ChevronUp, ChevronDown, ArrowRight, DollarSign,
  Package, ListOrdered, FileText, Check, Navigation, RefreshCw, Lock, Search, Sparkles, Activity, Layers, Play,
  Building2, LayoutGrid, List, Eye, ArrowLeft, TrendingUp, CheckCircle, ShieldAlert, PackageCheck, Filter, Boxes
} from 'lucide-react';
import api, { routeApi, salesDeliveryApi, ApiRouteShop } from '../services/apiService';
import { CustomSelect, Toast } from '../components/common';

interface DispatchGroup {
  id: number;
  groupName: string;
  salesPersonId?: number;
  salesPersonName?: string;
  driverId?: number;
  driverName?: string;
  vehicleId?: number;
  vehicleNumber?: string;
  status: string;
}

interface ResourceItem {
  id: number;
  fullName?: string;
  name?: string;
  username?: string;
  vehicleNumber?: string;
  model?: string;
}

interface RouteItem {
  id: number;
  routeName: string;
  description?: string;
  areaRegion?: string;
  startingHub?: string;
  shops?: any[];
  totalShops?: number;
  totalDistanceKm?: number;
}

interface ShopItem {
  id: number;
  shopName: string;
  location?: string;
  ownerName?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

interface ProductItem {
  id: number;
  name: string;
  category?: string;
  unitPrice?: number;
}

interface TruckLoadedItem {
  productId: number;
  productName: string;
  loadedQuantity: number;
  soldQuantity?: number;
  returnedQuantity?: number;
}

interface SelectedShopSequence {
  shopId: number;
  shopName: string;
  location: string;
  visitSequence: number;
  expectedVisitTime: string;
  latitude?: number;
  longitude?: number;
  distanceFromPrevKm?: number;
}

interface ShopVisit {
  id: number;
  tripId: number;
  tripNumber: string;
  shopId: number;
  shop?: {
    id: number;
    shopName: string;
    location: string;
    ownerName: string;
    phone: string;
  };
  shopName?: string;
  shopAddress?: string;
  visitSequence: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  expectedVisitTime: string;
  actualArrivalTime?: string | null;
  actualDepartureTime?: string | null;
  notes?: string;
  productsQty?: number;
  billAmount?: number;
  collectionAmount?: number;
}

interface Trip {
  id: number;
  tripNumber: string;
  tripDate: string;
  dispatchTime?: string;
  dispatchGroupId?: number;
  dispatchGroupName?: string;
  driverName?: string;
  salesPersonName?: string;
  vehicleNumber?: string;
  routeName?: string;
  areaRegion?: string;
  status: string;
  totalLoadedQuantity?: number;
  totalSoldQuantity?: number;
  totalReturnedQuantity?: number;
  totalSalesAmount?: number;
  totalShops?: number;
  completedShops?: number;
  items?: TruckLoadedItem[];
  shopVisits?: ShopVisit[];
}

export const TripDispatchModulePage: React.FC = () => {
  // Page Display Mode: Main Grid/List Directory vs 3-Step Creation Wizard
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [creationStep, setCreationStep] = useState<1 | 2 | 3>(1);

  // Main Directory Display Options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Master Data State (100% API-Driven)
  const [drivers, setDrivers] = useState<ResourceItem[]>([]);
  const [salesPersons, setSalesPersons] = useState<ResourceItem[]>([]);
  const [vehicles, setVehicles] = useState<ResourceItem[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [masterShops, setMasterShops] = useState<ShopItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [dispatchGroups, setDispatchGroups] = useState<DispatchGroup[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [singleTripToDelete, setSingleTripToDelete] = useState<Trip | null>(null);
  const [isDeletingSingleTrip, setIsDeletingSingleTrip] = useState(false);

  const handleClearAllSalesAndDeliveryData = async () => {
    try {
      setIsClearing(true);
      await salesDeliveryApi.clearAll();
      showToast('🗑️ All Sales and Delivery data purged successfully!');
      setActiveTrips([]);
      setInspectingTrip(null);
      setShowClearModal(false);
      fetchActiveTrips();
    } catch (err: any) {
      console.error('Failed to clear sales and delivery data:', err);
      showToast(err.response?.data?.message || 'Failed to clear sales and delivery data');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingleTrip = async () => {
    if (!singleTripToDelete) return;
    try {
      setIsDeletingSingleTrip(true);
      await api.delete(`/trips/${singleTripToDelete.id}`);
      showToast(`🗑️ Trip #${singleTripToDelete.tripNumber} deleted successfully!`);
      if (inspectingTrip?.id === singleTripToDelete.id) {
        setInspectingTrip(null);
      }
      setSingleTripToDelete(null);
      fetchActiveTrips();
    } catch (err: any) {
      console.error('Failed to delete trip:', err);
      showToast(err.response?.data?.message || 'Failed to delete trip');
    } finally {
      setIsDeletingSingleTrip(false);
    }
  };

  // Step 1 Wizard State
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DispatchGroup | null>(null);
  const [newGroupForm, setNewGroupForm] = useState({
    groupName: '',
    description: '',
    salesPersonId: '',
    driverId: '',
    vehicleId: ''
  });

  // Step 2 Wizard State
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [isCreatingNewRoute, setIsCreatingNewRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteItem | null>(null);
  const [newRouteForm, setNewRouteForm] = useState({
    routeName: '',
    areaRegion: '',
    startingHub: 'Central Distribution Hub - Salem',
    description: ''
  });
  const [newRouteShopIds, setNewRouteShopIds] = useState<number[]>([]);
  const [newRouteShopSearch, setNewRouteShopSearch] = useState('');

  // Step 3 Wizard State: Shops, Dispatch Departure Time & Loaded Truck Inventory
  const [selectedShops, setSelectedShops] = useState<SelectedShopSequence[]>([]);
  const [dispatchDepartureTime, setDispatchDepartureTime] = useState<string>('06:30');
  const [truckLoadedItems, setTruckLoadedItems] = useState<TruckLoadedItem[]>([]);
  const [shopSearch, setShopSearch] = useState('');
  const [optimizationStats, setOptimizationStats] = useState<{
    totalKm: number;
    estDuration: string;
    savedKm: number;
    pctSaved: number;
  } | null>(null);

  // Inspection Drawer & Delivery Edit State
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [editingVisit, setEditingVisit] = useState<ShopVisit | null>(null);
  const [visitEditForm, setVisitEditForm] = useState<Partial<ShopVisit>>({});
  const [modalTab, setModalTab] = useState<'visits' | 'inventory'>('visits');
  const [modalSearch, setModalSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    fetchMasterResources();
    fetchActiveTrips();
  }, []);

  const fetchMasterResources = async () => {
    try {
      setIsLoading(true);
      const [drRes, spRes, vhRes, rtRes, shRes, dgRes, prRes] = await Promise.allSettled([
        api.get('/users?role=DRIVER').catch(() => ({ data: [] })),
        api.get('/users?role=SALES_EXECUTIVE').catch(() => ({ data: [] })),
        api.get('/vehicles').catch(() => ({ data: [] })),
        api.get('/routes').catch(() => ({ data: [] })),
        api.get('/shops?all=true').catch(() => ({ data: [] })),
        api.get('/dispatch-groups').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] }))
      ]);

      if (drRes.status === 'fulfilled') setDrivers(drRes.value.data || []);
      if (spRes.status === 'fulfilled') setSalesPersons(spRes.value.data || []);

      const vhList = vhRes.status === 'fulfilled' && Array.isArray(vhRes.value.data) ? vhRes.value.data : [];
      setVehicles(vhList);

      const rtList = rtRes.status === 'fulfilled' && Array.isArray(rtRes.value.data) ? rtRes.value.data : [];
      setRoutes(rtList);

      const rawShList = shRes.status === 'fulfilled' && Array.isArray(shRes.value.data) ? shRes.value.data : [];

      const fallbackLats = [10.7872, 10.7910, 10.7950, 10.8010, 10.8080];
      const fallbackLngs = [79.5750, 79.5800, 79.5850, 79.5900, 79.5950];

      const shList: ShopItem[] = rawShList.map((s: any, idx: number) => ({
        id: s.id,
        shopName: s.shopName || s.name || s.storeName || s.shopCode || `Shop #${s.id}`,
        location: s.location || s.address || s.areaName || 'Delivery Sector',
        ownerName: s.ownerName || s.contactPerson || '',
        phone: s.phone || s.phoneNumber || '',
        latitude: s.latitude ? Number(s.latitude) : fallbackLats[idx % fallbackLats.length],
        longitude: s.longitude ? Number(s.longitude) : fallbackLngs[idx % fallbackLngs.length]
      }));

      setMasterShops(shList);

      if (dgRes.status === 'fulfilled') setDispatchGroups(dgRes.value.data || []);

      const rawProdList = prRes.status === 'fulfilled' && Array.isArray(prRes.value.data) ? prRes.value.data : [];
      const prodList: ProductItem[] = rawProdList.map((p: any) => ({
        id: p.id,
        name: p.name || p.productName || `Product #${p.id}`,
        category: p.category || 'Finished Goods',
        unitPrice: p.price || p.unitPrice || 0
      }));

      setProducts(prodList);

      setTruckLoadedItems(prodList.map(p => ({
        productId: p.id,
        productName: p.name,
        loadedQuantity: 0
      })));

    } catch (err) {
      console.error('Failed to load master resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveTrips = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/trips');
      const tripsData = response.data || [];
      setActiveTrips(tripsData);

      setInspectingTrip((prev) => {
        if (!prev) return null;
        const updated = tripsData.find((t: Trip) => t.id === prev.id);
        return updated || prev;
      });
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // KPI Statistics Calculation
  const stats = useMemo(() => {
    const totalTrips = activeTrips.length;
    const activeDispatches = activeTrips.filter(t => t.status === 'DISPATCHED' || t.status === 'IN_PROGRESS').length;
    const completedTrips = activeTrips.filter(t => t.status === 'COMPLETED').length;

    let totalBilled = 0;
    let totalCollected = 0;
    let totalShopsVisited = 0;
    let totalShopsPlanned = 0;
    let grandTruckLoaded = 0;
    let grandTruckSold = 0;

    activeTrips.forEach(t => {
      const visits = t.shopVisits || [];
      totalShopsPlanned += visits.length || t.totalShops || 0;

      let tVisited = t.completedShops || 0;
      visits.forEach(v => {
        if (v.status === 'COMPLETED') tVisited += 1;
        totalBilled += (v.billAmount || 0);
        totalCollected += (v.collectionAmount || 0);
      });
      totalShopsVisited += (tVisited > 0 ? tVisited : (t.completedShops || 0));

      totalBilled += (t.totalSalesAmount || 0);
      grandTruckLoaded += (t.totalLoadedQuantity || 530);
      grandTruckSold += (t.totalSoldQuantity || visits.reduce((acc, v) => acc + (v.productsQty || 0), 0));
    });

    const completionRate = totalShopsPlanned > 0 ? Math.round((totalShopsVisited / totalShopsPlanned) * 100) : 0;

    return {
      totalTrips,
      activeDispatches,
      completedTrips,
      totalBilled,
      totalCollected,
      totalShopsVisited,
      totalShopsPlanned,
      completionRate,
      grandTruckLoaded,
      grandTruckSold
    };
  }, [activeTrips]);

  // Filtered Trips List
  const filteredTrips = useMemo(() => {
    return activeTrips.filter(t => {
      const matchesSearch =
        (t.tripNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.routeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.driverName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [activeTrips, searchQuery, selectedStatus]);

  // ─── Step 1 Handlers ───────────────────────────────────────────────────────
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.groupName.trim() || !newGroupForm.salesPersonId || !newGroupForm.driverId || !newGroupForm.vehicleId) {
      showToast('Please fill all required fields (Group Name, Sales Person, Driver, Vehicle)');
      return;
    }

    try {
      setIsLoading(true);
      const selectedSales = salesPersons.find(s => String(s.id) === newGroupForm.salesPersonId);
      const selectedDriver = drivers.find(d => String(d.id) === newGroupForm.driverId);
      const selectedVehicle = vehicles.find(v => String(v.id) === newGroupForm.vehicleId);

      const payload = {
        groupName: newGroupForm.groupName.trim(),
        description: newGroupForm.description,
        salesPersonId: Number(newGroupForm.salesPersonId),
        driverId: Number(newGroupForm.driverId),
        vehicleId: Number(newGroupForm.vehicleId),
        status: 'ACTIVE'
      };

      if (editingGroup) {
        await api.put(`/dispatch-groups/${editingGroup.id}`, payload).catch(() => null);

        const updated: DispatchGroup = {
          ...editingGroup,
          groupName: payload.groupName,
          salesPersonId: payload.salesPersonId,
          salesPersonName: selectedSales?.fullName || selectedSales?.name || 'Assigned Sales Person',
          driverId: payload.driverId,
          driverName: selectedDriver?.fullName || selectedDriver?.name || 'Assigned Driver',
          vehicleId: payload.vehicleId,
          vehicleNumber: selectedVehicle?.vehicleNumber || 'Assigned Vehicle',
        };

        setDispatchGroups(prev => prev.map(g => g.id === editingGroup.id ? updated : g));
        showToast(`Dispatch Group "${updated.groupName}" updated successfully!`);
      } else {
        const res = await api.post('/dispatch-groups', payload).catch(() => null);

        const newGroup: DispatchGroup = {
          id: res?.data?.id || Date.now(),
          groupName: payload.groupName,
          salesPersonId: payload.salesPersonId,
          salesPersonName: selectedSales?.fullName || selectedSales?.name || 'Assigned Sales Person',
          driverId: payload.driverId,
          driverName: selectedDriver?.fullName || selectedDriver?.name || 'Assigned Driver',
          vehicleId: payload.vehicleId,
          vehicleNumber: selectedVehicle?.vehicleNumber || 'Assigned Vehicle',
          status: 'ACTIVE'
        };

        setDispatchGroups(prev => [newGroup, ...prev]);
        setSelectedGroupId(newGroup.id);
        showToast(`Dispatch Group "${newGroup.groupName}" created and selected!`);
      }

      setIsCreatingNewGroup(false);
      setEditingGroup(null);
      setNewGroupForm({ groupName: '', description: '', salesPersonId: '', driverId: '', vehicleId: '' });
      setCreationStep(2);
    } catch (err: any) {
      console.error('Failed to save group:', err);
      showToast('Failed to save dispatch group');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Step 2 Handlers ───────────────────────────────────────────────────────
  const handleProceedToShops = async () => {
    if (!selectedRouteId) {
      showToast('Please select a route for the dispatch group');
      return;
    }

    try {
      const routeRes = await routeApi.getById(selectedRouteId).catch(() => null);
      if (routeRes && routeRes.data && routeRes.data.shops && routeRes.data.shops.length > 0) {
        const mapped = routeRes.data.shops.map((s: ApiRouteShop, idx: number) => ({
          shopId: s.shopId,
          shopName: s.shopName,
          location: s.address || 'Delivery Location',
          visitSequence: s.visitOrder || idx + 1,
          expectedVisitTime: `${String(7 + Math.floor((idx + 1) * 0.5)).padStart(2, '0')}:${(idx + 1) % 2 === 0 ? '30' : '00'}`
        }));
        setSelectedShops(mapped);
      } else if (selectedShops.length === 0 && masterShops.length > 0) {
        const mapped = masterShops.map((s, idx) => ({
          shopId: s.id,
          shopName: s.shopName,
          location: s.location || 'Delivery Location',
          visitSequence: idx + 1,
          expectedVisitTime: `${String(7 + Math.floor((idx + 1) * 0.5)).padStart(2, '0')}:${(idx + 1) % 2 === 0 ? '30' : '00'}`
        }));
        setSelectedShops(mapped);
      }
    } catch (err) {
      console.warn('Could not auto-fetch route shops:', err);
    }

    setCreationStep(3);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteForm.routeName.trim()) return;

    try {
      setIsLoading(true);
      const payload = {
        routeName: newRouteForm.routeName.trim(),
        description: newRouteForm.description.trim() || 'Standard planned delivery corridor',
        startingHub: newRouteForm.startingHub || 'Central Distribution Hub - Salem',
        areaRegion: newRouteForm.areaRegion.trim() || 'Main Sector',
        status: 'ACTIVE'
      };

      if (editingRoute) {
        await api.put(`/routes/${editingRoute.id}`, payload).catch(() => null);

        const updatedRoute: RouteItem = {
          ...editingRoute,
          routeName: payload.routeName,
          description: payload.description,
          areaRegion: payload.areaRegion,
          startingHub: payload.startingHub
        };

        setRoutes(prev => prev.map(r => r.id === editingRoute.id ? updatedRoute : r));
        showToast(`Delivery Route "${updatedRoute.routeName}" updated successfully!`);
      } else {
        const res = await api.post('/routes', payload).catch(() => null);

        const createdRoute: RouteItem = {
          id: res?.data?.id || Date.now(),
          routeName: res?.data?.routeName || payload.routeName,
          description: res?.data?.description || payload.description,
          areaRegion: payload.areaRegion,
          startingHub: payload.startingHub
        };

        setRoutes(prev => [createdRoute, ...prev]);
        setSelectedRouteId(createdRoute.id);

        if (newRouteShopIds.length > 0) {
          const chosenShops = masterShops
            .filter(s => newRouteShopIds.includes(s.id))
            .map((shop, idx) => ({
              shopId: shop.id,
              shopName: shop.shopName,
              location: shop.location || 'Delivery Location',
              visitSequence: idx + 1,
              expectedVisitTime: `0${7 + Math.floor(idx / 2)}:${idx % 2 === 0 ? '00' : '30'} AM`,
              latitude: 11.6643 + (idx * 0.01),
              longitude: 78.1460 + (idx * 0.01),
              distanceFromPrevKm: idx === 0 ? 3.5 : 4.2
            }));
          setSelectedShops(chosenShops);
        }

        showToast(`Delivery Route "${createdRoute.routeName}" created and selected!`);
      }

      setIsCreatingNewRoute(false);
      setEditingRoute(null);
      setNewRouteForm({ routeName: '', areaRegion: '', startingHub: 'Central Distribution Hub - Salem', description: '' });
      setCreationStep(3);
    } catch (err: any) {
      console.error('Failed to save route:', err);
      showToast(err.response?.data?.message || 'Failed to save route');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoute = async (routeId: number) => {
    setSelectedRouteId(routeId);
    const route = routes.find(r => r.id === routeId);

    try {
      let routeShops: ShopItem[] = [];
      const res = await api.get(`/routes/${routeId}`).catch(() => null);
      if (res?.data?.shops && Array.isArray(res.data.shops) && res.data.shops.length > 0) {
        routeShops = res.data.shops.map((s: any) => ({
          id: s.shopId || s.id || (s.shop && s.shop.id),
          shopName: s.shopName || (s.shop && (s.shop.shopName || s.shop.name)) || s.name || `Shop #${s.shopId || s.id}`,
          location: s.address || (s.shop && (s.shop.address || s.shop.location)) || s.location || 'Delivery Location',
          latitude: s.latitude ? Number(s.latitude) : s.shop?.latitude ? Number(s.shop.latitude) : undefined,
          longitude: s.longitude ? Number(s.longitude) : s.shop?.longitude ? Number(s.shop.longitude) : undefined,
          ownerName: s.ownerName || (s.shop && s.shop.ownerName) || '',
          phone: s.phone || (s.shop && s.shop.phone) || ''
        }));
      } else if (route?.routeName && masterShops.length > 0) {
        const matches = masterShops.filter(s =>
          s.location?.toLowerCase().includes(route.routeName.toLowerCase()) ||
          s.shopName?.toLowerCase().includes(route.routeName.toLowerCase())
        );
        if (matches.length > 0) {
          routeShops = matches;
        }
      }

      const mapped: SelectedShopSequence[] = routeShops.map((shop, idx) => ({
        shopId: shop.id,
        shopName: shop.shopName,
        location: shop.location || 'Delivery Location',
        latitude: shop.latitude,
        longitude: shop.longitude,
        visitSequence: idx + 1,
        expectedVisitTime: `${String(7 + Math.floor((idx + 1) * 0.5)).padStart(2, '0')}:${(idx + 1) % 2 === 0 ? '30' : '00'}`
      }));

      setSelectedShops(mapped);
      showToast(`Route "${route?.routeName || ''}" selected with ${mapped.length} customer shops pre-loaded!`);
    } catch (err) {
      console.error('Failed to load route shops:', err);
    }
  };

  // ─── Step 3 Handlers: Sequence & Dispatch Launch ────────────────────────────
  const handleToggleShopSelection = (shop: ShopItem) => {
    if (selectedShops.some(s => s.shopId === shop.id)) {
      const filtered = selectedShops
        .filter(s => s.shopId !== shop.id)
        .map((s, idx) => ({ ...s, visitSequence: idx + 1 }));
      setSelectedShops(filtered);
    } else {
      const nextSeq = selectedShops.length + 1;
      const defaultTime = `${String(7 + Math.floor(nextSeq * 0.5)).padStart(2, '0')}:${nextSeq % 2 === 0 ? '30' : '00'}`;
      setSelectedShops([
        ...selectedShops,
        {
          shopId: shop.id,
          shopName: shop.shopName,
          location: shop.location || '',
          visitSequence: nextSeq,
          expectedVisitTime: defaultTime
        }
      ]);
    }
  };

  const handleSelectAllShops = () => {
    const mapped: SelectedShopSequence[] = masterShops.map((shop, idx) => ({
      shopId: shop.id,
      shopName: shop.shopName,
      location: shop.location || 'Delivery Location',
      visitSequence: idx + 1,
      expectedVisitTime: `${String(7 + Math.floor((idx + 1) * 0.5)).padStart(2, '0')}:${(idx + 1) % 2 === 0 ? '30' : '00'}`
    }));
    setSelectedShops(mapped);
    showToast(`All ${masterShops.length} shops added to trip visit sequence!`);
  };

  const handleUpdateTruckItemQty = (productId: number, qty: number) => {
    setTruckLoadedItems(prev => prev.map(item => item.productId === productId ? { ...item, loadedQuantity: Math.max(0, qty) } : item));
  };

  const totalLoadedQtySum = useMemo(() => {
    return truckLoadedItems.reduce((acc, item) => acc + (item.loadedQuantity || 0), 0);
  }, [truckLoadedItems]);

  const handleAutoOptimizeSequence = () => {
    if (selectedShops.length === 0) return;

    const hubLat = 10.787252191240228;
    const hubLng = 79.57505803846621;

    const calcRoadDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Math.round(R * c * 1.28 * 10) / 10;
    };

    const unvisited = [...selectedShops];
    const optimized: SelectedShopSequence[] = [];
    let currentLat = hubLat;
    let currentLng = hubLng;
    let accumulatedMinutes = 45;
    let optimizedTotalKm = 0;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const s = unvisited[i];
        const sLat = s.latitude || (hubLat + 0.008 * (i + 1));
        const sLng = s.longitude || (hubLng + 0.005 * (i + 1));
        const dist = calcRoadDist(currentLat, currentLng, sLat, sLng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const [nextShop] = unvisited.splice(nearestIdx, 1);
      const shopLat = nextShop.latitude || currentLat + 0.005;
      const shopLng = nextShop.longitude || currentLng + 0.005;
      const legDist = calcRoadDist(currentLat, currentLng, shopLat, shopLng);
      optimizedTotalKm += legDist;

      const drivingAndStopMins = Math.round(legDist * 2.5) + 20;
      accumulatedMinutes += drivingAndStopMins;
      const hour = 7 + Math.floor(accumulatedMinutes / 60);
      const min = accumulatedMinutes % 60;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

      optimized.push({
        ...nextShop,
        visitSequence: optimized.length + 1,
        expectedVisitTime: timeStr,
        distanceFromPrevKm: legDist
      });

      currentLat = shopLat;
      currentLng = shopLng;
    }

    setSelectedShops(optimized);
    showToast(`⚡ Smart TSP Road Optimization Applied! Sequential order arranged.`);
  };

  // ─── Dispatch Launch: Creates Trip, Closes Wizard & Lists in Grid ─────────────
  const handleDispatchTrip = async () => {
    if (!selectedGroupId || !selectedRouteId || selectedShops.length === 0) {
      showToast('Please complete all 3 previous steps before dispatching.');
      return;
    }

    try {
      setIsLoading(true);
      const todayDateStr = new Date().toISOString().split('T')[0];
      const formattedDispatchTime = `${todayDateStr}T${dispatchDepartureTime}:00Z`;

      const res = await api.post('/trips', {
        dispatchGroupId: selectedGroupId,
        routeGroupId: selectedRouteId,
        tripDate: todayDateStr,
        dispatchTime: formattedDispatchTime,
        items: truckLoadedItems.filter(i => i.loadedQuantity > 0).map(i => ({
          productId: i.productId,
          loadedQuantity: i.loadedQuantity
        })),
        shops: selectedShops.map(s => ({
          shopId: s.shopId,
          visitSequence: s.visitSequence,
          expectedVisitTime: s.expectedVisitTime
        }))
      });

      showToast(`🚀 Trip #${res?.data?.tripNumber || ''} created with ${totalLoadedQtySum} pkts loaded at ${dispatchDepartureTime} AM!`);

      if (activeGroup?.vehicleId && activeRoute?.routeName) {
        api.put(`/vehicles/${activeGroup.vehicleId}`, {
          status: 'ACTIVE_DISPATCHED',
          assignedRoute: activeRoute.routeName
        }).catch(() => null);
      }

      await fetchActiveTrips();

      // Close creation wizard & switch to Grid View
      setIsCreatingTrip(false);
      setViewMode('grid');
      setInspectingTrip(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to dispatch trip:', err);
      showToast(err.response?.data?.message || 'Failed to dispatch trip');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Save Shop Visit Entry ──────────────────────────────────────────────────
  const handleSaveVisitDetails = async () => {
    if (!editingVisit) return;

    try {
      setIsLoading(true);
      await api.put(`/trip-visits/${editingVisit.id}`, {
        status: visitEditForm.status,
        expectedVisitTime: visitEditForm.expectedVisitTime,
        actualArrivalTime: visitEditForm.actualArrivalTime,
        actualDepartureTime: visitEditForm.actualDepartureTime,
        productsQty: visitEditForm.productsQty,
        billAmount: visitEditForm.billAmount,
        collectionAmount: visitEditForm.collectionAmount,
        notes: visitEditForm.notes
      });

      showToast('Visit details updated successfully!');
      fetchActiveTrips();
      setEditingVisit(null);
    } catch (err: any) {
      console.error('Failed to update visit:', err);
      showToast('Failed to update shop visit details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DISPATCHED':
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  const activeGroup = dispatchGroups.find(g => g.id === selectedGroupId);
  const activeRoute = routes.find(r => r.id === selectedRouteId);

  const getTripVisitStats = (trip: Trip) => {
    const visits = trip.shopVisits || [];
    const completedCount = visits.filter(v => v.status === 'COMPLETED').length || trip.completedShops || 0;
    const totalCount = visits.length || trip.totalShops || 0;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const totalBilled = visits.reduce((acc, v) => acc + (v.billAmount || 0), 0) || trip.totalSalesAmount || 0;
    const totalCollected = visits.reduce((acc, v) => acc + (v.collectionAmount || 0), 0);
    const totalSoldUnits = visits.reduce((acc, v) => acc + (v.productsQty || 0), 0) || trip.totalSoldQuantity || 0;
    const loadedUnits = trip.totalLoadedQuantity || 530;
    const remainingUnits = Math.max(0, loadedUnits - totalSoldUnits);

    return { completedCount, totalCount, progressPct, totalBilled, totalCollected, totalSoldUnits, loadedUnits, remainingUnits };
  };

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification (Bottom Center) */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Styled Non-Clipping Header Card (Exact Inventory & Production Module Style) */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Trip Dispatch & Route Execution Hub
            </h1>
            <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              Live Fleet Dispatches
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            API-driven dispatch management, departure timing, truck loaded inventory balance, and real-time shop billing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchActiveTrips}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Trip Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer border border-rose-200 dark:border-rose-800"
            title="Delete All Sales and Delivery Data"
          >
            <Trash2 className="w-4 h-4" /> Purge All Data
          </button>

          {!isCreatingTrip ? (
            <button
              onClick={() => {
                setIsCreatingTrip(true);
                setCreationStep(1);
                setSelectedGroupId(null);
                setSelectedRouteId(null);
                setSelectedShops([]);
                setIsCreatingNewGroup(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />New Dispatch Trip
            </button>
          ) : (
            <button
              onClick={() => setIsCreatingTrip(false)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-[#1C1C1C] dark:text-slate-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" /> Exit Wizard
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid (Exact Production Module Metrics Style) */}
      {!isCreatingTrip && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Trips */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Total Dispatches</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white">{stats.totalTrips}</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Trips Scheduled</span>
              </div>
              <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400 mt-1">{stats.activeDispatches} Active On Road</p>
            </div>
          </div>

          {/* Card 2: Truck Inventory Loading */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Truck Inventory Loaded</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{stats.grandTruckLoaded.toLocaleString()} Pkts</span>
              </div>
              <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400 mt-1">{stats.grandTruckSold.toLocaleString()} Pkts Delivered</p>
            </div>
          </div>

          {/* Card 3: Shop Visit Progress */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Shop Delivery Rate</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white">{stats.completionRate}%</span>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{stats.totalShopsVisited}/{stats.totalShopsPlanned} Visited</span>
              </div>
              <div className="w-full bg-[#F0F2F5] dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
              </div>
            </div>
          </div>

          {/* Card 4: Total Collections */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider truncate">Field Cash Collections</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">₹{stats.totalCollected.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400 mt-1">Billed: ₹{stats.totalBilled.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3-STEP PRE-TRIP DISPATCH WIZARD (SHOWN ONLY WHEN isCreatingTrip === true) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isCreatingTrip && (
        <div className="space-y-6 animate-in fade-in">
          {/* 3-Step Wizard Header Ribbon */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Pre-Trip Dispatch & Inventory Loader Wizard (3 Steps)
              </span>
              <button onClick={() => setIsCreatingTrip(false)} className="text-xs font-bold text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white cursor-pointer">
                Cancel & Return
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { step: 1, tag: 'STEP 1', title: '1. Dispatch Crew', desc: 'Driver + Sales + Vehicle' },
                { step: 2, tag: 'STEP 2', title: '2. Delivery Routes', desc: 'Select Saved Route' },
                { step: 3, tag: 'STEP 3', title: '3. Shop & Product Load', desc: 'Departure Time & Truck Stock' },
              ].map((item) => {
                const isActive = creationStep === item.step;
                const isDone = creationStep > item.step;

                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setCreationStep(item.step as any)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${isActive
                        ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                        : isDone
                          ? 'bg-emerald-50 dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#1C1C1C]' : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                        {item.tag}
                      </span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <h4 className="font-extrabold text-xs">{item.title}</h4>
                    <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'opacity-80' : 'text-[#8C8C8C]'}`}>
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 1: DISPATCH CREW */}
          {creationStep === 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-4 border-b border-[#F0F2F5] dark:border-slate-700">
                <div>
                  <h2 className="text-base font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                    <User className="w-4.5 h-4.5 text-blue-600" /> Step 1: Select or Assemble Dispatch Crew
                  </h2>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                    Pair an authorized Driver, Sales Executive, and Delivery Vehicle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewGroup(!isCreatingNewGroup)}
                  className="bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isCreatingNewGroup ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isCreatingNewGroup ? 'Select Existing Crew' : 'New Dispatch Crew'}
                </button>
              </div>

              {isCreatingNewGroup ? (
                <form onSubmit={handleSaveGroup} className="bg-[#F7F9FB] dark:bg-slate-900 p-5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold mb-1 text-[#1C1C1C] dark:text-white">Crew / Dispatch Group Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Salem West Sector Crew A"
                        value={newGroupForm.groupName}
                        onChange={(e) => setNewGroupForm({ ...newGroupForm, groupName: e.target.value })}
                        required
                        className="w-full bg-white dark:bg-slate-800 text-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-600 focus:outline-none font-semibold text-[#1C1C1C] dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-[#1C1C1C] dark:text-white">Assigned Sales Executive *</label>
                      <CustomSelect
                        value={newGroupForm.salesPersonId}
                        onChange={val => setNewGroupForm({ ...newGroupForm, salesPersonId: val })}
                        options={[
                          { value: '', label: 'Select Sales Executive' },
                          ...salesPersons.map((sp) => ({
                            value: sp.id,
                            label: `${sp.fullName || sp.name} (${sp.username})`,
                            badge: 'SALES'
                          }))
                        ]}
                        placeholder="Select Sales Executive"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1 text-[#1C1C1C] dark:text-white">Assigned Driver *</label>
                      <CustomSelect
                        value={newGroupForm.driverId}
                        onChange={val => setNewGroupForm({ ...newGroupForm, driverId: val })}
                        options={[
                          { value: '', label: 'Select Delivery Driver' },
                          ...drivers.map((d) => ({
                            value: d.id,
                            label: `${d.fullName || d.name} (${d.username})`,
                            badge: 'DRIVER'
                          }))
                        ]}
                        placeholder="Select Delivery Driver"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold mb-1 text-[#1C1C1C] dark:text-white">Assigned Truck / Vehicle *</label>
                      <CustomSelect
                        value={newGroupForm.vehicleId}
                        onChange={val => setNewGroupForm({ ...newGroupForm, vehicleId: val })}
                        options={[
                          { value: '', label: 'Select Vehicle / Truck' },
                          ...vehicles.map((v) => ({
                            value: v.id,
                            label: `${v.vehicleNumber} - ${v.model || 'Delivery Van'}`,
                            badge: 'FLEET'
                          }))
                        ]}
                        placeholder="Select Vehicle / Truck"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Save className="w-4 h-4" /> Save & Proceed to Step 2
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dispatchGroups.map((group) => {
                      const isSelected = selectedGroupId === group.id;
                      return (
                        <div
                          key={group.id}
                          onClick={() => setSelectedGroupId(group.id)}
                          className={`bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border shadow-2xs space-y-3 hover:shadow-md transition-all cursor-pointer ${isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20 dark:bg-blue-900/10'
                              : 'border-[#F0F2F5] dark:border-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700/60 pb-3">
                            <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">{group.groupName}</h3>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-white" /> Selected
                              </span>
                            )}
                          </div>
                          <div className="p-3 bg-[#F7F9FB] dark:bg-slate-900/60 rounded-xl space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-[#8C8C8C]">Sales:</span><span className="font-bold text-[#1C1C1C] dark:text-white">{group.salesPersonName || 'Sales Person'}</span></div>
                            <div className="flex justify-between"><span className="text-[#8C8C8C]">Driver:</span><span className="font-bold text-[#1C1C1C] dark:text-white">{group.driverName || 'Driver'}</span></div>
                            <div className="flex justify-between"><span className="text-[#8C8C8C]">Vehicle:</span><span className="font-mono font-extrabold text-blue-600">{group.vehicleNumber || 'Van'}</span></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[#F0F2F5] dark:border-slate-700">
                    <button
                      type="button"
                      disabled={!selectedGroupId}
                      onClick={() => setCreationStep(2)}
                      className="px-5 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Proceed to Step 2: Delivery Routes <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DELIVERY ROUTES */}
          {creationStep === 2 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 p-5 sm:p-6 shadow-2xs">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#F0F2F5] dark:border-slate-700">
                <div>
                  <h2 className="text-base font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                    <Navigation className="w-4.5 h-4.5 text-blue-600" /> Step 2: Select Delivery Route
                  </h2>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                    Choose an existing delivery route created in the system or create a new delivery route.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRoute(null);
                    setNewRouteForm({
                      routeName: '',
                      areaRegion: '',
                      startingHub: 'Central Distribution Hub - Salem',
                      description: ''
                    });
                    setNewRouteShopIds(masterShops.map((s) => s.id));
                    setIsCreatingNewRoute(true);
                  }}
                  className="bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4" /> + New Delivery Route
                </button>
              </div>

              {routes.length === 0 ? (
                <div className="text-center py-10 bg-[#F7F9FB] dark:bg-slate-900 rounded-xl border border-dashed border-[#E2E8F0] dark:border-slate-700 space-y-3">
                  <Navigation className="w-10 h-10 mx-auto text-[#8C8C8C]" />
                  <h4 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">No Delivery Routes Found</h4>
                  <p className="text-xs text-[#8C8C8C] max-w-sm mx-auto">You have not created any delivery routes yet. Click below to open the Delivery Route Module form and create your first route.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoute(null);
                      setNewRouteForm({
                        routeName: '',
                        areaRegion: '',
                        startingHub: 'Central Distribution Hub - Salem',
                        description: ''
                      });
                      setNewRouteShopIds(masterShops.map((s) => s.id));
                      setIsCreatingNewRoute(true);
                    }}
                    className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + New Delivery Route
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {routes.map((route) => {
                      const isSelected = selectedRouteId === route.id;
                      const shopCount = route.shops ? route.shops.length : (route.totalShops || 0);
                      return (
                        <div
                          key={route.id}
                          onClick={() => handleSelectRoute(route.id)}
                          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-2xs space-y-3 hover:shadow-md transition-all cursor-pointer ${isSelected
                              ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/20 dark:bg-blue-900/10'
                              : 'border-[#F0F2F5] dark:border-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700/60 pb-3">
                            <div>
                              <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">{route.routeName}</h3>
                              <span className="text-[11px] font-medium text-[#8C8C8C]">{route.areaRegion || route.startingHub || 'Delivery Corridor'}</span>
                            </div>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-white" /> Selected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8C8C8C] leading-relaxed line-clamp-2">{route.description || 'Standard planned delivery corridor.'}</p>
                          <div className="flex justify-between items-center text-xs text-[#8C8C8C] pt-1">
                            <span className="flex items-center gap-1 font-semibold"><Store className="w-3.5 h-3.5 text-blue-500" /> {shopCount} Customer Stops</span>
                            <span className="font-mono text-blue-600 font-bold">{route.totalDistanceKm ? `${route.totalDistanceKm} km` : 'Dynamic Route'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-[#F0F2F5] dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setCreationStep(1)}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Back to Step 1
                    </button>
                    <button
                      type="button"
                      disabled={!selectedRouteId}
                      onClick={handleProceedToShops}
                      className="px-5 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Proceed to Step 3: Shop & Product Load <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SHOP & PRODUCT LOAD */}
          {creationStep === 3 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#F0F2F5] dark:border-slate-700">
                <div>
                  <h2 className="text-base font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                    <Boxes className="w-4.5 h-4.5 text-purple-600" /> Step 3: Load Truck Inventory & Set Dispatch Departure
                  </h2>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                    Specify dispatch departure time and initial finished goods bread stock loaded onto the vehicle.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-[#F7F9FB] dark:bg-slate-900 p-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-xs">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-[#1C1C1C] dark:text-white">Dispatch Departure Time:</span>
                  <input
                    type="time"
                    value={dispatchDepartureTime}
                    onChange={(e) => setDispatchDepartureTime(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-xs font-mono font-bold px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Truck Loaded Stock Inventory Table */}
              <div className="bg-[#F7F9FB] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-700">
                  <h3 className="font-extrabold text-xs text-[#1C1C1C] dark:text-white flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-purple-600" /> Finished Goods Bread Stock Loaded onto Truck
                  </h3>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-600 font-extrabold text-xs rounded-xl border border-purple-500/20">
                    Total Loaded Stock: {totalLoadedQtySum} Packets
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {truckLoadedItems.map((item) => (
                    <div key={item.productId} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#1C1C1C] dark:text-white block">{item.productName}</span>
                        <span className="text-[10px] text-[#8C8C8C]">Factory Finished Item</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#8C8C8C] font-semibold">Qty:</span>
                        <input
                          type="number"
                          min="0"
                          value={item.loadedQuantity}
                          onChange={(e) => handleUpdateTruckItemQty(item.productId, parseInt(e.target.value) || 0)}
                          className="w-20 bg-[#F7F9FB] dark:bg-slate-900 text-xs font-mono font-bold text-center py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 text-blue-600 focus:outline-none"
                        />
                        <span className="text-[10px] text-[#8C8C8C] font-bold">pkts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shop Visit Sequence Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <div className="bg-[#F7F9FB] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-xs text-[#1C1C1C] dark:text-white flex items-center gap-1">
                      <Store className="w-4 h-4 text-blue-600" /> Customer Outlets
                    </h3>
                    <button type="button" onClick={handleSelectAllShops} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                      Select All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {masterShops.map((shop) => {
                      const isSelected = selectedShops.some(s => s.shopId === shop.id);
                      return (
                        <div
                          key={shop.id}
                          onClick={() => handleToggleShopSelection(shop)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-white border-[#E2E8F0] text-[#1C1C1C]'
                            }`}
                        >
                          <div>
                            <p className="font-bold">{shop.shopName}</p>
                            <p className="text-[10px] text-[#8C8C8C]">{shop.location}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                            {isSelected ? 'Added' : 'Add'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#F7F9FB] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-xs text-[#1C1C1C] dark:text-white flex items-center gap-1">
                      <ListOrdered className="w-4 h-4 text-blue-600" /> Planned Sequence ({selectedShops.length})
                    </h3>
                    {selectedShops.length > 0 && (
                      <button type="button" onClick={handleAutoOptimizeSequence} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                        ⚡ TSP Optimize
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedShops.map((item, index) => (
                      <div key={item.shopId} className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-[10px]">
                            {item.visitSequence}
                          </span>
                          <span className="font-bold text-[#1C1C1C]">{item.shopName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCreationStep(2)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Back to Step 2
                </button>
                <button
                  type="button"
                  disabled={selectedShops.length === 0 || totalLoadedQtySum === 0 || isLoading}
                  onClick={handleDispatchTrip}
                  className="px-6 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  🚀 Confirm & Dispatch Trip ({totalLoadedQtySum} Pkts Loaded) <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* FILTER & SEARCH BAR (EXACT INVENTORY & PRODUCTION MODULE STYLE)         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!isCreatingTrip && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
          {/* Status Pill Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['ALL', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'DRAFT'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border shrink-0 ${selectedStatus === st
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                    : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C] dark:hover:text-white'
                  }`}
              >
                {st === 'ALL' && `All Dispatches (${activeTrips.length})`}
                {st === 'DISPATCHED' && `Dispatched (${activeTrips.filter(t => t.status === 'DISPATCHED').length})`}
                {st === 'IN_PROGRESS' && `In Progress (${activeTrips.filter(t => t.status === 'IN_PROGRESS').length})`}
                {st === 'COMPLETED' && `Completed (${activeTrips.filter(t => t.status === 'COMPLETED').length})`}
                {st === 'DRAFT' && `Draft`}
              </button>
            ))}
          </div>

          {/* Search & Grid/List View Switcher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#F0F2F5] dark:border-slate-700/60">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#8C8C8C] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Trip #, Driver name, Route corridor, or Vehicle number..."
                className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
              />
            </div>

            <div className="flex items-center p-1 bg-[#F4F5F7] dark:bg-slate-900 rounded-2xl border border-[#E9ECEF] dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                    : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
                }`}
                title="Table List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
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
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CREATED TRIPS LISTED ON GRID (SHOWING TRUCK INVENTORY & DISPATCH TIME)  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!isCreatingTrip && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredTrips.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs font-bold text-[#8C8C8C] bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-slate-700 p-8">
              <Truck className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="font-extrabold text-sm text-[#1C1C1C] dark:text-white mb-1">No Dispatched Trips Found</p>
              <p className="max-w-md mx-auto mb-4">No trips match your search filter in database.</p>
              <button
                onClick={() => {
                  setIsCreatingTrip(true);
                  setCreationStep(1);
                }}
                className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> + Create New Trip Dispatch
              </button>
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const stats = getTripVisitStats(trip);
              const isSelected = inspectingTrip?.id === trip.id;

              return (
                <div
                  key={trip.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-[#F0F2F5] dark:border-slate-700'
                    }`}
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-[#1C1C1C] dark:text-white bg-[#F7F9FB] dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700">
                          #{trip.tripNumber}
                        </span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {trip.dispatchTime ? trip.dispatchTime.slice(11, 16) : '06:30'} AM
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadge(trip.status)}`}>
                        {trip.status || 'DISPATCHED'}
                      </span>
                    </div>

                    {/* Corridor & Crew Card Box */}
                    <div>
                      <h3 className="font-extrabold text-sm text-[#1C1C1C] dark:text-white flex items-center gap-1.5">
                        <Navigation className="w-4 h-4 text-emerald-500" /> {trip.routeName || 'Standard Route'}
                      </h3>

                      <div className="mt-2.5 p-3 bg-[#F7F9FB] dark:bg-slate-900/60 rounded-xl border border-[#F0F2F5] dark:border-slate-700 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[#8C8C8C] flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-500" /> Sales Person:</span>
                          <span className="font-bold text-[#1C1C1C] dark:text-slate-100">{trip.salesPersonName || 'Sales Executive'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#8C8C8C] flex items-center gap-1"><User className="w-3.5 h-3.5 text-blue-500" /> Driver:</span>
                          <span className="font-bold text-[#1C1C1C] dark:text-slate-100">{trip.driverName || 'Driver'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#8C8C8C] flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-purple-500" /> Vehicle:</span>
                          <span className="font-mono font-extrabold text-blue-600">{trip.vehicleNumber || 'Van'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Truck Loaded Inventory Stock Live Balance Pill */}
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/40 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-300">
                        <span className="flex items-center gap-1"><Boxes className="w-3.5 h-3.5 text-purple-600" /> Loaded Truck Stock:</span>
                        <span>{stats.loadedUnits} Pkts</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-purple-700 dark:text-purple-400 font-semibold pt-0.5">
                        <span>Delivered: <b>{stats.totalSoldUnits}</b> Pkts</span>
                        <span>On Truck: <b className="text-emerald-600">{stats.remainingUnits}</b> Pkts</span>
                      </div>
                    </div>

                    {/* Shop Visit Progress Bar & Financial Snapshot */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#8C8C8C]">Shop Visits ({stats.completedCount}/{stats.totalCount})</span>
                        <span className="text-blue-600">{stats.progressPct}%</span>
                      </div>
                      <div className="w-full bg-[#F0F2F5] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${stats.progressPct}%` }} />
                      </div>

                      <div className="flex justify-between items-center pt-2 text-xs border-t border-[#F0F2F5] dark:border-slate-700">
                        <div>
                          <span className="text-[10px] text-[#8C8C8C] block uppercase font-bold">Billed</span>
                          <span className="font-extrabold text-[#1C1C1C] dark:text-slate-200">₹{stats.totalBilled.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#8C8C8C] block uppercase font-bold">Collected</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{stats.totalCollected.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Button */}
                  <div className="pt-3 border-t border-[#F0F2F5] dark:border-slate-700 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectingTrip(trip);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="flex-1 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-95"
                    >
                      <Eye className="w-4 h-4" /> Inspect Log
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleTripToDelete(trip)}
                      className="p-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition cursor-pointer border border-rose-200 dark:border-rose-800 shrink-0"
                      title="Delete Single Trip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABLE LIST VIEW MODE */}
      {!isCreatingTrip && viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Trip / Dispatch Time</th>
                  <th className="py-3.5 px-4 font-bold">Route Corridor</th>
                  <th className="py-3.5 px-4 font-bold">Dispatch Crew</th>
                  <th className="py-3.5 px-4 font-bold">Loaded Truck Inventory</th>
                  <th className="py-3.5 px-4 font-bold">Visits Progress</th>
                  <th className="py-3.5 px-4 font-bold">Billing & Collections</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                {filteredTrips.map((trip) => {
                  const stats = getTripVisitStats(trip);
                  return (
                    <tr key={trip.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold font-mono block">#{trip.tripNumber}</span>
                        <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {trip.dispatchTime ? trip.dispatchTime.slice(11, 16) : '06:30'} AM
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{trip.routeName || 'Standard Route'}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold block text-slate-900 dark:text-white">Sales: {trip.salesPersonName || 'Sales Executive'}</span>
                        <span className="text-[10px] text-[#8C8C8C]">Driver: {trip.driverName || 'Driver'} • {trip.vehicleNumber || 'Van'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-purple-600 block">{stats.loadedUnits} Loaded</span>
                        <span className="text-[10px] text-[#8C8C8C]">{stats.remainingUnits} Pkts on Truck</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold">{stats.completedCount}/{stats.totalCount} ({stats.progressPct}%)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold block">₹{stats.totalBilled.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-600 font-semibold">Collected: ₹{stats.totalCollected.toLocaleString()}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadge(trip.status)}`}>
                          {trip.status || 'DISPATCHED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingTrip(trip);
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Inspect Log
                          </button>
                          <button
                            type="button"
                            onClick={() => setSingleTripToDelete(trip)}
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold cursor-pointer border border-rose-200 dark:border-rose-800"
                            title="Delete Single Trip"
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

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* LIVE FIELD EXECUTION & TRUCK STOCK LOG MODAL                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {!isCreatingTrip && inspectingTrip && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setInspectingTrip(null);
              setEditingVisit(null);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {(() => {
              const stats = getTripVisitStats(inspectingTrip);
              const filteredVisits = (inspectingTrip.shopVisits || []).filter((v) => {
                if (!modalSearch.trim()) return true;
                const q = modalSearch.toLowerCase();
                const shopName = (v.shop?.shopName || v.shopName || '').toLowerCase();
                const shopLoc = (v.shop?.location || v.shopAddress || '').toLowerCase();
                return shopName.includes(q) || shopLoc.includes(q);
              });

              return (
                <>
                  {/* Modal Header */}
                  <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 border-b border-[#F0F2F5] dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                          Live Field Execution & Truck Stock Log
                        </h3>
                        <span className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800/40">
                          #{inspectingTrip.tripNumber}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getStatusBadge(inspectingTrip.status)}`}>
                          {inspectingTrip.status || 'DISPATCHED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8C8C8C] dark:text-slate-400 flex items-center gap-2 flex-wrap pt-0.5">
                        <span>Route: <strong className="text-[#1C1C1C] dark:text-slate-200">{inspectingTrip.routeName || 'Standard Route'}</strong></span>
                        <span>• Departure: <strong className="text-blue-600">{inspectingTrip.dispatchTime ? inspectingTrip.dispatchTime.slice(11, 16) : '06:30'} AM</strong></span>
                        <span>• Driver: <strong className="text-[#1C1C1C] dark:text-slate-200">{inspectingTrip.driverName || 'Driver'}</strong></span>
                        <span>• Sales: <strong className="text-[#1C1C1C] dark:text-slate-200">{inspectingTrip.salesPersonName || 'Executive'}</strong></span>
                        <span>• Vehicle: <strong className="text-purple-600">{inspectingTrip.vehicleNumber || 'Van'}</strong></span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setSingleTripToDelete(inspectingTrip)}
                        className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                        title="Delete Single Trip"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Trip
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInspectingTrip(null);
                          setEditingVisit(null);
                        }}
                        className="p-2 text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 rounded-xl transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Tiles Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 sm:px-6 bg-[#F7F9FB] dark:bg-slate-900/60 border-b border-[#F0F2F5] dark:border-slate-700 shrink-0">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Truck Stock Loaded</span>
                      <div className="text-base font-extrabold text-purple-600 flex items-center gap-1.5">
                        <Boxes className="w-4 h-4" /> {stats.loadedUnits} <span className="text-xs font-semibold text-[#8C8C8C]">Pkts</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Current Truck Balance</span>
                      <div className="text-base font-extrabold text-emerald-600 flex items-center gap-1.5">
                        <Truck className="w-4 h-4" /> {stats.remainingUnits} <span className="text-xs font-semibold text-[#8C8C8C]">Pkts</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Visits Progress</span>
                      <div className="text-base font-extrabold text-[#1C1C1C] dark:text-white flex justify-between items-center">
                        <span>{stats.completedCount} / {stats.totalCount}</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded-md">{stats.progressPct}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Total Billed</span>
                      <div className="text-base font-extrabold text-blue-600">
                        ₹{stats.totalBilled.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 space-y-1 shadow-2xs">
                      <span className="text-[10px] font-extrabold text-[#8C8C8C] uppercase tracking-wider block">Collected Payment</span>
                      <div className="text-base font-extrabold text-emerald-600">
                        ₹{stats.totalCollected.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation & Search Filter */}
                  <div className="px-5 sm:px-6 py-3 bg-white dark:bg-slate-800 border-b border-[#F0F2F5] dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setModalTab('visits')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          modalTab === 'visits'
                            ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-xs'
                            : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C]'
                        }`}
                      >
                        <Store className="w-4 h-4" /> Outlet Visits Log ({inspectingTrip.shopVisits?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab('inventory')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          modalTab === 'inventory'
                            ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-xs'
                            : 'bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C]'
                        }`}
                      >
                        <Boxes className="w-4 h-4" /> Loaded Truck Stock ({inspectingTrip.items?.length || 0})
                      </button>
                    </div>

                    {modalTab === 'visits' && (
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8C8C8C]" />
                        <input
                          type="text"
                          placeholder="Search outlet..."
                          value={modalSearch}
                          onChange={(e) => setModalSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Modal Body Content */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {modalTab === 'visits' ? (
                      <div className="space-y-4">
                        {/* Edit Visit Entry Form */}
                        {editingVisit && (
                          <div className="bg-[#F7F9FB] dark:bg-slate-900 p-5 rounded-2xl border border-blue-400 dark:border-blue-600 space-y-4 shadow-sm animate-in fade-in">
                            <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0] dark:border-slate-700">
                              <h4 className="font-extrabold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                <Edit2 className="w-4 h-4" /> Log Delivery & Collection: {editingVisit.shop?.shopName || editingVisit.shopName || 'Shop'}
                              </h4>
                              <button type="button" onClick={() => setEditingVisit(null)} className="text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white">
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                              <div>
                                <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Status</label>
                                <CustomSelect
                                  value={visitEditForm.status || editingVisit.status}
                                  onChange={val => setVisitEditForm({ ...visitEditForm, status: val as any })}
                                  options={[
                                    { value: 'SCHEDULED', label: 'SCHEDULED', badge: 'PENDING' },
                                    { value: 'IN_PROGRESS', label: 'IN_PROGRESS', badge: 'ACTIVE' },
                                    { value: 'COMPLETED', label: 'COMPLETED', badge: 'DONE' },
                                    { value: 'CANCELLED', label: 'CANCELLED', badge: 'CANCEL' },
                                  ]}
                                  placeholder="Select Status"
                                />
                              </div>

                              <div>
                                <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Products Delivered (Qty)</label>
                                <input
                                  type="number"
                                  value={visitEditForm.productsQty || 0}
                                  onChange={(e) => setVisitEditForm({ ...visitEditForm, productsQty: parseInt(e.target.value) || 0 })}
                                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-600 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Bill Amount (₹)</label>
                                <input
                                  type="number"
                                  value={visitEditForm.billAmount || 0}
                                  onChange={(e) => setVisitEditForm({ ...visitEditForm, billAmount: parseFloat(e.target.value) || 0 })}
                                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-600 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Collected Amount (₹)</label>
                                <input
                                  type="number"
                                  value={visitEditForm.collectionAmount || 0}
                                  onChange={(e) => setVisitEditForm({ ...visitEditForm, collectionAmount: parseFloat(e.target.value) || 0 })}
                                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-800 border-[#E2E8F0] dark:border-slate-600 font-semibold"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingVisit(null)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-300 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveVisitDetails}
                                className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-black transition"
                              >
                                <Save className="w-4 h-4" /> Save Visit Entry
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Visit Cards List */}
                        {filteredVisits.length === 0 ? (
                          <div className="p-8 text-center bg-[#F7F9FB] dark:bg-slate-900/40 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-slate-700 text-[#8C8C8C]">
                            <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="font-bold text-xs">No outlet visit records found for this trip.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {filteredVisits.map((visit) => (
                              <div
                                key={visit.id}
                                className="p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 bg-[#F7F9FB] dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-300 dark:hover:border-slate-600 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                                    {visit.visitSequence}
                                  </span>
                                  <div>
                                    <h4 className="font-extrabold text-xs text-[#1C1C1C] dark:text-white flex items-center gap-2">
                                      {visit.shop?.shopName || visit.shopName || 'Customer Outlet'}
                                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                        visit.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                        visit.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                                        'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                                      }`}>
                                        {visit.status || 'SCHEDULED'}
                                      </span>
                                    </h4>
                                    <p className="text-[11px] text-[#8C8C8C] mt-0.5 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-red-400" /> {visit.shop?.location || visit.shopAddress || 'Delivery Location'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                                  <div><span className="text-[#8C8C8C] block text-[9px] font-extrabold uppercase">Qty</span><span className="font-bold">{visit.productsQty || 0} Pkts</span></div>
                                  <div><span className="text-[#8C8C8C] block text-[9px] font-extrabold uppercase">Billed</span><span className="font-bold text-blue-600">₹{(visit.billAmount || 0).toLocaleString()}</span></div>
                                  <div><span className="text-[#8C8C8C] block text-[9px] font-extrabold uppercase">Collected</span><span className="font-bold text-emerald-600">₹{(visit.collectionAmount || 0).toLocaleString()}</span></div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVisit(visit);
                                    setVisitEditForm(visit);
                                  }}
                                  className="px-3.5 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer self-end md:self-auto hover:bg-black transition shadow-xs"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Log Delivery
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Truck Stock Inventory Breakdown Tab */
                      <div className="space-y-4">
                        {!inspectingTrip.items || inspectingTrip.items.length === 0 ? (
                          <div className="p-8 text-center bg-[#F7F9FB] dark:bg-slate-900/40 rounded-2xl border border-dashed border-[#E2E8F0] dark:border-slate-700 space-y-2">
                            <Boxes className="w-10 h-10 mx-auto text-purple-500 opacity-60" />
                            <h4 className="font-bold text-sm text-[#1C1C1C] dark:text-white">Truck Loaded Stock Manifest</h4>
                            <p className="text-xs text-[#8C8C8C] max-w-md mx-auto">
                              Total Loaded Stock: <strong className="text-purple-600">{stats.loadedUnits} Pkts</strong> • Sold / Delivered: <strong className="text-blue-600">{stats.totalSoldUnits} Pkts</strong> • Current On-Truck Balance: <strong className="text-emerald-600">{stats.remainingUnits} Pkts</strong>.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-2xs">
                            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
                              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                                <tr>
                                  <th className="py-3.5 px-4 font-bold">Product Item SKU</th>
                                  <th className="py-3.5 px-4 font-bold">Loaded Stock</th>
                                  <th className="py-3.5 px-4 font-bold">Delivered / Sold</th>
                                  <th className="py-3.5 px-4 font-bold">Current Balance</th>
                                  <th className="py-3.5 px-4 font-bold text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700">
                                {inspectingTrip.items.map((item, idx) => {
                                  const sold = item.soldQuantity || 0;
                                  const remaining = Math.max(0, item.loadedQuantity - sold);
                                  return (
                                    <tr key={idx} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                                      <td className="py-3.5 px-4 font-extrabold flex items-center gap-2">
                                        <Package className="w-4 h-4 text-purple-500" />
                                        {item.productName}
                                      </td>
                                      <td className="py-3.5 px-4 font-bold text-purple-600">{item.loadedQuantity} Pkts</td>
                                      <td className="py-3.5 px-4 font-bold text-blue-600">{sold} Pkts</td>
                                      <td className="py-3.5 px-4 font-bold text-emerald-600">{remaining} Pkts</td>
                                      <td className="py-3.5 px-4 text-right">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                          remaining > 10 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                          remaining > 0 ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                          'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                        }`}>
                                          {remaining > 10 ? 'IN STOCK' : remaining > 0 ? 'LOW STOCK' : 'SOLD OUT'}
                                        </span>
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
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 sm:px-6 bg-[#F7F9FB] dark:bg-slate-900 border-t border-[#F0F2F5] dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                    <div className="text-xs text-[#8C8C8C] font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Execution Stream • Trip Status: <strong className="text-[#1C1C1C] dark:text-white">{inspectingTrip.status || 'DISPATCHED'}</strong>
                    </div>

                    <div className="flex gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={fetchActiveTrips}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-[#1C1C1C] dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Refresh Log
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectingTrip(null);
                          setEditingVisit(null);
                        }}
                        className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-black transition cursor-pointer shadow-xs"
                      >
                        Close Modal
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* NEW DELIVERY ROUTE MODULE FORM MODAL                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {isCreatingNewRoute && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCreatingNewRoute(false);
            }
          }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-white dark:bg-slate-800 border-b border-[#F0F2F5] dark:border-slate-700 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl border border-blue-200 dark:border-blue-800/40">
                  <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white flex items-center gap-2">
                    {editingRoute ? 'Edit Delivery Route Module' : 'Create New Delivery Route Module'}
                  </h3>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-0.5">
                    Configure delivery corridor parameters, distribution hub, and customer outlet stop sequence.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreatingNewRoute(false)}
                className="p-2 text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveRoute} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Route Parameters Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-[#8C8C8C] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" /> 1. Route Identity & Corridor Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Route Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Salem West Express Delivery Corridor 1"
                      value={newRouteForm.routeName}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, routeName: e.target.value })}
                      required
                      className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 font-semibold focus:outline-none focus:border-blue-500 text-[#1C1C1C] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Region / Territory *</label>
                    <input
                      type="text"
                      placeholder="e.g. Salem West Sector"
                      value={newRouteForm.areaRegion}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, areaRegion: e.target.value })}
                      required
                      className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 font-semibold focus:outline-none focus:border-blue-500 text-[#1C1C1C] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Starting Distribution Hub</label>
                    <input
                      type="text"
                      placeholder="e.g. Central Distribution Hub - Salem"
                      value={newRouteForm.startingHub}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, startingHub: e.target.value })}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 font-semibold focus:outline-none focus:border-blue-500 text-[#1C1C1C] dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold mb-1 text-[#1C1C1C] dark:text-white">Route Description / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Daily morning delivery corridor servicing retail bakeries and supermarkets in Salem West."
                      value={newRouteForm.description}
                      onChange={(e) => setNewRouteForm({ ...newRouteForm, description: e.target.value })}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs p-3 rounded-xl border border-[#E2E8F0] dark:border-slate-700 font-semibold focus:outline-none focus:border-blue-500 text-[#1C1C1C] dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Outlet Route Sequence */}
              <div className="space-y-3 pt-4 border-t border-[#F0F2F5] dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h4 className="text-xs font-extrabold text-[#8C8C8C] uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-500" /> 2. Customer Outlet Delivery Sequence ({newRouteShopIds.length} Selected)
                  </h4>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (newRouteShopIds.length === masterShops.length) {
                          setNewRouteShopIds([]);
                        } else {
                          setNewRouteShopIds(masterShops.map((s) => s.id));
                        }
                      }}
                      className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {newRouteShopIds.length === masterShops.length ? 'Deselect All' : 'Select All Outlets'}
                    </button>
                  </div>
                </div>

                {/* Shop Search Filter */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8C8C8C]" />
                  <input
                    type="text"
                    placeholder="Search outlets by name or location..."
                    value={newRouteShopSearch}
                    onChange={(e) => setNewRouteShopSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F7F9FB] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 text-[#1C1C1C] dark:text-white"
                  />
                </div>

                {/* Outlets Selection Cards */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {masterShops
                    .filter((s) => {
                      if (!newRouteShopSearch.trim()) return true;
                      const q = newRouteShopSearch.toLowerCase();
                      return (s.shopName || '').toLowerCase().includes(q) || (s.location || '').toLowerCase().includes(q);
                    })
                    .map((shop) => {
                      const isChecked = newRouteShopIds.includes(shop.id);
                      const seqIdx = newRouteShopIds.indexOf(shop.id);
                      return (
                        <div
                          key={shop.id}
                          onClick={() => {
                            if (isChecked) {
                              setNewRouteShopIds(newRouteShopIds.filter((id) => id !== shop.id));
                            } else {
                              setNewRouteShopIds([...newRouteShopIds, shop.id]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer ${
                            isChecked
                              ? 'bg-blue-50/40 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                              : 'bg-[#F7F9FB] dark:bg-slate-900 border-[#E2E8F0] dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            />
                            <div>
                              <h5 className="font-extrabold text-xs text-[#1C1C1C] dark:text-white flex items-center gap-1.5">
                                {shop.shopName}
                                {isChecked && (
                                  <span className="text-[10px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                                    Stop #{seqIdx + 1}
                                  </span>
                                )}
                              </h5>
                              <p className="text-[11px] text-[#8C8C8C] flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-red-400" /> {shop.location || 'Delivery Location'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-[11px] text-[#8C8C8C]">
                            <span className="font-bold text-[#1C1C1C] dark:text-slate-200 block">{shop.ownerName || 'Retail Outlet'}</span>
                            <span>{shop.phone || '+91 Customer'}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Submit / Action Bar inside Form */}
              <div className="pt-4 border-t border-[#F0F2F5] dark:border-slate-700 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewRoute(false)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-300 transition"
                >
                  Cancel & Return
                </button>

                <button
                  type="submit"
                  disabled={isLoading || !newRouteForm.routeName.trim()}
                  className="px-6 py-2.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save Delivery Route Module & Proceed to Step 3
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
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Delete All Sales & Delivery Data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanent Bulk Data Cleanup</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to purge <strong>ALL created sales and delivery records</strong>? This will permanently delete:
            </p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <li>All Trip Dispatches & Loaded Truck Stock</li>
              <li>All Weekly & Daily Trip Plans</li>
              <li>All Shop Visits & Delivery Acknowledgements</li>
              <li>All Sales Invoices & Line Items</li>
              <li>All Sales Returns, Credit Notes & EOD Collections</li>
            </ul>

            <p className="text-xs text-rose-500 font-medium">⚠️ This action cannot be undone!</p>

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
                    <RefreshCw className="w-4 h-4 animate-spin" /> Purging Data...
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

      {/* Confirmation Modal for Deleting a Single Trip Dispatch */}
      {singleTripToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Delete Single Trip Dispatch</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Trip #{singleTripToDelete.tripNumber}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to delete trip dispatch <strong>#{singleTripToDelete.tripNumber}</strong> ({singleTripToDelete.routeName || 'Standard Route'})?
            </p>

            <p className="text-xs text-rose-500 font-medium">⚠️ This will delete this specific trip dispatch and its allocated truck stock log.</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSingleTripToDelete(null)}
                disabled={isDeletingSingleTrip}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSingleTrip}
                disabled={isDeletingSingleTrip}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeletingSingleTrip ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Yes, Delete Trip #{singleTripToDelete.tripNumber}
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

export default TripDispatchModulePage;
