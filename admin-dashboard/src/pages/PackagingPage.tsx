import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/common';
import { 
  PackageCheck, 
  Boxes, 
  Layers, 
  ShoppingBag, 
  Container, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Printer, 
  Sparkles, 
  Clock, 
  Truck, 
  Tag, 
  Eye, 
  Check, 
  X, 
  SlidersHorizontal, 
  Archive, 
  BarChart3, 
  FileText, 
  ChevronRight, 
  Play, 
  QrCode, 
  ShieldCheck, 
  AlertCircle,
  Factory,
  Package
} from 'lucide-react';
import { 
  productionApi, 
  inventoryApi, 
  ProductionRunDTO, 
  productApi 
} from '../services/apiService';

export interface PackagingPreset {
  id: string;
  name: string;
  category: 'RUSK' | 'BUN' | 'BREAD' | 'OTHER';
  pricePoint?: string;
  packagingType: string;
  boxUnits: number;
  bundleUnits: number;
  coverUnits: number;
  tinUnits: number;
  badge: string;
  description: string;
}

export const PACKAGING_PRESETS: PackagingPreset[] = [
  {
    id: 'RUSK_10',
    name: '₹10 Toaster Rusk',
    category: 'RUSK',
    pricePoint: '₹10',
    packagingType: 'MIXED',
    boxUnits: 40,
    bundleUnits: 12,
    coverUnits: 0,
    tinUnits: 0,
    badge: '40/Box • 12/Bundle',
    description: '10 Rs Rusk: 40 packets per Box, 12 packets per Bundle'
  },
  {
    id: 'RUSK_20',
    name: '₹20 Toaster Rusk',
    category: 'RUSK',
    pricePoint: '₹20',
    packagingType: 'MIXED',
    boxUnits: 30,
    bundleUnits: 10,
    coverUnits: 0,
    tinUnits: 0,
    badge: '30/Box • 10/Bundle',
    description: '20 Rs Rusk: 30 packets per Box, 10 packets per Bundle'
  },
  {
    id: 'RUSK_30',
    name: '₹30 Toaster Rusk (1 Cover)',
    category: 'RUSK',
    pricePoint: '₹30',
    packagingType: 'COVER',
    boxUnits: 0,
    bundleUnits: 0,
    coverUnits: 63,
    tinUnits: 0,
    badge: '63/Cover',
    description: '30 Rs Rusk: 63 packets in 1 Master Cover'
  },
  {
    id: 'RUSK_TIN_3KG',
    name: '3kg Din / Tin Toaster Rusk',
    category: 'RUSK',
    packagingType: 'TIN_3KG',
    boxUnits: 0,
    bundleUnits: 0,
    coverUnits: 0,
    tinUnits: 1,
    badge: '3kg Din Pack',
    description: 'Commercial 3kg Din / Tin Container Pack'
  },
  {
    id: 'BUN_12',
    name: 'Sweet / Burger Bun (12 Bundle)',
    category: 'BUN',
    packagingType: 'BUNDLE',
    boxUnits: 0,
    bundleUnits: 12,
    coverUnits: 0,
    tinUnits: 0,
    badge: '12/Bundle',
    description: 'Bun: 12 buns per Master Bundle'
  },
  {
    id: 'BREAD_STD',
    name: 'Standard Bread (24 Box / 10 Bundle)',
    category: 'BREAD',
    packagingType: 'MIXED',
    boxUnits: 24,
    bundleUnits: 10,
    coverUnits: 0,
    tinUnits: 0,
    badge: '24/Box • 10/Bundle',
    description: 'Standard Bread: 24 loaves per Box, 10 loaves per Bundle'
  }
];

type ActiveTab = 'WORKSTATION' | 'PACKAGED_STOCK' | 'LABELS_MANIFEST' | 'MATERIALS';

export const PackagingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('WORKSTATION');
  const [runs, setRuns] = useState<ProductionRunDTO[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Selected Run for Packaging Form / Modal
  const [selectedRun, setSelectedRun] = useState<ProductionRunDTO | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);
  const [manifestPrintRun, setManifestPrintRun] = useState<ProductionRunDTO | null>(null);

  // Packaging Form State
  const [packagingForm, setPackagingForm] = useState({
    boxCount: 20,
    unitsPerBox: 40,
    bundleCount: 16,
    unitsPerBundle: 12,
    coverCount: 0,
    unitsPerCover: 63,
    tinCount: 0,
    looseUnits: 8,
    packagingType: 'MIXED',
    selectedPresetId: 'RUSK_10',
    packagingNotes: ''
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [runsRes, prodsRes] = await Promise.all([
        productionApi.getAll().catch(() => ({ data: [] })),
        productApi.getAll().catch(() => ({ data: [] }))
      ]);

      setRuns(runsRes.data || []);
      setProducts(prodsRes.data || []);
    } catch (err: any) {
      console.error('Error loading packaging data:', err);
      showToast('Error syncing packaging module data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Auto Allocation by Preset ────────────────────────────────────────────

  const applyPackagingPreset = (preset: PackagingPreset, totalOutput: number) => {
    let boxes = 0;
    let bundles = 0;
    let covers = 0;
    let tins = 0;
    let loose = 0;

    if (preset.id === 'RUSK_10') {
      const boxPortion = Math.floor((totalOutput * 0.6) / 40);
      boxes = boxPortion;
      const remAfterBox = totalOutput - (boxes * 40);
      bundles = Math.floor(remAfterBox / 12);
      loose = remAfterBox - (bundles * 12);
    } else if (preset.id === 'RUSK_20') {
      const boxPortion = Math.floor((totalOutput * 0.6) / 30);
      boxes = boxPortion;
      const remAfterBox = totalOutput - (boxes * 30);
      bundles = Math.floor(remAfterBox / 10);
      loose = remAfterBox - (bundles * 10);
    } else if (preset.id === 'RUSK_30') {
      covers = Math.floor(totalOutput / 63);
      loose = totalOutput - (covers * 63);
    } else if (preset.id === 'RUSK_TIN_3KG') {
      tins = Math.max(1, Math.floor(totalOutput / 3));
      loose = 0;
    } else if (preset.id === 'BUN_12') {
      bundles = Math.floor(totalOutput / 12);
      loose = totalOutput - (bundles * 12);
    } else {
      const boxPortion = Math.floor((totalOutput * 0.6) / 24);
      boxes = boxPortion;
      const remAfterBox = totalOutput - (boxes * 24);
      bundles = Math.floor(remAfterBox / 10);
      loose = remAfterBox - (bundles * 10);
    }

    setPackagingForm({
      boxCount: boxes,
      unitsPerBox: preset.boxUnits || 40,
      bundleCount: bundles,
      unitsPerBundle: preset.bundleUnits || 12,
      coverCount: covers,
      unitsPerCover: preset.coverUnits || 63,
      tinCount: tins,
      looseUnits: loose,
      packagingType: preset.packagingType,
      selectedPresetId: preset.id,
      packagingNotes: preset.description
    });
  };

  const handleOpenPackModal = (run: ProductionRunDTO) => {
    setSelectedRun(run);
    const targetOutput = run.actualProducedQuantity || run.plannedQuantity || 1000;
    const prodName = (run.productName || '').toLowerCase();

    let matchedPreset = PACKAGING_PRESETS[0];
    if (prodName.includes('bun')) {
      matchedPreset = PACKAGING_PRESETS.find(p => p.id === 'BUN_12') || PACKAGING_PRESETS[4];
    } else if (prodName.includes('30') && prodName.includes('rusk')) {
      matchedPreset = PACKAGING_PRESETS.find(p => p.id === 'RUSK_30') || PACKAGING_PRESETS[2];
    } else if (prodName.includes('20') && prodName.includes('rusk')) {
      matchedPreset = PACKAGING_PRESETS.find(p => p.id === 'RUSK_20') || PACKAGING_PRESETS[1];
    } else if (prodName.includes('3kg') || prodName.includes('din') || prodName.includes('tin')) {
      matchedPreset = PACKAGING_PRESETS.find(p => p.id === 'RUSK_TIN_3KG') || PACKAGING_PRESETS[3];
    } else if (prodName.includes('rusk') || prodName.includes('toster')) {
      matchedPreset = PACKAGING_PRESETS.find(p => p.id === 'RUSK_10') || PACKAGING_PRESETS[0];
    } else {
      matchedPreset = PACKAGING_PRESETS.find(p => p.id === 'BREAD_STD') || PACKAGING_PRESETS[5];
    }

    applyPackagingPreset(matchedPreset, targetOutput);
    setIsPackModalOpen(true);
  };

  const handleSavePackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRun) return;

    try {
      await productionApi.savePackaging(selectedRun.id, packagingForm);
      showToast(`📦 Packaging manifest saved for batch ${selectedRun.batchNumber}`);
      setIsPackModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast('Error saving packaging: ' + (err.response?.data?.message || err.message));
    }
  };

  // ─── Filtered Runs ────────────────────────────────────────────────────────

  const activeWorkstationRuns = useMemo(() => {
    return runs.filter(r => {
      const isReadyToPack = r.currentStage === 'STAGE_3_ROLL_PACKAGING' || r.currentStage === 'STAGE_2_SLICE_PACK_STACK' || r.status === 'IN_PROGRESS';
      const matchesSearch = !searchQuery || 
        r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchQuery.toLowerCase());
      return isReadyToPack && matchesSearch;
    });
  }, [runs, searchQuery]);

  const allPackagedRuns = useMemo(() => {
    return runs.filter(r => (r.boxCount && r.boxCount > 0) || (r.bundleCount && r.bundleCount > 0) || (r.coverCount && r.coverCount > 0) || (r.tinCount && r.tinCount > 0));
  }, [runs]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalBoxes = 0;
    let totalBundles = 0;
    let totalCovers = 0;
    let totalTins = 0;
    let totalLoose = 0;

    runs.forEach(r => {
      totalBoxes += r.boxCount || 0;
      totalBundles += r.bundleCount || 0;
      totalCovers += r.coverCount || 0;
      totalTins += r.tinCount || 0;
      totalLoose += r.looseUnits || 0;
    });

    return {
      totalBoxes,
      totalBundles,
      totalCovers,
      totalTins,
      totalLoose,
      pendingBatches: activeWorkstationRuns.length
    };
  }, [runs, activeWorkstationRuns]);

  // Total allocated for modal form
  const totalModalPackaged = useMemo(() => {
    const boxTotal = packagingForm.boxCount * packagingForm.unitsPerBox;
    const bundleTotal = packagingForm.bundleCount * packagingForm.unitsPerBundle;
    const coverTotal = packagingForm.coverCount * packagingForm.unitsPerCover;
    const tinTotal = packagingForm.tinCount * 3;
    return boxTotal + bundleTotal + coverTotal + tinTotal + packagingForm.looseUnits;
  }, [packagingForm]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── Top Header & Global Actions with Integrated Module Nav ─────── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
        {/* Row 1: Title, Badge & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
                Finished Products Bulk Packaging & Dispatch Module
              </h1>
              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                <PackageCheck className="w-3 h-3 text-purple-500" />
                Packaging Floor
              </span>
            </div>
            <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
              Manage carton boxes, poly bundles, master covers (63s), 3kg din tins, shipping labels & dispatch manifests.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
              title="Refresh Packaging Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {activeWorkstationRuns.length > 0 && (
              <button
                onClick={() => handleOpenPackModal(activeWorkstationRuns[0])}
                className="px-4 py-2 bg-[#1C1C1C] dark:bg-purple-600 hover:bg-black dark:hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              >
                <Boxes className="w-4 h-4" /> Pack Active Batch
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Clean Connected Workflow Module Navigation Bar (Single Line Pill Style) */}
        <div className="pt-3 border-t border-[#F0F2F5] dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Connected Plant Workflow:
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => navigate('/production')}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#FFF9EB] hover:bg-[#FEF3C7] text-[#B45309] dark:bg-amber-950/40 dark:text-amber-300 border border-[#FDE68A] dark:border-amber-800/60 rounded-full text-xs font-bold transition shadow-2xs whitespace-nowrap cursor-pointer active:scale-95 shrink-0"
            >
              <Factory className="w-3.5 h-3.5 text-[#D97706]" />
              <span>3-Stage Production ➔</span>
            </button>

            <button
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/40 dark:text-emerald-300 border border-[#BBF7D0] dark:border-emerald-800/60 rounded-full text-xs font-bold transition shadow-2xs whitespace-nowrap cursor-pointer active:scale-95 shrink-0"
            >
              <Archive className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Central Inventory ➔</span>
            </button>

            <button
              onClick={() => navigate('/truck-inventory')}
              className="flex items-center gap-2 px-4 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] dark:bg-indigo-950/40 dark:text-indigo-300 border border-[#C7D2FE] dark:border-indigo-800/60 rounded-full text-xs font-bold transition shadow-2xs whitespace-nowrap cursor-pointer active:scale-95 shrink-0"
            >
              <Truck className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Truck Hub ➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Metric KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Carton Boxes */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Carton Boxes (Supermarkets)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Boxes className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{metrics.totalBoxes} Boxes</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">40/Box (₹10 Rusk), 30/Box (₹20 Rusk), 24/Box (Bread)</div>
          </div>
        </div>

        {/* Poly Bundles */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Poly Bundles (Kirana Stores)</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 leading-none">{metrics.totalBundles} Bundles</div>
            <div className="text-[11px] text-indigo-600 font-semibold pt-0.5">12/Bundle (Bun, ₹10 Rusk), 10/Bundle (₹20 Rusk)</div>
          </div>
        </div>

        {/* Master Covers & 3kg Din Tins */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Master Covers & 3kg Tins</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{metrics.totalCovers} Cov / {metrics.totalTins} Tins</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">63/Cover (₹30 Rusk) • 3kg Commercial Din Tins</div>
          </div>
        </div>

        {/* Pending Floor Batches */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Pending Line Batches</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Factory className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">{metrics.pendingBatches} Batches</div>
            <div className="text-[11px] text-rose-500 font-semibold pt-0.5">Ready on Stage 3 Roll Packing Floor</div>
          </div>
        </div>
      </div>

      {/* ─── Tabs Navigation Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F0F2F5] dark:border-slate-700 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { key: 'WORKSTATION', label: 'Packaging Workstation', icon: Boxes, count: activeWorkstationRuns.length },
            { key: 'PACKAGED_STOCK', label: 'Packaged Inventory Vault', icon: PackageCheck, count: allPackagedRuns.length },
            { key: 'LABELS_MANIFEST', label: 'Shipping Labels & Manifests', icon: QrCode },
            { key: 'MATERIALS', label: 'Packaging Materials Inventory', icon: Archive },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-[#F0F2F5] dark:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batch, product, packaging..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-2xs"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. ACTIVE PACKAGING WORKSTATION TAB                                     */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'WORKSTATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeWorkstationRuns.length === 0 ? (
              <div className="col-span-3 py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">All Production Batches Packaged!</p>
                <p className="text-xs text-slate-400 mt-1">No batches currently waiting in Stage 3 Roll Packing floor</p>
              </div>
            ) : (
              activeWorkstationRuns.map(run => {
                const targetOutput = run.actualProducedQuantity || run.plannedQuantity || 1000;
                return (
                  <div
                    key={run.id}
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white block">
                            {run.batchNumber}
                          </span>
                          <h3 className="text-sm font-black text-purple-700 dark:text-purple-400 mt-0.5">
                            {run.productName}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl text-xs font-black font-mono bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {targetOutput} pcs
                        </span>
                      </div>

                      {/* Current Packaging Manifest Snapshot */}
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
                          <span>Current Packaging:</span>
                          <span className="font-mono text-purple-600 font-bold">{run.packagingType || 'NOT_PACKAGED'}</span>
                        </div>

                        <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-400 block text-[9px]">Boxes</span>
                            <strong>{run.boxCount || 0}</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-400 block text-[9px]">Bundles</span>
                            <strong>{run.bundleCount || 0}</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-400 block text-[9px]">Covers</span>
                            <strong>{run.coverCount || 0}</strong>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-slate-400 block text-[9px]">3kg Tins</span>
                            <strong>{run.tinCount || 0}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setManifestPrintRun(run)}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Label
                      </button>

                      <button
                        onClick={() => handleOpenPackModal(run)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Boxes className="w-3.5 h-3.5" /> Pack Batch
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
      {/* 2. PACKAGED INVENTORY VAULT TAB                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PACKAGED_STOCK' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F0F2F5] dark:border-slate-700 bg-[#F8F9FA] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Batch Number</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-center">Carton Boxes</th>
                  <th className="py-3.5 px-4 text-center">Poly Bundles</th>
                  <th className="py-3.5 px-4 text-center">Master Covers (63s)</th>
                  <th className="py-3.5 px-4 text-center">3kg Din Tins</th>
                  <th className="py-3.5 px-4 text-center">Loose Units</th>
                  <th className="py-3.5 px-4">Packaging Manifest Notes</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
                {allPackagedRuns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No packaged inventory batches found.
                    </td>
                  </tr>
                ) : (
                  allPackagedRuns.map(run => (
                    <tr key={run.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {run.batchNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {run.productName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-purple-600">
                        {run.boxCount ? `${run.boxCount} (${run.unitsPerBox}/b)` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                        {run.bundleCount ? `${run.bundleCount} (${run.unitsPerBundle}/b)` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-600">
                        {run.coverCount ? `${run.coverCount} (${run.unitsPerCover}/c)` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-cyan-600">
                        {run.tinCount ? `${run.tinCount} Tins` : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500">
                        {run.looseUnits || 0}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 truncate max-w-xs">
                        {run.packagingNotes || 'Standard Batch Packaging'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenPackModal(run)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-purple-600 rounded-lg transition"
                          title="Edit Packaging"
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
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. SHIPPING LABELS & MANIFESTS TAB                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'LABELS_MANIFEST' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Batch Shipping & Packaging Manifest Print Station
                </h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {runs.slice(0, 6).map(run => (
                <div key={run.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">{run.batchNumber}</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                        {run.packagingType || 'STANDARD'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {run.productName} • {run.boxCount || 0} Boxes, {run.bundleCount || 0} Bundles, {run.coverCount || 0} Covers, {run.tinCount || 0} Tins
                    </p>
                  </div>

                  <button
                    onClick={() => setManifestPrintRun(run)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Manifest & Barcode
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Label Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Printer className="w-4 h-4 text-purple-600" />
              Standard Box Label Preview
            </h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl space-y-3 font-mono">
              <div className="flex items-center justify-between border-b pb-2 border-slate-300 dark:border-slate-700">
                <span className="font-black text-xs text-slate-900 dark:text-white">GEMINI FOODS B2B</span>
                <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded font-bold">EXPORT GRADE</span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {manifestPrintRun ? manifestPrintRun.productName : '₹10 TOASTER RUSK (40 PACKS)'}
                </p>
                <p className="text-[10px] text-slate-500">BATCH: {manifestPrintRun ? manifestPrintRun.batchNumber : 'BATCH-20260816-042'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[8px]">PKG FORMAT:</span>
                  <strong>{manifestPrintRun?.packagingType || 'CARTON BOX (40 PKT)'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px]">NET WT / COUNT:</span>
                  <strong>40 UNITS / BOX</strong>
                </div>
              </div>

              <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-800">
                <div className="inline-block px-3 py-1 bg-black text-white text-[10px] font-mono tracking-widest rounded">
                  *||| |||| || ||||| ||||*
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. PACKAGING MATERIALS STOCK TAB                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'MATERIALS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'Corrugated 5-Ply Carton Boxes', stock: '2,450 pcs', threshold: '500 pcs', status: 'IN_STOCK' },
            { name: 'Rusk Master Poly Covers (63s)', stock: '4,800 pcs', threshold: '1,000 pcs', status: 'IN_STOCK' },
            { name: '3kg Din Commercial Tin Containers', stock: '320 tins', threshold: '100 tins', status: 'IN_STOCK' },
            { name: 'Polybag Heat-Sealing Rolls', stock: '85 rolls', threshold: '20 rolls', status: 'IN_STOCK' },
            { name: '12-Bun Poly Bundling Sleeves', stock: '6,200 sleeves', threshold: '1,500 sleeves', status: 'IN_STOCK' },
            { name: 'Heavy Duty Box Strapping Bands', stock: '42 rolls', threshold: '10 rolls', status: 'IN_STOCK' },
          ].map((mat, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">{mat.name}</span>
                <Archive className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-black font-mono text-purple-600">{mat.stock}</span>
                <span className="text-[10px] text-slate-400">Available</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Reorder Level:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{mat.threshold}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL: PACKAGING CONFIGURATION & ALLOCATION                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isPackModalOpen && selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <PackageCheck className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Bulk Packaging Workstation
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Product: <strong className="text-white">{selectedRun.productName}</strong> ({selectedRun.batchNumber}) • Total Output: <strong className="text-amber-300 font-mono">{selectedRun.actualProducedQuantity || selectedRun.plannedQuantity} pcs</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPackModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackaging} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Category Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Select Industry Packaging Rule / Preset:</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">Click preset to auto-allocate batch</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PACKAGING_PRESETS.map(preset => {
                    const isSelected = packagingForm.selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const total = selectedRun.actualProducedQuantity || selectedRun.plannedQuantity || 1000;
                          applyPackagingPreset(preset, total);
                        }}
                        className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[11px] truncate">{preset.name}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded font-mono ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                            {preset.badge}
                          </span>
                        </div>
                        <p className={`text-[9px] mt-1 leading-tight ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Carton Box Packaging Section */}
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-purple-900 dark:text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-purple-600" />
                    1. Carton Box Packaging (Supermarkets & Wholesale)
                  </span>
                  <span className="font-mono text-purple-700 dark:text-purple-400">
                    Total: {packagingForm.boxCount * packagingForm.unitsPerBox} pcs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Number of Carton Boxes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={packagingForm.boxCount}
                      onChange={e => setPackagingForm(prev => ({ ...prev, boxCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Packs per Box (e.g. 40 for ₹10 Rusk, 30 for ₹20 Rusk, 24 for Bread)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={packagingForm.unitsPerBox}
                      onChange={e => setPackagingForm(prev => ({ ...prev, unitsPerBox: parseInt(e.target.value, 10) || 24 }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Poly Bundle Packaging Section */}
              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-indigo-900 dark:text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    2. Poly Bundle Packaging (Kirana Stores & Retail)
                  </span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-400">
                    Total: {packagingForm.bundleCount * packagingForm.unitsPerBundle} pcs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Number of Bundles
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={packagingForm.bundleCount}
                      onChange={e => setPackagingForm(prev => ({ ...prev, bundleCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Packs per Bundle (e.g. 12 for ₹10 Rusk / Bun, 10 for ₹20 Rusk / Bread)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={packagingForm.unitsPerBundle}
                      onChange={e => setPackagingForm(prev => ({ ...prev, unitsPerBundle: parseInt(e.target.value, 10) || 12 }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Master Cover & 3kg Din / Tin Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-900 dark:text-amber-300">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      3. Master Covers (₹30 Rusk)
                    </span>
                    <span className="font-mono text-amber-700">{packagingForm.coverCount * packagingForm.unitsPerCover} pcs</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Covers</label>
                      <input
                        type="number"
                        min="0"
                        value={packagingForm.coverCount}
                        onChange={e => setPackagingForm(prev => ({ ...prev, coverCount: parseInt(e.target.value, 10) || 0 }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Packs / Cover (63)</label>
                      <input
                        type="number"
                        min="1"
                        value={packagingForm.unitsPerCover}
                        onChange={e => setPackagingForm(prev => ({ ...prev, unitsPerCover: parseInt(e.target.value, 10) || 63 }))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 rounded-2xl border border-cyan-200 dark:border-cyan-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-cyan-900 dark:text-cyan-300">
                    <span className="flex items-center gap-1">
                      <Container className="w-3.5 h-3.5 text-cyan-600" />
                      4. 3kg Din / Tin Containers
                    </span>
                    <span className="font-mono text-cyan-700">{packagingForm.tinCount * 3} kg</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-bold mb-0.5">Number of 3kg Tins</label>
                    <input
                      type="number"
                      min="0"
                      value={packagingForm.tinCount}
                      onChange={e => setPackagingForm(prev => ({ ...prev, tinCount: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Loose / Buffer Loaves */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remaining Loose Buffer Packets / Loaves
                </label>
                <input
                  type="number"
                  min="0"
                  value={packagingForm.looseUnits}
                  onChange={e => setPackagingForm(prev => ({ ...prev, looseUnits: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              {/* Live Allocation Summary */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Allocated to Packaging:</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-black text-sm">
                    {totalModalPackaged} / {selectedRun.actualProducedQuantity || selectedRun.plannedQuantity} pcs
                  </span>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400">Status: </span>
                  <strong className={totalModalPackaged === (selectedRun.actualProducedQuantity || selectedRun.plannedQuantity) ? 'text-emerald-600' : 'text-amber-600'}>
                    {totalModalPackaged === (selectedRun.actualProducedQuantity || selectedRun.plannedQuantity) ? '✓ 100% Balanced' : `${Math.abs(totalModalPackaged - (selectedRun.actualProducedQuantity || selectedRun.plannedQuantity))} variance`}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Packaging Manifest Notes
                </label>
                <textarea
                  rows={2}
                  value={packagingForm.packagingNotes}
                  onChange={e => setPackagingForm(prev => ({ ...prev, packagingNotes: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  placeholder="e.g. Tagged for Supermarket Delivery Route 1"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPackModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Packaging Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
