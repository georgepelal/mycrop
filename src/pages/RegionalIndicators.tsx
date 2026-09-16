import React, { useState } from "react";
import { ArrowLeft, Loader2, Globe2, Sun, Building, Leaf, Info, Factory, ActivitySquare } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface RegionalIndicatorsProps {
  onNavigate: (page: string) => void;
}

interface IndicatorData {
  latitude: number;
  longitude: number;
  countryCode: string;
  countryName: string;
  localityName: string;
  macroStats: {
    agLandPct: number;
    fertilizerKgHectare: number;
    arableLandPct: number;
    ruralPopPct: number;
  };
  daylight: {
    sunrise: string;
    sunset: string;
    dayLengthHours: string;
    dayLengthSeconds: number;
    solarNoon: string;
  };
  seismic: {
    stressLevel: string;
    events: any[];
  };
  policyAdvice: string;
  citations: Record<string, string>;
}

export default function RegionalIndicators({ onNavigate }: RegionalIndicatorsProps) {
  const [data, setData] = useState<IndicatorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
       const response = await fetch("/api/macro-national", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to compute macro-analytics");
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
              <Globe2 className="w-7 h-7 text-indigo-600" />
              Regional Indicators
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Macro national policy, civil daylight, and tectonic stress indices.
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

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <Building className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Execute a macro-analytics sweep retrieving World Bank agrarian economics, exact photoperiod, and USGS localized stratigraphy.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Compiling macro-national datasets and agronomic guidance...
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

          <div className="bg-indigo-900 border border-indigo-800 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white flex flex-col md:flex-row gap-6">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

             <div className="flex-1 space-y-4 relative z-10">
               <div className="flex items-center gap-2 text-indigo-300">
                 <Building className="w-5 h-5" />
                 <h2 className="font-bold text-xs uppercase tracking-widest">Macro Policy Analysis</h2>
               </div>
               <p className="text-indigo-50 leading-relaxed text-sm md:text-base text-justify">
                 {data.policyAdvice}
               </p>
             </div>

             <div className="md:w-64 bg-black/20 p-5 rounded-xl border border-white/10 shrink-0 relative z-10 flex flex-col justify-center text-center">
                 <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Geocoded Target</div>
                 <h3 className="text-2xl font-black text-white leading-tight break-words">{data.localityName}</h3>
                 <div className="mt-2 text-indigo-100/60 font-semibold text-sm flex items-center justify-center gap-1.5">
                   {data.countryName} <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">{data.countryCode}</span>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Agronomic Land Use */}
             <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center gap-2 mb-4 text-emerald-600 opacity-80 border-b border-gray-100 pb-2">
                 <Leaf className="w-4 h-4" />
                 <h3 className="font-bold text-[10px] uppercase tracking-widest">Areal Base</h3>
               </div>
               <div className="space-y-3">
                 <div className="flex justify-between items-end">
                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ag Land</div>
                   <div className="font-black text-xl text-slate-800">{data.macroStats.agLandPct.toFixed(1)}%</div>
                 </div>
                 <div className="flex justify-between items-end">
                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Arable Ratio</div>
                   <div className="font-black text-xl text-slate-800">{data.macroStats.arableLandPct.toFixed(1)}%</div>
                 </div>
                 <div className="flex justify-between items-end">
                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rural Pop</div>
                   <div className="font-black text-xl text-slate-800">{data.macroStats.ruralPopPct.toFixed(1)}%</div>
                 </div>
               </div>
             </div>

             {/* Soil Chemistry Base */}
             <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
               <div className="flex items-center gap-2 mb-4 text-amber-600 opacity-80 border-b border-gray-100 pb-2">
                 <Factory className="w-4 h-4" />
                 <h3 className="font-bold text-[10px] uppercase tracking-widest">Synthetic NPK Index</h3>
               </div>
               <div className="flex flex-col justify-center h-full pb-4">
                  <div className="text-4xl font-black text-amber-600 text-center">{data.macroStats.fertilizerKgHectare.toFixed(1)}</div>
                  <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">kg / Hectare</div>
               </div>
             </div>
             
             {/* Tectonic Stress */}
             <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
               <div className="flex items-center gap-2 mb-4 text-rose-600 opacity-80 border-b border-gray-100 pb-2">
                 <ActivitySquare className="w-4 h-4" />
                 <h3 className="font-bold text-[10px] uppercase tracking-widest">Tectonic Plate Stress</h3>
               </div>
               <div className="flex flex-col justify-center h-full pb-4 items-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${data.seismic.stressLevel.includes("Low") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                    {data.seismic.stressLevel}
                  </span>
                  <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Events <span className="text-slate-600">({data.seismic.events.length})</span></div>
               </div>
             </div>
          </div>

          {/* Astronomical Photoperiod */}
          <div className="bg-stone-50 border border-stone-200 text-stone-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
             <div className="flex items-center justify-center bg-white border border-stone-200 w-16 h-16 rounded-2xl shadow-sm shrink-0">
               <Sun className="w-8 h-8 text-amber-500" />
             </div>
             <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 pl-1">Sunrise</div>
                  <div className="font-mono font-semibold text-lg">{data.daylight.sunrise}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 pl-1">Sunset</div>
                  <div className="font-mono font-semibold text-lg">{data.daylight.sunset}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 pl-1">Solar Noon</div>
                  <div className="font-mono font-semibold text-lg text-amber-600">{data.daylight.solarNoon}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 pl-1">Day Length</div>
                  <div className="font-mono font-black text-lg text-indigo-600">{data.daylight.dayLengthHours}</div>
                </div>
             </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-xs leading-relaxed space-y-1">
              <strong className="block text-sm mb-1">Index Registries</strong> 
              {Object.entries(data.citations).map(([key, value]) => (
                <div key={key}><span className="font-semibold capitalize text-slate-500">{key}:</span> {value}</div>
              ))}
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
                <pre className="p-4 bg-slate-900 text-indigo-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
