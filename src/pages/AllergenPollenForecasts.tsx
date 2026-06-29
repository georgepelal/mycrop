import React, { useState } from "react";
import { ArrowLeft, Loader2, Wind, Activity, Info, AlertTriangle } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface AllergenPollenProps {
  onNavigate: (page: string) => void;
}

interface AllergenData {
  latitude: number;
  longitude: number;
  isLiveAllergen: boolean;
  allergens: {
    birchPollen: number;
    grassPollen: number;
    ragweedPollen: number;
    dangerCategory: string;
    totalSeverity: number;
  };
  apiCitation: string;
}

export default function AllergenPollenForecasts({ onNavigate }: AllergenPollenProps) {
  const [data, setData] = useState<AllergenData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/allergen-pollen-forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch allergen & pollen data");
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
              <Wind className="w-7 h-7 text-emerald-500" />
              Allergen & Pollen Forecasts
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Analyze atmospheric pollen loads and allergenic risks using Open-Meteo Air Quality climatology vectors.
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
          <Wind className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query real-time atmospheric pollen loads (Birch, Grass, Ragweed) for a given geographical coordinate.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Checking current atmospheric spore & allergen vectors...
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
                Risk Level
              </div>
              <div className={`text-xl font-bold truncate ${
                data.allergens.dangerCategory.includes("Severe") || data.allergens.dangerCategory.includes("High") 
                  ? "text-rose-600" 
                  : data.allergens.dangerCategory.includes("Moderate") 
                    ? "text-amber-500" 
                    : "text-emerald-500"
              }`}>
                {data.allergens.dangerCategory}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${
                  data.allergens.dangerCategory.includes("Severe") || data.allergens.dangerCategory.includes("High") 
                    ? "text-rose-500" 
                    : data.allergens.dangerCategory.includes("Moderate") 
                      ? "text-amber-500" 
                      : "text-emerald-500"
                }`} />
                Current Danger Category
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Birch Pollen
              </div>
              <div className="text-3xl font-black text-amber-600">
                {data.allergens.birchPollen} <span className="text-sm font-medium text-slate-400">grains/m³</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                Current Birch Load
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Grass Pollen
              </div>
              <div className="text-3xl font-black text-emerald-600">
                {data.allergens.grassPollen} <span className="text-sm font-medium text-slate-400">grains/m³</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Current Grass Load
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ragweed Pollen
              </div>
              <div className="text-3xl font-black text-rose-600 truncate">
                {data.allergens.ragweedPollen} <span className="text-sm font-medium text-slate-400">grains/m³</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                Current Ragweed Load
              </div>
            </div>
            
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div className="text-sm leading-relaxed">
              <strong>Allergen Forecasts: </strong> 
              {data.apiCitation}
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
