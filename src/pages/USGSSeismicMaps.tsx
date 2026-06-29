import React, { useState } from "react";
import { ArrowLeft, Loader2, Activity, MapPin, Layers, Info, Navigation, AlertTriangle } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface USGSSeismicProps {
  onNavigate: (page: string) => void;
}

interface SeismicEvent {
  id: string;
  place: string;
  magnitude: number;
  time: string;
  tsunami: boolean;
  depthKm: number;
  feltCount: number;
}

interface SeismicData {
  latitude: number;
  longitude: number;
  isLiveUsgsSeismic: boolean;
  events: SeismicEvent[];
  apiCitation: string;
}

export default function USGSSeismicMaps({ onNavigate }: USGSSeismicProps) {
  const [data, setData] = useState<SeismicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/usgs-seismic-radial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to assemble geological seismic strain");
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

  const getMagnitudeColor = (mag: number) => {
    if (mag >= 5.0) return "bg-rose-50 border-rose-200 text-rose-900";
    if (mag >= 3.0) return "bg-amber-50 border-amber-200 text-amber-900";
    return "bg-slate-50 border-slate-200 text-slate-800";
  };

  const getMagnitudeBadgeColor = (mag: number) => {
    if (mag >= 5.0) return "bg-rose-600";
    if (mag >= 3.0) return "bg-amber-500";
    return "bg-slate-500";
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
              <Activity className="w-7 h-7 text-rose-700" />
              USGS Seismic Maps
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Earthquake Hazard Program telemetry within 350km radial grids.
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
          <Activity className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query the United States Geological Survey network for subterranean tectonic shifting events and micro-tremors in this region.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Requesting radial telemetry from the USGS Earthquake Hazards Program...
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
            <Navigation className="w-4 h-4 text-slate-400" />
            Detected {data.events.length} Seismic Tremors
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.events.map((ev, index) => (
              <div key={index} className={`border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${getMagnitudeColor(ev.magnitude)}`}>
                <div>
                   <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-sm flex items-center gap-1 ${getMagnitudeBadgeColor(ev.magnitude)}`}>
                        M {ev.magnitude.toFixed(1)}
                      </span>
                      <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest">
                        {ev.time}
                      </span>
                   </div>
                   <h3 className="font-bold text-slate-800 leading-snug text-sm tracking-tight mb-4 break-words">
                     {ev.place}
                   </h3>
                </div>

                <div className="space-y-3 pt-3 border-t border-black/5 opacity-80 mt-auto">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Depth</span>
                      <span>{ev.depthKm.toFixed(1)} km</span>
                    </div>
                    {ev.feltCount > 0 && (
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Felt By</span>
                        <span>{ev.feltCount} citizens</span>
                      </div>
                    )}
                    {ev.tsunami && (
                      <div className="flex justify-between items-center text-xs font-semibold text-rose-600 bg-rose-100/50 px-2 py-1 rounded">
                        <span>Tsunami Alert</span>
                        <span>True</span>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Earthquake Hazard Program Source</strong> 
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
                <pre className="p-4 bg-slate-900 text-stone-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
