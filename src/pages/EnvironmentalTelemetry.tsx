import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/useSettings";
import { ArrowLeft, Loader2, Wind, CloudSun, ShieldCheck, BarChart4, Compass } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from "recharts";
import LocationSearch from "../components/LocationSearch";

interface EnvironmentalTelemetryProps {
  onNavigate: (page: string) => void;
}

interface AirQuality {
  aqi: number;
  aqiLabel: string;
  pm2_5: number;
  pm10: number;
  no2: number;
  ozone: number;
  so2: number;
}

interface TelemetryData {
  latitude: number;
  longitude: number;
  elevation: number;
  atmosphericPressure: number;
  airQuality: AirQuality;
  timestamp: string;
}

export default function EnvironmentalTelemetry({ onNavigate }: EnvironmentalTelemetryProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocationName] = useState("");

  // Visual filter state
  const [visibleGasses, setVisibleGasses] = useState({
    pm25: true,
    pm10: true,
    no2: true,
    ozone: true,
    so2: true,
  });

  // Global unit settings
  const { elevUnit, pressUnit } = useSettings();

  // Raw JSON display state
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    try {
      const response = await fetch("/api/environmental-telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch environmental telemetry");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return { bg: "bg-emerald-50 text-emerald-800 border-emerald-100", text: "text-emerald-600", bar: "#10b981" };
    if (aqi <= 100) return { bg: "bg-amber-50 text-amber-800 border-amber-100", text: "text-amber-600", bar: "#f59e0b" };
    return { bg: "bg-rose-50 text-rose-800 border-rose-100", text: "text-rose-600", bar: "#f43f5e" };
  };

  const aqiStyle = data ? getAqiColor(data.airQuality.aqi) : { bg: "", text: "", bar: "#64748b" };

  // Conversions
  const convertElev = (m: number) => {
    if (elevUnit === "ft") {
      return parseFloat((m * 3.28084).toFixed(1));
    }
    return m;
  };

  const convertPress = (hpa: number) => {
    if (pressUnit === "psi") return parseFloat((hpa * 0.0145038).toFixed(3));
    if (pressUnit === "atm") return parseFloat((hpa * 0.000986923).toFixed(4));
    if (pressUnit === "mmHg") return parseFloat((hpa * 0.750062).toFixed(1));
    return hpa;
  };

  // Live plant foliage & photosynthetic safety diagnostics
  const getFoliageWarnings = () => {
    if (!data) return [];
    const warnings = [];
    const aq = data.airQuality;

    if (aq.ozone > 80) {
      warnings.push({
        gas: "Ozone (O₃)",
        value: aq.ozone,
        severity: "severe",
        text: t("env.warningOzone", "Stomatal cell oxidation alert. Ambient O₃ level over 80 µg/m³ triggers cellular necrosis, depressing foliage photosynthesis efficiency by up to 15%."),
      });
    }
    if (aq.pm2_5 > 25) {
      warnings.push({
        gas: "Fine Dust (PM2.5)",
        value: aq.pm2_5,
        severity: "medium",
        text: t("env.warningPm25", "Leaf dust accumulation risk. Fine airborne particulates block leaf stoma, disrupting critical daytime gas-exchanges."),
      });
    }
    if (aq.so2 > 20) {
      warnings.push({
        gas: "Sulfur Dioxide (SO₂)",
        value: aq.so2,
        severity: "severe",
        text: t("env.warningSo2", "Acid rain risk factor. SO₂ transforms into sulfurous complexes on aqueous foliage surfaces, altering pH balance."),
      });
    }
    if (aq.no2 > 30) {
      warnings.push({
        gas: "Nitrogen Dioxide (NO₂)",
        value: aq.no2,
        severity: "low",
        text: t("env.warningNo2", "Nitrogen overload warning. High ambient nitrogen oxide increases vegetation vulnerability to pathogenic fungal agents."),
      });
    }

    return warnings;
  };

  const foliageAlerts = getFoliageWarnings();

  // Calculate altitude-derived density index
  const calculateAtmosphericDensity = () => {
    if (!data) return null;
    // Estimated relative air density at altitude (approx 100% at sea level, dropping 1% per 85m)
    const relativeDensity = Math.max(30, 100 - (data.elevation / 85));
    // Estimated oxygen partial pressure in kPa (standard is 21.2 kPa at sea level)
    const estimO2 = (21.2 * (data.atmosphericPressure / 1013.25)).toFixed(2);

    return {
      relativeDensity: relativeDensity.toFixed(1),
      estimO2
    };
  };

  const atmAnalytics = calculateAtmosphericDensity();

  // Create chart data depending on toggles
  const rawGassesData = data ? [
    { key: "pm25", name: t("env.pm25", "PM2.5"), value: data.airQuality.pm2_5, unit: "µg/m³" },
    { key: "pm10", name: t("env.pm10", "PM10"), value: data.airQuality.pm10, unit: "µg/m³" },
    { key: "no2", name: t("env.no2", "NO₂"), value: data.airQuality.no2, unit: "µg/m³" },
    { key: "ozone", name: t("env.ozone", "Ozone"), value: data.airQuality.ozone, unit: "µg/m³" },
    { key: "so2", name: t("env.so2", "SO₂"), value: data.airQuality.so2, unit: "µg/m³" },
  ] : [];

  const gassesData = rawGassesData.filter(gas => {
    if (gas.key === "pm25") return visibleGasses.pm25;
    if (gas.key === "pm10") return visibleGasses.pm10;
    if (gas.key === "no2") return visibleGasses.no2;
    if (gas.key === "ozone") return visibleGasses.ozone;
    if (gas.key === "so2") return visibleGasses.so2;
    return true;
  });

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert(t("env.apiCopied", "Raw telemetry response copied!"));
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
              {t("env.headerTitle", "Environmental & Air Quality Telemetry")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("env.headerSubtitle", "Real-time atmospheric composition, altitude registries, and aerosol loads")}
            </p>
          </div>
        </div>
        <div className="md:w-96 w-full">
          <LocationSearch 
            onLocationSelect={fetchData} 
            placeholder={t("env.searchPlaceholder", "Search anywhere on earth...")} 
          />
        </div>
      </div>

      {!data && !loading && !error && (
         <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
           <Wind className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
           <h3 className="text-lg font-bold text-slate-700 mb-2">
             {t("env.selectLocation", "Select a Location")}
           </h3>
           <p className="text-sm text-slate-500 max-w-md">
             {t("env.selectLocationDesc", "Search above to capture live atmospheric pressure, ambient particulate matter, sulfur concentrations and ozone indices analyzed directly via open environmental APIs.")}
           </p>
         </div>
      )}

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            {t("env.loading", "Pulsing geographical sensing stations...")}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          {t("env.error", "Error")}: {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t("env.elevation", "Altitude Registry")}
              </div>
              <div className="text-2xl font-black text-slate-800">
                {convertElev(data.elevation).toLocaleString()} {elevUnit}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-500" />
                {t("env.elevationSub", "Open-Meteo elevation database index")}
              </div>
            </div>

            <div className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t("env.pressure", "Atmospheric Pressure")}
              </div>
              <div className="text-2xl font-black text-slate-800">
                {convertPress(data.atmosphericPressure).toLocaleString(undefined, { maximumFractionDigits: 3 })} <span className="text-xs font-normal text-gray-500">{pressUnit}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                <CloudSun className="w-3.5 h-3.5 text-sky-500" />
                {t("env.pressureDesc", "Barometric elevation adjusted standard pressure")}
              </div>
            </div>

            <div className={`border rounded-2xl p-5 shadow-sm ${aqiStyle.bg}`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t("env.aqi", "Air Quality Index (AQI)")}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{data.airQuality.aqi}</span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  ({data.airQuality.aqiLabel})
                </span>
              </div>
              <div className="text-[10px] mt-2">
                {t("env.aqiRating", "US EPA classification rating index")}
              </div>
            </div>
          </div>

          {/* Environmental parameters and controllers */}
          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 justify-between items-stretch">
              <div className="space-y-2 max-w-xl">
                <h3 className="font-bold text-gray-800 text-base">{t("env.selectorsTitle", "Pollutant Focus Channels")}</h3>
                <p className="text-xs text-gray-400">{t("env.selectorsDesc", "Toggle channels to highlight specific molecular mass values on the aerosol concentration grid:")}</p>
                
                <div className="flex flex-wrap gap-3 pt-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer bg-slate-50 border border-slate-100 p-2 rounded-xl hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 rounded" 
                      checked={visibleGasses.pm25} 
                      onChange={(e) => setVisibleGasses({...visibleGasses, pm25: e.target.checked})} 
                    />
                    <span>{t("env.gasPm25", "PM2.5 (Fine)")}</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer bg-slate-50 border border-slate-100 p-2 rounded-xl hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 rounded" 
                      checked={visibleGasses.pm10} 
                      onChange={(e) => setVisibleGasses({...visibleGasses, pm10: e.target.checked})} 
                    />
                    <span>{t("env.gasPm10", "PM10 (Dust)")}</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer bg-slate-50 border border-slate-100 p-2 rounded-xl hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 rounded" 
                      checked={visibleGasses.no2} 
                      onChange={(e) => setVisibleGasses({...visibleGasses, no2: e.target.checked})} 
                    />
                    <span>NO₂</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer bg-slate-50 border border-slate-100 p-2 rounded-xl hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 rounded" 
                      checked={visibleGasses.ozone} 
                      onChange={(e) => setVisibleGasses({...visibleGasses, ozone: e.target.checked})} 
                    />
                    <span>O₃ (Ozone)</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer bg-slate-50 border border-slate-100 p-2 rounded-xl hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      className="accent-emerald-600 rounded" 
                      checked={visibleGasses.so2} 
                      onChange={(e) => setVisibleGasses({...visibleGasses, so2: e.target.checked})} 
                    />
                    <span>SO₂</span>
                  </label>
                </div>
              </div>

              {/* Dynamic Altitude Analytics */}
              {atmAnalytics && (
                <div className="flex-1 md:max-w-xs bg-slate-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">{t("env.densityHeader", "Altitude density analytics")}</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t("env.rad", "Relative Air Density (RAD)")}</span>
                      <span className="font-bold text-slate-800">{atmAnalytics.relativeDensity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, parseFloat(atmAnalytics.relativeDensity))}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">{t("env.partialO2", "Estim. Oxygen Pressure")}</span>
                      <span className="font-bold text-slate-800 font-mono">{atmAnalytics.estimO2} kPa</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plant Pathogen/Oxidant Warning System */}
          <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-emerald-950 text-base">{t("env.riskSystemHeader", "Agricultural foliage & canopy health risk summary")}</h3>
            </div>
            
            {foliageAlerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {foliageAlerts.map((war, i) => (
                  <div key={i} className="bg-white border rounded-2xl p-4 shadow-sm flex items-start gap-3">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${war.severity === "severe" ? "bg-rose-500 animate-ping" : "bg-amber-400"}`}></span>
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {war.gas} &middot; <span className="font-mono text-red-650 text-rose-600 font-bold">{war.value} µg/m³</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {war.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-800 leading-normal">
                {t("env.noRisks", "Vegetation conditions are perfect! Standard aerosol particulate loads index below all warning thresholds. Safe ambient gases allow maximum plant stoma breathing and undisturbed nighttime cellular respiration.")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pollutant Detail Chart */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center">
                  <BarChart4 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("env.pollutantsTitle", "Aerosol Concentration Metrics")}</h3>
                  <p className="text-xs text-gray-400">{t("env.chartSub", "Refinement of molecular concentration weights per visible component")}</p>
                </div>
              </div>
              
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gassesData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit=" µg"
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any, props: any) => [`${value} ${props.payload.unit}`, t("env.concentration", "Concentration")]}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#0284c7" 
                      radius={[6, 6, 0, 0]} 
                    >
                      {gassesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.key === "pm25" || entry.key === "pm10" ? "#0284c7" : "#8b5cf6"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Parameter Definitions table */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-4">{t("env.tableTitle", "Sensing Parameters")}</h3>
                <div className="divide-y divide-slate-100">
                  <div className={`py-2 flex justify-between text-sm ${visibleGasses.pm25 ? "" : "opacity-30"}`}>
                    <span className="font-medium text-slate-500">{t("env.tablePm25", "PM2.5 (Fine dust)")}</span>
                    <span className="font-bold text-slate-800 font-mono">{data.airQuality.pm2_5} µg/m³</span>
                  </div>
                  <div className={`py-2 flex justify-between text-sm ${visibleGasses.pm10 ? "" : "opacity-30"}`}>
                    <span className="font-medium text-slate-500">{t("env.tablePm10", "PM10 (Coarse dust)")}</span>
                    <span className="font-bold text-slate-800 font-mono">{data.airQuality.pm10} µg/m³</span>
                  </div>
                  <div className={`py-2 flex justify-between text-sm ${visibleGasses.no2 ? "" : "opacity-30"}`}>
                    <span className="font-medium text-slate-500">{t("env.tableNo2", "Nitrogen Dioxide")}</span>
                    <span className="font-bold text-slate-800 font-mono">{data.airQuality.no2} µg/m³</span>
                  </div>
                  <div className={`py-2 flex justify-between text-sm ${visibleGasses.ozone ? "" : "opacity-30"}`}>
                    <span className="font-medium text-slate-500">{t("env.tableOzone", "Ozone Layer Index")}</span>
                    <span className="font-bold text-slate-800 font-mono">{data.airQuality.ozone} µg/m³</span>
                  </div>
                  <div className={`py-2 flex justify-between text-sm ${visibleGasses.so2 ? "" : "opacity-30"}`}>
                    <span className="font-medium text-slate-500">{t("env.tableSo2", "Sulfur Dioxide")}</span>
                    <span className="font-bold text-slate-800 font-mono">{data.airQuality.so2} µg/m³</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[10px] text-slate-400 leading-normal">
                {t("env.tableCitation", "Sensing feeds are parsed from the European Environment Agency (EEA) and US Environmental Protection Agency standard definitions modeled by Open-Meteo.")}
              </div>
            </div>

            {/* Raw JSON Environmental telemetry explorer */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm xl:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">{t("env.rawPayloadTitle", "Raw API Response Payload")}</h4>
                  <p className="text-xs text-gray-400">{t("env.rawPayloadSubtitle", "Contains 100% of live Copernicus/Open-Meteo Air Quality telemetry parameters")}</p>
                </div>
                <button 
                  onClick={() => setShowRawJSON(!showRawJSON)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-700 transition"
                >
                  {showRawJSON ? t("env.hideRaw", "Hide Payload") : t("env.showRaw", "Inspect Payload")}
                </button>
              </div>

              {showRawJSON && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button 
                      onClick={handleCopyJSON}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md transition"
                    >
                      {t("env.copyToClipboard", "Copy JSON to Clipboard")}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950">
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
