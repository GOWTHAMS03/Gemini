import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { RightPanel } from './components/layout/RightPanel';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { RecipePage } from './pages/RecipePage';
import { ProductionPage } from './pages/ProductionPage';
import { RawMaterialPage } from './pages/RawMaterialPage';
import { TripsPage } from './pages/TripsPage';
import { ShopsPage } from './pages/ShopsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { RoutesPage } from './pages/RoutesPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { FinanceDashboardPage } from './pages/FinanceDashboardPage';
import { PurchaseBillingPage } from './pages/PurchaseBillingPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { CashBankPage } from './pages/CashBankPage';
import { SupplierLedgerPage } from './pages/SupplierLedgerPage';
import { FinancialReportsPage } from './pages/FinancialReportsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ShopVisitPage } from './pages/ShopVisitPage';
import { TripDispatchModulePage } from './pages/TripDispatchModulePage';
import { WeeklyTripPlanningPage } from './pages/WeeklyTripPlanningPage';
import { LoginPage } from './pages/LoginPage';

const routeTitleMap: Record<string, string> = {
  '/': 'Overview',
  '/employees': 'Employee Management',
  '/products': 'Products',
  '/categories': 'Categories',
  '/recipes': 'Recipes / BOM',
  '/production': 'Production',
  '/raw-materials': 'Raw Materials',
  '/trips': 'Vehicle Onboarding & Fleet Compliance',
  '/trip-dispatch': 'Trip Dispatch & Route Execution',
  '/weekly-trip-planning': 'Weekly Trip Planning',
  '/routes': 'Delivery Routes',
  '/shop-visits': 'Shop Visit Management',
  '/shops': 'Shops & Customers',
  '/invoices': 'Sales & Invoices',
  '/returns': 'Returns & Replacement',
  '/finance': 'Finance Dashboard',
  '/purchases': 'Purchase Billing',
  '/expenses': 'Expenses',
  '/cash-bank': 'Cash & Bank Treasury',
  '/supplier-ledgers': 'Supplier Ledgers',
  '/financial-reports': 'Financial Reports',
  '/reports': 'Reports & Analytics',
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false); // Default closed on mobile
  const [rightPanelTab, setRightPanelTab] = useState<'notifications' | 'activities' | 'contacts'>('notifications');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auto-close mobile sidebar and right panel on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
    if (window.innerWidth < 1280) {
      setShowRightPanel(false);
    }
  }, [location.pathname]);

  // Favorites & Recent Navigation State
  const [favoriteRoutes, setFavoriteRoutes] = useState<string[]>(['/', '/production', '/trips']);
  const [recentRoutes, setRecentRoutes] = useState<{ name: string; to: string }[]>([
    { name: 'Shops & Customers', to: '/shops' },
    { name: 'Sales & Invoices', to: '/invoices' }
  ]);

  // Track recent navigation
  useEffect(() => {
    const currentPath = location.pathname;
    const title = routeTitleMap[currentPath] || 'Overview';
    
    setRecentRoutes(prev => {
      const filtered = prev.filter(r => r.to !== currentPath);
      return [{ name: title, to: currentPath }, ...filtered].slice(0, 5);
    });
  }, [location.pathname]);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleFavoritePage = () => {
    const currentPath = location.pathname;
    if (favoriteRoutes.includes(currentPath)) {
      setFavoriteRoutes(favoriteRoutes.filter(r => r !== currentPath));
    } else {
      setFavoriteRoutes([...favoriteRoutes, currentPath]);
    }
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => !prev);
    }
  };

  const handleSelectRightPanelTab = (tab: 'notifications' | 'activities' | 'contacts') => {
    setShowRightPanel(true);
    setRightPanelTab(tab);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${isDarkMode ? 'bg-[#0F172A] text-slate-100' : 'bg-[#F7F9FB] text-[#1C1C1C]'} transition-colors duration-200`}>
      <Sidebar 
        collapsed={isSidebarCollapsed} 
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        favoriteRoutes={favoriteRoutes}
        recentRoutes={recentRoutes}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar 
          onToggleSidebar={handleToggleSidebar} 
          onToggleRightPanel={() => setShowRightPanel(!showRightPanel)}
          onSelectRightPanelTab={handleSelectRightPanelTab}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          isCurrentPageFavorite={favoriteRoutes.includes(location.pathname)}
          onToggleFavoritePage={toggleFavoritePage}
        />
        <main className="p-3 sm:p-6 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/recipes" element={<RecipePage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/raw-materials" element={<RawMaterialPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trip-dispatch" element={<TripDispatchModulePage />} />
            <Route path="/weekly-trip-planning" element={<WeeklyTripPlanningPage />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/shop-visits" element={<ShopVisitPage />} />
            <Route path="/shops" element={<ShopsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/finance" element={<FinanceDashboardPage />} />
            <Route path="/purchases" element={<PurchaseBillingPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/cash-bank" element={<CashBankPage />} />
            <Route path="/supplier-ledgers" element={<SupplierLedgerPage />} />
            <Route path="/financial-reports" element={<FinancialReportsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </main>
      </div>
      {showRightPanel && (
        <RightPanel 
          activeTab={rightPanelTab} 
          onTabChange={setRightPanelTab}
          isDarkMode={isDarkMode}
          onClose={() => setShowRightPanel(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('auth_token'));

  if (!authToken) {
    return <LoginPage onLoginSuccess={(token) => setAuthToken(token)} />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
