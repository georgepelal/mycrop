import React, { useState } from "react";
import { ArrowLeft, Loader2, Satellite, Leaf, Droplets, Info, Sun, Beaker } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface CopernicusReflectanceProps {
  onNavigate: (page: string) => void;
}

interface IndexTimeline {
  ndvi: number;
  ndwi: number;
  bareSoilReflectance: number;
  classification: string;
}

interface ReflectanceData {
  latitude: number;
  longitude: number;
  isEstimate: boolean;
  indexTimeline: IndexTimeline;
  recommendedWavelengthsNano: {
    band8_NearInfrared: number;
    band4_Red: number;
    band3_Green: number;
  };
  apiCitation: string;
}

export default function CopernicusReflectance({ onNavigate }: CopernicusReflectanceProps) {
  const [data, setData] = useState<ReflectanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/copernicus-sentinel-reflectance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to compile Satellite Sentinel-2 surface reflectance vectors");
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

  const getNdviColor = (ndvi: number) => {
    if (ndvi > 0.6) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (ndvi > 0.35) return "text-lime-600 bg-lime-50 border-lime-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  const getNdwiColor = (ndwi: number) => {
    if (ndwi > 0.4) return "text-blue-600 bg-blue-50 border-blue-200";
    if (ndwi > 0.2) return "text-sky-600 bg-sky-50 border-sky-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
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
              <Satellite className="w-7 h-7 text-indigo-500" />
              Reflectance Estimate
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Location-based vegetation and soil optics estimate (not live satellite imagery).
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
          <Satellite className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Get a location-based estimate of normalized difference vegetation and water indices.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Computing reflectance index estimate...
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

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
               <div className={`col-span-1 rounded-xl p-5 border flex flex-col justify-between ${getNdviColor(data.indexTimeline.ndvi)} bg-opacity-10 shadow-inner`}>
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                     <Leaf className="w-5 h-5" />
                     <h3 className="font-bold text-xs uppercase tracking-widest">NDVI (Vegetation)</h3>
                  </div>
                  <div className="text-5xl font-black mb-2">{data.indexTimeline.ndvi.toFixed(2)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Optimum Health Base (0-1)</div>
               </div>

               <div className={`col-span-1 border rounded-xl p-5 flex flex-col justify-between ${getNdwiColor(data.indexTimeline.ndwi)} bg-opacity-10 shadow-inner`}>
                  <div className="flex items-center gap-2 mb-4 opacity-80">
                     <Droplets className="w-5 h-5" />
                     <h3 className="font-bold text-xs uppercase tracking-widest">NDWI (Water)</h3>
                  </div>
                  <div className="text-5xl font-black mb-2">{data.indexTimeline.ndwi.toFixed(2)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Canopy Moisture Base (-1-1)</div>
               </div>

               <div className="col-span-1 bg-stone-50 border border-stone-200 text-stone-800 rounded-xl p-5 flex flex-col justify-between shadow-inner">
                  <div className="flex items-center gap-2 mb-4 opacity-60">
                     <Sun className="w-5 h-5" />
                     <h3 className="font-bold text-xs uppercase tracking-widest text-stone-600">Salinity / Bare Soil</h3>
                  </div>
                  <div className="text-5xl font-black mb-2 text-stone-700">{data.indexTimeline.bareSoilReflectance.toFixed(2)}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-50">Reflectance Interference</div>
               </div>
             </div>

             <div className="mt-6 pt-5 border-t border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Beaker className="w-4 h-4" /> Classifier 
                  </span>
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                    {data.indexTimeline.classification}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-center">
                     <div className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">Band 8 (NIR)</div>
                     <div className="text-slate-300 font-mono text-sm font-semibold">{data.recommendedWavelengthsNano.band8_NearInfrared} nm</div>
                   </div>
                   <div className="text-center">
                     <div className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">Band 4 (Red)</div>
                     <div className="text-slate-300 font-mono text-sm font-semibold">{data.recommendedWavelengthsNano.band4_Red} nm</div>
                   </div>
                   <div className="text-center">
                     <div className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-1">Band 3 (Green)</div>
                     <div className="text-slate-300 font-mono text-sm font-semibold">{data.recommendedWavelengthsNano.band3_Green} nm</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 text-amber-800">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Estimate, not a measurement</strong>
              {data.apiCitation}
            </div>
          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Raw Response Payload</h4>
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
