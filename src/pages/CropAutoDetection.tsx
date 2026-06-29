import React, { useState } from "react";
import { ArrowLeft, Loader2, Scan, CheckCircle2, AlertTriangle, Info, Sprout } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface CropAutoDetectionProps {
  onNavigate: (page: string) => void;
}

interface CropDetectionData {
  detectedCrop: string;
  confidence: number;
  explanation: string;
}

export default function CropAutoDetection({ onNavigate }: CropAutoDetectionProps) {
  const [data, setData] = useState<CropDetectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/detect-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to detect crop in this location");
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
              <Scan className="w-7 h-7 text-emerald-500" />
              Crop Auto-Detection
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              AI-driven multi-spectral classification indicating probable crop types by region.
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
          <Scan className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query agricultural bands to auto-detect the dominant crop type grown in a specific geography using ML heuristic models.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning regional multispectral data for crop signatures...
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Primary Classification
              </div>
              <div className="text-4xl font-black text-emerald-600 truncate py-2">
                {data.detectedCrop}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-emerald-500" />
                Dominant Specie Match
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Confidence Score
              </div>
              <div className="text-4xl font-black text-blue-600 flex items-center gap-2 py-2">
                {(data.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                Algorithm Certainty
              </div>
            </div>
            
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4 text-emerald-900">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-emerald-600" />
            <div className="text-base leading-relaxed">
              <strong>Agronomical Match Explanation: </strong> 
              {data.explanation}
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
