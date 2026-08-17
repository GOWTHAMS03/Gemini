import React, { useState, useEffect } from 'react';
import { recipeApi, productApi, rawMaterialApi, categoryApi, ApiProduct, ApiRawMaterial } from '../services/apiService';
import { CustomSelect, Toast } from '../components/common';
import { 
  ChefHat, 
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
  Sliders
} from 'lucide-react';

export interface RecipeIngredient {
  rawMaterialId: number;
  material: string;
  qty: string;
  unit: string;
  unitCost: number;
  cost: number;
}

export interface RecipeModel {
  id: number;
  productId?: number;
  productName: string;
  productCode?: string;
  category: string;
  batchOutput: number;
  unit: string;
  items: RecipeIngredient[];
  unitCost: number;
  mrp: number;
  dealerPrice: number;
  lastUpdated: string;
}

export const RecipePage: React.FC = () => {
  const [recipes, setRecipes] = useState<RecipeModel[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [rawMaterials, setRawMaterials] = useState<ApiRawMaterial[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live master data (recipes, products, raw materials, categories) from backend APIs
  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const [recRes, prodRes, rmRes, catRes] = await Promise.allSettled([
        recipeApi.getAll(),
        productApi.getAll(),
        rawMaterialApi.getAll(),
        categoryApi.getAll()
      ]);

      const liveProducts = prodRes.status === 'fulfilled' && prodRes.value.data ? prodRes.value.data : [];
      const liveRawMaterials = rmRes.status === 'fulfilled' && rmRes.value.data ? rmRes.value.data : [];
      const liveCategories = catRes.status === 'fulfilled' && catRes.value.data ? catRes.value.data : [];

      setProducts(liveProducts);
      setRawMaterials(liveRawMaterials);
      setCategories(liveCategories);

      if (recRes.status === 'fulfilled' && recRes.value.data) {
        const mapped = recRes.value.data.map((r: any) => {
          const prod = liveProducts.find(p => p.id === (r.product?.id || r.productId)) || r.product;
          const items = (r.items || []).map((it: any) => {
            const rm = liveRawMaterials.find(m => m.id === (it.rawMaterial?.id || it.rawMaterialId)) || it.rawMaterial;
            const unitCost = rm?.unitCost || 0;
            const qty = parseFloat(it.requiredQuantity || it.quantityRequired || 1);
            return {
              rawMaterialId: rm?.id || it.rawMaterial?.id || 0,
              material: rm?.name || it.rawMaterial?.name || 'Raw Material',
              qty: String(qty),
              unit: it.unit || rm?.unit || 'KG',
              unitCost: unitCost,
              cost: Math.round(qty * unitCost)
            };
          });

          const totalCost = items.reduce((sum: number, it: any) => sum + it.cost, 0);
          const batchOutput = r.batchOutputQuantity || 100;
          const calculatedCost = batchOutput > 0 ? parseFloat((totalCost / batchOutput).toFixed(2)) : 0;

          return {
            id: r.id,
            productId: prod?.id,
            productName: r.recipeName || prod?.name || 'Product Recipe',
            productCode: prod?.productCode || `SKU-${r.id}`,
            category: typeof prod?.category === 'string' ? prod.category : (prod?.category?.name || r.category || 'General'),
            batchOutput: batchOutput,
            unit: 'Packets',
            mrp: prod?.mrp || 0,
            dealerPrice: prod?.dealerPrice || 0,
            unitCost: calculatedCost,
            lastUpdated: r.updatedAt ? r.updatedAt.substring(0, 10) : (r.createdAt ? r.createdAt.substring(0, 10) : '2026-08-16'),
            items: items
          };
        });
        setRecipes(mapped);
      }
    } catch (err) {
      console.error('Failed to load recipe master data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);
  
  // UI states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeModel | null>(null);
  const [simulatingRecipe, setSimulatingRecipe] = useState<RecipeModel | null>(null);
  const [flourInflation, setFlourInflation] = useState<number>(10);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<number[]>([]);
  const [scaledBatchOutputs, setScaledBatchOutputs] = useState<Record<number, number>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal formulation form state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('General');
  const [batchOutput, setBatchOutput] = useState('100');
  const [mrp, setMrp] = useState('0');
  const [dealerPrice, setDealerPrice] = useState('0');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const toggleExpand = (id: number) => {
    setExpandedRecipeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleProductChange = (prodIdStr: string) => {
    const prodId = parseInt(prodIdStr);
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setProductName(prod.name);
      setCategory(typeof prod.category === 'string' ? prod.category : ((prod.category as any)?.name || 'General'));
      setMrp(String(prod.mrp || 0));
      setDealerPrice(String(prod.dealerPrice || 0));
    }
  };

  const handleIngredientChange = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    const updated = [...ingredients];
    if (field === 'rawMaterialId') {
      const rmId = parseInt(value as string);
      const rm = rawMaterials.find(m => m.id === rmId);
      if (rm) {
        updated[index].rawMaterialId = rm.id;
        updated[index].material = rm.name;
        updated[index].unit = rm.unit || 'KG';
        updated[index].unitCost = rm.unitCost || 0;
        const qtyNum = parseFloat(updated[index].qty) || 0;
        updated[index].cost = parseFloat((qtyNum * (rm.unitCost || 0)).toFixed(2));
      }
    } else if (field === 'qty') {
      const qtyStr = value as string;
      updated[index].qty = qtyStr;
      const qtyNum = parseFloat(qtyStr) || 0;
      updated[index].cost = parseFloat((qtyNum * (updated[index].unitCost || 0)).toFixed(2));
    } else if (field === 'cost') {
      updated[index].cost = parseFloat(value as string) || 0;
    } else if (field === 'unit') {
      updated[index].unit = value as string;
    }
    setIngredients(updated);
  };

  const addIngredientRow = () => {
    const firstRM = rawMaterials.length > 0 ? rawMaterials[0] : null;
    if (firstRM) {
      setIngredients(prev => [
        ...prev,
        {
          rawMaterialId: firstRM.id,
          material: firstRM.name,
          qty: '1.00',
          unit: firstRM.unit || 'KG',
          unitCost: firstRM.unitCost || 0,
          cost: firstRM.unitCost || 0
        }
      ]);
    } else {
      setIngredients(prev => [
        ...prev,
        {
          rawMaterialId: 0,
          material: '',
          qty: '1.00',
          unit: 'KG',
          unitCost: 0,
          cost: 0
        }
      ]);
    }
  };

  const removeIngredientRow = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setEditingRecipe(null);
    const firstProd = products.length > 0 ? products[0] : null;
    setSelectedProductId(firstProd ? firstProd.id : null);
    setProductName(firstProd ? firstProd.name : '');
    setCategory(firstProd ? (typeof firstProd.category === 'string' ? firstProd.category : ((firstProd.category as any)?.name || 'General')) : 'General');
    setBatchOutput('100');
    setMrp(firstProd ? String(firstProd.mrp || 0) : '0');
    setDealerPrice(firstProd ? String(firstProd.dealerPrice || 0) : '0');

    if (rawMaterials.length > 0) {
      const firstRM = rawMaterials[0];
      setIngredients([
        {
          rawMaterialId: firstRM.id,
          material: firstRM.name,
          qty: '1.00',
          unit: firstRM.unit || 'KG',
          unitCost: firstRM.unitCost || 0,
          cost: firstRM.unitCost || 0
        }
      ]);
    } else {
      setIngredients([]);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (recipe: RecipeModel) => {
    setEditingRecipe(recipe);
    setSelectedProductId(recipe.productId || null);
    setProductName(recipe.productName);
    setCategory(recipe.category);
    setBatchOutput(recipe.batchOutput.toString());
    setMrp(recipe.mrp.toString());
    setDealerPrice(recipe.dealerPrice.toString());
    setIngredients([...recipe.items]);
    setIsModalOpen(true);
  };

  const totalBatchCost = ingredients.reduce((sum, item) => sum + (item.cost || 0), 0);
  const calculatedUnitCost = parseFloat(batchOutput) > 0 ? (totalBatchCost / parseFloat(batchOutput)).toFixed(2) : '0.00';

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showToast('Please select a target finished product SKU');
      return;
    }
    if (ingredients.length === 0) {
      showToast('Please add at least one BOM raw material ingredient');
      return;
    }

    const payload: any = {
      recipeName: productName,
      batchOutputQuantity: parseFloat(batchOutput) || 100,
      isActive: true,
      items: ingredients.map(ing => ({
        rawMaterial: ing.rawMaterialId ? { id: ing.rawMaterialId } : undefined,
        requiredQuantity: parseFloat(ing.qty) || 0,
        unit: ing.unit
      }))
    };

    if (selectedProductId) {
      payload.product = { id: selectedProductId };
    }

    try {
      if (editingRecipe) {
        await recipeApi.update(editingRecipe.id, payload);
        showToast(`✓ Updated formulation for "${productName}" successfully!`);
      } else {
        await recipeApi.create(payload);
        showToast(`✓ Created new BOM recipe for "${productName}" successfully!`);
      }
      fetchMasterData();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Error saving recipe: ${err.response?.data?.message || err.message || 'Failed'}`);
    }
  };

  const handleDeleteRecipe = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete recipe "${name}"?`)) return;
    try {
      await recipeApi.delete(id);
      showToast(`✓ Deleted recipe formulation for "${name}"`);
      fetchMasterData();
    } catch (err: any) {
      showToast(`Failed to delete recipe: ${err.response?.data?.message || err.message || 'Failed'}`);
    }
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.items.some(i => i.material.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification (Bottom Center) */}
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Recipe Formulations & Bill of Materials (BOM)
            </h1>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> MES Auto Stock Deduction
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Configure raw material ingredient ratios, auto-calculate batch output unit costs, simulate market price fluctuations, and formulate finished product recipes
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchMasterData}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Recipe Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <ChefHat className="w-4 h-4" /> Create Recipe / BOM
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row - Vertical Stack Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Formulations */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Active Formulations</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{recipes.length} Master BOMs</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">100% Configured & Active</div>
          </div>
        </div>

        {/* Avg Production Unit Cost */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Avg Production Unit Cost</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
              ₹{(recipes.reduce((acc, r) => acc + r.unitCost, 0) / (recipes.length || 1)).toFixed(2)} / Pkt
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Raw Material Cost Allocation</div>
          </div>
        </div>

        {/* Gross Margin Spread */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Gross Profit Spread</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">
              {recipes.length > 0 ? (
                `${Math.round(
                  recipes.reduce((acc, r) => {
                    const profit = r.dealerPrice - r.unitCost;
                    const margin = r.dealerPrice > 0 ? (profit / r.dealerPrice) * 100 : 0;
                    return acc + margin;
                  }, 0) / recipes.length
                )}% Avg Margin`
              ) : '0% Avg Margin'}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">MRP vs Unit Cost Spread</div>
          </div>
        </div>

        {/* Auto-Deduction Ready */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">BOM Auto-Deduction</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">Ready for MES</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Real-time Stock Deduction</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes by product name or ingredient..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <div className="w-52 shrink-0">
            <CustomSelect 
              value={selectedCategory} 
              onChange={setSelectedCategory}
              options={[
                { value: 'All', label: 'All Product Categories' },
                ...Array.from(
                  new Set([
                    ...categories.map((c: any) => c.name || c),
                    ...products.map((p: any) => typeof p.category === 'string' ? p.category : p.category?.name).filter(Boolean)
                  ])
                ).map((catName: string) => ({
                  value: catName,
                  label: `${catName} Formulations`,
                  badge: catName.substring(0, 5).toUpperCase()
                }))
              ]}
              placeholder="Filter Category"
            />
          </div>
        </div>
      </div>

      {/* User-Friendly Expandable Recipe Cards List */}
      <div className="space-y-5">
        {filteredRecipes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 text-center space-y-3">
            <ChefHat className="w-12 h-12 text-[#8C8C8C] dark:text-slate-500 mx-auto" />
            <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">No Recipe Formulations Found</h3>
            <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-sm mx-auto">Click "Create Recipe / BOM" to formulate ingredient ratios for finished goods.</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
          const totalRecipeBatchCost = recipe.items.reduce((sum, item) => sum + item.cost, 0);
          const grossProfit = recipe.dealerPrice - recipe.unitCost;
          const grossMargin = Math.round((grossProfit / recipe.dealerPrice) * 100);
          const isExpanded = expandedRecipeIds.includes(recipe.id);
          const currentScaledOutput = scaledBatchOutputs[recipe.id] || recipe.batchOutput;
          const scaleMultiplier = currentScaledOutput / recipe.batchOutput;

          return (
            <div key={recipe.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 hover:shadow-md transition-all duration-200">
              {/* Recipe Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#F0F2F5] dark:border-slate-700/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 shrink-0">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white">{recipe.productName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {recipe.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8C8C] dark:text-slate-400 mt-1">
                      Standard Batch Output: <span className="font-bold text-[#1C1C1C] dark:text-slate-200">{recipe.batchOutput} {recipe.unit}</span> • Total Batch Cost: <span className="font-extrabold text-[#1C1C1C] dark:text-white">₹{totalRecipeBatchCost}</span>
                    </p>
                  </div>
                </div>

                {/* Right Metrics & Controls */}
                <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-[#8C8C8C] dark:text-slate-400 block uppercase tracking-wider font-bold">Computed Unit Cost</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{recipe.unitCost} <span className="text-xs text-[#8C8C8C] font-normal">/ Pkt</span></span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs text-center shrink-0">
                    <span className="text-[9px] uppercase tracking-wider block font-bold">Profit Margin</span>
                    <span className="font-extrabold text-xs">{grossMargin}% Spread</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button 
                      onClick={() => openEditModal(recipe)}
                      className="p-2 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-600 flex items-center gap-1 transition cursor-pointer"
                      title="Edit BOM Formulation"
                    >
                      <Edit className="w-3.5 h-3.5 text-blue-500" />
                    </button>

                    <button 
                      onClick={() => setSimulatingRecipe(recipe)}
                      className="p-2 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-600 flex items-center gap-1 transition cursor-pointer"
                      title="Simulate Ingredient Inflation"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    </button>

                    <button 
                      onClick={() => handleDeleteRecipe(recipe.id, recipe.productName)}
                      className="p-2 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-600 flex items-center gap-1 transition cursor-pointer"
                      title="Delete Recipe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => toggleExpand(recipe.id)}
                      className="p-2 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-600 flex items-center gap-1 transition cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Ingredients Ratios Grid */}
              {isExpanded && (
                <div className="space-y-4 animate-in fade-in pt-1">
                  {/* Interactive Batch Scaling Toolbar */}
                  <div className="p-3 bg-[#F7F9FB] dark:bg-slate-900 rounded-xl border border-[#F0F2F5] dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#1C1C1C] dark:text-white">
                      <Scale className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Live Batch Output Scaler:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[100, 250, 500, 1000].map(qty => (
                        <button
                          key={qty}
                          onClick={() => setScaledBatchOutputs(prev => ({ ...prev, [recipe.id]: qty }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                            currentScaledOutput === qty
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C]'
                          }`}
                        >
                          {qty} Pkts
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-[#8C8C8C] dark:text-slate-400 uppercase tracking-wider">
                      BOM Ingredient Ratios ({recipe.items.length} Items) • Scaled for {currentScaledOutput} Packets
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recipe.items.map((item, idx) => {
                      const scaledQty = (parseFloat(item.qty) * scaleMultiplier).toFixed(2);
                      const scaledCost = Math.round(item.cost * scaleMultiplier);
                      const percentShare = Math.round((item.cost / totalRecipeBatchCost) * 100);

                      return (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#F7F9FB] dark:bg-slate-900/70 border border-[#F0F2F5] dark:border-slate-700/70 flex flex-col justify-between space-y-2 hover:border-slate-300 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-extrabold text-[#1C1C1C] dark:text-slate-100">{item.material}</p>
                              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-mono font-bold mt-0.5 block">
                                {scaledQty} {item.unit}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-[#1C1C1C] dark:text-white shrink-0">₹{scaledCost}</span>
                          </div>

                          {/* Visual Cost Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="w-full bg-[#E2E8F0] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${percentShare}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#8C8C8C]">
                              <span>Cost Share</span>
                              <span className="font-bold">{percentShare}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }))}
      </div>

      {/* COST IMPACT INFLATION SIMULATOR MODAL */}
      {simulatingRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-purple-600 text-white rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Ingredient Cost Fluctuation Simulator</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">{simulatingRecipe.productName}</p>
                </div>
              </div>
              <button onClick={() => setSimulatingRecipe(null)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4 text-xs">
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-700 dark:text-purple-300 space-y-2">
                <div className="flex items-center gap-2 font-extrabold">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span>Market Raw Material Fluctuation Analysis</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Current production unit cost is <strong className="font-bold text-[#1C1C1C] dark:text-white">₹{simulatingRecipe.unitCost} / Packet</strong>.
                  With a <strong className="font-bold text-purple-600 dark:text-purple-400">+{flourInflation}%</strong> raw material price hike, unit production cost shifts to <strong className="font-bold text-purple-600 dark:text-purple-400">₹{(simulatingRecipe.unitCost * (1 + (flourInflation * 0.007))).toFixed(2)} / Packet</strong>.
                </p>
              </div>

              <div className="space-y-2 bg-[#F7F9FB] dark:bg-slate-800 p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
                <div className="flex justify-between font-bold text-xs">
                  <span>Simulate Flour & Sugar Price Hike:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold">+{flourInflation}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="40" 
                  value={flourInflation}
                  onChange={(e) => setFlourInflation(parseInt(e.target.value) || 0)}
                  className="w-full accent-purple-600 cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button 
                  onClick={() => setSimulatingRecipe(null)}
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Close Simulation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT FORMULATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden space-y-4 max-h-[90vh] flex flex-col text-[#1C1C1C] dark:text-slate-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">{editingRecipe ? 'Edit Recipe Formulation' : 'Create Recipe / BOM Formulation'}</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Configure raw material ingredient ratios for finished product</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRecipe} className="px-6 pb-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Target Finished Product SKU *</label>
                  <CustomSelect
                    value={selectedProductId ? String(selectedProductId) : ''}
                    onChange={handleProductChange}
                    options={products.map(p => ({
                      value: String(p.id),
                      label: `${p.name} (${p.productCode || `SKU-${p.id}`})`,
                      badge: p.weightGrams ? `${p.weightGrams}g` : '400g'
                    }))}
                    placeholder="Select Target SKU"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">Batch Target Output (Packets) *</label>
                  <input
                    type="number"
                    value={batchOutput}
                    onChange={(e) => setBatchOutput(e.target.value)}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Interactive Raw Material Ingredients */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400">BOM Raw Material Ingredients</h4>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="px-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-800 hover:bg-[#E2E8F0] dark:hover:bg-slate-700 text-[#1C1C1C] dark:text-slate-200 text-[11px] font-bold rounded-xl border border-[#E2E8F0] dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-500" /> Add Ingredient Row
                  </button>
                </div>

                <div className="space-y-2.5">
                  {ingredients.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#F7F9FB] dark:bg-slate-800/60 rounded-xl border border-[#F0F2F5] dark:border-slate-700 grid grid-cols-12 gap-2.5 items-center">
                      {/* Material Select Dropdown */}
                      <div className="col-span-5">
                        <label className="block text-[9px] font-bold text-[#8C8C8C] mb-0.5">Select Ingredient *</label>
                        <CustomSelect
                          value={item.rawMaterialId ? String(item.rawMaterialId) : ''}
                          onChange={val => handleIngredientChange(idx, 'rawMaterialId', val)}
                          options={rawMaterials.map(rm => ({
                            value: String(rm.id),
                            label: rm.name,
                            badge: `₹${rm.unitCost || 0}/${rm.unit || 'KG'}`
                          }))}
                          placeholder="Select Ingredient"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-[#8C8C8C] mb-0.5">Quantity</label>
                        <input
                          type="text"
                          value={item.qty}
                          onChange={(e) => handleIngredientChange(idx, 'qty', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-[#8C8C8C] mb-0.5">Unit</label>
                        <input
                          type="text"
                          readOnly
                          value={item.unit}
                          className="w-full bg-slate-100 dark:bg-slate-800 text-xs font-bold px-2 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 text-[#8C8C8C]"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-[#8C8C8C] mb-0.5">Cost (₹)</label>
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => handleIngredientChange(idx, 'cost', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-3">
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulation Calculation Summary */}
              <div className="p-4 bg-blue-500/10 rounded-xl flex items-center justify-between text-xs border border-blue-500/20">
                <div>
                  <p className="text-[10px] text-[#8C8C8C] uppercase font-bold tracking-wider">Total Batch Ingredient Cost</p>
                  <p className="text-base font-extrabold text-[#1C1C1C] dark:text-white">₹{totalBatchCost.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#8C8C8C] uppercase font-bold tracking-wider">Computed Unit Production Cost</p>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{calculatedUnitCost} / Packet</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  Save Formulation & Calculate Cost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
