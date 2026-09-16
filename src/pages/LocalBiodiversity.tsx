import React, { useState } from "react";
import { ArrowLeft, Loader2, Bug, Trees, Flower2, Bird, Hexagon, Sprout } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface LocalBiodiversityProps {
  onNavigate: (page: string) => void;
}

interface Sighting {
  id: string;
  scientificName: string;
  commonName: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
  latitude: number;
  longitude: number;
  eventDate: string;
  basisOfRecord: string;
  imageUrl: string | null;
  icon: string;
  recordedBy: string;
  description?: string;
}

interface BiodiversityData {
  latitude: number;
  longitude: number;
  sightings: Sighting[];
  pollinatorCount: number;
  predatoryAgentCount: number;
  floraCount: number;
  isLiveGbif: boolean;
  ecologicalAdvice: string;
  apiCitation: string;
}

export default function LocalBiodiversity({ onNavigate }: LocalBiodiversityProps) {
  const [data, setData] = useState<BiodiversityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/local-biodiversity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to retrieve bio-diversity data");
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
              <Bug className="w-7 h-7 text-fuchsia-600" />
              Local Biodiversity
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              GBIF species occurrences and citizen-science census mapping.
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
          <Trees className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query the Global Biodiversity Information Facility (GBIF) for localized plant, pollinator, and avian occurrences defining the ecological buffer.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-fuchsia-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Mining GBIF occurrence grids...
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

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 lg:items-center">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-fuchsia-600 mb-2">
                <Hexagon className="w-5 h-5 fill-current opacity-20" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Agronomic Ecological Impact</h3>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed text-justify">
                {data.ecologicalAdvice}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm text-center">
               <div className="flex justify-center mb-2"><Flower2 className="w-6 h-6 text-amber-500" /></div>
               <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Live Pollinators</div>
               <div className="text-3xl font-black text-amber-900">{data.pollinatorCount}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm text-center">
               <div className="flex justify-center mb-2"><Sprout className="w-6 h-6 text-emerald-500" /></div>
               <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Native Flora Allies</div>
               <div className="text-3xl font-black text-emerald-900">{data.floraCount}</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm text-center">
               <div className="flex justify-center mb-2"><Bird className="w-6 h-6 text-rose-500" /></div>
               <div className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Biological Predators</div>
               <div className="text-3xl font-black text-rose-900">{data.predatoryAgentCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.sightings.map(s => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-full">
                <div>
                   <div className="flex justify-between items-start mb-2">
                     <span className="text-3xl leading-none">{s.icon}</span>
                     <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                       {s.class}
                     </span>
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm leading-tight text-balance group-hover:text-fuchsia-600 transition-colors">
                     {s.commonName}
                   </h4>
                   <div className="text-xs text-slate-500 italic mt-0.5">
                     {s.scientificName}
                   </div>
                   {s.description && (
                      <p className="text-[10px] text-slate-600 mt-2 leading-relaxed font-medium">
                        {s.description}
                      </p>
                   )}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-dashed border-slate-100 pt-2">
                   <span>{s.eventDate}</span>
                   <span className="truncate max-w-[80px]" title={s.recordedBy}>{s.recordedBy}</span>
                </div>
              </div>
            ))}
          </div>

          

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-700 text-sm leading-relaxed">
             <strong className="block mb-1">Citation</strong> 
             {data.apiCitation}
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
                <pre className="p-4 bg-slate-900 text-fuchsia-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
