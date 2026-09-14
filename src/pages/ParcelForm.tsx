import React, { useState, useEffect, useRef } from "react";
import { Coordinate, CROP_PRESETS as CROP_PRESETS_MAP, Crop } from "../types";
import { getCropsCatalog } from "../lib/db";
import { ArrowLeft, Check, Droplet, Search, Trash2, Undo, MapPin, Minimize2, Maximize2 } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface ParcelFormProps {
  onAddParcel: (parcel: any) => void;
  onNavigateBack: () => void;
}

const CROP_PRESETS = Object.keys(CROP_PRESETS_MAP);

const SOIL_PRESETS = [
  "Clay Loam",
  "Silt Loam",
  "Sandy Loam",
  "Peat",
  "Chalky Clay",
  "Humus Rich"
];

// Shoelace Area Calculation algorithm in Hectares
function calculatePolygonAreaHa(vertices: { lat: number; lng: number }[]): number {
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

export default function ParcelForm({ onAddParcel, onNavigateBack }: ParcelFormProps) {
  const [name, setName] = useState("");
  const [cropType, setCropType] = useState(CROP_PRESETS[0]);
  const [soilType, setSoilType] = useState(SOIL_PRESETS[0]);
  const [area, setArea] = useState(0);
  const [soilMoisture, setSoilMoisture] = useState(38);
  const [lat, setLat] = useState(40.5283);
  const [lng, setLng] = useState(22.1283);

  const [dbCrops, setDbCrops] = useState<Crop[]>([]);

  useEffect(() => {
    const loadCropsFromDb = async () => {
      try {
        const list = await getCropsCatalog();
        if (list && list.length > 0) {
          setDbCrops(list);
        }
      } catch (err) {
        console.warn("Failed to retrieve crops catalog in form:", err);
      }
    };
    loadCropsFromDb();
  }, []);

  // Environmental states
  const [soilPH, setSoilPH] = useState(6.4);
  const [nitrogen, setNitrogen] = useState("Optimal");
  const [ndviValue, setNdviValue] = useState(0.72);
  const [ndwiValue, setNdwiValue] = useState(0.42);

  // Simulated drawn vertices
  const [vertices, setVertices] = useState<Coordinate[]>([]);

  // Leaflet Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const verticesRef = useRef<Coordinate[]>([]); // To keep track for leaflet events

  useEffect(() => {
    verticesRef.current = vertices;
  }, [vertices]);

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

  // Init Map
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      const satelliteUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      L.tileLayer(satelliteUrl, { maxZoom: 19 }).addTo(map);

      map.on('click', (e: any) => {
        const newPoint = { lat: e.latlng.lat, lng: e.latlng.lng };
        setVertices(prev => {
          const next = [...prev, newPoint];
          const newArea = calculatePolygonAreaHa(next);
          setArea(newArea);
          return next;
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLeafletLoaded]); // Run once when loaded

  // Update Drawing on Map
  useEffect(() => {
    if (!isLeafletLoaded || !mapInstanceRef.current) return;
    const L = (window as any).L;
    const map = mapInstanceRef.current;

    // Clear previous
    if (polygonLayerRef.current) {
      polygonLayerRef.current.remove();
      polygonLayerRef.current = null;
    }
    if (markerLayerRef.current) {
      markerLayerRef.current.remove();
      markerLayerRef.current = null;
    }

    if (vertices.length > 0) {
      const latLngs = vertices.map(v => [v.lat, v.lng]);
      
      if (vertices.length >= 3) {
        polygonLayerRef.current = L.polygon(latLngs, {
          color: "#10B981",
          weight: 3,
          fillColor: "#10B981",
          fillOpacity: 0.3,
          dashArray: vertices.length < 3 ? "5, 5" : ""
        }).addTo(map);
      } else {
        polygonLayerRef.current = L.polyline(latLngs, {
          color: "#10B981",
          weight: 3,
          dashArray: "5, 5"
        }).addTo(map);
      }

      // Add markers for points
      const markerGroup = L.layerGroup().addTo(map);
      markerLayerRef.current = markerGroup;
      
      vertices.forEach((v, i) => {
        const iconHtml = `<div class="w-3 h-3 bg-white border-2 border-emerald-500 rounded-full shadow-sm cursor-pointer hover:bg-rose-500 hover:border-white"></div>`;
        const icon = L.divIcon({ className: 'custom-div-icon', html: iconHtml, iconSize: [12, 12], iconAnchor: [6, 6] });
        const marker = L.marker([v.lat, v.lng], { icon }).addTo(markerGroup);
        
        marker.on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          setVertices(prev => {
            const next = prev.filter((_, idx) => idx !== i);
            setArea(calculatePolygonAreaHa(next));
            return next;
          });
        });
      });
    }
  }, [vertices, isLeafletLoaded]);

  const handleSelectLocationFromSearch = (newLat: number, newLng: number, selectedName: string) => {
    setLat(newLat);
    setLng(newLng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([newLat, newLng], 15);
    }
  };

  const handleUndo = () => {
    setVertices(prev => {
      const next = prev.slice(0, -1);
      setArea(calculatePolygonAreaHa(next));
      return next;
    });
  };

  const handleClear = () => {
    setVertices([]);
    setArea(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let finalLat = lat;
    let finalLng = lng;
    if (vertices.length > 0) {
       finalLat = vertices[0].lat;
       finalLng = vertices[0].lng;
    }

    const finalNdvi = ndviValue || 0.65;
    const cropHeight = Math.floor(40 + (finalNdvi * 60) + (Math.random() * 10));
    const predictedYield = parseFloat((2.5 + (finalNdvi * 4.5)).toFixed(1));

    onAddParcel({
      name: name.trim(),
      cropType,
      soilType,
      area,
      farmSize: area,
      soilMoisture,
      lat: finalLat,
      lng: finalLng,
      latitude: finalLat,
      longitude: finalLng,
      boundaries: vertices,
      ndvi: Math.min(0.99, Math.max(0.1, finalNdvi)),
      ndviValue: Math.min(0.99, Math.max(0.1, finalNdvi)),
      ndwiValue: ndwiValue,
      cropHeight,
      predictedYield,
      soilPH,
      nitrogen,
      plantingMonth: "May",
      costPerHectare: cropType === "Soybeans" ? 950 : cropType === "Winter Wheat" ? 885 : 900,
      marketPricePerTon: cropType === "Soybeans" ? 340 : cropType === "Winter Wheat" ? 190 : 220
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-150 pb-5">
        <button
          onClick={onNavigateBack}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create New Field</h1>
          <p className="text-sm text-gray-500 font-medium">Draw your field boundary and set properties.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Field Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Pasture"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Crop Type</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {(dbCrops.length > 0 ? dbCrops.map((c) => c.name) : CROP_PRESETS).map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Soil Type</label>
              <select
                value={soilType}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 font-bold focus:outline-none cursor-not-allowed"
              >
                {SOIL_PRESETS.map((soil) => (
                  <option key={soil} value={soil}>{soil}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">Soil type is automatically determined by location.</p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Estimated Area</span>
                <span className="text-emerald-600 font-mono">{area > 0 ? area : "---"} Ha</span>
              </div>
              <p className="text-[10px] text-slate-400">Area is calculated from drawn boundary.</p>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || vertices.length < 3}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black px-6 py-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <Check className="w-5 h-5" />
              <span>{vertices.length < 3 ? "Draw Boundary on Map" : "Save Field"}</span>
            </button>
            
            {vertices.length < 3 && (
              <p className="text-xs text-center text-slate-500 font-medium mt-2">
                Click at least 3 points on the map to draw the field boundary.
              </p>
            )}
          </div>
        </div>

        {/* Simple Leaflet Map Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-[600px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex-1 flex gap-2">
                <LocationSearch 
                  onLocationSelect={handleSelectLocationFromSearch} 
                  placeholder="Search location..." 
                />
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={vertices.length === 0}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Undo className="w-3.5 h-3.5" />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={vertices.length === 0}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 w-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
               {!isLeafletLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 text-white font-bold">
                  Loading Map Engine...
                </div>
              )}
              <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />
              
              <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-white/95 backdrop-blur shadow-lg rounded-xl p-3 border border-slate-200 z-[1000] pointer-events-none">
                <div className="flex items-center gap-2 mb-1 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold">Drawing Instructions</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Click on the map to add boundary points.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click a placed point to remove it.</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
