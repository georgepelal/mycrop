import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/useSettings";
import { ArrowLeft, Loader2, Info, Thermometer, CloudRain, ShieldCheck } from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";
import LocationSearch from "../components/LocationSearch";

interface ClimateProjectionsProps {
  onNavigate: (page: string) => void;
}

interface MonthlyDataPoint {
  month: string;
  tempMax: number;
  tempMin: number;
  precipitation: number;
}

interface ClimateProjectionData {
  latitude: number;
  longitude: number;
  modelCode: string;
  monthlyProjectionMaxYear: number;
  monthlyData: MonthlyDataPoint[];
  isLiveModel: boolean;
  globalWarmingDeltaEst: string;
}

export default function ClimateProjections({ onNavigate }: ClimateProjectionsProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ClimateProjectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/climate-projection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch climate projection data");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Unit preferences state from global settings
  const { tempUnit, rainUnit } = useSettings();
  
  // Date period state
  const [seasonFilter, setSeasonFilter] = useState<"all" | "growing" | "winter">("all");
  
  // Dynamic threshold alarm state
  const [tempThreshold, setTempThreshold] = useState<number>(30); // Default 30°C
  const [rainThreshold, setRainThreshold] = useState<number>(30); // Default 30mm
  
  // Raw JSON display state
  const [showRawJSON, setShowRawJSON] = useState(false);

  // Helper unit converters
  const convertTemp = (celsius: number) => {
    if (tempUnit === "F") {
      return parseFloat((celsius * 1.8 + 32).toFixed(1));
    }
    return celsius;
  };

  const convertRain = (mm: number) => {
    if (rainUnit === "inch") {
      return parseFloat((mm * 0.0393701).toFixed(2));
    }
    return mm;
  };

  // Convert raw value back to Celsius/mm for internal safety comparison if user types in active unit
  const tempThreshInC = tempUnit === "F" ? parseFloat(((tempThreshold - 32) / 1.8).toFixed(1)) : tempThreshold;
  const rainThreshInMm = rainUnit === "inch" ? parseFloat((rainThreshold / 0.0393701).toFixed(1)) : rainThreshold;

  // Filter raw data and map with calculated units
  const rawMonths = data?.monthlyData || [];
  
  // Apply Date period filtering
  const filteredMonths = rawMonths.filter((item) => {
    const monthPrefix = item.month.substring(0, 3);
    const growingMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const winterMonths = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    
    if (seasonFilter === "growing") {
      return growingMonths.includes(monthPrefix);
    }
    if (seasonFilter === "winter") {
      return winterMonths.includes(monthPrefix);
    }
    return true; // "all"
  });

  // Map to chosen unit presentation for chart & table
  const chartData = filteredMonths.map((item) => ({
    ...item,
    tempMaxConverted: convertTemp(item.tempMax),
    tempMinConverted: convertTemp(item.tempMin),
    rainConverted: convertRain(item.precipitation),
    // Keep raw values for internal tracking or hover details
    rawTempMax: item.tempMax,
    rawTempMin: item.tempMin,
    rawRain: item.precipitation,
  }));

  // Analyze threshold stress alerts based on 100% of data from client selections
  const heatStressMonths = filteredMonths.filter(m => m.tempMax >= tempThreshInC);
  const droughtMonths = filteredMonths.filter(m => m.precipitation <= rainThreshInMm);

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert(t("projections.apiCopied", "Raw API JSON payload copied to clipboard!"));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between lg:pr-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t("projections.headerTitle", "Long-Term Climate Projections")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("projections.headerSubtitle", "Global climate simulation models for the year 2050 (CMIP6)")}
            </p>
          </div>
        </div>
        <div className="md:w-96 w-full">
          <LocationSearch 
            onLocationSelect={fetchData} 
            placeholder={t("projections.searchPlaceholder", "Search anywhere on earth...")} 
          />
        </div>
      </div>

      {!data && !loading && !error && (
         <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
           <Thermometer className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
           <h3 className="text-lg font-bold text-slate-700 mb-2">
             {t("projections.searchLocation", "Select a Location")}
           </h3>
           <p className="text-sm text-slate-500 max-w-md">
             {t("projections.searchLocationDesc", "Search above to explore 30-year long-term climate scenario projections (EC-Earth3-CC model) mapped for temperature limits and precipitation fluctuations.")}
           </p>
         </div>
      )}

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            {t("projections.loading", "Generating long-term CMIP6 climate trajectories...")}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          {t("projections.error", "Error")}: {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t("projections.gridTargetHorizon", "Target Horizon")}
              </div>
              <div className="text-2xl font-black text-slate-800">
                {t("projections.gridYear", "Year")} {data.monthlyProjectionMaxYear}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {t("projections.gridHorizonDesc", "Mid-century global planning baseline")}
              </div>
            </div>

            <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t("projections.gridProjectedModel", "Projected Model")}
              </div>
              <div className="text-lg font-bold text-slate-800 leading-tight truncate">{data.modelCode.split("/")[0]}</div>
              <div className="text-[10px] text-slate-500 mt-2">
                {t("projections.gridModelDesc", "Climate Model Intercomparison Project Phase 6")}
              </div>
            </div>

            <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t("projections.gridWarmingDelta", "Est. Warming Delta")}
              </div>
              <div className="text-xl font-bold text-rose-600 leading-tight">{data.globalWarmingDeltaEst}</div>
              <div className="text-[10px] text-slate-500 mt-2">
                {t("projections.gridWarmingDesc", "High-Emission (SSP5-8.5) concentration scenario")}
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex gap-3 text-purple-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-purple-600" />
            <div className="text-sm leading-relaxed">
              <strong>{t("projections.outlookTitle", "Future Climate Outlook for")} {locationName}:</strong>{" "}
              {t("projections.outlookExplanation", "Projections show monthly simulation bounds calculated using the CMIP6 high-radiative-forcing scenarios (approx. +1.8°C to +2.4°C baseline global temperature increase by 2050). Under this model, seasonal curves migrate towards warmer peaks and more volatile rainfall spikes, impacting crop growth cycles and water demands.")}
            </div>
          </div>

          {/* Interactive Control & Query Parameters */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-green"></span>
              {t("projections.controlsTitle", "Interactive Analysis Controls")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date / Seasonal Filtering Periods */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  {t("projections.labelSeason", "Seasonal Window")}
                </label>
                <div className="grid grid-cols-3 rounded-lg border border-gray-200 overflow-hidden divide-x divide-gray-200 h-9 mt-5">
                  <button 
                    onClick={() => setSeasonFilter("all")} 
                    className={`text-xs font-medium py-1.5 ${seasonFilter === "all" ? "bg-slate-150 text-brand-green bg-slate-100 font-bold" : "bg-white text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("projections.allMonths", "All (12m)")}
                  </button>
                  <button 
                    onClick={() => setSeasonFilter("growing")} 
                    className={`text-xs font-medium py-1.5 ${seasonFilter === "growing" ? "bg-slate-150 text-brand-green bg-slate-100 font-bold" : "bg-white text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("projections.growingSeason", "Growing")}
                  </button>
                  <button 
                    onClick={() => setSeasonFilter("winter")} 
                    className={`text-xs font-medium py-1.5 ${seasonFilter === "winter" ? "bg-slate-150 text-brand-green bg-slate-100 font-bold" : "bg-white text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("projections.coldSeason", "Dormant")}
                  </button>
                </div>
              </div>

              {/* Advanced Threshold Input Alarms */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                  {t("projections.thresholds", "Stress Thresholds")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500">{t("projections.tempMaxT", "Max Temp")} ({tempUnit === "C" ? "°C" : "°F"})</span>
                    <input 
                      type="number" 
                      value={tempThreshold}
                      onChange={(e) => setTempThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs border border-gray-200 p-1.5 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500">{t("projections.rainMinT", "Min Rain")} ({rainUnit === "mm" ? "mm" : "in"})</span>
                    <input 
                      type="number" 
                      value={rainThreshold}
                      onChange={(e) => setRainThreshold(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs border border-gray-200 p-1.5 rounded-lg text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold Violations Feedback Area */}
            <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-xs">
                <div className="font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  {t("projections.thermalWarning", "Agronomic Thermal Breaches")} ({heatStressMonths.length})
                </div>
                {heatStressMonths.length > 0 ? (
                  <p className="text-gray-500">
                    {t("projections.thermalWarningDesc", "Exceeding daily threshold of")} <strong className="text-rose-600">{tempThreshold}°{tempUnit}</strong> {t("projections.in")}:{" "}
                    <span className="font-semibold text-slate-800">{heatStressMonths.map(m => m.month).join(", ")}</span>
                  </p>
                ) : (
                  <p className="text-gray-400 italic">{t("projections.noThermalBreaches", "No thermal stress months with selected parameters.")}</p>
                )}
              </div>

              <div className="text-xs">
                <div className="font-bold text-gray-700 flex items-center gap-1.5 mb-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                  {t("projections.deficitWarning", "Simulated Drought Deficits")} ({droughtMonths.length})
                </div>
                {droughtMonths.length > 0 ? (
                  <p className="text-gray-500">
                    {t("projections.deficitWarningDesc", "Precipitation falling below")} <strong className="text-orange-500">{rainThreshold} {rainUnit}</strong> {t("projections.in")}:{" "}
                    <span className="font-semibold text-slate-800">{droughtMonths.map(m => m.month).join(", ")}</span>
                  </p>
                ) : (
                  <p className="text-gray-400 italic">{t("projections.noPrecipBreaches", "No extreme moisture deficit months diagnosed.")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Projected Temperature Ranges */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("projections.monthlyTempTitle", "Projected Monthly Temperatures")}</h3>
                  <p className="text-xs text-gray-400">{seasonFilter === "all" ? t("projections.allMonthsSubtitle", "Representing full 12-month calendar cycle") : t("projections.filteredMonthsSubtitle", "Representing filtered seasonal envelope")}</p>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit={`°${tempUnit}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="tempMaxConverted" 
                      stroke="#ef4444" 
                      fill="#fca5a5" 
                      fillOpacity={0.2} 
                      name={`${t("projections.maxTempLegend", "Projected Max Temp")} (°${tempUnit})`} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="tempMinConverted" 
                      stroke="#3b82f6" 
                      fill="#93c5fd" 
                      fillOpacity={0.1} 
                      name={`${t("projections.minTempLegend", "Projected Min Temp")} (°${tempUnit})`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Projected Monthly Rainfall */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("projections.monthlyRainTitle", "Projected Monthly Precipitation")}</h3>
                  <p className="text-xs text-gray-400">{seasonFilter === "all" ? t("projections.allMonthsSubtitle", "Representing full 12-month calendar cycle") : t("projections.filteredMonthsSubtitle", "Representing filtered seasonal envelope")}</p>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit={` ${rainUnit}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar 
                      dataKey="rainConverted" 
                      fill="#0ea5e9" 
                      radius={[4, 4, 0, 0]} 
                      name={`${t("projections.rainLegend", "Monthly Rainfall Sum")} (${rainUnit})`} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabular data showing 100% data */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2 overflow-x-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg">{t("projections.tabularTitle", "Comprehensive Grid Output")}</h3>
                  <p className="text-xs text-gray-400">{t("projections.tabularSubtitle", "Full monthly metrics including coordinates verification")}</p>
                </div>
                <div className="text-[11px] text-gray-500 font-mono bg-slate-50 p-2 rounded-xl border border-gray-100">
                  Lat: {data.latitude.toFixed(4)} | Lng: {data.longitude.toFixed(4)} | {t("projections.statusLive", "Live model status")}: {data.isLiveModel ? "TRUE" : "FALSE"}
                </div>
              </div>

              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">{t("projections.thMonth", "Month")}</th>
                    <th className="px-4 py-3 text-rose-700">{t("projections.thMaxTemp", "Max Temp")}</th>
                    <th className="px-4 py-3 text-blue-700">{t("projections.thMinTemp", "Min Temp")}</th>
                    <th className="px-4 py-3 text-sky-700">{t("projections.thPrecipitation", "Precipitation")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chartData.map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold">{row.month}</td>
                      <td className="px-4 py-3 text-rose-600 font-mono">
                        {row.tempMaxConverted}°{tempUnit}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-mono">
                        {row.tempMinConverted}°{tempUnit}
                      </td>
                      <td className="px-4 py-3 text-sky-600 font-mono">
                        {row.rainConverted} {rainUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Raw API Payload Explorer panel */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t("projections.rawPayloadTitle", "Raw API Response Payload")}</h4>
                  <p className="text-xs text-gray-400">{t("projections.rawPayloadSubtitle", "Contains 100% of underlying Open-Meteo & CMIP6 model simulation attributes")}</p>
                </div>
                <button 
                  onClick={() => setShowRawJSON(!showRawJSON)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-700 transition"
                >
                  {showRawJSON ? t("projections.hideRaw", "Hide Payload") : t("projections.showRaw", "Inspect Payload")}
                </button>
              </div>

              {showRawJSON && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button 
                      onClick={handleCopyJSON}
                      className="px-2.5 py-1 text-[11px] font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green/20 rounded-md transition"
                    >
                      {t("projections.copyToClipboard", "Copy JSON to Clipboard")}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
