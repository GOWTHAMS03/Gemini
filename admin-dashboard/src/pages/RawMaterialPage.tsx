import React, { useState, useEffect } from 'react';
import { rawMaterialApi } from '../services/apiService';
import { 
  Boxes, 
  Plus, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  CheckCircle2, 
  RefreshCw, 
  Layers, 
  MapPin, 
  ShoppingCart,
  ShieldCheck,
  PackageCheck,
  Trash2
} from 'lucide-react';

export interface MaterialItem {
  id: number;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  cost: number;
  supplier: string;
  location: string;
  lastUpdated: string;
}


export const RawMaterialPage: React.FC = () => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaterials = () => {
    setIsLoading(true);
    rawMaterialApi.getAll()
      .then((res) => {
        if (res.data) {
          const mapped = res.data.map((rm: any) => ({
            id: rm.id,
            code: rm.materialCode || `RM-00${rm.id}`,
            name: rm.name,
            category: rm.category || 'General',
            stock: rm.currentStock || 0,
            minStock: rm.minStockAlert || 100,
            unit: rm.unit || 'KG',
            cost: rm.unitCost || 0,
            supplier: rm.supplierName || 'Primary Supplier',
            location: rm.warehouseLocation || 'Rack A-01',
            lastUpdated: rm.updatedAt ? rm.updatedAt.substring(0, 10) : '2026-08-06',
          }));
          setMaterials(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load raw materials from API:', err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestockMaterial, setSelectedRestockMaterial] = useState<MaterialItem | null>(null);
  const [restockQty, setRestockQty] = useState('500');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: `RM-00${materials.length + 1}`,
    category: 'Flour',
    stock: '500',
    minStock: '200',
    unit: 'KG',
    cost: '40',
    supplier: 'Shree Krishna Flour Mills',
    location: 'Rack A-01'
  });

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await rawMaterialApi.create({
        materialCode: formData.code || `RM-00${materials.length + 1}`,
        name: formData.name,
        category: formData.category,
        currentStock: parseFloat(formData.stock) || 0,
        minStockAlert: parseFloat(formData.minStock) || 0,
        unit: formData.unit,
        unitCost: parseFloat(formData.cost) || 0,
        supplierName: formData.supplier
      });
      fetchMaterials();
      setIsModalOpen(false);
      showToast(`Added raw ingredient "${formData.name}" to inventory`);
      setFormData({
        name: '',
        code: `RM-00${materials.length + 2}`,
        category: 'Flour',
        stock: '500',
        minStock: '200',
        unit: 'KG',
        cost: '40',
        supplier: 'Shree Krishna Flour Mills',
        location: 'Rack A-01'
      });
    } catch (err: any) {
      showToast(`Error adding raw material: ${err.message || 'Failed'}`);
    }
  };

  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestockMaterial) return;
    const addVal = parseFloat(restockQty) || 0;

    try {
      await rawMaterialApi.restock(selectedRestockMaterial.id, addVal);
      showToast(`Restocked ${addVal} ${selectedRestockMaterial.unit} for ${selectedRestockMaterial.name}`);
      fetchMaterials();
      setSelectedRestockMaterial(null);
    } catch (err: any) {
      showToast(`Failed to restock: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteMaterial = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete raw material "${name}"?`)) return;
    try {
      await rawMaterialApi.delete(id);
      showToast(`Deleted raw material "${name}"`);
      fetchMaterials();
    } catch (err: any) {
      showToast(`Failed to delete raw material: ${err.message || 'Failed'}`);
    }
  };

  // KPIs
  const totalItemsCount = materials.length;
  const totalValuation = materials.reduce((acc, m) => acc + (m.stock * m.cost), 0);
  const lowStockCount = materials.filter(m => m.stock <= m.minStock).length;
  const uniqueSuppliers = new Set(materials.map(m => m.supplier)).size;

  // Filtered Materials
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;

    let matchesStock = true;
    if (stockStatusFilter === 'LOW_STOCK') matchesStock = m.stock <= m.minStock;
    if (stockStatusFilter === 'ADEQUATE') matchesStock = m.stock > m.minStock;

    return matchesSearch && matchesCategory && matchesStock;
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

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Raw Material Inventory & Warehouse Bin Stock
            </h1>
            <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
              BETA
            </span>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Boxes className="w-3 h-3 text-blue-500" />
              {totalItemsCount} Ingredients Tracked
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Track bakery raw ingredients, minimum reorder alert thresholds, supplier purchase orders, and warehouse bin rack locations
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchMaterials}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Raw Materials Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Raw Material
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Row - Vertical Stack Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Raw Materials */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Raw Materials</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Boxes className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalItemsCount} Ingredients</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Active BOM Components</div>
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Inventory Valuation</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">₹{totalValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">Current Stock Value</div>
          </div>
        </div>

        {/* Low Stock Reorder Alerts */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Reorder Alert Triggered</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">{lowStockCount} Items Low</div>
            <div className="text-[11px] text-rose-600 font-semibold pt-0.5">Below Min Safety Stock</div>
          </div>
        </div>

        {/* Active B2B Suppliers */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">B2B Vendors & Mills</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{uniqueSuppliers} Suppliers</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">Verified Supply Chain</div>
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
            placeholder="Search ingredients by name, material code, supplier, category, or rack location..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="ALL">All Categories</option>
            <option value="Flour">Flour & Grain</option>
            <option value="Sugar">Sugar & Sweeteners</option>
            <option value="Yeast">Yeast & Cultures</option>
            <option value="Oil & Fat">Oil & Fats</option>
            <option value="Packaging">Packaging Film</option>
            <option value="Additive">Preservatives & Additives</option>
          </select>

          <select 
            value={stockStatusFilter} 
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW_STOCK">Low Stock (Reorder Warning)</option>
            <option value="ADEQUATE">Adequate Safety Stock</option>
          </select>
        </div>
      </div>

      {/* Raw Materials Inventory Master Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
            <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold min-w-[240px]">Code & Ingredient Name</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Category</th>
                <th className="py-3.5 px-4 font-bold min-w-[150px]">Current Stock</th>
                <th className="py-3.5 px-4 font-bold min-w-[140px]">Min Reorder Level</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Unit Cost</th>
                <th className="py-3.5 px-4 font-bold min-w-[180px]">B2B Supplier</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Bin Location</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px]">Stock Status</th>
                <th className="py-3.5 px-4 font-bold min-w-[120px] text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                    No raw materials found in database. Click "Add Raw Material" to register an ingredient.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => {
                const isLow = material.stock <= material.minStock;
                const stockPercent = Math.min(100, Math.round((material.stock / (material.minStock * 2)) * 100));

                return (
                  <tr key={material.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                    {/* Code & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center text-xs shrink-0 border border-blue-500/20">
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-[#1C1C1C] dark:text-white block">{material.name}</span>
                          <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded border border-blue-500/20 inline-block">
                            {material.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 font-semibold text-[#1C1C1C] dark:text-slate-200">
                      {material.category}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-4">
                      <span className={`font-extrabold text-sm block ${isLow ? 'text-rose-600 dark:text-rose-400' : 'text-[#1C1C1C] dark:text-white'}`}>
                        {material.stock.toLocaleString()} {material.unit}
                      </span>
                      <div className="w-24 bg-[#E2E8F0] dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full transition-all ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${stockPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Min Reorder Level */}
                    <td className="py-3.5 px-4 text-[#8C8C8C] dark:text-slate-400 font-medium">
                      {material.minStock.toLocaleString()} {material.unit} Threshold
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      ₹{material.cost.toLocaleString()} / {material.unit}
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-[#1C1C1C] dark:text-slate-200 block">{material.supplier}</span>
                    </td>

                    {/* Bin Location */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-[#F7F9FB] dark:bg-slate-900 px-2 py-0.5 rounded border border-[#E2E8F0] dark:border-slate-700 inline-block">
                        {material.location}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {isLow ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> REORDER ALERT
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ADEQUATE STOCK
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedRestockMaterial(material)}
                        className="px-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Restock PO
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(material.id, material.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Delete Material"
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

      {/* QUICK RESTOCK PO MODAL */}
      {selectedRestockMaterial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-extrabold">{selectedRestockMaterial.name}</h3>
                  <p className="text-[11px] text-[#8C8C8C]">{selectedRestockMaterial.code} • {selectedRestockMaterial.supplier}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRestockMaterial(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#F7F9FB] dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#8C8C8C]">Current Inventory Stock:</span>
                  <span className="font-bold">{selectedRestockMaterial.stock} {selectedRestockMaterial.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C8C8C]">Min Safety Threshold:</span>
                  <span className="font-bold text-rose-500">{selectedRestockMaterial.minStock} {selectedRestockMaterial.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold mb-1">Restock Quantity ({selectedRestockMaterial.unit}) *</label>
                <input
                  type="number"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px]">
                Estimated Purchase Cost: <strong className="text-blue-600 dark:text-blue-400">₹{(parseFloat(restockQty) * selectedRestockMaterial.cost || 0).toLocaleString()}</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRestockMaterial(null)}
                  className="px-4 py-2 bg-[#E2E8F0] dark:bg-slate-700 text-[#1C1C1C] dark:text-white text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <PackageCheck className="w-4 h-4" /> Receive Restock Load
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD RAW MATERIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Add Raw Ingredient</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Enter ingredient specifications and reorder levels</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="px-6 pb-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Ingredient Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Condensed Milk Powder"
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Material Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-bold text-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    >
                      <option value="Flour">Flour & Grain</option>
                      <option value="Sugar">Sugar & Sweeteners</option>
                      <option value="Yeast">Yeast & Cultures</option>
                      <option value="Oil & Fat">Oil & Fats</option>
                      <option value="Packaging">Packaging Film</option>
                      <option value="Additive">Preservatives & Additives</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Initial Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Min Safety Threshold *</label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Unit Cost (₹) *</label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Warehouse Bin Location *</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Rack A-01"
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0F2F5] dark:border-slate-800">
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
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
