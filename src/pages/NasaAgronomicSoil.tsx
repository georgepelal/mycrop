import React, { useEffect, useMemo, useState } from "react";
import { Parcel } from "../types";
import { Loader2, MapPin, Info, ThermometerSun, Calendar as CalendarIcon, Waves, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, parse } from "date-fns";
import { EarthIslandVisualizer } from "../components/EarthIslandVisualizer";

interface NasaAgronomicSoilProps {
  parcels: Parcel[];
  activeParcelId: string | null;
  onSelectParcel: (id: string) => void;
  onNavigate: (page: string) => void;
}

const getMoistureBlockColor = (moisture: number) => {
  if (moisture > 0.8) return "bg-[#1e3a8a] border-t-[#3b82f6] border-l-[#3b82f6] border-b-[#172554] border-r-[#172554]";
  if (moisture > 0.6) return "bg-[#2563eb] border-t-[#60a5fa] border-l-[#60a5fa] border-b-[#1e40af] border-r-[#1e40af]";
  if (moisture > 0.4) return "bg-[#3b82f6] border-t-[#93c5fd] border-l-[#93c5fd] border-b-[#1d4ed8] border-r-[#1d4ed8]";
  if (moisture > 0.2) return "bg-[#a8a29e] border-t-[#d6d3d1] border-l-[#d6d3d1] border-b-[#78716c] border-r-[#78716c]";
  return "bg-[#d6d3d1] border-t-[#f5f5f4] border-l-[#f5f5f4] border-b-[#a8a29e] border-r-[#a8a29e]";
};

export default function NasaAgronomicSoil({ parcels, activeParcelId, onNavigate }: NasaAgronomicSoilProps) {
  const activeParcel = parcels?.find(p => p.id === activeParcelId) || parcels?.[0];
  const coords = useMemo(
    () => activeParcel ? { lat: activeParcel.lat || activeParcel.latitude, lng: activeParcel.lng || activeParcel.longitude } : null,
    [activeParcel]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [daysBack, setDaysBack] = useState<number>(30);

  useEffect(() => {
    async function fetchData() {
      if (!coords) return;
      setLoading(true);
      setError(null);

      try {
        const fetchLat = parseFloat(coords.lat.toFixed(4));
        const fetchLng = parseFloat(coords.lng.toFixed(4));

        const endDate = new Date();
        const startDate = subDays(endDate, daysBack);

        const formatDateStr = (d: Date) => format(d, "yyyyMMdd");
        const startStr = formatDateStr(startDate);
        const endStr = formatDateStr(endDate);

        // GWETPROF: Profile Soil Moisture
        // GWETROOT: Root Zone Soil Moisture
        // GWETTOP: Top Soil Moisture
        // TS: Earth Skin Temperature
        const paramsQuery = "GWETPROF,GWETROOT,GWETTOP,TS";
        const powerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${paramsQuery}&community=ag&longitude=${fetchLng}&latitude=${fetchLat}&start=${startStr}&end=${endStr}&format=json`;

        const res = await fetch(powerUrl);
        if (!res.ok) {
          throw new Error("Failed to fetch Satellite data");
        }
        
        const json = await res.json();
        const param = json?.properties?.parameter;
        if (!param) {
          throw new Error("Invalid response format from Satellite database");
        }

        const dates = Object.keys(param.GWETTOP || {}).sort();
        
        const chartData = dates.map(dateStr => {
          const parsedDate = parse(dateStr, "yyyyMMdd", new Date());
          return {
            dateStr: format(parsedDate, "MMM d"),
            topMoisture: param.GWETTOP[dateStr] !== -999 ? param.GWETTOP[dateStr] : null,
            rootMoisture: param.GWETROOT[dateStr] !== -999 ? param.GWETROOT[dateStr] : null,
            profMoisture: param.GWETPROF[dateStr] !== -999 ? param.GWETPROF[dateStr] : null,
            skinTemp: param.TS[dateStr] !== -999 ? param.TS[dateStr] : null,
          };
        });

        setData(chartData);

      } catch (err: any) {
        setError(err.message || "Failed to load historical soil data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [coords, daysBack]);

  if (!activeParcel) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
        <MapPin className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">No Field Selected</h3>
        <p className="text-sm text-slate-500 mt-1">Please select a field to view agronomic soil metrics.</p>
      </div>
    );
  }

  const latest = data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                <Waves className="w-7 h-7 text-blue-500 animate-pulse" />
                Agronomic Soil
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Historical soil moisture profiles and earth skin temperature powered by the Satellite database Project.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700/50">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{activeParcel.name}</span>
          </div>
          
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => setDaysBack(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${daysBack === 30 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              30D
            </button>
            <button 
              onClick={() => setDaysBack(90)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${daysBack === 90 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              90D
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500">Querying Satellite database Archives...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-red-100">
          <Info className="w-8 h-8 text-red-500 mb-4" />
          <p className="text-sm font-bold text-slate-800">{error}</p>
        </div>
      ) : data.length > 0 && latest ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <EarthIslandVisualizer 
              cropType={activeParcel.cropType || "Corn"}
              layers={[
                { id: "Top Soil", height: 3, value: latest.topMoisture },
                { id: "Root Zone", height: 5, value: latest.rootMoisture },
                { id: "Profile", height: 6, value: latest.profMoisture }
              ].map(layerInfo => {
                const moisture = layerInfo.value ?? 0;
                return {
                  id: layerInfo.id,
                  height: layerInfo.height,
                  leftLabel: <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{layerInfo.id}</span>,
                  rightLabel: (
                    <div className="flex flex-col text-[10px] font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] gap-0.5 whitespace-nowrap">
                      <span className="text-blue-300">{(moisture * 100).toFixed(0)}% Moist</span>
                    </div>
                  ),
                  renderBlock: (rowIndex, colIndex) => (
                    <div key={`${layerInfo.id}-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getMoistureBlockColor(moisture)} shrink-0 group relative`}>
                      {rowIndex === 0 && colIndex === 10 && (
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                          {layerInfo.id}: {(moisture * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  )
                }
              })}
              legend={
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/20 text-[9px] font-black uppercase tracking-wider text-white w-full">
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                    <div className="w-2.5 h-2.5 bg-[#1e3a8a] border border-white" /> Very Wet (&gt;80%)
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                    <div className="w-2.5 h-2.5 bg-[#2563eb] border border-white" /> Wet (&gt;60%)
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                    <div className="w-2.5 h-2.5 bg-[#3b82f6] border border-white" /> Moist (&gt;40%)
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                    <div className="w-2.5 h-2.5 bg-[#a8a29e] border border-white" /> Dry (&gt;20%)
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] whitespace-nowrap">
                    <div className="w-2.5 h-2.5 bg-[#d6d3d1] border border-white" /> Very Dry (≤20%)
                  </div>
                </div>
              }
            />
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <ThermometerSun className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Earth Skin Temp
                </h3>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black text-slate-800">{latest.skinTemp?.toFixed(1) ?? "--"}</p>
                <p className="text-sm font-bold text-slate-400">°C</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-slate-400" /> Historical Trend
              </h3>
              
              <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="dateStr" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                  
                  <Line yAxisId="left" type="monotone" name="Top Soil Moisture" dataKey="topMoisture" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line yAxisId="left" type="monotone" name="Root Zone Moisture" dataKey="rootMoisture" stroke="#0891B2" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line yAxisId="left" type="monotone" name="Profile Moisture" dataKey="profMoisture" stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" name="Skin Temperature (°C)" dataKey="skinTemp" stroke="#F97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
