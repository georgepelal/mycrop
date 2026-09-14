import { EarthIslandVisualizer } from "../components/EarthIslandVisualizer";
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";

import { getCachedTempData, setCachedTempData } from "../utils/tempCache";
import { 
  Thermometer, 
  Layers, 
  Flame, 
  Snowflake, 
  Droplets, 
  Sprout, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Info, 
  ArrowLeft,
  Loader2,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity
} from "lucide-react";
import { Parcel } from "../types";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid,
  Legend,
  ReferenceLine
} from "recharts";

interface DeepSoilTemperatureProps {
  parcels?: Parcel[];
  activeParcelId?: string | null;
  onSelectParcel?: (id: string) => void;
  onNavigate: (page: string) => void;
}

interface CropThreshold {
  name: string;
  minGermination: number; // °C
  optMin: number; // °C
  optMax: number; // °C
}

const CROP_THRESHOLDS: CropThreshold[] = [
  { name: "Corn", minGermination: 10, optMin: 15, optMax: 30 },
  { name: "Wheat", minGermination: 4, optMin: 12, optMax: 25 },
  { name: "Cotton", minGermination: 15, optMin: 18, optMax: 32 },
  { name: "Soybeans", minGermination: 10, optMin: 15, optMax: 30 },
  { name: "Barley", minGermination: 3, optMin: 10, optMax: 22 },
  { name: "Potatoes", minGermination: 7, optMin: 12, optMax: 20 },
  { name: "Grapes", minGermination: 10, optMin: 15, optMax: 28 },
  { name: "Tomatoes", minGermination: 12, optMin: 18, optMax: 28 },
];

export default function DeepSoilTemperature({ 
  parcels = [], 
  activeParcelId, 
  onSelectParcel, 
  onNavigate 
}: DeepSoilTemperatureProps) {
  const { t } = useTranslation();
  const { tempUnit, convertTemp } = useSettings();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Coordinates and Location states
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("Corn");

  // Forecast Hourly Soil Data state
  const [soilData, setSoilData] = useState<{
    times: string[];
    temp_0_7: number[];
    temp_7_28: number[];
    temp_28_100: number[];
    temp_100_255: number[];
    moist_0_7: number[];
    moist_7_28: number[];
    moist_28_100: number[];
    moist_100_255: number[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"profile" | "forecast" | "crop">("profile");

  // Chart visibility state
  const [visibleDepths, setVisibleDepths] = useState({
    shallow: true,
    medium: true,
    deep: true,
    bedrock: true,
  });

  const activeParcel = parcels.find(p => p.id === activeParcelId) || parcels[0];

  // Set default coordinates on mount or when active parcel changes
  useEffect(() => {
    if (activeParcel) {
      const lat = activeParcel.lat ?? activeParcel.latitude;
      const lng = activeParcel.lng ?? activeParcel.longitude;
      if (lat !== undefined && lng !== undefined) {
        setCoords({ lat, lng });
        setLocationName(activeParcel.name || `Parcel (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        if (activeParcel.cropType) {
          // Attempt to match crop threshold
          const match = CROP_THRESHOLDS.find(
            c => c.name.toLowerCase() === activeParcel.cropType.toLowerCase()
          );
          if (match) {
            setSelectedCrop(match.name);
          }
        }
      }
    } else {
      // Standard fallback (e.g., London or mid-western farm coordinates)
      setCoords({ lat: 41.8781, lng: -87.6298 }); // Chicago / Midwest US Corn Belt
      setLocationName("Midwest Farm Belt, US");
    }
  }, [activeParcelId, parcels]);

  // Fetch Soil Temperature & Moisture hourly forecast from Open-Meteo
  useEffect(() => {
    if (!coords) return;

    let active = true;
    
    const fetchLat = parseFloat(coords.lat.toFixed(2));
    const fetchLng = parseFloat(coords.lng.toFixed(2));
    
    const cached = getCachedTempData(fetchLat, fetchLng);
    if (cached) {
      setSoilData(cached);
      return;
    }
    
    setLoading(true);
    setError(null);

    const fetchSoilParameters = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${fetchLat}&longitude=${fetchLng}&hourly=soil_temperature_0_to_7cm,soil_temperature_7_to_28cm,soil_temperature_28_to_100cm,soil_temperature_100_to_255cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_moisture_28_to_100cm,soil_moisture_100_to_255cm`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error("Failed to fetch sub-surface data from Open-Meteo.");
        }

        const json = await res.json();
        if (!json.hourly || !json.hourly.time || json.hourly.time.length === 0) {
          throw new Error("Open-Meteo telemetry response contained empty sub-surface matrices.");
        }

        const hasData = json.hourly.soil_temperature_0_to_7cm?.some((v: any) => v !== null);
        if (!hasData) {
          throw new Error("No sub-surface soil data available for this location (e.g. urbanized area or outside coverage).");
        }

        if (active) {
          const parsedData = {
            times: json.hourly.time ?? [],
            temp_0_7: json.hourly.soil_temperature_0_to_7cm ?? [],
            temp_7_28: json.hourly.soil_temperature_7_to_28cm ?? [],
            temp_28_100: json.hourly.soil_temperature_28_to_100cm ?? [],
            temp_100_255: json.hourly.soil_temperature_100_to_255cm ?? [],
            moist_0_7: json.hourly.soil_moisture_0_to_7cm ?? [],
            moist_7_28: json.hourly.soil_moisture_7_to_28cm ?? [],
            moist_28_100: json.hourly.soil_moisture_28_to_100cm ?? [],
            moist_100_255: json.hourly.soil_moisture_100_to_255cm ?? [],
          };
          setSoilData(parsedData);
          setCachedTempData(fetchLat, fetchLng, parsedData);
        }
      } catch (err: any) {
        if (active) {
          setSoilData(null);
          setError(err.message || "An unknown telemetry error occurred.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSoilParameters();

    return () => {
      active = false;
    };
  }, [coords]);

  // Get current hour index
  const getCurrentHourIndex = () => {
    if (!soilData || soilData.times.length === 0) return 0;
    const nowStr = new Date().toISOString().substring(0, 13) + ":00";
    const idx = soilData.times.findIndex(t => t.startsWith(nowStr.substring(0, 13)));
    return idx >= 0 ? idx : 0;
  };

  const currIdx = getCurrentHourIndex();

  // Extract current values
  const currentTempShallow = soilData?.temp_0_7[currIdx] ?? 0;
  const currentTempMid = soilData?.temp_7_28[currIdx] ?? 0;
  const currentTempDeep = soilData?.temp_28_100[currIdx] ?? 0;
  const currentTempBedrock = soilData?.temp_100_255[currIdx] ?? 0;

  const currentMoistShallow = (soilData?.moist_0_7[currIdx] ?? 0) * 100;
  const currentMoistMid = (soilData?.moist_7_28[currIdx] ?? 0) * 100;
  const currentMoistDeep = (soilData?.moist_28_100[currIdx] ?? 0) * 100;
  const currentMoistBedrock = (soilData?.moist_100_255[currIdx] ?? 0) * 100;

  // Render a visual temperature background color
  const getTempColorClass = (temp: number) => {
    if (temp <= 0) return "from-blue-600/20 to-blue-500/10 border-blue-400";
    if (temp < 8) return "from-sky-500/20 to-sky-400/10 border-sky-300";
    if (temp < 15) return "from-emerald-500/10 to-teal-400/5 border-emerald-300";
    if (temp < 25) return "from-amber-500/20 to-orange-400/10 border-amber-300";
    return "from-red-500/20 to-orange-500/10 border-red-400";
  };

  const getTempTextClass = (temp: number) => {
    if (temp <= 0) return "text-blue-600 dark:text-blue-400";
    if (temp < 8) return "text-sky-600 dark:text-sky-400";
    if (temp < 15) return "text-teal-600 dark:text-teal-400";
    if (temp < 25) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  // Build chart-friendly data for the 7-day view (every 3 hours to avoid clutter)
  const chartData = soilData?.times
    .map((time, idx) => {
      if (idx % 3 !== 0) return null; // Resample every 3 hours
      return {
        timestamp: new Date(time).toLocaleDateString(undefined, { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit'
        }),
        "0-7cm (Topsoil)": convertTemp(soilData.temp_0_7[idx]),
        "7-28cm (Shallow Root)": convertTemp(soilData.temp_7_28[idx]),
        "28-100cm (Deep Root)": convertTemp(soilData.temp_28_100[idx]),
        "100-255cm (Substratum)": convertTemp(soilData.temp_100_255[idx]),
      };
    })
    .filter(Boolean) || [];

  // Active Crop Threshold details
  const activeCropThreshold = CROP_THRESHOLDS.find(c => c.name === selectedCrop) || CROP_THRESHOLDS[0];

  // Plant suitability status calculator
  const checkSuitability = () => {
    const sTemp = currentTempShallow;
    const mTemp = currentTempMid;
    const averageSeedZone = (sTemp + mTemp) / 2;

    if (averageSeedZone < activeCropThreshold.minGermination) {
      return {
        status: "Critical - Too Cold",
        color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
        icon: Snowflake,
        msg: `The sub-surface seeding zone temperature (${averageSeedZone.toFixed(1)}°C) is below the minimum required germination point of ${activeCropThreshold.minGermination}°C. Seeds will lie dormant or rot.`
      };
    }
    if (averageSeedZone >= activeCropThreshold.optMin && averageSeedZone <= activeCropThreshold.optMax) {
      return {
        status: "Optimal Growth Range",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
        icon: Sprout,
        msg: `Perfect soil conditions. The temperature (${averageSeedZone.toFixed(1)}°C) is directly inside the optimal range of ${activeCropThreshold.optMin}–${activeCropThreshold.optMax}°C for robust cellular development.`
      };
    }
    if (averageSeedZone > activeCropThreshold.optMax) {
      return {
        status: "Thermal Stress Alert",
        color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50",
        icon: Flame,
        msg: `Thermal stress alert! Soil warmth exceeds ${activeCropThreshold.optMax}°C. Fast evaporation rate could dehydrate delicate root hairs.`
      };
    }
    return {
      status: "Suboptimal but Tolerable",
      color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
      icon: Info,
      msg: `Marginal safety. Seeding zone temperature is acceptable for minimal sprouting activity, but germination rates may be slow or staggered until warmth increases above ${activeCropThreshold.optMin}°C.`
    };
  };

  const suitability = checkSuitability();

  // Microbial activity calculator
  const getMicrobeActivityRating = () => {
    const avgRootZone = (currentTempMid + currentTempDeep) / 2;
    if (avgRootZone <= 4) return { rating: "Inactive (Dormant)", pct: 5, color: "bg-blue-500" };
    if (avgRootZone < 12) return { rating: "Suppressed Activity", pct: 30, color: "bg-sky-500" };
    if (avgRootZone < 22) return { rating: "Moderately Active", pct: 75, color: "bg-emerald-500" };
    if (avgRootZone < 32) return { rating: "Peak Biological Output", pct: 100, color: "bg-orange-500" };
    return { rating: "Thermally Impeded", pct: 45, color: "bg-rose-500" };
  };

  const microbe = getMicrobeActivityRating();

  const getRetroBlockColor = (temp: number) => {
    if (temp <= 0) {
      return "bg-[#1d4ed8] border-t-[#3b82f6] border-l-[#3b82f6] border-b-[#1e3a8a] border-r-[#1e3a8a]";
    } else if (temp < 8) {
      return "bg-[#0284c7] border-t-[#38bdf8] border-l-[#38bdf8] border-b-[#0369a1] border-r-[#0369a1]";
    } else if (temp < 15) {
      return "bg-[#0d9488] border-t-[#2dd4bf] border-l-[#2dd4bf] border-b-[#0f766e] border-r-[#0f766e]";
    } else if (temp < 25) {
      return "bg-[#ea580c] border-t-[#f97316] border-l-[#f97316] border-b-[#9a3412] border-r-[#9a3412]";
    } else {
      return "bg-[#dc2626] border-t-[#ef4444] border-l-[#ef4444] border-b-[#991b1b] border-r-[#991b1b]";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
              <Thermometer className="w-7 h-7 text-emerald-500 animate-pulse" />
              Deep Soil Temperature & Thermal Gradients
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Multi-depth sub-surface thermal propagation mapping and geothermal seeding safety metrics.
            </p>
          </div>
        </div>

      </div>

      {/* Parcel / Field selector bar */}
      {parcels.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Field:
          </span>
          {parcels.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectParcel && onSelectParcel(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                p.id === activeParcelId
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300"
              }`}
            >
              {p.name} <span className="opacity-70 font-normal">({p.cropType})</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Error Indicator */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3">
          <Info className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse">
            Loading thermal profile...
          </p>
        </div>
      ) : (
        soilData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT SIDE: Thermal Profiler column (4 Columns wide) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="mb-6 w-full">
                <EarthIslandVisualizer 
                  cropType={selectedCrop}
                  layers={[
                    { 
                      id: "0-7cm", 
                      height: 3, 
                      leftLabel: <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">0-7cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] gap-0.5 whitespace-nowrap">
                          <span className="text-amber-200">{convertTemp(currentTempShallow).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistShallow.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`0-7cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempShallow)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              0-7cm: {convertTemp(currentTempShallow).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { 
                      id: "7-28cm", 
                      height: 4, 
                      leftLabel: <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">7-28cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] gap-0.5 whitespace-nowrap">
                          <span className="text-amber-200">{convertTemp(currentTempMid).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistMid.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`7-28cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempMid)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              7-28cm: {convertTemp(currentTempMid).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { 
                      id: "28-100cm", 
                      height: 5, 
                      leftLabel: <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">28-100cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] gap-0.5 whitespace-nowrap">
                          <span className="text-amber-200">{convertTemp(currentTempDeep).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistDeep.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`28-100cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempDeep)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              28-100cm: {convertTemp(currentTempDeep).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { 
                      id: "100-255cm", 
                      height: 6, 
                      leftLabel: <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">100-255cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] gap-0.5 whitespace-nowrap">
                          <span className="text-amber-200">{convertTemp(currentTempBedrock).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistBedrock.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`100-255cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempBedrock)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              100-255cm: {convertTemp(currentTempBedrock).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    }
                  ]}
                  legend={
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/20 text-[9px] font-black uppercase tracking-wider text-white w-full">
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                        <div className="w-2.5 h-2.5 bg-[#1d4ed8] border border-white" /> Cold (≤0°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                        <div className="w-2.5 h-2.5 bg-[#0284c7] border border-white" /> Cool (&lt;8°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                        <div className="w-2.5 h-2.5 bg-[#0d9488] border border-white" /> Mild (&lt;15°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                        <div className="w-2.5 h-2.5 bg-[#ea580c] border border-white" /> Warm (&lt;25°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                        <div className="w-2.5 h-2.5 bg-[#dc2626] border border-white" /> Hot (≥25°C)
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Biological Microbial Activity block */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Soil Biological Activity
                  </h3>
                </div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Microbial Decomposition:</span>
                  <span className="text-emerald-500">{microbe.rating}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${microbe.color}`}
                    style={{ width: `${microbe.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Deep zone warmth of {((currentTempMid + currentTempDeep) / 2).toFixed(1)}°C modulates nitrifying bacteria activity. Warmer soil boosts nitrogen mineralization.
                </p>
              </div>

            </div>

            {/* RIGHT SIDE: Charts & Agronomic safety metrics (7 Columns wide) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Subnavigation Tabs */}
              <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "profile"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Thermal Profile Chart
                </button>
                <button
                  onClick={() => setActiveTab("crop")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === "crop"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  Seeding safety check
                </button>
              </div>

              {/* Tab 1: Thermal Profile Forecast Chart */}
              {activeTab === "profile" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        7-Day Sub-Surface Forecast
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Observing thermal lagging effects and amplitude reduction at depth.
                      </p>
                    </div>
                    
                    {/* Layer selection checklist */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setVisibleDepths(p => ({ ...p, shallow: !p.shallow }))}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold border transition-colors ${
                          visibleDepths.shallow 
                            ? "bg-amber-100 text-amber-800 border-amber-300" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        0-7cm
                      </button>
                      <button
                        onClick={() => setVisibleDepths(p => ({ ...p, medium: !p.medium }))}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold border transition-colors ${
                          visibleDepths.medium 
                            ? "bg-orange-100 text-orange-800 border-orange-300" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        7-28cm
                      </button>
                      <button
                        onClick={() => setVisibleDepths(p => ({ ...p, deep: !p.deep }))}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold border transition-colors ${
                          visibleDepths.deep 
                            ? "bg-rose-100 text-rose-800 border-rose-300" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        28-100cm
                      </button>
                      <button
                        onClick={() => setVisibleDepths(p => ({ ...p, bedrock: !p.bedrock }))}
                        className={`px-2.5 py-1 rounded text-[9px] font-bold border transition-colors ${
                          visibleDepths.bedrock 
                            ? "bg-purple-100 text-purple-800 border-purple-300" 
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        100-255cm
                      </button>
                    </div>
                  </div>

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorShallow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#e2c044" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#e2c044" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f48c06" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#f48c06" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorDeep" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2f02" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#dc2f02" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBedrock" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7209b7" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#7209b7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                        <XAxis 
                          dataKey="timestamp" 
                          tick={{ fontSize: 9 }}
                          stroke="#94a3b8"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                          label={{ value: `Temp (°${tempUnit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#64748b' } }}
                        />
                        <ReferenceLine y={tempUnit === "C" ? 0 : 32} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'insideTopLeft', value: `Freezing point (${tempUnit === "C" ? "0°C" : "32°F"})`, fill: '#3b82f6', fontSize: 9, opacity: 0.8 }} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            color: '#fff', 
                            borderRadius: '12px',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {visibleDepths.shallow && (
                          <Area 
                            type="monotone" 
                            dataKey="0-7cm (Topsoil)" 
                            stroke="#e2c044" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorShallow)" 
                          />
                        )}
                        {visibleDepths.medium && (
                          <Area 
                            type="monotone" 
                            dataKey="7-28cm (Shallow Root)" 
                            stroke="#f48c06" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#colorMedium)" 
                          />
                        )}
                        {visibleDepths.deep && (
                          <Area 
                            type="monotone" 
                            dataKey="28-100cm (Deep Root)" 
                            stroke="#dc2f02" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorDeep)" 
                          />
                        )}
                        {visibleDepths.bedrock && (
                          <Area 
                            type="monotone" 
                            dataKey="100-255cm (Substratum)" 
                            stroke="#7209b7" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorBedrock)" 
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Agronomic Tip: Geothermal Phase Lag
                    </span>
                    Notice how the purple line (100–255 cm substratum) is almost perfectly flat, whereas the yellow line (0-7 cm topsoil) swings drastically in accordance with day/night cycles. Deep soil acts as a thermal capacitor, stabilizing temperature.
                  </div>
                </div>
              )}

              {/* Tab 2: Selected Crop Seeding Safety Check */}
              {activeTab === "crop" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-emerald-500" />
                      Crop Planting & Germination Suitability Evaluator
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Determine if current subsurface soil heat levels meet physical sprouting thresholds.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="w-full sm:w-1/3">
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">
                        Select Crop Category
                      </label>
                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {CROP_THRESHOLDS.map((crop) => (
                          <option key={crop.name} value={crop.name}>
                            {crop.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Threshold quick spec card */}
                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Min Germination</p>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">
                          {activeCropThreshold.minGermination}°C ({ (activeCropThreshold.minGermination * 9/5 + 32).toFixed(0) }°F)
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Optimal Min</p>
                        <p className="text-xs font-black text-emerald-500 mt-1">
                          {activeCropThreshold.optMin}°C ({ (activeCropThreshold.optMin * 9/5 + 32).toFixed(0) }°F)
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Optimal Max</p>
                        <p className="text-xs font-black text-emerald-500 mt-1">
                          {activeCropThreshold.optMax}°C ({ (activeCropThreshold.optMax * 9/5 + 32).toFixed(0) }°F)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Suitability Result */}
                  <div className={`p-4 rounded-xl border ${suitability.color} space-y-2`}>
                    <div className="flex items-center gap-2">
                      <suitability.icon className="w-5 h-5" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {suitability.status}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{suitability.msg}</p>
                  </div>

                  {/* Seed depth guidance panel */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Standard Agronomic Depth Guidance
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Shallow Seeders (0 - 5 cm)</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Requires careful timing. Vulnerable to rapid frost during cold fronts. Mulching can help retain soil heat.
                        </p>
                      </div>
                      <div className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Deep Seeders (5 - 12 cm)</span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Enjoys high heat stability. Less prone to daily temperature swings but slower to warm up in spring.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )
      )}

    </div>
  );
}
