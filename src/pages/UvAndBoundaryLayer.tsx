import React, { useState } from "react";
import { ArrowLeft, Loader2, Sun, Wind, CloudFog, FileJson, Info, AlertTriangle } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface UvBoundaryLayerProps {
  onNavigate: (page: string) => void;
}

interface UVData {
  latitude: number;
  longitude: number;
  isLiveUv: boolean;
  uvIndexMax: number;
  uvIndexClearSkyMax: number;
  riskLevel: string;
  apiCitation: string;
}

interface BoundaryLayerData {
  latitude: number;
  longitude: number;
  isLiveBoundaryLayer: boolean;
  aerodynamics: {
    boundaryLayerHeightMeters: number;
    windGustsAt10mMeterPerSec: number;
    meanSeaLevelPressureHpa: number;
    thermalTurbulenceState: string;
  };
  apiCitation: string;
}

interface CombinedData {
  uv: UVData | null;
  boundary: BoundaryLayerData | null;
}

export default function UvAndBoundaryLayer({ onNavigate }: UvBoundaryLayerProps) {
  const [data, setData] = useState<CombinedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const payload = { lat, lng };
      
      const uvResponse = fetch("/api/openmeteo-uv-radiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const boundaryResponse = fetch("/api/openmeteo-boundary-layer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const [uvRes, boundaryRes] = await Promise.all([uvResponse, boundaryResponse]);

      if (!uvRes.ok || !boundaryRes.ok) {
        throw new Error("Failed to fetch atmospheric radiation data");
      }

      const uvJson = await uvRes.json();
      const boundaryJson = await boundaryRes.json();
      
      setData({
        uv: uvJson,
        boundary: boundaryJson
      });
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
              <Sun className="w-7 h-7 text-orange-500" />
              UV Radiation & Boundary Layer
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Forecast clear sky insolation and planetary boundary layer turbulence.
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
          <CloudFog className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query both real-time ultraviolet radiation risks and planetary boundary layer atmospheric metrics for a given geographical coordinate.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning regional atmospheric boundary layer conditions...
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Current UV Index Max
              </div>
              <div className="text-3xl font-black text-orange-500">
                {data.uv?.uvIndexMax}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-orange-500" />
                Clear sky max: {data.uv?.uvIndexClearSkyMax}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                UV Risk Level
              </div>
              <div className="text-xl font-bold text-rose-600 truncate">
                {data.uv?.riskLevel}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Solar radiation risk
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Boundary Layer Height
              </div>
              <div className="text-3xl font-black text-blue-600">
                {data.boundary?.aerodynamics.boundaryLayerHeightMeters} <span className="text-sm font-medium text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <CloudFog className="w-3.5 h-3.5 text-blue-500" />
                {data.boundary?.aerodynamics.thermalTurbulenceState}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Wind Gust Shear
              </div>
              <div className="text-3xl font-black text-cyan-600 truncate">
                {data.boundary?.aerodynamics.windGustsAt10mMeterPerSec} <span className="text-sm font-medium text-slate-400">m/s</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-cyan-500" />
                Mean Sea Level Pres: {data.boundary?.aerodynamics.meanSeaLevelPressureHpa} hPa
              </div>
            </div>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 text-orange-900">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />
              <div className="text-sm leading-relaxed">
                <strong>UV Index Metric: </strong> 
                {data.uv?.apiCitation}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900">
              <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
              <div className="text-sm leading-relaxed">
                <strong>Boundary Layer Dynamics: </strong> 
                {data.boundary?.apiCitation}
              </div>
            </div>
          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Combined API Response Payload</h4>
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
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
