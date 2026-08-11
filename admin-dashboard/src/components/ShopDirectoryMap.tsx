import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store, Navigation, Phone, MapPin, Search, Filter, Layers, CreditCard, ChevronRight } from 'lucide-react';
import { ApiShop } from '../services/apiService';

interface ShopDirectoryMapProps {
  shops: any[];
  onSelectShop?: (shop: any) => void;
  onEditShopLocation?: (shop: any) => void;
  className?: string;
}

// Generate colored HTML marker for different customer & credit statuses
const createShopMarkerIcon = (shop: any) => {
  const isCreditHold = shop.status === 'CREDIT_HOLD';
  const isActive = shop.status !== 'INACTIVE';
  
  let bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // Emerald active
  let pinColor = '#10b981';
  let badgeText = 'ACTIVE';

  if (isCreditHold) {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // Amber hold
    pinColor = '#f59e0b';
    badgeText = 'HOLD';
  } else if (!isActive) {
    bgGradient = 'linear-gradient(135deg, #64748b 0%, #475569 100%)'; // Slate inactive
    pinColor = '#64748b';
    badgeText = 'INACTIVE';
  }

  return L.divIcon({
    className: 'custom-directory-shop-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        cursor: pointer;
      ">
        <div style="
          background: ${bgGradient};
          color: white;
          padding: 2px 7px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
          white-space: nowrap;
          border: 1.5px solid white;
          margin-bottom: 2px;
          letter-spacing: 0.3px;
        ">
          ${shop.name ? shop.name.substring(0, 14) : 'Shop'}
        </div>
        <div style="
          width: 22px;
          height: 22px;
          background: ${pinColor};
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background: white; border-radius: 50%; transform: rotate(45deg);"></div>
        </div>
      </div>
    `,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
};

export const ShopDirectoryMap: React.FC<ShopDirectoryMapProps> = ({
  shops,
  onSelectShop,
  onEditShopLocation,
  className = 'h-[620px] w-full rounded-2xl',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedRouteFilter, setSelectedRouteFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedShopPopup, setSelectedShopPopup] = useState<any | null>(null);

  // Extract unique route names
  const availableRoutes = Array.from(new Set(shops.map((s) => s.route || s.routeName).filter(Boolean)));

  // Filter shops
  const filteredShops = shops.filter((s) => {
    const route = s.route || s.routeName || '';
    const matchRoute = selectedRouteFilter === 'ALL' || route === selectedRouteFilter;
    const matchStatus =
      selectedStatusFilter === 'ALL' ||
      (selectedStatusFilter === 'ACTIVE' && s.status === 'ACTIVE') ||
      (selectedStatusFilter === 'CREDIT_HOLD' && (s.status === 'CREDIT_HOLD'));
    const matchSearch =
      !searchFilter ||
      s.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.shopCode?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.owner?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.address?.toLowerCase().includes(searchFilter.toLowerCase());

    return matchRoute && matchStatus && matchSearch;
  });

  const getValidCoordinates = (shop: any, idx: number): [number, number] => {
    if (shop.latitude && shop.longitude && !isNaN(Number(shop.latitude)) && !isNaN(Number(shop.longitude))) {
      const lat = Number(shop.latitude);
      const lng = Number(shop.longitude);
      if (lat !== 0 || lng !== 0) return [lat, lng];
    }
    // Factory Base fallback with distinct offset
    const baseLat = 10.787252191240228;
    const baseLng = 79.57505803846621;
    const angle = (idx / Math.max(shops.length, 1)) * 2 * Math.PI;
    const radius = 0.015 + (idx * 0.007);
    return [baseLat + radius * Math.cos(angle), baseLng + radius * Math.sin(angle)];
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([10.787252191240228, 79.57505803846621], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const markersGroup = markersGroupRef.current;
    if (markersGroup) {
      markersGroup.clearLayers();

      const bounds: L.LatLngBounds = L.latLngBounds([]);

      filteredShops.forEach((shop, idx) => {
        const [lat, lng] = getValidCoordinates(shop, idx);
        bounds.extend([lat, lng]);

        const marker = L.marker([lat, lng], {
          icon: createShopMarkerIcon(shop),
        });

        // Interactive popup content
        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; color: #0f172a; padding: 4px; min-width: 220px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
              <div>
                <span style="background: #e0e7ff; color: #4338ca; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">${shop.shopCode || 'SHP'}</span>
                <h4 style="margin: 4px 0 0 0; font-size: 13px; font-weight: 700; color: #1e1b4b;">${shop.name}</h4>
              </div>
            </div>
            <div style="margin-bottom: 6px; color: #475569;">
              <div><strong>Owner:</strong> ${shop.owner || shop.ownerName || 'Retail Owner'}</div>
              <div><strong>Phone:</strong> ${shop.phone || 'N/A'}</div>
              <div><strong>Route:</strong> ${shop.route || shop.routeName || 'Salem Central'}</div>
              <div><strong>Address:</strong> ${shop.address ? shop.address.substring(0, 45) + '...' : 'Salem, TN'}</div>
            </div>
            <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 6px; border-radius: 6px; margin-top: 6px; font-size: 11px;">
              <div>Outstanding: <strong style="color: #dc2626;">₹${shop.outstanding?.toLocaleString() || 0}</strong></div>
              <div>Type: <strong>{shop.customerType || 'SHOP'}</strong></div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          setSelectedShopPopup(shop);
          if (onSelectShop) onSelectShop(shop);
        });

        markersGroup.addLayer(marker);
      });

      if (filteredShops.length > 0 && mapInstanceRef.current && bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [filteredShops]);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Map Control & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Search shops on map..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Route filter */}
          <select
            value={selectedRouteFilter}
            onChange={(e) => setSelectedRouteFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Delivery Routes</option>
            {availableRoutes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Credit Statuses</option>
            <option value="ACTIVE">Active (Normal)</option>
            <option value="CREDIT_HOLD">Credit Hold (Over Limit)</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
            <span>Active ({shops.filter((s) => s.status === 'ACTIVE').length})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50"></span>
            <span>Credit Hold</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>Showing: <strong>{filteredShops.length}</strong> shops</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-950">
        <div ref={mapContainerRef} className={className} style={{ zIndex: 1 }} />
      </div>
    </div>
  );
};
