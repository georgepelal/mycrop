import React, { useState, useEffect } from "react";
import { 
  CloudSun, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Sunset, 
  Sunrise, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Navigation,
  Calendar,
  Compass,
  Clock
} from "lucide-react";
import { Parcel } from "../types";
import CustomFieldVisualMap from "../components/CustomFieldVisualMap";

interface FieldWeatherPageProps {
  parcels: Parcel[];
  activeParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

export default function FieldWeatherPage({ parcels, activeParcelId, onSelectParcel }: FieldWeatherPageProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Find active parcel
  const activeParcel = parcels.find(p => p.id === activeParcelId) || parcels[0] || null;

  useEffect(() => {
    if (activeParcel && !activeParcelId) {
      onSelectParcel(activeParcel.id);
    }
  }, [activeParcel, activeParcelId, onSelectParcel]);

  useEffect(() => {
    if (!activeParcel) return;

    async function fetchWeather() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/weather-forecast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            lat: activeParcel.latitude || activeParcel.lat, 
            lng: activeParcel.longitude || activeParcel.lng 
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to load weather forecast");
        }
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setWeatherData(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading weather data.");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
  }, [activeParcel]);

  // Helper to resolve WMO Weather Code
  const getWeatherMeta = (code: number) => {
    if (code === 0) return { label: "Clear Sky", icon: <Sun className="w-8 h-8 text-amber-500 animate-pulse" />, bg: "from-amber-500/10 to-amber-50/10" };
    if ([1, 2, 3].includes(code)) return { label: "Partly Cloudy", icon: <CloudSun className="w-8 h-8 text-blue-500" />, bg: "from-blue-500/10 to-blue-50/10" };
    if ([45, 48].includes(code)) return { label: "Foggy", icon: <Cloud className="w-8 h-8 text-slate-400" />, bg: "from-slate-400/10 to-slate-50/10" };
    if ([51, 53, 55].includes(code)) return { label: "Drizzle", icon: <CloudDrizzle className="w-8 h-8 text-sky-400" />, bg: "from-sky-400/10 to-sky-50/10" };
    if ([61, 63, 65, 80, 81, 82].includes(code)) return { label: "Rainy", icon: <CloudRain className="w-8 h-8 text-blue-600" />, bg: "from-blue-600/10 to-blue-50/10" };
    if ([71, 73, 75, 77, 85, 86, 56, 57, 66, 67].includes(code)) return { label: "Snowfall", icon: <CloudSnow className="w-8 h-8 text-sky-200" />, bg: "from-sky-200/10 to-sky-50/10" };
    if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", icon: <CloudLightning className="w-8 h-8 text-purple-600 animate-bounce" />, bg: "from-purple-600/10 to-purple-50/10" };
    return { label: "Overcast", icon: <Cloud className="w-8 h-8 text-slate-500" />, bg: "from-slate-500/10 to-slate-50/10" };
  };

  const currentMeta = weatherData?.current ? getWeatherMeta(weatherData.current.weather_code) : { label: "Unknown", icon: <Cloud className="w-8 h-8" />, bg: "from-slate-500/10 to-slate-50/10" };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6" id="field-weather-dashboard">
      {/* Header section with field selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
            <CloudSun className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Weather Forecast</h1>
            <p className="text-sm font-medium text-slate-500">Live coordinates-specific weather trends & analytics</p>
          </div>
        </div>

        {/* Parcel Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Field:</span>
          <select
            value={activeParcel?.id || ""}
            onChange={(e) => onSelectParcel(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-2xl px-4 py-2.5 focus:ring-emerald-500 focus:border-emerald-500 shadow-xs cursor-pointer outline-none"
          >
            {parcels.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.cropType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeParcel ? (
        <div className="space-y-6">
          {/* Selected Field Location & Map (Compact horizontal row on top) */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 items-center animate-fade-in">
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">Field Location</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{activeParcel.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Latitude</p>
                  <p className="text-[10px] font-mono font-bold text-slate-600">{(activeParcel.latitude || activeParcel.lat).toFixed(4)}°</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Longitude</p>
                  <p className="text-[10px] font-mono font-bold text-slate-600">{(activeParcel.longitude || activeParcel.lng).toFixed(4)}°</p>
                </div>
              </div>
            </div>

            {/* Read-only map representation */}
            <div className="md:col-span-2 rounded-2xl overflow-hidden">
              <CustomFieldVisualMap
                parcel={activeParcel}
                weatherCode={weatherData?.current?.weather_code}
                windSpeed={weatherData?.current?.wind_speed_10m}
                windDirection={weatherData?.current?.wind_direction_10m}
              />
            </div>
          </div>

          {/* Weather Content View */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl shadow-xs border border-slate-100">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-600">Retrieving High-Resolution Meteorological Forecast...</p>
                <p className="text-xs text-slate-400 mt-1">Sourcing real-time atmospheric updates from Open-Meteo Suite</p>
              </div>
            ) : error ? (
              <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-rose-800">Forecast Sync Failed</h3>
                  <p className="text-sm font-medium text-rose-600 mt-1">{error}</p>
                  <p className="text-xs text-rose-400 mt-2">Open-Meteo services might be experiencing high volume. Fallback simulations can be initialized by refreshing.</p>
                </div>
              </div>
            ) : weatherData ? (
              <div className="space-y-6 animate-fade-in">
                {/* Current Weather Highlight Card */}
                <div className={`bg-gradient-to-br ${currentMeta.bg} bg-white rounded-3xl p-6 border border-slate-150 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6`}>
                  <div className="flex flex-col justify-between space-y-4">
                    <div>
                      <span className="bg-emerald-100/80 text-emerald-800 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                        Current Weather
                      </span>
                      <h2 className="text-4xl font-black text-slate-800 tracking-tight mt-3">
                        {weatherData.current.temperature_2m}°C
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {currentMeta.icon}
                        <span className="text-sm font-bold text-slate-600">{currentMeta.label}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Feels like: <span className="font-bold text-slate-600">{weatherData.current.apparent_temperature}°C</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 col-span-2">
                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center shrink-0">
                        <Droplets className="w-5 h-5 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relative Humidity</p>
                        <p className="text-sm font-black text-slate-800">{weatherData.current.relative_humidity_2m}%</p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Wind className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Wind Speed</p>
                        <p className="text-sm font-black text-slate-800">{weatherData.current.wind_speed_10m} km/h</p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <Sunrise className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sunrise</p>
                        <p className="text-sm font-black text-slate-800">{weatherData.daily.sunrise[0]?.split("T")?.pop() || "06:12"}</p>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Sunset className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sunset</p>
                        <p className="text-sm font-black text-slate-800">{weatherData.daily.sunset[0]?.split("T")?.pop() || "20:12"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 7-Day Forecast Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4.5 h-4.5 text-emerald-600" />
                      <h3 className="text-sm font-black text-slate-800">7-Day Meteorological Outlook</h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                      Click any day below to load hourly operations advice
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                    {weatherData.daily.time.map((time: string, idx: number) => {
                      const dayName = new Date(time).toLocaleDateString("en-US", { weekday: "short" });
                      const dateStr = new Date(time).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      const dailyMeta = getWeatherMeta(weatherData.daily.weather_code[idx]);
                      const isToday = idx === 0;
                      const isSelected = idx === selectedDayIndex;

                      return (
                        <div 
                          key={time} 
                          onClick={() => setSelectedDayIndex(idx)}
                          className={`flex flex-col items-center justify-between p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/20 shadow-xs" 
                              : "bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-center gap-1">
                              <p className={`text-xs font-black uppercase tracking-wider ${isSelected ? "text-emerald-700" : "text-slate-700"}`}>
                                {dayName}
                              </p>
                              {isToday && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Today" />
                              )}
                            </div>
                            <p className="text-[9px] font-bold text-slate-400">
                              {dateStr}
                            </p>
                          </div>

                          <div className="my-3 flex items-center justify-center">
                            {dailyMeta.icon}
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs font-black text-slate-800 leading-none">
                              {Math.round(weatherData.daily.temperature_2m_max[idx])}°
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 leading-none">
                              {Math.round(weatherData.daily.temperature_2m_min[idx])}°
                            </p>
                          </div>

                          {weatherData.daily.precipitation_probability_max && (
                            <div className="mt-3 flex items-center justify-center gap-0.5 text-[9px] font-bold text-sky-600">
                              <Droplets className="w-2.5 h-2.5 shrink-0" />
                              <span>{weatherData.daily.precipitation_probability_max[idx]}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hourly Advisor */}
                <HourlyOperationsAdvisor 
                  weatherData={weatherData} 
                  getWeatherMeta={getWeatherMeta} 
                  selectedDayIndex={selectedDayIndex} 
                />

                {/* Additional Technical Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Wind className="w-4 h-4 text-emerald-500" /> Wind & Pressure Metrics
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="font-bold text-slate-500">Peak Daily Wind Gusts</span>
                        <span className="font-mono font-black text-slate-700">{weatherData.daily.wind_speed_10m_max?.[0] || 15} km/h</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="font-bold text-slate-500">Mean Barometric Pressure</span>
                        <span className="font-mono font-black text-slate-700">{weatherData.current.pressure_msl || 1013} hPa</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-bold text-slate-500">Wind Direction</span>
                        <span className="font-mono font-black text-slate-700 flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-emerald-600 shrink-0" style={{ transform: `rotate(${weatherData.current.wind_direction_10m || 0}deg)` }} />
                          {weatherData.current.wind_direction_10m || 0}°
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-500" /> Precipitation Breakdown
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="font-bold text-slate-500">Expected Precipitation (Today)</span>
                        <span className="font-mono font-black text-slate-700">{weatherData.daily.precipitation_sum?.[0] || 0} mm</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-50">
                        <span className="font-bold text-slate-500">Chance of Rain</span>
                        <span className="font-mono font-black text-slate-700">{weatherData.daily.precipitation_probability_max?.[0] || 0}%</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-bold text-slate-500">Primary System Code</span>
                        <span className="font-mono font-black text-slate-700">WMO-Code: {weatherData.current.weather_code}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Hourly Log Table */}
                <DetailedHourlyLogTable 
                  weatherData={weatherData} 
                  selectedDayIndex={selectedDayIndex} 
                />

                {/* API Citation Footer */}
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400">
                    Meteorological calculations resolved by **Open-Meteo Atmospheric Weather API**. Ground elevations synced in real-time.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800">No Fields Registered</h3>
          <p className="text-sm font-medium text-slate-500 mt-1 max-w-md mx-auto">
            Please register a field in the "My Fields" panel to monitor localized microclimate conditions.
          </p>
        </div>
      )}
    </div>
  );
}

function HourlyOperationsAdvisor({ weatherData, getWeatherMeta, selectedDayIndex }: { weatherData: any; getWeatherMeta: (code: number) => any; selectedDayIndex: number }) {
  if (!weatherData?.hourly) return null;

  const isToday = selectedDayIndex === 0;

  const startIdx = selectedDayIndex * 24;
  const endIdx = startIdx + 24;

  const hours = weatherData.hourly.time.slice(startIdx, endIdx);
  const temps = weatherData.hourly.temperature_2m.slice(startIdx, endIdx);
  const rainProbs = weatherData.hourly.precipitation_probability ? weatherData.hourly.precipitation_probability.slice(startIdx, endIdx) : Array(24).fill(0);
  const winds = weatherData.hourly.wind_speed_10m ? weatherData.hourly.wind_speed_10m.slice(startIdx, endIdx) : Array(24).fill(0);
  const rhs = weatherData.hourly.relative_humidity_2m ? weatherData.hourly.relative_humidity_2m.slice(startIdx, endIdx) : Array(24).fill(50);
  const codes = weatherData.hourly.weather_code ? weatherData.hourly.weather_code.slice(startIdx, endIdx) : Array(24).fill(0);

  const selectedDayDate = new Date(weatherData.daily.time[selectedDayIndex]).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Smart hour ranges calculation
  const formatH = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const getRanges = (checkFn: (i: number) => boolean) => {
    const ranges: string[] = [];
    let start: number | null = null;

    for (let i = 0; i <= 24; i++) {
      const isMatch = i < 24 && checkFn(i);
      if (isMatch) {
        if (start === null) {
          start = i;
        }
      } else {
        if (start !== null) {
          ranges.push(`${formatH(start)} - ${formatH(i)}`);
          start = null;
        }
      }
    }
    return ranges;
  };

  // Operational Suitability Checks
  const isSprayingExcellent = (i: number) => winds[i] <= 12 && rainProbs[i] <= 10;
  const isSprayingFavorable = (i: number) => (winds[i] > 12 && winds[i] <= 18 && rainProbs[i] <= 25) || (rainProbs[i] > 10 && rainProbs[i] <= 25 && winds[i] <= 18);
  
  const isHarvestingExcellent = (i: number) => rainProbs[i] <= 10 && rhs[i] <= 65;
  const isHarvestingFavorable = (i: number) => (rainProbs[i] > 10 && rainProbs[i] <= 20 && rhs[i] <= 75) || (rhs[i] > 65 && rhs[i] <= 75 && rainProbs[i] <= 20);

  const isIrrigationExcellent = (i: number) => temps[i] < 22 && winds[i] < 12;
  const isIrrigationFavorable = (i: number) => (temps[i] >= 22 && temps[i] < 28 && winds[i] < 18);

  const isSowingExcellent = (i: number) => temps[i] >= 10 && rainProbs[i] <= 40;
  const isSowingFavorable = (i: number) => temps[i] >= 5 && rainProbs[i] <= 70;

  const sprayingOpt = getRanges(isSprayingExcellent);
  const sprayingMarg = getRanges(isSprayingFavorable);

  const harvestingOpt = getRanges(isHarvestingExcellent);
  const harvestingMarg = getRanges(isHarvestingFavorable);

  const irrigationOpt = getRanges(isIrrigationExcellent);
  const irrigationMarg = getRanges(isIrrigationFavorable);

  const sowingOpt = getRanges(isSowingExcellent);
  const sowingMarg = getRanges(isSowingFavorable);

  return (
    <div className="space-y-6">
      {/* 24-Hour Micro-Climate Timeline Slider (Fully visible horizontal log) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-800">24-Hour Micro-Climate Timeline</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full">
            {selectedDayDate}
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {hours.map((timeStr: string, idx: number) => {
            const dateObj = new Date(timeStr);
            const hourLabel = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const hourlyTemp = temps[idx];
            const hourlyRH = rhs[idx];
            const hourlyProb = rainProbs[idx];
            const hourlyWind = winds[idx];
            const hourlyMeta = getWeatherMeta(codes[idx]);

            const currentHour = new Date().getHours();
            const isCurrentHour = selectedDayIndex === 0 && dateObj.getHours() === currentHour;

            const isSprayingOk = isSprayingExcellent(idx) || isSprayingFavorable(idx);
            const isHarvestingOk = isHarvestingExcellent(idx) || isHarvestingFavorable(idx);

            return (
              <div
                key={timeStr}
                className={`flex-none w-32 flex flex-col items-center justify-between p-3.5 rounded-2xl border text-center transition-all ${
                  isCurrentHour
                    ? "bg-emerald-50/60 border-emerald-400 shadow-sm ring-1 ring-emerald-400/20"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="space-y-0.5 w-full">
                  <p className={`text-xs font-black ${isCurrentHour ? "text-emerald-700" : "text-slate-800"}`}>
                    {hourLabel}
                  </p>
                  {isCurrentHour && (
                    <span className="inline-block bg-emerald-100 text-emerald-800 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                      Now
                    </span>
                  )}
                </div>

                <div className="my-2.5">
                  {hourlyMeta.icon}
                </div>

                <div className="space-y-2 w-full">
                  <p className="text-sm font-black text-slate-800">
                    {Math.round(hourlyTemp)}°C
                  </p>
                  
                  <div className="border-t border-slate-200/50 pt-2 space-y-1 text-[9px] font-bold">
                    <div className="flex justify-between items-center text-sky-600">
                      <span>Rain:</span>
                      <span>{hourlyProb}%</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Wind:</span>
                      <span>{Math.round(hourlyWind)} km/h</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>RH:</span>
                      <span>{hourlyRH}%</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-1.5 pt-1.5 border-t border-slate-200/50">
                    <span 
                      className={`w-2.5 h-2.5 rounded-full inline-block ${isSprayingOk ? "bg-emerald-500" : "bg-rose-400"}`}
                      title={isSprayingOk ? "Spraying Recommended" : "Spraying Unsuitable"}
                    />
                    <span 
                      className={`w-2.5 h-2.5 rounded-full inline-block ${isHarvestingOk ? "bg-amber-500" : "bg-rose-400"}`}
                      title={isHarvestingOk ? "Harvesting Recommended/Marginal" : "Harvesting Unsuitable"}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Field Operations Advisor Grid (Entire selected day's windows mapped) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
        <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Compass className="w-4.5 h-4.5 text-emerald-600" />
            <h4 className="text-sm font-black text-slate-800">Daily Operations Suitability Advisor ({selectedDayDate})</h4>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">Smart Analysis</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Spraying Advice */}
          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-500 shrink-0" /> Spraying (Chemicals)
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${sprayingOpt.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {sprayingOpt.length > 0 ? (isToday ? "Favorable Today" : `Favorable on ${selectedDayDate}`) : "Not Recommended"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Requires wind speeds below 12 km/h and rain probability under 10% for maximum absorption and zero drift.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Optimal Windows</span>
                <p className="text-xs font-black text-emerald-600">
                  {sprayingOpt.length > 0 ? sprayingOpt.join(", ") : (isToday ? "No fully optimal windows today." : `No fully optimal windows on ${selectedDayDate}.`)}
                </p>
              </div>
              {sprayingMarg.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Marginal Windows (Caution)</span>
                  <p className="text-xs font-semibold text-amber-600">{sprayingMarg.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Harvesting Advice */}
          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" /> Harvesting Window
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${harvestingOpt.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {harvestingOpt.length > 0 ? "Dry Windows" : "Highly Humid"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Favorable under 65% humidity and negligible rain chances to avoid high grain dampness and drying costs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Optimal Windows</span>
                <p className="text-xs font-black text-emerald-600">
                  {harvestingOpt.length > 0 ? harvestingOpt.join(", ") : (isToday ? "No dry, optimal windows today." : `No dry, optimal windows on ${selectedDayDate}.`)}
                </p>
              </div>
              {harvestingMarg.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Marginal Windows</span>
                  <p className="text-xs font-semibold text-amber-600">{harvestingMarg.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Irrigation Advice */}
          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-sky-500 shrink-0" /> Irrigation Efficiency
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${irrigationOpt.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {irrigationOpt.length > 0 ? "Highly Efficient" : "Moderate Only"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Cool temperatures (&lt; 22°C) and low winds (&lt; 12 km/h) prevent water evaporation before absorbing into root systems.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Optimal Windows (Low Evaporation)</span>
                <p className="text-xs font-black text-emerald-600">
                  {irrigationOpt.length > 0 ? irrigationOpt.join(", ") : (isToday ? "No high-efficiency windows today." : `No high-efficiency windows on ${selectedDayDate}.`)}
                </p>
              </div>
              {irrigationMarg.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Marginal Windows</span>
                  <p className="text-xs font-semibold text-amber-600">{irrigationMarg.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sowing Advice */}
          <div className="border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-200 transition-colors">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-purple-500 shrink-0" /> Sowing & Planting
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${sowingOpt.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {sowingOpt.length > 0 ? "Favorable Sowing" : "Restricted Sowing"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Sufficient temperature (&gt; 10°C) and moderate moisture are crucial for seed germination and seedling health.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Optimal Windows</span>
                <p className="text-xs font-black text-emerald-600">
                  {sowingOpt.length > 0 ? sowingOpt.join(", ") : (isToday ? "No optimal sowing windows today." : `No optimal sowing windows on ${selectedDayDate}.`)}
                </p>
              </div>
              {sowingMarg.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Marginal Windows</span>
                  <p className="text-xs font-semibold text-amber-600">{sowingMarg.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailedHourlyLogTable({ weatherData, selectedDayIndex }: { weatherData: any; selectedDayIndex: number }) {
  if (!weatherData?.hourly) return null;

  const startIdx = selectedDayIndex * 24;
  const endIdx = startIdx + 24;

  const hours = weatherData.hourly.time.slice(startIdx, endIdx);
  const temps = weatherData.hourly.temperature_2m.slice(startIdx, endIdx);
  const rainProbs = weatherData.hourly.precipitation_probability ? weatherData.hourly.precipitation_probability.slice(startIdx, endIdx) : Array(24).fill(0);
  const winds = weatherData.hourly.wind_speed_10m ? weatherData.hourly.wind_speed_10m.slice(startIdx, endIdx) : Array(24).fill(0);
  const rhs = weatherData.hourly.relative_humidity_2m ? weatherData.hourly.relative_humidity_2m.slice(startIdx, endIdx) : Array(24).fill(50);

  const isSprayingExcellent = (i: number) => winds[i] <= 12 && rainProbs[i] <= 10;
  const isSprayingFavorable = (i: number) => (winds[i] > 12 && winds[i] <= 18 && rainProbs[i] <= 25) || (rainProbs[i] > 10 && rainProbs[i] <= 25 && winds[i] <= 18);
  
  const isHarvestingExcellent = (i: number) => rainProbs[i] <= 10 && rhs[i] <= 65;
  const isHarvestingFavorable = (i: number) => (rainProbs[i] > 10 && rainProbs[i] <= 20 && rhs[i] <= 75) || (rhs[i] > 65 && rhs[i] <= 75 && rainProbs[i] <= 20);

  const selectedDayDate = new Date(weatherData.daily.time[selectedDayIndex]).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Detailed 24-Hour Operations Log ({selectedDayDate})</h4>
        <span className="text-[10px] font-bold text-slate-400">Refined Microclimate Logs</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-100/50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Temp</th>
              <th className="px-4 py-3">Precip Chance</th>
              <th className="px-4 py-3">Wind Speed</th>
              <th className="px-4 py-3">Humidity</th>
              <th className="px-4 py-3">Spraying</th>
              <th className="px-4 py-3">Harvesting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {hours.map((timeStr: string, idx: number) => {
              const dObj = new Date(timeStr);
              const label = dObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
              
              const sExcellent = isSprayingExcellent(idx);
              const sFavorable = isSprayingFavorable(idx);
              const hExcellent = isHarvestingExcellent(idx);
              const hFavorable = isHarvestingFavorable(idx);

              return (
                <tr key={timeStr} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-700">{label}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{Math.round(temps[idx])}°C</td>
                  <td className="px-4 py-2.5 font-semibold text-sky-600">{rainProbs[idx]}%</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{Math.round(winds[idx])} km/h</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-500">{rhs[idx]}%</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      sExcellent ? "bg-emerald-50 border border-emerald-200 text-emerald-700" :
                      sFavorable ? "bg-amber-50 border border-amber-200 text-amber-700" :
                      "bg-rose-50 border border-rose-100 text-rose-600"
                    }`}>
                      {sExcellent ? "Excellent" : sFavorable ? "Favorable" : "Unsuitable"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      hExcellent ? "bg-emerald-50 border border-emerald-200 text-emerald-700" :
                      hFavorable ? "bg-amber-50 border border-amber-200 text-amber-700" :
                      "bg-rose-50 border border-rose-100 text-rose-600"
                    }`}>
                      {hExcellent ? "Optimal" : hFavorable ? "Moderate" : "Risky"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
