import React, { useState } from "react";
import { ArrowLeft, Loader2, Tractor, AlertTriangle, Droplet, Clock, Settings, Info } from "lucide-react";
import LocationSearch from "../components/LocationSearch";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

interface SoilTrafficabilityProps {
  onNavigate: (page: string) => void;
}

interface SoilTrafficabilityData {
  latitude: number;
  longitude: number;
  dates: string[];
  soilMoisturePercent: number[];
  compactionRisk: string[];
  avgMoisture: number;
  isLiveTraffic: boolean;
  fieldRecommendation: string;
}

export default function SoilTrafficability({ onNavigate }: SoilTrafficabilityProps) {
  const [data, setData] = useState<SoilTrafficabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/soil-trafficability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to compute soil trafficability");
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
    "Soil Moisture (%)": data.soilMoisturePercent[index],
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
              <Tractor className="w-7 h-7 text-amber-600" />
              Soil Trafficability
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Machine compaction risk & heavy equipment access windows.
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
          <Tractor className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Evaluate subsurface shear strength and soil pliancy against heavy machinery axle weight requirements based on moisture curves.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Assessing soil pliancy under machinery drag variables...
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
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm col-span-1 flex flex-col">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                7-Day Soil Moisture Average
              </div>
              <div className="text-4xl md:text-5xl font-black text-amber-600 py-2">
                {data.avgMoisture.toFixed(1)} <span className="text-xl text-slate-400 font-bold">% Volumetric</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-auto flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-blue-500" />
                Drives compaction vulnerability logic
              </div>
            </div>

            <div className={`border rounded-2xl p-5 shadow-sm col-span-1 flex flex-col ${
              data.avgMoisture > 30 ? 'bg-rose-50 border-rose-100' :
              data.avgMoisture > 25 ? 'bg-amber-50 border-amber-100' :
              'bg-emerald-50 border-emerald-100'
            }`}>
               <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                 data.avgMoisture > 30 ? 'text-rose-500' :
                 data.avgMoisture > 25 ? 'text-amber-500' :
                 'text-emerald-500'
               }`}>
                Operational Advisory
              </div>
              <div className={`text-xl font-bold py-2 ${
                data.avgMoisture > 30 ? 'text-rose-900' :
                data.avgMoisture > 25 ? 'text-amber-900' :
                'text-emerald-900'
              }`}>
                {data.fieldRecommendation}
              </div>
              <div className={`text-[10px] mt-auto flex items-center gap-1 font-bold ${
                data.avgMoisture > 30 ? 'text-rose-400' :
                data.avgMoisture > 25 ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Equipment & Heavy Load Limitations
              </div>
            </div>
          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Tractor className="w-5 h-5 text-amber-500" />
              Soil Moisture Accumulation & Bearing Capacity (7-Day)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dx={-10} domain={[10, 50]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Soil Moisture (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              Traction & Compaction Risk Schedule
            </h4>
            <div className="space-y-2">
              {data.dates.map((date, index) => {
                const risk = data.compactionRisk[index];
                const moisture = data.soilMoisturePercent[index];
                let riskColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                if (risk === "HIGH") riskColor = "bg-rose-50 text-rose-700 border-rose-100";
                if (risk === "MODERATE") riskColor = "bg-amber-50 text-amber-700 border-amber-100";

                return (
                  <div key={date} className={`flex items-center justify-between p-3 border rounded-xl ${riskColor}`}>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 opacity-70" />
                      <span className="font-bold text-sm">
                        {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold">
                       <span>{moisture.toFixed(1)}% H2O</span>
                       <span className="w-24 text-right">{risk} RISK</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Calculation Methodology</strong> 
              Trafficability evaluates top-soil plasticity logic, determining shear limits under typical agricultural tractor tire footprints combined with precipitation thresholds.
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
