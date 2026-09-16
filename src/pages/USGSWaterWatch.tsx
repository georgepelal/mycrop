import React, { useState } from "react";
import { ArrowLeft, Loader2, Gauge, Waves, Info, Network } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface USGSWaterWatchProps {
  onNavigate: (page: string) => void;
}

interface Station {
  siteName: string;
  siteCode: string;
  latitude?: number;
  longitude?: number;
  parameter: string;
  latestValue: number;
  unit: string;
}

interface USGSData {
  latitude: number;
  longitude: number;
  isLiveUsgsHydrology: boolean;
  stations: Station[];
  apiCitation: string;
}

export default function USGSWaterWatch({ onNavigate }: USGSWaterWatchProps) {
  const [data, setData] = useState<USGSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/usgs-hydrology-waterwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to resolve USGS water monitoring structures");
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
              <Gauge className="w-7 h-7 text-sky-600" />
              USGS WaterWatch
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              National Water Information System (NWIS) stream gauge telemetry.
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
          <Gauge className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query the USGS national telemetry network for immediate local river flows, weir stage heights, and aquifer piezometer metrics.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Identifying USGS hydrologic gauges in the geographical quadrant...
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

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 px-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <Network className="w-4 h-4 text-sky-500" />
            Discovered {data.stations.length} Telemetry Nodes
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.stations.map((station, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col">
                 <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-sky-50 rounded-xl">
                       <Waves className="w-6 h-6 text-sky-500" />
                    </div>
                    <div>
                       <h3 className="text-sm border-b pb-1 font-bold text-slate-800 leading-tight">
                         {station.siteName}
                       </h3>
                       <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                            SID: {station.siteCode}
                         </span>
                       </div>
                    </div>
                 </div>

                 <div className="mt-2 pl-[4.5rem]">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">
                      {station.parameter}
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-700">{station.latestValue}</span>
                      <span className="text-sm font-bold text-sky-600">{station.unit}</span>
                    </div>
                 </div>
              </div>
            ))}

            {data.stations.length === 0 && (
              <div className="col-span-full py-16 text-center flex flex-col items-center border border-dashed border-slate-200 bg-slate-50 rounded-2xl">
                <Gauge className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700">No Gauges in Proximity</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">The USGS NWIS system has no active mechanical flow telemetry or hydrological piezometers within this spatial bounding box.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Telemetry Origin Protocol</strong> 
              {data.apiCitation}
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
                <pre className="p-4 bg-slate-900 text-cyan-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
