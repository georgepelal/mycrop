import React, { useState } from "react";
import { ArrowLeft, Loader2, Thermometer, Info, Droplets, Mountain, FlaskConical, Target } from "lucide-react";
import LocationSearch from "../components/LocationSearch";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

interface OpenEpiSoilQualityProps {
  onNavigate: (page: string) => void;
}

interface SoilProperties {
  soilClass: string;
  phWater: number;
  clayContent: number;
  sandContent: number;
  siltContent: number;
  organicCarbon: number;
  nitrogen: number;
  textureClass: string;
  sandSiltRatio: number;
}

interface OpenEpiData {
  latitude: number;
  longitude: number;
  isLiveOpenEpi: boolean;
  soilProperties: SoilProperties;
  apiCitation: string;
}

export default function OpenEpiSoilQuality({ onNavigate }: OpenEpiSoilQualityProps) {
  const [data, setData] = useState<OpenEpiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/openepi-soil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to pull soil mechanical properties");
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

  const soilCompositionData = data ? [
    { name: "Clay", value: data.soilProperties.clayContent, color: "#eab308" },
    { name: "Sand", value: data.soilProperties.sandContent, color: "#f97316" },
    { name: "Silt", value: data.soilProperties.siltContent, color: "#64748b" }
  ] : [];

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
              <Thermometer className="w-7 h-7 text-purple-600" />
              Global Soil Quality
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              World Reference Base taxonomy and subsurface mechanical properties.
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
          <Target className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Select a Location
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query the global geo-database for high-precision soil compositions, taxonomy mappings, and chemical properties.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Querying Global Soil Information vectors...
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
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm col-span-1 md:col-span-2 flex flex-col">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                World Reference Base Class
              </div>
              <div className="text-4xl md:text-5xl font-black text-purple-700 py-2 truncate">
                {data.soilProperties.soilClass}
              </div>
              <div className="text-[10px] text-slate-500 mt-auto flex items-center gap-1">
                <Mountain className="w-3.5 h-3.5 text-purple-500" />
                Global Soil Taxonomy Classification
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Texture Class
              </div>
              <div className="text-2xl font-bold text-slate-800 py-2">
                {data.soilProperties.textureClass}
              </div>
              <div className="flex justify-between items-center mt-3 text-xs border-t border-slate-100 pt-3 text-slate-600">
                <span>Sand/Silt Ratio</span>
                <span className="font-bold text-slate-800">{data.soilProperties.sandSiltRatio}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Mountain className="w-5 h-5 text-amber-500" />
                Mechanical Composition
              </h3>
              <div className="h-64 cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={soilCompositionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {soilCompositionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value}%`, undefined]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Droplets className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Moisture Profile (pH)</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">H2O Saturation Assay</p>
                  </div>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-600">{data.soilProperties.phWater.toFixed(1)}</span>
                  <span className="text-sm font-bold text-slate-400">pH scale</span>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <FlaskConical className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Chemical Markers</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Carbon & Nitrogen</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">Total Organic Carbon</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-600">{data.soilProperties.organicCarbon}</span>
                      <span className="text-[10px] text-slate-500 font-bold">g/kg</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-1">Total Nitrogen</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-emerald-600">{data.soilProperties.nitrogen}</span>
                      <span className="text-[10px] text-slate-500 font-bold">g/kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Data Provenance</strong> 
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
                <pre className="p-4 bg-slate-900 text-purple-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
