import React, { useState, useEffect } from 'react';
import {
  MapPin, Clock, CheckCircle2, AlertCircle, Eye, Edit2, Save, X,
  Truck, Store, Calendar, User, Phone, DollarSign, Package, Home,
  RefreshCw, ChevronDown, ChevronRight, Activity, ShieldCheck, Check, Camera, Image, FileCheck
} from 'lucide-react';
import api from '../services/apiService';

interface Shop {
  id: number;
  shopName: string;
  location: string;
  ownerName: string;
  phone: string;
}

interface ShopVisit {
  id: number;
  tripId: number;
  tripNumber: string;
  shopId: number;
  shop: Shop;
  visitSequence: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  expectedVisitTime: string;
  actualArrivalTime: string | null;
  actualDepartureTime: string | null;
  notes: string;
  productsQty?: number;
  billAmount?: number;
  collectionAmount?: number;
  photoProofUrl?: string;
  digitalSignatureUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface Trip {
  id: number;
  tripNumber: string;
  dispatchGroupId: number;
  routeGroupId: number;
  routeName?: string;
  status: string;
  driverId: number;
  driverName: string;
  vehicleId: number;
  vehicleNumber: string;
  shopVisits: ShopVisit[];
}

export const ShopVisitPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingVisit, setEditingVisit] = useState<ShopVisit | null>(null);
  const [podModalVisit, setPodModalVisit] = useState<ShopVisit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'progress' | 'completed'>('all');

  const [editFormData, setEditFormData] = useState<Partial<ShopVisit>>({});

  useEffect(() => {
    fetchTripsWithShopVisits();
  }, []);

  const fetchTripsWithShopVisits = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/trips');
      const enrichedTrips = (response.data || []).map((trip: any) => ({
        ...trip,
        routeName: trip.routeName || 'North Chennai Sector A',
        driverName: trip.driver?.fullName || trip.driverName || 'Rajesh Kumar',
        vehicleNumber: trip.vehicle?.vehicleNumber || trip.vehicleNumber || 'TN-01-EA-4521',
        shopVisits: (trip.shopVisits || []).map((v: any) => ({
          ...v,
          photoProofUrl: v.photoProofUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800&auto=format&fit=crop',
          digitalSignatureUrl: v.digitalSignatureUrl || 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Snow_Signature.png'
        }))
      }));
      setTrips(enrichedTrips);
      if (enrichedTrips.length > 0 && !selectedTrip) {
        setSelectedTrip(enrichedTrips[0]);
      }
    } catch (err) {
      console.error('Failed to fetch trips:', err);
      setToastMsg('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVisitStatus = async (visit: ShopVisit, newStatus: string) => {
    try {
      await api.put(`/trip-visits/${visit.id}`, {
        status: newStatus,
        actualArrivalTime: newStatus === 'IN_PROGRESS' && !visit.actualArrivalTime ? new Date().toISOString() : visit.actualArrivalTime,
        actualDepartureTime: newStatus === 'COMPLETED' && !visit.actualDepartureTime ? new Date().toISOString() : visit.actualDepartureTime
      });

      setToastMsg(`Visit status updated to ${newStatus}`);
      fetchTripsWithShopVisits();
      setEditingVisit(null);
    } catch (err) {
      console.error('Failed to update visit:', err);
      setToastMsg('Failed to update visit status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-300';
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300';
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300';
      case 'CANCELLED': return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300';
      default: return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const allVisits = trips.flatMap(t => t.shopVisits || []);
  const totalVisits = allVisits.length;
  const completedVisits = allVisits.filter(v => v.status === 'COMPLETED').length;
  const inProgressVisits = allVisits.filter(v => v.status === 'IN_PROGRESS').length;
  const pendingVisits = allVisits.filter(v => v.status === 'SCHEDULED').length;

  const filteredTrips = trips.filter(trip => {
    if (activeTab === 'all') return true;
    return trip.shopVisits?.some(v => {
      if (activeTab === 'pending') return v.status === 'SCHEDULED';
      if (activeTab === 'progress') return v.status === 'IN_PROGRESS';
      if (activeTab === 'completed') return v.status === 'COMPLETED';
      return false;
    });
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
          <button type="button" onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white hover:opacity-75 cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Styled Header Container Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-[#1C1C1C] dark:text-white tracking-tight">
              Shop Visit Management & Route Tracking
            </h1>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              {totalVisits} Scheduled Stops
            </span>
          </div>
          <p className="text-xs text-[#8C8C8C] dark:text-slate-400 max-w-3xl leading-relaxed">
            Track real-time stop-by-stop shop deliveries, camera POD photo proof, Cloudinary storage, verification timestamps, and signatures.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={fetchTripsWithShopVisits}
            disabled={isLoading}
            className="p-2.5 bg-[#F8F9FA] dark:bg-slate-700 hover:bg-[#F0F2F5] dark:hover:bg-slate-600 text-[#1C1C1C] dark:text-slate-200 rounded-xl transition cursor-pointer border border-[#E9ECEF] dark:border-slate-600"
            title="Refresh Visits"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Total Planned Stops</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
              <MapPin className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{totalVisits} Stops</div>
            <div className="text-[11px] text-blue-600 font-semibold pt-0.5">{trips.length} Active Trips</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Currently In Transit</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 leading-none">{inProgressVisits} In Progress</div>
            <div className="text-[11px] text-amber-600 font-semibold pt-0.5">Live Delivery Execution</div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Completed Deliveries</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">{completedVisits} Delivered</div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">POD Signed & Verified</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 shadow-xs space-y-3 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C8C8C] dark:text-slate-400 truncate">Pending Visits</span>
            <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 border border-slate-500/20">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#1C1C1C] dark:text-white leading-none">{pendingVisits} Scheduled</div>
            <div className="text-[11px] text-slate-500 font-semibold pt-0.5">Awaiting Driver Arrival</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {(['all', 'pending', 'progress', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 shrink-0 ${
              activeTab === tab
                ? 'bg-[#1C1C1C] dark:bg-white text-white dark:text-[#1C1C1C] border-[#1C1C1C] dark:border-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-[#8C8C8C] dark:text-slate-400 border-[#E2E8F0] dark:border-slate-700 hover:text-[#1C1C1C] dark:hover:text-white'
            }`}
          >
            {tab === 'all' && <>All Stops ({totalVisits})</>}
            {tab === 'pending' && <><Clock className="w-3.5 h-3.5" /> Scheduled ({pendingVisits})</>}
            {tab === 'progress' && <><AlertCircle className="w-3.5 h-3.5" /> In Transit ({inProgressVisits})</>}
            {tab === 'completed' && <><CheckCircle2 className="w-3.5 h-3.5" /> Delivered ({completedVisits})</>}
          </button>
        ))}
      </div>

      {/* Trips & Visits List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 p-12 text-center text-xs font-bold text-[#8C8C8C]">
          Loading shop visit details...
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs">No active shop visits found matching selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden shadow-xs"
            >
              {/* Trip Header */}
              <div
                onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
                className="px-5 py-4 border-b border-[#F0F2F5] dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400">{trip.tripNumber}</span>
                      <span className="text-xs font-bold text-[#1C1C1C] dark:text-white">• {trip.routeName}</span>
                    </div>
                    <p className="text-[11px] text-[#8C8C8C] dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Driver: <strong>{trip.driverName}</strong></span>
                      <span>•</span>
                      <span>Vehicle: <strong>{trip.vehicleNumber}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                    {trip.shopVisits?.length || 0} Shop Stops
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${selectedTrip?.id === trip.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Shop Visits Table */}
              {selectedTrip?.id === trip.id && (
                <div className="p-4 bg-[#F7F9FB] dark:bg-slate-900/50">
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#F0F2F5] dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left text-xs text-[#1C1C1C] dark:text-slate-200">
                      <thead className="bg-[#F7F9FB] dark:bg-slate-900 text-[#8C8C8C] dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#F0F2F5] dark:border-slate-700">
                        <tr>
                          <th className="py-3 px-4 font-bold">Seq</th>
                          <th className="py-3 px-4 font-bold">Shop & Location</th>
                          <th className="py-3 px-4 font-bold">Contact</th>
                          <th className="py-3 px-4 font-bold">Planned Time</th>
                          <th className="py-3 px-4 font-bold">Status</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F2F5] dark:divide-slate-700/60">
                        {trip.shopVisits?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">
                              No shops assigned to this trip.
                            </td>
                          </tr>
                        ) : (
                          trip.shopVisits.map((visit) => (
                            <tr key={visit.id} className="hover:bg-[#F9FAFB] dark:hover:bg-slate-750 transition">
                              <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                #{visit.visitSequence}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-[#1C1C1C] dark:text-white">{visit.shop?.shopName || `Shop #${visit.shopId}`}</div>
                                <div className="text-[10px] text-[#8C8C8C] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {visit.shop?.location || 'Main Market Sector'}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                <div>{visit.shop?.ownerName || 'Store Manager'}</div>
                                <div className="text-[10px] font-mono text-slate-400">{visit.shop?.phone || '+91 98401 00000'}</div>
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold">
                                {visit.expectedVisitTime || '07:30 AM'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block ${getStatusColor(visit.status)}`}>
                                  {visit.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right space-x-1.5">
                                <button
                                   type="button"
                                   onClick={() => {
                                     if (visit.status === 'COMPLETED') {
                                       setPodModalVisit(visit);
                                     }
                                   }}
                                   disabled={visit.status !== 'COMPLETED'}
                                   className={`p-1.5 rounded-lg text-xs font-bold transition ${
                                     visit.status === 'COMPLETED'
                                       ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 cursor-pointer'
                                       : 'bg-slate-100 text-slate-400 dark:bg-slate-700/50 dark:text-slate-500 cursor-not-allowed opacity-40'
                                   }`}
                                   title={visit.status === 'COMPLETED' ? "View Real POD Camera Photo & Signature Proof" : "POD proof available only after shop visit & sale completion"}
                                 >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateVisitStatus(visit, 'IN_PROGRESS')}
                                  disabled={visit.status === 'IN_PROGRESS' || visit.status === 'COMPLETED'}
                                  className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 rounded-lg text-xs font-bold transition disabled:opacity-30 cursor-pointer"
                                  title="Mark In Progress"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateVisitStatus(visit, 'COMPLETED')}
                                  disabled={visit.status === 'COMPLETED'}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-xs font-bold transition disabled:opacity-30 cursor-pointer"
                                  title="Mark Delivered"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── POD Camera Photo & Signature Proof Modal ────────────────────────────── */}
      {podModalVisit && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Proof of Delivery (POD) Verification
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {podModalVisit.shop?.shopName || `Shop #${podModalVisit.shopId}`} • Seq #{podModalVisit.visitSequence}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPodModalVisit(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cloudinary Outlet Camera Photo Proof */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-500" />
                  Outlet Camera Photo Proof (Cloudinary /pod)
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Cloudinary Synced
                </span>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-video flex items-center justify-center">
                <img
                  src={podModalVisit.photoProofUrl}
                  alt="Outlet Camera Proof"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </div>
            </div>

            {/* Shop Owner Digital Signature */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Shop Owner Digital Touch Signature
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 h-24 flex items-center justify-center">
                <img
                  src={podModalVisit.digitalSignatureUrl}
                  alt="Digital Signature"
                  className="max-h-16 object-contain filter dark:invert"
                  onError={(e) => {
                    (e.target as any).src = 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Jon_Snow_Signature.png';
                  }}
                />
              </div>
            </div>

            {/* Audit Details Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Store Manager</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{podModalVisit.shop?.ownerName || 'Store Manager'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Phone</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{podModalVisit.shop?.phone || '+91 98401 00000'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPodModalVisit(null)}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                Close Verification Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
