import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, AlertCircle, CheckCircle, Crosshair, Loader2 } from 'lucide-react';

interface LocationPickerMapProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  accuracyMeters?: number | null;
  onLocationChange: (lat: number, lng: number, address?: string, areaName?: string) => void;
  className?: string;
  readOnly?: boolean;
}

// Custom Leaflet Pin Icon
const createCustomPinIcon = (label: string = 'Shop Location') => {
  return L.divIcon({
    className: 'custom-shop-picker-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
          white-space: nowrap;
          border: 2px solid white;
          margin-bottom: 2px;
        ">
          📍 ${label}
        </div>
        <div style="
          width: 24px;
          height: 24px;
          background: #4f46e5;
          border: 3px solid #ffffff;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        "></div>
        <div style="
          width: 8px;
          height: 8px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          filter: blur(1px);
          margin-top: -2px;
        "></div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  latitude,
  longitude,
  accuracyMeters = 5,
  onLocationChange,
  className = 'h-72 w-full rounded-xl',
  readOnly = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Fallback to Factory Base (10.787252191240228, 79.57505803846621)
  const defaultLat = 10.787252191240228;
  const defaultLng = 79.57505803846621;

  const currentLat = latitude && !isNaN(Number(latitude)) && Number(latitude) !== 0 ? Number(latitude) : defaultLat;
  const currentLng = longitude && !isNaN(Number(longitude)) && Number(longitude) !== 0 ? Number(longitude) : defaultLng;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const [lastResolvedAddress, setLastResolvedAddress] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Reverse geocode lat/lng to street address using OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (response.ok) {
        const data = await response.json();
        const displayName = data.display_name || '';
        const addressObj = data.address || {};
        const area = addressObj.suburb || addressObj.neighbourhood || addressObj.city_district || addressObj.town || addressObj.village || addressObj.county || 'Salem';
        setLastResolvedAddress(displayName);
        onLocationChange(lat, lng, displayName, area);
        setStatusMessage(`📍 Location set to: ${area}`);
      } else {
        onLocationChange(lat, lng);
      }
    } catch (e) {
      console.warn('Reverse geocode fallback:', e);
      onLocationChange(lat, lng);
    } finally {
      setReverseGeocoding(false);
    }
  }, [onLocationChange]);

  // Forward search address using Nominatim
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setStatusMessage(null);
    try {
      const query = searchQuery.includes('Salem') || searchQuery.includes('Tamil Nadu') 
        ? searchQuery 
        : `${searchQuery}, Salem, Tamil Nadu`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const item = results[0];
          const newLat = parseFloat(item.lat);
          const newLng = parseFloat(item.lon);
          updateMapPosition(newLat, newLng, true);
          setLastResolvedAddress(item.display_name);
          setStatusMessage(`Found: ${item.display_name.substring(0, 45)}...`);
          onLocationChange(newLat, newLng, item.display_name);
        } else {
          setStatusMessage('No location matches found. Click anywhere on the map to pin.');
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setStatusMessage('Search service unreachable. Click directly on map.');
    } finally {
      setIsSearching(false);
    }
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsGeolocating(true);
    setStatusMessage('Fetching GPS location from device...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        updateMapPosition(lat, lng, true);
        reverseGeocode(lat, lng);
        setStatusMessage(`GPS Location captured (accuracy ±${Math.round(accuracy)}m)`);
        setIsGeolocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setStatusMessage('GPS permission denied or unavailable. Using default Salem location.');
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Update map marker position
  const updateMapPosition = (lat: number, lng: number, flyTo: boolean = false) => {
    if (!mapInstanceRef.current) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], {
        icon: createCustomPinIcon('Shop Location'),
        draggable: !readOnly,
      }).addTo(mapInstanceRef.current);

      if (!readOnly) {
        marker.on('dragend', (ev) => {
          const target = ev.target;
          const pos = target.getLatLng();
          reverseGeocode(pos.lat, pos.lng);
        });
      }
      markerRef.current = marker;
    }

    // Draw accuracy circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([lat, lng]);
    } else if (accuracyMeters && accuracyMeters > 0) {
      accuracyCircleRef.current = L.circle([lat, lng], {
        radius: Math.max(accuracyMeters, 15),
        color: '#4f46e5',
        fillColor: '#818cf8',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(mapInstanceRef.current);
    }

    if (flyTo) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { animate: true, duration: 1.0 });
    }
  };

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: 'center',
      }).setView([currentLat, currentLng], 14);

      // OpenStreetMap Standard Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Click to pin
      if (!readOnly) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          updateMapPosition(lat, lng);
          reverseGeocode(lat, lng);
        });
      }

      mapInstanceRef.current = map;
    }

    updateMapPosition(currentLat, currentLng);

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Update marker if lat/lng props change from outside
  useEffect(() => {
    if (latitude && longitude && mapInstanceRef.current) {
      updateMapPosition(Number(latitude), Number(longitude), false);
    }
  }, [latitude, longitude]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top Search & Actions Bar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchLocation} className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Search area, landmark or street in Salem (e.g. Fairlands, Shevapet)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2.5 bg-[#F8F9FA] dark:bg-slate-900/80 border border-[#E9ECEF] dark:border-slate-700/80 rounded-xl text-xs text-[#1C1C1C] dark:text-white placeholder-[#8C8C8C] dark:placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            <Search className="w-4 h-4 text-[#8C8C8C] dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
            </button>
          </form>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isGeolocating}
            className="px-3 py-2.5 bg-white dark:bg-slate-800 hover:bg-[#F8F9FA] dark:hover:bg-slate-750 border border-[#E9ECEF] dark:border-slate-700 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {isGeolocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500 dark:text-indigo-400" />
            ) : (
              <Navigation className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            )}
            <span>Use My GPS</span>
          </button>
        </div>
      )}

      {/* Interactive Map Canvas */}
      <div className="relative border border-[#E9ECEF] dark:border-slate-700/80 rounded-xl overflow-hidden shadow-inner bg-[#F8F9FA] dark:bg-slate-950">
        <div ref={mapContainerRef} className={className} style={{ zIndex: 1 }} />

        {/* Map Instructions Badge */}
        {!readOnly && (
          <div className="absolute top-2 right-2 z-[400] bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-[#E9ECEF] dark:border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-[#1C1C1C] dark:text-slate-300 flex items-center gap-1.5 shadow-md">
            <Crosshair className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Click map or drag pin to adjust shop coordinates</span>
          </div>
        )}

        {/* Reverse Geocode Loading Indicator */}
        {reverseGeocoding && (
          <div className="absolute bottom-2 left-2 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-indigo-200 dark:border-indigo-500/50 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2 shadow-lg animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span>Reverse geocoding address...</span>
          </div>
        )}
      </div>

      {/* Bottom Coordinates & Accuracy Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F8F9FA] dark:bg-slate-900/60 border border-[#E9ECEF] dark:border-slate-800/80 rounded-xl text-xs">
        <div className="flex items-center gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#8C8C8C] dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Lat:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentLat.toFixed(6)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8C8C8C] dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Lng:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{currentLng.toFixed(6)}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded-md font-bold text-[10px]">
              ±{accuracyMeters ?? 5}m accuracy
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className="text-[11px] font-semibold text-[#1C1C1C] dark:text-slate-300 truncate max-w-sm">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
