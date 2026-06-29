import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Globe, AlertTriangle, Info, CloudFog } from "lucide-react";

interface GreenhouseProps {
  onNavigate: (page: string) => void;
}

interface GreenhouseData {
  isLiveGasTrends: boolean;
  traceAtmosphere: {
    co2Ppm: number;
    methanePpb: number;
    nitrousOxidePpb: number;
    description: string;
  };
  apiCitation: string;
}

export default function GlobalGreenhouseGas({ onNavigate }: GreenhouseProps) {
  const [data, setData] = useState<GreenhouseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/global-greenhouse-gas-trends");
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch greenhouse gas trends data");
      }
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Raw API JSON payload copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-transparent pb-2 lg:pr-8">
        <button 
          onClick={() => onNavigate("field-overview")}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Globe className="w-7 h-7 text-emerald-500" />
            Global Greenhouse Gas Trends
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Global trace gas concentration values tracking anthropogenically-induced planetary climate metrics.
          </p>
        </div>
      </div>

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm px-4 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Fetching global trace gas concentrations...
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Carbon Dioxide (CO₂)
              </div>
              <div className="text-4xl font-black text-rose-600">
                {data.traceAtmosphere.co2Ppm} <span className="text-sm font-semibold text-slate-400">ppm</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Global Average Concentration
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Methane (CH₄)
              </div>
              <div className="text-4xl font-black text-amber-500">
                {data.traceAtmosphere.methanePpb} <span className="text-sm font-semibold text-slate-400">ppb</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <CloudFog className="w-3.5 h-3.5 text-amber-500" />
                Global Average Concentration
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nitrous Oxide (N₂O)
              </div>
              <div className="text-4xl font-black text-emerald-600">
                {data.traceAtmosphere.nitrousOxidePpb} <span className="text-sm font-semibold text-slate-400">ppb</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                Global Average Concentration
              </div>
            </div>
            
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <div className="text-sm leading-relaxed">
              <strong>Source Information: </strong> 
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
