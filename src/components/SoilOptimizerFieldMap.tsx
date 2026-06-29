import React, { useEffect, useRef, useState, useMemo } from "react";
import { Parcel } from "../types";
import { useSettings } from "../contexts/SettingsContext";
import { 
  Layers, 
  Droplets, 
  Flame, 
  Compass, 
  Thermometer, 
  Sparkles, 
  ShieldAlert, 
  Maximize2 
} from "lucide-react";

interface SoilOptimizerFieldMapProps {
  parcel: Parcel;
}

type MapLayerType = "moisture" | "nitrogen" | "ph" | "organic";

interface ProbePoint {
  id: string;
  name: string;
  offsetLat: number;
  offsetLng: number;
  moisture: string;
  nitrogen: string;
  ph: number;
  organic: string;
}

export default function SoilOptimizerFieldMap({ parcel }: SoilOptimizerFieldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayersRef = useRef<any[]>([]);
  const probeMarkersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);

  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>("nitrogen");
  const [selectedProbe, setSelectedProbe] = useState<ProbePoint | null>(null);

  const { theme } = useSettings();
  const isDarkMode = theme === "dark";

  const lat = parcel?.latitude || parcel?.lat || 35.0;
  const lng = parcel?.longitude || parcel?.lng || 35.0;
  const boundaries = parcel?.boundaries || [];

  // Generate 3 core subsoil sensors placed strategically within or near the field boundary
  const probes = useMemo<ProbePoint[]>(() => {
    // Generate pseudo-random offsets based on parcel's name/ID length to keep them consistent
    const seed = (parcel?.id || "default").length;

    // Default fallback offsets if no boundaries
    let offsetA = { lat: 0.0003, lng: -0.0002 };
    let offsetB = { lat: 0, lng: 0 };
    let offsetC = { lat: -0.0003, lng: 0.0002 };

    if (boundaries && boundaries.length >= 3) {
      // Calculate centroid
      let sumLat = 0;
      let sumLng = 0;
      boundaries.forEach(b => {
        sumLat += b.lat;
        sumLng += b.lng;
      });
      const centerLat = sumLat / boundaries.length;
      const centerLng = sumLng / boundaries.length;

      // Probe B is at centroid
      offsetB = { lat: centerLat - lat, lng: centerLng - lng };

      // Probe A is halfway between centroid and first vertex
      const v0 = boundaries[0];
      offsetA = {
        lat: ((centerLat + v0.lat) / 2) - lat,
        lng: ((centerLng + v0.lng) / 2) - lng
      };

      // Probe C is halfway between centroid and vertex at index 2 (or 1 if length is 3)
      const v2 = boundaries[Math.min(2, boundaries.length - 1)];
      offsetC = {
        lat: ((centerLat + v2.lat) / 2) - lat,
        lng: ((centerLng + v2.lng) / 2) - lng
      };
    }

    return [
      {
        id: "probe-core-a",
        name: "Soil Sample Location A",
        offsetLat: offsetA.lat,
        offsetLng: offsetA.lng,
        moisture: "34.2% (Optimal)",
        nitrogen: "78 mg/kg (High)",
        ph: parseFloat((6.4 + (seed % 5) * 0.1).toFixed(1)),
        organic: "3.2% (Rich)"
      },
      {
        id: "probe-core-b",
        name: "Soil Sample Location B",
        offsetLat: offsetB.lat,
        offsetLng: offsetB.lng,
        moisture: "28.5% (Marginal)",
        nitrogen: "46 mg/kg (Medium)",
        ph: parseFloat((5.8 + (seed % 3) * 0.2).toFixed(1)),
        organic: "1.9% (Moderate)"
      },
      {
        id: "probe-core-c",
        name: "Soil Sample Location C",
        offsetLat: offsetC.lat,
        offsetLng: offsetC.lng,
        moisture: "19.1% (Low / Leached)",
        nitrogen: "22 mg/kg (Deficient)",
        ph: parseFloat((7.1 - (seed % 4) * 0.1).toFixed(1)),
        organic: "0.8% (Depleted)"
      }
    ];
  }, [parcel, boundaries, lat, lng]);

  // Load Leaflet Script & Stylesheet
  useEffect(() => {
    if (!document.getElementById("leaflet-css-link")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-link";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Map Color Configuration by Active Layer Option
  const overlayColors = useMemo(() => {
    switch (activeLayer) {
      case "moisture":
        return {
          stroke: "#0ea5e9", // sky-500
          zones: ["#38bdf8", "#0284c7", "#0369a1"], // light to deep water retention blue
          fillOpacity: 0.45
        };
      case "nitrogen":
        return {
          stroke: "#10b981", // emerald-500
          zones: ["#a7f3d0", "#34d399", "#059669"], // nitrogen concentration zones
          fillOpacity: 0.45
        };
      case "ph":
        return {
          stroke: "#f59e0b", // amber-500
          zones: ["#f87171", "#34d399", "#f59e0b"], // red (acidic), green (neutral/opt), yellow (alkaline)
          fillOpacity: 0.4
        };
      case "organic":
        return {
          stroke: "#b45309", // amber-700
          zones: ["#fcd34d", "#d97706", "#78350f"], // sandy brown, loamy, deep organic organic
          fillOpacity: 0.5
        };
    }
  }, [activeLayer]);

  // Map Initialization & Updates
  useEffect(() => {
    if (!isLeafletLoaded || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Clean old instances
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // High fidelity interactive map
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15, // Default start zoom
      maxZoom: 18, // Stop user from zooming too deep into unavailable tile ranges
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Beautiful High-resolution Satellite Imagery
    const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    const satelliteTiles = L.tileLayer(satelliteUrl, {
      maxZoom: 18,
      maxNativeZoom: 18, // Prevents loading missing higher zoom level tiles
      attribution: "Esri, DigitalGlobe, GeoEye, Earthstar Geographics"
    }).addTo(map);
    tileLayerRef.current = satelliteTiles;

    // Draw Heatmap-style soil zones
    // We subdivide the boundary/radius area into 3 visual sectors/polygons
    polygonLayersRef.current.forEach(layer => layer.remove());
    polygonLayersRef.current = [];

    if (boundaries.length >= 3) {
      const latLngs = boundaries.map(b => [b.lat, b.lng]);
      
      // Dynamic Zoom/Fit bounds of the specific field
      try {
        const polyBounds = L.polygon(latLngs).getBounds();
        map.fitBounds(polyBounds, { padding: [40, 40] });
      } catch (err) {
        console.error("Error auto-zooming onto field:", err);
      }

      // Draw 3 nested zones representing different concentration areas
      const centerPoint = [lat, lng];

      // Sector 1: Core Zone
      const zoneACoords = boundaries.slice(0, Math.ceil(boundaries.length / 2)).map(b => [
        (b.lat + lat) / 2,
        (b.lng + lng) / 2
      ]);
      if (zoneACoords.length >= 3) {
        const polyA = L.polygon(zoneACoords, {
          color: overlayColors.stroke,
          weight: 1,
          fillColor: overlayColors.zones[2],
          fillOpacity: overlayColors.fillOpacity
        }).addTo(map);
        polyA.bindTooltip(`Optimized ${activeLayer.toUpperCase()} Sector A`, { sticky: true });
        polygonLayersRef.current.push(polyA);
      }

      // Sector 2: Outer Zone
      const polyOuter = L.polygon(latLngs, {
        color: overlayColors.stroke,
        weight: 2,
        fillColor: overlayColors.zones[1],
        fillOpacity: overlayColors.fillOpacity * 0.6,
        dashArray: "3, 5"
      }).addTo(map);
      polyOuter.bindTooltip(`Sub-Soil ${activeLayer.toUpperCase()} sector B`, { sticky: true });
      polygonLayersRef.current.push(polyOuter);

    } else {
      // Draw concentric circular soil layers for point-based locations
      const circle1 = L.circle([lat, lng], {
        color: overlayColors.stroke,
        fillColor: overlayColors.zones[2],
        fillOpacity: overlayColors.fillOpacity,
        radius: 180,
        weight: 1
      }).addTo(map);
      circle1.bindTooltip(`Premium Sector A`, { sticky: true });
      polygonLayersRef.current.push(circle1);

      const circle2 = L.circle([lat, lng], {
        color: overlayColors.stroke,
        fillColor: overlayColors.zones[1],
        fillOpacity: overlayColors.fillOpacity * 0.5,
        radius: 350,
        weight: 2,
        dashArray: "3, 6"
      }).addTo(map);
      circle2.bindTooltip(`Buffer Sector B`, { sticky: true });
      polygonLayersRef.current.push(circle2);
    }

    // Add sensor probe pins
    probeMarkersRef.current.forEach(marker => marker.remove());
    probeMarkersRef.current = [];

    probes.forEach((probe) => {
      const probeLat = lat + probe.offsetLat;
      const probeLng = lng + probe.offsetLng;

      // Match probe pin color
      let pinBg = "bg-emerald-500";
      if (activeLayer === "moisture") pinBg = "bg-sky-500";
      else if (activeLayer === "ph") pinBg = "bg-amber-500";
      else if (activeLayer === "organic") pinBg = "bg-yellow-700";

      const iconHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 cursor-pointer">
          <div class="w-5 h-5 rounded-full ${pinBg} border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        className: "soil-sample-icon",
        html: iconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([probeLat, probeLng], { icon: markerIcon }).addTo(map);

      // Bind dynamic Popup
      const popupContent = `
        <div class="p-2 font-sans text-xs text-slate-800" style="min-width: 170px;">
          <h4 class="font-black border-b pb-1 text-slate-900 flex items-center gap-1">🧪 ${probe.name}</h4>
          <div class="mt-2 space-y-1">
            <p>💧 <strong>Moisture:</strong> ${probe.moisture}</p>
            <p>🌱 <strong>Nitrogen:</strong> ${probe.nitrogen}</p>
            <p>🧪 <strong>pH:</strong> ${probe.ph}</p>
            <p>🍂 <strong>Organic Matter:</strong> ${probe.organic}</p>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      
      marker.on("click", () => {
        setSelectedProbe(probe);
      });

      probeMarkersRef.current.push(marker);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLeafletLoaded, lat, lng, activeLayer, overlayColors, probes, boundaries]);

  return (
    <div className="space-y-4">
      {/* Visual Controls Panel Overlay */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">Soil Layer Overlays</span>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveLayer("nitrogen")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              activeLayer === "nitrogen"
                ? "bg-emerald-500 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            Nitrogen (N)
          </button>
          <button
            onClick={() => setActiveLayer("moisture")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              activeLayer === "moisture"
                ? "bg-sky-500 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            Moisture
          </button>
          <button
            onClick={() => setActiveLayer("ph")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              activeLayer === "ph"
                ? "bg-amber-500 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            Soil pH
          </button>
          <button
            onClick={() => setActiveLayer("organic")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
              activeLayer === "organic"
                ? "bg-yellow-700 text-white"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
          >
            Humic/OM
          </button>
        </div>
      </div>

      {/* Actual Map Container */}
      <div className="relative">
        <div className="w-full h-[450px] bg-slate-900 rounded-3xl relative overflow-hidden border border-slate-100 dark:border-slate-800 shadow-md">
          {!isLeafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-xs text-slate-400">Loading satellite layers...</span>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full z-0" />

          {/* Quick Floating Map Legend */}
          <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-white rounded-xl p-2.5 z-[1000] text-[9px] font-medium max-w-[150px] shadow-lg">
            <span className="font-bold text-[10px] uppercase block mb-1 text-emerald-400">{activeLayer} Legend</span>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs inline-block" style={{ backgroundColor: overlayColors.zones[2] }}></span>
                <span>Highly Optimal (Core)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs inline-block" style={{ backgroundColor: overlayColors.zones[1] }}></span>
                <span>Marginal (Transition)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded-xs inline-block" style={{ backgroundColor: overlayColors.zones[0], opacity: 0.8 }}></span>
                <span>Deficient (Outer Edge)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Sensor Core Information Drawer */}
      {selectedProbe && (
        <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <Compass className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Selected Soil Sample Point</span>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{selectedProbe.name}</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Diagnostic measurements for this sample location.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3 rounded-xl">
            <div className="text-center md:text-left">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">Moisture</span>
              <span className="text-xs font-bold text-sky-600">{selectedProbe.moisture.split(" ")[0]}</span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">Nitrogen</span>
              <span className="text-xs font-bold text-emerald-600">{selectedProbe.nitrogen.split(" ")[0]} {selectedProbe.nitrogen.split(" ")[1]}</span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">Sub-Soil pH</span>
              <span className="text-xs font-bold text-amber-600">{selectedProbe.ph}</span>
            </div>
            <div className="text-center md:text-left">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">Organic Matter</span>
              <span className="text-xs font-bold text-yellow-700">{selectedProbe.organic.split(" ")[0]}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
