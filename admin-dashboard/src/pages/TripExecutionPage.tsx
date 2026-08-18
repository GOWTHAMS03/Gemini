import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { tripApi } from '../services/apiService';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Navigation,
  User,
  Truck,
  Package,
  DollarSign,
  MessageSquare,
  MoreVertical,
  RotateCw,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Phone,
  Play,
  Check,
  X
} from 'lucide-react';

interface ShopVisit {
  id: number;
  shopName: string;
  ownerName: string;
  phone: string;
  address: string;
  visitSequence: number;
  plannedStartTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  billAmount: number;
  paymentAmount: number;
  pendingAmount: number;
  remarks: string;
  products: Array<{
    productId: number;
    productName: string;
    allocatedQuantity: number;
    soldQuantity: number;
  }>;
}

interface Trip {
  id: number;
  tripNumber: string;
  tripDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dispatchGroupName: string;
  routeName: string;
  vehicleNumber: string;
  salesPersonName: string;
  driverName: string;
  shopVisits: ShopVisit[];
  totalLoadedQuantity: number;
  totalSoldQuantity: number;
  totalReturnedQuantity: number;
  totalDamagedQuantity: number;
  totalBillAmount: number;
  totalPaymentAmount: number;
  totalPendingAmount: number;
  totalSalesAmount?: number;
  totalCollected?: number;
}

export const TripExecutionPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<ShopVisit | null>(null);
  const [expandedShops, setExpandedShops] = useState<Set<number>>(new Set());
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [startVerified, setStartVerified] = useState(false);
  const [endVerified, setEndVerified] = useState(false);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/trips/${tripId}`);
      setTrip(response.data);
      setError(null);
    } catch (err: any) {
      const errorMsg = err.response?.status === 403 
        ? 'You do not have permission to view this trip'
        : err.response?.status === 404
        ? 'Trip not found'
        : 'Failed to load trip details';
      setError(errorMsg);
      console.error('Error fetching trip:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTripConfirmed = async () => {
    if (!trip) return;
    try {
      setIsStarting(true);
      await tripApi.startTrip(trip.id);
      setShowStartModal(false);
      setStartVerified(false);
      fetchTripDetails();
    } catch (err: any) {
      alert(`Error starting trip: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndTripConfirmed = async () => {
    if (!trip) return;
    try {
      setIsEnding(true);
      await tripApi.completeTrip(trip.id);
      setShowEndModal(false);
      setEndVerified(false);
      fetchTripDetails();
    } catch (err: any) {
      alert(`Error completing trip: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsEnding(false);
    }
  };

  const updateTripStatus = async (newStatus: string) => {
    if (!trip) return;

    try {
      await tripApi.updateStatus(trip.id, newStatus);
      fetchTripDetails();
    } catch (err: any) {
      alert(`Error updating trip: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
      case 'IN_PROGRESS':
        return { bg: '#FEF08A', text: '#713F12', border: '#FDEF89' };
      case 'PENDING':
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      default:
        return { bg: '#E0E7FF', text: '#3730A3', border: '#A5B4FC' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto"></div>
          <p className="mt-4 text-[#8C8C8C]">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-[#1C1C1C]">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#8C8C8C]">No trip data found</p>
      </div>
    );
  }

  const completedShops = trip.shopVisits.filter(s => s.status === 'COMPLETED').length;
  const inProgressShops = trip.shopVisits.filter(s => s.status === 'IN_PROGRESS').length;
  const statusColor = getStatusColor(trip.status);
  const progressPercentage = trip.shopVisits.length > 0 
    ? (completedShops / trip.shopVisits.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F9FB] dark:bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-white">
              Trip Execution: {trip.tripNumber}
            </h1>
            <p className="text-[#8C8C8C] text-sm mt-1">{trip.tripDate}</p>
          </div>
          <button
            onClick={fetchTripDetails}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Main Status Card */}
        <div
          className="p-6 rounded-2xl border-2 mb-6"
          style={{
            backgroundColor: statusColor.bg,
            borderColor: statusColor.border,
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p
                className="text-sm font-bold mb-2"
                style={{ color: statusColor.text }}
              >
                TRIP STATUS
              </p>
              <h2 className="text-3xl font-bold" style={{ color: statusColor.text }}>
                {trip.status}
              </h2>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-3">
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: statusColor.text }}>
                {completedShops} / {trip.shopVisits.length} Shops
              </p>
            </div>
          </div>

          {/* Action Buttons with Verification */}
          <div className="flex gap-3 mt-6">
            {trip.status !== 'IN_PROGRESS' && trip.status !== 'COMPLETED' && (
              <button
                onClick={() => {
                  setStartVerified(false);
                  setShowStartModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs shadow-xs cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Trip
              </button>
            )}
            {trip.status === 'IN_PROGRESS' && (
              <button
                onClick={() => {
                  setEndVerified(false);
                  setShowEndModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold text-xs shadow-xs cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                End & Settle Trip
              </button>
            )}
            {trip.status === 'IN_PROGRESS' && (
              <button
                onClick={() => updateTripStatus('CANCELLED')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold text-xs shadow-xs cursor-pointer"
              >
                Cancel Trip
              </button>
            )}
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Trip Info Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white mb-4">
              Trip Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-[#8C8C8C]">Vehicle</p>
                  <p className="font-semibold text-[#1C1C1C] dark:text-white">
                    {trip.vehicleNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-[#8C8C8C]">Driver / Sales Person</p>
                  <p className="font-semibold text-[#1C1C1C] dark:text-white">
                    {trip.driverName} / {trip.salesPersonName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-[#8C8C8C]">Route</p>
                  <p className="font-semibold text-[#1C1C1C] dark:text-white">
                    {trip.routeName}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="space-y-3">
            {[
              {
                label: 'Loaded',
                value: trip.totalLoadedQuantity,
                icon: Package,
                color: 'bg-blue-100 text-blue-600',
              },
              {
                label: 'Sold',
                value: trip.totalSoldQuantity,
                icon: CheckCircle2,
                color: 'bg-green-100 text-green-600',
              },
              {
                label: 'Pending Collection',
                value: `₹${trip.totalPendingAmount}`,
                icon: DollarSign,
                color: 'bg-orange-100 text-orange-600',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8C8C8C]">{stat.label}</p>
                    <p className="font-bold text-[#1C1C1C] dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shop Visits List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-[#1C1C1C] dark:text-white mb-4">
            Shop Visits ({trip.shopVisits.length})
          </h3>

          <div className="space-y-3">
            {trip.shopVisits.map((shop, index) => {
              const isExpanded = expandedShops.has(shop.id);
              const shopStatusColor = getStatusColor(shop.status);

              return (
                <div
                  key={shop.id}
                  className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden"
                >
                  {/* Shop Header */}
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedShops);
                      if (isExpanded) {
                        newExpanded.delete(shop.id);
                      } else {
                        newExpanded.add(shop.id);
                      }
                      setExpandedShops(newExpanded);
                    }}
                    className="w-full p-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      {/* Sequence Badge */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                        style={{ backgroundColor: statusColor.border }}
                      >
                        {shop.visitSequence}
                      </div>

                      {/* Shop Details */}
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#1C1C1C] dark:text-white">
                          {shop.shopName}
                        </h4>
                        <p className="text-sm text-[#8C8C8C]">{shop.ownerName}</p>
                      </div>

                      {/* Status Badge */}
                      <div
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: shopStatusColor.bg,
                          color: shopStatusColor.text,
                        }}
                      >
                        {shop.status}
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="ml-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[#8C8C8C]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[#8C8C8C]" />
                      )}
                    </div>
                  </button>

                  {/* Shop Details */}
                  {isExpanded && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                      <div className="space-y-4">
                        {/* Contact Info */}
                        <div>
                          <p className="text-xs text-[#8C8C8C] mb-2">Contact Information</p>
                          <div className="flex items-center gap-2 text-sm text-[#1C1C1C] dark:text-white">
                            <Phone className="w-4 h-4" />
                            {shop.phone}
                          </div>
                          <div className="flex items-start gap-2 text-sm text-[#1C1C1C] dark:text-white mt-1">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{shop.address}</span>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div>
                          <p className="text-xs text-[#8C8C8C] mb-2">Visit Timeline</p>
                          <div className="space-y-1 text-sm text-[#1C1C1C] dark:text-white">
                            <div className="flex justify-between">
                              <span>Planned:</span>
                              <span className="font-mono">
                                {shop.plannedStartTime}
                              </span>
                            </div>
                            {shop.actualStartTime && (
                              <div className="flex justify-between text-green-600">
                                <span>Check-in:</span>
                                <span className="font-mono">
                                  {shop.actualStartTime}
                                </span>
                              </div>
                            )}
                            {shop.actualEndTime && (
                              <div className="flex justify-between text-green-600">
                                <span>Check-out:</span>
                                <span className="font-mono">
                                  {shop.actualEndTime}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Products */}
                        {shop.products.length > 0 && (
                          <div>
                            <p className="text-xs text-[#8C8C8C] mb-2">Products Delivered</p>
                            <div className="space-y-2">
                              {shop.products.map((prod, pidx) => (
                                <div
                                  key={pidx}
                                  className="flex justify-between text-sm text-[#1C1C1C] dark:text-white"
                                >
                                  <span>{prod.productName}</span>
                                  <span className="font-mono">
                                    {prod.soldQuantity}/{prod.allocatedQuantity} units
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Financial Summary */}
                        <div>
                          <p className="text-xs text-[#8C8C8C] mb-2">Financial Summary</p>
                          <div className="bg-white dark:bg-slate-900 rounded p-3 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-[#8C8C8C]">Bill Amount:</span>
                              <span className="font-semibold text-[#1C1C1C] dark:text-white">
                                ₹{shop.billAmount}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[#8C8C8C]">Payment:</span>
                              <span className="font-semibold text-green-600">
                                ₹{shop.paymentAmount}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-gray-200 dark:border-slate-700 pt-1 mt-1">
                              <span className="text-[#8C8C8C]">Pending:</span>
                              <span className="font-bold text-orange-600">
                                ₹{shop.pendingAmount}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remarks */}
                        {shop.remarks && (
                          <div>
                            <p className="text-xs text-[#8C8C8C] mb-2 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Remarks
                            </p>
                            <p className="text-sm text-[#1C1C1C] dark:text-white bg-white dark:bg-slate-900 p-3 rounded">
                              {shop.remarks}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Verify & Start Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Play className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Verify & Start Trip</h3>
                  <p className="text-xs text-slate-400 font-mono">Trip #{trip.tripNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowStartModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Route:</span>
                <strong className="text-slate-900 dark:text-white font-bold">{trip.routeName || 'Standard Route'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Executive:</span>
                <strong className="text-indigo-600 font-bold">{trip.salesPersonName || 'Sales Person'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Vehicle / Driver:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{trip.driverName || 'Driver'} • {trip.vehicleNumber || 'Van'}</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Planned Outlets:</span>
                <span className="text-blue-600 font-black">{trip.shopVisits?.length || 0} Outlets</span>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 cursor-pointer">
              <input
                type="checkbox"
                checked={startVerified}
                onChange={e => setStartVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-emerald-900 dark:text-emerald-200 leading-snug">
                I verify that the vehicle is inspected, products are loaded, and the trip is departing now.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                disabled={isStarting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartTripConfirmed}
                disabled={!startVerified || isStarting}
                className="px-5 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isStarting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Starting...</> : <><Play className="w-4 h-4 fill-current" /> Confirm & Start Trip</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify & End Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[999999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Verify & End Trip</h3>
                  <p className="text-xs text-slate-400 font-mono">Trip #{trip.tripNumber}</p>
                </div>
              </div>
              <button onClick={() => setShowEndModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Completed Visits:</span>
                <strong className="text-emerald-600 font-bold">{completedShops} / {trip.shopVisits?.length || 0}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Billed:</span>
                <strong className="text-blue-600 font-bold">₹{trip.totalSalesAmount ?? trip.totalBillAmount ?? 0}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Total Collected:</span>
                <strong className="text-emerald-600 font-bold">₹{trip.totalCollected ?? trip.totalPaymentAmount ?? 0}</strong>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 cursor-pointer">
              <input
                type="checkbox"
                checked={endVerified}
                onChange={e => setEndVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-xs text-purple-900 dark:text-purple-200 leading-snug">
                I verify that all shop deliveries, invoices, and collected payments are finalized and ready for return reconciliation.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                disabled={isEnding}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEndTripConfirmed}
                disabled={!endVerified || isEnding}
                className="px-5 py-2.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isEnding ? <><RefreshCw className="w-4 h-4 animate-spin" /> Ending...</> : <><CheckCircle2 className="w-4 h-4" /> Confirm & End Trip</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
