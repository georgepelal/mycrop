import React, { useState, useEffect } from "react";
import { Coordinate, CROP_PRESETS as CROP_PRESETS_MAP, Crop } from "../types";
import { getCropsCatalog, saveCropsCatalog } from "../lib/db";
import { 
  Map, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  Info, 
  ArrowLeft,
  ChevronRight,
  Droplet,
  Shuffle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Database,
  Globe,
  RefreshCw,
  Activity,
  Sparkles,
  AlertCircle
} from "lucide-react";
import FieldMapPicker, { calculatePolygonAreaHa } from "../components/FieldMapPicker";

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

export default function ParcelForm({ onAddParcel, onNavigateBack }: ParcelFormProps) {
  const [name, setName] = useState("");
  const [cropType, setCropType] = useState(CROP_PRESETS[0]);
  const [soilType, setSoilType] = useState(SOIL_PRESETS[0]);
  const [area, setArea] = useState(0);
  const [soilMoisture, setSoilMoisture] = useState(38);
  const [lat, setLat] = useState(40.5283);
  const [lng, setLng] = useState(22.1283);

  const [dbCrops, setDbCrops] = useState<Crop[]>([]);
  const [isSyncingCrops, setIsSyncingCrops] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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

  const syncCropsFromAPI = async () => {
    setIsSyncingCrops(true);
    setSyncStatus("Connecting agronomic catalog API...");
    try {
      const response = await fetch("/api/dynamic-crops");
      if (!response.ok) {
        throw new Error(`Server returned code: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.crops && data.crops.length > 0) {
        setSyncStatus(`Syncing ${data.crops.length} crops...`);
        await saveCropsCatalog(data.crops);
        const refreshedList = await getCropsCatalog();
        setDbCrops(refreshedList);
        setSyncStatus(`Catalog synchronized: ${refreshedList.length} crops active!`);
      } else {
        throw new Error("Empty crop dataset returned from system source");
      }
    } catch (err: any) {
      console.error("Crops synchronization crashed:", err);
      setSyncStatus(`Sync issue: ${err.message || String(err)}`);
    } finally {
      setIsSyncingCrops(false);
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };
  
  // Real environmental states parsed from map clicks
  const [soilPH, setSoilPH] = useState(6.4);
  const [nitrogen, setNitrogen] = useState("Optimal");
  const [ndviValue, setNdviValue] = useState(0.72);
  const [ndwiValue, setNdwiValue] = useState(0.42);
  const [showBackup, setShowBackup] = useState(false);

  // Real SoilGrids API states
  const [soilGridsClay, setSoilGridsClay] = useState<number | undefined>(undefined);
  const [soilGridsSand, setSoilGridsSand] = useState<number | undefined>(undefined);
  const [soilGridsSilt, setSoilGridsSilt] = useState<number | undefined>(undefined);
  const [soilGridsSoc, setSoilGridsSoc] = useState<number | undefined>(undefined);
  const [soilGridsNitrogenValue, setSoilGridsNitrogenValue] = useState<number | undefined>(undefined);
  const [isRealSoilGridsUsed, setIsRealSoilGridsUsed] = useState<boolean>(false);
  const [isLoadingSoilGrids, setIsLoadingSoilGrids] = useState<boolean>(false);
  const [soilGridsError, setSoilGridsError] = useState<string | null>(null);

  // Real-time AI Crop Detection States from Geography
  const [detectedCropInfo, setDetectedCropInfo] = useState<{ crop: string; confidence: number; explanation: string } | null>(null);
  const [isDetectingCrop, setIsDetectingCrop] = useState<boolean>(false);
  const [cropDetectionError, setCropDetectionError] = useState<string | null>(null);

  const fetchDetectedCrop = async (latVal: number, lngVal: number) => {
    setIsDetectingCrop(true);
    setCropDetectionError(null);
    try {
      const response = await fetch("/api/detect-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: latVal, lng: lngVal })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Crop detection analysis timed out/unreachable");
      }
      const data = await response.json();
      if (data.detectedCrop) {
        setDetectedCropInfo({
          crop: data.detectedCrop,
          confidence: data.confidence,
          explanation: data.explanation
        });
        // Auto select the detected crop variety in select menus
        setCropType(data.detectedCrop);
      }
    } catch (err: any) {
      console.warn("Real-time crop detection failed:", err);
      setCropDetectionError(err.message || "Failed auto-identifying regional crop");
    } finally {
      setIsDetectingCrop(false);
    }
  };

  // Simulated drawn vertices
  const [vertices, setVertices] = useState<Coordinate[]>([]);

  const [activeStep, setActiveStep] = useState<"details" | "drawing">("drawing");

  // Asynchronous Earth SoilGrids API Query
  const fetchSoilGrids = async (latVal: number, lngVal: number) => {
    setIsLoadingSoilGrids(true);
    setSoilGridsError(null);
    try {
      const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lngVal}&lat=${latVal}&property=clay&property=sand&property=silt&property=phh2o&property=nitrogen&property=soc&depth=0-5cm&depth=5-15cm&value=mean`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`SoilGrids returns status ${response.status}`);
      }
      
      const resData = await response.json();
      const layers = resData?.properties?.layers || [];
      const parsed: any = {};
      
      layers.forEach((layer: any) => {
        const name = layer.name;
        const v0 = layer.depths?.[0]?.values?.mean;
        const v1 = layer.depths?.[1]?.values?.mean;
        const meanValue = v0 !== undefined && v0 !== null ? v0 : v1;
        
        if (meanValue !== undefined && meanValue !== null) {
          if (name === "phh2o") {
            parsed.ph = parseFloat((meanValue / 10).toFixed(1));
          } else if (name === "clay" || name === "sand" || name === "silt") {
            parsed[name] = parseFloat((meanValue / 10).toFixed(1));
          } else if (name === "nitrogen") {
            parsed.nitrogen = Math.round(meanValue / 10); // cg/kg to mg/kg / ppm
          } else if (name === "soc") {
            parsed.soc = parseFloat((meanValue / 10).toFixed(1)); // dg/kg to g/kg
          }
        }
      });
      
      if (parsed.clay !== undefined || parsed.ph !== undefined) {
        setSoilGridsClay(parsed.clay);
        setSoilGridsSand(parsed.sand);
        setSoilGridsSilt(parsed.silt);
        setSoilGridsSoc(parsed.soc);
        setSoilGridsNitrogenValue(parsed.nitrogen);
        setIsRealSoilGridsUsed(true);
        
        // Dynamic formulation - auto select standard soil types matching Clay vs Sand fractions
        if (parsed.clay && parsed.sand) {
          if (parsed.clay > 30) {
            setSoilType("Clay Loam");
          } else if (parsed.sand > 45) {
            setSoilType("Sandy Loam");
          } else {
            setSoilType("Silt Loam");
          }
        }
        if (parsed.ph) {
          setSoilPH(parsed.ph);
        }
        if (parsed.nitrogen) {
          if (parsed.nitrogen > 130) {
            setNitrogen("Optimal");
          } else if (parsed.nitrogen > 75) {
            setNitrogen("Balanced");
          } else {
            setNitrogen("Slightly Low");
          }
        }
      } else {
        throw new Error("No raster layers found for coordinate signature");
      }
    } catch (err: any) {
      console.warn("SoilGrids query error:", err);
      setSoilGridsError(err?.message || "Failure searching ISRIC web hosts");
      setIsRealSoilGridsUsed(false);
    } finally {
      setIsLoadingSoilGrids(false);
    }
  };

  // Run automatically when the user swaps to Form Details stage
  useEffect(() => {
    if (activeStep === "details" && lat && lng) {
      fetchSoilGrids(lat, lng);
    }
  }, [activeStep, lat, lng]);

  // Handle updates when user draws or picks boundaries on Map
  const handleLocationSelectFromMap = (
    selectedLat: number,
    selectedLng: number,
    formattedString: string,
    selectedBoundary: { lat: number; lng: number }[],
    calculatedHa: number,
    soilMetrics?: any
  ) => {
    setLat(selectedLat);
    setLng(selectedLng);
    setVertices(selectedBoundary);
    setArea(calculatedHa);

    // Fetch the AI-detected crop for the newly selected coordinates
    fetchDetectedCrop(selectedLat, selectedLng);

    if (soilMetrics) {
      if (soilMetrics.soilMoisture !== undefined) setSoilMoisture(soilMetrics.soilMoisture);
      if (soilMetrics.soilPH !== undefined) setSoilPH(soilMetrics.soilPH);
      if (soilMetrics.nitrogen !== undefined) setNitrogen(soilMetrics.nitrogen);
      if (soilMetrics.ndviValue !== undefined) setNdviValue(soilMetrics.ndviValue);
      if (soilMetrics.ndwiValue !== undefined) setNdwiValue(soilMetrics.ndwiValue);
      
      if (soilMetrics.soilType) {
        const found = SOIL_PRESETS.find(s => s.toLowerCase().includes(soilMetrics.soilType.toLowerCase()));
        if (found) {
          setSoilType(found);
        }
      }
    }
  };

  // Generate standard agricultural layouts on centroid location
  const applyPresetGeometry = (type: "square" | "circle" | "irregular" | "triangle") => {
    const rx = lat || 40.5283;
    const ry = lng || 22.1283;
    let nextVertices: Coordinate[] = [];

    if (type === "square") {
      nextVertices = [
        { lat: Number((rx - 0.0012).toFixed(6)), lng: Number((ry - 0.0016).toFixed(6)) },
        { lat: Number((rx + 0.0012).toFixed(6)), lng: Number((ry - 0.0016).toFixed(6)) },
        { lat: Number((rx + 0.0012).toFixed(6)), lng: Number((ry + 0.0016).toFixed(6)) },
        { lat: Number((rx - 0.0012).toFixed(6)), lng: Number((ry + 0.0016).toFixed(6)) }
      ];
    } else if (type === "circle") {
      // 8 points forming an octagon approximating a circular pivot crop field shape
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radiusLat = 0.0014;
        const radiusLng = 0.0019;
        nextVertices.push({
          lat: Number((rx + Math.sin(angle) * radiusLat).toFixed(6)),
          lng: Number((ry + Math.cos(angle) * radiusLng).toFixed(6))
        });
      }
    } else if (type === "irregular") {
      // High detail trapezoidal segment with a projecting shoulder
      nextVertices = [
        { lat: Number((rx - 0.0014).toFixed(6)), lng: Number((ry - 0.0018).toFixed(6)) },
        { lat: Number((rx + 0.0008).toFixed(6)), lng: Number((ry - 0.0015).toFixed(6)) },
        { lat: Number((rx + 0.0016).toFixed(6)), lng: Number((ry + 0.0012).toFixed(6)) },
        { lat: Number((rx + 0.0006).toFixed(6)), lng: Number((ry + 0.0018).toFixed(6)) },
        { lat: Number((rx - 0.0011).toFixed(6)), lng: Number((ry + 0.0011).toFixed(6)) }
      ];
    } else {
      // Triangle field
      nextVertices = [
        { lat: Number((rx - 0.0015).toFixed(6)), lng: Number((ry - 0.0015).toFixed(6)) },
        { lat: Number((rx + 0.0015).toFixed(6)), lng: Number((ry).toFixed(6)) },
        { lat: Number((rx - 0.0015).toFixed(6)), lng: Number((ry + 0.0015).toFixed(6)) }
      ];
    }

    setVertices(nextVertices);
    
    // Auto sync centroid and load properties
    const calculatedHa = calculatePolygonAreaHa(nextVertices);
    setArea(calculatedHa);
    fetchDetectedCrop(rx, ry);
  };

  // Keep handleRandomizeNodes as square preset wrapper for compatibility
  const handleRandomizeNodes = () => {
    applyPresetGeometry("square");
  };

  const handleVertexChange = (index: number, key: "lat" | "lng", val: number) => {
    const updated = [...vertices];
    updated[index][key] = val;
    setVertices(updated);
  };

  const handleAddManualNode = () => {
    setVertices([...vertices, { lat: lat + 0.0005, lng: lng + 0.0005 }]);
  };

  const handleRemoveManualNode = (idx: number) => {
    setVertices(vertices.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
      lat,
      lng,
      latitude: lat,
      longitude: lng,
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
      marketPricePerTon: cropType === "Soybeans" ? 340 : cropType === "Winter Wheat" ? 190 : 220,
      
      // SoilGrids telemetry persistence
      soilGridsClay,
      soilGridsSand,
      soilGridsSilt,
      soilGridsSoc,
      soilGridsNitrogenValue,
      isRealSoilGridsUsed
    });
  };

  return (
    <div className="space-y-6" id="parcel-form-page-container">
      
      {/* Top Banner navigation */}
      <div className="flex items-center justify-between border-b border-gray-150 pb-5">
        <div className="space-y-1 text-left">
          <button
            onClick={onNavigateBack}
            className="group flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-green transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 translate-x-0 group-hover:-translate-x-0.5 transition-transform" />
            <span>Discard Drawing Boundary</span>
          </button>
          <h1 className="text-3xl font-display font-black tracking-tight text-gray-950 mt-1">
            {activeStep === "drawing" ? "Draw Field Boundaries" : "Configure Crop Metadata"}
          </h1>
        </div>

        {/* Form stepper buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveStep("drawing")}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeStep === "drawing" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            1. Draw Map Boundary
          </button>
          <button
            type="button"
            onClick={() => setActiveStep("details")}
            disabled={vertices.length < 3}
            className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer disabled:opacity-50 ${
              activeStep === "details" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
            title={vertices.length < 3 ? "Draw at least 3 corners on the map first" : "Go to details"}
          >
            2. Crop & Soil Details
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {activeStep === "details" ? (
          /* SECTION A: CROP SPECIFICATIONS FORM (7/12 layout) */
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green font-mono">Boundary Metadata</span>
                <h3 className="text-base font-display font-black text-gray-950">Field Soil & Seed Specifications</h3>
              </div>

              <div className="space-y-4">
                
                {/* Field Identifier Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Field Parcel Identifier (Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. East Meadow Wheat"
                    className="w-full bg-gray-55 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                  />
                </div>

                 {/* Crop & Soil Presets Double-column */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Crop Selection */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                        Active Seed Crop Type
                      </label>
                      <button
                        type="button"
                        onClick={syncCropsFromAPI}
                        disabled={isSyncingCrops}
                        className="text-[9px] text-indigo-600 hover:text-indigo-800 disabled:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-100 px-2 py-1 rounded-lg transition"
                      >
                        {isSyncingCrops ? "Syncing..." : "🔄 Pull Agronomy API"}
                      </button>
                    </div>
                    {syncStatus && (
                      <span className="text-[9.5px] block font-mono text-indigo-600 animate-pulse">
                        {syncStatus}
                      </span>
                    )}
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full bg-gray-55 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-green"
                    >
                      {(dbCrops.length > 0 ? dbCrops.map((c) => c.name) : CROP_PRESETS).map((crop) => (
                        <option key={crop} value={crop}>{crop}</option>
                      ))}
                    </select>
                  </div>

                  {/* Soil Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Underlying Soil Category
                    </label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-gray-55 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-green"
                    >
                      {SOIL_PRESETS.map((soil) => (
                        <option key={soil} value={soil}>{soil}</option>
                      ))}
                    </select>
                  </div>

                </div>

                {/* AI Crop Detection Details Overlay */}
                {(isDetectingCrop || detectedCropInfo || cropDetectionError) && (
                  <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2 animate-fadeIn text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-950 uppercase tracking-wider font-display">AI Crop detection status</span>
                      </div>
                      {isDetectingCrop ? (
                        <span className="text-emerald-600 text-[9px] font-bold font-mono animate-pulse">Running GIS analysis...</span>
                      ) : detectedCropInfo ? (
                        <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full font-mono">
                          {Math.round(detectedCropInfo.confidence * 100)}% Match
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[9px] font-bold font-mono">Manually configured</span>
                      )}
                    </div>

                    {isDetectingCrop ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-500 animate-spin shrink-0" />
                        <span className="text-[11px] text-gray-500 font-sans">Identifying regional crop varieties via GPS index...</span>
                      </div>
                    ) : detectedCropInfo ? (
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-700 leading-relaxed font-sans">
                          Our Gemini geocoding model suggests growing <strong className="text-emerald-700 font-bold">{detectedCropInfo.crop}</strong> based on location-specific soil networks.
                        </p>
                        <p className="text-[10px] text-slate-450 font-sans leading-normal bg-white/60 border border-slate-100 rounded-lg p-2 mt-1">
                          {detectedCropInfo.explanation}
                        </p>
                      </div>
                    ) : cropDetectionError ? (
                      <p className="text-[11px] text-zinc-550 font-sans">
                        Choose your crop variety in the dropdown above. Auto-detection is ready for your next map selection.
                      </p>
                    ) : null}
                  </div>
                )}

                {/* Surface area input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Estimated Acreage (Surface Area)</span>
                    <span className="text-brand-green font-mono">{area} Hectares</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="150"
                    step="0.5"
                    value={area}
                    onChange={(e) => setArea(parseFloat(e.target.value))}
                    className="w-full accent-brand-green"
                  />
                  <span className="text-[10px] text-gray-400 font-sans block">Hectares measure drawn polygon bounds.</span>
                </div>

                {/* Soil moisture range slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Initial Soil Moisture saturation</span>
                    <span className="text-blue-500 font-mono flex items-center gap-0.5">
                      <Droplet className="w-3.5 h-3.5" />
                      {soilMoisture}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="1"
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

              </div>

              <div className="flex justify-between items-center pt-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveStep("drawing")}
                  className="text-slate-500 hover:text-slate-800 text-xs font-display font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Map Drawing</span>
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-display font-black px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Establish Spatial Parcel</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* SECTION B: DRAWING BOUNDARIES GPS COORDINATES SHIFT (12/12 layout for premium map width) */
          <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Map and triggers */}
            <div className="lg:col-span-8 space-y-6">
            
            {/* Interactive Drawing Map Picker */}
            <FieldMapPicker
              initialLat={lat}
              initialLng={lng}
              initialBoundary={vertices}
              onLocationSelect={handleLocationSelectFromMap}
              fieldName={name}
              cropType={cropType}
            />

            {/* Real-time Crop Identification Alert on Map */}
            {(isDetectingCrop || detectedCropInfo || cropDetectionError) && (
              <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-left animate-fadeIn">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isDetectingCrop ? 'bg-emerald-50 text-emerald-600 animate-pulse' : 'bg-emerald-500/10 text-emerald-700'}`}>
                    {isDetectingCrop ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 font-display">
                      <span>MyCrop AI Remote Crop Sensor</span>
                      {isDetectingCrop ? (
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-sans font-medium">Scanning coordinate indices...</span>
                      ) : detectedCropInfo ? (
                        <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-bold">{Math.round(detectedCropInfo.confidence * 100)}% Match</span>
                      ) : null}
                    </h4>
                    {isDetectingCrop ? (
                      <p className="text-[11px] text-gray-400 mt-0.5 font-sans">
                        Querying agricultural databases and local satellite spectral signals for GPS coordinates {lat.toFixed(4)}°, {lng.toFixed(4)}°...
                      </p>
                    ) : detectedCropInfo ? (
                      <p className="text-[11px] text-gray-650 mt-0.5 font-sans leading-relaxed">
                        Detected variety is likely <strong className="text-emerald-700 font-bold">{detectedCropInfo.crop}</strong>. {detectedCropInfo.explanation}
                      </p>
                    ) : cropDetectionError ? (
                      <p className="text-[11px] text-slate-450 mt-0.5 font-sans">
                        Location indices ready. Click "Crop & Soil Details" to declare your field variety manually.
                      </p>
                    ) : null}
                  </div>
                </div>
                {detectedCropInfo && !isDetectingCrop && (
                  <div className="bg-brand-green/10 border border-brand-green/20 rounded-2xl px-4 py-2 font-display text-xs text-brand-green font-bold flex items-center gap-1.5 shrink-0 self-start md:self-auto">
                    <span>Auto-selected: {detectedCropInfo.crop}</span>
                    <Check className="w-4 h-4 text-brand-green" />
                  </div>
                )}
              </div>
            )}

             {/* Submission & Actions Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-150 rounded-3xl p-5 shadow-xs">
              <button
                type="button"
                onClick={onNavigateBack}
                className="text-slate-500 hover:text-slate-800 text-xs font-display font-black transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel & Discard</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowBackup(!showBackup)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-brand-green" />
                  <span>Manual GPS Backups</span>
                  {showBackup ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep("details")}
                  disabled={vertices.length < 3}
                  className="bg-brand-green hover:bg-brand-green-hover text-white text-xs font-display font-black px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title={vertices.length < 3 ? "Select at least 3 nodes on the map" : "Configure field soil and crop details"}
                >
                  <span>Crop & Soil Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Back-up manual coordinate overrides (Collapsible section) */}
            {showBackup && (
              <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 shadow-inner space-y-5 animate-slideDown">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 text-left">
                  <div>
                    <h3 className="text-sm font-display font-black text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-brand-green" />
                      <span>Manual GPS Coordinate Backups</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium font-sans">
                      Fallback grid to review latitude and longitude vertices. Changes reflect directly onto the visual map.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualNode}
                      className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-brand-green" />
                      <span>Add Vertex Node</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRandomizeNodes}
                      className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-brand-green" />
                      <span>Mock Auto-Projection</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Pasture Center Latitude (Centroid)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lat}
                      onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Pasture Center Longitude (Centroid)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={lng}
                      onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-brand-green"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 text-left font-sans">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Vertices Coordinates Grid mapping</span>
                  
                  {vertices.length === 0 ? (
                    <div className="text-center bg-white p-6 rounded-2xl border border-slate-150 text-slate-450 text-[11px] font-medium">
                      No vertices specified. Use the map drawing tool or click 'Add Vertex' above.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {vertices.map((node, idx) => (
                        <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-3.5 space-y-2 relative shadow-xs">
                          <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-bold font-mono px-2 py-0.5 rounded-full uppercase absolute -top-1.5 left-3">
                            Vertex {idx + 1}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveManualNode(idx)}
                            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                            title="Delete Node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                            <div className="space-y-0.5 whitespace-nowrap">
                              <span className="text-[8px] text-gray-400 uppercase font-bold text-center block">Lat</span>
                              <input
                                type="number"
                                step="0.00001"
                                value={node.lat}
                                onChange={(e) => handleVertexChange(idx, "lat", parseFloat(e.target.value) || 0)}
                                className="bg-slate-50 border border-gray-150 rounded-lg p-1 text-center w-full text-[11px] font-mono focus:bg-white focus:outline-none"
                              />
                            </div>
                            <div className="space-y-0.5 whitespace-nowrap">
                              <span className="text-[8px] text-gray-400 uppercase font-bold text-center block">Lng</span>
                              <input
                                type="number"
                                step="0.00001"
                                value={node.lng}
                                onChange={(e) => handleVertexChange(idx, "lng", parseFloat(e.target.value) || 0)}
                                className="bg-slate-50 border border-gray-150 rounded-lg p-1 text-center w-full text-[11px] font-mono focus:bg-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            </div>

            {/* SECTION B, PART 2: INTERACTIVE SPATIAL COACH & PRESETS SIDEBAR */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-green font-mono block">Drawing Assist HUD</span>
                  <h3 className="text-lg font-display font-black text-gray-950 mt-1 uppercase tracking-tight">Interactive Coach</h3>
                  <p className="text-[11px] text-gray-500 mt-1 font-sans leading-relaxed">
                    Map out your exact field dimensions. Click points on the map satellite imagery to build a boundary, or choose one of our template pasture contours below.
                  </p>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Boundary State Indicator Card */}
                <div className={`p-4 rounded-2xl border transition-all text-left space-y-2 ${
                  vertices.length === 0 
                  ? "bg-slate-50/50 border-slate-200" 
                  : vertices.length < 3 
                  ? "bg-sky-50/40 border-sky-200" 
                  : "bg-emerald-500/[0.03] border-emerald-200"
                }`}>
                  <div className="flex items-center gap-2">
                    {vertices.length === 0 ? (
                      <>
                        <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-gray-800 uppercase tracking-tight font-display">No Boundary Defined</span>
                      </>
                    ) : vertices.length < 3 ? (
                      <>
                        <div className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-bounce" />
                        <span className="text-xs font-black text-sky-800 uppercase tracking-tight font-display">Enclosing Shape ({vertices.length}/3+)</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                        <span className="text-xs font-black text-emerald-800 uppercase tracking-tight font-display font-mono">Polygon Locked ({vertices.length} Vertices)</span>
                      </>
                    )}
                  </div>
                  
                  {vertices.length === 0 ? (
                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                      Click at least 3 points on the satellite map to draw your crop field parcel.
                    </p>
                  ) : vertices.length < 3 ? (
                    <p className="text-[11px] text-sky-600 font-sans leading-relaxed">
                      Place at least <strong>{3 - vertices.length} more</strong> point(s) to automatically close the crop polygon loop.
                    </p>
                  ) : (
                    <div className="space-y-1.5 pt-1 text-left font-sans text-[11px]">
                      <div className="flex justify-between items-center bg-emerald-500/5 p-1 px-2 rounded-lg border border-emerald-500/10 mb-1">
                        <span className="text-gray-500 font-medium">Calculated Area:</span>
                        <strong className="text-emerald-700 font-mono font-black text-xs">{area} Hectares</strong>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-gray-400">Centroid Lat:</span>
                        <strong className="text-gray-650 font-mono">{lat.toFixed(5)}°N</strong>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <span className="text-gray-400">Centroid Lng:</span>
                        <strong className="text-gray-650 font-mono">{lng.toFixed(5)}°W</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* QUICK PRESETS INTERACTIVE BUTTONS CARD */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-mono">Instant Farm Presets</span>
                    <span className="text-[9px] bg-brand-green/10 text-brand-green font-black px-2 py-0.5 rounded-md font-mono uppercase">1-Click Map</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                    Skip manual boundary tracing! Instantly generate pre-computed agricultural farm models exactly around your camera center:
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => applyPresetGeometry("square")}
                      className="p-3 border border-gray-150 rounded-2xl text-left bg-slate-50/50 hover:bg-slate-50 hover:border-brand-green/30 transition-all cursor-pointer group"
                    >
                      <span className="text-[15px] group-hover:scale-110 transition-transform inline-block mb-1">⏹️</span>
                      <h4 className="text-[10pt] font-black text-gray-800 leading-tight">Midwest Block</h4>
                      <p className="text-[9px] text-gray-400 font-semibold tracking-tight">40 Ha Square</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPresetGeometry("circle")}
                      className="p-3 border border-gray-150 rounded-2xl text-left bg-slate-50/50 hover:bg-slate-50 hover:border-brand-green/30 transition-all cursor-pointer group"
                    >
                      <span className="text-[15px] group-hover:scale-110 transition-transform inline-block mb-1">🟢</span>
                      <h4 className="text-[10pt] font-black text-gray-800 leading-tight">Center Pivot</h4>
                      <p className="text-[9px] text-gray-400 font-semibold tracking-tight">48 Ha Circular</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPresetGeometry("irregular")}
                      className="p-3 border border-gray-150 rounded-2xl text-left bg-slate-50/50 hover:bg-slate-50 hover:border-brand-green/30 transition-all cursor-pointer group"
                    >
                      <span className="text-[15px] group-hover:scale-110 transition-transform inline-block mb-1">📐</span>
                      <h4 className="text-[10pt] font-black text-gray-800 leading-tight">Valley Slope</h4>
                      <p className="text-[9px] text-gray-400 font-semibold tracking-tight">35 Ha Pasture</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPresetGeometry("triangle")}
                      className="p-3 border border-gray-150 rounded-2xl text-left bg-slate-50/50 hover:bg-slate-50 hover:border-brand-green/30 transition-all cursor-pointer group"
                    >
                      <span className="text-[15px] group-hover:scale-110 transition-transform inline-block mb-1">🔺</span>
                      <h4 className="text-[10pt] font-black text-gray-800 leading-tight">Delta Corner</h4>
                      <p className="text-[9px] text-gray-400 font-semibold tracking-tight">25 Ha Triangle</p>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Live Data Note */}
                <div className="p-4 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-2xl text-left space-y-1.5 font-sans">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 font-mono flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    How micro-soil telemetry works
                  </span>
                  <p className="text-[10.5px] text-slate-550 leading-relaxed font-sans">
                    Once customized, placing coordinates here queries real-time <strong>ISRIC SoilGrids™ 250m GIS models</strong>, fetching actual localized clay, ph, and carbon fractions specific to your real field, not wide generic state averages.
                  </p>
                </div>

                {/* Primary Guided Stepper Navigation button */}
                <button
                  type="button"
                  onClick={() => setActiveStep("details")}
                  disabled={vertices.length < 3}
                  className="w-full bg-brand-green hover:bg-brand-green-hover text-white text-xs font-display font-black py-3 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  <span>Go to Seed & Crop Setup</span>
                  <ChevronRight className="w-4 h-4 text-white animate-pulse" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Real-time SoilGrids Global API Analytics & GIS Insights Block (5/12 layout) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5" id="soilgrids-telemetry-block">
          
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <div className="p-2.5 bg-emerald-500/10 text-brand-green rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-emerald-600 block leading-none">Global Database</span>
                <h4 className="text-sm font-display font-black text-gray-950 mt-1 uppercase tracking-tight">SoilGrids™ Telemetry</h4>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => fetchSoilGrids(lat, lng)}
              disabled={isLoadingSoilGrids}
              title="Re-query SoilGrids records"
              className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSoilGrids ? "animate-spin text-emerald-500" : ""}`} />
            </button>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Centroid status banner */}
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 text-left space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Centroid Coordinate</span>
              {isLoadingSoilGrids ? (
                <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold font-mono animate-pulse uppercase">
                  📡 Fetching...
                </span>
              ) : isRealSoilGridsUsed ? (
                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold font-mono uppercase flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  ISRIC Live
                </span>
              ) : (
                <span className="text-[9px] bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                  Service Error
                </span>
              )}
            </div>
            <p className="text-xs font-mono font-bold text-slate-800 tracking-tight">
              {lat.toFixed(6)}°N, {lng.toFixed(6)}°W
            </p>
          </div>

          {/* Loader, Error, or Main parameters container */}
          {isLoadingSoilGrids ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3.5">
              <div className="w-10 h-10 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-800">Rastering Soil Profiles...</p>
                <p className="text-[9px] text-slate-400 font-sans max-w-[220px]">
                  Retrieving 250m grid data models clay, sand, silt and pH matrices from ISRIC API servers.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* If API error occurred */}
              {soilGridsError && (
                <div className="bg-rose-50 border border-rose-150 rounded-2xl p-4 flex gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-rose-800">Satellite API Offline/Limit</p>
                    <p className="text-[10px] text-rose-600 leading-relaxed font-sans">
                      Coordinate falls outside mapping datasets or search rate exceeded. Regional baseline estimations loaded for field layout planning.
                    </p>
                  </div>
                </div>
              )}

              {/* Composition Telemetry Parameters Grid */}
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Geological Soil Texture Map</span>
                
                {/* 1. Clay Fraction */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-750 font-display">Clay Sand Fraction</span>
                    <span className="font-mono font-bold text-slate-900">{soilGridsClay !== undefined ? `${soilGridsClay}%` : "32.0% (Estimated)"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-400 rounded-full transition-all duration-500" 
                      style={{ width: `${soilGridsClay !== undefined ? soilGridsClay : 32}%` }}
                    />
                  </div>
                </div>

                {/* 2. Sand Fraction */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-750 font-display">Sandy Quartz Fraction</span>
                    <span className="font-mono font-bold text-slate-900">{soilGridsSand !== undefined ? `${soilGridsSand}%` : "38.0% (Estimated)"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-300 rounded-full transition-all duration-500" 
                      style={{ width: `${soilGridsSand !== undefined ? soilGridsSand : 38}%` }}
                    />
                  </div>
                </div>

                {/* 3. Silt Fraction */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-slate-750 font-display">Alluvial Silt Fraction</span>
                    <span className="font-mono font-bold text-slate-900">{soilGridsSilt !== undefined ? `${soilGridsSilt}%` : "30.0% (Estimated)"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500" 
                      style={{ width: `${soilGridsSilt !== undefined ? soilGridsSilt : 30}%` }}
                    />
                  </div>
                </div>

                {/* Hydrochemical Metrics Box */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-left space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Soil pH (0-15cm)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900">{soilPH !== undefined ? soilPH : 6.4}</span>
                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tight font-bold">
                        {(soilPH || 6.4) < 6.0 ? "Acid" : (soilPH || 6.4) > 7.3 ? "Alkali" : "Neutral"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3 text-left space-y-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Carbon stock (SOC)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900">
                        {soilGridsSoc !== undefined ? `${soilGridsSoc} dg/kg` : "18.4% (Estimated)"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Explanation of parameters */}
              <div className="p-3.5 bg-brand-green/[0.03] border border-brand-green/10 rounded-2xl text-left space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-green font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  GIS Application Guidance
                </span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  The soil parameters will automatically adjust pasture selections and pH constraints, allowing precise calculation of seed depths, expected yield tonnage, and nitrogen fertilization volumes.
                </p>
              </div>

            </div>
          )}

          <div className="h-px bg-gray-100" />

          {/* Active seed & parcel description */}
          <div className="text-[10px] text-gray-400 font-mono space-y-1 text-left">
            <p>IDENTIFIER: {name || "None Specified"}</p>
            <p>CROP PRESET: {cropType}</p>
            <p>SOIL CLASSIFICATION: {soilType}</p>
          </div>

        </div>

      </form>

    </div>
  );
}
