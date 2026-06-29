import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";
import { ArrowLeft, Loader2, Info, Thermometer, CloudRain, Sprout } from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";
import LocationSearch from "../components/LocationSearch";

interface DecadalReanalysisProps {
  onNavigate: (page: string) => void;
}

interface DecadalDataPoint {
  decade: string;
  avgTempMax: number;
  avgTempMin: number;
  cumulativeRain: number;
  accumulatedGdd: number;
}

interface DecadalData {
  latitude: number;
  longitude: number;
  decadalData: DecadalDataPoint[];
  isLiveArchive: boolean;
  climateTrendDisclaimer: string;
}

export default function DecadalReanalysis({ onNavigate }: DecadalReanalysisProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<DecadalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/historical-reanalysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch historical reanalysis data");
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
  const { tempUnit, setTempUnit, rainUnit, setRainUnit } = useSettings();

  // Decade selection filter: list of decades to include
  const [selectedDecades, setSelectedDecades] = useState<string[]>(["1980s", "1990s", "2000s", "2010s", "2020s"]);

  // GDD Crop base temperature shift (usually 10°C, but let users select 5°C, 10°C, or 12°C/15°C)
  const [gddBase, setGddBase] = useState<number>(10);

  // Raw JSON display state
  const [showRawJSON, setShowRawJSON] = useState(false);

  // Convert functions
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

  // Recalculate GDD dynamically based on selected base temperature and user data!
  const calculateDynamicGdd = (avgMax: number, avgMin: number) => {
    const avgDaily = (avgMax + avgMin) / 2;
    const gddSingleDay = Math.max(0, avgDaily - gddBase);
    return Math.round(gddSingleDay * 120); // 120-day summer season formula from server
  };

  const rawDecades = data?.decadalData || [];

  // Filter and map raw API results
  const filteredDecades = rawDecades.filter(item => selectedDecades.includes(item.decade));

  const chartData = filteredDecades.map(item => {
    const recalculatedGdd = calculateDynamicGdd(item.avgTempMax, item.avgTempMin);
    return {
      decade: item.decade,
      // Converted values
      avgTempMax: convertTemp(item.avgTempMax),
      avgTempMin: convertTemp(item.avgTempMin),
      cumulativeRain: convertRain(item.cumulativeRain),
      accumulatedGdd: recalculatedGdd,
      // Keep raw values
      rawTempMax: item.avgTempMax,
      rawTempMin: item.avgTempMin,
      rawRain: item.cumulativeRain,
    };
  });

  // Calculate overall climate regression/drift metrics (using 100% of selected/available data)
  const computeClimateRegression = () => {
    if (filteredDecades.length < 2) return null;
    const first = filteredDecades[0];
    const last = filteredDecades[filteredDecades.length - 1];

    const tempMaxDiff = last.avgTempMax - first.avgTempMax;
    const tempMinDiff = last.avgTempMin - first.avgTempMin;
    const rainDiffPercent = ((last.cumulativeRain - first.cumulativeRain) / first.cumulativeRain * 100).toFixed(1);
    
    const gddFirst = calculateDynamicGdd(first.avgTempMax, first.avgTempMin);
    const gddLast = calculateDynamicGdd(last.avgTempMax, last.avgTempMin);
    const gddDiff = gddLast - gddFirst;

    return {
      tempMaxDiff: tempMaxDiff.toFixed(1),
      tempMinDiff: tempMinDiff.toFixed(1),
      rainDiffPercent,
      gddDiff,
      startDecade: first.decade,
      endDecade: last.decade
    };
  };

  const driftStats = computeClimateRegression();

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert(t("decadal.apiCopied", "Raw Decadal API JSON copied to clipboard!"));
    }
  };

  const toggleDecade = (dec: string) => {
    if (selectedDecades.includes(dec)) {
      if (selectedDecades.length > 1) {
        setSelectedDecades(selectedDecades.filter(d => d !== dec));
      } else {
        alert(t("decadal.atLeastOneDecade", "You must select at least one decade to visualize trends."));
      }
    } else {
      setSelectedDecades([...selectedDecades, dec].sort());
    }
  };

  return (
    <div className="space-y-6">
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
              {t("decadal.headerTitle", "Decadal Reanalysis")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("decadal.headerSubtitle", "Climate drift & historical trends since the 1980s")}
            </p>
          </div>
        </div>
        <div className="md:w-96 w-full">
          <LocationSearch 
            onLocationSelect={fetchData} 
            placeholder={t("decadal.searchPlaceholder", "Search anywhere on earth...")} 
          />
        </div>
      </div>

      {!data && !loading && !error && (
         <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
           <Thermometer className="w-12 h-12 text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-700 mb-2">
             {t("decadal.searchLocation", "Search for a location")}
           </h3>
           <p className="text-sm text-slate-500 max-w-md">
             {t("decadal.searchLocationDesc", "Use the search bar above to generate a 40-year decadal climatic trend regression for anywhere on the globe.")}
           </p>
         </div>
      )}

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            {t("decadal.loading", "Analyzing decades of historical weather data...")}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          {t("decadal.error", "Error")}: {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-800">
            <Info className="w-5 h-5 shrink-0 mt-0.5 animate-pulse text-amber-600" />
            <div className="text-sm leading-relaxed">
              <strong>{t("decadal.understanding", "Understanding Decadal Reanalysis:")}</strong>{" "}
              {t("decadal.understandingExplanation", "This tool looks at long-term climate patterns for")} <strong>{locationName}</strong>.{" "}
              {t("decadal.understandingExplanationEnd", "By averaging data across 10-year periods, we filter out yearly weather noise to reveal true climatic shifts in temperature limits, available seasonal heat (GDD), and total annual precipitation over the last 40 years.")}
              {data?.climateTrendDisclaimer && <p className="mt-2 text-amber-700/80 italic">{data.climateTrendDisclaimer}</p>}
            </div>
          </div>

          {/* Controls Panel & Interactive Dynamic Period Filters */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              {t("decadal.controlTitle", "Interactive Analysis Dashboard")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Decade Filter checkboxes (Date Period segmenter) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  {t("decadal.decadesToInclude", "Decade Periods Filtering")}
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["1980s", "1990s", "2000s", "2010s", "2020s"].map((dec) => {
                    const active = selectedDecades.includes(dec);
                    return (
                      <button 
                        key={dec}
                        onClick={() => toggleDecade(dec)}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${active ? "bg-amber-500 border-amber-600 text-white font-bold shadow-xs" : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"}`}
                      >
                        {dec}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crop threshold Base Selector for GDD */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  {t("decadal.gddBaseLabel", "GDD Baseline Threshold")}
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input 
                    type="range" 
                    min="5" 
                    max="15" 
                    value={gddBase} 
                    onChange={(e) => setGddBase(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-slate-800 shrink-0 font-mono w-10">
                    {gddBase}°C
                  </span>
                </div>
                <span className="text-[10px] text-gray-450 text-gray-400 block mt-1">
                  {t("decadal.gddHelp", "Lower values accumulate heat faster. (Base 10 is standard)")}
                </span>
              </div>
            </div>

            {/* Micro Climatic Drifts Analysis Card */}
            {driftStats && (
              <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">
                  {t("decadal.calculatedShift", "Calculated Multi-Decadal Climatological Drift")} ({driftStats.startDecade} → {driftStats.endDecade})
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <div className="text-[10px] text-gray-500">{t("decadal.maxTempTrend", "Max Temp Drift")}</div>
                    <div className={`text-base font-black ${parseFloat(driftStats.tempMaxDiff) >= 0 ? "text-rose-600" : "text-blue-600"}`}>
                      {parseFloat(driftStats.tempMaxDiff) >= 0 ? "+" : ""}{driftStats.tempMaxDiff}°{tempUnit}
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <div className="text-[10px] text-gray-500">{t("decadal.minTempTrend", "Min Temp Drift")}</div>
                    <div className={`text-base font-black ${parseFloat(driftStats.tempMinDiff) >= 0 ? "text-rose-600" : "text-blue-600"}`}>
                      {parseFloat(driftStats.tempMinDiff) >= 0 ? "+" : ""}{driftStats.tempMinDiff}°{tempUnit}
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <div className="text-[10px] text-gray-500">{t("decadal.rainfallTrend", "Rainfall Delta")}</div>
                    <div className={`text-base font-black ${parseFloat(driftStats.rainDiffPercent) >= 0 ? "text-cyan-600" : "text-orange-600"}`}>
                      {parseFloat(driftStats.rainDiffPercent) >= 0 ? "+" : ""}{driftStats.rainDiffPercent}%
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-amber-100">
                    <div className="text-[10px] text-gray-500">{t("decadal.gddExpansion", "Seasonal GDD Delta")}</div>
                    <div className={`text-base font-black ${driftStats.gddDiff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {driftStats.gddDiff >= 0 ? "+" : ""}{driftStats.gddDiff} GDD
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Decadal Temperature Trends */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg">{t("decadal.tempExtremesTitle", "Temperature Extremes Drift")}</h3>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="decade" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit={`°${tempUnit}`}
                      domain={['auto', 'auto']}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                      type="monotone" 
                      dataKey="avgTempMax" 
                      stroke="#e11d48" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#e11d48", strokeWidth: 2, stroke: "#fff" }}
                      name={`${t("decadal.avgMaxTemp", "Average Max Temp")} (°${tempUnit})`} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTempMin" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                      name={`${t("decadal.avgMinTemp", "Average Min Temp")} (°${tempUnit})`} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Precipitation Trends */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                  <CloudRain className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg">{t("decadal.rainfallTitle", "Decadal Annual Rainfall")}</h3>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="decade" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit={` ${rainUnit}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                      cursor={{ fill: '#f8fafc' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar 
                      dataKey="cumulativeRain" 
                      fill="#0284c7" 
                      radius={[4, 4, 0, 0]} 
                      name={`${t("decadal.annualRain", "Annual Cumulative Rain")} (${rainUnit})`} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Growing Degree Days (GDD) Area Chart */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("decadal.gddTitle", "Seasonal Heat Accumulation (GDD)")}</h3>
                  <p className="text-xs text-gray-450 text-gray-400">
                    {t("decadal.gddSubtext", "Representing dynamic heat sum for the selected base-temperature of")} {gddBase}°C
                  </p>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="decade" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="accumulatedGdd" 
                      stroke="#059669" 
                      fill="#34d399" 
                      fillOpacity={0.3} 
                      name={`${t("decadal.gddLegend", "Accumulated GDD")} (Base ${gddBase}°C)`} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-gray-400 mt-4 text-center leading-relaxed">
                {t("decadal.gddExplanation", "*Growing Degree Days (GDD) measure total heat available for crop growth during a typical 120-day summer season.")}
              </p>
            </div>

            {/* Dynamic Tabular Output showing 100% of underlying details */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2 overflow-x-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg">{t("decadal.tableTitle", "Decadal Data Breakdown")}</h3>
                  <p className="text-xs text-gray-400">{t("decadal.tableSub", "Historical regression metrics including coordinate details")}</p>
                </div>
                <div className="text-[11px] font-mono bg-slate-50 border border-gray-100 p-2 rounded-xl text-gray-500">
                  Lat: {data.latitude.toFixed(4)} | Lng: {data.longitude.toFixed(4)} | {t("decadal.liveArchiveStatus", "Open-Meteo Archive Status")}: {data.isLiveArchive ? "LIVE CONNECTION" : "MICRO-ZONE EMULATION"}
                </div>
              </div>

              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">{t("decadal.thDecade", "Decade")}</th>
                    <th className="px-4 py-3 text-rose-700">{t("decadal.thTempMax", "Avg Max Temp")}</th>
                    <th className="px-4 py-3 text-blue-700">{t("decadal.thTempMin", "Avg Min Temp")}</th>
                    <th className="px-4 py-3 text-sky-700">{t("decadal.thPrecipitation", "Annual Precipitation")}</th>
                    <th className="px-4 py-3 rounded-r-lg text-emerald-700">{t("decadal.thGdd", "GDD Accumulated")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chartData.map((row) => (
                    <tr key={row.decade} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold">{row.decade}</td>
                      <td className="px-4 py-3 text-rose-600 font-mono">{row.avgTempMax}°{tempUnit}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono">{row.avgTempMin}°{tempUnit}</td>
                      <td className="px-4 py-3 text-sky-600 font-mono">{row.cumulativeRain} {rainUnit}</td>
                      <td className="px-4 py-3 text-emerald-600 font-mono font-bold">{row.accumulatedGdd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Raw Decadal JSON Explorer */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t("decadal.rawPayloadTitle", "Raw API Response Payload")}</h4>
                  <p className="text-xs text-gray-400">{t("decadal.rawPayloadSubtitle", "Contains 100% of underlying Open-Meteo ERA5 / Copernicus historical climate parameters")}</p>
                </div>
                <button 
                  onClick={() => setShowRawJSON(!showRawJSON)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-700 transition"
                >
                  {showRawJSON ? t("decadal.hideRaw", "Hide Payload") : t("decadal.showRaw", "Inspect Payload")}
                </button>
              </div>

              {showRawJSON && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button 
                      onClick={handleCopyJSON}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-500/10 text-amber-700 hover:bg-amber-505/20 rounded-md transition"
                    >
                      {t("decadal.copyToClipboard", "Copy JSON to Clipboard")}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-amber-450 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 text-amber-300">
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
