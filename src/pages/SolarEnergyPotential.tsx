import React, { useState } from "react";
import { ArrowLeft, Loader2, Sun, MapPin, Zap, Info, AlertTriangle, TrendingUp } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface SolarEnergyProps {
  onNavigate: (page: string) => void;
}

interface SolarData {
  latitude: number;
  longitude: number;
  isLiveSolar: boolean;
  times: string[];
  maxIrradianceDate: string;
  maxIrradianceValueKw: number;
  irradianceSeries: {
     date: string;
     shortwaveArray: number;
     directNormalArray: number;
     diffuseArray: number;
  }[];
  peakYieldW_SqM: number;
  pvYieldKwhLevelized: string;
  apiCitation: string;
}

export default function SolarEnergyPotential({ onNavigate }: SolarEnergyProps) {
  const [data, setData] = useState<SolarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/solar-energy-potential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to compute solar irradiance");
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
              <Sun className="w-7 h-7 text-amber-500" />
              Solar Energy Potential
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Photovoltaic and shortwave radiative energy indexes.
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-96">
          <LocationSearch 
            onLocationSelect={handleLocationSelect} 
            placeholder="Search field location..." 
          />
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <Zap className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select an Agronomic Target
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query satellite telemetry databases measuring downwelling photosynthetically active and shortwave radiation fields.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning Global Radiative Yield Networks...
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
            <MapPin className="w-4 h-4 text-amber-500" />
            Radiation Profile: {locationName}
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-amber-500 border border-amber-600 rounded-2xl p-6 shadow-xl relative overflow-hidden text-center flex flex-col justify-center min-h-[240px]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="flex justify-center mb-4 relative z-10"><Zap className="w-10 h-10 text-amber-100" /></div>
                <div className="text-amber-100 font-bold uppercase tracking-widest text-xs mb-2 relative z-10">Peak Shortwave Radiation</div>
                <div className="text-6xl font-black text-white flex justify-center items-baseline gap-1 relative z-10">
                   {data.maxIrradianceValueKw} <span className="text-2xl text-amber-200/80">MJ/m²</span>
                </div>
                <div className="text-amber-100/70 font-mono text-xs mt-3 relative z-10 opacity-70">
                   (Est. Max on {data.maxIrradianceDate})
                </div>
             </div>

             <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center min-h-[240px]">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Power Grid Equivalent
                </div>
                <h3 className="text-4xl font-black text-indigo-600 leading-tight mb-2">
                  {data.pvYieldKwhLevelized} <span className="text-xl font-bold text-slate-400">kWh</span>
                </h3>
                <div className="text-slate-500 text-sm">Estimated photovoltaic (PV) electrical equivalence per sq. meter.</div>
             </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-gray-200">
               <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                 <Sun className="w-4 h-4 text-amber-500" /> 
                 Shortwave & Direct Irradiance Model
               </h3>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-white text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Cumul. Shortwave (MJ/m²)</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Direct Normal</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Diffuse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs">
                  {data.irradianceSeries.map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-700">{row.date}</td>
                      <td className="px-6 py-3 text-amber-600 font-bold">{row.shortwaveArray}</td>
                      <td className="px-6 py-3">{row.directNormalArray}</td>
                      <td className="px-6 py-3">{row.diffuseArray}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Optical Instrumentation System</strong> 
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
                <pre className="p-4 bg-slate-900 text-amber-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
