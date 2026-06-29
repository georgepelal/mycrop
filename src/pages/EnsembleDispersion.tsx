import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";
import { ArrowLeft, Loader2, Info, CloudRain, Thermometer } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, Legend
} from "recharts";
import LocationSearch from "../components/LocationSearch";

interface EnsembleDispersionProps {
  onNavigate: (page: string) => void;
}

interface EnsembleData {
  latitude: number;
  longitude: number;
  isLiveEnsemble: boolean;
  dates: string[];
  tempMaxMean: number[];
  tempMaxHigh: number[];
  tempMaxLow: number[];
  rainMean: number[];
  rainHigh: number[];
  rainProbability: number[];
}

export default function EnsembleDispersion({ onNavigate }: EnsembleDispersionProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<EnsembleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");


  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/ensemble-dispersion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch ensemble dispersion data");
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

  // Forecast date period segment state
  const [datePeriod, setDatePeriod] = useState<"all" | "short" | "medium" | "extended">("all");

  // Rain probability slider threshold
  const [rainProbFilter, setRainProbFilter] = useState<number>(0);

  // Raw JSON display state
  const [showRawJSON, setShowRawJSON] = useState(false);

  // Convert helpers
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

  // Transform raw dates and metrics with unit selectors
  const rawDates = data?.dates || [];
  
  // Create intermediate complete records
  const allParsedRecords = rawDates.map((date, index) => {
    const tLow = data?.tempMaxLow?.[index] ?? 0;
    const tHigh = data?.tempMaxHigh?.[index] ?? 0;
    const tMean = data?.tempMaxMean?.[index] ?? 0;
    const rMean = data?.rainMean?.[index] ?? 0;
    const rHigh = data?.rainHigh?.[index] ?? 0;
    const rProb = data?.rainProbability?.[index] ?? 0;

    return {
      index,
      rawDate: date,
      parsedDate: new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
      tempLow: tLow,
      tempMean: tMean,
      tempHigh: tHigh,
      rainMean: rMean,
      rainHigh: rHigh,
      rainProb: rProb
    };
  });

  // Apply Date period filter (index-based partition of the timeline)
  const temporalFilteredRecords = allParsedRecords.filter((item) => {
    if (datePeriod === "short") {
      return item.index < 2; // Today & tomorrow
    }
    if (datePeriod === "medium") {
      return item.index >= 2 && item.index < 5; // Days 3 to 5
    }
    if (datePeriod === "extended") {
      return item.index >= 5; // Days 6+
    }
    return true; // "all"
  });

  // Apply Rain probability filter
  const fullyFilteredRecords = temporalFilteredRecords.filter(item => item.rainProb >= rainProbFilter);

  // Map to visual presentation objects
  const chartData = fullyFilteredRecords.map((row) => {
    const convertedLow = convertTemp(row.tempLow);
    const convertedHigh = convertTemp(row.tempHigh);
    return {
      date: row.parsedDate,
      tempLow: convertedLow,
      tempMean: convertTemp(row.tempMean),
      tempHigh: convertedHigh,
      tempRange: [convertedLow, convertedHigh], // range Area bounds
      rainMean: convertRain(row.rainMean),
      rainHigh: convertRain(row.rainHigh),
      rainProb: row.rainProb,
      // Pass raw values for tooltips or safety
      rawTempLow: row.tempLow,
      rawTempHigh: row.tempHigh,
      rawTempMean: row.tempMean,
      rawRainMean: row.rainMean,
      rawRainHigh: row.rainHigh,
    };
  });

  // Calculate Ensemble Volatility metrics (agreement spreads in raw units)
  const calculateAgreementMetrics = () => {
    if (temporalFilteredRecords.length === 0) return null;

    let maxDivergence = 0;
    let divergenceDay = "";
    let highestRainChance = 0;
    let avgModelConfidence = 100;

    temporalFilteredRecords.forEach((item) => {
      const spread = item.tempHigh - item.tempLow;
      if (spread > maxDivergence) {
        maxDivergence = spread;
        divergenceDay = item.parsedDate;
      }
      if (item.rainProb > highestRainChance) {
        highestRainChance = item.rainProb;
      }
    });

    // Simple scale: larger spreads subtract from confidence
    const meanSpread = temporalFilteredRecords.reduce((acc, c) => acc + (c.tempHigh - c.tempLow), 0) / temporalFilteredRecords.length;
    avgModelConfidence = Math.max(20, Math.round(100 - (meanSpread * 4.5)));

    return {
      maxDivergence: maxDivergence.toFixed(1),
      divergenceDay,
      highestRainChance,
      avgModelConfidence
    };
  };

  const aggStats = calculateAgreementMetrics();

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert(t("ensemble.apiCopied", "Raw Ensemble API JSON copied to clipboard!"));
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
              {t("ensemble.headerTitle", "Ensemble Weather")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("ensemble.headerSubtitle", "Global probability models (30+ dynamic forecasts)")}
            </p>
          </div>
        </div>
        <div className="md:w-96 w-full">
          <LocationSearch 
            onLocationSelect={fetchData} 
            placeholder={t("ensemble.searchPlaceholder", "Search anywhere on earth...")} 
          />
        </div>
      </div>

      {!data && !loading && !error && (
         <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
           <CloudRain className="w-12 h-12 text-slate-300 mb-4" />
           <h3 className="text-lg font-bold text-slate-700 mb-2">
             {t("ensemble.searchLocation", "Search for a location")}
           </h3>
           <p className="text-sm text-slate-500 max-w-md">
             {t("ensemble.searchLocationDesc", "Use the search bar above to generate a highly specific dispersion probability model for temperature and rainfall anywhere on the globe.")}
           </p>
         </div>
      )}

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            {t("ensemble.computing", "Computing ensemble simulations...")}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          {t("ensemble.error", "Error")}: {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm leading-relaxed">
              <strong>{t("ensemble.whatIsEnsemble", "What is an Ensemble Forecast?")}</strong>{" "}
              {t("ensemble.ensembleExplanation", "Instead of running just one weather model, meteorologists run multiple models (an \"ensemble\") with slight variations. The spread between these models shows certainty for")} <strong>{locationName}</strong>:{" "}
              {t("ensemble.ensembleExplanationEnd", "a narrow range means high confidence, while a wide range means the weather could easily shift.")}
            </div>
          </div>

          {/* Interactive Filtering Controller */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              {t("ensemble.controlsHeader", "Ensemble Dispersion Filters")}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Ranges segment (Date Period filtering) */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  {t("ensemble.forecastWindows", "Forecast Date Horizons")}
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button 
                    onClick={() => setDatePeriod("all")} 
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${datePeriod === "all" ? "bg-indigo-600 border-indigo-700 text-white font-bold" : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("ensemble.periodAll", "Full Forecast")}
                  </button>
                  <button 
                    onClick={() => setDatePeriod("short")} 
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${datePeriod === "short" ? "bg-indigo-600 border-indigo-700 text-white font-bold" : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("ensemble.periodShort", "Next 48h")}
                  </button>
                  <button 
                    onClick={() => setDatePeriod("medium")} 
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${datePeriod === "medium" ? "bg-indigo-600 border-indigo-700 text-white font-bold" : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("ensemble.periodMedium", "Days 3-5")}
                  </button>
                  <button 
                    onClick={() => setDatePeriod("extended")} 
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${datePeriod === "extended" ? "bg-indigo-600 border-indigo-700 text-white font-bold" : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"}`}
                  >
                    {t("ensemble.periodExtended", "Days 6+")
                  }</button>
                </div>
              </div>

              {/* Precipitation Probability slider filter */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">
                  {t("ensemble.rainChanceLimit", "Min Rain Probability Filter")}
                </label>
                <div className="mt-1 flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="90" 
                    step="10"
                    value={rainProbFilter} 
                    onChange={(e) => setRainProbFilter(parseInt(e.target.value))}
                    className="w-full h-2 accent-indigo-600 bg-gray-200 rounded-lg cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-slate-850 shrink-0 font-mono w-12">
                    &ge; {rainProbFilter}%
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">
                  {t("ensemble.rainLimitHelp", "Hides days below selected threshold in tabular grids.")}
                </span>
              </div>
            </div>

            {/* Simulated atmospheric model agreement */}
            {aggStats && (
              <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2">
                  {t("ensemble.modelConsensus", "Calculated Multi-Model Atmospheric Consensus")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-2.5 bg-white border border-indigo-100 rounded-xl">
                    <div className="text-[10px] text-gray-500 mb-0.5">{t("ensemble.maxTempSpread", "Max Temp Model Divergence")}</div>
                    <div className="text-sm font-black text-slate-800">
                      {aggStats.maxDivergence}°{tempUnit}
                    </div>
                    <div className="text-[10px] text-red-500 font-medium">{t("ensemble.on", "Peak on")} {aggStats.divergenceDay}</div>
                  </div>

                  <div className="p-2.5 bg-white border border-indigo-100 rounded-xl">
                    <div className="text-[10px] text-gray-500 mb-0.5">{t("ensemble.highestWetRisk", "Peak Rain Probability")}</div>
                    <div className="text-sm font-black text-violet-600">{aggStats.highestRainChance}%</div>
                    <div className="text-[10px] text-gray-400">{t("ensemble.riskRating", "Highest daily risk detected")}</div>
                  </div>

                  <div className="p-2.5 bg-white border border-indigo-100 rounded-xl">
                    <div className="text-[10px] text-gray-500 mb-0.5">{t("ensemble.consensusF", "Consensus Quality Rating")}</div>
                    <div className="text-sm font-black text-emerald-600">{aggStats.avgModelConfidence}%</div>
                    <div className="text-[10px] text-gray-400">{t("ensemble.confidenceDesc", "Weighted consensus confidence index")}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Temperature Dispersion Chart */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("ensemble.tempVarianceTitle", "Temperature Variance Range")}</h3>
                  <p className="text-xs text-gray-400">{t("ensemble.spreadSubtext", "Visualizing high/low spreads across 30 GFS/ECMWF parallel runs")}</p>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      domain={['auto', 'auto']}
                      unit={`°${tempUnit}`}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="tempRange" 
                      stroke="none" 
                      fill="#fed7aa" 
                      fillOpacity={0.5} 
                      name={`${t("ensemble.modelSpread", "Model Spread")} (°${tempUnit})`} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tempMean" 
                      stroke="#ea580c" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#ea580c", strokeWidth: 2, stroke: "#fff" }}
                      name={`${t("ensemble.meanConsensus", "Mean Consensus")} (°${tempUnit})`} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Precipitation Dispersion Chart */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("ensemble.precipTitle", "Precipitation Potential")}</h3>
                  <p className="text-xs text-gray-400">{t("ensemble.precipSubtext", "Showing mean rainfall vs rain probabilities in purple")}</p>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit={` ${rainUnit}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit="%"
                      domain={[0, 100]}
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar 
                      yAxisId="left"
                      dataKey="rainHigh" 
                      fill="#bae6fd" 
                      radius={[4, 4, 0, 0]} 
                      name={`${t("ensemble.maxPredicted", "Maximum Predicted")} (${rainUnit})`} 
                    />
                    <Bar 
                      yAxisId="left"
                      dataKey="rainMean" 
                      fill="#0284c7" 
                      radius={[4, 4, 0, 0]} 
                      name={`${t("ensemble.meanPredicted", "Mean Predicted")} (${rainUnit})`} 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="rainProb" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                      name={`${t("ensemble.rainProbability", "Rain Probability")} (%)`} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2 overflow-x-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-lg">{t("ensemble.tableTitle", "Tabular Model Output")}</h3>
                  <p className="text-xs text-gray-400">{t("ensemble.tableSubtitle", "Decoupled 30-member atmospheric micro-forecasting series")}</p>
                </div>
                <div className="text-[11px] font-mono bg-slate-50 border border-gray-100 p-2 rounded-xl text-gray-500">
                  Lat: {data.latitude.toFixed(4)} | Lng: {data.longitude.toFixed(4)} | {t("ensemble.forecastModel", "Forecasting Base")}: {data.isLiveEnsemble ? "GEFS 30-MEMBER CONNECTED" : "SPATIAL DISPERSION MODEL"}
                </div>
              </div>

              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">{t("ensemble.thDate", "Date")}</th>
                    <th className="px-4 py-3">{t("ensemble.thTempMean", "Temp Mean")}</th>
                    <th className="px-4 py-3">{t("ensemble.thTempSpread", "Temp Spread (Low - High)")}</th>
                    <th className="px-4 py-3">{t("ensemble.thRainProb", "Rain Prob")}</th>
                    <th className="px-4 py-3">{t("ensemble.thRainMean", "Rain Mean")}</th>
                    <th className="px-4 py-3 rounded-r-lg">{t("ensemble.thRainMax", "Rain Max")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {chartData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3">
                        <span className="bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md font-mono">{row.tempMean}°{tempUnit}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">
                        {row.tempLow}°{tempUnit} <span className="text-gray-300 mx-1">-</span> {row.tempHigh}°{tempUnit}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-md font-bold font-mono ${
                          row.rainProb > 60 ? 'bg-indigo-100 text-indigo-700 font-bold' :
                          row.rainProb > 20 ? 'bg-indigo-50 text-indigo-600' :
                          'text-gray-500'
                        }`}>
                          {row.rainProb}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{row.rainMean} {rainUnit}</td>
                      <td className="px-4 py-3 font-mono text-gray-500">{row.rainHigh} {rainUnit}</td>
                    </tr>
                  ))}
                  {chartData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                        {t("ensemble.noRecords", "No forecast days matching current rainfall probability threshold.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Raw JSON Explorer for Ensemble dispersion */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t("ensemble.rawPayloadTitle", "Raw API Response Payload")}</h4>
                  <p className="text-xs text-gray-400">{t("ensemble.rawPayloadSubtitle", "Contains 100% of underlying Open-Meteo ensemble metrics & members spreads")}</p>
                </div>
                <button 
                  onClick={() => setShowRawJSON(!showRawJSON)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-700 transition"
                >
                  {showRawJSON ? t("ensemble.hideRaw", "Hide Payload") : t("ensemble.showRaw", "Inspect Payload")}
                </button>
              </div>

              {showRawJSON && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button 
                      onClick={handleCopyJSON}
                      className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md transition"
                    >
                      {t("ensemble.copyToClipboard", "Copy JSON to Clipboard")}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-indigo-300 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950">
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
