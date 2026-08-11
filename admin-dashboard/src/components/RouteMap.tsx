import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapShopPoint {
  id?: number;
  shopId?: number;
  shopCode?: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  visitOrder: number;
  latitude?: number;
  longitude?: number;
}

interface RouteMapProps {
  shops: MapShopPoint[];
  startingHub?: string;
  hubLat?: number;
  hubLng?: number;
  onDistanceCalculated?: (distanceKm: number) => void;
  className?: string;
  interactive?: boolean;
}

// Fallback coordinates generator for shops in Salem / Tamil Nadu region if lat/lng are null
const getValidCoords = (shop: MapShopPoint, index: number, total: number): [number, number] => {
  if (shop.latitude && shop.longitude && !isNaN(Number(shop.latitude)) && !isNaN(Number(shop.longitude))) {
    const lat = Number(shop.latitude);
    const lng = Number(shop.longitude);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && (lat !== 0 || lng !== 0)) {
      return [lat, lng];
    }
  }
  // Default base: Factory coordinates (10.787252191240228, 79.57505803846621)
  const baseLat = 10.787252191240228;
  const baseLng = 79.57505803846621;
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
  const radius = 0.015 + (index * 0.008);
  return [baseLat + radius * Math.cos(angle), baseLng + radius * Math.sin(angle)];
};

// Calculate Haversine distance in KM
const calculateHaversineDistance = (coords: [number, number][]): number => {
  if (coords.length < 2) return 0;
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];
    if (Math.abs(lat1 - lat2) < 0.000001 && Math.abs(lon1 - lon2) < 0.000001) continue;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += (R * c * 1.26); // Apply road winding factor 1.26 for realistic road distance
  }
  return parseFloat(totalKm.toFixed(1));
};

export const RouteMap: React.FC<RouteMapProps> = ({
  shops,
  startingHub,
  hubLat,
  hubLng,
  onDistanceCalculated,
  className = 'h-96 w-full rounded-2xl',
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive ? 'center' : false,
        doubleClickZoom: interactive,
        touchZoom: interactive
      }).setView([10.787252191240228, 79.57505803846621], 12);

      // OpenStreetMap Free Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (shops.length === 0) {
      map.setView([10.787252191240228, 79.57505803846621], 12);
      if (onDistanceCalculated) onDistanceCalculated(0);
      return;
    }

    const sortedShops = [...shops].sort((a, b) => (a.visitOrder || 0) - (b.visitOrder || 0));
    const points: [number, number][] = [];
    const bounds = L.latLngBounds([]);

    // Add Starting Hub marker if provided
    if (startingHub) {
      const hLat = hubLat || 10.787252191240228;
      const hLng = hubLng || 79.57505803846621;
      points.push([hLat, hLng]);
      bounds.extend([hLat, hLng]);

      const hubIcon = L.divIcon({
        className: 'custom-hub-pin',
        html: `
          <div style="
            background: #4F46E5;
            color: #FFFFFF;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 13px;
            border: 3px solid #FFFFFF;
            box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
          ">
            ⚑
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const hubMarker = L.marker([hLat, hLng], { icon: hubIcon });
      hubMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: bold; color: #4F46E5;">Starting Hub</div>
          <div style="color: #1F2937; margin-top: 2px;">${startingHub}</div>
        </div>
      `);
      markersGroup.addLayer(hubMarker);
    }

    // Add Shop Markers
    sortedShops.forEach((shop, index) => {
      const coords = getValidCoords(shop, index, sortedShops.length);
      points.push(coords);
      bounds.extend(coords);

      const isFirst = index === 0;
      const isLast = index === sortedShops.length - 1 && sortedShops.length > 1;
      const bgColor = isFirst ? '#10B981' : isLast ? '#F59E0B' : '#3B82F6';
      const visitNum = shop.visitOrder || index + 1;

      const shopIcon = L.divIcon({
        className: 'custom-shop-pin',
        html: `
          <div style="
            background: ${bgColor};
            color: #FFFFFF;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 12px;
            border: 2.5px solid #FFFFFF;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${visitNum}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker(coords, { icon: shopIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="background: ${bgColor}; color: #FFF; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
              Stop #${visitNum}
            </span>
            ${shop.shopCode ? `<span style="color: #6B7280; font-family: monospace; font-size: 10px; font-weight: bold;">${shop.shopCode}</span>` : ''}
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #111827;">${shop.shopName}</div>
          ${shop.ownerName ? `<div style="color: #4B5563; font-size: 11px; margin-top: 2px;">👤 ${shop.ownerName} ${shop.phone ? `(${shop.phone})` : ''}</div>` : ''}
          ${shop.address ? `<div style="color: #6B7280; font-size: 11px; margin-top: 4px;">📍 ${shop.address}</div>` : ''}
        </div>
      `);
      markersGroup.addLayer(marker);
    });

    // Draw initial straight-line polyline & calculate distance
    const initialKm = calculateHaversineDistance(points);
    if (onDistanceCalculated) {
      onDistanceCalculated(initialKm);
    }

    polylineRef.current = L.polyline(points, {
      color: '#4F46E5',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 6',
      lineJoin: 'round'
    }).addTo(map);

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }

    // Attempt OSRM free road routing calculation for real street path & distance
    if (points.length >= 2) {
      const osrmCoordinates = points.map(([lat, lon]) => `${lon},${lat}`).join(';');
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoordinates}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = parseFloat((route.distance / 1000).toFixed(1));
            if (onDistanceCalculated) {
              onDistanceCalculated(distanceKm);
            }

            // Draw road geometry polyline
            if (route.geometry && route.geometry.coordinates) {
              const roadCoords: [number, number][] = route.geometry.coordinates.map(
                ([lon, lat]: [number, number]) => [lat, lon]
              );

              if (polylineRef.current) {
                map.removeLayer(polylineRef.current);
              }

              polylineRef.current = L.polyline(roadCoords, {
                color: '#4F46E5',
                weight: 5,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
            }
          }
        })
        .catch(err => {
          console.warn('OSRM routing service unavailable, using road estimation:', err);
        });
    }

    // Invalidate size on multiple timers to handle modal transitions
    [50, 150, 350, 600].forEach(delay => {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, delay);
    });

  }, [shops, startingHub, hubLat, hubLng]);

  // ResizeObserver to handle dynamic modal container sizing
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[400px]" />
      {shops.length > 0 && (
        <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs font-semibold text-slate-800 dark:text-slate-200 z-10 pointer-events-none flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{shops.length} {shops.length === 1 ? 'Shop' : 'Shops'} on Map</span>
        </div>
      )}
    </div>
  );
};
