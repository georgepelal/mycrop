import React, { useState } from "react";
import { ArrowLeft, Loader2, AlertTriangle, ShieldCheck, Map, Info, Waves, Wind } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface GdacsActiveHazardsProps {
  onNavigate: (page: string) => void;
}

interface Hazard {
  id: string;
  name: string;
  type: string;
  severity: string;
  level: string;
  distanceKm: number;
  date: string;
}

interface GdacsData {
  latitude: number;
  longitude: number;
  isLiveGdacs: boolean;
  hazards: Hazard[];
  apiCitation: string;
}

export default function GdacsActiveHazards({ onNavigate }: GdacsActiveHazardsProps) {
  const [data, setData] = useState<GdacsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/gdacs-active-hazards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to resolve active global natural threats");
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

  const getAlertColor = (level: string) => {
    const l = level.toLowerCase();
    if (l === "red" || l.includes("high")) return "bg-rose-50 border-rose-200 text-rose-900";
    if (l === "orange") return "bg-orange-50 border-orange-200 text-orange-900";
    if (l === "yellow" || l === "amber") return "bg-amber-50 border-amber-200 text-amber-900";
    return "bg-emerald-50 border-emerald-200 text-emerald-900";
  };

  const getAlertBadgeColor = (level: string) => {
    const l = level.toLowerCase();
    if (l === "red" || l.includes("high")) return "bg-rose-500 text-white";
    if (l === "orange") return "bg-orange-500 text-white";
    if (l === "yellow" || l === "amber") return "bg-amber-500 text-white";
    return "bg-emerald-500 text-white";
  };

  const getEventIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("tsunami") || t.includes("flood")) return <Waves className="w-5 h-5 opacity-70" />;
    if (t.includes("cyclone") || t.includes("wind") || t.includes("storm")) return <Wind className="w-5 h-5 opacity-70" />;
    return <AlertTriangle className="w-5 h-5 opacity-70" />;
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
              <ShieldCheck className="w-7 h-7 text-red-600" />
              GDACS Active Hazards
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Global Disaster Alert and Coordination System (UN & EU Joint Center).
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
          <ShieldCheck className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Continuously monitor for severe humanitarian crises, geological instabilities, and extreme atmospheric shifts within a 1,000km radius.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Querying active GDACS satellite warnings...
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
            <Map className="w-4 h-4 text-slate-400" />
            Hazards Within 1,000 km Radius
            
          </div>

          {data.hazards.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 shadow-sm flex flex-col items-center text-center">
              <ShieldCheck className="w-16 h-16 text-emerald-400 mb-4" />
              <h3 className="text-xl font-bold text-emerald-900 mb-2">No Severe Hazards Detected</h3>
              <p className="text-emerald-700 text-sm max-w-md">
                The global early warning network reports zero severe imminent threats within 1,000 kilometers of this coordinate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.hazards.map(hazard => (
                <div key={hazard.id} className={`border rounded-2xl p-5 shadow-sm transition-all ${getAlertColor(hazard.level)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${getAlertBadgeColor(hazard.level)}`}>
                      {hazard.level} ALERT
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      ID: {hazard.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 pr-4 text-balance">
                    {hazard.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-4 opacity-80 font-semibold text-sm">
                    {getEventIcon(hazard.type)}
                    {hazard.type}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4 border-t border-black/5 pt-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">Distance</div>
                      <div className="font-black font-mono text-base">{hazard.distanceKm} <span className="text-xs">km</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mb-0.5">Onset Date</div>
                      <div className="font-bold text-sm leading-tight">{new Date(hazard.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">UN & EU Disaster Charter</strong> 
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
