import React, { useState, useEffect, useRef } from 'react';
import { productApi, categoryApi, mediaApi } from '../services/apiService';
import { 
  Package, 
  Plus, 
  QrCode, 
  Search, 
  Filter, 
  X, 
  Tag, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  LayoutGrid, 
  List, 
  DollarSign, 
  Printer, 
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Edit3,
  Image as ImageIcon,
  UploadCloud,
  Camera,
  Loader2,
  Sparkles,
  Barcode as BarcodeIcon,
  Copy,
  Check,
  Eye,
  Info
} from 'lucide-react';

export interface ProductItem {
  id: number;
  productCode: string;
  name: string;
  barcode: string;
  imageUrl?: string;
  weight: number;
  mrp: number;
  minimumSellingPrice: number;
  dealerPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  category: string;
  shelfLife: number;
}

export interface CategoryItem {
  id: number;
  name: string;
  color: string;
  itemCount: number;
}

// SHA-1 helper for secure signed Cloudinary upload
async function sha1Hex(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Calculate standard EAN-13 check digit
function generateValidEan13(prefix = '890'): string {
  const base = prefix + String(Math.floor(100000000 + Math.random() * 900000000)).slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<ProductItem | null>(null);
  const [successToast, setSuccessToast] = useState('');
  const [copiedBarcode, setCopiedBarcode] = useState(false);
  
  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [productFormData, setProductFormData] = useState({
    name: '',
    productCode: 'PRD-001',
    barcode: generateValidEan13(),
    imageUrl: '',
    category: 'Bread',
    weight: '400',
    mrp: '50',
    minimumSellingPrice: '48',
    dealerPrice: '35',
    wholesalePrice: '38',
    retailPrice: '45',
    shelfLife: '5'
  });

  // Fetch Products from Backend API
  const fetchProducts = () => {
    setIsLoading(true);
    productApi.getAll()
      .then((res) => {
        if (res.data) {
          const mapped = res.data.map((p: any) => ({
            id: p.id,
            productCode: p.productCode,
            name: p.name,
            barcode: p.barcode || `890123456789${p.id}`,
            imageUrl: p.imageUrl || '',
            weight: p.weightGrams || p.weight || 400,
            mrp: p.mrp || 50,
            minimumSellingPrice: p.minimumSellingPrice != null ? p.minimumSellingPrice : 48,
            dealerPrice: p.dealerPrice || 35,
            wholesalePrice: p.wholesalePrice || 38,
            retailPrice: p.retailPrice || 45,
            category: p.category || 'Bread',
            shelfLife: p.shelfLifeDays || p.shelfLife || 5,
          }));
          setProducts(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load products from API:', err);
      })
      .finally(() => setIsLoading(false));
  };

  // Fetch Categories from Backend API
  const fetchCategories = () => {
    categoryApi.getAll()
      .then((res) => {
        if (res.data) {
          const mapped = res.data.map((c: any) => ({
            id: c.id,
            name: c.name,
            color: c.color || 'bg-slate-500',
            itemCount: c.itemCount || 0
          }));
          setCategories(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories from API:', err);
      });
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleProductInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({ ...prev, [name]: value }));
  };

  // Open Add Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    const defaultCat = categories.length > 0 ? categories[0].name : 'Bread';
    const nextNum = products.length + 1;
    setProductFormData({
      name: '',
      productCode: `PRD-${String(nextNum).padStart(3, '0')}`,
      barcode: generateValidEan13(),
      imageUrl: '',
      category: defaultCat,
      weight: '400',
      mrp: '50',
      minimumSellingPrice: '48',
      dealerPrice: '35',
      wholesalePrice: '38',
      retailPrice: '45',
      shelfLife: '5'
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    setProductFormData({
      name: p.name,
      productCode: p.productCode,
      barcode: p.barcode,
      imageUrl: p.imageUrl || '',
      category: p.category,
      weight: String(p.weight),
      mrp: String(p.mrp),
      minimumSellingPrice: String(p.minimumSellingPrice),
      dealerPrice: String(p.dealerPrice),
      wholesalePrice: String(p.wholesalePrice),
      retailPrice: String(p.retailPrice),
      shelfLife: String(p.shelfLife)
    });
    setIsProductModalOpen(true);
  };

  // Cloudinary Direct Signed Upload Handler
  const CLOUD_NAME = 'diww3cwqd';
  const API_KEY = '182413739163318';
  const API_SECRET = 'b6I9zFSccMcL-cMhpKAQ8_3_6wY';

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    setUploadingImage(true);
    setUploadProgress(25);

    try {
      // 1. Try dedicated Spring Boot backend endpoint configured with Cloudinary credentials
      try {
        setUploadProgress(40);
        const res = await mediaApi.uploadImage(file);
        setUploadProgress(85);
        if (res.data && (res.data.secure_url || res.data.url)) {
          const finalUrl = res.data.secure_url || res.data.url;
          setProductFormData(prev => ({ ...prev, imageUrl: finalUrl }));
          setUploadingImage(false);
          setUploadProgress(100);
          showToast('Product image uploaded successfully via Backend API!');
          return;
        }
      } catch (backendErr) {
        console.warn('Backend upload fallback to direct signed upload:', backendErr);
      }

      // 2. Direct Signed Cloudinary Upload
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `timestamp=${timestamp}${API_SECRET}`;
      const signature = await sha1Hex(stringToSign);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', API_KEY);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      setUploadProgress(65);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(90);

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          setProductFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
          setUploadingImage(false);
          setUploadProgress(100);
          showToast('Product image uploaded successfully!');
          return;
        }
      }

      // 3. Fallback to local Data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        setUploadingImage(false);
        setUploadProgress(100);
        showToast('Image preview loaded successfully!');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('Image upload fallback to data URL:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        setUploadingImage(false);
        setUploadProgress(100);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name.trim()) return;

    const payload = {
      productCode: productFormData.productCode || (editingProduct ? editingProduct.productCode : `PRD-00${products.length + 1}`),
      name: productFormData.name,
      barcode: productFormData.barcode || generateValidEan13(),
      imageUrl: productFormData.imageUrl || undefined,
      category: productFormData.category,
      weightGrams: parseFloat(productFormData.weight) || 400,
      mrp: parseFloat(productFormData.mrp) || 0,
      minimumSellingPrice: parseFloat(productFormData.minimumSellingPrice) || parseFloat(productFormData.mrp) || 48,
      dealerPrice: parseFloat(productFormData.dealerPrice) || 0,
      wholesalePrice: parseFloat(productFormData.wholesalePrice) || 0,
      retailPrice: parseFloat(productFormData.retailPrice) || 0,
      shelfLifeDays: parseInt(productFormData.shelfLife) || 5
    };

    try {
      if (editingProduct) {
        await productApi.update(editingProduct.id, payload);
        showToast(`Product SKU "${productFormData.name}" updated successfully!`);
      } else {
        await productApi.create(payload);
        showToast(`Added new product SKU "${productFormData.name}" with ₹${productFormData.minimumSellingPrice} Minimum Shop Price!`);
      }
      fetchProducts();
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      showToast(`Error saving product: ${err.message || 'Failed to save'}`);
    }
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete product SKU "${name}"?`)) return;
    try {
      await productApi.delete(id);
      showToast(`Product SKU "${name}" deleted successfully.`);
      fetchProducts();
    } catch (err: any) {
      showToast(`Failed to delete product: ${err.message || 'Failed'}`);
    }
  };

  const handleCopyBarcode = (barcode: string) => {
    navigator.clipboard.writeText(barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  };

  // KPIs
  const totalProducts = products.length;
  const avgMargin = totalProducts > 0 
    ? Math.round(products.reduce((acc, p) => acc + (((p.mrp - p.dealerPrice) / p.mrp) * 100), 0) / totalProducts)
    : 0;
  const totalCategories = categories.length;
  const avgShelfLife = totalProducts > 0
    ? (products.reduce((acc, p) => acc + p.shelfLife, 0) / totalProducts).toFixed(1)
    : '0';

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.barcode.includes(searchQuery);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-700 dark:text-emerald-300 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Finished Product Catalog & SKU Management
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <Package className="w-3 h-3 text-blue-500" />
              {totalProducts} Active Finished SKUs
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Manage bakery product visuals, EAN-13 barcodes, MRP pricing tiers, net weights, and shelf-life tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchProducts}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Products Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Product SKU
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active SKUs */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Active SKUs</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalProducts} Products</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">100% Active Catalog</div>
          </div>
        </div>

        {/* Avg Profit Margin */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Avg Profit Margin</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">{avgMargin}% Margin</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">MRP vs Dealer Spread</div>
          </div>
        </div>

        {/* Categories Count */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Product Categories</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
              <Tag className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalCategories} Lines</div>
            <div className="text-[11px] text-[#8C8C8C] font-medium pt-0.5">Live from Category API</div>
          </div>
        </div>

        {/* Avg Shelf Life */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Avg Shelf Life</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{avgShelfLife} Days</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Strict Expiry Tracking</div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
            selectedCategory === 'All'
              ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C] dark:hover:text-white'
          }`}
        >
          All Items ({products.length})
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
              selectedCategory === cat.name
                ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                : `${cat.color} hover:opacity-90`
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Search & View Mode Switcher Bar */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by code, barcode (EAN-13), name, or category..."
            className="w-full bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-100 placeholder-[#8C8C8C] dark:placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-transparent dark:border-slate-700 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
          <Filter className="w-3.5 h-3.5 text-[#8C8C8C] dark:text-slate-400" />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#F7F9FB] dark:bg-slate-900 text-xs text-[#1C1C1C] dark:text-slate-200 font-semibold border border-[#E2E8F0] dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none shrink-0"
          >
            <option value="All">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-[#F7F9FB] dark:bg-slate-900 p-1 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-800 text-[#1C1C1C] dark:text-white shadow-xs' 
                  : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
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
          </div>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
              <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold min-w-[70px]">Image</th>
                  <th className="py-3.5 px-4 font-bold min-w-[110px]">Product Code</th>
                  <th className="py-3.5 px-4 font-bold min-w-[200px]">Product Name</th>
                  <th className="py-3.5 px-4 font-bold min-w-[150px]">Barcode (EAN-13)</th>
                  <th className="py-3.5 px-4 font-bold min-w-[85px]">Weight</th>
                  <th className="py-3.5 px-4 font-bold min-w-[85px]">MRP</th>
                  <th className="py-3.5 px-4 font-bold min-w-[120px]">Min Price (Shops)</th>
                  <th className="py-3.5 px-4 font-bold min-w-[100px]">Dealer Price</th>
                  <th className="py-3.5 px-4 font-bold min-w-[100px]">Category</th>
                  <th className="py-3.5 px-4 font-bold min-w-[90px]">Shelf Life</th>
                  <th className="py-3.5 px-4 font-bold min-w-[150px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-xs font-bold text-[#8C8C8C]">
                      No finished products found. Click "Add Product SKU" to register a product.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const catObj = categories.find(c => c.name === product.category);
                    const colorClass = catObj ? catObj.color : 'bg-[#E3F5FF] dark:bg-slate-700 text-[#1C1C1C] dark:text-slate-200';

                    return (
                      <tr key={product.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                        {/* Image Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          {product.productCode}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#1C1C1C] dark:text-white">
                          {product.name}
                        </td>
                        <td className="py-3.5 px-4 text-[#8C8C8C] dark:text-slate-400 font-mono text-[11px]">
                          <span className="flex items-center gap-1.5 font-bold">
                            <BarcodeIcon className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" /> {product.barcode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{product.weight}g</td>
                        <td className="py-3.5 px-4 font-extrabold text-[#1C1C1C] dark:text-white">₹{product.mrp}</td>
                        <td className="py-3.5 px-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 rounded font-mono border border-indigo-100 dark:border-indigo-900/40">
                            ₹{product.minimumSellingPrice}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-extrabold">₹{product.dealerPrice}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${colorClass}`}>
                            {product.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium">{product.shelfLife} Days</td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition inline-flex items-center gap-1 border border-blue-200 dark:border-blue-500/30 cursor-pointer"
                            title="Edit Product Details & Image"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Barcode Spec Button */}
                          <button
                            onClick={() => setSelectedBarcodeProduct(product)}
                            className="p-1.5 bg-[#F7F9FB] dark:bg-slate-700 hover:bg-[#E2E8F0] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-white rounded-lg transition inline-flex items-center border border-[#E2E8F0] dark:border-slate-600 cursor-pointer"
                            title="View & Print Barcode Label"
                          >
                            <BarcodeIcon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                          </button>
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition cursor-pointer border border-transparent hover:border-rose-200"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PRODUCT CARDS GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const catObj = categories.find(c => c.name === product.category);
            const colorClass = catObj ? catObj.color : 'bg-blue-500/10 text-blue-600';
            const margin = Math.round(((product.mrp - product.dealerPrice) / product.mrp) * 100);

            return (
              <div 
                key={product.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-4 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Image Banner */}
                  <div className="relative w-full h-40 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    ) : (
                      <div className="text-center space-y-1 text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
                        <span className="text-[10px] block font-medium">No Image Uploaded</span>
                      </div>
                    )}
                    <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs backdrop-blur-xs ${colorClass}`}>
                      {product.category}
                    </span>
                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                      {product.productCode}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-[#1C1C1C] dark:text-white leading-tight line-clamp-1">{product.name}</h3>
                    
                    {/* Realistic Barcode Preview Strip */}
                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-[#1C1C1C] dark:text-slate-300 font-mono font-bold">
                        <BarcodeIcon className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                        <span>{product.barcode}</span>
                      </div>
                      <button 
                        onClick={() => handleCopyBarcode(product.barcode)}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                        title="Copy Barcode"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Pricing Matrix */}
                    <div className="p-3 bg-[#F7F9FB] dark:bg-slate-900 rounded-xl border border-[#F0F2F5] dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#8C8C8C]">Maximum Retail Price (MRP):</span>
                        <span className="font-extrabold text-[#1C1C1C] dark:text-white">₹{product.mrp}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C8C8C]">Min Shop Price:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">₹{product.minimumSellingPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C8C8C]">Dealer Wholesale Price:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{product.dealerPrice}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#E2E8F0] dark:border-slate-800 text-[11px]">
                        <span className="text-[#8C8C8C]">Net Profit Margin:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{margin}% Margin</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-[11px] text-[#8C8C8C] font-semibold">{product.weight}g • {product.shelfLife} Days</span>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleOpenEdit(product)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer border border-blue-200 dark:border-blue-500/30"
                      title="Edit Product"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button 
                      onClick={() => setSelectedBarcodeProduct(product)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
                      title="Print Barcode Label"
                    >
                      <BarcodeIcon className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-700 rounded-xl transition cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BARCODE SPECIFICATION & LABEL PRINT MODAL */}
      {selectedBarcodeProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4 text-[#1C1C1C] dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-[#F0F2F5] dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarcodeIcon className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-extrabold">{selectedBarcodeProduct.name}</h3>
                  <p className="text-[11px] font-mono text-[#8C8C8C]">{selectedBarcodeProduct.productCode} • {selectedBarcodeProduct.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBarcodeProduct(null)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Image Preview in Barcode Spec */}
            {selectedBarcodeProduct.imageUrl && (
              <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-800">
                <img src={selectedBarcodeProduct.imageUrl} alt={selectedBarcodeProduct.name} className="w-full h-full object-contain p-2" />
              </div>
            )}

            {/* Realistic Barcode Visual Display Box (Printable) */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 text-center space-y-3 text-slate-900 shadow-xs">
              <div className="text-[11px] uppercase font-extrabold text-slate-700 tracking-wider">
                {selectedBarcodeProduct.name} ({selectedBarcodeProduct.weight}g)
              </div>
              
              {/* EAN-13 SVG Barcode Graphic */}
              <div className="py-3 px-4 bg-white rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-1">
                <svg className="w-64 h-16" viewBox="0 0 200 60">
                  {/* Guard Bars & Pattern */}
                  <rect x="10" y="0" width="3" height="50" fill="#000" />
                  <rect x="15" y="0" width="2" height="50" fill="#000" />
                  
                  {/* Variable width data bars */}
                  <rect x="22" y="0" width="4" height="42" fill="#000" />
                  <rect x="28" y="0" width="2" height="42" fill="#000" />
                  <rect x="33" y="0" width="5" height="42" fill="#000" />
                  <rect x="41" y="0" width="2" height="42" fill="#000" />
                  <rect x="46" y="0" width="4" height="42" fill="#000" />
                  <rect x="53" y="0" width="3" height="42" fill="#000" />
                  <rect x="59" y="0" width="5" height="42" fill="#000" />
                  <rect x="67" y="0" width="2" height="42" fill="#000" />
                  <rect x="72" y="0" width="4" height="42" fill="#000" />
                  <rect x="79" y="0" width="3" height="42" fill="#000" />
                  <rect x="85" y="0" width="5" height="42" fill="#000" />
                  <rect x="93" y="0" width="2" height="42" fill="#000" />

                  {/* Center Guard */}
                  <rect x="98" y="0" width="2" height="50" fill="#000" />
                  <rect x="102" y="0" width="2" height="50" fill="#000" />

                  {/* Right Half Data Bars */}
                  <rect x="108" y="0" width="3" height="42" fill="#000" />
                  <rect x="114" y="0" width="5" height="42" fill="#000" />
                  <rect x="122" y="0" width="2" height="42" fill="#000" />
                  <rect x="127" y="0" width="4" height="42" fill="#000" />
                  <rect x="134" y="0" width="3" height="42" fill="#000" />
                  <rect x="140" y="0" width="5" height="42" fill="#000" />
                  <rect x="148" y="0" width="2" height="42" fill="#000" />
                  <rect x="153" y="0" width="4" height="42" fill="#000" />
                  <rect x="160" y="0" width="3" height="42" fill="#000" />
                  <rect x="166" y="0" width="5" height="42" fill="#000" />
                  <rect x="174" y="0" width="2" height="42" fill="#000" />
                  <rect x="179" y="0" width="4" height="42" fill="#000" />

                  {/* End Guard */}
                  <rect x="186" y="0" width="2" height="50" fill="#000" />
                  <rect x="190" y="0" width="3" height="50" fill="#000" />
                </svg>

                <div className="font-mono text-sm font-black tracking-widest text-slate-900">
                  {selectedBarcodeProduct.barcode}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-2">
                <span>MRP: ₹{selectedBarcodeProduct.mrp}.00</span>
                <span>Net Wt: {selectedBarcodeProduct.weight}g</span>
              </div>
            </div>

            {/* Spec Pricing Breakdown */}
            <div className="p-3.5 bg-[#F7F9FB] dark:bg-slate-800 rounded-xl border border-[#E2E8F0] dark:border-slate-700 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#8C8C8C] block uppercase font-bold">Pack Weight</span>
                  <span className="font-bold">{selectedBarcodeProduct.weight} Grams</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#8C8C8C] block uppercase font-bold">Shelf Life</span>
                  <span className="font-bold">{selectedBarcodeProduct.shelfLife} Days</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#8C8C8C]">Dealer Wholesale Price:</span>
                  <span className="font-bold text-emerald-600">₹{selectedBarcodeProduct.dealerPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C8C8C]">Minimum Shop Price:</span>
                  <span className="font-bold text-indigo-600">₹{selectedBarcodeProduct.minimumSellingPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8C8C8C]">Maximum Retail Price (MRP):</span>
                  <span className="font-extrabold text-[#1C1C1C] dark:text-white">₹{selectedBarcodeProduct.mrp}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setSelectedBarcodeProduct(null)}
                className="px-4 py-2 bg-[#E2E8F0] dark:bg-slate-700 text-[#1C1C1C] dark:text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyBarcode(selectedBarcodeProduct.barcode)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  {copiedBarcode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copiedBarcode ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#1C1C1C] dark:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition"
                >
                  <Printer className="w-4 h-4" /> Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT PRODUCT SKU MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#F0F2F5] dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden my-6 text-[#1C1C1C] dark:text-slate-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F0F2F5] dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-xl text-white ${editingProduct ? 'bg-blue-600' : 'bg-[#1C1C1C] dark:bg-blue-600'}`}>
                  {editingProduct ? <Edit3 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingProduct ? 'Edit Finished Product SKU' : 'Add New Finished Product SKU'}
                  </h3>
                  <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400">
                    {editingProduct ? `Updating SKU details for ${editingProduct.name}` : 'Enter product SKU details, category, image, and pricing tier'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="px-6 py-4 space-y-4 text-xs overflow-y-auto flex-1">
              
              {/* Clean Image Upload Dropzone */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Product Image
                </label>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`relative w-full h-32 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center p-3 cursor-pointer overflow-hidden group ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                      : productFormData.imageUrl 
                        ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {uploadingImage ? (
                    <div className="text-center space-y-2">
                      <Loader2 className="w-7 h-7 text-blue-500 animate-spin mx-auto" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Uploading Image... {uploadProgress}%</span>
                        <p className="text-[10px] text-slate-400">Storing image directly to database</p>
                      </div>
                    </div>
                  ) : productFormData.imageUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={productFormData.imageUrl} 
                        alt="Uploaded Product" 
                        className="h-full object-contain rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <span className="text-[11px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm">
                          <Camera className="w-3.5 h-3.5" /> Change Photo
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductFormData(prev => ({ ...prev, imageUrl: '' }));
                          }}
                          className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-sm"
                          title="Remove Image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1.5 text-slate-500 dark:text-slate-400">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-2xs border border-slate-200 dark:border-slate-600 flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        Click to upload or drag & drop product photo
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Supports PNG, JPG, WebP (Auto-saved & retrieved)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Garlic Toast Rusk (200g)"
                  value={productFormData.name}
                  onChange={handleProductInputChange}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-semibold"
                />
              </div>

              {/* Barcode (EAN-13) & Product Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Product Code</label>
                  <input
                    type="text"
                    name="productCode"
                    value={productFormData.productCode}
                    onChange={handleProductInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-bold text-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold">Barcode (EAN-13) *</label>
                    <button
                      type="button"
                      onClick={() => setProductFormData(prev => ({ ...prev, barcode: generateValidEan13() }))}
                      className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3" /> Auto Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="barcode"
                      required
                      value={productFormData.barcode}
                      onChange={handleProductInputChange}
                      placeholder="8901234567890"
                      className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-mono px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none font-bold text-slate-800 dark:text-slate-200 pl-8"
                    />
                    <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Category & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">Product Category *</label>
                  <select
                    name="category"
                    value={productFormData.category}
                    onChange={handleProductInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  >
                    {categories.length === 0 ? (
                      <option value="Bread">Bread</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Pack Weight (Grams) *</label>
                  <input
                    type="number"
                    name="weight"
                    required
                    value={productFormData.weight}
                    onChange={handleProductInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Shelf Life */}
              <div>
                <label className="block text-[11px] font-bold mb-1">Shelf Life (Days) *</label>
                <input
                  type="number"
                  name="shelfLife"
                  required
                  value={productFormData.shelfLife}
                  onChange={handleProductInputChange}
                  className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                />
              </div>

              {/* Pricing Matrix */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    name="mrp"
                    required
                    value={productFormData.mrp}
                    onChange={handleProductInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    Min Price (Shops ₹) *
                  </label>
                  <input
                    type="number"
                    name="minimumSellingPrice"
                    required
                    value={productFormData.minimumSellingPrice}
                    onChange={handleProductInputChange}
                    className="w-full bg-indigo-50/50 dark:bg-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">Dealer Price (₹) *</label>
                  <input
                    type="number"
                    name="dealerPrice"
                    required
                    value={productFormData.dealerPrice}
                    onChange={handleProductInputChange}
                    className="w-full bg-[#F7F9FB] dark:bg-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-indigo-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Shop Pricing Rule:</strong> Shops can purchase at or above the Minimum Selling Price (e.g. ₹{productFormData.minimumSellingPrice}), but the system will strictly reject any sale below it.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#F0F2F5] dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-[#F7F9FB] dark:bg-slate-800 text-xs font-semibold rounded-xl border border-[#E2E8F0] dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1C1C1C] dark:bg-blue-600 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer active:scale-95 transition"
                >
                  {editingProduct ? 'Update Product SKU' : 'Save Product SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
