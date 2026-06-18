import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Droplet, 
  TrendingUp, 
  Compass, 
  Info, 
  Activity, 
  Map, 
  Check,
  ChevronRight,
  Calculator,
  Sun,
  Zap,
  Leaf,
  DollarSign,
  AlertTriangle,
  Upload,
  RefreshCw,
  FileText,
  Thermometer,
  Layers,
  Sparkles
} from "lucide-react";
import { Parcel } from "../types";
import { 
  Bar, 
  BarChart as ReBarChart, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from "recharts";

interface PredictorProps {
  parcels?: Parcel[];
}

export default function Predictor({ parcels = [] }: PredictorProps) {
  // Selection state
  const [selectedParcelId, setSelectedParcelId] = useState<string>("custom");

  // Core Simulation Parameters state
  const [cropType, setCropType] = useState<string>("Corn");
  const [farmSize, setFarmSize] = useState<number>(30);
  const [soilType, setSoilType] = useState<string>("Clay Loam");
  const [soilPH, setSoilPH] = useState<number>(6.5);
  const [nitrogen, setNitrogen] = useState<string>("Optimal");
  const [plantingMonth, setPlantingMonth] = useState<string>("May");
  const [ndviValue, setNdviValue] = useState<number>(0.72);
  const [ndwiValue, setNdwiValue] = useState<number>(0.45);
  const [soilMoisture, setSoilMoisture] = useState<number>(45);
  const [costPerHectare, setCostPerHectare] = useState<number>(950);
  const [marketPricePerTon, setMarketPricePerTon] = useState<number>(180);
  
  // Custom Drone/Satellite image base64 upload
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Dynamic astronomical calculation variables Based on geographic center
  const [lat, setLat] = useState<number>(41.8781);
  const [lng, setLng] = useState<number>(-87.6298);

  // Loading & Result States
  const [simulating, setSimulating] = useState<boolean>(false);
  const [predictionResponse, setPredictionResponse] = useState<any>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Auto-population loop from chosen parcel card
  useEffect(() => {
    if (selectedParcelId === "custom") {
      // Default sandbox starting points
      setCropType("Corn");
      setFarmSize(30);
      setSoilType("Clay Loam");
      setSoilPH(6.5);
      setNitrogen("Optimal");
      setPlantingMonth("May");
      setNdviValue(0.72);
      setNdwiValue(0.45);
      setSoilMoisture(45);
      setCostPerHectare(950);
      setMarketPricePerTon(180);
      setLat(41.8781);
      setLng(-87.6298);
      return;
    }

    const parcel = parcels.find(p => p.id === selectedParcelId);
    if (parcel) {
      setCropType(parcel.cropType || "Corn");
      setFarmSize(parcel.farmSize || parcel.area || 30);
      setSoilType(parcel.soilType || "Clay Loam");
      setSoilPH(parcel.soilPH || 6.5);
      setNitrogen(parcel.nitrogen || "Optimal");
      setPlantingMonth(parcel.plantingMonth || "May");
      setNdviValue(parcel.ndviValue ?? parcel.ndvi ?? 0.72);
      setNdwiValue(parcel.ndwiValue ?? 0.45);
      setSoilMoisture(parcel.soilMoisture || 45);
      setCostPerHectare(parcel.costPerHectare || 950);
      setMarketPricePerTon(parcel.marketPricePerTon || 180);
      
      // Get exact coordinates for calculations
      const pLat = parcel.latitude ?? parcel.lat ?? 41.8781;
      const pLng = parcel.longitude ?? parcel.lng ?? -87.6298;
      setLat(pLat);
      setLng(pLng);
    }
  }, [selectedParcelId, parcels]);

  // Astrometeorological Photoperiod calculations computed on-the-fly inside client
  const calculateDerivedAstronomicalProfile = () => {
    // Map center month to representative Day Of Year
    const monthDOY: Record<string, number> = {
      January: 15, February: 45, March: 74, April: 105, May: 135, June: 166,
      July: 196, August: 227, September: 258, October: 288, November: 319, December: 349
    };
    const dayOfYear = monthDOY[plantingMonth] || 135;

    // Solar Declination angle
    const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 80) * (Math.PI / 180));
    const decRad = declination * (Math.PI / 180);
    const latRad = lat * (Math.PI / 180);

    // Daylength Hour Angle calculation
    const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
    let hours = 12.0;
    if (cosHourAngle <= -1) {
      hours = 24.0;
    } else if (cosHourAngle >= 1) {
      hours = 0.0;
    } else {
      hours = (2 * Math.acos(cosHourAngle) * (180 / Math.PI)) / 15;
    }

    // Peak Elevation Angle (Sun Altitude)
    const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad);
    let altDeg = Math.asin(sinAlt) * (180 / Math.PI);
    if (altDeg < 0) altDeg = 0;

    // Direct theoretical flux limit
    const peakFlux = altDeg > 0 ? (1100.0 * Math.sin(altDeg * (Math.PI / 180))) : 0;

    return {
      daylength: Number(hours.toFixed(1)),
      declination: Number(declination.toFixed(2)),
      peakElevation: Number(altDeg.toFixed(1)),
      peakFlux: Math.round(peakFlux),
    };
  };

  const astro = calculateDerivedAstronomicalProfile();

  // Agronomic diagnostic class matching photoperiod response types
  const getPhotoperiodClassification = () => {
    if (cropType === "Soybeans" || cropType === "Sorghum" || cropType === "Rice") {
      return {
        class: "Short-Day Plant (SDP)",
        desc: "Requires dark periods longer than a critical value to initiate reproductive flowering."
      };
    } else if (cropType === "Winter Wheat" || cropType === "Spring Wheat" || cropType === "Barley" || cropType === "Oats" || cropType === "Sugar Beets") {
      return {
        class: "Long-Day Plant (LDP)",
        desc: "Flowering initiates rapidly once sunlight duration exceeds minimum thresholds during late spring."
      };
    } else {
      return {
        class: "Day-Neutral Plant (DNP)",
        desc: "Initiates reproduction independently of solar photoperiod hours. Responds strongly to Thermal GDD accumulators."
      };
    }
  };

  const photoClass = getPhotoperiodClassification();

  // Handle local drone crop camera image uploaded
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Load preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      setCustomImage(base64Data);
      setImagePreviewUrl(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded scan
  const handleClearImage = () => {
    setCustomImage(null);
    setImagePreviewUrl(null);
  };

  // Primary execution handler: query express endpoint `/api/predict`
  const handleRunPredictor = async () => {
    setSimulating(true);
    setErrorText(null);

    const locationStr = `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)} (${selectedParcelId !== "custom" ? "Registered Farmland" : "Sandbox Field Coordinates"})`;

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropType,
          farmSize,
          location: locationStr,
          soilType,
          soilPH,
          nitrogen,
          plantingMonth,
          ndviValue,
          ndwiValue,
          soilMoisture,
          costPerHectare,
          marketPricePerTon,
          customImage
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result = await response.json();
      setPredictionResponse(result);
    } catch (err: any) {
      console.error("AI simulation query failed:", err);
      setErrorText("Failed to retrieve recommendation models. Running rule-based agronomy math instead.");
      
      // Local fallback in case server takes too long or fails
      const baseYields: Record<string, number> = {
        Corn: 10.2, Soybeans: 3.4, "Winter Wheat": 4.6, barley: 4.1, canola: 2.3, Potato: 35.0
      };
      const baseVal = baseYields[cropType] || 4.5;
      const ndviMultiplier = 0.5 + (ndviValue * 1.1);
      const moistureMultiplier = ndwiValue < 0.25 ? 0.75 : ndwiValue > 0.82 ? 0.85 : 1.1;
      const pHMult = (soilPH >= 6.0 && soilPH <= 7.0) ? 1.15 : 0.88;
      const finalEstYield = Number((baseVal * ndviMultiplier * moistureMultiplier * pHMult).toFixed(2));
      const tons = Number((finalEstYield * farmSize).toFixed(1));
      const exp = Math.round(costPerHectare * farmSize);
      const rev = Math.round(tons * marketPricePerTon);
      const profit = rev - exp;
      
      setPredictionResponse({
        cropType,
        farmSize,
        soilType,
        soilPH,
        nitrogen,
        plantingMonth,
        ndviValue,
        ndwiValue,
        soilMoisture,
        costPerHectare,
        marketPricePerTon,
        plantingScheduleScore: (plantingMonth === "May" || plantingMonth === "April") ? "Optimal (Peak Window)" : "Suboptimal Offset",
        optimalPlantingOffsetDays: 12,
        metrics: {
          yieldPerHectare: finalEstYield,
          totalYieldTons: tons,
          totalExpenses: exp,
          totalRevenue: rev,
          netProfit: profit,
          roiPercent: Number(((profit / (exp || 1)) * 100).toFixed(1)),
        },
        advise: {
          environmentalAnalysis: `High-precision fallback model: Plant biomass index at ${ndviValue} NDVI denotes healthy vegetative greening. Subsurface water metrics demonstrate stable moisture levels.`,
          agronomicTips: [
            `Maintain field Nitrogen NPK values close to ${nitrogen} values.`,
            `Maximize photosynthetic conversion during the computed ${astro.daylength} Daily Daylight Hours.`,
            `Prepare drainage buffers to alleviate subsoil pooling near critical root cells.`
          ],
          riskWarnings: [
            `Sudden frost factors if crops are established outside optimal planting brackets.`,
            `Elevated pest activity during warmer moisture saturation peaks (NDWI: ${ndwiValue}).`,
            `Potential leaf chlorosis if dynamic pH drops below 5.8.`
          ],
          yieldForecast: `Theoretical baseline looks strong. Keep active water grids functional.`
        }
      });
    } finally {
      setSimulating(false);
    }
  };

  // Sensitivity data chart coordinates mapping
  const compileHydrologicalSensitivityData = () => {
    if (!predictionResponse) return [];
    
    const scale = predictionResponse.metrics.yieldPerHectare;
    return [
      { moisture: "Dry 20%", "Yield (t/Ha)": Number((scale * 0.72).toFixed(1)), "ROI Benefit %": -25 },
      { moisture: "Mod 40%", "Yield (t/Ha)": Number((scale * 0.95).toFixed(1)), "ROI Benefit %": 10 },
      { moisture: "Optimum 55%", "Yield (t/Ha)": Number((scale * 1.12).toFixed(1)), "ROI Benefit %": 28 },
      { moisture: "Saturated 75%", "Yield (t/Ha)": Number((scale * 0.88).toFixed(1)), "ROI Benefit %": 4 },
      { moisture: "Flooded 90%", "Yield (t/Ha)": Number((scale * 0.65).toFixed(1)), "ROI Benefit %": -38 },
    ];
  };

  const chartData = compileHydrologicalSensitivityData();

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans" id="integrated-agronomy-predictor-suite">
      
      {/* Dynamic Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#059669] font-mono block">
            Integrated Machine Learning Simulation Node
          </span>
          <h1 className="text-3xl font-display font-black tracking-tight text-gray-950 uppercase flex items-center gap-2">
            Astrometeorological & AI Crop Predictor <Sparkles className="w-6 h-6 text-amber-500 fill-amber-300/30" />
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Link satellite NDVI spectra, SoilGrids composition metrics, and dynamic mathematical photoperiod orbits via Gemini AI to run precision biomass yield & financial projections.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200 px-3.5 py-2 rounded-2xl text-[10px] font-mono leading-none font-extrabold shadow-sm bg-radial">
          <Calculator className="w-4 h-4 text-amber-505" />
          <span>ASTRO-DYNAMIC COPERNICUS V2</span>
        </div>
      </div>

      {/* Selector and Field Setup */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 text-left">
          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-widest block">Simulation Data Source Input</span>
          <h3 className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#059669]" />
            Target Farmland & Hydrometry Field Anchor
          </h3>
          <p className="text-[11px] text-gray-400">
            Choose a registered parcel to extract live coordinates, SoilGrids profile clay fractions, and NDWI indices on the fly.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedParcelId}
            onChange={(e) => setSelectedParcelId(e.target.value)}
            className="w-full md:w-64 bg-slate-50 border border-gray-200 rounded-xl px-3.5 py-3 text-xs text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="custom">🛠️ Practice Sandbox (Custom Crop Params)</option>
            {parcels.map(p => (
              <option key={p.id} value={p.id}>
                🚜 {p.name} ({p.farmSize || p.area} Ha) - {p.cropType}
              </option>
            ))}
          </select>

          {selectedParcelId !== "custom" && (
            <button
              onClick={() => setSelectedParcelId("custom")}
              title="Reset to manual sandbox values"
              className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Control Knobs (7/12 layout) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#059669] font-mono">Parameters Board</span>
                <h3 className="text-sm font-display font-black text-slate-900 uppercase">Crop-Soil-Satellite Variances</h3>
              </div>
              
              <div className="text-[10px] font-mono text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-md font-bold uppercase">
                {selectedParcelId !== "custom" ? "Sync Active" : "Interactive Sandbox Mode"}
              </div>
            </div>

            <div className="space-y-5">
              
              {/* Row 1: Crop Select & Field Area */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Target Seed Crop
                  </label>
                  <select
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Corn">Corn MAIZE</option>
                    <option value="Soybeans">Soybeans OIL</option>
                    <option value="Winter Wheat">Winter Wheat BULK</option>
                    <option value="Spring Wheat">Spring Wheat FINE</option>
                    <option value="Barley">Barley MALT</option>
                    <option value="Canola">Canola HEXA</option>
                    <option value="Rice">Rice WETLAND</option>
                    <option value="Cotton">Cotton FIBRE</option>
                    <option value="Potato">Potato TUBER</option>
                    <option value="Sugar Beets">Sugar Beets SWEET</option>
                    <option value="Chickpeas">Chickpeas LEGUME</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Planting Season Month
                  </label>
                  <select
                    value={plantingMonth}
                    onChange={(e) => setPlantingMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="January">January</option>
                    <option value="February">February</option>
                    <option value="March">March</option>
                    <option value="April">April (Spring Sow)</option>
                    <option value="May">May (Optimal Peak)</option>
                    <option value="June">June</option>
                    <option value="July">July</option>
                    <option value="August">August</option>
                    <option value="September">September (Autumn Sow)</option>
                    <option value="October">October</option>
                    <option value="November">November</option>
                    <option value="December">December</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Surface Area
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-900">{farmSize} Ha</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={farmSize}
                    onChange={(e) => setFarmSize(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              {/* Row 2: Soil composition variables */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 p-4 border border-slate-150 rounded-2xl">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Soil Texture Class
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Loamy">Loamy (Optimal Porosity)</option>
                    <option value="Silt">Silt (High Retention)</option>
                    <option value="Clayey">Clayey (Compact Drainage)</option>
                    <option value="Sandy">Sandy (High Leaching)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Soil pH
                    </label>
                    <span className="text-[11px] font-mono font-black text-rose-800 bg-rose-50 px-1.5 rounded">pH {soilPH}</span>
                  </div>
                  <input
                    type="range"
                    min="4.5"
                    max="8.5"
                    step="0.1"
                    value={soilPH}
                    onChange={(e) => setSoilPH(parseFloat(e.target.value))}
                    className="w-full accent-[#059669] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Nitrogen (NPK) Status
                  </label>
                  <select
                    value={nitrogen}
                    onChange={(e) => setNitrogen(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Optimal">Optimal Nitrogen</option>
                    <option value="Deficient">Deficient (Add side-dress)</option>
                    <option value="Surplus">Surplus (Runoff risk)</option>
                  </select>
                </div>

              </div>

              {/* Row 3: Heliophilic satellite and remote sensors (Sliders) */}
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* NDVI Chlorophyll slider */}
                  <div className="space-y-1.5 bg-emerald-500/[0.02] border border-emerald-500/10 p-3.5 rounded-2xl">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                        NDVI (Chlorophyll)
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-600">{ndviValue.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.99"
                      step="0.01"
                      value={ndviValue}
                      onChange={(e) => setNdviValue(parseFloat(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-[#059669]/60 leading-tight">Canopy index. Decides current photosynthetic leaf expansion.</p>
                  </div>

                  {/* NDWI Water slider */}
                  <div className="space-y-1.5 bg-blue-500/[0.02] border border-blue-500/10 p-3.5 rounded-2xl">
                    <div className="flex justify-between items-baseline">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                        <Droplet className="w-3.5 h-3.5 text-blue-600" />
                        NDWI (Hydration Stress)
                      </span>
                      <span className="text-xs font-mono font-black text-blue-600">{ndwiValue.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.01"
                      value={ndwiValue}
                      onChange={(e) => setNdwiValue(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-blue-500/60 leading-tight">Leaf moisture content index. Decides resistance to hot droughts.</p>
                  </div>

                </div>

                {/* Subsurface moisture */}
                <div className="space-y-1.5 bg-sky-500/[0.01] border border-sky-500/5 p-4 rounded-2xl">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                      Subsoil Capillary Saturation Rating
                    </span>
                    <span className="text-xs font-mono font-black text-[#059669]">{soilMoisture}% Volumetric</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="1"
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(parseInt(e.target.value))}
                    className="w-full accent-[#059669] cursor-pointer"
                  />
                </div>

              </div>

              {/* Economic Ledger Inputs (Acre expense and expected price) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-yellow-500/[0.02] border border-yellow-500/10 p-4 rounded-2xl">
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Target Input Cost ($/Ha)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700">${costPerHectare}</span>
                  </div>
                  <input
                    type="number"
                    min="100"
                    max="3000"
                    step="50"
                    value={costPerHectare}
                    onChange={(e) => setCostPerHectare(Math.max(100, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                      Estimated Market Price ($/Ton)
                    </label>
                    <span className="text-xs font-mono font-bold text-amber-700">${marketPricePerTon}</span>
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="10"
                    value={marketPricePerTon}
                    onChange={(e) => setMarketPricePerTon(Math.max(50, parseInt(e.target.value) || 0))}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              {/* Astrometeorological Computed Orbit Details Panel */}
              <div className="bg-amber-500/[0.03] border border-amber-500/15 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-amber-900 font-mono flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-505 shrink-0 animate-spin-slow" />
                    Astrometeorological Orbit Context (computed)
                  </h4>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono uppercase">
                    Lat: {lat.toFixed(2)}°N
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 font-mono">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-500/10 space-y-0.5">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Photoperiod Daylength</span>
                    <strong className="text-slate-900 text-xs sm:text-sm">{astro.daylength} Hrs</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-500/10 space-y-0.5">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Solar Declination</span>
                    <strong className="text-slate-900 text-xs sm:text-sm">{astro.declination}°</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-500/10 space-y-0.5">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Transit Noon Angle</span>
                    <strong className="text-slate-900 text-xs sm:text-sm">{astro.peakElevation}°</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-500/10 space-y-0.5">
                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Theoretical Flux</span>
                    <strong className="text-slate-900 text-xs sm:text-sm">{astro.peakFlux} W/m²</strong>
                  </div>
                </div>

                <div className="text-[10px] leading-relaxed text-slate-500 border-t border-amber-500/10 pt-2 flex items-center justify-between gap-1">
                  <p>
                    <strong>Classification:</strong> {photoClass.class} — <span className="italic">{photoClass.desc}</span>
                  </p>
                </div>
              </div>

              {/* Multimodal Drone/Satellite Visual Upload Panel */}
              <div className="border border-dashed border-gray-250 hover:border-emerald-500 rounded-2xl p-5 hover:bg-slate-50/50 transition relative overflow-hidden text-center space-y-3">
                <div className="flex flex-col items-center justify-center space-y-1 font-sans cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-800">Visual Drone / Satellite Imagery Feed (Optional)</span>
                  <p className="text-[10px] text-gray-400 max-w-sm">
                    Upload drone inspection images or high-resolution red/NIR composite maps to trigger visual multimodal Gemini diagnostic reports.
                  </p>
                </div>

                <div className="relative flex justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="bg-white border text-slate-600 px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-xs hover:bg-slate-50 block cursor-pointer"
                  >
                    Select Field Image
                  </button>
                </div>

                {imagePreviewUrl && (
                  <div className="pt-2 flex flex-col items-center gap-2">
                    <div className="relative w-32 h-32 rounded-xl border overflow-hidden shadow">
                      <img src={imagePreviewUrl} alt="Field Composite visual" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow transition"
                      >
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-100 rounded-md px-2 py-0.5">Visually attached to AI queue</span>
                  </div>
                )}
              </div>

              {/* MAIN CALCULATION BUTTON */}
              <button
                type="button"
                onClick={handleRunPredictor}
                disabled={simulating}
                className="w-full bg-[#059669] hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-4 rounded-2xl font-display font-black tracking-widest text-xs uppercase shadow-md shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {simulating ? (
                  <>
                    <Activity className="w-4 h-4 text-emerald-300 animate-spin" />
                    <span>Synchronizing Astrometeorology & SoilGrids Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Compile AI Agronomist & Biomass ROI Projections</span>
                  </>
                )}
              </button>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Dashboard Suite (5/12 layout) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6 text-left">
            
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <TrendingUp className="w-5 h-5 text-[#059669]" />
              <div>
                <h3 className="text-sm font-display font-black text-gray-950 uppercase block">AI Projection Ledger</h3>
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">Highly targeted agronomy forecast parameters</p>
              </div>
            </div>

            {errorText && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-805 text-[10px] font-medium rounded-xl flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p>{errorText}</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {predictionResponse ? (
                <motion.div
                  key="output-panel-active"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  
                  {/* Metric Circle Badge display */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col items-center text-center space-y-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
                    <span className="text-[9px] text-slate-450 font-bold font-mono tracking-widest uppercase text-slate-400">PROJECTED PRODUCTION RATE</span>
                    <span className="text-4xl font-display font-black text-emerald-400">
                      {predictionResponse.metrics.yieldPerHectare.toFixed(2)} <span className="text-lg font-normal text-slate-350">t/Ha</span>
                    </span>
                    <span className="text-[10px] bg-slate-800 text-emerald-450 text-emerald-400 font-bold font-mono px-3 py-1 rounded-full uppercase mt-1">
                      SCHEDULING: {predictionResponse.plantingScheduleScore}
                    </span>
                  </div>

                  {/* Financial Balance Sheet Ledger */}
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Financial & Harvest Balance Ledger</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      
                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase block">Total Biomass Harvest</span>
                        <strong className="text-base text-slate-900 block leading-none font-display font-black">
                          {predictionResponse.metrics.totalYieldTons.toLocaleString()} Metric Tons
                        </strong>
                        <span className="text-[8px] text-slate-400 font-semibold uppercase block">Across {farmSize} Hectares</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-1">
                        <span className="text-[8px] text-slate-400 font-bold font-mono uppercase block">Return On Investment</span>
                        <strong className={`text-base block leading-none font-display font-black ${
                          predictionResponse.metrics.roiPercent >= 0 ? "text-[#059669]" : "text-rose-600"
                        }`}>
                          {predictionResponse.metrics.roiPercent > 0 ? `+${predictionResponse.metrics.roiPercent}` : predictionResponse.metrics.roiPercent}%
                        </strong>
                        <span className="text-[8px] text-slate-400 font-bold uppercase block">Net Yield Ratio</span>
                      </div>

                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                      
                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                        <span className="text-[8px] text-rose-700 block uppercase font-bold">Total Costs</span>
                        <strong className="text-[11px] text-rose-900 font-extrabold">${predictionResponse.metrics.totalExpenses.toLocaleString()}</strong>
                      </div>

                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[8px] text-[#059669] block uppercase font-bold">Gross Revenue</span>
                        <strong className="text-[11px] text-emerald-900 font-extrabold">${predictionResponse.metrics.totalRevenue.toLocaleString()}</strong>
                      </div>

                      <div className={`p-2.5 rounded-xl border ${
                        predictionResponse.metrics.netProfit >= 0 ? "bg-teal-50 border-teal-100" : "bg-red-50 border-red-100"
                      }`}>
                        <span className={`text-[8px] block uppercase font-bold ${
                          predictionResponse.metrics.netProfit >= 0 ? "text-teal-700" : "text-rose-700"
                        }`}>Net Profit</span>
                        <strong className={`text-[11px] font-black ${
                          predictionResponse.metrics.netProfit >= 0 ? "text-teal-900" : "text-rose-900"
                        }`}>
                          ${predictionResponse.metrics.netProfit.toLocaleString()}
                        </strong>
                      </div>

                    </div>
                  </div>

                  {/* AI COUNSELOR DIAGNOSTIC REPORT PANELS */}
                  <div className="bg-amber-500/[0.04] border border-amber-500/10 p-5 rounded-3xl space-y-4">
                    
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                        <Compass className="w-5 h-5 shrink-0" />
                      </div>
                      <div>
                        <span className="text-[9px] text-amber-800 font-bold font-mono uppercase tracking-widest block font-black">MyCrop Agronomist AI Report</span>
                        <h4 className="text-xs font-black text-slate-900 uppercase">Crop Photobiology & Environmental Diagnostics</h4>
                      </div>
                    </div>

                    <div className="h-px bg-amber-500/10" />

                    {/* Report Sections */}
                    <div className="space-y-3 text-[11px] text-slate-700">
                      
                      {/* Analysis */}
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] text-amber-900 tracking-wider uppercase font-extrabold block">Environmental Diagnosis</span>
                        <p className="leading-relaxed text-slate-500 bg-white p-3 border border-amber-550/10 rounded-xl text-left">
                          {predictionResponse.advise.environmentalAnalysis}
                        </p>
                      </div>

                      {/* Tips */}
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] text-amber-900 tracking-wider uppercase font-extrabold block">Actionable Corrective Protocols</span>
                        <ul className="space-y-1">
                          {predictionResponse.advise.agronomicTips.map((tip: string, idx: number) => (
                            <li key={idx} className="flex gap-1.5 items-start bg-white px-3 py-2 border border-amber-500/10 rounded-lg text-slate-755 text-left font-medium">
                              <span className="text-emerald-600 font-bold font-mono">0{idx+1}.</span>
                              <span className="text-slate-500">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Warnings */}
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] text-rose-800 tracking-wider uppercase font-extrabold block">Critical Ecological Hazards</span>
                        <div className="bg-rose-50 border border-rose-100/50 p-3 rounded-xl space-y-1">
                          {predictionResponse.advise.riskWarnings.map((warning: string, idx: number) => (
                            <p key={idx} className="flex items-start gap-1.5 text-[10px] text-rose-900 font-semibold leading-tight text-left">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>{warning}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Forecast text */}
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] text-[#059669] tracking-wider uppercase font-extrabold block">AI Crop Yield Forecast Outlook</span>
                        <p className="leading-relaxed p-3 bg-teal-50 border border-teal-150 rounded-xl text-teal-900 font-semibold italic text-left">
                          "{predictionResponse.advise.yieldForecast}"
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Sensitivity chart visualization using Recharts */}
                  <div className="border border-slate-200 bg-white p-4 rounded-3xl text-left">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-mono">HYDROLOGICAL HYPOTHESIS MODEL</span>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-2">Moisture Sensitivity Forecast Curve</h4>
                    
                    <div className="h-[180px] w-full mt-2 font-mono text-[9px] text-slate-550">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReBarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="moisture" stroke="#64748b" tickLine={false} />
                          <YAxis stroke="#64748b" tickLine={false} unit="t" />
                          <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0" }} />
                          <Legend wrapperStyle={{ fontSize: "8px" }} />
                          <Bar dataKey="Yield (t/Ha)" fill="#10b981" radius={[4, 4, 0, 0]} name="Expected Yield" />
                        </ReBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Print / Download Advisory Report Button */}
                  <button
                    type="button"
                    onClick={() => {
                      // Trigger native print flow or styled modal layout
                      window.print();
                    }}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 py-3 rounded-xl font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>Print/Export Official Agronomy Sheet</span>
                  </button>

                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 space-y-4 font-sans border border-gray-150 border-dashed rounded-3xl bg-slate-50/50">
                  <Activity className="w-12 h-12 text-gray-300 animate-pulse" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-900 block font-display">Hydrological Core Offline</span>
                    <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed mx-auto">
                      Adjust coordinates, crop variety inputs, satellite index settings or visual drone imagery feeds in the configuration deck, then request a simulation.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

    </div>
  );
}
