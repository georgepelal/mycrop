import React, { useState } from "react";
import { ArrowLeft, Loader2, Flame, Wind, Droplets, Calendar, Info, ShieldAlert } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface CroplandFireRiskProps {
  onNavigate: (page: string) => void;
}

interface FireRiskData {
  latitude: number;
  longitude: number;
  kbdiScore: number;
  riskRating: "Low" | "Moderate" | "High" | "Extremely Combustive";
  windSpeedKph: number;
  humidityPercentage: number;
  excessDrySpellDays: number;
  combustibleMaterialClass: string;
  isLiveFire: boolean;
  algorithmDisclaimer: string;
}

export default function CroplandFireRisk({ onNavigate }: CroplandFireRiskProps) {
  const [data, setData] = useState<FireRiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [annualPrecip, setAnnualPrecip] = useState<number>(850);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/cropland-fire-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, annualPrecip })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to compute cropland fire risk and KBDI rating");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    fetchData(lat, lng, name);
  };

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Raw API JSON payload copied to clipboard!");
    }
  };

  // KBDI Indicator Calculation
  // KBDI scales from 0 (saturated) to 800 (extremely dry)
  const getKbdiPercentage = (score: number) => {
    return Math.min(100, Math.max(0, (score / 800) * 100));
  };

  const getKbdiColor = (score: number) => {
    if (score >= 600) return "bg-rose-600";
    if (score >= 400) return "bg-orange-500";
    if (score >= 200) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getKbdiTextClass = (score: number) => {
    if (score >= 600) return "text-rose-600";
    if (score >= 400) return "text-orange-500";
    if (score >= 200) return "text-amber-500";
    return "text-emerald-600";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between lg:pr-8">
        <div className="flex items-center gap-4 border-b border-transparent pb-2">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Flame className="w-7 h-7 text-rose-500" />
              Cropland Fire Risk
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Keetch-Byram Drought Index (KBDI) and dynamic flammability potential meters.
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-96">
          <LocationSearch 
            onLocationSelect={handleLocationSelect} 
            placeholder="Search anywhere..." 
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm max-w-xl">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Mean Annual Precipitation Estimate (mm)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={annualPrecip}
            onChange={(e) => setAnnualPrecip(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            placeholder="e.g. 850"
          />
          <span className="text-xs text-slate-400 font-medium">Used for direct KBDI soil-moisture calibrations.</span>
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <Flame className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Analyze fuel moisture deprivation thresholds and meteorological metrics indicating high-exposure wildfire thresholds.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Estimating moisture loss parameters in vegetative fuel layers...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          Error: {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className={`border rounded-2xl p-5 shadow-sm col-span-1 flex flex-col justify-between ${
              data.riskRating === 'Extremely Combustive' ? 'bg-red-50 border-red-100 text-red-900' :
              data.riskRating === 'High' ? 'bg-orange-50 border-orange-100 text-orange-900' :
              data.riskRating === 'Moderate' ? 'bg-amber-50 border-amber-100 text-amber-900' :
              'bg-emerald-50 border-emerald-100 text-emerald-950'
            }`}>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  data.riskRating === 'Extremely Combustive' ? 'text-red-500' :
                  data.riskRating === 'High' ? 'text-orange-500' :
                  data.riskRating === 'Moderate' ? 'text-amber-500' :
                  'text-emerald-500'
                }`}>
                  Combustive Risk Assessment
                </div>
                <div className="text-4xl font-black py-2 leading-tight">
                  {data.riskRating}
                </div>
              </div>
              <div className="text-xs font-semibold leading-relaxed mt-4 bg-white/75 backdrop-blur-sm p-3 rounded-xl border border-black/5">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Fuel Status Info:</span>
                {data.combustibleMaterialClass}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm col-span-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Keetch-Byram Drought Index (KBDI)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-black ${getKbdiTextClass(data.kbdiScore)}`}>
                    {data.kbdiScore}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 800 maximum dryness</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-1.5">
                  <span>Fully Saturated Soil (0)</span>
                  <span>Critical Moisture Deficit (800)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getKbdiColor(data.kbdiScore)}`}
                    style={{ width: `${getKbdiPercentage(data.kbdiScore)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
              <Flame className="w-5 h-5 text-rose-500" />
              Meteorological Ignition Factors
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                  <Wind className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Max Wind Speed
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {data.windSpeedKph} <span className="text-xs font-bold text-slate-400">km/h</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Mean Air Humidity
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {data.humidityPercentage} <span className="text-xs font-bold text-slate-400">% RH</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Recent Dry Streak
                  </div>
                  <div className="text-xl font-bold text-slate-800">
                    {data.excessDrySpellDays} <span className="text-xs font-bold text-slate-400">days</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Standard Reference Logic</strong> 
              {data.algorithmDisclaimer}
            </div>
          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Raw API Response Payload</h4>
              </div>
              <button 
                onClick={() => setShowRawJSON(!showRawJSON)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-700 transition"
              >
                {showRawJSON ? "Hide Payload" : "Inspect Payload"}
              </button>
            </div>

            {showRawJSON && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button 
                    onClick={handleCopyJSON}
                    className="px-2.5 py-1 text-[11px] font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green/20 rounded-md transition"
                  >
                    Copy JSON to Clipboard
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-red-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
