import React from 'react';
import { 
  Bug, 
  UserPlus, 
  Radio, 
  CheckCircle2, 
  Clock, 
  Bell, 
  Users, 
  Sparkles, 
  AlertTriangle,
  Package,
  Truck,
  DollarSign,
  CheckCheck,
  X
} from 'lucide-react';

interface RightPanelProps {
  activeTab?: 'notifications' | 'activities' | 'contacts';
  onTabChange?: (tab: 'notifications' | 'activities' | 'contacts') => void;
  isDarkMode?: boolean;
  onClose?: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({ 
  activeTab = 'notifications', 
  onTabChange,
  isDarkMode = false,
  onClose
}) => {
  return (
    <>
      {/* Mobile / Tablet Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden transition-opacity"
      />

      {/* Main Drawer Panel */}
      <aside className={`fixed inset-y-0 right-0 z-50 xl:static xl:z-20 w-85 max-w-[85vw] sm:w-80 shadow-2xl xl:shadow-none ${isDarkMode ? 'bg-[#0F172A] border-slate-800 text-slate-100' : 'bg-white border-[#ECEFF2] text-[#1C1C1C]'} border-l flex flex-col h-screen overflow-y-auto px-4 sm:px-5 py-4 sm:py-5 space-y-4 sm:space-y-6 select-none transition-all duration-300`}>
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between xl:hidden pb-1 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Panel Quick View</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Segmented Tab Selector */}
        <div className={`p-1 ${isDarkMode ? 'bg-slate-800' : 'bg-[#F4F5F7]'} rounded-xl flex items-center gap-1`}>
          <button
            onClick={() => onTabChange?.('notifications')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'notifications'
                ? (isDarkMode ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-[#1C1C1C] shadow-xs')
                : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts</span>
          </button>

          <button
            onClick={() => onTabChange?.('activities')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'activities'
                ? (isDarkMode ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-[#1C1C1C] shadow-xs')
                : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activities</span>
          </button>

          <button
            onClick={() => onTabChange?.('contacts')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'contacts'
                ? (isDarkMode ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-[#1C1C1C] shadow-xs')
                : 'text-[#8C8C8C] hover:text-[#1C1C1C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>People</span>
          </button>
        </div>

      {/* Notifications Tab View */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">System Notifications</h4>
            <span className="text-[10px] font-semibold bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">4 New</span>
          </div>

          <div className="space-y-3">
            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-[#F7F9FB] border-[#F0F2F5]'} flex gap-3 items-start hover:border-slate-300 transition`}>
              <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#1C1C1C] dark:text-white">Low Stock Warning</p>
                  <span className="text-[10px] text-[#8C8C8C]">10m ago</span>
                </div>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5 leading-snug">Refined Wheat Flour is at 1,500 KG (Below 2,000 KG threshold)</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-[#F7F9FB] border-[#F0F2F5]'} flex gap-3 items-start hover:border-slate-300 transition`}>
              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#1C1C1C] dark:text-white">Trip-101 Dispatched</p>
                  <span className="text-[10px] text-[#8C8C8C]">45m ago</span>
                </div>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5 leading-snug">Driver Rajesh Sharma loaded with 450 Packets on North Route A</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-[#F7F9FB] border-[#F0F2F5]'} flex gap-3 items-start hover:border-slate-300 transition`}>
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#1C1C1C] dark:text-white">UPI Payment Received</p>
                  <span className="text-[10px] text-[#8C8C8C]">2h ago</span>
                </div>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5 leading-snug">Received ₹4,850 for Invoice INV-1722774000 from City Supermarket</p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-[#F7F9FB] border-[#F0F2F5]'} flex gap-3 items-start hover:border-slate-300 transition`}>
              <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 mt-0.5">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-[#1C1C1C] dark:text-white">Batch Output Added</p>
                  <span className="text-[10px] text-[#8C8C8C]">3h ago</span>
                </div>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5 leading-snug">Batch RUN-892 completed 980 White Breads into Factory Inventory</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities Tab View */}
      {activeTab === 'activities' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">Recent System Activities</h4>
            <span className="text-[10px] font-semibold text-[#8C8C8C]">Today</span>
          </div>

          <div className="relative pl-3 border-l border-[#E5E7EB] dark:border-slate-800 space-y-4">
            <div className="relative flex items-start gap-3 text-xs">
              <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#1C1C1C] dark:bg-white"></span>
              <div>
                <p className="font-bold text-[#1C1C1C] dark:text-white">Changed recipe BOM ratio</p>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">Updated Maida & Yeast ratio for Standard White Bread</p>
                <span className="text-[10px] text-[#8C8C8C]">Just now • By Admin</span>
              </div>
            </div>

            <div className="relative flex items-start gap-3 text-xs">
              <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#80B3FF]"></span>
              <div>
                <p className="font-bold text-[#1C1C1C] dark:text-white">Released a new batch</p>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">Initiated RUN-902 for 1,200 Packets on Oven-Line-01</p>
                <span className="text-[10px] text-[#8C8C8C]">59m ago • By Ramesh Operator</span>
              </div>
            </div>

            <div className="relative flex items-start gap-3 text-xs">
              <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#B497E7]"></span>
              <div>
                <p className="font-bold text-[#1C1C1C] dark:text-white">Submitted sales invoice</p>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">Created spot truck invoice INV-901 for Ganesh Provisions</p>
                <span className="text-[10px] text-[#8C8C8C]">12h ago • By Mahesh Driver</span>
              </div>
            </div>

            <div className="relative flex items-start gap-3 text-xs">
              <span className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#4CD7B6]"></span>
              <div>
                <p className="font-bold text-[#1C1C1C] dark:text-white">Modified stock in Route A</p>
                <p className="text-[11px] text-[#8C8C8C] mt-0.5">Re-allocated 50 Buns from Truck-01 to Truck-02</p>
                <span className="text-[10px] text-[#8C8C8C]">Today 11:59 AM • By Sales Mgr</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Tab View */}
      {activeTab === 'contacts' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C8C8C]">Team & Route Drivers</h4>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">6 Active</span>
          </div>

          <div className="space-y-2.5">
            {[
              { name: 'Rajesh Sharma', role: 'Route Driver (Route A)', avatar: 'RS', bg: 'bg-[#E3F5FF]', status: 'On Route' },
              { name: 'Mahesh Selvam', role: 'Route Driver (Route B)', avatar: 'MS', bg: 'bg-[#E5ECF6]', status: 'On Route' },
              { name: 'Sunil Verma', role: 'Fleet Manager', avatar: 'SV', bg: 'bg-[#F3E8FF]', status: 'In Office' },
              { name: 'Ramesh Kumar', role: 'Oven Operator', avatar: 'RK', bg: 'bg-[#E5F2FE]', status: 'Factory Floor' },
              { name: 'Suresh Patel', role: 'Store Manager', avatar: 'SP', bg: 'bg-[#E6F9F3]', status: 'Warehouse' },
              { name: 'Natali Craig', role: 'Accountant', avatar: 'NC', bg: 'bg-[#FEE2E2]', status: 'Finance' },
            ].map((c, i) => (
              <div key={i} className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-800' : 'bg-[#F7F9FB] border-[#F0F2F5]'} flex items-center justify-between`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${c.bg} text-[#1C1C1C] font-bold text-xs flex items-center justify-center shrink-0`}>
                    {c.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1C1C1C] dark:text-white">{c.name}</p>
                    <p className="text-[10px] text-[#8C8C8C]">{c.role}</p>
                  </div>
                </div>
                <span className="text-[9px] font-semibold bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-700 px-2 py-0.5 rounded-md text-[#1C1C1C] dark:text-slate-300">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </aside>
    </>
  );
};
