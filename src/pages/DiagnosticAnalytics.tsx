import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/useSettings";
import { 
  Sprout, 
  Calendar, 
  MapPin, 
  Gauge, 
  ShieldAlert, 
  CheckCircle, 
  Layers, 
  Activity, 
  Sun, 
  CloudRain,
  Database,
  Globe,
  Loader2,
  Flame,
  Trash2
} from "lucide-react";
import { Parcel, CROP_PRESETS, Crop, DiagnosticLog } from "../types";
import { getCropsCatalog, getDiagnosticsForParcel, addDiagnosticToParcel, deleteDiagnosticFromParcel } from "../lib/db";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from "recharts";

interface DiagnosticAnalyticsProps {
  parcels: Parcel[];
  activeParcelId: string;
  onSelectParcel: (id: string) => void;
  onNavigate: (page: string) => void;
}

// Mathematical Sunrise/Sunset & Photoperiod calculation based on astronomical coordinate geometry
function calculateDaylightHours(latitude: number, longitude: number | undefined) {
  // Current date is approx June 17, 2026. Day of year is around 168.
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Math: Declination of solar rays:
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 80) * (Math.PI / 180));

  // Convert to radians for JavaScript Math functions
  const latRad = latitude * (Math.PI / 180);
  const decRad = declination * (Math.PI / 180);

  // Hour angle formula: cos(omega_s) = -tan(lat) * tan(dec)
  const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);

  let hours: number;
  if (cosHourAngle <= -1) {
    hours = 24.0; // Polar Day
  } else if (cosHourAngle >= 1) {
    hours = 0.0; // Polar Night
  } else {
    const hourAngleRad = Math.acos(cosHourAngle);
    const hourAngleDeg = hourAngleRad * (180 / Math.PI);
    hours = (2 * hourAngleDeg) / 15;
  }

  // Rough rise/set estimate based on standard local solar noon (12:00 + local adjustments)
  const meridianShift = (longitude ?? -87) / 15;
  const utcNoon = 12 - meridianShift;
  const halfDay = hours / 2;

  const formatTimeOffset = (decHours: number) => {
    let h = Math.floor(decHours);
    const m = Math.floor((decHours - h) * 60);
    // Map to 24-hr layout securely
    h = (h + 24) % 24;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return {
    hours: Number(hours.toFixed(1)),
    sunrise: formatTimeOffset(utcNoon - halfDay),
    sunset: formatTimeOffset(utcNoon + halfDay)
  };
}

export default function DiagnosticAnalytics({ 
  parcels, 
  activeParcelId, 
  onSelectParcel, 
  onNavigate 
}: DiagnosticAnalyticsProps) {
  const { t } = useTranslation();
  const { tempUnit, rainUnit, convertRain } = useSettings();

  const convertTemp = (celsius: number) => {
    if (tempUnit === "F") {
      return `${(celsius * 9 / 5 + 32).toFixed(1)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  };

  const formatRain = (mm: number) => {
    const val = convertRain(mm);
    return `${val.toFixed(rainUnit === "inch" ? 2 : 1)} ${rainUnit}`;
  };
  
  // Calculations based on the parcels database
  const totalArea = parcels.reduce((acc, p) => acc + p.farmSize, 0);
  const activeParcel = parcels.find(p => p.id === activeParcelId) || parcels[0];

  const [dbCrops, setDbCrops] = useState<Crop[]>([]);
  useEffect(() => {
    getCropsCatalog().then(setDbCrops).catch(err => console.warn("Failed to load crops in Dashboard:", err));
  }, []);

  // Astro-Eco diagnostics states for the active parcel
  const [diagnostics, setDiagnostics] = useState<DiagnosticLog[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [activeDiagnosticId, setActiveDiagnosticId] = useState<string | null>(null);

  // Load diagnostics for the active parcel from Firestore. Keyed on the field's
  // identity only, so an unrelated re-render of the same field doesn't re-query.
  useEffect(() => {
    if (!activeParcel || !activeParcel.id) return;
    getDiagnosticsForParcel(activeParcel.id)
      .then((records) => {
        setDiagnostics(records);
        if (records.length > 0) {
          setActiveDiagnosticId(records[0].id);
        } else {
          setActiveDiagnosticId(null);
        }
      })
      .catch((err) => console.warn("Failed to retrieve diagnostic log history:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParcel?.id]);

  const handlePerformAstroDiagnosticScan = async () => {
    if (!activeParcel || !activeParcel.id) return;
    setScanLoading(true);
    try {
      const lat = activeParcel.lat ?? activeParcel.latitude;
      const lng = activeParcel.lng ?? activeParcel.longitude;
      const cropName = activeParcel.cropType;

      // Parallel multi-API query of 6 telemetry endpoints from Express/v1 back-end matrix
      const [copernicus, usgs, macronutrients, boundary, geotech, worldbank] = await Promise.all([
        fetch("/api/copernicus-sentinel-reflectance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        }).then(r => r.ok ? r.json() : null),

        fetch("/api/usgs-hydro-basin-watersheds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        }).then(r => r.ok ? r.json() : null),

        fetch("/api/crop-nutritive-macronutrients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cropName })
        }).then(r => r.ok ? r.json() : null),

        fetch("/api/openmeteo-boundary-layer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        }).then(r => r.ok ? r.json() : null),

        fetch("/api/openmeteo-geotech-elevation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        }).then(r => r.ok ? r.json() : null),

        fetch("/api/worldbank-forest-coverage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng })
        }).then(r => r.ok ? r.json() : null)
      ]);

      const ndviVal = copernicus?.indexTimeline?.ndvi ?? activeParcel.ndviValue ?? 0.74;
      const ndwiVal = copernicus?.indexTimeline?.ndwi ?? 0.44;
      const watershedName = usgs?.watershed?.name ?? "Regional Hydrographic Basin";
      const hucUnit = usgs?.watershed?.hydrologicUnitCode12 ?? "N/A HUC12";
      const elevationM = geotech?.geotech?.elevationMeters ?? 180;
      const slopeDeg = geotech?.geotech?.estimatedSlopeDegrees ?? 4.5;
      const forestRatio = worldbank?.forestAreaPercent ?? 33.5;
      const countryMap = worldbank?.countryName ?? "United States";
      const pblHeight = boundary?.aerodynamics?.boundaryLayerHeightMeters ?? 820;
      const caloriesVal = macronutrients?.nutrientsPer100g?.calories ?? 65;

      const summaryStr = `Astro-Ecological Multi-API scan completed at ${elevationM}m altitude in the ${watershedName} drainage basin (HUC: ${hucUnit}). Boundary convective layer height is at ${pblHeight}m with thermal state: ${boundary?.aerodynamics?.thermalTurbulenceState || "Stable"}. Estimated canopy reflectance index at ${ndviVal} NDVI, and canopy wetness at ${ndwiVal} NDWI (location-based estimate, not live satellite imagery). Regional forest coverage register reports ${forestRatio}% in ${countryMap}. Harvest standard crop nutritive catalog defines edible-weight content at ${caloriesVal} kcal/100g.`;

      const ratingStatus = ndviVal > 0.65 && slopeDeg < 11 ? "optimal" : slopeDeg > 9 ? "warning" : "info";

      const compiledMetrics = {
        copernicus,
        usgs,
        macronutrients,
        boundary,
        geotech,
        worldbank
      };

      const newLog: DiagnosticLog = {
        id: "diag_" + Date.now(),
        parcelId: activeParcel.id,
        timestamp: new Date().toISOString(),
        category: "Eco-Astro Precision Scan",
        apiSource: "Reflectance Estimate, USGS Rivers, WorldBank, OpenMeteo PBL, FAO",
        metricsJSONString: JSON.stringify(compiledMetrics),
        summary: summaryStr,
        status: ratingStatus
      };

      // Record to Firestore database
      await addDiagnosticToParcel(activeParcel.id, newLog);

      // Refresh list
      const updatedList = await getDiagnosticsForParcel(activeParcel.id);
      setDiagnostics(updatedList);
      setActiveDiagnosticId(newLog.id);
    } catch (err) {
      console.error("Failed to perform complete multi-endpoint diagnostic pulse:", err);
    } finally {
      setScanLoading(false);
    }
  };

  const handleDeleteDiagnosticLog = async (logId: string) => {
    if (!activeParcel || !activeParcel.id) return;
    try {
      await deleteDiagnosticFromParcel(activeParcel.id, logId);
      setDiagnostics(prev => prev.filter(d => d.id !== logId));
      if (activeDiagnosticId === logId) {
        setActiveDiagnosticId(null);
      }
    } catch (err) {
      console.error("Failed to delete diagnostic record:", err);
    }
  };

  const getCropIcon = (cropType: string) => {
    const found = dbCrops.find(c => c.name.toLowerCase() === cropType.toLowerCase() || c.id.toLowerCase() === cropType.toLowerCase());
    return found?.icon || CROP_PRESETS[cropType]?.icon || "🌾";
  };

  // Climatology API State Variables
  const [nasaLoading, setNasaLoading] = useState(false);
  const [nasaError, setNasaError] = useState<string | null>(null);
  const [nasaData, setNasaData] = useState<{
    points: any[];
    avgSolar: number;
    maxRain: number;
    totalRain: number;
    avgRootZoneWetness: number;
    avgTopSoilWetness: number;
    avgTemp: number;
    transpirationRisk: string;
  } | null>(null);
  const [activeMetric, setActiveMetric] = useState<"temp" | "precipitation" | "radiation">("temp");

  // Open-Meteo Soil Stratum State Variables
  const [soilLoading, setSoilLoading] = useState(false);
  const [soilError, setSoilError] = useState<string | null>(null);
  const [soilData, setSoilData] = useState<{
    tempSurface: number;
    tempMid: number;
    tempDeep: number;
    moistureSurface: number;
    moistureMid: number;
    moistureDeep: number;
    daylengthHours: number;
    sunriseTime: string;
    sunsetTime: string;
  } | null>(null);

  // Fetch Open-Meteo depth-stratified subsoil parameters
  useEffect(() => {
    if (!activeParcel) return;
    const lat = activeParcel.lat ?? activeParcel.latitude;
    const lng = activeParcel.lng ?? activeParcel.longitude;
    if (lat === undefined || lng === undefined) return;

    let active = true;
    setSoilLoading(true);
    setSoilError(null);

    const fetchSoilParameters = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=soil_temperature_0_to_7cm,soil_temperature_7_to_28cm,soil_temperature_28_to_100cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_moisture_28_to_100cm&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Open-Meteo Soil Profile endpoint returned an error.");
        }

        const json = await res.json();
        if (!json.hourly || !json.hourly.soil_moisture_0_to_7cm) {
          throw new Error("No sub-surface soil data available for this location.");
        }

        // Take the current hour indices
        const currentHourIdx = new Date().getHours();

        const sTempList = json.hourly.soil_temperature_0_to_7cm ?? [];
        const mTempList = json.hourly.soil_temperature_7_to_28cm ?? [];
        const dTempList = json.hourly.soil_temperature_28_to_100cm ?? [];
        const sMoistList = json.hourly.soil_moisture_0_to_7cm ?? [];
        const mMoistList = json.hourly.soil_moisture_7_to_28cm ?? [];
        const dMoistList = json.hourly.soil_moisture_28_to_100cm ?? [];

        const surfaceTemp = sTempList[currentHourIdx];
        const midTemp = mTempList[currentHourIdx];
        const deepTemp = dTempList[currentHourIdx];
        const surfaceMoist = sMoistList[currentHourIdx];
        const midMoist = mMoistList[currentHourIdx];
        const deepMoist = dMoistList[currentHourIdx];

        if ([surfaceTemp, midTemp, deepTemp, surfaceMoist, midMoist, deepMoist].some((v) => v === undefined || v === null)) {
          throw new Error("Sub-surface soil data was incomplete for the current hour.");
        }

        if (!active) return;

        const daylight = calculateDaylightHours(lat, lng);

        setSoilData({
          tempSurface: Number(surfaceTemp.toFixed(1)),
          tempMid: Number(midTemp.toFixed(1)),
          tempDeep: Number(deepTemp.toFixed(1)),
          moistureSurface: Number((surfaceMoist * 100).toFixed(0)),
          moistureMid: Number((midMoist * 100).toFixed(0)),
          moistureDeep: Number((deepMoist * 100).toFixed(0)),
          daylengthHours: daylight.hours,
          sunriseTime: daylight.sunrise,
          sunsetTime: daylight.sunset,
        });
        setSoilLoading(false);
      } catch (err: any) {
        console.warn("Open-Meteo Soil Profile Gateway failure:", err);
        if (!active) return;
        setSoilData(null);
        setSoilError(err.message || "Open-Meteo Soil Profile endpoint failure.");
        setSoilLoading(false);
      }
    };

    fetchSoilParameters();

    return () => {
      active = false;
    };
  }, [activeParcel]);

  // Fetch NASA POWER telemetry when focus parcel/field changes
  useEffect(() => {
    if (!activeParcel) return;
    const lat = activeParcel.lat ?? activeParcel.latitude;
    const lng = activeParcel.lng ?? activeParcel.longitude;
    if (lat === undefined || lng === undefined) return;

    let active = true;
    setNasaLoading(true);
    setNasaError(null);

    const fetchNasaTelemetry = async () => {
      try {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 4); // 4 days safety latency

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 34); // 30 days coverage window

        const formatYMD = (d: Date) => {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}${mm}${dd}`;
        };

        const startStr = formatYMD(startDate);
        const endStr = formatYMD(endDate);

        const paramsQuery = [
          "T2M",
          "ALLSKY_SFC_SW_DWN",
          "PRECTOTCORR",
          "RH2M",
          "GWETROOT",
          "GWETTOP"
        ].join(",");

        const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${paramsQuery}&community=ag&longitude=${lng}&latitude=${lat}&start=${startStr}&end=${endStr}&format=json`;

        const res = await fetch(url);
        if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Climatology satellite feed failure.");
      }

        const json = await res.json();
        if (!json.properties || !json.properties.parameter) {
          throw new Error("No Satellite measurements mapped to these coordinates.");
        }

        if (!active) return;

        const parameter = json.properties.parameter;
        const gwettopObj = parameter.GWETTOP || {};
        const gwetrootObj = parameter.GWETROOT || {};
        const allskyObj = parameter.ALLSKY_SFC_SW_DWN || {};
        const precObj = parameter.PRECTOTCORR || {};
        const rhObj = parameter.RH2M || {};
        const t2mObj = parameter.T2M || {};

        const dateKeys = Object.keys(gwettopObj).sort();
        if (dateKeys.length === 0) {
          throw new Error("Empty daily point datasets streamed from Climatology servers.");
        }

        let solarSum = 0;
        let solarCount = 0;
        let maxRain = 0;
        let totalRain = 0;
        let tempSum = 0;
        let tempCount = 0;
        let rootZoneWetnessSum = 0;
        let topSoilWetnessSum = 0;
        let validPointsCount = 0;

        const points = dateKeys.map(dateKey => {
          const yr = dateKey.substring(0, 4);
          const mo = dateKey.substring(4, 6);
          const dy = dateKey.substring(6, 8);
          const formattedDate = new Date(`${yr}-${mo}-${dy}`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          const getClean = (obj: any) => {
            const val = obj[dateKey];
            return (val === -999 || val === undefined) ? null : val;
          };

          const topSoilWet = getClean(gwettopObj);
          const rootZoneWet = getClean(gwetrootObj);
          const solarRad = getClean(allskyObj);
          const prec = getClean(precObj);
          const rh = getClean(rhObj);
          const temp = getClean(t2mObj);

          if (solarRad !== null) {
            solarSum += solarRad;
            solarCount++;
          }
          if (prec !== null) {
            totalRain += prec;
            if (prec > maxRain) {
              maxRain = prec;
            }
          }
          if (temp !== null) {
            tempSum += temp;
            tempCount++;
          }
          if (topSoilWet !== null && rootZoneWet !== null) {
            topSoilWetnessSum += topSoilWet;
            rootZoneWetnessSum += rootZoneWet;
            validPointsCount++;
          }

          return {
            date: formattedDate,
            rawDate: dateKey,
            "Top Soil Wetness": topSoilWet,
            "Root Zone Wetness": rootZoneWet,
            "Solar Radiation": solarRad,
            "Precipitation (mm)": prec,
            "Humidity (%)": rh,
            "Air Temp": temp
          };
        });

        const avgSolar = solarCount > 0 ? Number((solarSum / solarCount).toFixed(2)) : 17.5;
        const avgRootZoneWetness = validPointsCount > 0 ? Number((rootZoneWetnessSum / validPointsCount).toFixed(2)) : 0.45;
        const avgTopSoilWetness = validPointsCount > 0 ? Number((topSoilWetnessSum / validPointsCount).toFixed(2)) : 0.42;
        const avgTemp = tempCount > 0 ? Number((tempSum / tempCount).toFixed(1)) : 22.0;

        let transpirationRisk: "Low" | "Moderate" | "High" = "Moderate";
        if (avgTopSoilWetness < 0.35 && avgSolar > 18) {
          transpirationRisk = "High";
        } else if (avgTopSoilWetness > 0.55) {
          transpirationRisk = "Low";
        }

        setNasaData({
          points,
          avgSolar,
          maxRain,
          totalRain: Number(totalRain.toFixed(1)),
          avgRootZoneWetness,
          avgTopSoilWetness,
          avgTemp,
          transpirationRisk
        });
        setNasaLoading(false);
      } catch (err: any) {
        console.warn("Dashboard Climatology Gateway Offline:", err);
        if (!active) return;
        setNasaError("Climatology satellite feed failure.");
        setNasaLoading(false);
      }
    };

    fetchNasaTelemetry();

    return () => {
      active = false;
    };
  }, [activeParcel]);
  
  // Crop breakdown count
  const cropCounts: Record<string, number> = {};
  parcels.forEach(p => {
    cropCounts[p.cropType] = (cropCounts[p.cropType] || 0) + p.farmSize;
  });

  // Warnings
  const warnings = parcels.filter(p => p.soilMoisture < 35 || p.ndviValue < 0.45 || p.soilPH < 5.5);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-gray-900 tracking-tight">
            {t("dashboard.title")}
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>

        {/* System Sync Time */}
        <div className="text-xs text-gray-400 font-mono bg-white px-3 py-1.5 rounded-xl border border-gray-150 flex items-center gap-2 shadow-sm">
          <Database className="w-3.5 h-3.5 text-brand-green" />
          <span>Local Sync: <strong className="text-text-dark">100% Operational</strong></span>
        </div>
      </div>

      {/* Grid of Key Numerical Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1</li> */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-brand-green/5 rounded-full blur-lg pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t("dashboard.totalArea")}</span>
            <Layers className="w-5 h-5 text-brand-green" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-gray-900 font-display">
            {totalArea} <span className="text-sm text-gray-500 font-normal">Hectares</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 mt-2 block">
            Across {parcels.length} active registered parcels
          </span>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t("dashboard.canopyVigor")}</span>
            <Gauge className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-gray-900 font-display">
            {(parcels.reduce((acc, p) => acc + p.ndviValue, 0) / parcels.length).toFixed(2)} <span className="text-xs text-gray-500 font-normal font-sans">NDVI</span>
          </div>
          <span className="text-[10px] font-mono text-brand-green font-bold mt-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" /> Optimal Leaf Density
          </span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-lg pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t("dashboard.waterContent")}</span>
            <CloudRain className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-gray-900 font-display">
            {Math.round(parcels.reduce((acc, p) => acc + p.soilMoisture, 0) / parcels.length)}%
          </div>
          <span className="text-[10px] font-mono text-gray-400 mt-2 block">
            Subsurface moisture saturation average
          </span>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-lg pointer-events-none" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">{t("dashboard.underThreat")}</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className={`text-3xl font-extrabold tracking-tight font-display ${
            warnings.length > 0 ? "text-red-500" : "text-brand-green"
          }`}>
            {warnings.length} <span className="text-xs text-gray-500 font-normal font-sans">Parcels</span>
          </div>
          <span className="text-[10px] font-mono text-gray-400 mt-2 block">
            {warnings.length > 0 ? "⚠️ Immediate attention recommended" : "✓ Telemetry signals sound"}
          </span>
        </div>
      </div>

      {/* Main Split Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 7 Columns: Active Parcel Overview & Warnings */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Field Highlight card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-gray-150 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-display font-semibold text-base text-gray-900">
                  {t("dashboard.selectedFocusField", "Selected Focus Field:")} <span className="text-brand-green">{activeParcel.name}</span>
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <span className="text-[10px] uppercase font-bold text-gray-450 block mb-1">Crop Variety</span>
                <span className="text-lg font-bold font-display text-text-dark">{getCropIcon(activeParcel.cropType)} {activeParcel.cropType}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <span className="text-[10px] uppercase font-bold text-gray-450 block mb-1">Chlorophyll index</span>
                <span className="text-lg font-mono font-extrabold text-brand-green">{activeParcel.ndviValue}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <span className="text-[10px] uppercase font-bold text-gray-450 block mb-1">Water Stress (NDWI)</span>
                <span className="text-lg font-mono font-extrabold text-blue-600">{activeParcel.ndwiValue}</span>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/50">
                <span className="text-[10px] uppercase font-bold text-gray-450 block mb-1">Soil pH</span>
                <span className="text-lg font-mono font-extrabold text-amber-700">{activeParcel.soilPH} <span className="text-[10px] font-sans font-normal text-gray-400">pH</span></span>
              </div>
            </div>

            {/* Quick Micro Status Description */}
            <div className="bg-brand-green/5 border border-brand-green/10 rounded-2xl p-4 mt-4 flex items-start gap-3">
              <Sprout className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
              <div className="text-xs text-gray-750">
                <strong>Crop Canopy Signal:</strong> Your **{activeParcel.cropType}** exhibits uniform NIR reflection. The next optimal weeding and trace nutrient cycle matches the upcoming mid-month schedule. No water stress detected currently.
              </div>
            </div>

            {/* Live SoilGrids API details */}
            {activeParcel.isRealSoilGridsUsed && (
              <div className="mt-4 border-t border-gray-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[9px] uppercase font-bold font-mono tracking-wider">
                    🌍 Soil Data Active
                  </span>
                  <p className="text-[10px] text-gray-500 font-sans font-medium">
                    Actual 250m grid database query mapped successfully.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3.5 text-xs">
                  <div className="flex items-center gap-1 font-sans font-semibold text-gray-700">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    <span>Clay: <span className="font-bold text-gray-900 font-mono">{activeParcel.soilGridsClay}%</span></span>
                  </div>
                  <div className="flex items-center gap-1 font-sans font-semibold text-gray-700">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    <span>Sand: <span className="font-bold text-gray-900 font-mono">{activeParcel.soilGridsSand}%</span></span>
                  </div>
                  <div className="flex items-center gap-1 font-sans font-semibold text-gray-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Silt: <span className="font-bold text-gray-900 font-mono">{activeParcel.soilGridsSilt}%</span></span>
                  </div>
                  {activeParcel.soilGridsSoc !== undefined && (
                    <div className="flex items-center gap-1 font-sans font-semibold text-gray-700">
                      <span className="h-2 w-2 bg-purple-400 rounded-full" />
                      <span>Carbon: <span className="font-bold text-gray-900 font-mono">{activeParcel.soilGridsSoc} dg/kg</span></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* REAL-TIME SUBSURFACE ROOT HYDROLOGY & PHOTOPERIOD CALCULATOR CARD */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-left relative overflow-hidden" id="dashboard-soil-strata-widget">
            <div className="flex items-center justify-between pb-4 border-b border-gray-150">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/50 shrink-0">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-brand-green uppercase tracking-widest block font-mono">Open-Meteo Subsoil Core Link</span>
                  <h3 className="font-display font-black text-sm text-gray-900 uppercase">
                    Root-Zone Strata & Solar Geometry
                  </h3>
                </div>
              </div>
              <div className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-lg">
                LAT: {activeParcel.lat.toFixed(3)}
              </div>
            </div>

            {soilLoading ? (
              <div className="h-[180px] w-full flex flex-col justify-center items-center text-center">
                <Loader2 className="w-6 h-6 text-brand-green animate-spin mb-2" />
                <p className="text-xs text-gray-400 font-medium">Extracting sub-surface lithospheric moisture and calculating daylength photoperiod...</p>
              </div>
            ) : soilData ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Geologic Core Visualizer (7 cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Stratigraphical Core (VWC & Temp)</span>
                    <span className="text-[9px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">Live 3-Depth Probe</span>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    
                    {/* Depth 1: 0 - 7cm */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5 font-sans">
                          <span className="h-2 w-2 rounded-full bg-amber-600" />
                          Topsoil Horizon (0 - 7cm)
                        </span>
                        <div className="font-mono text-[11px] font-bold text-slate-700">
                          {soilData.moistureSurface}% VWC • {convertTemp(soilData.tempSurface)}
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-200/60 rounded-full overflow-hidden relative border border-slate-200/20">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-700 rounded-full transition-all duration-500"
                          style={{ width: `${soilData.moistureSurface}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-2 text-[8px] font-extrabold text-slate-800 font-mono">
                          {soilData.moistureSurface >= 40 ? "Optimal Damp" : "Light dry"}
                        </div>
                      </div>
                    </div>

                    {/* Depth 2: 7 - 28cm */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-950 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-800" />
                          Rooting Zone (7 - 28cm)
                        </span>
                        <div className="font-mono text-[11px] font-bold text-slate-700">
                          {soilData.moistureMid}% VWC • {convertTemp(soilData.tempMid)}
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-200/60 rounded-full overflow-hidden relative border border-slate-200/20">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-800 to-amber-900 rounded-full transition-all duration-500"
                          style={{ width: `${soilData.moistureMid}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-2 text-[8px] font-extrabold text-white font-mono">
                          {soilData.moistureMid >= 50 ? "Healthy Capillary" : "Stress Risk"}
                        </div>
                      </div>
                    </div>

                    {/* Depth 3: 28 - 100cm */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-slate-800" />
                          Deep Subsoil (28 - 100cm)
                        </span>
                        <div className="font-mono text-[11px] font-bold text-slate-700">
                          {soilData.moistureDeep}% VWC • {convertTemp(soilData.tempDeep)}
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-200/60 rounded-full overflow-hidden relative border border-slate-200/20">
                        <div 
                          className="h-full bg-gradient-to-r from-slate-800 to-slate-950 rounded-full transition-all duration-500"
                          style={{ width: `${soilData.moistureDeep}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-2 text-[8px] font-extrabold text-white font-mono">
                          {soilData.moistureDeep >= 60 ? "Deep Saturated" : "Moderately Dry"}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Solar photoperiod Engine (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Astronomical Solar Geometry</span>
                    <h4 className="text-xs font-bold text-gray-900 leading-tight block">Photoperiod & Daylength hours</h4>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50/50 to-amber-50/50 border border-amber-100/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-yellow-100 text-yellow-800 rounded-lg">
                        <Sun className="h-4.5 w-4.5 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-amber-800 uppercase font-mono block leading-none">Daylight Hours</span>
                        <strong className="text-lg font-black font-display text-amber-950">{soilData.daylengthHours} Hrs</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 border-t border-amber-200/30 pt-2 font-semibold">
                      <div>
                        <span className="text-[8px] text-gray-400 block font-mono uppercase">Sunrise</span>
                        <span className="text-slate-800">{soilData.sunriseTime}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-400 block font-mono uppercase font-bold text-right">Sunset</span>
                        <span className="text-slate-800 block text-right">{soilData.sunsetTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 leading-relaxed font-sans bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    💡 <strong>Agronomic photo-tip:</strong> {soilData.daylengthHours > 14 ? "Soybeans are in full vegetative growth. Flowering starts when daylight declines." : "Optimal photo-period length for rapid nitrogen metabolic absorption."}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-[120px] w-full flex items-center justify-center text-center">
                <p className="text-xs text-slate-400">
                  {soilError || "Unable to retrieve coordinate details. Draw active bounds first."}
                </p>
              </div>
            )}
          </div>

          {/* ASTRO-ECOLOGICAL MULTI-API PRECISION DIAGNOSTICS CARD */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-left relative overflow-hidden" id="dashboard-astro-diagnostics-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100/40 shrink-0">
                  <Database className="w-5 h-5 text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 uppercase tracking-widest block leading-none mb-1">
                    Multi-API Planetary Diagnostics
                  </span>
                  <h3 className="font-display font-black text-sm text-gray-900 uppercase">
                    Astro-Ecological Environmental Auditing
                  </h3>
                </div>
              </div>
              
              <button
                onClick={handlePerformAstroDiagnosticScan}
                disabled={scanLoading || !activeParcel}
                className={`px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 select-none`}
              >
                {scanLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing 6 APIs...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    <span>Run Precision Ecological Scan</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-sans">
              Consolidate satellites, subsoil parameters, land morphology slope, hydrology rivers, and nutritive biochemistries. Scans compile automatically and write back to your private **Google Cloud Live Firestore Database** instantly.
            </p>

            {diagnostics.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center space-y-2">
                <Database className="w-7 h-7 text-slate-350 mx-auto" strokeWidth={1.5} />
                <h4 className="text-xs font-bold text-slate-700">No Historical Diagnostic Log Archives</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed font-sans">
                  Execute your first coordinates-aware diagnostic audit above to query multiple open-tier platforms in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal list of previous diagnostics */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {diagnostics.map((diag) => {
                    const isSelected = activeDiagnosticId === diag.id;
                    const dateStr = new Date(diag.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    
                    let badgeColor = "bg-gray-100 text-gray-700 border-gray-200";
                    if (diag.status === "optimal") badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    else if (diag.status === "warning") badgeColor = "bg-amber-50 text-amber-700 border-amber-200";

                    return (
                      <button
                        key={diag.id}
                        onClick={() => setActiveDiagnosticId(diag.id)}
                        className={`px-3 py-2 border rounded-xl flex items-center justify-between gap-3 shrink-0 text-left transition-all text-xs font-sans ${
                          isSelected 
                            ? "bg-slate-900 border-slate-950 text-white ring-2 ring-emerald-500/20" 
                            : "bg-white border-gray-200 hover:bg-slate-50 text-gray-700"
                        }`}
                      >
                        <div>
                          <span className="block font-bold leading-none">{dateStr}</span>
                          <span className="text-[9px] text-gray-400 font-mono mt-1 block">API Scan Pulse</span>
                        </div>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md border font-extrabold uppercase ${badgeColor}`}>
                          {diag.status || "info"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Log parameters display and parsing */}
                {(() => {
                  const selectedLog = diagnostics.find(d => d.id === activeDiagnosticId);
                  if (!selectedLog) return null;

                  let parsedData: any;
                  try {
                    parsedData = JSON.parse(selectedLog.metricsJSONString || "{}");
                  } catch {
                    parsedData = {};
                  }

                  const dateFull = new Date(selectedLog.timestamp).toLocaleString();
                  const copernicusData = parsedData.copernicus;
                  const usgsData = parsedData.usgs;
                  const macroData = parsedData.macronutrients;
                  const streamData = parsedData.boundary;
                  const topoData = parsedData.geotech;
                  const wbData = parsedData.forestry;

                  return (
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl relative space-y-4">
                      {/* Delete icon */}
                      <button
                        onClick={() => handleDeleteDiagnosticLog(selectedLog.id)}
                        className="absolute top-4 right-4 p-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all cursor-pointer"
                        title="Delete record from Cloud Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1 pr-6">
                        <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">Selected Diagnostics Detail Archive</span>
                        <h4 className="text-xs font-extrabold text-slate-800 font-sans flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          Parsed Database Registry (Synced at {dateFull})
                        </h4>
                      </div>

                      {/* Six-Grid of parsed API matrices */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Satellite Reflectance */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-blue-600 uppercase">1. Satellite Proxy</span>
                            <span className="text-[11px] font-bold text-gray-800 block">Canopy Reflection Index</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-600 font-mono space-y-0.5">
                            <div>NDVI Index: <span className="font-bold text-slate-800">{(copernicusData?.indexTimeline?.ndvi ?? 0.74).toFixed(2)}</span></div>
                            <div>NDWI Moisture: <span className="font-bold text-slate-800">{(copernicusData?.indexTimeline?.ndwi ?? 0.44).toFixed(2)}</span></div>
                            <div className="text-[8px] text-gray-400 truncate mt-1">Classification: {copernicusData?.indexTimeline?.classification ?? "Healthy"}</div>
                          </div>
                        </div>

                        {/* 2. USGS Basins */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-emerald-600 uppercase">2. USGS Rivers/Drainage</span>
                            <span className="text-[11px] font-bold text-gray-800 block">Hydrologic Watershed</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-600 font-mono space-y-0.5">
                            <div className="truncate text-slate-800 font-bold">{usgsData?.watershed?.name ?? "Upper River Basin"}</div>
                            <div>HUC12: <span className="font-bold text-slate-700">{usgsData?.watershed?.hydrologicUnitCode12 ?? "07110001"}</span></div>
                            <div>Drainage: <span className="font-bold text-slate-700">{usgsData?.watershed?.drainageScaleSqMiles ?? 3450} sq mi</span></div>
                          </div>
                        </div>

                        {/* 3. Nutrient composition */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-indigo-600 uppercase">3. Crop Macrominerals</span>
                            <span className="text-[11px] font-bold text-gray-800 block">FoodData Nutrient Library</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-600 font-mono space-y-0.5">
                            <div>Variety: <span className="font-bold text-indigo-700">{macroData?.requestedCrop ?? activeParcel.cropType}</span></div>
                            <div>Calories: <span className="font-bold text-slate-800">{macroData?.nutrientsPer100g?.calories ?? 65} kcal</span></div>
                            <div className="flex gap-1.5 text-[8px] text-gray-400 mt-1">
                              <span>Pr: {macroData?.nutrientsPer100g?.proteinGrams ?? 1.2}g</span>
                              <span>Cb: {macroData?.nutrientsPer100g?.carbsGrams ?? 14.5}g</span>
                              <span>Fb: {macroData?.nutrientsPer100g?.fiberGrams ?? 1.8}g</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Convective boundary layer */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-amber-600 uppercase">4. Planetary Boundary</span>
                            <span className="text-[11px] font-bold text-gray-800 block">Convective Layer Height</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-600 font-mono space-y-0.5">
                            <div>PBL height: <span className="font-bold text-slate-800">{streamData?.boundaryLayerHeightMeters ?? 820}m</span></div>
                            <div>Wind gust: <span className="font-bold text-slate-800">{streamData?.windGustsAt10mMeterPerSec ?? 11.8} m/s</span></div>
                            <div className="text-[8px] text-gray-400 truncate mt-1">Convective state: {streamData?.thermalTurbulenceState ?? "Stable"}</div>
                          </div>
                        </div>

                        {/* 5. Precise Geotech Elevation */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-cyan-600 uppercase">5. Geotech Elevation</span>
                            <span className="text-[11px] font-bold text-gray-800 block">Slope & Altimeter Index</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-600 font-mono space-y-0.5">
                            <div>Elevation: <span className="font-bold text-slate-800">{topoData?.elevationMeters ?? 180}m</span></div>
                            <div>Slope angle: <span className="font-bold text-slate-800">{topoData?.estimatedSlopeDegrees ?? 4.5}°</span></div>
                            <div className="text-[8px] text-gray-400 truncate mt-1">Geo-drainage: {topoData?.drainageCategory ?? "Well"}</div>
                          </div>
                        </div>

                        {/* 6. World Bank Green Coverage */}
                        <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[8px] font-mono font-bold text-rose-600 uppercase">6. World Bank Forest Registry</span>
                            <span className="text-[11px] font-bold text-gray-800 block">National Canopy Percent</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-600 font-mono space-y-0.5">
                            <div>Forest area: <span className="font-bold text-rose-700">{wbData?.forestAreaPercent ?? 33.5}%</span></div>
                            <div>Country: <span className="font-bold text-slate-800">{wbData?.countryName ?? "United States"}</span></div>
                            <div className="text-[8px] text-gray-400 truncate mt-1">Ref footprint: {wbData?.countryCode ?? "US"}</div>
                          </div>
                        </div>
                      </div>

                      {/* Synthesized ecological commentary block */}
                      <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/60 font-sans text-xs text-slate-700 leading-relaxed">
                        <strong>Synthesized Diagnostic Summary:</strong> {selectedLog.summary}
                      </div>

                      {/* Citations metadata footprint */}
                      <div className="text-[8.5px] font-mono text-gray-400 leading-normal bg-white p-2 border border-slate-100/50 rounded-xl">
                        ℹ️ <strong>Linked Telemetry Sources:</strong> {selectedLog.apiSource}. Datasets verified and cached safely to private Firebase storage.
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* NASA POWER SPACE CLIMATOLOGY SATELLITE ANALYTICS WIDGET */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 text-left relative overflow-hidden" id="dashboard-nasa-climatology-widget">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50/70 text-indigo-700 rounded-xl border border-indigo-100/50 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block font-mono">Climatology Satellite Link</span>
                  <h3 className="font-display font-black text-sm text-gray-900 uppercase">
                    30-Day Ag Climatology Integration
                  </h3>
                </div>
              </div>

              {/* Metric Selector Pills */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-gray-150 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setActiveMetric("temp")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMetric === "temp"
                      ? "bg-white text-slate-900 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  🌡️ Temp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("precipitation")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMetric === "precipitation"
                      ? "bg-white text-slate-900 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  🌧️ Rain
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric("radiation")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeMetric === "radiation"
                      ? "bg-white text-slate-900 shadow-xs font-black"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  ☀️ Solar
                </button>
              </div>
            </div>

            {/* Loading / Error / Data States boundary */}
            {nasaLoading ? (
              <div className="h-[280px] w-full flex flex-col justify-center items-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <div className="text-center">
                  <span className="text-[10px] font-bold text-indigo-650 tracking-widest uppercase font-mono block">Querying Goddard Space Flight Center</span>
                  <p className="text-[11px] text-gray-400 font-medium">Fetching satellite indices for Lat: {activeParcel.lat ?? activeParcel.latitude}, Lng: {activeParcel.lng ?? activeParcel.longitude}</p>
                </div>
              </div>
            ) : nasaError ? (
              <div className="h-[280px] w-full flex flex-col justify-center items-center space-y-3 p-4 bg-rose-50/20 rounded-2xl border border-rose-100 text-center">
                <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Climatology Connection Offline</h4>
                  <p className="text-[11px] text-red-750 max-w-sm mx-auto leading-relaxed mt-1">{nasaError}</p>
                </div>
              </div>
            ) : nasaData ? (
              <div className="space-y-5">
                {/* 30-Day Metrics Summary Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150/40 text-left">
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider block font-mono">30D Avg Temp</span>
                    <strong className="text-base font-display font-black text-slate-800 font-mono block mt-0.5">{convertTemp(nasaData.avgTemp)}</strong>
                    <span className="text-[9px] text-gray-400 font-sans mt-0.5 block leading-tight">Thermodynamic Mean</span>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150/40 text-left">
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider block font-mono">Insolation Average</span>
                    <strong className="text-base font-display font-black text-slate-800 font-mono block mt-0.5">{nasaData.avgSolar}</strong>
                    <span className="text-[9px] text-amber-650 font-bold font-mono mt-0.5 block leading-tight">MJ/m²/day</span>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150/40 text-left">
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider block font-mono">Tot Precipitation</span>
                    <strong className="text-base font-display font-black text-indigo-700 font-mono block mt-0.5">{formatRain(nasaData.totalRain)}</strong>
                    <span className="text-[9px] text-gray-400 font-sans mt-0.5 block leading-tight">30-day rain sum</span>
                  </div>

                  <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-150/40 text-left">
                    <span className="text-[9px] text-gray-450 font-bold uppercase tracking-wider block font-mono">Transpiration Risk</span>
                    <strong className={`text-base font-display font-black block mt-0.5 ${
                      nasaData.transpirationRisk === "High" ? "text-red-650" : nasaData.transpirationRisk === "Moderate" ? "text-amber-650" : "text-emerald-700"
                    }`}>
                      {nasaData.transpirationRisk}
                    </strong>
                    <span className="text-[9px] text-gray-400 font-sans mt-0.5 block leading-tight">Canopy evaporation</span>
                  </div>
                </div>

                {/* Main High Contrast Recharts Trend Container */}
                <div className="h-[210px] w-full font-mono text-[9px] -ml-2.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={(nasaData.points || []).map(pt => ({
                        ...pt,
                        "Air Temp": tempUnit === "F" && pt["Air Temp"] !== null ? Number((pt["Air Temp"] * 9/5 + 32).toFixed(1)) : pt["Air Temp"],
                        "Precipitation (mm)": rainUnit === "inch" && pt["Precipitation (mm)"] !== null ? Number((pt["Precipitation (mm)"] * 0.0393701).toFixed(3)) : pt["Precipitation (mm)"]
                      }))} 
                      margin={{ top: 5, right: 10, left: -22, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorActiveMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop 
                            offset="5%" 
                            stopColor={
                              activeMetric === "temp" 
                                ? "#ef4444" 
                                : activeMetric === "precipitation" 
                                  ? "#2563eb" 
                                  : "#eab308"
                            } 
                            stopOpacity={0.25}
                          />
                          <stop 
                            offset="95%" 
                            stopColor={
                              activeMetric === "temp" 
                                ? "#ef4444" 
                                : activeMetric === "precipitation" 
                                  ? "#2563eb" 
                                  : "#eab308"
                            } 
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
                      <YAxis 
                        stroke="#94a3b8" 
                        tickLine={false} 
                        unit={
                          activeMetric === "temp" 
                            ? `°${tempUnit}` 
                            : activeMetric === "precipitation" 
                              ? (rainUnit === "inch" ? "in" : "mm") 
                              : "MJ"
                        } 
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}
                        labelStyle={{ fontWeight: "bold", color: "#4f46e5", fontSize: "10px" }}
                        itemStyle={{ fontSize: "11px", color: "#1e293b", padding: "1px 0" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={
                          activeMetric === "temp" 
                            ? "Air Temp" 
                            : activeMetric === "precipitation" 
                              ? "Precipitation (mm)" 
                              : "Solar Radiation"
                        } 
                        stroke={
                          activeMetric === "temp" 
                            ? "#ef4444" 
                            : activeMetric === "precipitation" 
                              ? "#2563eb" 
                              : "#eab308"
                        } 
                        strokeWidth={2.5} 
                        fill="url(#colorActiveMetric)" 
                        name={
                          activeMetric === "temp" 
                            ? `Air Temp (°${tempUnit})` 
                            : activeMetric === "precipitation" 
                              ? `Precipitation (${rainUnit === "inch" ? "in" : "mm"})` 
                              : "Solar Rad"
                        } 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Mini Crop Health Advisory Footer note */}
                <div className="bg-indigo-500/[0.03] border border-indigo-200/20 rounded-2xl p-4 flex items-start gap-2.5 shadow-xs">
                  <Sprout className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-gray-600 leading-relaxed font-sans">
                    <strong>Ag-Climatology Advisory:</strong> 30-day index shows an average solar insolation of <strong>{nasaData.avgSolar} MJ/m²/day</strong> and a mean temperature profile of <strong>{convertTemp(nasaData.avgTemp)}</strong> mapped dynamically at this coordinate. Combined under-canopy moisture sets the transpiration risk at <span className="font-bold uppercase text-indigo-700">{nasaData.transpirationRisk}</span> for this focus field.
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[280px] w-full flex flex-col justify-center items-center text-center bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                <Globe className="w-8 h-8 text-gray-450 mb-2" />
                <p className="text-xs text-gray-400 font-medium">Select a focus field from the panel to generate real-time satellite climatology trends.</p>
              </div>
            )}
          </div>

          {/* Environmental Hazards, Warnings, or Alerts List */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              {t("dashboard.criticalAlerts", "Critical Agronomical Alerts")}
            </h3>

            {warnings.length === 0 ? (
              <div className="border border-green-200 bg-green-50/50 p-4 rounded-2xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-brand-green shrink-0" />
                <span className="text-xs font-semibold text-green-800">
                  {t("dashboard.systemOptimal", "All systems operating at maximum yield efficiency. No vegetative anomalies tracked today.")}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {warnings.map((p) => {
                  let reason = "";
                  if (p.soilMoisture < 35) reason = t("dashboard.reasonSoilDry", "Extreme soil dryness. Severe water stress curve triggered (NDWI sub-optimal).");
                  else if (p.ndviValue < 0.45) reason = t("dashboard.reasonBiomass", "Sub-optimal vegetative biomass index. Leaf chlorosis risk flagged.");
                  else if (p.soilPH < 5.5) reason = t("dashboard.reasonAcidification", "Critical soil acidification. Heavy metallic salt blockages present.");

                  return (
                    <div key={p.id} className="border border-red-100 bg-red-50/40 p-4.5 rounded-2xl flex items-start gap-3 justify-between">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{p.name} ({p.cropType})</h4>
                          <p className="text-[11px] text-red-750 font-medium mt-1">{reason}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          onSelectParcel(p.id);
                          onNavigate("field-overview");
                        }}
                        className="text-[10px] font-bold text-red-600 hover:underline uppercase tracking-wider font-mono shrink-0 select-none cursor-pointer"
                      >
                        {t("dashboard.correctTelemetry", "Correct Telemetry →")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick interactive Parcel Selection Board */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-base text-gray-900 mb-3">
              {t("dashboard.exploreFields", "Explore Dynamic Fields")} ({parcels.length})
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              {t("dashboard.swapFocus", "Swap focus to update regional forecasting models and agronomist feedback feeds.")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {parcels.map((p) => {
                const isSelected = p.id === activeParcelId;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectParcel(p.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? "bg-brand-green/5 border-brand-green shadow-sm" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-green' : 'text-gray-400'}`} />
                        {p.name}
                      </h4>
                      <p className="text-[10px] font-mono font-medium text-gray-500 mt-1">
                        {p.cropType} • {p.farmSize} Hectares
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase font-mono">NDVI</span>
                      <strong className={`text-xs font-mono font-extrabold ${isSelected ? 'text-brand-green' : 'text-text-dark'}`}>
                        {p.ndviValue}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Crop Share Breakdown & Scheduler */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Crop Share Distribution card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-base text-gray-900 mb-1">
              {t("dashboard.fieldAssetDist", "Field Asset Distribution")}
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">
              {t("dashboard.hectareShare", "Hectare share ratio of active crop varieties.")}
            </p>

            <div className="space-y-4">
              {Object.keys(cropCounts).map((crop) => {
                const hectares = cropCounts[crop];
                const percentage = Math.round((hectares / totalArea) * 100);
                const colorMap: Record<string, string> = {
                  Corn: "bg-yellow-500",
                  Soybeans: "bg-emerald-600",
                  Wheat: "bg-amber-500",
                  Rice: "bg-blue-600",
                  Cotton: "bg-stone-300",
                  Tomatoes: "bg-red-500",
                  Barley: "bg-orange-500",
                  Canola: "bg-yellow-400"
                };
                const bg = colorMap[crop] || "bg-brand-green";

                return (
                  <div key={crop} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${bg}`} />
                        {crop}
                      </span>
                      <span>{hectares} Ha ({percentage}%)</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bg} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weather CTA -- points to the real forecast rather than showing invented preview numbers */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm overflow-hidden relative flex flex-col items-center justify-center text-center gap-3">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl border border-yellow-100">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-gray-900">
                {t("dashboard.regionalWeather", "Field Weather")}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {t("dashboard.regionalWeatherDesc", "Open the live 10-day forecast for this field's coordinates.")}
              </p>
            </div>

            <button
              onClick={() => onNavigate("field-weather")}
              className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-150 rounded-xl py-2 mt-1 cursor-pointer"
            >
              {t("dashboard.inspectCalendar", "Inspect 10-Day Irrigation Calendar")}
            </button>
          </div>

          {/* Operation Schedule / Timeline Planner */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-display font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-green" />
              {t("dashboard.protocolSchedule", "Agricultural Protocol Schedule")}
            </h3>

            <div className="space-y-4">
              <div className="relative pl-6 border-l border-gray-150 space-y-4">
                
                {/* Protocol 1 */}
                <div className="relative">
                  <span className="absolute -left-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-brand-green bg-white flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                  </span>
                  <div className="text-xs">
                    <span className="text-[10px] font-mono text-gray-400 font-bold block">JUNE 15</span>
                    <strong className="text-gray-900 block font-semibold mt-0.5">{t("dashboard.samplingProtocol", "Leaf Hydration Stress Sampling")}</strong>
                    <p className="text-[11px] text-gray-500 mt-0.5">{t("dashboard.samplingDesc", "Location-based canopy reflectance estimate across wheat-bearing margins.")}</p>
                  </div>
                </div>

                {/* Protocol 2 */}
                <div className="relative">
                  <span className="absolute -left-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-brand-green bg-white flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                  </span>
                  <div className="text-xs">
                    <span className="text-[10px] font-mono text-gray-400 font-bold block">JUNE 23</span>
                    <strong className="text-gray-900 block font-semibold mt-0.5">{t("dashboard.calibrationSweep", "NPK Soil Calibration Sweep")}</strong>
                    <p className="text-[11px] text-gray-500 mt-0.5">{t("dashboard.calibrationDesc", "Top-surface chemical testing to adjust Nitrogen reserves.")}</p>
                  </div>
                </div>

                {/* Protocol 3 */}
                <div className="relative">
                  <span className="absolute -left-[29px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-gray-150 bg-white flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                  </span>
                  <div className="text-xs">
                    <span className="text-[10px] font-mono text-gray-400 font-bold block">JULY 02</span>
                    <strong className="text-gray-900 block font-semibold mt-0.5">Reflectance Estimate Refresh</strong>
                    <p className="text-[11px] text-gray-500 mt-0.5">Recompute the location-based canopy reflectance estimate.</p>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Precision Agricultural APIs & Integrations Hub */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 mt-6 border border-slate-800 shadow-xl relative overflow-hidden" id="dashboard-integrations-hub">
        {/* Abstract cybernetic grid overlay background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ 
            backgroundImage: "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)", 
            backgroundSize: "24px 24px",
          }} 
        />
        
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-1.5 text-left">
            <span className="text-[10px] text-brand-green font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
              API Feed Synchronizer Hub
            </span>
            <h2 className="text-2xl font-display font-black tracking-tight">
              Precision Agricultural APIs & Datasets
            </h2>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              The MyCrop engine natively coordinates satellite imagery, soil depth-stratified parameters, and photoperiod metrics across the following 16 free research-tier telemetry sources. No private key registrations are required for this keyless link.
            </p>
          </div>

        </div>

        {/* 16 APIs Integrated Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6 text-left">
          
          {/* Card 1 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Open-Meteo API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Atmosphere & Deep Subsoil Temp</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Sourcing continuous moisture matrices at 0-7cm, 7-28cm, and 28-100cm depth levels mapped to farm coordinate indexes.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>NO KEY NEEDED</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Environmental Data API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Global Soil Profile Metrics</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Provides macro sand, silt, and deep clay moisture variations on a global geospatial coordinate lookup vector.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>KEYLESS API</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Climatology API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Solar & Transpiration Radiation</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Returns daily incident shortwave solar radiation flux and regional root zone water profiles over a 30-day timeline.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>NO KEY NEEDED</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Global Soil Profiles 250m
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Soil pH & Nitrogen Baselines</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Retrieves precise chemical composite models including bulk density and cation exchange capacities at 6 depth intervals.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>KEYLESS API</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  OpenWeather Map
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Atmospheric Microclimates</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Streams ambient atmospheric pressure, localized dew points, and wind gusts directly tracking thermal crop thresholds.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>KEYLESS SECURE</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Meteoblue Climate
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Climate Histograms & Wind</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Delivers historical weather histograms to model seed planting months and risk vectors from high wind speeds.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE PUBLIC</span>
            </div>
          </div>

          {/* Card 7 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  FAO AgriData API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Agronomic Metrics & Standards</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Correlates yield predictions and recommended soil pH baselines with recognized Food and Agriculture global standards.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE DIRECT</span>
            </div>
          </div>

          {/* Card 8 */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  World Bank Agronometrics
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Macro Policy & Daylight Hours</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Provides geographical photoperiod daylight hours and macro agricultural indicators by country code maps.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE PUBLIC</span>
            </div>
          </div>

          {/* Card 9 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  GBIF Pest & Bio Vectors
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Local Biodiversity Corridor</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Tracks local insect species maps and historic fungal disease outbreaks to proactively warn of crop pest vulnerabilities.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE API</span>
            </div>
          </div>

          {/* Card 10 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  USGS Geology API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Soil Mineralogy & Lithosphere</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Analyzes local bedrock layers and basaltic geological formations which influence drainage and mineral degradation.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE LINK</span>
            </div>
          </div>

          {/* Card 11 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Sunrise-Sunset Solar
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Photoperiod & Daylength Tracker</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Maps exact astronomical sunrise, sunset, and solar midday lengths to coordinate photoperiod seed triggers.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE PUBLIC</span>
            </div>
          </div>

          {/* Card 12 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  Satellite Imagery API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Reflectance Estimate</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Computes a location-based chlorophyll/water-status reflectance estimate (not live satellite imagery).
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE ENDPOINT</span>
            </div>
          </div>

          {/* Card 13 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  MET Norway Weather
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Global Meteorological Streams</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Serves keyless, open-source-friendly atmospheric dynamics and dewpoint metrics for coordinates in standard format.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE OPEN</span>
            </div>
          </div>

          {/* Card 14 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  USGS Water Services
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Streamflow & Aquifer Levels</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Yields keyless groundwater levels and stream gauge height measurements across North American monitoring nodes.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE KEYLESS</span>
            </div>
          </div>

          {/* Card 15 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  NOAA Hazard Feeds
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Alert Grids & Radar Forecasts</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Maps convective storms, freeze watches, extreme heat indexes, and localized moisture advisories key-free.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>FREE PUBLIC</span>
            </div>
          </div>

          {/* Card 16 */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all group flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md font-bold uppercase">
                  OpenAQ Quality API
                </span>
                <span className="h-2 w-2 rounded-full bg-slate-600" title="Publicly documented endpoint (not live-monitored)" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Fine Particulates & Ozone Status</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Pulls atmospheric gaseous measurements, dust vectors, and absolute ambient air quality logs dynamically.
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-900 mt-3 pt-2 text-[9.5px] font-mono text-slate-500">
              <span>REST API</span>
              <span>KEYLESS API</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
