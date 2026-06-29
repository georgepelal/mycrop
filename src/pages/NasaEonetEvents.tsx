import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Globe, AlertTriangle, Flame, Mountain, CloudLightning, Info } from "lucide-react";

interface NasaEonetEventsProps {
  onNavigate: (page: string) => void;
}

interface EonetEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  coordinates: { lat: number; lng: number } | null;
  link: string;
}

interface EonetData {
  isLiveNasaEonet: boolean;
  events: EonetEvent[];
  apiCitation: string;
}

export default function NasaEonetEvents({ onNavigate }: NasaEonetEventsProps) {
  const [data, setData] = useState<EonetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJSON, setShowRawJSON] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/nasa-eonet-active-events", {
        method: "GET"
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to retrieve NASA planetary events");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Raw API JSON payload copied to clipboard!");
    }
  };

  const getEventIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("fire")) return <Flame className="w-5 h-5 text-rose-500" />;
    if (cat.includes("volcano")) return <Mountain className="w-5 h-5 text-orange-500" />;
    if (cat.includes("storm") || cat.includes("flood")) return <CloudLightning className="w-5 h-5 text-blue-500" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  };

  const getEventColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("fire")) return "bg-rose-50 border-rose-100";
    if (cat.includes("volcano")) return "bg-orange-50 border-orange-100";
    if (cat.includes("storm") || cat.includes("flood")) return "bg-blue-50 border-blue-100";
    return "bg-amber-50 border-amber-100";
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
              <Globe className="w-7 h-7 text-indigo-600" />
              NASA EONET Events
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Active planetary climatic hazards and severe biosphere alerts.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Connecting to NASA Earth Observatory data feeds...
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
            <Globe className="w-4 h-4 text-indigo-500" />
            Tracking {data.events.length} Global Hazards
            
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.events.map(ev => (
              <a 
                key={ev.id} 
                href={ev.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group ${getEventColor(ev.category)} cursor-pointer relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/40 transition-colors" />
                <div>
                   <div className="flex justify-between items-start mb-3 relative z-10">
                     <span className="bg-white/80 backdrop-blur text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                       {getEventIcon(ev.category)}
                       {ev.category}
                     </span>
                     <span className="text-[10px] text-slate-500 bg-white/60 px-2 py-1 rounded font-mono">
                        {new Date(ev.date).toLocaleDateString()}
                     </span>
                   </div>
                   <h3 className="font-bold text-slate-800 leading-snug text-lg relative z-10 pr-4">
                     {ev.title}
                   </h3>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-600 font-medium relative z-10">
                  <div className="flex items-center gap-2 bg-white/50 px-2.5 py-1.5 rounded-lg">
                    <span>ID: {ev.id.split("_").pop() || ev.id}</span>
                  </div>
                  {ev.coordinates && (
                    <div className="font-mono text-[10px] bg-white/50 px-2 py-1 rounded">
                      {ev.coordinates.lat.toFixed(2)}, {ev.coordinates.lng.toFixed(2)}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Earth Observatory Natural Event Tracker</strong> 
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
