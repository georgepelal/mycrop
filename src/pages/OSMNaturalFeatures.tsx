import React, { useState } from "react";
import { ArrowLeft, Loader2, Map as MapIcon, Trees, Droplets, MapPin, Info, Compass, AlertTriangle } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface OSMNaturalProps {
  onNavigate: (page: string) => void;
}

interface Feature {
  id: number;
  type: string;
  lat: number;
  lon: number;
  featureClass: string;
  name: string;
}

interface OSMData {
  latitude: number;
  longitude: number;
  isLiveOsmFeatures: boolean;
  features: Feature[];
  apiCitation: string;
}

export default function OSMNaturalFeatures({ onNavigate }: OSMNaturalProps) {
  const [data, setData] = useState<OSMData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/osm-local-natural-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to query local geospatial natural structures");
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

  const getFeatureIcon = (featureClass: string) => {
    const cls = featureClass.toLowerCase();
    if (cls.includes("water")) return <Droplets className="w-6 h-6 text-blue-500" />;
    if (cls.includes("wood") || cls.includes("forest")) return <Trees className="w-6 h-6 text-emerald-500" />;
    return <MapPin className="w-6 h-6 text-slate-500" />;
  };

  const getFeatureBgColors = (featureClass: string) => {
    const cls = featureClass.toLowerCase();
    if (cls.includes("water")) return "bg-blue-50 border-blue-200";
    if (cls.includes("wood") || cls.includes("forest")) return "bg-emerald-50 border-emerald-200";
    return "bg-slate-50 border-slate-200";
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
              <MapIcon className="w-7 h-7 text-indigo-500" />
              OSM Natural Features
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Local waterways, woodlands, and spatial barriers from OpenStreetMap grids.
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
          <Compass className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Execute geospatial boundary scans via Overpass API to detect structural environmental zones such as forests and water networks bounding a parcel.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning Overpass Node networks...
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

          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Identified Environments
            </div>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.features.map(f => (
              <div key={f.id} className={`border rounded-2xl p-5 shadow-sm transition-all flex flex-col ${getFeatureBgColors(f.featureClass)}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/60 p-2 rounded-xl shadow-sm border border-black/5">
                    {getFeatureIcon(f.featureClass)}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white/50 px-2 py-1 rounded">
                    {f.type}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">
                  {f.name}
                </h3>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 opacity-80">
                  {f.featureClass}
                </p>
                
                <div className="mt-auto border-t border-black/5 pt-3 flex justify-between items-center font-mono text-[10px] text-slate-500 bg-white/30 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                   <span>{f.lat.toFixed(4)}, {f.lon.toFixed(4)}</span>
                   <span>ID: {f.id}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Geospatial Mapping Standard</strong> 
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
