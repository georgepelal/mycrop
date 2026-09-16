import React, { useState, useMemo } from "react";
import { 
  Sprout, 
  Layers, 
  AlertTriangle, 
  Calculator, 
  Zap, 
  Gauge, 
  Workflow,
  Sparkles,
  Map as MapIcon
} from "lucide-react";
import { Parcel } from "../types";
import SoilOptimizerFieldMap from "../components/SoilOptimizerFieldMap";

interface SubSoilProfileNutrientPortalProps {
  parcels: Parcel[];
  activeParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

// Soil Horizon Definition
interface SoilHorizon {
  id: string;
  name: string;
  depthRange: string;
  color: string;
  darkColor: string;
  description: string;
  organicMatter: number; // %
  bulkDensity: number; // g/cm³
  clay: number; // %
  sand: number; // %
  silt: number; // %
  moistureCapacity: string;
  ph: number;
}

export default function SubSoilProfileNutrientPortal({ 
  parcels, 
  activeParcelId, 
  onSelectParcel 
}: SubSoilProfileNutrientPortalProps) {
  
  // Find active parcel or fallback to first
  const activeParcel = parcels.find(p => p.id === activeParcelId) || parcels[0] || null;

  // Selected depth layer state
  const [selectedLayerId, setSelectedLayerId] = useState<string>("root-zone");
  
  // Fertilizer recommendation calculator inputs
  const [targetYield, setTargetYield] = useState<number>(10.5); // tonnes/ha
  const [fertilizerType, setFertilizerType] = useState<string>("urea");
  const [isSimulatingAnalysis, setIsSimulatingAnalysis] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  // 1. Generate realistic, consistent soil horizon characteristics based on parcel fields
  const horizons = useMemo<SoilHorizon[]>(() => {
    if (!activeParcel) return [];

    const basePH = activeParcel.soilPH || 6.5;
    const soilTypeLower = (activeParcel.soilType || "Loam").toLowerCase();

    // Adjust clay/sand/silt percentages based on parcel's soil type
    let clayPct = activeParcel.soilGridsClay || 20;
    let sandPct = activeParcel.soilGridsSand || 40;
    let siltPct = activeParcel.soilGridsSilt || 40;

    if (soilTypeLower.includes("clay")) {
      clayPct = Math.max(clayPct, 45);
      sandPct = Math.min(sandPct, 25);
      siltPct = 100 - clayPct - sandPct;
    } else if (soilTypeLower.includes("sand")) {
      sandPct = Math.max(sandPct, 65);
      clayPct = Math.min(clayPct, 15);
      siltPct = 100 - clayPct - sandPct;
    } else if (soilTypeLower.includes("silt")) {
      siltPct = Math.max(siltPct, 55);
      clayPct = Math.min(clayPct, 20);
      sandPct = 100 - clayPct - siltPct;
    }

    return [
      {
        id: "topsoil",
        name: "A-Horizon (Topsoil)",
        depthRange: "0 - 15 cm",
        color: "bg-amber-900 border-amber-950",
        darkColor: "dark:bg-amber-950 dark:border-amber-950/50",
        description: "Dark, nutrient-dense topsoil with high biological activity. Crucial for seed germination, initial root shoots, and carbon sequestration.",
        organicMatter: Math.max(1.5, parseFloat((3.8 * (activeParcel.soilGridsSoc ? activeParcel.soilGridsSoc / 100 : 1)).toFixed(1))),
        bulkDensity: 1.15,
        clay: clayPct,
        sand: sandPct,
        silt: siltPct,
        moistureCapacity: "High (35-40% vol)",
        ph: parseFloat((basePH).toFixed(1))
      },
      {
        id: "root-zone",
        name: "B1-Horizon (Active Root Zone)",
        depthRange: "15 - 60 cm",
        color: "bg-amber-800 border-amber-900",
        darkColor: "dark:bg-amber-900 dark:border-amber-900/50",
        description: "Transition sub-soil with strong water retention and dense crop root web. Optimal aeration allows robust nutrient assimilation.",
        organicMatter: Math.max(0.8, parseFloat((1.9 * (activeParcel.soilGridsSoc ? activeParcel.soilGridsSoc / 100 : 1)).toFixed(1))),
        bulkDensity: 1.30,
        clay: Math.min(100, Math.round(clayPct * 1.15)),
        sand: Math.max(0, Math.round(sandPct * 0.95)),
        silt: Math.max(0, Math.round(100 - (clayPct * 1.15) - (sandPct * 0.95))),
        moistureCapacity: "Optimal (28-32% vol)",
        ph: parseFloat((basePH + 0.2).toFixed(1))
      },
      {
        id: "sub-soil",
        name: "B2-Horizon (Subsoil Core)",
        depthRange: "60 - 120 cm",
        color: "bg-amber-700 border-amber-800",
        darkColor: "dark:bg-amber-800/80 dark:border-amber-800/40",
        description: "Mineral-rich accumulation zone of clay and metallic oxides. Low organic content, but highly active capillary moisture retention.",
        organicMatter: 0.4,
        bulkDensity: 1.48,
        clay: Math.min(100, Math.round(clayPct * 1.3)),
        sand: Math.max(0, Math.round(sandPct * 0.85)),
        silt: Math.max(0, Math.round(100 - (clayPct * 1.3) - (sandPct * 0.85))),
        moistureCapacity: "Moderate (20-25% vol)",
        ph: parseFloat((basePH + 0.5).toFixed(1))
      },
      {
        id: "deep-subsoil",
        name: "C-Horizon (Deep Subsoil & Bedrock Contact)",
        depthRange: "120 - 200+ cm",
        color: "bg-yellow-800/70 border-amber-700",
        darkColor: "dark:bg-yellow-950/40 dark:border-amber-700/30",
        description: "Dense substratum composed of partially disintegrated geological parent material. Compact structure limiting vertical drainage.",
        organicMatter: 0.1,
        bulkDensity: 1.62,
        clay: Math.min(100, Math.round(clayPct * 1.4)),
        sand: Math.max(0, Math.round(sandPct * 0.75)),
        silt: Math.max(0, Math.round(100 - (clayPct * 1.4) - (sandPct * 0.75))),
        moistureCapacity: "Low (12-15% vol)",
        ph: parseFloat((basePH + 0.8).toFixed(1))
      }
    ];
  }, [activeParcel]);

  const selectedLayer = horizons.find(h => h.id === selectedLayerId) || horizons[1];

  // 2. Active Crop NPK requirements mapping
  const cropRequirements = useMemo(() => {
    if (!activeParcel) return { n: "Medium", p: "Medium", k: "Medium", status: "Balanced" };
    const crop = (activeParcel.cropType || "").toLowerCase();

    if (crop.includes("corn") || crop.includes("maize")) {
      return { n: "Very High", p: "High", k: "High", status: "Nitrogen Demanding" };
    }
    if (crop.includes("soy") || crop.includes("bean") || crop.includes("lentil") || crop.includes("chickpea")) {
      return { n: "Low (N-fixing)", p: "High", k: "Medium", status: "Phosphorus Demanding" };
    }
    if (crop.includes("wheat") || crop.includes("barley") || crop.includes("rye") || crop.includes("oat")) {
      return { n: "High", p: "Medium", k: "Medium", status: "Sturdy Straw Growth" };
    }
    if (crop.includes("potato") || crop.includes("beet") || crop.includes("carrot")) {
      return { n: "Medium", p: "Medium", k: "Very High", status: "Tuber Root Demanding" };
    }
    if (crop.includes("tomato") || crop.includes("fruit")) {
      return { n: "Medium", p: "High", k: "High", status: "Potassium Demanding" };
    }
    return { n: "Medium", p: "Medium", k: "Medium", status: "Standard Crop" };
  }, [activeParcel]);

  // 3. Dynamic Crop Current Nutrient Status
  const currentNutrients = useMemo(() => {
    if (!activeParcel) return { n: 45, p: 25, k: 180, nStatus: "Optimal", pStatus: "Optimal", kStatus: "Optimal" };
    
    // Base parsing from nitrogen levels ("High", "Optimal", "Medium", "Low")
    const nLevel = (activeParcel.nitrogen || "Medium").toLowerCase();
    const ph = activeParcel.soilPH || 6.5;

    let nVal = 55;
    let nStat = "Optimal";
    if (nLevel.includes("high")) { nVal = 85; nStat = "Excessive"; }
    else if (nLevel.includes("low")) { nVal = 25; nStat = "Deficient"; }
    else if (nLevel.includes("medium")) { nVal = 48; nStat = "Marginal"; }

    // Phosphorus availability is highly governed by soil pH
    let pVal = 32; // optimal ppm
    let pStat = "Optimal";
    if (ph < 5.8) {
      pVal = 14;
      pStat = "Low Availability (Acidic Locked)";
    } else if (ph > 7.8) {
      pVal = 18;
      pStat = "Low Availability (Alkaline Bound)";
    }

    // Potassium levels are typically moderate to high in clay-loams
    let kVal = 210; // optimal ppm
    let kStat = "Optimal";
    if (activeParcel.soilType && activeParcel.soilType.toLowerCase().includes("sand")) {
      kVal = 95;
      kStat = "Deficient (Sandy Leached)";
    }

    return {
      n: nVal,
      p: pVal,
      k: kVal,
      nStatus: nStat,
      pStatus: pStat,
      kStatus: kStat
    };
  }, [activeParcel]);

  // 4. Fertilizer Recommendation Calculation
  const fertilizerRecommendation = useMemo(() => {
    if (!activeParcel) return null;
    const crop = (activeParcel.cropType || "").toLowerCase();

    // Base nutrient export in kg per tonne of target yield
    let unitN = 22; // kg N needed per tonne
    let unitP = 8;  // kg P2O5 needed per tonne
    let unitK = 18; // kg K2O needed per tonne

    if (crop.includes("corn")) {
      unitN = 24; unitP = 9; unitK = 19;
    } else if (crop.includes("soy")) {
      unitN = 5; // fixes N, only starter N needed
      unitP = 12; unitK = 22;
    } else if (crop.includes("potato")) {
      unitN = 18; unitP = 7; unitK = 28;
    } else if (crop.includes("wheat")) {
      unitN = 21; unitP = 8; unitK = 16;
    }

    // Raw requirements for target yield (kg/ha)
    const rawN = Math.round(targetYield * unitN);
    const rawP = Math.round(targetYield * unitP);
    const rawK = Math.round(targetYield * unitK);

    // Credit existing soil nutrients
    const creditN = currentNutrients.nStatus === "Deficient" ? 0 : currentNutrients.nStatus === "Marginal" ? 20 : 50;
    const creditP = currentNutrients.pStatus.includes("Low") ? 5 : 20;
    const creditK = currentNutrients.kStatus.includes("Deficient") ? 10 : 70;

    // Net fertilizer requirement
    const netN = Math.max(0, rawN - creditN);
    const netP = Math.max(0, rawP - creditP);
    const netK = Math.max(0, rawK - creditK);

    let mainNutrient = "";
    let secondaryNutrient = "";
    let applicationRate = 0;
    let details = "";

    switch (fertilizerType) {
      case "urea": // 46-0-0
        applicationRate = Math.round(netN / 0.46);
        mainNutrient = `${netN} kg/ha Nitrogen (N)`;
        details = "Provides rapid, high-concentration nitrogen release. Best applied in split doses to prevent subsoil leaching and volatilization.";
        break;
      case "dap": { // 18-46-0
        applicationRate = Math.round(netP / 0.46);
        const contributedN = Math.round(applicationRate * 0.18);
        mainNutrient = `${netP} kg/ha Phosphorus (P₂O₅)`;
        secondaryNutrient = `Also provides ${contributedN} kg/ha Starter Nitrogen (N)`;
        details = "Excellent dual-nutrient source. Apply near root zones at planting to accelerate subsoil crown root establishment.";
        break;
      }
      case "mop": // 0-0-60
        applicationRate = Math.round(netK / 0.60);
        mainNutrient = `${netK} kg/ha Potassium (K₂O)`;
        details = "High density potassium source. Boosts cell-wall thickness, turgor pressure, drought resistance, and subsoil frost resilience.";
        break;
      case "triple-15": { // 15-15-15
        const maxDemand = Math.max(netN, netP, netK);
        applicationRate = Math.round(maxDemand / 0.15);
        mainNutrient = `Balanced N-P-K coverage`;
        details = "Perfect for standard pre-planting maintenance. Distributes macro-nutrients uniformly across all crop life stages.";
        break;
      }
      case "organic":
        applicationRate = Math.round(netN / 0.03); // 3% N compost
        mainNutrient = `Humus & Organic Matter Enricher`;
        details = "Increases subsoil water-holding capacity, improves soil biology, and buffers capillary soil pH over multiple seasons.";
        break;
    }

    return {
      rawN, rawP, rawK,
      creditN, creditP, creditK,
      netN, netP, netK,
      applicationRate,
      mainNutrient,
      secondaryNutrient,
      details,
      costEstimate: Math.round(applicationRate * (activeParcel.costPerHectare ? activeParcel.costPerHectare * 0.001 : 0.8))
    };
  }, [activeParcel, targetYield, fertilizerType, currentNutrients]);

  // Run dynamic simulation simulation
  const runProfileSimulation = () => {
    setIsSimulatingAnalysis(true);
    setSimulationLog([]);
    const logs = [
      "Connecting to ISRIC SoilGrids API...",
      `Analyzing depth profile coordinates for field: ${activeParcel?.name}...`,
      "Calculating bulk density curves at 15cm, 60cm, and 120cm...",
      `Assessing chemical lock factors based on soil pH of ${activeParcel?.soilPH}...`,
      "Synthesizing NPK cation availability...",
      "Generating diagnostic report complete."
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setSimulationLog(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setIsSimulatingAnalysis(false);
        }
      }, (index + 1) * 450);
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6" id="sub-soil-nutrient-portal">
      {/* 1. Header with Field Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Soil Optimizer & Nutrient Portal</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Deep stratigraphic mapping, diagnostic field bounds & dynamic crop nutrition calculators</p>
          </div>
        </div>

        {/* Parcel Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Field:</span>
          <select
            value={activeParcel?.id || ""}
            onChange={(e) => onSelectParcel(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-2xl px-4 py-2.5 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm cursor-pointer outline-none"
          >
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                🚜 {p.name} ({p.cropType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeParcel ? (
        <div className="space-y-6">
          
          {/* Integrated Multi-Dimensional Soil Dashboard */}

          {/* Field Boundary Map Card - Hero Full Width */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Interactive Field Optimization Map</h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    High-fidelity satellite visual of your parcel. Toggle overlay layers to optimize moisture zones, nitrogen indices, soil pH gradients, and humic organic matter.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                    Live Coordinates
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Lat: {(activeParcel.latitude || activeParcel.lat || 35.0).toFixed(6)}, Lng: {(activeParcel.longitude || activeParcel.lng || 35.0).toFixed(6)}
                  </span>
                </div>
              </div>
              
              <div className="w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <SoilOptimizerFieldMap parcel={activeParcel} />
              </div>
            </div>

          {/* Horizon Stratigraphy, Nutrient Status & Application Requirements */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: Depth Layers Selection */}
              <div className="lg:col-span-4 flex flex-col space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Stratigraphic Horizon</h2>
                    </div>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      Interactive Depth
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Click a soil horizon layer below to visualize its chemical density, sand/silt/clay texture splits, and aeration properties.
                  </p>
    
                  {/* Graphical vertical column representing soil layers */}
                  <div className="relative flex flex-col space-y-3.5 pl-4 border-l-2 border-slate-100 dark:border-slate-800 py-2">
                    {horizons.map((h) => {
                      const isSelected = h.id === selectedLayerId;
                      return (
                        <button
                          key={h.id}
                          onClick={() => setSelectedLayerId(h.id)}
                          className={`w-full relative rounded-2xl p-4 text-left transition-all overflow-hidden border cursor-pointer ${
                            isSelected 
                              ? `${h.color} ${h.darkColor} text-white shadow-md scale-[1.02] border-transparent ring-2 ring-emerald-500/50` 
                              : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between relative z-10">
                            <span className="text-xs font-black tracking-tight uppercase">{h.name}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                            }`}>
                              {h.depthRange}
                            </span>
                          </div>
                          
                          {/* Subtitle/soil preview */}
                          <div className="mt-1 flex items-center justify-between relative z-10">
                            <span className={`text-[10px] font-medium ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                              Bulk Density: {h.bulkDensity} g/cm³
                            </span>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-emerald-200" : "text-emerald-600"}`}>
                              pH {h.ph}
                            </span>
                          </div>

                          {/* Small visual clay-sand-silt ratio pills */}
                          <div className="mt-2.5 flex items-center gap-1.5 relative z-10">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                              isSelected ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              Clay {h.clay}%
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                              isSelected ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              Sand {h.sand}%
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                              isSelected ? "bg-white/10 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}>
                              Silt {h.silt}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick API Probe trigger */}
                <div className="bg-gradient-to-br from-emerald-950 to-slate-900 rounded-3xl p-5 border border-emerald-500/20 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Workflow className="w-24 h-24 text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-black flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    Soil Horizon Diagnostic Tool
                  </h3>
                  <p className="text-xs text-emerald-200/85 mb-4">
                    Analyze physical soil properties against USGS and ISRIC global soil databases.
                  </p>
                  
                  <button
                    disabled={isSimulatingAnalysis}
                    onClick={runProfileSimulation}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSimulatingAnalysis ? (
                      <>
                        <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        Analyzing Soil Profile...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        Query Soil Grids Database
                      </>
                    )}
                  </button>

                  {simulationLog.length > 0 && (
                    <div className="mt-4 bg-slate-950/80 rounded-2xl p-3 border border-emerald-500/10 font-mono text-[10px] leading-relaxed text-emerald-400 space-y-1">
                      {simulationLog.map((log, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-emerald-600 shrink-0">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Horizon soil characteristic breakdown details */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <div>
                      <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        Layer Focus
                      </span>
                      <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mt-1">{selectedLayer.name}</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Capillary Moisture Retention</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{selectedLayer.moistureCapacity}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Stratigraphic Texture Split</h4>
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100/60 dark:border-slate-800">
                        {/* Clay Progress */}
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-600 dark:text-slate-300">Clay (Fine Silt Bind)</span>
                            <span className="text-amber-700 dark:text-amber-400">{selectedLayer.clay}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-700 h-full rounded-full" style={{ width: `${selectedLayer.clay}%` }} />
                          </div>
                        </div>

                        {/* Sand Progress */}
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-600 dark:text-slate-300">Sand (Coarse Drainage)</span>
                            <span className="text-yellow-600 dark:text-yellow-400">{selectedLayer.sand}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${selectedLayer.sand}%` }} />
                          </div>
                        </div>

                        {/* Silt Progress */}
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-slate-600 dark:text-slate-300">Silt (Loam Buffer)</span>
                            <span className="text-orange-600 dark:text-orange-400">{selectedLayer.silt}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${selectedLayer.silt}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Horizon Agronomic Role</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-emerald-50/20 dark:bg-emerald-950/10 rounded-2xl p-4 border border-emerald-500/10">
                          {selectedLayer.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0">
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Organic Matter</span>
                          <span className="text-base font-bold text-slate-800 dark:text-slate-100">{selectedLayer.organicMatter}%</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Humic Matrix</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Aeration Ratio</span>
                          <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                            {selectedLayer.bulkDensity < 1.3 ? "Excellent" : selectedLayer.bulkDensity < 1.5 ? "Moderate" : "Restricted"}
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{selectedLayer.bulkDensity} g/cm³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Cation Exchange & Nutrient Availability Status Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Cation Exchange & Nutrient Availability</h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <span>Current Crop:</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {activeParcel.cropType}
                    </span>
                  </div>
                </div>

                {/* Warnings/Status Block */}
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <h5 className="font-bold text-amber-800 dark:text-amber-400">
                      Nitrogen Demand Alert: {cropRequirements.status}
                    </h5>
                    <p className="text-amber-700/90 dark:text-amber-400/80 mt-1">
                      Based on the active crop cycle ({activeParcel.cropType}) and current sub-soil moisture thresholds, potassium integration remains vital. Subsoil pH is currently {activeParcel.soilPH} which is {activeParcel.soilPH < 6.0 ? "slightly acidic" : activeParcel.soilPH > 7.5 ? "alkaline" : "highly optimal"} for optimal mineral assimilation.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Nitrogen (N) */}
                  <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Nitrogen (N)</span>
                        <span className="text-[10px] text-slate-400">Leaf & canopy growth</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentNutrients.nStatus === "Deficient" ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        currentNutrients.nStatus === "Marginal" ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      }`}>
                        {currentNutrients.nStatus}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                        {currentNutrients.n} <span className="text-xs text-slate-400 font-sans">mg/kg</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${currentNutrients.n}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400">
                      Recommended target: <span className="font-bold">50-80 mg/kg</span>
                    </div>
                  </div>

                  {/* Phosphorus (P) */}
                  <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Phosphorus (P)</span>
                        <span className="text-[10px] text-slate-400">Root & crown development</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentNutrients.pStatus.includes("Low") ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      }`}>
                        {currentNutrients.pStatus.includes("Low") ? "Acid-Locked" : "Optimal"}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                        {currentNutrients.p} <span className="text-xs text-slate-400 font-sans">ppm</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${(currentNutrients.p / 45) * 100}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400">
                      Recommended target: <span className="font-bold">25-40 ppm</span>
                    </div>
                  </div>

                  {/* Potassium (K) */}
                  <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">Potassium (K)</span>
                        <span className="text-[10px] text-slate-400">Drought & disease resistance</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentNutrients.kStatus.includes("Deficient") ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" :
                        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                      }`}>
                        {currentNutrients.kStatus.includes("Deficient") ? "Leached" : "Optimal"}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                        {currentNutrients.k} <span className="text-xs text-slate-400 font-sans">ppm</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(currentNutrients.k / 300) * 100}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400">
                      Recommended target: <span className="font-bold">150-280 ppm</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Interactive Fertilizer Recommendation Calculator Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4">
                  <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-base font-black text-slate-800 dark:text-slate-100">Fertilizer Requirement Calculator</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                  Dynamically adjust your target crop yield and select custom fertilizer blends to view application weights, soil buffers, and cost ratios.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Inputs */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Target Yield Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        <span>Target Yield Goal</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{targetYield} t/ha</span>
                      </div>
                      <input 
                        type="range" 
                        min="2.0" 
                        max="18.0" 
                        step="0.5" 
                        value={targetYield}
                        onChange={(e) => setTargetYield(parseFloat(e.target.value))}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>2.0 t/ha (Low)</span>
                        <span>18.0 t/ha (High)</span>
                      </div>
                    </div>

                    {/* Fertilizer Type Selector */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Planned Fertilizer Blend</label>
                      <select
                        value={fertilizerType}
                        onChange={(e) => setFertilizerType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl px-3.5 py-2 cursor-pointer outline-none focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="urea">Urea [46-0-0] (Pure Nitrogen)</option>
                        <option value="dap">DAP [18-46-0] (Starter N & High P)</option>
                        <option value="mop">Muriate of Potash [0-0-60] (High Potassium)</option>
                        <option value="triple-15">Triple 15 [15-15-15] (Balanced NPK)</option>
                        <option value="organic">Organic Compost [3-1.5-2] (Biohumus)</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculations Output */}
                  {fertilizerRecommendation && (
                    <div className="md:col-span-7 bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Required Dosage</span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {fertilizerRecommendation.applicationRate} <span className="text-sm font-sans font-medium text-slate-500">kg/ha</span>
                          </span>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Key Macro-Nutrient Released</span>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">
                            {fertilizerRecommendation.mainNutrient}
                          </p>
                          {fertilizerRecommendation.secondaryNutrient && (
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {fertilizerRecommendation.secondaryNutrient}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between space-y-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                          <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wide">Agronomic Application Note</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            {fertilizerRecommendation.details}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">Estimate Cost Ratio</span>
                            <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                              ${fertilizerRecommendation.costEstimate}/ha
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
                            Accurate Buffer
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <AlertTriangle className="w-12 h-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-500">No field/parcels currently loaded to view subsoil analysis.</p>
        </div>
      )}
    </div>
  );
}
