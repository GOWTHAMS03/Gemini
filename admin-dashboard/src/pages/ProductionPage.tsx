import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight
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

// Real-world manufacturing stages
const STAGES: { key: ProductionStage; label: string; stepNo: string; icon: any; color: string; desc: string }[] = [
  { key: 'STAGE_DISPENSING', label: 'Dispensing & BOM', stepNo: '1', icon: Scale, color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', desc: 'Ingredient weighing & staging' },
  { key: 'STAGE_MIXING', label: 'Spiral Mixing', stepNo: '2', icon: Activity, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20', desc: 'Kneading & dough temp check' },
  { key: 'STAGE_DIVIDING', label: 'Dividing & Resting', stepNo: '3', icon: Layers, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20', desc: 'Weight scaling & rounder' },
  { key: 'STAGE_PROOFING', label: 'Proofing Chamber', stepNo: '4', icon: Timer, color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/20', desc: '38°C & 85% RH fermentation' },
  { key: 'STAGE_BAKING', label: 'Oven Baking', stepNo: '5', icon: Flame, color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20', desc: '225°C crust caramelization' },
  { key: 'STAGE_COOLING_PACKING', label: 'Slicing & Packing', stepNo: '6', icon: Boxes, color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20', desc: 'Cooling, slicing & bagging' },
  { key: 'STAGE_COMPLETED', label: 'QC & Handover', stepNo: '7', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', desc: 'Warehouse deposit & dispatch' },
];

export const ProductionPage: React.FC = () => {
  // Main Data States
  const [runs, setRuns] = useState<ProductionRunDTO[]>([]);
  const [kpis, setKpis] = useState<ProductionKpisResponse | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // View Mode: 'pipeline' (Kanban) or 'grid' (Table)
  const [viewMode, setViewMode] = useState<'pipeline' | 'grid'>('pipeline');

  // Stage Filter (for focusing or 'ALL' to view full horizontal board)
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

  // Stage Advance Form State
  const [advanceForm, setAdvanceForm] = useState({
    targetStage: 'STAGE_MIXING' as ProductionStage,
    actualDoughWeightKg: 450,
    bakingTempCelsius: 225,
    bakingTimeMinutes: 28,
    notes: ''
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

  // Resolve stage helper
  const resolveStage = (run: any): ProductionStage => {
    if (run.currentStage && STAGES.some(s => s.key === run.currentStage)) {
      return run.currentStage as ProductionStage;
    }
    if (run.status === 'COMPLETED') return 'STAGE_COMPLETED';
    if (run.status === 'IN_PROGRESS') {
      if (run.machineUsed?.toLowerCase().includes('oven')) return 'STAGE_BAKING';
      if (run.machineUsed?.toLowerCase().includes('proof')) return 'STAGE_PROOFING';
      if (run.machineUsed?.toLowerCase().includes('mixer')) return 'STAGE_MIXING';
      return 'STAGE_BAKING';
    }
    return 'STAGE_DISPENSING';
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

  // Handle BOM live preview calculation on product or quantity change
  useEffect(() => {
    if (isPlanModalOpen && planForm.productId) {
      setIsBomLoading(true);
      productionApi.getBOMPreview(planForm.productId, planForm.plannedQuantity)
        .then(res => setBomPreviewData(res.data))
        .catch(err => console.error('BOM preview error:', err))
        .finally(() => setIsBomLoading(false));
    }
  }, [isPlanModalOpen, planForm.productId, planForm.plannedQuantity]);

  // Handle Create Production Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productionApi.createPlan(planForm);
      showToast('✅ Production batch plan created successfully!');
      setIsPlanModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast('❌ Failed to create plan: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Advance Stage
  const handleAdvanceStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageAdvanceRun) return;
    try {
      await productionApi.advanceStage(stageAdvanceRun.id, advanceForm);
      showToast(`⚡ Batch ${stageAdvanceRun.runNumber} advanced to ${advanceForm.targetStage.replace('STAGE_', '')}!`);
      setStageAdvanceRun(null);
      fetchData();
    } catch (err: any) {
      showToast('❌ Stage advance failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Complete & QC Handover
  const handleCompleteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeRunItem) return;
    try {
      await productionApi.completeRun(completeRunItem.id, completeForm);
      showToast(`🎉 Batch ${completeRunItem.batchNumber} QC Released & deposited to Finished Goods Warehouse!`);
      setCompleteRunItem(null);
      fetchData();
    } catch (err: any) {
      showToast('❌ Completion failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return runs.filter(r => {
      const matchesSearch = 
        r.runNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.machineUsed && r.machineUsed.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;
      const matchesShift = selectedShift === 'ALL' || r.shift === selectedShift;
      return matchesSearch && matchesStatus && matchesShift;
    });
  }, [runs, searchQuery, selectedStatus, selectedShift]);

  // Stage next resolver helper
  const getNextStage = (current: ProductionStage): ProductionStage => {
    const idx = STAGES.findIndex(s => s.key === current);
    if (idx >= 0 && idx < STAGES.length - 1) {
      return STAGES[idx + 1].key;
    }
    return 'STAGE_COMPLETED';
  };

  // Visible stages in pipeline view (based on activeStageTab)
  const visibleStages = useMemo(() => {
    if (activeStageTab === 'ALL') return STAGES;
    return STAGES.filter(s => s.key === activeStageTab);
  }, [activeStageTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
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

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Production Execution & Shop Floor
            </h1>
            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
              BETA
            </span>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> MES Live Plant
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Manage daily bakery batch runs from recipe scaling, dough mixing, proofing, and baking to quality control release and finished goods warehouse deposit
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchData}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Production Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* View Toggle */}
          <div className="bg-[#F8F9FA] dark:bg-slate-900 p-1 rounded-xl border border-[#E9ECEF] dark:border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pipeline'
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Stage Pipeline
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs'
                  : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Batch Dossier
            </button>
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Plan Production Batch
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Planned Output */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Planned Output</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Boxes className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              {kpis?.plannedOutputTotal ? `${kpis.plannedOutputTotal.toLocaleString()} Loaves` : '0 Loaves'}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-0.5">
              {runs.length} Scheduled Daily Batches
            </div>
          </div>
        </div>

        {/* Actual Good Produced */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Actual Good Output</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <PackageCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              {kpis?.actualOutputTotal ? `${kpis.actualOutputTotal.toLocaleString()} Loaves` : '0 Loaves'}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">
              Deposited to Finished Goods Warehouse
            </div>
          </div>
        </div>

        {/* Batch Yield Efficiency */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Batch Yield Efficiency</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">
              {kpis?.averageYieldPercentage ? `${kpis.averageYieldPercentage}%` : '0.0%'} Avg Yield
            </div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">
              {kpis?.oeeEfficiencyPercentage ? `${kpis.oeeEfficiencyPercentage}%` : '0.0%'} OEE Plant Rating
            </div>
          </div>
        </div>

        {/* Scrap & QC Rejections */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Scrap & QC Rejects</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">
              {kpis?.totalRejectedLoaves || 0} Rejects
            </div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">
              {kpis?.totalWasteKg || 0} kg Dough Trim Loss
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8C]" />
          <input
            type="text"
            placeholder="Search by batch number, run number, product name, machine line..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs text-[#1C1C1C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1C1C1C] dark:focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Shifts</option>
            <option value="MORNING_SHIFT">Morning (06:00 - 14:00)</option>
            <option value="AFTERNOON_SHIFT">Afternoon (14:00 - 22:00)</option>
            <option value="NIGHT_SHIFT">Night (22:00 - 06:00)</option>
          </select>
        </div>
      </div>

      {/* VIEW MODE 1: STAGE PIPELINE / KANBAN FLOOR VIEW (WITH ZERO OVERLAP HORIZONTAL FLOW) */}
      {viewMode === 'pipeline' && (
        <div className="space-y-4">
          {/* Quick Stage Filter Tab Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveStageTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeStageTab === 'ALL'
                  ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-xs'
                  : 'bg-[#F8F9FA] dark:bg-slate-800 text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white border border-[#E9ECEF] dark:border-slate-700'
              }`}
            >
              All Stages Board ({runs.length})
            </button>
            {STAGES.map(s => {
              const count = runs.filter(r => r.currentStage === s.key).length;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveStageTab(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    activeStageTab === s.key
                      ? 'bg-[#1C1C1C] dark:bg-blue-600 text-white shadow-xs'
                      : 'bg-[#F8F9FA] dark:bg-slate-800 text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white border border-[#E9ECEF] dark:border-slate-700'
                  }`}
                >
                  <span>{s.stepNo}. {s.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeStageTab === s.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Horizontal Stage Board (Independent flex columns that scroll smoothly with NO overlap) */}
          <div className="flex gap-4 overflow-x-auto pb-4 items-stretch scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {visibleStages.map((stage) => {
              const stageBatches = filteredRuns.filter(r => r.currentStage === stage.key);
              const IconComponent = stage.icon;

              return (
                <div 
                  key={stage.key} 
                  className={`flex flex-col bg-[#F8F9FA] dark:bg-slate-900/60 rounded-2xl border border-[#E9ECEF] dark:border-slate-800 p-3.5 shrink-0 ${
                    activeStageTab === 'ALL' ? 'w-[290px]' : 'flex-1 min-w-[320px]'
                  }`}
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E9ECEF] dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${stage.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-xs text-[#1C1C1C] dark:text-white leading-tight truncate">
                          {stage.stepNo}. {stage.label}
                        </h3>
                        <p className="text-[10px] text-[#8C8C8C] dark:text-slate-400 truncate">{stage.desc}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white border border-[#E9ECEF] dark:border-slate-700 rounded-full text-[10px] font-extrabold shadow-2xs shrink-0">
                      {stageBatches.length}
                    </span>
                  </div>

                  {/* Batches in stage */}
                  <div className="space-y-3 flex-1">
                    {stageBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs hover:shadow-xs transition space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold block truncate">
                              {batch.batchNumber}
                            </span>
                            <h4 className="font-bold text-xs text-[#1C1C1C] dark:text-white mt-0.5 leading-snug truncate">
                              {batch.productName}
                            </h4>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                            batch.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : batch.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-500/10 text-[#8C8C8C]'
                          }`}>
                            {batch.status}
                          </span>
                        </div>

                        {/* Quantities & Parameters */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8F9FA] dark:bg-slate-900/80 p-2.5 rounded-xl border border-[#E9ECEF] dark:border-slate-800">
                          <div>
                            <span className="text-[9px] text-[#8C8C8C] block">Planned</span>
                            <span className="font-bold text-[#1C1C1C] dark:text-white">{batch.plannedQuantity} Pkts</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#8C8C8C] block">Dough Target</span>
                            <span className="font-bold text-[#1C1C1C] dark:text-white">{batch.targetDoughWeightKg || 450} kg</span>
                          </div>
                          {batch.bakingTempCelsius && (
                            <div className="col-span-2 flex items-center justify-between text-[10px] text-orange-600 dark:text-orange-400 font-semibold pt-1 border-t border-[#E9ECEF] dark:border-slate-800">
                              <span className="flex items-center gap-1">
                                <Thermometer className="w-3.5 h-3.5" /> {batch.bakingTempCelsius}°C
                              </span>
                              <span className="flex items-center gap-1">
                                <Timer className="w-3.5 h-3.5" /> {batch.bakingTimeMinutes || 28} mins
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Machine Line & Shift */}
                        <div className="flex items-center justify-between text-[10px] text-[#8C8C8C] dark:text-slate-400">
                          <span className="font-medium truncate max-w-[130px]">{batch.machineUsed || 'Line-01'}</span>
                          <span className="truncate">{batch.shift?.replace('_', ' ')}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between gap-2">
                          <button
                            onClick={() => setTravelerTicketRun(batch)}
                            className="p-2 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl text-xs font-bold border border-[#E9ECEF] dark:border-slate-600 cursor-pointer transition"
                            title="Print Batch Traveler Ticket"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {batch.currentStage !== 'STAGE_COMPLETED' ? (
                            <button
                              onClick={() => {
                                const next = getNextStage(batch.currentStage);
                                if (next === 'STAGE_COMPLETED') {
                                  setCompleteRunItem(batch);
                                  setCompleteForm({
                                    actualProduced: batch.plannedQuantity,
                                    rejectedQuantity: 0,
                                    wasteQuantity: 0,
                                    defectReason: 'None (Clear Pass)',
                                    defectNotes: 'Batch completed cleanly.',
                                    qcInspectorName: 'S. Murugan (Senior QC)',
                                    isQcPassed: true
                                  });
                                } else {
                                  setStageAdvanceRun(batch);
                                  setAdvanceForm({
                                    targetStage: next,
                                    actualDoughWeightKg: batch.targetDoughWeightKg || 450,
                                    bakingTempCelsius: batch.bakingTempCelsius || 225,
                                    bakingTimeMinutes: batch.bakingTimeMinutes || 28,
                                    notes: ''
                                  });
                                }
                              }}
                              className="flex-1 py-2 px-3 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 transition"
                            >
                              Advance Stage
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="flex-1 text-center py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[11px] font-bold border border-emerald-500/20">
                              ✓ Deposited to Warehouse
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {stageBatches.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center text-[#8C8C8C] dark:text-slate-500 text-xs border border-dashed border-[#E9ECEF] dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-800/40 p-4 text-center">
                        <span>No batches in this stage</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: BATCH DOSSIER TABLE VIEW */}
      {viewMode === 'grid' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-slate-900/50 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700 font-extrabold">
                <tr>
                  <th className="py-3.5 px-4">Batch / Run No</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Stage & Status</th>
                  <th className="py-3.5 px-4">Shift & Line</th>
                  <th className="py-3.5 px-4">Planned vs Actual</th>
                  <th className="py-3.5 px-4">Yield %</th>
                  <th className="py-3.5 px-4">QC Release</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60 font-medium">
                {filteredRuns.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F9FA] dark:hover:bg-slate-750 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1C1C1C] dark:text-white font-mono">{r.batchNumber}</div>
                      <div className="text-[10px] text-[#8C8C8C] font-mono">{r.runNumber}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1C1C1C] dark:text-white">{r.productName}</div>
                      <div className="text-[10px] text-[#8C8C8C]">{r.recipeName || 'Master BOM'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {r.currentStage?.replace('STAGE_', '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1C1C1C] dark:text-white">{r.machineUsed || 'Line-01'}</div>
                      <div className="text-[10px] text-[#8C8C8C]">{r.shift?.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1C1C1C] dark:text-white">
                        {r.actualProducedQuantity > 0 ? r.actualProducedQuantity : '-'} / {r.plannedQuantity}
                      </div>
                      {r.rejectedQuantity > 0 && (
                        <div className="text-[10px] text-rose-500 font-bold">{r.rejectedQuantity} Rejects</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {r.yieldPercentage ? `${r.yieldPercentage}%` : '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {r.isQcPassed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Released
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-500 font-semibold">Pending QC</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setTravelerTicketRun(r)}
                          className="p-1.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-lg text-[10px] font-bold border border-[#E9ECEF] dark:border-slate-600 cursor-pointer"
                          title="Print Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {r.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setCompleteRunItem(r);
                              setCompleteForm({
                                actualProduced: r.plannedQuantity,
                                rejectedQuantity: 0,
                                wasteQuantity: 0,
                                defectReason: 'None',
                                defectNotes: '',
                                qcInspectorName: 'S. Murugan (Senior QC)',
                                isQcPassed: true
                              });
                            }}
                            className="px-2.5 py-1 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Complete & QC
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRuns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#8C8C8C] text-xs">
                      No production batches found. Click "Plan Production Batch" to schedule a run.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: PLAN NEW PRODUCTION BATCH */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-[#F0F2F5] dark:border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-[#F0F2F5] dark:border-slate-700 flex items-center justify-between bg-[#F8F9FA] dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1C1C1C] dark:text-white">Plan Production Batch</h2>
                  <p className="text-xs text-[#8C8C8C] dark:text-slate-400">Scale recipe BOM formula & verify raw material warehouse stock</p>
                </div>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 text-[#8C8C8C] hover:text-[#1C1C1C] dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Product Selection */}
                <div>
                  <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">
                    Target Bread / Bun Product
                  </label>
                  <select
                    value={planForm.productId}
                    onChange={(e) => setPlanForm({ ...planForm, productId: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (MRP: ₹{p.mrp})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Planned Quantity */}
                <div>
                  <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">
                    Planned Quantity (Packets)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={planForm.plannedQuantity}
                    onChange={(e) => setPlanForm({ ...planForm, plannedQuantity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                  />
                </div>

                {/* Shift */}
                <div>
                  <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">
                    Production Shift
                  </label>
                  <select
                    value={planForm.shift}
                    onChange={(e) => setPlanForm({ ...planForm, shift: e.target.value as ProductionShift })}
                    className="w-full px-3.5 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                  >
                    <option value="MORNING_SHIFT">Morning Shift (06:00 - 14:00)</option>
                    <option value="AFTERNOON_SHIFT">Afternoon Shift (14:00 - 22:00)</option>
                    <option value="NIGHT_SHIFT">Night Shift (22:00 - 06:00)</option>
                  </select>
                </div>

                {/* Assigned Line */}
                <div>
                  <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">
                    Assigned Line / Oven
                  </label>
                  <select
                    value={planForm.machineUsed}
                    onChange={(e) => setPlanForm({ ...planForm, machineUsed: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                  >
                    <option value="Tunnel-Oven-Line-01">Tunnel Oven Line 01 (Continuous)</option>
                    <option value="Rotary-Rack-Oven-02">Rotary Rack Oven 02 (Buns & Rolls)</option>
                    <option value="Deck-Oven-Line-03">Deck Oven Line 03 (Artisan Brown)</option>
                  </select>
                </div>
              </div>

              {/* LIVE BOM RECIPE REQUIREMENT & STOCK SUFFICIENCY MATRIX */}
              <div className="bg-[#F8F9FA] dark:bg-slate-900/60 p-4 rounded-xl border border-[#E9ECEF] dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-[#1C1C1C] dark:text-white">
                      Formula BOM Matrix ({bomPreviewData?.recipeName || 'Standard Recipe'})
                    </span>
                  </div>
                  {bomPreviewData && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      bomPreviewData.allIngredientsSufficient
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {bomPreviewData.allIngredientsSufficient ? '✓ 100% Stock Available' : '⚠️ Raw Material Shortage'}
                    </span>
                  )}
                </div>

                {isBomLoading ? (
                  <div className="text-center py-4 text-xs text-[#8C8C8C]">Calculating ingredient scaling...</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {bomPreviewData?.ingredients.map((ing, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs">
                        <div className="text-[11px] font-bold text-[#1C1C1C] dark:text-white truncate">
                          {ing.materialName}
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-[#8C8C8C]">Required:</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {ing.requiredQuantity} {ing.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#8C8C8C]">In Stock:</span>
                          <span className={`font-mono font-semibold ${ing.isSufficient ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {ing.availableStock} {ing.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Estimated Unit & Batch Cost */}
                {bomPreviewData && (
                  <div className="flex items-center justify-between pt-2 border-t border-[#E9ECEF] dark:border-slate-800 text-xs">
                    <span className="text-[#8C8C8C]">Estimated Material Cost:</span>
                    <span className="font-bold text-[#1C1C1C] dark:text-white">
                      ₹{bomPreviewData.estimatedTotalCost?.toLocaleString()} (₹{bomPreviewData.estimatedUnitCost} / loaf)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 bg-[#F8F9FA] dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 rounded-xl text-xs font-bold border border-[#E9ECEF] dark:border-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-95"
                >
                  Create Batch Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: STAGE PROGRESSION MODAL */}
      {stageAdvanceRun && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-[#F0F2F5] dark:border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-extrabold text-[#1C1C1C] dark:text-white text-sm">Advance Production Stage</h3>
                <p className="text-xs text-[#8C8C8C]">{stageAdvanceRun.runNumber} • {stageAdvanceRun.productName}</p>
              </div>
              <button onClick={() => setStageAdvanceRun(null)} className="p-1 text-[#8C8C8C] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdvanceStage} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">Target Stage</label>
                <select
                  value={advanceForm.targetStage}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, targetStage: e.target.value as ProductionStage })}
                  className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                >
                  {STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.stepNo}. {s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">Oven Temp (°C)</label>
                  <input
                    type="number"
                    value={advanceForm.bakingTempCelsius}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, bakingTempCelsius: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">Baking Time (Mins)</label>
                  <input
                    type="number"
                    value={advanceForm.bakingTimeMinutes}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, bakingTimeMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-[#1C1C1C] dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">Process Floor Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Spiral mixing speed verified, humidity 85% RH"
                  value={advanceForm.notes}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs text-[#1C1C1C] dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setStageAdvanceRun(null)}
                  className="px-3 py-1.5 bg-[#F8F9FA] dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 rounded-xl text-xs font-bold border border-[#E9ECEF] dark:border-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                >
                  Confirm Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BATCH COMPLETION & QC RELEASE */}
      {completeRunItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-[#F0F2F5] dark:border-slate-700 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#1C1C1C] dark:text-white text-sm">Quality Release & Handover</h3>
                  <p className="text-xs text-[#8C8C8C]">{completeRunItem.batchNumber} • {completeRunItem.productName}</p>
                </div>
              </div>
              <button onClick={() => setCompleteRunItem(null)} className="p-1 text-[#8C8C8C] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteRun} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-[#8C8C8C] block mb-1">Good Loaves</label>
                  <input
                    type="number"
                    value={completeForm.actualProduced}
                    onChange={(e) => setCompleteForm({ ...completeForm, actualProduced: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8C8C8C] block mb-1">QC Rejects</label>
                  <input
                    type="number"
                    value={completeForm.rejectedQuantity}
                    onChange={(e) => setCompleteForm({ ...completeForm, rejectedQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#8C8C8C] block mb-1">Dough Waste (kg)</label>
                  <input
                    type="number"
                    value={completeForm.wasteQuantity}
                    onChange={(e) => setCompleteForm({ ...completeForm, wasteQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-bold text-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">Defect Categorization</label>
                <select
                  value={completeForm.defectReason}
                  onChange={(e) => setCompleteForm({ ...completeForm, defectReason: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-white focus:outline-none"
                >
                  <option value="None (Clear Pass)">None (Clear Pass)</option>
                  <option value="Over-baked / Burnt Crust">Over-baked / Burnt Crust</option>
                  <option value="Under-weight (< 390g)">Under-weight (&lt; 390g)</option>
                  <option value="Packaging Seal Defect">Packaging Seal Defect</option>
                  <option value="Crust Tear / Pan Sticking">Crust Tear / Pan Sticking</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1C1C1C] dark:text-white block mb-1">QC Inspector Sign-off</label>
                <input
                  type="text"
                  value={completeForm.qcInspectorName}
                  onChange={(e) => setCompleteForm({ ...completeForm, qcInspectorName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F9FA] dark:bg-slate-900 border border-[#E9ECEF] dark:border-slate-700 rounded-xl text-xs font-semibold text-[#1C1C1C] dark:text-white"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Truck className="w-4 h-4 shrink-0" />
                <span>Deposits {completeForm.actualProduced} loaves into Finished Goods Warehouse for Trip Dispatch loading.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0F2F5] dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCompleteRunItem(null)}
                  className="px-3 py-1.5 bg-[#F8F9FA] dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 rounded-xl text-xs font-bold border border-[#E9ECEF] dark:border-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                >
                  Approve QC & Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: BATCH TRAVELER MANUFACTURING TICKET */}
      {travelerTicketRun && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-[#1C1C1C] rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Ticket Header */}
            <div className="flex items-center justify-between border-b-2 border-[#1C1C1C] pb-3">
              <div>
                <h2 className="text-lg font-black tracking-tight">GEMINI FOOD B2B ERP</h2>
                <p className="text-[11px] font-bold text-[#8C8C8C]">BATCH MANUFACTURING TRAVELER & ROUTE SHEET</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sm">{travelerTicketRun.batchNumber}</div>
                <div className="text-[10px] text-[#8C8C8C]">{new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="grid grid-cols-2 gap-3 bg-[#F8F9FA] p-3.5 rounded-xl text-xs">
              <div>
                <span className="text-[#8C8C8C] block text-[10px]">Product Name</span>
                <span className="font-bold text-sm">{travelerTicketRun.productName}</span>
              </div>
              <div>
                <span className="text-[#8C8C8C] block text-[10px]">Planned Output</span>
                <span className="font-bold text-sm">{travelerTicketRun.plannedQuantity} Packets</span>
              </div>
              <div>
                <span className="text-[#8C8C8C] block text-[10px]">Shift & Line</span>
                <span className="font-bold">{travelerTicketRun.shift} • {travelerTicketRun.machineUsed}</span>
              </div>
              <div>
                <span className="text-[#8C8C8C] block text-[10px]">Master Baker / Operator</span>
                <span className="font-bold">{travelerTicketRun.operatorName}</span>
              </div>
            </div>

            {/* Stage Checklist */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C8C8C] mb-2">Stage Sign-offs</h4>
              <div className="border border-[#E9ECEF] rounded-xl divide-y text-xs">
                {STAGES.slice(0, 6).map((s) => (
                  <div key={s.key} className="p-2 flex items-center justify-between">
                    <span className="font-bold text-xs">{s.stepNo}. {s.label}</span>
                    <span className="text-[#8C8C8C] font-mono text-[11px]">Sign: ____________________</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QC Sign-off */}
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF] flex items-center justify-between text-xs">
              <div>
                <span className="text-[#8C8C8C] block text-[10px]">QC Inspector Sign-off</span>
                <span className="font-bold">{travelerTicketRun.qcInspectorName || 'S. Murugan (Senior QC)'}</span>
              </div>
              <div className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                QC PASSED
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E9ECEF]">
              <button
                onClick={() => setTravelerTicketRun(null)}
                className="px-4 py-2 bg-[#F8F9FA] text-[#1C1C1C] rounded-xl text-xs font-bold border border-[#E9ECEF] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#1C1C1C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Traveler Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductionPage;
