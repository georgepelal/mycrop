import React, { useState } from "react";
import { ArrowLeft, Loader2, ThermometerSnowflake, FileJson, Info, AlertTriangle, Droplets, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";
import LocationSearch from "../components/LocationSearch";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ComposedChart, Bar
} from "recharts";

interface FrostFreezeRiskProps {
  onNavigate: (page: string) => void;
}

interface FrostFreezeData {
  latitude: number;
  longitude: number;
  dates: string[];
  tempMin: number[];
  dewPoint: number[];
  frostProbability: number[];
  soilFreezeDepthCm: number[];
  protectiveAction: string;
  nextFrostDate: string;
  isLiveFrost: boolean;
  disclaimer: string;
}

export default function FrostFreezeRisk({ onNavigate }: FrostFreezeRiskProps) {
  const { t } = useTranslation();
  const { tempUnit } = useSettings();
  
  const [data, setData] = useState<FrostFreezeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/frost-freeze-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch frost freeze risk data");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const convertTemp = (celsius: number) => {
    if (tempUnit === "F") {
      return parseFloat((celsius * 1.8 + 32).toFixed(1));
    }
    return celsius;
  };

  const chartData = data?.dates.map((date, index) => ({
    date,
    tempMin: convertTemp(data.tempMin[index]),
    dewPoint: convertTemp(data.dewPoint[index]),
    frostProbability: data.frostProbability[index],
    freezeDepth: data.soilFreezeDepthCm[index]
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
              <ThermometerSnowflake className="w-7 h-7 text-sky-500" />
              Frost/Freeze Risk
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Analyze localized frost probability, dew points, and soil freeze depth over 7 days.
            </p>
          </div>
        </div>
        
        <div className="md:w-96 w-full">
          <LocationSearch 
            onLocationSelect={fetchData} 
            placeholder="Search anywhere..." 
          />
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <ThermometerSnowflake className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Search above to generate real-time atmospheric projections and estimate thermal bounds for crop canopy radiation frost over the next 7 days.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Calculating thermal dew points and radiation frost scenarios...
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
                Next Threat Horizon
              </div>
              <div className="text-2xl font-black text-rose-600">
                {data.nextFrostDate && data.nextFrostDate !== "None Projected" 
                  ? new Date(data.nextFrostDate).toLocaleDateString() 
                  : "None Projected"}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Next date over 50% probability
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm col-span-1 md:col-span-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Recommended Action Plan
              </div>
              <div className="text-sm font-medium text-slate-800 leading-snug mt-1">
                {data.protectiveAction}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                System generated based on peak severity matrix
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
            <div className="text-sm leading-relaxed">
              <strong>Atmospheric Mechanism: </strong> 
              {data.disclaimer}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <ThermometerSnowflake className="text-rose-500 w-5 h-5" /> Minimum Temps & Dew Points
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit={`°${tempUnit}`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="tempMin" stroke="#ef4444" strokeWidth={3} name="Min Temp" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="dewPoint" stroke="#3b82f6" strokeWidth={3} name="Dew Point" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <AlertTriangle className="text-amber-500 w-5 h-5" /> Frost Probability & Freeze Depth
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit="%" />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} unit="cm" />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="frostProbability" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Frost Likelihood (%)" />
                    <Line yAxisId="right" type="monotone" dataKey="freezeDepth" stroke="#0284c7" strokeWidth={3} name="Soil Freeze Depth (cm)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
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
