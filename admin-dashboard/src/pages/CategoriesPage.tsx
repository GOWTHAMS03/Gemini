import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle2, 
  Layers, 
  Package, 
  Sparkles,
  FolderPlus,
  ArrowRight,
  List,
  LayoutGrid,
  Percent,
  FileText,
  ShieldCheck,
  Check,
  RefreshCw
} from 'lucide-react';
import { categoryApi } from '../services/apiService';

export interface CategoryModel {
  id: number;
  code: string;
  name: string;
  slug: string;
  hsnCode: string;
  gstRate: string;
  itemCount: number;
  color: string;
  subCategories: string[];
  status: 'ACTIVE' | 'INACTIVE';
}


export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryModel | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [newSubInput, setNewSubInput] = useState<Record<number, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: `CAT-00${categories.length + 1}`,
    hsnCode: '1905 90 90',
    gstRate: '5%',
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    subCategoryInput: ''
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await categoryApi.getAll();
      if (res.data) {
        setCategories(res.data.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
          hsnCode: c.hsnCode || '1905 90 90',
          gstRate: c.gstRate || '5%',
          itemCount: c.itemCount || 0,
          color: c.color || 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          subCategories: c.subCategories || [],
          status: (c.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE'
        })));
      }
    } catch (err: any) {
      console.error('Failed to load categories from API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: `CAT-00${categories.length + 1}`,
      hsnCode: '1905 90 90',
      gstRate: '5%',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      subCategoryInput: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryModel) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      code: cat.code,
      hsnCode: cat.hsnCode,
      gstRate: cat.gstRate,
      color: cat.color,
      subCategoryInput: cat.subCategories.join(', ')
    });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const subCats = formData.subCategoryInput
      ? formData.subCategoryInput.split(',').map(s => s.trim()).filter(Boolean)
      : ['General'];

    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, {
          name: formData.name,
          code: formData.code,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          hsnCode: formData.hsnCode,
          gstRate: formData.gstRate,
          color: formData.color,
          subCategories: subCats
        });
        showToast(`Updated category "${formData.name}"`);
      } else {
        await categoryApi.create({
          code: formData.code || `CAT-00${categories.length + 1}`,
          name: formData.name,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
          hsnCode: formData.hsnCode,
          gstRate: formData.gstRate,
          itemCount: 0,
          color: formData.color,
          subCategories: subCats,
          status: 'ACTIVE'
        });
        showToast(`Created category "${formData.name}" successfully!`);
      }
      fetchCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(`Error saving category: ${err.message || 'Failed'}`);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await categoryApi.delete(id);
      showToast(`Deleted category "${name}"`);
      fetchCategories();
    } catch (err: any) {
      showToast(`Failed to delete category: ${err.message || 'Failed'}`);
    }
  };

  const handleAddInlineSubCategory = async (catId: number) => {
    const text = newSubInput[catId]?.trim();
    if (!text) return;

    const targetCat = categories.find(c => c.id === catId);
    if (!targetCat || targetCat.subCategories.includes(text)) return;

    const updatedSubCats = [...targetCat.subCategories, text];
    try {
      await categoryApi.update(catId, { subCategories: updatedSubCats });
      setNewSubInput(prev => ({ ...prev, [catId]: '' }));
      showToast(`Added sub-category "${text}"`);
      fetchCategories();
    } catch (err: any) {
      showToast(`Failed to add sub-category: ${err.message}`);
    }
  };

  const handleRemoveSubCategory = async (catId: number, subName: string) => {
    const targetCat = categories.find(c => c.id === catId);
    if (!targetCat) return;

    const updatedSubCats = targetCat.subCategories.filter(s => s !== subName);
    try {
      await categoryApi.update(catId, { subCategories: updatedSubCats });
      showToast(`Removed sub-category "${subName}"`);
      fetchCategories();
    } catch (err: any) {
      showToast(`Failed to remove sub-category: ${err.message}`);
    }
  };

  // KPIs
  const totalCategories = categories.length;
  const totalSubCategories = categories.reduce((sum, c) => sum + c.subCategories.length, 0);
  const totalSKUs = categories.reduce((sum, c) => sum + c.itemCount, 0);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hsnCode.includes(searchQuery) ||
    c.subCategories.some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-slate-900 text-emerald-400 border border-emerald-500/50 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-bottom-4 fixed bottom-6 right-6 z-[999999] max-w-md">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="leading-snug">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-slate-400 hover:text-white hover:opacity-75 cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Categories & Sub-Categories Master
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-500" />
              {totalCategories} Product Taxonomies
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Manage finished goods category taxonomy, GST HSN tax codes, sub-category groupings, and SKU product assignments
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchCategories}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Categories Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Master Category
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row - Vertical Stack Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Master Categories */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Master Categories</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Tag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalCategories} Lines</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Active Master Taxonomy</div>
          </div>
        </div>

        {/* Total Sub-Categories */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Sub-Categories</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Layers className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalSubCategories} Groupings</div>
            <div className="text-[11px] text-purple-600 font-semibold pt-0.5">Specific Product Types</div>
          </div>
        </div>

        {/* Categorized SKUs */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Categorized SKUs</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalSKUs} Items</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">Assigned to Catalog</div>
          </div>
        </div>

        {/* HSN & GST Tax Slabs */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">GST Tax Slabs</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">5% & 12% Slabs</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">HSN Code Mapped</div>
          </div>
        </div>
      </div>

      {/* Search & View Mode Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by code, name, HSN code, or sub-category..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 bg-[#F7F9FB] dark:bg-slate-900 p-1 rounded-xl border border-[#E2E8F0] dark:border-slate-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'table' 
                ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
            }`}
            title="Table Master View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VIEW 1: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 hover:shadow-md transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">{cat.code}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cat.color}`}>
                    {cat.name}
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {cat.status}
                </span>
              </div>

              {/* Content Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#8C8C8C] dark:text-slate-400">
                  <span>Associated SKUs:</span>
                  <span className="font-extrabold text-[#1C1C1C] dark:text-white">{cat.itemCount} Items</span>
                </div>
                <div className="flex items-center justify-between text-[#8C8C8C] dark:text-slate-400">
                  <span>GST HSN & Tax Rate:</span>
                  <span className="font-bold text-[#1C1C1C] dark:text-slate-200">{cat.hsnCode} ({cat.gstRate})</span>
                </div>
                <div className="flex items-center justify-between text-[#8C8C8C] dark:text-slate-400">
                  <span>Category Slug:</span>
                  <span className="font-mono text-[11px] text-blue-500">/{cat.slug}</span>
                </div>
              </div>

              {/* Interactive Sub-Category Chips Manager */}
              <div className="p-3 bg-[#F7F9FB] dark:bg-slate-900/60 rounded-xl border border-[#F0F2F5] dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8C8C8C] block">Sub-Categories ({cat.subCategories.length})</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {cat.subCategories.map((sub, i) => (
                    <span 
                      key={i} 
                      className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-[#1C1C1C] dark:text-slate-200 inline-flex items-center gap-1.5 group"
                    >
                      <span>{sub}</span>
                      <button
                        onClick={() => handleRemoveSubCategory(cat.id, sub)}
                        className="text-slate-400 hover:text-rose-500"
                        title="Remove Sub-Category"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Inline Quick Add Input */}
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    placeholder="Add sub-category..."
                    value={newSubInput[cat.id] || ''}
                    onChange={(e) => setNewSubInput({ ...newSubInput, [cat.id]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddInlineSubCategory(cat.id); }}
                    className="w-full bg-white dark:bg-slate-800 text-[11px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() => handleAddInlineSubCategory(cat.id)}
                    className="p-1 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white rounded-lg cursor-pointer shrink-0"
                    title="Add Sub-Category"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F0F2F5] dark:border-slate-700/60 text-xs">
                <button 
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>

                <button 
                  onClick={() => openEditModal(cat)}
                  className="text-[#1C1C1C] dark:text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Category
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: MASTER TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold min-w-[100px]">Code</th>
                  <th className="py-3.5 px-4 font-bold min-w-[180px]">Category Name</th>
                  <th className="py-3.5 px-4 font-bold min-w-[140px]">HSN & GST Rate</th>
                  <th className="py-3.5 px-4 font-bold min-w-[110px]">Associated SKUs</th>
                  <th className="py-3.5 px-4 font-bold min-w-[280px]">Sub-Categories</th>
                  <th className="py-3.5 px-4 font-bold min-w-[100px]">Status</th>
                  <th className="py-3.5 px-4 font-bold min-w-[120px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs font-bold text-[#8C8C8C]">
                      No categories found in database. Click "Add Master Category" to create a new category.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">{cat.code}</td>
                    <td className="py-3.5 px-4 font-bold text-[#1C1C1C] dark:text-white">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${cat.color}`}>
                        {cat.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#1C1C1C] dark:text-slate-200">
                      {cat.hsnCode} ({cat.gstRate})
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#1C1C1C] dark:text-white">
                      {cat.itemCount} SKUs
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {cat.subCategories.map((sub, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 bg-[#F7F9FB] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded text-[#1C1C1C] dark:text-slate-200">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="px-3 py-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1 border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" /> Edit
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-[#1C1C1C] dark:bg-blue-600 text-white rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{editingCategory ? 'Edit Product Category' : 'Add New Product Category'}</h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">Configure HSN taxation, badge colors, and sub-categories</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="px-6 pb-6 space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Specialty Breads & Loaves"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Category Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-bold text-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">Badge Color Theme</label>
                    <select
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    >
                      <option value="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Blue</option>
                      <option value="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Emerald Green</option>
                      <option value="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">Purple Violet</option>
                      <option value="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Amber Gold</option>
                      <option value="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">Rose Red</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold mb-1">GST HSN Code *</label>
                    <input
                      type="text"
                      name="hsnCode"
                      value={formData.hsnCode}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold mb-1">GST Rate *</label>
                    <select
                      name="gstRate"
                      value={formData.gstRate}
                      onChange={handleInputChange}
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                    >
                      <option value="5%">5% (Bread & Bakery)</option>
                      <option value="12%">12% (Confectionery)</option>
                      <option value="18%">18% (Standard)</option>
                      <option value="0%">0% (Exempt)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold mb-1">Sub-Categories (Comma Separated) *</label>
                  <input
                    type="text"
                    name="subCategoryInput"
                    placeholder="e.g. Sliced White, Garlic Loaf, Multigrain"
                    value={formData.subCategoryInput}
                    onChange={handleInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
