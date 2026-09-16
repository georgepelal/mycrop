import React, { useState } from "react";
import { ArrowLeft, Loader2, ThermometerSun, Info, Leaf, Sprout, Clock } from "lucide-react";
import LocationSearch from "../components/LocationSearch";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Bar, BarChart
} from "recharts";

interface GrowingDegreeDaysProps {
  onNavigate: (page: string) => void;
}

interface GddData {
  latitude: number;
  longitude: number;
  crop: string;
  baseTemp: number;
  targetGdd: number;
  dates: string[];
  dailyGdd: number[];
  cumulativeGdd: number[];
  phenologicalPhase: string;
  daysToHarvest: number;
  isLiveGdd: boolean;
}

export default function GrowingDegreeDays({ onNavigate }: GrowingDegreeDaysProps) {
  const [data, setData] = useState<GddData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("corn");

  const availableCrops = [
    { id: "corn", name: "Corn (Maize)" },
    { id: "soybean", name: "Soybean" },
    { id: "wheat", name: "Wheat" },
    { id: "cotton", name: "Cotton" }
  ];

  const fetchData = async (lat: number, lng: number, name: string, crop: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/growing-degree-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, crop })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch GDD data");
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
    fetchData(lat, lng, name, selectedCrop);
  };

  const handleCropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const crop = e.target.value;
    setSelectedCrop(crop);
    // Re-fetch automatically if we already have a location
    if (data && locationName) {
      fetchData(data.latitude, data.longitude, locationName, crop);
    }
  };

  const chartData = data?.dates.map((date, index) => ({
    date,
    dailyGdd: data.dailyGdd[index],
    cumulativeGdd: data.cumulativeGdd[index]
  })) || [];

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
              <ThermometerSun className="w-7 h-7 text-amber-500" />
              Growing Degree Days (GDD)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Analyze crop phenology forecasts based on physiological thermal heat accumulation.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedCrop}
            onChange={handleCropChange}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            {availableCrops.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="w-64">
            <LocationSearch 
              onLocationSelect={handleLocationSelect} 
              placeholder="Search anywhere..." 
            />
          </div>
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <ThermometerSun className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location & Crop
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Search above or select a different crop type to evaluate targeted thermodynamic thermal accumulations driving physiological development over the next 7 days.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Calculating heat accumulation and physiological maturity timelines...
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
                Current Plant Phase
              </div>
              <div className="text-xl font-bold text-emerald-600 truncate leading-tight">
                {data.phenologicalPhase}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                Sourced from target growth matrices
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Accumulated Index
              </div>
              <div className="text-2xl font-black text-amber-500">
                {data.cumulativeGdd[0]} <span className="text-sm font-semibold text-slate-400">/ {data.targetGdd}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <ThermometerSun className="w-3.5 h-3.5 text-amber-500" />
                Base Temp: {data.baseTemp}°C
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Est. Physiological Maturity
              </div>
              <div className="text-2xl font-black text-blue-600 truncate">
                {data.daysToHarvest < 0 ? "Reached" : `~${data.daysToHarvest} Days`}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Estimated by matching remaining GDD
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="text-sm leading-relaxed">
              <strong>Calculation Method: </strong> 
              GDD calculates daily heat value ((Tmax + Tmin) / 2) minus a crop-specific baseline temperature ({data.baseTemp}°C for {data.crop}).
              This models physiological time rather than calendar time, projecting maturity and vegetative phase shifts precisely.
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <ThermometerSun className="text-amber-500 w-5 h-5" /> Cumulative GDD
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="cumulativeGdd" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.3} name="Total GDD Stack" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Sprout className="text-emerald-500 w-5 h-5" /> Daily Thermal Accumulation
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar dataKey="dailyGdd" fill="#10b981" radius={[4, 4, 0, 0]} name="Daily GDD Units" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
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
        </div>
      )}
    </div>
  );
}
