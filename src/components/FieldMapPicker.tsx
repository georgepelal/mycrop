import React, { useState, useEffect, useRef } from "react";
import { 
  APIProvider, 
  Map as GoogleMap, 
  AdvancedMarker, 
  Pin,
} from "@vis.gl/react-google-maps";
import { 
  MapPin, 
  Compass, 
  Search, 
  Layers, 
  Info,
  Maximize2,
  Minimize2,
  CheckCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  RefreshCw,
  Sliders,
  Undo,
  Trash2,
  Gauge
} from "lucide-react";

// Check for Google Maps Platform API Key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY" && API_KEY.trim().length > 10;

// Shoelace Area Calculation algorithm in Hectares
export function calculatePolygonAreaHa(vertices: { lat: number; lng: number }[]): number {
  if (vertices.length < 3) return 0;
  
  const refLat = vertices[0].lat;
  const refLng = vertices[0].lng;
  const latToMeters = 111139.0;
  const lngToMeters = 111139.0 * Math.cos(refLat * Math.PI / 180);
  
  const points = vertices.map(v => ({
    x: (v.lng - refLng) * lngToMeters,
    y: (v.lat - refLat) * latToMeters
  }));
  
  let areaSum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    areaSum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  
  const areaSqM = 0.5 * Math.abs(areaSum);
  const areaHa = areaSqM / 10000.0;
  
  return Math.max(0.1, parseFloat(areaHa.toFixed(1)));
}

// Deterministic physical attributes based on location
export function getDeterministicSoilMetrics(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
  
  const soilTypes = ["Loamy", "Silt", "Clayey", "Sandy"];
  const soilTypeIdx = Math.floor(seed * 4) % 4;
  const soilType = soilTypes[soilTypeIdx];
  
  const soilPH = parseFloat((5.8 + (seed % 1.6)).toFixed(1));
  
  const nitrogenLevels = ["Optimal", "Balanced", "Slightly Low", "Acreage Saturated"];
  const nitrogen = nitrogenLevels[Math.floor(seed * 10) % 4];
  
  const soilMoisture = Math.round(30 + (seed * 100) % 55);
  
  const baseNdvi = 0.4 + (seed * 10) % 0.45;
  const ndviValue = parseFloat(baseNdvi.toFixed(2));
  const ndwiValue = parseFloat((ndviValue * 0.75).toFixed(2));

  return {
    soilType,
    soilPH,
    nitrogen,
    soilMoisture,
    ndviValue,
    ndwiValue
  };
}

export function calculatePolygonPerimeterMeters(vertices: { lat: number; lng: number }[]): number {
  if (vertices.length < 2) return 0;
  
  let totalDist = 0;
  for (let i = 0; i < vertices.length; i++) {
    const nextIdx = (i + 1) % vertices.length;
    if (nextIdx === 0 && vertices.length < 3) break; // Don't close perimeter if drawing is incomplete
    
    const lat1 = vertices[i].lat;
    const lng1 = vertices[i].lng;
    const lat2 = vertices[nextIdx].lat;
    const lng2 = vertices[nextIdx].lng;
    
    const radlat1 = Math.PI * lat1 / 180;
    const radlat2 = Math.PI * lat2 / 180;
    const theta = lng1 - lng2;
    const radtheta = Math.PI * theta / 180;
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.min(1, Math.max(-1, dist));
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515 * 1609.344; // convert to meters
    totalDist += dist;
  }
  return Math.round(totalDist);
}

interface FieldMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialBoundary?: { lat: number; lng: number }[];
  onLocationSelect: (
    lat: number,
    lng: number,
    formattedString: string,
    boundary: { lat: number; lng: number }[],
    calculatedHa: number,
    soilMetrics?: any
  ) => void;
  fieldName?: string;
  cropType?: string;
}

export default function FieldMapPicker({
  initialLat = 41.890,
  initialLng = -87.954,
  initialBoundary = [],
  onLocationSelect,
  fieldName = "Active Parcel",
  cropType = "Corn"
}: FieldMapPickerProps) {
  
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [boundary, setBoundary] = useState<{ lat: number; lng: number }[]>(initialBoundary);
  
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [mapType, setMapType] = useState<"satellite" | "ndvi" | "terrain">("ndvi");
  const [addressSearch, setAddressSearch] = useState<string>("");
  const [searchSuccess, setSearchSuccess] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lng: number } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  // Update container dimensions on load
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width || 600, height: rect.height || 500 });
    }
  }, []);

  // Recalculate size if window changes
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || 600, height: rect.height || 500 });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync state if initial values shift
  useEffect(() => {
    if (initialLat !== undefined && initialLat !== lat) {
      setLat(initialLat);
    }
  }, [initialLat]);

  useEffect(() => {
    if (initialLng !== undefined && initialLng !== lng) {
      setLng(initialLng);
    }
  }, [initialLng]);

  useEffect(() => {
    if (initialBoundary) {
      setBoundary(initialBoundary);
    }
  }, [initialBoundary]);

  // Synchronize update back to parent component
  const syncWithParent = (updatedBoundary: { lat: number; lng: number }[]) => {
    let targetLat = lat;
    let targetLng = lng;

    if (updatedBoundary.length > 0) {
      // Centroid center
      const sumLat = updatedBoundary.reduce((acc, v) => acc + v.lat, 0);
      const sumLng = updatedBoundary.reduce((acc, v) => acc + v.lng, 0);
      targetLat = parseFloat((sumLat / updatedBoundary.length).toFixed(6));
      targetLng = parseFloat((sumLng / updatedBoundary.length).toFixed(6));
      setLat(targetLat);
      setLng(targetLng);
    }

    const calculatedHa = calculatePolygonAreaHa(updatedBoundary);
    const formatted = `Area: ${calculatedHa} Ha, Centroid: [${targetLat.toFixed(4)}°N, ${targetLng.toFixed(4)}°W]`;
    const soilMetrics = getDeterministicSoilMetrics(targetLat, targetLng);

    onLocationSelect(targetLat, targetLng, formatted, updatedBoundary, calculatedHa, soilMetrics);
  };

  const handleAddVertex = (newLat: number, newLng: number) => {
    const clampedLat = Math.max(-90, Math.min(90, Number(newLat.toFixed(6))));
    const clampedLng = Math.max(-180, Math.min(180, Number(newLng.toFixed(6))));
    
    const nextBoundary = [...boundary, { lat: clampedLat, lng: clampedLng }];
    setBoundary(nextBoundary);
    syncWithParent(nextBoundary);
  };

  const handleUndoVertex = () => {
    if (boundary.length === 0) return;
    const nextBoundary = boundary.slice(0, -1);
    setBoundary(nextBoundary);
    syncWithParent(nextBoundary);
  };

  const handleClearBoundary = () => {
    setBoundary([]);
    syncWithParent([]);
  };

  // Convert coordinate degrees to screen pixel offsets relative to center using precise Web Mercator
  const getSimulatedObjectStyle = (objectLat: number, objectLng: number) => {
    const n = Math.pow(2, zoomLevel);
    const safeObjLat = Math.max(-85, Math.min(85, objectLat));
    const safeCenterLat = Math.max(-85, Math.min(85, lat));

    const centerTileX = (lng + 180) / 360 * n;
    const centerTileY = (1 - Math.log(Math.tan(safeCenterLat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;

    const ptTileX = (objectLng + 180) / 360 * n;
    const ptTileY = (1 - Math.log(Math.tan(safeObjLat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;

    const pixelLeft = (ptTileX - centerTileX) * 256 + dimensions.width / 2;
    const pixelTop = (ptTileY - centerTileY) * 256 + dimensions.height / 2;

    return {
      left: `${pixelLeft}px`,
      top: `${pixelTop}px`,
    };
  };

  const getVisibleTiles = () => {
    const n = Math.pow(2, zoomLevel);
    const safeCenterLat = Math.max(-85, Math.min(85, lat));
    const centerTileX = (lng + 180) / 360 * n;
    const centerTileY = (1 - Math.log(Math.tan(safeCenterLat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;

    const tileRangeX = Math.ceil(dimensions.width / 512) + 1;
    const tileRangeY = Math.ceil(dimensions.height / 512) + 1;

    const minX = Math.floor(centerTileX - tileRangeX);
    const maxX = Math.floor(centerTileX + tileRangeX);
    const minY = Math.floor(centerTileY - tileRangeY);
    const maxY = Math.floor(centerTileY + tileRangeY);

    const tiles: { x: number; y: number; left: number; top: number; key: string }[] = [];

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        if (y >= 0 && y < n) {
          const wrappedX = ((x % n) + n) % n;
          const left = (x - centerTileX) * 256 + dimensions.width / 2;
          const top = (y - centerTileY) * 256 + dimensions.height / 2;

          tiles.push({
            x: wrappedX,
            y,
            left,
            top,
            key: `${zoomLevel}-${wrappedX}-${y}-${left.toFixed(0)}-${top.toFixed(0)}`
          });
        }
      }
    }
    return tiles;
  };

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, lat: 0, lng: 0 });
  const hasMovedRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      lat: lat,
      lng: lng
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }

      const n = Math.pow(2, zoomLevel);
      // Delta in tile units
      const dTileX = dx / 256;
      const dTileY = dy / 256;

      // New center coordinates by shifting fractionally
      const newCenterTileX = ((dragStart.current.lng + 180) / 360 * n) - dTileX;
      const newCenterTileY = (((1 - Math.log(Math.tan(dragStart.current.lat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2) * n) - dTileY;

      // Inverse projection to lat/lng
      const nextLng = (newCenterTileX / n) * 360 - 180;
      const normY = 1 - 2 * (newCenterTileY / n);
      const nextLat = Math.atan(Math.sinh(Math.PI * normY)) * 180 / Math.PI;

      setLat(Number(nextLat.toFixed(6)));
      setLng(Number(nextLng.toFixed(6)));
    } else {
      // Normal hover tracking
      const dx = x - rect.width / 2;
      const dy = y - rect.height / 2;

      const n = Math.pow(2, zoomLevel);
      const safeCenterLat = Math.max(-85, Math.min(85, lat));
      const centerTileX = (lng + 180) / 360 * n;
      const centerTileY = (1 - Math.log(Math.tan(safeCenterLat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;

      const hoverTileX = centerTileX + dx / 256;
      const hoverTileY = centerTileY + dy / 256;

      const hLng = (hoverTileX / n) * 360 - 180;
      const normY = 1 - 2 * (hoverTileY / n);
      const hLat = Math.atan(Math.sinh(Math.PI * normY)) * 180 / Math.PI;

      setHoverCoords({
        lat: Number(hLat.toFixed(6)),
        lng: Number(hLng.toFixed(6))
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (!hasMovedRef.current) {
      // Place a vertex point!
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const dx = clickX - rect.width / 2;
      const dy = clickY - rect.height / 2;

      const n = Math.pow(2, zoomLevel);
      const safeCenterLat = Math.max(-85, Math.min(85, lat));
      const centerTileX = (lng + 180) / 360 * n;
      const centerTileY = (1 - Math.log(Math.tan(safeCenterLat * Math.PI / 360 + Math.PI / 4)) / Math.PI) / 2 * n;

      const clickedTileX = centerTileX + dx / 256;
      const clickedTileY = centerTileY + dy / 256;

      const clickLng = (clickedTileX / n) * 360 - 180;
      const normY = 1 - 2 * (clickedTileY / n);
      const clickLat = Math.atan(Math.sinh(Math.PI * normY)) * 180 / Math.PI;

      handleAddVertex(clickLat, clickLng);
    }
  };

  const handleNudge = (direction: "N" | "S" | "E" | "W", multiplier = 1) => {
    const baseStep = Math.pow(2, 12 - zoomLevel) * 0.001 * multiplier;
    let nextLat = lat;
    let nextLng = lng;

    switch (direction) {
      case "N": nextLat += baseStep; break;
      case "S": nextLat -= baseStep; break;
      case "E": nextLng += baseStep * 1.2; break;
      case "W": nextLng -= baseStep * 1.2; break;
    }

    setLat(nextLat);
    setLng(nextLng);
    
    // Shift drawn points as well to pan the drawn area
    if (boundary.length > 0) {
      const panned = boundary.map(b => ({
        lat: b.lat + (nextLat - lat),
        lng: b.lng + (nextLng - lng)
      }));
      setBoundary(panned);
      syncWithParent(panned);
    }
  };

  // Preset location handler
  const handleApplyPreset = (presetLat: number, presetLng: number, label: string) => {
    setLat(presetLat);
    setLng(presetLng);
    setAddressSearch(label);
    
    // Draw a default square around preset coordinates (~25 Ha)
    const offset = 0.002;
    const defaultBox = [
      { lat: presetLat + offset, lng: presetLng - offset },
      { lat: presetLat + offset, lng: presetLng + offset },
      { lat: presetLat - offset, lng: presetLng + offset },
      { lat: presetLat - offset, lng: presetLng - offset },
    ];
    setBoundary(defaultBox);
    syncWithParent(defaultBox);

    setSearchSuccess(true);
    setTimeout(() => setSearchSuccess(false), 2000);
  };

  const handleSearchSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!addressSearch.trim()) return;

    const coordReg = /^(-?\d+(\.\d+)?)\s*[\s,]\s*(-?\d+(\.\d+)?)$/;
    const match = addressSearch.trim().match(coordReg);
    if (match) {
      const parsedLat = parseFloat(match[1]);
      const parsedLng = parseFloat(match[3]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        handleApplyPreset(parsedLat, parsedLng, `${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`);
        return;
      }
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressSearch.trim()
        )}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "MyCrop-Ag-Platform-Dashboard_v1"
          }
        }
      );
      if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        const parsedLat = parseFloat(first.lat);
        const parsedLng = parseFloat(first.lon);
        if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
          // Found it! Center the map view and let them view/draw on it
          handleApplyPreset(parsedLat, parsedLng, first.name || first.display_name.split(",")[0] || addressSearch);
          setZoomLevel(15);
        } else {
          throw new Error("Invalid response coordinates");
        }
      } else {
        setSearchError("No locations found for your search. Try adjusting spelling or adding a country.");
      }
    } catch (err) {
      console.warn("Geocoding failed, falling back to local patterns", err);
      // Hardcoded offline/local fallbacks for greek villages or US presets if network issues or rate limiting occur
      const searchLower = addressSearch.toLowerCase();
      if (searchLower.includes("fitia") || searchLower.includes("greece") || searchLower.includes("φύτια") || searchLower.includes("veria")) {
        // Precise coordinates of Fitia village, Veria, Greece
        handleApplyPreset(40.5283, 22.1283, "Fitia, Greece");
        setZoomLevel(15);
      } else if (searchLower.includes("cornell") || searchLower.includes("illinois") || searchLower.includes("belt")) {
        handleApplyPreset(41.8900, -87.9540, "Cornell Agri Belt, IL");
      } else if (searchLower.includes("valley") || searchLower.includes("blue") || searchLower.includes("acres")) {
        handleApplyPreset(42.1120, -88.0210, "Blue Valley Acres, IL");
      } else if (searchLower.includes("lakeside") || searchLower.includes("wheat") || searchLower.includes("michigan")) {
        handleApplyPreset(41.5640, -87.4410, "Lakeside Wheat Zone, MI");
      } else {
        setSearchError("Could not connect to map search. Try specifying 'Fitia, Greece' or check connection.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Render SVG polygon path connecting coordinates with animated glow & marching ants
  const renderSVGPolygon = () => {
    if (boundary.length === 0) return null;
    
    const pointsStr = boundary.map(b => {
      const style = getSimulatedObjectStyle(b.lat, b.lng);
      return `${parseFloat(style.left)},${parseFloat(style.top)}`;
    }).join(" ");

    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes boundaryDash {
            to {
              stroke-dashoffset: -20;
            }
          }
          .animate-boundary-dash {
            animation: boundaryDash 0.8s linear infinite;
          }
          .animate-boundary-glow {
            filter: drop-shadow(0px 0px 4px rgba(34, 197, 94, 0.6));
          }
        ` }} />
        <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
          <defs>
            <linearGradient id="ndviGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#16a34a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0.30" />
            </linearGradient>
            <linearGradient id="satGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3bf7ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.10" />
            </linearGradient>
          </defs>

          {/* Closed Polygon Fill */}
          {boundary.length >= 3 && (
            <polygon 
              points={pointsStr} 
              fill={mapType === "ndvi" ? "url(#ndviGlowGrad)" : "url(#satGlowGrad)"}
              className="stroke-brand-green stroke-2 animate-boundary-glow animate-boundary-dash" 
              strokeDasharray="6 4"
            />
          )}
          
          {/* Border line if not closed / < 3 points */}
          {boundary.length < 3 && boundary.length > 1 && (
            <polyline
              points={pointsStr}
              className="stroke-brand-green stroke-2 fill-none animate-boundary-glow animate-boundary-dash"
              strokeDasharray="6 4"
            />
          )}
        </svg>
      </>
    );
  };

  // Shifting grid background
  const pixelScale = Math.pow(2, zoomLevel - 12) * 1200;
  const gridX = (lng * pixelScale) % 32;
  const gridY = (-lat * pixelScale) % 32;

  const presets = [
    { name: "🇬🇷 Fitia Greece", lat: 40.5283, lng: 22.1283, label: "Fitia, Greece" },
    { name: "🌽 IL Corn", lat: 41.8900, lng: -87.9540, label: "Cornell Belt Field B, IL" },
    { name: "🍅 CA Tomato", lat: 34.0220, lng: -118.4510, label: "Orchard Valley, CA" },
    { name: "🌾 TX Cotton", lat: 31.9680, lng: -99.9010, label: "West Texas Basin, TX" }
  ];

  const calculatedHa = calculatePolygonAreaHa(boundary);

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm space-y-4" id="drawn_field_picker_root">
      
      {/* 1. Header with drawing status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h4 className="text-xs font-display font-extrabold text-brand-green flex items-center gap-1.5 uppercase tracking-wide">
            <Compass className="w-4 h-4" />
            <span>Interactive Boundary Drawing System</span>
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
            Fencing tool: Click several vertices on the map layer to outline the biological parcel area.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndoVertex}
            disabled={boundary.length === 0}
            className="p-1 px-2.5 border bg-white rounded-lg text-[10px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Undo last point"
          >
            <Undo className="w-3 h-3" />
            Undo Vertex
          </button>
          
          <button
            type="button"
            onClick={handleClearBoundary}
            disabled={boundary.length === 0}
            className="p-1 px-2.5 border bg-white hover:bg-red-50 text-red-650 rounded-lg text-[10px] font-bold disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear all points"
          >
            <Trash2 className="w-3 h-3" />
            Reset Design
          </button>
        </div>
      </div>

      {/* 2. Unified Map Sandbox Container (Wide Full-Width Map Layout) */}
      <div className="flex flex-col space-y-4">
        
        {/* Map view section (Full 100% container width) */}
        <div className="w-full flex flex-col space-y-2">
          
          <div className="flex gap-1.5 flex-col w-full">
            <div className="flex gap-1.5 w-full">
              <div className="relative flex-1">
                {isSearching ? (
                  <RefreshCw className="w-3.5 h-3.5 text-brand-green animate-spin absolute left-3 top-2.5" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                )}
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => {
                    setAddressSearch(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder="Enter location (e.g., Fitia Greece, Illinois) or coordinates: e.g., 40.528, 22.128"
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                />
              </div>
              <button
                type="button"
                disabled={isSearching}
                onClick={() => handleSearchSubmit()}
                className="bg-brand-green hover:bg-brand-green-hover text-white text-[11px] font-display font-extrabold px-4 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-75"
              >
                {isSearching ? "Searching..." : "Search & Align"}
              </button>
            </div>
            {searchError && (
              <span className="text-[10px] text-red-500 font-medium px-1 flex items-center gap-1 animate-slideDown">
                ⚠️ {searchError}
              </span>
            )}
          </div>

          {/* Interactive Map Area Wrapper */}
          <div 
            ref={containerRef}
            className="relative border border-gray-200 rounded-2xl overflow-hidden h-[450px] sm:h-[480px] w-full bg-slate-950 shadow-inner group animate-fadeIn"
          >
            {hasValidKey ? (
              <APIProvider apiKey={API_KEY} version="weekly">
                <GoogleMap
                  center={{ lat, lng }}
                  zoom={zoomLevel}
                  mapId="AGRICULTURAL_PLATFORM_MAP_ID"
                  mapTypeId={mapType === "ndvi" ? "hybrid" : mapType === "satellite" ? "satellite" : "roadmap"}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: "100%", height: "100%" }}
                  className="drawing-surface"
                >
                  {boundary.map((vertex, i) => (
                    <AdvancedMarker key={i} position={vertex}>
                      <Pin background="#16a34a" borderColor="#ffffff" glyphColor="#ffffff" glyphText={`${i + 1}`} />
                    </AdvancedMarker>
                  ))}
                </GoogleMap>
              </APIProvider>
            ) : (
              /* High precision custom tactical canvas grid drawing with live OSM tiles */
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  setIsDragging(false);
                  setHoverCoords(null);
                }}
                className="w-full h-full relative cursor-crosshair overflow-hidden select-none drawing-surface bg-slate-900"
              >
                {/* 1. Precise Web Mercator projected OSM/ArcGIS World Imagery background map tiles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  {getVisibleTiles().map((tile) => {
                    const tileUrl = mapType === "terrain"
                      ? `https://basemaps.cartocdn.com/light_all/${zoomLevel}/${tile.x}/${tile.y}.png`
                      : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoomLevel}/${tile.y}/${tile.x}`;
                    
                    return (
                      <img
                        key={tile.key}
                        src={tileUrl}
                        alt=""
                        className="absolute w-[256px] h-[256px] select-none pointer-events-none transition-all duration-300"
                        style={{
                          left: `${tile.left}px`,
                          top: `${tile.top}px`,
                          filter: mapType === "ndvi" 
                            ? "hue-rotate(85deg) saturate(2.2) contrast(1.15) brightness(0.85)"
                            : "none"
                        }}
                      />
                    );
                  })}
                </div>

                {/* Subtile grid overlay to retain agricultural grid appearance */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none z-5 transition-all duration-300"
                  style={{ 
                    backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)", 
                    backgroundSize: "64px 64px",
                  }} 
                />

                {/* Drawn SVG overlay representing physical fence */}
                {renderSVGPolygon()}

                {/* Anchor dot nodes rendering dynamically over map coordinates with hover delete action */}
                {boundary.map((b, idx) => {
                  const style = getSimulatedObjectStyle(b.lat, b.lng);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delete the clicked point to make edits fast and easy
                        const nextBoundary = boundary.filter((_, i) => i !== idx);
                        setBoundary(nextBoundary);
                        syncWithParent(nextBoundary);
                      }}
                      className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-brand-green rounded-full shadow-lg z-25 flex items-center justify-center cursor-pointer hover:bg-rose-50 hover:border-rose-500 hover:scale-[1.18] transition-all group group/node"
                      style={style}
                      title="Click directly to remove this node"
                    >
                      <span className="text-[8.5px] font-bold text-brand-green font-mono group-hover/node:hidden">
                        {idx + 1}
                      </span>
                      <Trash2 className="w-2.5 h-2.5 text-rose-500 hidden group-hover/node:block animate-fadeIn" />
                    </button>
                  );
                })}

                {/* Floating CAD Tactical GIS HUD overlay */}
                <div className="absolute top-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 text-white rounded-2xl p-3 shadow-xl z-20 w-48 text-[10px] space-y-2 select-none transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${boundary.length >= 3 ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                      <span className="font-display font-black text-[9px] tracking-wider text-slate-200">
                        {boundary.length >= 3 ? "SYSTEM ACTIVE" : "VEG. SAMPLING"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 font-mono text-slate-350">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="text-slate-500">PARCEL ID:</span>
                      <span className="text-white font-bold truncate max-w-[90px]">{fieldName || "Active"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">SAMPLING TYPE:</span>
                      <span className="text-brand-green font-bold uppercase">{cropType || "Corn"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">CALC AREA:</span>
                      <span className="text-white font-black">{calculatedHa} Ha</span>
                    </div>
                    {boundary.length >= 2 && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">PERIMETER:</span>
                        <span className="text-white font-black">{calculatePolygonPerimeterMeters(boundary)} m</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start pt-1 border-t border-slate-900/60 text-[8.5px]">
                      <span className="text-slate-500">CENTER:</span>
                      <span className="text-slate-300 text-right">{lat.toFixed(4)}°N<br/>{lng.toFixed(4)}°W</span>
                    </div>
                    {hoverCoords && (
                      <div className="flex justify-between items-center pt-1 text-[8.5px] border-t border-slate-900/45 text-emerald-400">
                        <span className="text-slate-500 font-sans">CROSSHAIR:</span>
                        <span>{hoverCoords.lat.toFixed(4)}°N</span>
                      </div>
                    )}
                  </div>

                  {/* Actions inside the Tactical GIS HUD */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-900/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUndoVertex();
                      }}
                      disabled={boundary.length === 0}
                      title="Undo last corner point"
                      className="flex-1 py-1 px-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 text-[8.5px] font-bold"
                    >
                      <Undo className="w-2.5 h-2.5 text-amber-500" />
                      <span>Undo</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBoundary([]);
                        syncWithParent([]);
                      }}
                      disabled={boundary.length === 0}
                      title="Clear all nodes"
                      className="flex-1 py-1 px-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/30 border border-rose-900/50 hover:border-rose-700/60 text-rose-200 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1 text-[8.5px] font-bold"
                    >
                      <Trash2 className="w-2.5 h-2.5 text-rose-450" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Click Instruction Banner */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-950/95 border border-slate-800 p-2.5 rounded-2xl shadow-xl flex items-center justify-between text-white md:px-4.5 z-10 animate-slideUp">
                  <span className="text-[10px] font-semibold text-gray-300 flex items-center gap-2 leading-tight">
                    <Info className="w-3.5 h-3.5 text-brand-green animate-pulse" />
                    <span>
                      {boundary.length === 0 
                        ? "Click directly on the satellite tiles above to drop agricultural boundary corner pegs." 
                        : boundary.length < 3 
                        ? `Corner ${boundary.length} dropped. Click maps again to add vertex ${boundary.length + 1}.` 
                        : `Constructed field area finalized with ${boundary.length} GPS vertices.`}
                    </span>
                  </span>
                  <span className="text-[8.5px] font-bold text-brand-green bg-brand-green/20 rounded border border-brand-green/30 px-2 py-0.5 uppercase font-mono shrink-0">
                    {boundary.length >= 3 ? "VALID SHAPE" : "PEG DESIGN"}
                  </span>
                </div>
              </div>
            )}

            {/* View Settings Overlay */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-2 z-30">
              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1 flex flex-col gap-1 shadow-xl">
                <span className="text-[7.5px] font-bold text-slate-500 text-center uppercase tracking-wider block py-0.5 px-1.5">Layers</span>
                <button
                  type="button"
                  onClick={() => setMapType("ndvi")}
                  className={`p-1.5 px-2 rounded-xl text-[8.5px] font-black uppercase transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                    mapType === "ndvi" ? "bg-brand-green text-white shadow-md font-extrabold" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>NDVI Bands</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("satellite")}
                  className={`p-1.5 px-2 rounded-xl text-[8.5px] font-black uppercase transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                    mapType === "satellite" ? "bg-brand-green text-white shadow-md font-extrabold" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>True Satellite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapType("terrain")}
                  className={`p-1.5 px-2 rounded-xl text-[8.5px] font-black uppercase transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                    mapType === "terrain" ? "bg-brand-green text-white shadow-md font-extrabold" : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>Street Map</span>
                </button>
              </div>

              <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 flex items-center justify-between shadow-xl px-2.5 h-8 gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(10, prev - 1))}
                  className="p-1 hover:bg-slate-900 hover:text-white text-slate-400 rounded-lg cursor-pointer transition-colors"
                  title="Zoom Out"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-black text-slate-200">{zoomLevel}x</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(18, prev + 1))}
                  className="p-1 hover:bg-slate-900 hover:text-white text-slate-400 rounded-lg cursor-pointer transition-colors"
                  title="Zoom In"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {searchSuccess && (
              <div className="absolute top-2 left-2 bg-brand-green text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold flex items-center gap-1 shadow animate-fadeIn z-20">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Zone Loaded</span>
              </div>
            )}
          </div>
        </div>

        {/* Info detail state parameters bottom grid (Full-width responsive alignment) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150">
          
          {/* Preset regional quick links */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Load Preset Growing Zones
              </span>
              <p className="text-[9px] text-gray-400 block mb-1">Click to jump camera bounds</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((pSet) => (
                <button
                  key={pSet.name}
                  type="button"
                  onClick={() => handleApplyPreset(pSet.lat, pSet.lng, pSet.label)}
                  className="text-[10px] font-bold border rounded-lg p-1 text-center transition-all bg-white cursor-pointer hover:border-brand-green hover:bg-emerald-50/10 leading-tight"
                >
                  {pSet.name}
                </button>
              ))}
            </div>
          </div>

          {/* Computed area size indicator card */}
          <div className="bg-white border rounded-xl p-3 shadow-sm space-y-1.5 flex flex-col justify-center">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Live Area Calculation
            </span>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-lg font-display font-black text-gray-950 block leading-none">
                  {calculatedHa} Ha
                </strong>
                <span className="text-[9px] font-medium text-gray-400 font-mono block mt-1">
                  {(calculatedHa * 2.471).toFixed(1)} Acres (Shoelace formula)
                </span>
              </div>
            </div>
          </div>

          {/* Points list tracker */}
          <div className="bg-white border rounded-xl p-3 shadow-sm flex flex-col justify-between min-h-[90px]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              Boundary Corners Map ({boundary.length})
            </span>
            
            {boundary.length === 0 ? (
              <p className="text-[9px] text-gray-400 font-medium py-2 text-center my-auto">
                No corners set. Click on map.
              </p>
            ) : (
              <div className="space-y-1 max-h-[75px] overflow-y-auto pr-1 mt-1">
                {boundary.map((pt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[9px] font-mono bg-gray-50/70 p-0.5 px-1 rounded border border-gray-100 text-gray-600">
                    <span className="font-bold text-brand-green">Pt {idx + 1}:</span>
                    <span>{pt.lat.toFixed(3)}°N, {Math.abs(pt.lng).toFixed(3)}°W</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual coordinate centration panel */}
          <div className="space-y-2 flex flex-col justify-between">
            <span className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block">
              Centroid Camera
            </span>
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold text-gray-550 block">Latitude (°N)</label>
                <input
                  type="number"
                  value={lat}
                  step="0.001"
                  onChange={(e) => setLat(parseFloat(e.target.value) || lat)}
                  className="w-full text-[10px] font-mono bg-white border border-gray-200 rounded p-1 font-bold text-gray-800 focus:outline-none"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-bold text-gray-550 block">Longitude (°W)</label>
                <input
                  type="number"
                  value={lng}
                  step="0.001"
                  onChange={(e) => setLng(parseFloat(e.target.value) || lng)}
                  className="w-full text-[10px] font-mono bg-white border border-gray-200 rounded p-1 font-bold text-gray-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
