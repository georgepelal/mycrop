import React, { useState } from "react";
import { ArrowLeft, Loader2, Waves, AlertTriangle, Droplets, Info, Droplet } from "lucide-react";
import LocationSearch from "../components/LocationSearch";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

interface FloodHydrologyProps {
  onNavigate: (page: string) => void;
}

interface FloodData {
  latitude: number;
  longitude: number;
  dates: string[];
  riverDischarge: number[];
  riskLevel: "Normal Flow" | "Action Stage" | "Minor Flood Warning" | "Major Inundation Alert";
  maxDischarge: number;
  meanDischarge: number;
  isLiveDevice: boolean;
  timestamp: string;
}

export default function FloodHydrology({ onNavigate }: FloodHydrologyProps) {
  const [data, setData] = useState<FloodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/flood-hydrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to resolve river discharge hydrology");
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

  const chartData = data?.dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    "River Discharge (m³/s)": data.riverDischarge[index]
  })) || [];

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
              <Waves className="w-7 h-7 text-blue-600" />
              Flood Hydrology
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              GloFAS global monitoring system for local river discharge logic.
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
          <Waves className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Compute regional water volume discharge rates determining nearby inundation risk and structural erosion.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning upstream catchment discharge variables...
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
            
            <div className={`border rounded-2xl p-5 shadow-sm col-span-1 flex flex-col ${
              data.riskLevel === 'Major Inundation Alert' ? 'bg-rose-50 border-rose-100 text-rose-900' :
              data.riskLevel === 'Minor Flood Warning' ? 'bg-orange-50 border-orange-100 text-orange-900' :
              data.riskLevel === 'Action Stage' ? 'bg-amber-50 border-amber-100 text-amber-900' :
              'bg-emerald-50 border-emerald-100 text-emerald-900'
            }`}>
              <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
               data.riskLevel === 'Major Inundation Alert' ? 'text-rose-500' :
               data.riskLevel === 'Minor Flood Warning' ? 'text-orange-500' :
               data.riskLevel === 'Action Stage' ? 'text-amber-500' :
               'text-emerald-500'
              }`}>
                Current Safety Standard
              </div>
              <div className="text-4xl font-black py-2">
                {data.riskLevel}
              </div>
              <div className={`text-[10px] mt-auto flex items-center gap-1 font-bold ${
               data.riskLevel === 'Major Inundation Alert' ? 'text-rose-500' :
               data.riskLevel === 'Minor Flood Warning' ? 'text-orange-500' :
               data.riskLevel === 'Action Stage' ? 'text-amber-500' :
               'text-emerald-500'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Copernicus Risk Matrix
              </div>
            </div>

            <div className="grid grid-rows-2 gap-4">
               <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Peak Basin Discharge
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {data.maxDischarge.toFixed(1)} <span className="text-sm font-bold text-slate-400">m³/s</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Waves className="w-5 h-5 text-blue-500" />
                </div>
              </div>

               <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mean Basin Discharge
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {data.meanDischarge.toFixed(1)} <span className="text-sm font-bold text-slate-400">m³/s</span>
                  </div>
                </div>
                <div className="p-3 bg-cyan-50 rounded-full">
                  <Droplet className="w-5 h-5 text-cyan-500" />
                </div>
              </div>
            </div>

          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Waves className="w-5 h-5 text-blue-500" />
              River Volume Stream Flow (7-Day)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDischarge" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-10} domain={[0, 'auto']} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="River Discharge (m³/s)" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorDischarge)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Global Flood Awareness System</strong> 
              Discharge volumes are calculated using Copernicus Emergency Management Service models, aggregating local topographic runoffs against atmospheric precipitation inputs.
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
                <pre className="p-4 bg-slate-900 text-blue-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
