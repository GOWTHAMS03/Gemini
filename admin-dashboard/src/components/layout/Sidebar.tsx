import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import {
  PieChart,
  Package,
  Tag,
  UtensilsCrossed,
  Factory,
  Boxes,
  PackageCheck,
  Truck,
  MapPin,
  Store,
  FileText,
  DollarSign,
  BarChart3,
  Star,
  Clock,
  ChevronDown,
  Sparkles,
  Wallet,
  Building2,
  CreditCard,
  ShoppingBag,
  FileSpreadsheet,
  Users,
  Navigation,
  CalendarDays,
  Layers,
  X
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  favoriteRoutes?: string[];
  recentRoutes?: { name: string; to: string }[];
}

// ─── Grouped Navigation Structure ────────────────────────────────────────────

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    label: 'Dashboard',
    icon: PieChart,
    items: [
      { name: 'Dashboard', to: '/', icon: PieChart },
    ],
  },
  {
    label: 'Products & Recipes',
    icon: Package,
    items: [
      { name: 'Product Catalog', to: '/products', icon: Package },
      { name: 'Categories', to: '/categories', icon: Tag },
      { name: 'Recipes & BOM Master', to: '/recipes', icon: UtensilsCrossed },
      { name: 'Raw Materials Inventory', to: '/raw-materials', icon: Layers },
    ],
  },
  {
    label: 'Plant & Manufacturing',
    icon: Factory,
    items: [
      { name: '3-Stage Production Hub', to: '/production', icon: Factory },
      { name: 'Packaging & Dispatch Hub', to: '/packaging', icon: PackageCheck },
      { name: 'Central Plant Inventory', to: '/inventory', icon: Boxes },
    ],
  },
  {
    label: 'Fleet & Van Logistics',
    icon: Truck,
    items: [
      { name: 'Truck Fleet Inventory', to: '/truck-inventory', icon: Truck },
      { name: 'Trip Dispatch & Gate Check', to: '/trip-dispatch', icon: Navigation },
      { name: 'Weekly Trip Planning', to: '/weekly-trip-planning', icon: CalendarDays },
      { name: 'Delivery Routes', to: '/routes', icon: MapPin },
      { name: 'Vehicle Onboarding', to: '/trips', icon: Truck },
    ],
  },
  {
    label: 'Stores & Field Sales',
    icon: Store,
    items: [
      { name: 'Store Onboarding (CRM)', to: '/shops', icon: Store },
      { name: 'Shop Visits & Field Orders', to: '/shop-visits', icon: Store },
      { name: 'Employee & Crew Directory', to: '/employees', icon: Users },
    ],
  },
  {
    label: 'Sales & Invoicing',
    icon: FileText,
    items: [
      { name: 'Sales Orders & Invoices', to: '/invoices', icon: FileText },
      { name: 'Returns & Replacement Audit', to: '/returns', icon: Sparkles },
    ],
  },
  {
    label: 'Finance & Accounts',
    icon: DollarSign,
    items: [
      { name: 'Finance Overview', to: '/finance', icon: DollarSign },
      { name: 'Cash & Bank Treasury', to: '/cash-bank', icon: Wallet },
      { name: 'Purchase Billing', to: '/purchases', icon: ShoppingBag },
      { name: 'Operating Expenses', to: '/expenses', icon: CreditCard },
      { name: 'Supplier Ledgers', to: '/supplier-ledgers', icon: Building2 },
      { name: 'Financial Statements', to: '/financial-reports', icon: FileSpreadsheet },
      { name: 'Reports & Analytics BI', to: '/reports', icon: BarChart3 },
    ],
  },
];

// Flatten for favorites/recent lookup
const allNavItems = navigationGroups.flatMap(g => g.items);

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  isOpenMobile = false,
  onCloseMobile,
  favoriteRoutes = ['/', '/production', '/trips'],
  recentRoutes = [
    { name: 'Shops & Customers', to: '/shops' },
    { name: 'Sales & Invoices', to: '/invoices' }
  ]
}) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'favorites' | 'recently'>('favorites');

  // Track which groups are open — auto-expand the group containing the active route
  const getInitialOpenGroups = (): Set<string> => {
    const open = new Set<string>();
    for (const group of navigationGroups) {
      if (group.items.some(item => item.to === location.pathname)) {
        open.add(group.label);
      }
    }
    // Always open Dashboard
    open.add('Dashboard');
    return open;
  };

  const [openGroups, setOpenGroups] = useState<Set<string>>(getInitialOpenGroups);

  // Auto-expand group when route changes
  useEffect(() => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      for (const group of navigationGroups) {
        if (group.items.some(item => item.to === location.pathname)) {
          next.add(group.label);
        }
      }
      return next;
    });
  }, [location.pathname]);

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) { next.delete(label); } else { next.add(label); }
      return next;
    });
  };

  const favoriteItems = allNavItems.filter(item => favoriteRoutes.includes(item.to));

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#0F172A] border-r border-[#ECEFF2] dark:border-slate-800 flex flex-col h-screen overflow-hidden select-none transition-all duration-300 shrink-0
        lg:sticky lg:top-0 lg:z-20
        ${isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'lg:w-16' : 'lg:w-64'}
      `}>
        {/* Fixed Brand Header */}
        <div className={`shrink-0 px-4 py-3.5 flex items-center justify-between border-b border-[#ECEFF2]/60 dark:border-slate-800/60 bg-white dark:bg-[#0F172A] z-10 ${collapsed ? 'lg:justify-center' : ''}`}>
          <Logo collapsed={collapsed} size="md" />

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none">
          {/* Dynamic Favorites / Recently Switcher Section */}
          {!collapsed && (
            <div className="space-y-2">
              {/* Segmented Pill Switcher */}
              <div className="p-0.5 bg-[#F4F5F7] dark:bg-slate-800/80 rounded-xl flex items-center">
                <button
                  onClick={() => setActiveSection('favorites')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${activeSection === 'favorites'
                      ? 'bg-white dark:bg-slate-700 text-[#1C1C1C] dark:text-white shadow-2xs font-extrabold'
                      : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white font-medium'
                    }`}
                >
                  <Star className={`w-3 h-3 ${activeSection === 'favorites' ? 'text-amber-500 fill-amber-500' : 'text-[#8C8C8C]'}`} />
                  <span>Favorites</span>
                </button>

                <button
                  onClick={() => setActiveSection('recently')}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${activeSection === 'recently'
                      ? 'bg-white dark:bg-slate-700 text-[#1C1C1C] dark:text-white shadow-2xs font-extrabold'
                      : 'text-[#8C8C8C] dark:text-slate-400 hover:text-[#1C1C1C] dark:hover:text-white font-medium'
                    }`}
                >
                  <Clock className={`w-3 h-3 ${activeSection === 'recently' ? 'text-blue-500' : 'text-[#8C8C8C]'}`} />
                  <span>Recently</span>
                </button>
              </div>

              {/* Favorites List */}
              {activeSection === 'favorites' && (
                <div className="space-y-0.5 animate-in fade-in duration-150">
                  {favoriteItems.map(item => {
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${isActive
                            ? 'bg-[#E5ECF6] dark:bg-slate-800 text-[#1C1C1C] dark:text-white font-bold'
                            : 'text-[#1C1C1C] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-800/60'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <item.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {item.badge}
                            </span>
                          )}
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* Recently Visited List */}
              {activeSection === 'recently' && (
                <div className="space-y-0.5 animate-in fade-in duration-150">
                  {recentRoutes.map(item => {
                    const matched = allNavItems.find(n => n.to === item.to);
                    const isActive = location.pathname === item.to;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleNavClick}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${isActive
                            ? 'bg-[#E5ECF6] dark:bg-slate-800 text-[#1C1C1C] dark:text-white font-bold'
                            : 'text-[#1C1C1C] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-800/60'
                          }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {matched?.badge && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {matched.badge}
                            </span>
                          )}
                          <Clock className="w-3 h-3 text-slate-400" />
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ Grouped Navigation ═══ */}
          <div className="space-y-1">
            {navigationGroups.map(group => {
              const isGroupOpen = openGroups.has(group.label);
              const hasActiveChild = group.items.some(item => location.pathname === item.to);

              // For single-item groups (Dashboard, Analytics), render as direct link
              if (group.items.length === 1) {
                const item = group.items[0];
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${isActive
                        ? 'bg-indigo-600 text-white shadow-sm font-bold'
                        : 'text-[#1C1C1C] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-800/80'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </NavLink>
                );
              }

              // Multi-item groups: collapsible section
              return (
                <div key={group.label} className="space-y-0.5">
                  {/* Group Header */}
                  {!collapsed ? (
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer ${hasActiveChild
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-black'
                          : 'text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 text-left">
                        <div className={`p-1 rounded-lg shrink-0 ${hasActiveChild ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                          <group.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate text-[11px] font-extrabold tracking-wider text-left uppercase">{group.label}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-1 transition-transform duration-200 ${isGroupOpen ? 'rotate-180' : ''} ${hasActiveChild ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    </button>
                  ) : (
                    <div className="flex justify-center py-1">
                      <div className="w-6 h-px bg-[#E9ECEF] dark:bg-slate-700 rounded" />
                    </div>
                  )}

                  {/* Group Items */}
                  {(isGroupOpen || collapsed) && (
                    <div className={`space-y-0.5 ${!collapsed ? 'ml-1 pl-3 border-l-2 border-[#F0F2F5] dark:border-slate-800' : ''}`}>
                      {group.items.map(item => {
                        const isActive = location.pathname === item.to;
                        return (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${isActive
                                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                                : 'text-[#1C1C1C] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-800/80'
                              } ${collapsed ? 'justify-center px-0' : ''}`}
                          >
                            <item.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                            {!collapsed && (
                              <div className="flex items-center justify-between flex-1 min-w-0">
                                <span className="truncate">{item.name}</span>
                                {item.badge && (
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md tracking-wider ${isActive
                                      ? 'bg-white text-indigo-700 shadow-2xs font-black'
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
