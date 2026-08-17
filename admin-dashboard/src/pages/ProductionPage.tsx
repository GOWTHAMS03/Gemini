import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '../components/common';
import { 
  Factory, 
  Plus, 
  Trash2, 
  X, 
  Search, 
  Filter, 
  Edit, 
  Calculator, 
  TrendingUp, 
  CheckCircle2, 
  DollarSign, 
  Package, 
  Layers, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Scale, 
  ShieldCheck, 
  Percent, 
  Boxes, 
  SlidersHorizontal, 
  RefreshCw, 
  Sliders, 
  Flame, 
  Timer, 
  Activity, 
  Award, 
  ArrowRight, 
  Printer, 
  ShieldAlert, 
  FileText, 
  Truck, 
  PackageCheck, 
  Thermometer, 
  ChevronRight,
  Play,
  Check,
  Zap,
  Clock,
  Archive,
  Grid,
  Kanban,
  Repeat,
  ShoppingBag,
  Box,
  Container,
  Tag,
  List,
  LayoutGrid
} from 'lucide-react';
import { 
  productionApi, 
  ProductionRunDTO, 
  ProductionStatus, 
  ProductionStage, 
  ProductionShift, 
  ProductionKpisResponse, 
  BOMPreviewResponse,
  productApi
} from '../services/apiService';

export interface StageSubStep {
  name: string;
  desc: string;
}

export interface ProductionStageDef {
  key: ProductionStage;
  stageNo: number;
  label: string;
  shortName: string;
  icon: any;
  color: string;
  accentBg: string;
  borderColor: string;
  badgeColor: string;
  description: string;
  subSteps: StageSubStep[];
}

export const THREE_STAGES: ProductionStageDef[] = [
  {
    key: 'STAGE_1_PREP_BAKE_COOL',
    stageNo: 1,
    label: 'Stage 1: Prep, Baking & Cooling',
    shortName: 'Dough Prep & Baking',
    icon: Flame,
    color: 'text-amber-600 dark:text-amber-400',
    accentBg: 'bg-amber-500/10 dark:bg-amber-900/30',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
    description: 'Raw ingredients mixing, loaf portioning, tunnel oven baking, and cooling conveyor',
    subSteps: [
      { name: '1. Mixing', desc: 'Flour, yeast, water spiral mixing & kneading' },
      { name: '2. Cup / Dough Divide', desc: 'Portion scaling, cup dividing & resting' },
      { name: '3. Oven Baking', desc: 'Tunnel oven baking at 225°C crust caramelization' },
      { name: '4. Cooling & Dry', desc: 'Spiral cooling conveyor & bread rack drying' },
    ]
  },
  {
    key: 'STAGE_2_SLICE_PACK_STACK',
    stageNo: 2,
    label: 'Stage 2: Slicing, Packing & Stacker',
    shortName: 'Slicing & Stacking',
    icon: Boxes,
    color: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-500/10 dark:bg-blue-900/30',
    borderColor: 'border-blue-500/30',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    description: 'Precision slicing, primary polybag packing, and automatic plate stacker',
    subSteps: [
      { name: '1. Slicing & Packing', desc: 'High-speed precision slicing & bag flow-wrap' },
      { name: '2. Stacker', desc: 'Stacker transition (horizontal to plate, plate to horizontal)' },
    ]
  },
  {
    key: 'STAGE_3_ROLL_PACKAGING',
    stageNo: 3,
    label: 'Stage 3: Roll Packing & Bulk Packaging',
    shortName: 'Packaging Module',
    icon: PackageCheck,
    color: 'text-purple-600 dark:text-purple-400',
    accentBg: 'bg-purple-500/10 dark:bg-purple-900/30',
    borderColor: 'border-purple-500/30',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    description: 'Roll packing & secondary carton box, poly bundle, and crate packing module',
    subSteps: [
      { name: '1. Roll Packing', desc: 'Secondary roll packing & poly bundling' },
      { name: '2. Packaging Module', desc: 'Boxes, Bundles, Covers & Din/Tin Packaging Management' },
    ]
  },
  {
    key: 'STAGE_COMPLETED',
    stageNo: 4,
    label: 'Completed & Dispatched',
    shortName: 'QC & Handover',
    icon: ShieldCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-500/10 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    description: 'Quality release, finished goods deposit, and van loading handover',
    subSteps: [
      { name: '1. QC Inspection', desc: 'Weight check, moisture, crust coloration pass' },
      { name: '2. Warehouse Transfer', desc: 'Deposited to Finished Goods Inventory' },
    ]
  }
];

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
  description: string;
  badge: string;
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

export interface ProductProcessStep {
  name: string;
  desc: string;
}

export interface ProductStageDetail {
  stageNo: number;
  label: string;
  shortName: string;
  description: string;
  temp?: string;
  subSteps: ProductProcessStep[];
}

export interface ProductPipelineConfig {
  type: 'RUSK' | 'BUN' | 'BREAD';
  title: string;
  tagline: string;
  badge: string;
  badgeColor: string;
  stages: ProductStageDetail[];
}

export const PRODUCT_PIPELINES: Record<'RUSK' | 'BUN' | 'BREAD', ProductPipelineConfig> = {
  RUSK: {
    type: 'RUSK',
    title: 'Double-Bake & Crisping Process (Rusk)',
    tagline: 'Sponge ➔ 1st Bake (210°C) ➔ 12-24h Loaf Rest ➔ Precision Slicing ➔ 2nd Toasting (160°C) ➔ Packaging',
    badge: 'Double-Bake Process',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300',
    stages: [
      {
        stageNo: 1,
        label: 'Stage 1: Sponge Mix & 1st Baking (210°C)',
        shortName: '1st Bake & Conditioning',
        description: 'Sponge mixing, loaf pan portion scaling, 1st bake (210°C), and 12-24hr loaf conditioning/resting for firmness.',
        temp: '210°C (1st Bake)',
        subSteps: [
          { name: '1. Sponge Mixing', desc: 'Flour, yeast, sugar spiral sponge mixing' },
          { name: '2. Pan Scaling', desc: 'Loaf divider & pan portion scaling' },
          { name: '3. 1st Tunnel Bake', desc: '1st baking at 210°C for loaf crumb structure' },
          { name: '4. Loaf Conditioning', desc: 'De-panning & 12-24 hr resting for slicing firmness' }
        ]
      },
      {
        stageNo: 2,
        label: 'Stage 2: Precision Slicing & 2nd Toasting (160°C)',
        shortName: 'Slicing & 2nd Bake',
        description: 'High-speed slicing into uniform rusk slices, tray layout, and 2nd slow toasting bake for signature crunch.',
        temp: '160°C (2nd Toasting)',
        subSteps: [
          { name: '1. High-Speed Slicing', desc: 'Precision multi-blade slicing into uniform rusk pieces' },
          { name: '2. Tray Arrangement', desc: 'Automatic flat layout on baking racks' },
          { name: '3. 2nd Toasting Oven', desc: 'Slow double-bake at 160°C for moisture dry & golden crunch' },
          { name: '4. Tray Cooling', desc: 'Crisp cooling prior to primary flow-wrapping' }
        ]
      },
      {
        stageNo: 3,
        label: 'Stage 3: Variant Bulk Packaging Module',
        shortName: 'Packaging Module',
        description: '₹10 Rusk (40/12), ₹20 Rusk (30/10), ₹30 Rusk (63 Cover), 3kg Din Tins.',
        subSteps: [
          { name: '1. Primary Flow-Wrap', desc: 'Sealing individual consumer packs' },
          { name: '2. Carton & Poly Bundles', desc: '₹10 (40/12), ₹20 (30/10), ₹30 (63s), 3kg Din Tins' }
        ]
      },
      {
        stageNo: 4,
        label: 'Stage 4: QC Release & Warehouse Deposit',
        shortName: 'QC & Handover',
        description: 'Moisture <4% and golden color QC check ➔ Deposit to Finished Goods.',
        subSteps: [
          { name: '1. Crispness QC Check', desc: 'Moisture <4% and golden color QC inspection' },
          { name: '2. Warehouse Transfer', desc: 'Deposited to Finished Goods for truck loading' }
        ]
      }
    ]
  },
  BUN: {
    type: 'BUN',
    title: 'Bun Proofing & Direct Poly-Bundle Process',
    tagline: 'Sweet Dough Mixing ➔ Rounder Balling ➔ Proofer Chamber (38°C) ➔ Glazed Oven (200°C) ➔ 12-Bun Bagging (No Slicing)',
    badge: 'Proofer • No Slicing',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-300',
    stages: [
      {
        stageNo: 1,
        label: 'Stage 1: Dough Mixing & Proofer (38°C / 85% RH)',
        shortName: 'Mixing & Proofer Bake',
        description: 'High-gluten sweet dough kneading, automated ball dividing, 38°C humidity proofer rising, and 200°C glazed oven bake.',
        temp: '38°C Proofer / 200°C Bake',
        subSteps: [
          { name: '1. Sweet Dough Mixing', desc: 'High-gluten flour, milk, sugar & yeast knead' },
          { name: '2. Rounder Balling', desc: 'Automated rounder & bun ball portioning' },
          { name: '3. Humidity Proofer', desc: '38°C / 85% RH proofer chamber rising (45 min)' },
          { name: '4. Glazed Oven Bake', desc: 'Oven baking at 200°C with golden egg/sugar glaze' }
        ]
      },
      {
        stageNo: 2,
        label: 'Stage 2: Spiral Cooling & 12-Bun Polybagging (No Slicing)',
        shortName: 'Cooling & 12-Bun Bagging',
        description: 'Direct spiral cooling and automatic 12-bun polybag flow-wrapping. *Buns bypass the bread slicing machine!*',
        subSteps: [
          { name: '1. Spiral Cooling', desc: 'Cooling down to ambient packaging temperature' },
          { name: '2. 12-Bun Bagging', desc: 'Direct 12-bun polybag insertion & heat sealing' },
          { name: '3. Date Coding', desc: 'Automated batch number & expiry date printing' }
        ]
      },
      {
        stageNo: 3,
        label: 'Stage 3: Dispatch Crates & Master Bundles',
        shortName: 'Packaging Module',
        description: 'Packaging 12-bun poly bundles into dispatch plastic crates for route trucks.',
        subSteps: [
          { name: '1. Poly Bundling', desc: '12 buns / bundle master packaging' },
          { name: '2. Crate Loading', desc: 'Stacking bundles into plastic dispatch crates for trucks' }
        ]
      },
      {
        stageNo: 4,
        label: 'Stage 4: Softness QC & Warehouse Deposit',
        shortName: 'QC & Handover',
        description: 'Crust softness & seal check ➔ Deposit to Finished Goods.',
        subSteps: [
          { name: '1. Softness & Seal QC', desc: 'Crust softness & thermal seal hermetic audit' },
          { name: '2. Warehouse Transfer', desc: 'Deposited to Finished Goods for truck loading' }
        ]
      }
    ]
  },
  BREAD: {
    type: 'BREAD',
    title: 'Standard Loaf Baking, Precision Slicing & Stacker',
    tagline: 'Spiral Mix ➔ Pan Moulding ➔ Tunnel Oven (225°C) ➔ Spiral Cooling ➔ High-Speed Slicing ➔ Plate Stacker ➔ 24/Box & 10/Bundle',
    badge: 'Single Loaf • Slicing & Stacker',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-300',
    stages: [
      {
        stageNo: 1,
        label: 'Stage 1: Spiral Mixing, Pan Moulding & Baking (225°C)',
        shortName: 'Dough Prep & Baking',
        description: 'Spiral dough mixing, volumetric pan dividing, loaf moulding, 225°C tunnel oven baking, and automated spiral cooling.',
        temp: '225°C (Baking)',
        subSteps: [
          { name: '1. Spiral Mixing', desc: 'Wheat flour, yeast, oil & salt high-speed knead' },
          { name: '2. Pan Dividing', desc: 'Volumetric dividing & loaf moulding into bread pans' },
          { name: '3. Tunnel Oven Bake', desc: 'Tunnel oven baking at 225°C for 28 mins' },
          { name: '4. De-panning & Cool', desc: 'Automated suction de-panning & spiral cooling' }
        ]
      },
      {
        stageNo: 2,
        label: 'Stage 2: High-Speed Slicing, Bagging & Plate Stacker',
        shortName: 'Slicing & Stacking',
        description: 'Multi-blade slicing of single loaf pieces, polybag flow-wrapping, and automatic plate stacker transition.',
        subSteps: [
          { name: '1. Multi-Blade Slice', desc: 'High-speed precision blade slicing of whole loaf' },
          { name: '2. Polybag Bagging', desc: 'Flow-wrap polybag insertion with twist-tie or tape' },
          { name: '3. Plate Stacker', desc: 'Automatic plate stacker transition for crate loading' }
        ]
      },
      {
        stageNo: 3,
        label: 'Stage 3: Carton Boxes (24s) & Poly Bundles (10s)',
        shortName: 'Packaging Module',
        description: '24 loaves per carton box (Supermarkets) / 10 loaves per bundle (Retailers).',
        subSteps: [
          { name: '1. 24/Box Supermarkets', desc: '24 loaves per carton box for supermarkets & wholesale' },
          { name: '2. 10/Bundle Retail', desc: '10 loaves per poly bundle for kirana stores' }
        ]
      },
      {
        stageNo: 4,
        label: 'Stage 4: QC Release & Warehouse Deposit',
        shortName: 'QC & Handover',
        description: 'Loaf weight & slice count audit ➔ Deposit to Finished Goods.',
        subSteps: [
          { name: '1. Weight & Slice QC', desc: 'Check standard loaf gram weight and slice uniformity' },
          { name: '2. Warehouse Transfer', desc: 'Deposited to Finished Goods for truck loading' }
        ]
      }
    ]
  }
};

export const getProductPipelineType = (productName?: string, category?: string): 'RUSK' | 'BUN' | 'BREAD' => {
  const str = ((productName || '') + ' ' + (category || '')).toLowerCase();
  if (str.includes('rusk') || str.includes('toast')) return 'RUSK';
  if (str.includes('bun') || str.includes('pav')) return 'BUN';
  return 'BREAD';
};

export const ProductionPage: React.FC = () => {
  const navigate = useNavigate();

  // Main Data States
  const [runs, setRuns] = useState<ProductionRunDTO[]>([]);
  const [kpis, setKpis] = useState<ProductionKpisResponse | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View Mode: 'pipeline' (Kanban) or 'grid' (Table)
  const [viewMode, setViewMode] = useState<'pipeline' | 'grid'>('pipeline');

  // Stage Filter
  const [activeStageTab, setActiveStageTab] = useState<string>('ALL');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedShift, setSelectedShift] = useState<string>('ALL');

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [stageAdvanceRun, setStageAdvanceRun] = useState<ProductionRunDTO | null>(null);
  const [completeRunItem, setCompleteRunItem] = useState<ProductionRunDTO | null>(null);
  const [travelerTicketRun, setTravelerTicketRun] = useState<ProductionRunDTO | null>(null);
  const [packagingModalRun, setPackagingModalRun] = useState<ProductionRunDTO | null>(null);
  const [bomPreviewData, setBomPreviewData] = useState<BOMPreviewResponse | null>(null);
  const [isBomLoading, setIsBomLoading] = useState(false);

  // Plan Form State
  const [planForm, setPlanForm] = useState({
    productId: 1,
    plannedQuantity: 1000,
    machineUsed: 'Tunnel-Oven-Line-01',
    shift: 'MORNING_SHIFT' as ProductionShift,
    targetDoughWeightKg: 450,
    bakingTempCelsius: 225,
    bakingTimeMinutes: 28,
    notes: 'Standard batch for delivery corridor.'
  });

  // Packaging Module Form State
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
    packagingNotes: 'Standard dispatch packaging'
  });

  // Complete & QC Form State
  const [completeForm, setCompleteForm] = useState({
    actualProduced: 1000,
    rejectedQuantity: 0,
    wasteQuantity: 0,
    defectReason: 'None (Clear Pass)',
    defectNotes: 'Crust coloration and slice density within standard specifications.',
    qcInspectorName: 'S. Murugan (Senior QC)',
    isQcPassed: true
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper to normalize backend stage to 3 standard stages
  const resolveStage = (run: any): ProductionStage => {
    const stage = run.currentStage;
    if (stage === 'STAGE_1_PREP_BAKE_COOL' || stage === 'STAGE_MIXING' || stage === 'STAGE_DIVIDING' || stage === 'STAGE_PROOFING' || stage === 'STAGE_BAKING' || stage === 'STAGE_DISPENSING') {
      return 'STAGE_1_PREP_BAKE_COOL';
    }
    if (stage === 'STAGE_2_SLICE_PACK_STACK' || stage === 'STAGE_COOLING_PACKING') {
      return 'STAGE_2_SLICE_PACK_STACK';
    }
    if (stage === 'STAGE_3_ROLL_PACKAGING' || stage === 'STAGE_QC_RELEASE') {
      return 'STAGE_3_ROLL_PACKAGING';
    }
    if (run.status === 'COMPLETED' || stage === 'STAGE_COMPLETED') {
      return 'STAGE_COMPLETED';
    }
    return 'STAGE_1_PREP_BAKE_COOL';
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getStageDuration = (startStr?: string, endStr?: string) => {
    if (!startStr) return null;
    try {
      const start = new Date(startStr).getTime();
      const end = endStr ? new Date(endStr).getTime() : Date.now();
      const diffMins = Math.max(1, Math.round((end - start) / (1000 * 60)));
      const hrs = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hrs > 0) return `${hrs}h ${mins}m`;
      return `${mins} mins`;
    } catch {
      return null;
    }
  };

  // Fetch data from backend
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [runsRes, kpisRes, prodsRes] = await Promise.all([
        productionApi.getAll(selectedStatus, undefined, searchQuery),
        productionApi.getKPIs(),
        productApi.getAll()
      ]);

      const resolvedRuns: ProductionRunDTO[] = (runsRes.data || []).map((r: any) => ({
        ...r,
        currentStage: resolveStage(r),
        productName: r.productName || r.product?.name || 'Standard Bread',
        batchNumber: r.batchNumber || `BATCH-${r.id}`,
        runNumber: r.runNumber || `RUN-${r.id}`,
        plannedQuantity: r.plannedQuantity || 0,
        actualProducedQuantity: r.actualProducedQuantity || 0,
        yieldPercentage: r.yieldPercentage || 0
      }));

      setRuns(resolvedRuns);
      setKpis(kpisRes.data || null);
      setProducts(prodsRes.data || []);
      if (prodsRes.data && prodsRes.data.length > 0 && !planForm.productId) {
        setPlanForm(prev => ({ ...prev, productId: prodsRes.data[0].id }));
      }
    } catch (err: any) {
      console.error('Failed to load production data:', err);
      showToast('⚠️ Could not connect to Production API: ' + (err.message || 'Server error'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, searchQuery]);

  // ─── Single Active Batch on Line 1 & Sequential FIFO Queue ────────────────
  const activeLineBatch = useMemo(() => {
    return runs.find(r => r.status === 'IN_PROGRESS' || (r.status !== 'COMPLETED' && (r.stage1StartTime || r.stage2StartTime || r.stage3StartTime)));
  }, [runs]);

  const scheduledQueue = useMemo(() => {
    return runs.filter(r => r.status === 'PLANNED' && r.id !== activeLineBatch?.id);
  }, [runs, activeLineBatch]);

  const [activePipelineCategory, setActivePipelineCategory] = useState<'AUTO' | 'RUSK' | 'BUN' | 'BREAD'>('AUTO');

  // Determine current active pipeline based on filter or running batch
  const currentPipelineType: 'RUSK' | 'BUN' | 'BREAD' = useMemo(() => {
    if (activePipelineCategory !== 'AUTO') return activePipelineCategory;
    if (activeLineBatch) return getProductPipelineType(activeLineBatch.productName);
    return 'BREAD';
  }, [activePipelineCategory, activeLineBatch]);

  const activePipelineConfig = PRODUCT_PIPELINES[currentPipelineType];

  // Total packaged items computation
  const totalPackagedUnits = useMemo(() => {
    const boxTotal = packagingForm.boxCount * packagingForm.unitsPerBox;
    const bundleTotal = packagingForm.bundleCount * packagingForm.unitsPerBundle;
    const coverTotal = packagingForm.coverCount * packagingForm.unitsPerCover;
    const tinTotal = packagingForm.tinCount * 3; // 3kg per tin
    return boxTotal + bundleTotal + coverTotal + tinTotal + packagingForm.looseUnits;
  }, [packagingForm]);

  // Live BOM Preview calculation
  const handleProductOrQtyChange = async (productId: number, qty: number) => {
    setPlanForm(prev => ({ ...prev, productId, plannedQuantity: qty }));
    setIsBomLoading(true);
    try {
      const res = await productionApi.getBOMPreview(productId, qty);
      setBomPreviewData(res.data);
    } catch (e) {
      setBomPreviewData(null);
    } finally {
      setIsBomLoading(false);
    }
  };

  const handleStartStage = async (run: ProductionRunDTO, stageNo: number) => {
    if (activeLineBatch && activeLineBatch.id !== run.id) {
      showToast(`🔒 Line 1 Busy: Batch ${activeLineBatch.batchNumber} (${activeLineBatch.productName}) is active. Only 1 batch runs at a time.`);
      return;
    }
    try {
      await productionApi.startStage(run.id, stageNo);
      showToast(`⚡ Started Stage ${stageNo} for Batch ${run.batchNumber} on Line 1`);
      fetchData();
    } catch (err: any) {
      showToast('Error starting stage: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCompleteStage = async (run: ProductionRunDTO, stageNo: number) => {
    try {
      await productionApi.completeStage(run.id, stageNo, {
        notes: `Stage ${stageNo} completed successfully.`,
        bakingTempCelsius: run.bakingTempCelsius || 225,
        bakingTimeMinutes: run.bakingTimeMinutes || 28,
        actualDoughWeightKg: run.actualDoughWeightKg || 450
      });
      showToast(`✓ Completed Stage ${stageNo} for Batch ${run.batchNumber}`);
      fetchData();
    } catch (err: any) {
      showToast('Error completing stage: ' + (err.response?.data?.message || err.message));
    }
  };

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

  const handleOpenPackagingModal = (run: ProductionRunDTO) => {
    setPackagingModalRun(run);
    const targetOutput = run.actualProducedQuantity || run.plannedQuantity || 1000;
    const prodName = (run.productName || '').toLowerCase();

    let defaultPreset = PACKAGING_PRESETS[5];
    if (prodName.includes('rusk') || prodName.includes('toast')) {
      if (prodName.includes('10')) defaultPreset = PACKAGING_PRESETS[0];
      else if (prodName.includes('20')) defaultPreset = PACKAGING_PRESETS[1];
      else if (prodName.includes('30')) defaultPreset = PACKAGING_PRESETS[2];
      else if (prodName.includes('3kg') || prodName.includes('tin') || prodName.includes('din')) defaultPreset = PACKAGING_PRESETS[3];
      else defaultPreset = PACKAGING_PRESETS[0];
    } else if (prodName.includes('bun') || prodName.includes('pav')) {
      defaultPreset = PACKAGING_PRESETS[4];
    }

    applyPackagingPreset(defaultPreset, targetOutput);
  };

  const handleSavePackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packagingModalRun) return;

    try {
      await productionApi.savePackaging(packagingModalRun.id, packagingForm);
      showToast(`📦 Packaging breakdown saved for Batch ${packagingModalRun.batchNumber}`);
      setPackagingModalRun(null);
      fetchData();
    } catch (err: any) {
      showToast('⚠️ Error saving packaging breakdown: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreatePlan = async (e?: React.FormEvent, autoStartStage1: boolean = false) => {
    if (e) e.preventDefault();
    if (autoStartStage1 && activeLineBatch) {
      showToast(`🔒 Line 1 is busy with Batch ${activeLineBatch.batchNumber}. Batch will be scheduled in Queue #1.`);
      autoStartStage1 = false;
    }
    try {
      const res = await productionApi.createPlan({
        ...planForm,
        productId: Number(planForm.productId),
        plannedQuantity: Number(planForm.plannedQuantity)
      });
      const created = res.data;
      if (autoStartStage1 && created && created.id) {
        await productionApi.startStage(created.id, 1);
        showToast(`🚀 Batch ${created.batchNumber} Started on Line 1 (Stage 1)!`);
      } else {
        showToast(`🎉 Batch ${created.batchNumber} Added to Scheduled Queue!`);
      }
      setIsPlanModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('⚠️ Failed to create plan: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAdvanceToNextStage = async (run: ProductionRunDTO) => {
    try {
      const currentStage = run.currentStage;
      if (currentStage === 'STAGE_1_PREP_BAKE_COOL') {
        await productionApi.completeStage(run.id, 1, {
          notes: 'Stage 1 completed ➔ Advance to Stage 2',
          bakingTempCelsius: run.bakingTempCelsius || 225,
          bakingTimeMinutes: run.bakingTimeMinutes || 28,
          actualDoughWeightKg: run.actualDoughWeightKg || 450
        });
        showToast(`⚡ Batch ${run.batchNumber} Advanced to Stage 2!`);
      } else if (currentStage === 'STAGE_2_SLICE_PACK_STACK') {
        await productionApi.completeStage(run.id, 2, {
          notes: 'Stage 2 completed ➔ Advance to Stage 3 (Packaging)'
        });
        showToast(`📦 Batch ${run.batchNumber} Advanced to Stage 3 (Packaging Module)!`);
      } else if (currentStage === 'STAGE_3_ROLL_PACKAGING') {
        setCompleteRunItem(run);
        setCompleteForm(prev => ({
          ...prev,
          actualProduced: run.actualProducedQuantity || run.plannedQuantity || 1000
        }));
        return;
      }
      fetchData();
    } catch (err: any) {
      showToast('Error advancing stage: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDirectStageJump = async (run: ProductionRunDTO, targetStageNo: number) => {
    try {
      await productionApi.startStage(run.id, targetStageNo);
      showToast(`🔄 Batch ${run.batchNumber} moved to Stage ${targetStageNo}`);
      fetchData();
    } catch (err: any) {
      showToast('Error switching stage: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredRuns = useMemo(() => {
    return runs.filter(r => {
      if (selectedShift !== 'ALL' && r.shift !== selectedShift) return false;
      if (activeStageTab !== 'ALL' && r.currentStage !== activeStageTab) return false;
      return true;
    });
  }, [runs, selectedShift, activeStageTab]);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
                3-Stage Production & Packaging Hub
              </h1>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <Factory className="w-3 h-3 text-amber-500" />
                Line 1 Workstation
              </span>
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                1-Batch Sequential Execution
              </span>
            </div>
            <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
              Stage 1 (Prep & Baking) ➔ Stage 2 (Slicing/Toasting/Cooling) ➔ Stage 3 (Boxes, Bundles, Covers & 3kg Din Tins).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
              title="Refresh Production Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (products.length > 0) handleProductOrQtyChange(products[0].id, 1000);
                setIsPlanModalOpen(true);
              }}
              className="px-4 py-2 bg-[#1C1C1C] dark:bg-amber-600 hover:bg-black dark:hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> + Plan Production Batch
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Runs Today</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Factory className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              {kpis?.totalRunsToday || runs.length} Batches
            </div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">
              {activeLineBatch ? '1 Active Batch on Line 1' : 'Line 1 is Idle (Ready)'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Target Output vs Actual</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              {(kpis?.actualOutputTotal || 0).toLocaleString()} Loaves
            </div>
            <div className="text-[11px] text-slate-400 font-semibold pt-0.5">
              Target: {(kpis?.plannedOutputTotal || 0).toLocaleString()} loaves
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Average Baking Yield</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Flame className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 leading-none">
              {kpis?.averageYieldPercentage || 98.5}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono font-semibold pt-0.5">
              OEE Efficiency: {kpis?.oeeEfficiencyPercentage || 92}%
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Rejects & Waste</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">
              {kpis?.totalRejectedLoaves || 0} Loaves
            </div>
            <div className="text-[11px] text-rose-600 font-semibold pt-0.5">
              Total Waste: {kpis?.totalWasteKg || 0} kg
            </div>
          </div>
        </div>
      </div>

      {/* ─── 🔴 MASTER WORKSTATION: Line 1 Floor & Scheduled FIFO Queue ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line 1 Active Workstation Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeLineBatch ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${activeLineBatch ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Line 1 Live Workstation</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-mono">
                    1 Batch at a Time Rule
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeLineBatch ? 'Active batch currently running on factory floor.' : 'Line 1 is available. Ready to start next queued batch.'}
                </p>
              </div>
            </div>

            {activeLineBatch ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-white shadow-2xs font-mono">
                RUNNING BATCH
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-mono">
                LINE 1 AVAILABLE
              </span>
            )}
          </div>

          {activeLineBatch ? (
            <div className="space-y-3 pt-1">
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {activeLineBatch.batchNumber}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${PRODUCT_PIPELINES[getProductPipelineType(activeLineBatch.productName)].badgeColor}`}>
                      {PRODUCT_PIPELINES[getProductPipelineType(activeLineBatch.productName)].badge}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {activeLineBatch.shift}
                    </span>
                  </div>
                  <h4 className="text-base font-black text-amber-900 dark:text-amber-300">
                    {activeLineBatch.productName}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Target: <strong className="text-slate-800 dark:text-slate-200">{activeLineBatch.plannedQuantity} Units</strong> • Oven: {activeLineBatch.bakingTempCelsius || 225}°C ({activeLineBatch.bakingTimeMinutes || 28} mins)
                  </p>
                </div>

                <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
                  <button
                    onClick={() => handleAdvanceToNextStage(activeLineBatch)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>Advance to Next Stage ➔</span>
                  </button>

                  <button
                    onClick={() => handleOpenPackagingModal(activeLineBatch)}
                    className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 rounded-xl text-xs font-bold border border-purple-200 transition cursor-pointer"
                  >
                    📦 Packaging Preset
                  </button>
                </div>
              </div>

              {/* 4-Step Interactive Mini Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRODUCT_PIPELINES[getProductPipelineType(activeLineBatch.productName)].stages.map((st, idx) => {
                  const stageKeys = ['STAGE_1_PREP_BAKE_COOL', 'STAGE_2_SLICE_PACK_STACK', 'STAGE_3_ROLL_PACKAGING', 'STAGE_COMPLETED'];
                  const isCurrent = activeLineBatch.currentStage === stageKeys[idx];
                  const isPassed = idx === 0 ? activeLineBatch.stage1Completed : idx === 1 ? activeLineBatch.stage2Completed : idx === 2 ? activeLineBatch.stage3Completed : activeLineBatch.status === 'COMPLETED';

                  return (
                    <button
                      key={st.stageNo}
                      type="button"
                      onClick={() => handleDirectStageJump(activeLineBatch, st.stageNo)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5 ${
                        isCurrent
                          ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                          : isPassed
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center ${
                          isCurrent ? 'bg-white text-amber-600' : isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {st.stageNo}
                        </span>
                        {isCurrent && <span className="text-[9px] font-black uppercase tracking-wider animate-pulse">ACTIVE</span>}
                        {isPassed && <span className="text-[9px] font-black text-emerald-600">✓ DONE</span>}
                      </div>
                      <div>
                        <p className={`text-xs font-black truncate ${isCurrent ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                          {st.shortName}
                        </p>
                        <p className={`text-[9px] truncate ${isCurrent ? 'text-amber-100' : 'text-slate-400'}`}>
                          {st.temp || st.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3 bg-[#F8F9FA] dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white">Line 1 Ready for Next Batch</h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Production line is clear. Start next planned batch from the FIFO queue or plan a new batch.
                </p>
              </div>
              {scheduledQueue.length > 0 ? (
                <button
                  onClick={() => handleStartStage(scheduledQueue[0], 1)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-sm inline-flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Flame className="w-4 h-4" /> Start Queue #1: {scheduledQueue[0].batchNumber} ({scheduledQueue[0].productName}) ➔
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (products.length > 0) handleProductOrQtyChange(products[0].id, 1000);
                    setIsPlanModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#1C1C1C] dark:bg-amber-600 hover:bg-black dark:hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Plan Batch for Line 1
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scheduled FIFO Production Queue */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Scheduled Batch Queue (FIFO)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-mono">
              {scheduledQueue.length} Queued
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
            {scheduledQueue.length === 0 ? (
              <div className="py-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-400">
                No upcoming batches in queue.
              </div>
            ) : (
              scheduledQueue.map((qRun, qIdx) => (
                <div
                  key={qRun.id}
                  className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      #{qIdx + 1} {qIdx === 0 ? 'Next Up' : 'In Queue'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{qRun.shift}</span>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{qRun.productName}</h5>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{qRun.batchNumber}</span>
                      <strong className="text-slate-700 dark:text-slate-300">{qRun.plannedQuantity} units</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartStage(qRun, 1)}
                    disabled={Boolean(activeLineBatch)}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 ${
                      !activeLineBatch
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Flame className="w-3 h-3" />
                    <span>{!activeLineBatch ? '▶ Start On Line 1' : '🔒 Waiting in Queue'}</span>
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              if (products.length > 0) handleProductOrQtyChange(products[0].id, 1000);
              setIsPlanModalOpen(true);
            }}
            className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            + Add Batch to Queue
          </button>
        </div>
      </div>

      {/* ─── Compact Product Process Flow Pipeline Stepper ───────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0F2F5] dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {activePipelineConfig.title}
                </h3>
                <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full border ${activePipelineConfig.badgeColor}`}>
                  {activePipelineConfig.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {activePipelineConfig.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* 4-Stage Process Flow Step Indicator Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activePipelineConfig.stages.map((stage) => {
            const stageKeys = ['STAGE_1_PREP_BAKE_COOL', 'STAGE_2_SLICE_PACK_STACK', 'STAGE_3_ROLL_PACKAGING', 'STAGE_COMPLETED'];
            const count = runs.filter(r => r.currentStage === stageKeys[stage.stageNo - 1]).length;
            const isSelected = activeStageTab === stageKeys[stage.stageNo - 1];

            return (
              <div
                key={stage.stageNo}
                onClick={() => setActiveStageTab(activeStageTab === stageKeys[stage.stageNo - 1] ? 'ALL' : stageKeys[stage.stageNo - 1])}
                className={`rounded-2xl p-3 border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-xs'
                    : 'bg-[#F8F9FA] dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-[10px] shadow-2xs ${
                      isSelected ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    }`}>
                      {stage.stageNo}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                        {stage.shortName}
                      </h4>
                      <span className="text-[9px] text-slate-400 font-bold">Stage {stage.stageNo}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-black font-mono shrink-0 ${
                    isSelected
                      ? 'bg-amber-500 text-white'
                      : count > 0
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {count} Active
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                  {stage.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Unified View Switcher, Shift Filter & Search Toolbar ────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs">
        {/* Left: View Mode Toggle + Divider + Shift Filter Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle (Exact Pasted Icon Switcher Style) */}
          <div className="flex items-center p-1 bg-[#F4F5F7] dark:bg-slate-900 rounded-2xl border border-[#E9ECEF] dark:border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`p-2 rounded-xl transition cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
              }`}
              title="3-Stage Board View"
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
              title="Table / Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Shift Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1">
              SHIFT:
            </span>
            {[
              { id: 'ALL', label: 'All Shifts' },
              { id: 'MORNING_SHIFT', label: 'Morning (04:00 AM)' },
              { id: 'AFTERNOON_SHIFT', label: 'Afternoon (12:00 PM)' },
              { id: 'NIGHT_SHIFT', label: 'Night (08:00 PM)' },
            ].map(shift => (
              <button
                key={shift.id}
                onClick={() => setSelectedShift(shift.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedShift === shift.id
                    ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                    : 'bg-[#F4F5F7] dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {shift.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search batch #, SKU, product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>
      </div>

      {/* ─── 3-STAGE KANBAN PIPELINE VIEW ────────────────────────────────── */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {THREE_STAGES.map(stage => {
            const stageRuns = filteredRuns.filter(r => r.currentStage === stage.key);
            const Icon = stage.icon;

            return (
              <div
                key={stage.key}
                className="bg-slate-50/70 dark:bg-slate-900/40 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col space-y-4 min-h-[600px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${stage.accentBg} ${stage.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        {stage.shortName}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium">Stage {stage.stageNo}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black font-mono bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {stageRuns.length}
                  </span>
                </div>

                {/* Batch Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                  {stageRuns.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-xs text-slate-400">
                      No active batches in {stage.shortName}
                    </div>
                  ) : (
                    stageRuns.map(run => {
                      const isStage1 = stage.stageNo === 1;
                      const isStage2 = stage.stageNo === 2;
                      const isStage3 = stage.stageNo === 3;
                      const isCompleted = stage.stageNo === 4;

                      const stageStart = isStage1 ? run.stage1StartTime : isStage2 ? run.stage2StartTime : isStage3 ? run.stage3StartTime : run.startTime;
                      const stageEnd = isStage1 ? run.stage1EndTime : isStage2 ? run.stage2EndTime : isStage3 ? run.stage3EndTime : run.endTime;
                      const durationStr = getStageDuration(stageStart, stageEnd);

                      return (
                        <div
                          key={run.id}
                          className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md transition space-y-3"
                        >
                          {/* Batch Top Details */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] font-black text-slate-900 dark:text-white">
                                  {run.batchNumber}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                  {run.runNumber}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                                {run.productName}
                              </h4>
                            </div>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 font-mono">
                              {run.plannedQuantity} pcs
                            </span>
                          </div>

                          {/* 4-Step Interactive Production Stepper */}
                          <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-[9px] font-bold">
                            {[
                              { no: 1, label: '1. Baking', stage: 'STAGE_1_PREP_BAKE_COOL' },
                              { no: 2, label: '2. Slicing', stage: 'STAGE_2_SLICE_PACK_STACK' },
                              { no: 3, label: '3. Packaging', stage: 'STAGE_3_ROLL_PACKAGING' },
                              { no: 4, label: '4. QC / WH', stage: 'STAGE_COMPLETED' }
                            ].map(st => {
                              const isCurrent = run.currentStage === st.stage;
                              const isPast = (st.no === 1 && run.stage1Completed) || (st.no === 2 && run.stage2Completed) || (st.no === 3 && run.stage3Completed) || (st.no === 4 && run.status === 'COMPLETED');
                              return (
                                <button
                                  key={st.no}
                                  type="button"
                                  onClick={() => handleDirectStageJump(run, st.no)}
                                  className={`flex-1 py-1 rounded-lg transition text-center cursor-pointer ${
                                    isCurrent
                                      ? 'bg-amber-500 text-white font-black shadow-xs'
                                      : isPast
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold'
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                  }`}
                                  title={`Click to switch to Stage ${st.no}`}
                                >
                                  {st.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* 3-Stage Start & Stop Timestamps Box */}
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-[10px]">
                            <div className="flex items-center justify-between text-slate-500 font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                Stage {stage.stageNo} Timestamps:
                              </span>
                              {durationStr && (
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                                  ⏱️ {durationStr}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[9px] pt-1 border-t border-slate-200/40 dark:border-slate-700/40 font-mono">
                              <div>
                                <span className="text-slate-400">Start:</span>{' '}
                                <strong className="text-slate-700 dark:text-slate-300">{formatTimestamp(stageStart)}</strong>
                              </div>
                              <div>
                                <span className="text-slate-400">Stop:</span>{' '}
                                <strong className="text-slate-700 dark:text-slate-300">{formatTimestamp(stageEnd)}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Stage Specific Sub-Steps Visual */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">Current Stage Steps:</span>
                            <div className="grid grid-cols-2 gap-1">
                              {stage.subSteps.map((step, idx) => (
                                <div key={idx} className="p-1.5 bg-slate-100/70 dark:bg-slate-700/50 rounded-lg text-[9px]">
                                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{step.name}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Stage 3 Packaging Summary Card (If in Stage 3 or Completed) */}
                          {(isStage3 || isCompleted) && (
                            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/60 text-[10px] space-y-1.5">
                              <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-300">
                                <span className="flex items-center gap-1">
                                  <Boxes className="w-3.5 h-3.5 text-purple-600" />
                                  Packaging Breakdown:
                                </span>
                                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-black">
                                  {run.packagingType || 'STANDARD'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px]">
                                {run.boxCount ? (
                                  <div className="bg-white dark:bg-slate-900 p-1 rounded border border-purple-100 dark:border-purple-900">
                                    <span className="text-slate-400 block">Boxes</span>
                                    <strong className="text-purple-700 dark:text-purple-300">{run.boxCount} ({run.unitsPerBox}/box)</strong>
                                  </div>
                                ) : null}

                                {run.bundleCount ? (
                                  <div className="bg-white dark:bg-slate-900 p-1 rounded border border-purple-100 dark:border-purple-900">
                                    <span className="text-slate-400 block">Bundles</span>
                                    <strong className="text-indigo-700 dark:text-indigo-300">{run.bundleCount} ({run.unitsPerBundle}/bun)</strong>
                                  </div>
                                ) : null}

                                {run.coverCount ? (
                                  <div className="bg-white dark:bg-slate-900 p-1 rounded border border-purple-100 dark:border-purple-900">
                                    <span className="text-slate-400 block">Covers</span>
                                    <strong className="text-amber-700 dark:text-amber-300">{run.coverCount} ({run.unitsPerCover}/cov)</strong>
                                  </div>
                                ) : null}

                                {run.tinCount ? (
                                  <div className="bg-white dark:bg-slate-900 p-1 rounded border border-purple-100 dark:border-purple-900">
                                    <span className="text-slate-400 block">3kg Tins</span>
                                    <strong className="text-cyan-700 dark:text-cyan-300">{run.tinCount} Tins</strong>
                                  </div>
                                ) : null}

                                <div className="bg-white dark:bg-slate-900 p-1 rounded border border-purple-100 dark:border-purple-900">
                                  <span className="text-slate-400 block">Loose</span>
                                  <strong className="text-slate-700 dark:text-slate-300">{run.looseUnits || 0}</strong>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Stage Action Buttons with Next Stage Flow */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
                            {isStage1 && (
                              <div className="flex items-center gap-1.5 w-full">
                                {!run.stage1StartTime ? (
                                  <button
                                    onClick={() => handleStartStage(run, 1)}
                                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <Play className="w-3.5 h-3.5" /> Start Stage 1 (Baking)
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdvanceToNextStage(run)}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <span>Advance to Stage 2: Slicing & Stacker</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}

                            {isStage2 && (
                              <div className="flex items-center gap-1.5 w-full">
                                {!run.stage2StartTime ? (
                                  <button
                                    onClick={() => handleStartStage(run, 2)}
                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <Play className="w-3.5 h-3.5" /> Start Slicing
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAdvanceToNextStage(run)}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                  >
                                    <span>Advance to Stage 3: Bulk Packaging</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}

                            {isStage3 && (
                              <div className="flex items-center gap-1.5 w-full">
                                <button
                                  onClick={() => handleOpenPackagingModal(run)}
                                  className="flex-1 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border border-purple-200 dark:border-purple-800 cursor-pointer shadow-2xs"
                                >
                                  <Boxes className="w-3.5 h-3.5 text-purple-600" /> Boxes & Bundles
                                </button>
                                <button
                                  onClick={() => {
                                    setCompleteRunItem(run);
                                    setCompleteForm(prev => ({
                                      ...prev,
                                      actualProduced: run.actualProducedQuantity || run.plannedQuantity || 1000
                                    }));
                                  }}
                                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                                  title="Complete & Handover to Warehouse"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> QC & WH Handover
                                </button>
                              </div>
                            )}

                            {isCompleted && (
                              <div className="flex items-center gap-1.5 w-full">
                                <span className="flex-1 py-1.5 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                                  ✓ Deposited to Warehouse
                                </span>
                                <button
                                  onClick={() => navigate('/inventory')}
                                  className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
                                  title="View in Central Inventory"
                                >
                                  View Stock ➔
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── TABLE GRID VIEW ─────────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F0F2F5] dark:border-slate-700 bg-[#F8F9FA] dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Batch & Run#</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Current Stage</th>
                  <th className="py-3.5 px-4 text-center">Stage 1 (Prep & Bake)</th>
                  <th className="py-3.5 px-4 text-center">Stage 2 (Slicing & Stacker)</th>
                  <th className="py-3.5 px-4 text-center">Stage 3 (Packaging Specs)</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-200">
                {filteredRuns.map(run => (
                  <tr key={run.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition">
                    <td className="py-3 px-4">
                      <p className="font-mono font-extrabold text-slate-900 dark:text-white">{run.batchNumber}</p>
                      <p className="font-mono text-[10px] text-slate-400">{run.runNumber}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {run.productName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {run.currentStage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px]">
                      {run.stage1StartTime ? (
                        <span className="text-emerald-600 font-bold">
                          ✓ {getStageDuration(run.stage1StartTime, run.stage1EndTime) || 'In Progress'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px]">
                      {run.stage2StartTime ? (
                        <span className="text-blue-600 font-bold">
                          ✓ {getStageDuration(run.stage2StartTime, run.stage2EndTime) || 'In Progress'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[10px]">
                      {run.boxCount || run.bundleCount || run.coverCount || run.tinCount ? (
                        <span className="text-purple-600 font-bold">
                          {run.boxCount ? `${run.boxCount} Boxes ` : ''}
                          {run.bundleCount ? `${run.bundleCount} Bundles ` : ''}
                          {run.coverCount ? `${run.coverCount} Covers ` : ''}
                          {run.tinCount ? `${run.tinCount} Tins ` : ''}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenPackagingModal(run)}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100"
                      >
                        Packaging
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: STAGE 3 DEDICATED PACKAGING MODULE (WITH RUSK, BUN, BREAD)    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {packagingModalRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/15 rounded-xl">
                  <PackageCheck className="w-6 h-6 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Stage 3: Finished Products Bulk Packaging Module
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    Product: <strong className="text-white">{packagingModalRun.productName}</strong> ({packagingModalRun.batchNumber}) • Total: <strong className="text-amber-300 font-mono">{packagingModalRun.actualProducedQuantity || packagingModalRun.plannedQuantity} pcs</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPackagingModalRun(null)}
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
                          const total = packagingModalRun.actualProducedQuantity || packagingModalRun.plannedQuantity || 1000;
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
                {/* Master Cover (63/cover for ₹30 Rusk) */}
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

                {/* 3kg Din / Tin Container */}
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
                    {totalPackagedUnits} / {packagingModalRun.actualProducedQuantity || packagingModalRun.plannedQuantity} pcs
                  </span>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-slate-400">Status: </span>
                  <strong className={totalPackagedUnits === (packagingModalRun.actualProducedQuantity || packagingModalRun.plannedQuantity) ? 'text-emerald-600' : 'text-amber-600'}>
                    {totalPackagedUnits === (packagingModalRun.actualProducedQuantity || packagingModalRun.plannedQuantity) ? '✓ 100% Balanced' : `${Math.abs(totalPackagedUnits - (packagingModalRun.actualProducedQuantity || packagingModalRun.plannedQuantity))} variance`}
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
                  onClick={() => setPackagingModalRun(null)}
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

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: COMPLETE BATCH & HANDOVER TO WAREHOUSE                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {completeRunItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    Final QC Release & Handover to Warehouse
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Batch: {completeRunItem.batchNumber} ({completeRunItem.productName})
                  </p>
                </div>
              </div>
              <button onClick={() => setCompleteRunItem(null)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault();
                try {
                  await productionApi.completeRun(completeRunItem.id, completeForm);
                  showToast(`🎉 Batch ${completeRunItem.batchNumber} deposited to Finished Goods Inventory!`);
                  setCompleteRunItem(null);
                  fetchData();
                } catch (err: any) {
                  showToast('Error completing batch: ' + (err.response?.data?.message || err.message));
                }
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Good Loaves *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={completeForm.actualProduced}
                    onChange={e => setCompleteForm(prev => ({ ...prev, actualProduced: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rejects
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={completeForm.rejectedQuantity}
                    onChange={e => setCompleteForm(prev => ({ ...prev, rejectedQuantity: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 dark:text-rose-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Waste (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={completeForm.wasteQuantity}
                    onChange={e => setCompleteForm(prev => ({ ...prev, wasteQuantity: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  QC Inspector Name
                </label>
                <input
                  type="text"
                  value={completeForm.qcInspectorName}
                  onChange={e => setCompleteForm(prev => ({ ...prev, qcInspectorName: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompleteRunItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirm & Transfer to Finished Goods
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: PLAN NEW PRODUCTION BATCH (WITH BOM RECIPE PREVIEW)            */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Plan New 3-Stage Production Batch
                  </h3>
                  <p className="text-[11px] text-slate-400">Automatic Recipe BOM scaling & material sufficiency validation</p>
                </div>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Bread Product *
                </label>
                <CustomSelect
                  value={String(planForm.productId)}
                  onChange={val => handleProductOrQtyChange(Number(val), planForm.plannedQuantity)}
                  options={products.map(p => ({
                    value: String(p.id),
                    label: `${p.name} (${p.productCode || 'SKU'})`,
                    badge: p.category || 'BREAD'
                  }))}
                  placeholder="Select Product"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Planned Batch Loaves *
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={planForm.plannedQuantity}
                    onChange={e => handleProductOrQtyChange(planForm.productId, parseInt(e.target.value, 10) || 1000)}
                    className="w-full bg-[#F8F9FA] dark:bg-slate-800 border border-[#E9ECEF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Production Shift *
                  </label>
                  <CustomSelect
                    value={planForm.shift}
                    onChange={val => setPlanForm(prev => ({ ...prev, shift: val as ProductionShift }))}
                    options={[
                      { value: 'MORNING_SHIFT', label: 'Morning Shift (04:00 AM - 12:00 PM)', badge: 'SHIFT 1' },
                      { value: 'AFTERNOON_SHIFT', label: 'Afternoon Shift (12:00 PM - 08:00 PM)', badge: 'SHIFT 2' },
                      { value: 'NIGHT_SHIFT', label: 'Night Shift (08:00 PM - 04:00 AM)', badge: 'SHIFT 3' },
                    ]}
                    placeholder="Select Shift"
                  />
                </div>
              </div>

              {/* BOM Recipe Preview */}
              {bomPreviewData && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 dark:text-slate-300">
                      Recipe BOM: {bomPreviewData.recipeName}
                    </span>
                    <span className="font-mono text-emerald-600 font-bold">
                      Est. Batch Cost: ₹{(bomPreviewData.estimatedTotalCost || 0).toLocaleString()} (₹{bomPreviewData.estimatedUnitCost}/loaf)
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60 max-h-40 overflow-y-auto">
                    {bomPreviewData.ingredients.map(ing => (
                      <div key={ing.rawMaterialId} className="py-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {ing.materialName}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span>{ing.requiredQuantity} {ing.unit}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            ing.isSufficient ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {ing.isSufficient ? 'In Stock' : 'Low Stock'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreatePlan(undefined, false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  Save as Planned (Draft)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl shadow-sm transition cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> 🚀 Start Production Now (Stage 1)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
