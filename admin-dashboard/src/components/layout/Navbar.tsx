import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sidebar as SidebarIcon, 
  Star, 
  Search, 
  Sun, 
  Moon,
  Clock, 
  Bell, 
  PanelRightClose,
  Home,
  ChevronRight,
  LayoutDashboard,
  Utensils,
  Factory,
  Package,
  Truck,
  Store,
  Receipt,
  Banknote,
  BarChart3,
  MapPin
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onToggleRightPanel?: () => void;
  onSelectRightPanelTab?: (tab: 'notifications' | 'activities' | 'contacts') => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isCurrentPageFavorite?: boolean;
  onToggleFavoritePage?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onToggleSidebar, 
  onToggleRightPanel,
  onSelectRightPanelTab,
  isDarkMode = false,
  onToggleDarkMode,
  isCurrentPageFavorite = false,
  onToggleFavoritePage
}) => {
  const location = useLocation();

  // Get active page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/products': return 'Products Catalog';
      case '/categories': return 'Categories Master';
      case '/recipes': return 'Recipes / BOM';
      case '/production': return 'Production Runs';
      case '/raw-materials': return 'Raw Materials';
      case '/trips': return 'Trips & Dispatch';
      case '/routes': return 'Delivery Routes';
      case '/shops': return 'Shops & Customers';
      case '/invoices': return 'Sales & Invoices';
      case '/collections': return 'Driver Collections';
      case '/reports': return 'Reports & Analytics';
      case '/': 
      default: return 'Dashboard';
    }
  };

  const getPageIcon = () => {
    switch (location.pathname) {
      case '/recipes': return <Utensils className="w-3.5 h-3.5 text-amber-500" />;
      case '/production': return <Factory className="w-3.5 h-3.5 text-emerald-500" />;
      case '/raw-materials': return <Package className="w-3.5 h-3.5 text-indigo-500" />;
      case '/trips': return <Truck className="w-3.5 h-3.5 text-cyan-500" />;
      case '/routes': return <MapPin className="w-3.5 h-3.5 text-blue-500" />;
      case '/shops': return <Store className="w-3.5 h-3.5 text-purple-500" />;
      case '/invoices': return <Receipt className="w-3.5 h-3.5 text-rose-500" />;
      case '/collections': return <Banknote className="w-3.5 h-3.5 text-emerald-500" />;
      case '/reports': return <BarChart3 className="w-3.5 h-3.5 text-blue-500" />;
      case '/': 
      default: return <LayoutDashboard className="w-3.5 h-3.5 text-sky-500" />;
    }
  };

  return (
    <header className={`h-14 ${isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-[#ECEFF2] text-[#1C1C1C]'} border-b px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none transition-colors duration-200`}>
      {/* Left section: Controls & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button 
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          className={`p-2 ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-[#F4F5F7] text-[#1C1C1C]'} rounded-xl transition cursor-pointer`}
        >
          <SidebarIcon className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>

        {/* Functional Star / Bookmark Button */}
        <button 
          onClick={onToggleFavoritePage}
          title={isCurrentPageFavorite ? 'Remove page from Sidebar Favorites' : 'Add page to Sidebar Favorites'}
          className={`p-2 sm:p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${
            isCurrentPageFavorite
              ? 'text-amber-500 bg-amber-500/10'
              : (isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-[#F4F5F7] text-[#8C8C8C]')
          }`}
        >
          <Star className={`w-4 h-4 ${isCurrentPageFavorite ? 'fill-amber-500' : ''}`} />
        </button>

        {/* SVG Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className={`hidden sm:flex items-center gap-1.5 font-medium px-2 py-1 rounded-md transition ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-[#8C8C8C] hover:text-[#1C1C1C] hover:bg-slate-100'}`}>
            <Home className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gemini Food ERP</span>
          </div>
          <ChevronRight className={`hidden sm:block w-3.5 h-3.5 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
          <div className={`flex items-center gap-1.5 font-bold px-2 py-1 rounded-lg border transition shadow-2xs text-xs sm:text-sm ${
            isDarkMode 
              ? 'bg-slate-800/90 border-slate-700/80 text-white' 
              : 'bg-white border-slate-200/90 text-[#1C1C1C]'
          }`}>
            {getPageIcon()}
            <span className="truncate max-w-[120px] sm:max-w-none">{getPageTitle()}</span>
          </div>
        </div>
      </div>

      {/* Right section: Search & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block w-36 sm:w-44">
          <Search className="w-3.5 h-3.5 text-[#8C8C8C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className={`w-full ${isDarkMode ? 'bg-slate-800 text-slate-200 placeholder-slate-400 border-slate-700 focus:bg-slate-900' : 'bg-[#F7F9FB] text-[#1C1C1C] placeholder-[#8C8C8C] border-transparent focus:bg-white focus:border-[#E2E8F0]'} text-xs pl-8 pr-7 py-1.5 rounded-lg border focus:outline-none transition`}
          />
          <kbd className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] ${isDarkMode ? 'bg-slate-900 text-slate-400 border-slate-700' : 'bg-white text-[#A0A0A0] border-[#E2E8F0]'} border px-1 rounded font-sans hidden sm:inline-block`}>
            /
          </kbd>
        </div>

        {/* 4 Header Buttons linked to Right Side Panel */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Button 1: Theme Toggle */}
          <button 
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={`p-2 sm:p-1.5 ${isDarkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-[#F4F5F7] text-[#1C1C1C]'} rounded-lg transition cursor-pointer active:scale-95`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Button 2: Clock Icon -> Shows Activities */}
          <button 
            onClick={() => onSelectRightPanelTab?.('activities')}
            title="View Recent System Activities in Right Panel"
            className={`p-2 sm:p-1.5 ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-[#F4F5F7] text-[#1C1C1C]'} rounded-lg transition cursor-pointer active:scale-95`}
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Button 3: Bell Icon -> Notifications */}
          <button 
            onClick={() => onSelectRightPanelTab?.('notifications')}
            title="View Notifications in Right Panel"
            className={`p-2 sm:p-1.5 ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-[#F4F5F7] text-[#1C1C1C]'} rounded-lg transition relative cursor-pointer active:scale-95`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          </button>

          {/* Button 4: Right Panel Toggle Icon */}
          <button 
            onClick={onToggleRightPanel}
            title="Toggle Right Side Panel"
            className={`p-2 sm:p-1.5 ${isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-[#F4F5F7] text-[#1C1C1C]'} rounded-lg transition cursor-pointer active:scale-95`}
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
