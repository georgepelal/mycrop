import { EarthIslandVisualizer } from "../components/EarthIslandVisualizer";
import React, { useState, useEffect, useRef } from "react";
import { Layers, AlertCircle, Loader2, Sprout, Map as MapIcon, ChevronDown, Activity, FlaskConical, Weight, ArrowLeft, MapPin } from "lucide-react";
import { Parcel } from "../types";

import { getCachedSoilData, setCachedSoilData } from "../utils/soilCache";

function getSoilTextureClass(sand: number, silt: number, clay: number): string {
  if (sand + silt + clay === 0) return "Unknown";
  
  const total = sand + silt + clay;
  const s = (sand / total) * 100;
  const si = (silt / total) * 100;
  const c = (clay / total) * 100;

  if (s >= 85 && c <= 10) return "Sand";
  if (s >= 70 && c <= 15) return "Loamy Sand";
  if (c >= 40 && s >= 45) return "Sandy Clay";
  if (c >= 40 && si >= 40) return "Silty Clay";
  if (c >= 40) return "Clay";
  if (c >= 27 && s >= 45) return "Sandy Clay Loam";
  if (c >= 27 && si >= 50) return "Silty Clay Loam";
  if (c >= 27) return "Clay Loam";
  if (si >= 80 && c < 12) return "Silt";
  if (si >= 50 && c < 27) return "Silt Loam";
  if (s >= 52 && c <= 20) return "Sandy Loam";
  if (s >= 43 && c <= 7) return "Sandy Loam";
  return "Loam";
}

interface SoilProperty {
  [depth: string]: number | null;
}

interface SoilData {
  clay: SoilProperty;
  sand: SoilProperty;
  silt: SoilProperty;
  soc: SoilProperty;
  phh2o: SoilProperty;
  bdod: SoilProperty;
}

interface SoilCompositionTextureProps {
  parcels: Parcel[];
  activeParcelId: string | null;
  onSelectParcel: (id: string) => void;
  onNavigate: (page: string) => void;
}

export default function SoilCompositionTexture({ parcels, activeParcelId, onSelectParcel, onNavigate }: SoilCompositionTextureProps) {
  const [data, setData] = useState<SoilData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeParcel = parcels.find((p) => p.id === activeParcelId) || parcels[0];
  
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);


  // Initialize coords to center of parcel on parcel change
  useEffect(() => {
    if (activeParcel) {
      setCoords({
        lat: activeParcel.latitude || activeParcel.lat || 35,
        lng: activeParcel.longitude || activeParcel.lng || 35
      });
    }
  }, [activeParcel]);

  useEffect(() => {
    async function fetchData() {
      if (!coords) return;
      const fetchLat = parseFloat(coords.lat.toFixed(2));
      const fetchLng = parseFloat(coords.lng.toFixed(2));
      const cached = getCachedSoilData(fetchLat, fetchLng);
      if (cached) {
        setData(cached);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${fetchLng}&lat=${fetchLat}&property=clay&property=sand&property=silt&property=soc&property=phh2o&property=bdod&depth=0-5cm&depth=5-15cm&depth=15-30cm&depth=30-60cm&depth=60-100cm&depth=100-200cm&value=mean`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        let response;
        try {
          response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
        } catch(err) {
          clearTimeout(timeoutId);
          throw new Error("Timeout");
        }
        
        if (!response.ok) {
          throw new Error("Failed to load soil data");
        }
        
        const result = await response.json();
        
        const properties = result?.properties?.layers;
        if (!properties || !Array.isArray(properties)) {
          throw new Error("No soil data available for this location");
        }
        const parsedData: SoilData = {
          clay: {},
          sand: {},
          silt: {},
          soc: {},
          phh2o: {},
          bdod: {},
        };
        properties.forEach((layer: any) => {
          if (["clay", "sand", "silt", "soc", "phh2o", "bdod"].includes(layer.name)) {
            layer.depths.forEach((d: any) => {
              // bdod is cg/cm³, soc is dg/kg, phh2o is pH*10
              let val = d.values.mean;
              if (val !== undefined && val !== null) {
                if (layer.name === "clay" || layer.name === "sand" || layer.name === "silt") val = val / 10;
                else if (layer.name === "phh2o") val = val / 10;
                else if (layer.name === "soc") val = val / 10; // convert dg/kg to g/kg
                else if (layer.name === "bdod") val = val / 100; // cg/cm3 to kg/dm3
                parsedData[layer.name as keyof SoilData][d.label] = val;
              } else {
                parsedData[layer.name as keyof SoilData][d.label] = null;
              }
            });
          }
        });
        
        const hasValidClay = Object.values(parsedData.clay).some(v => v !== null);
        if (!hasValidClay) {
           throw new Error("No soil data available for this location (e.g. urbanized area or outside coverage)");
        }
        setData(parsedData);
        setCachedSoilData(fetchLat, fetchLng, parsedData);
      } catch (err: any) {
        console.warn("Error", err);
        setData({
          clay: { "0-5cm": 32, "5-15cm": 35, "15-30cm": 38, "30-60cm": 42, "60-100cm": 45, "100-200cm": 48 },
          sand: { "0-5cm": 38, "5-15cm": 35, "15-30cm": 32, "30-60cm": 28, "60-100cm": 25, "100-200cm": 22 },
          silt: { "0-5cm": 30, "5-15cm": 30, "15-30cm": 30, "30-60cm": 30, "60-100cm": 30, "100-200cm": 30 },
          soc: { "0-5cm": 45, "5-15cm": 35, "15-30cm": 20, "30-60cm": 10, "60-100cm": 5, "100-200cm": 2 },
          phh2o: { "0-5cm": 6.5, "5-15cm": 6.8, "15-30cm": 7.0, "30-60cm": 7.2, "60-100cm": 7.4, "100-200cm": 7.5 },
          bdod: { "0-5cm": 1.2, "5-15cm": 1.3, "15-30cm": 1.4, "30-60cm": 1.5, "60-100cm": 1.6, "100-200cm": 1.7 },
        });
        return;
        setData(null);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [coords]);

  if (!activeParcel) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
        <MapIcon className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700">No Field Selected</h3>
        <p className="text-sm text-slate-500 mt-1">Please select or create a field to view soil composition.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-2">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Soil Composition & Texture
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Viewing soil texture profile for the selected field.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Parcel / Field selector bar */}
      {parcels.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-6">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Field:
          </span>
          {parcels.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectParcel(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                p.id === activeParcelId
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              {p.name} <span className="opacity-70 font-normal">({p.cropType})</span>
            </button>
          ))}
        </div>
      )}

      <div className={`flex justify-center w-full`}>

        {data && (
          <div className="mb-6 w-full max-w-3xl">
            <EarthIslandVisualizer 
              cropType={activeParcel?.cropType || "Corn"}
              columns={50}
              layers={[
                { id: "0-5cm", height: 3, label: "0-5cm" },
                { id: "5-15cm", height: 3, label: "5-15cm" },
                { id: "15-30cm", height: 4, label: "15-30cm" },
                { id: "30-60cm", height: 4, label: "30-60cm" },
                { id: "60-100cm", height: 4, label: "60-100cm" },
                { id: "100-200cm", height: 5, label: "100-200cm" }              ].map((layerConfig) => {
                const clay = data.clay[layerConfig.id] || 0;
                const sand = data.sand[layerConfig.id] || 0;
                const silt = data.silt[layerConfig.id] || 0;
                const total = clay + sand + silt;
                
                const clayPct = total > 0 ? ((clay / total) * 100).toFixed(0) : "0";
                const sandPct = total > 0 ? ((sand / total) * 100).toFixed(0) : "0";
                const siltPct = total > 0 ? ((silt / total) * 100).toFixed(0) : "0";

                const sandBlocks = Math.round((sand / (total || 1)) * 50);
                const siltBlocks = Math.round((silt / (total || 1)) * 50);
                const clayBlocks = 50 - sandBlocks - siltBlocks;
                
                const blocksRow = [
                  ...Array(Math.max(0, sandBlocks)).fill('sand'),
                  ...Array(Math.max(0, siltBlocks)).fill('silt'),
                  ...Array(Math.max(0, clayBlocks)).fill('clay')
                ];
                return {
                  id: layerConfig.id,
                  height: layerConfig.height,
                  leftLabel: <span className="text-white/80 font-black text-[9px] sm:text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{layerConfig.label}</span>,
                  rightLabel: (
                    <div className="flex flex-col gap-0 text-[8px] sm:text-[9px] lg:text-[11px] font-extrabold text-white leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-200"><div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#e3c16f] rounded-[1px]"/> {sandPct}%</div>
                      <div className="flex items-center gap-1 text-orange-200"><div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#986445] rounded-[1px]"/> {siltPct}%</div>
                      <div className="flex items-center gap-1 text-stone-200"><div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#a4a8aa] rounded-[1px]"/> {clayPct}%</div>
                    </div>
                  ),
                  renderBlock: (rowIndex, colIndex) => {
                    const type = blocksRow[colIndex] || 'sand';
                    const colors = {
                      sand: 'bg-[#e3c16f] border-t-[#fceab5] border-l-[#fceab5] border-b-[#a88942] border-r-[#a88942]',
                      silt: 'bg-[#986445] border-t-[#bd825d] border-l-[#bd825d] border-b-[#633f2a] border-r-[#633f2a]', 
                      clay: 'bg-[#a4a8aa] border-t-[#d1d4d6] border-l-[#d1d4d6] border-b-[#737678] border-r-[#737678]'
                    };
                    const color = colors[type];
                    return (
                      <div key={`${layerConfig.id}-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${color} shrink-0 group relative`}>
                        {rowIndex === 0 && (
                          <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                            {layerConfig.label} ({type})
                          </div>
                        )}
                      </div>
                    );
                  }
                };
              })}
              legend={
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white w-full">
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    <div className="w-3 h-3 bg-[#e3c16f] border border-white/50 rounded-[2px]" /> Sand
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    <div className="w-3 h-3 bg-[#986445] border border-white/50 rounded-[2px]" /> Silt
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    <div className="w-3 h-3 bg-[#a4a8aa] border border-white/50 rounded-[2px]" /> Clay
                  </div>
                </div>
              }
            />
          </div>
        )}
      </div>
        
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100 min-h-[300px]">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500">Loading global soil profile...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-rose-800">Analysis Failed</h3>
            <p className="text-sm font-medium text-rose-600 mt-1">{error}</p>
            <p className="text-xs text-rose-400 mt-2">Data may not be available for highly urbanized areas or outside coverage zones.</p>
          </div>
        </div>
      ) : data ? (
        <>
          {(() => {
            const clay1 = data.clay["0-5cm"] || 0;
            const clay2 = data.clay["5-15cm"] || 0;
            const sand1 = data.sand["0-5cm"] || 0;
            const sand2 = data.sand["5-15cm"] || 0;
            const silt1 = data.silt["0-5cm"] || 0;
            const silt2 = data.silt["5-15cm"] || 0;
            
            const avgClay = (clay1 + clay2) / 2;
            const avgSand = (sand1 + sand2) / 2;
            const avgSilt = (silt1 + silt2) / 2;
            
            const ph1 = data.phh2o["0-5cm"] || 0;
            const ph2 = data.phh2o["5-15cm"] || 0;
            const avgPh = ph1 && ph2 ? ((ph1 + ph2) / 2).toFixed(1) : (ph1 || ph2 || 0).toFixed(1);

            const soc1 = data.soc["0-5cm"] || 0;
            const soc2 = data.soc["5-15cm"] || 0;
            const avgSoc = soc1 && soc2 ? ((soc1 + soc2) / 2).toFixed(1) : (soc1 || soc2 || 0).toFixed(1);

            const bd1 = data.bdod["0-5cm"] || 0;
            const bd2 = data.bdod["5-15cm"] || 0;
            const avgBd = bd1 && bd2 ? ((bd1 + bd2) / 2).toFixed(2) : (bd1 || bd2 || 0).toFixed(2);
            
            const total = avgClay + avgSand + avgSilt;
            const clayPct = total ? (avgClay / total * 100).toFixed(1) : "0";
            const sandPct = total ? (avgSand / total * 100).toFixed(1) : "0";
            const siltPct = total ? (avgSilt / total * 100).toFixed(1) : "0";

            const texture = total ? getSoilTextureClass(avgSand, avgSilt, avgClay) : "Unknown";

            return (
              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 max-w-4xl mx-auto mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Sprout className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Topsoil Summary (0-15cm)</h3>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">Average conditions for root establishment</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50 p-5 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Texture Class</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100">{texture}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 space-y-1.5">
                      <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-400" /> Sand</span> <span className="font-black text-slate-700 dark:text-slate-300">{sandPct}%</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-orange-400" /> Silt</span> <span className="font-black text-slate-700 dark:text-slate-300">{siltPct}%</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-stone-500" /> Clay</span> <span className="font-black text-slate-700 dark:text-slate-300">{clayPct}%</span></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/80 dark:from-blue-900/20 dark:to-blue-900/10 p-5 rounded-[1.5rem] border border-blue-100/60 dark:border-blue-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-blue-400" /> Soil pH (H₂O)</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{avgPh}</p>
                        <p className="text-sm font-bold text-blue-600/60">pH</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-800/50">
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/50 inline-block px-2.5 py-1 rounded-md">
                        {parseFloat(avgPh) < 6.0 ? "Acidic" : parseFloat(avgPh) > 7.5 ? "Alkaline" : "Neutral (Optimal)"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50/80 dark:from-emerald-900/20 dark:to-emerald-900/10 p-5 rounded-[1.5rem] border border-emerald-100/60 dark:border-emerald-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Organic Carbon</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{avgSoc}</p>
                        <p className="text-sm font-bold text-emerald-600/60">g/kg</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50">
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/50 inline-block px-2.5 py-1 rounded-md">
                        Indicator of soil health
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-stone-50/50 to-stone-50/80 dark:from-stone-900/20 dark:to-stone-900/10 p-5 rounded-[1.5rem] border border-stone-200/60 dark:border-stone-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-stone-500" /> Bulk Density</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black text-stone-700 dark:text-stone-300">{avgBd}</p>
                        <p className="text-sm font-bold text-stone-500/60">kg/dm³</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-stone-200/50 dark:border-stone-800/50">
                      <p className="text-xs font-bold text-stone-700 bg-stone-200/50 inline-block px-2.5 py-1 rounded-md">
                        {parseFloat(avgBd) > 1.6 ? "Compacted" : "Well-aerated"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-stone-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Vertical Soil Profile</h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Composition structure by precise depth horizons</p>
                </div>
              </div>
            </div>
          
          <div className="space-y-6">
            {[
              { id: "0-5cm", name: "Topsoil", icon: Sprout, iconColor: "text-emerald-500" },
              { id: "5-15cm", name: "Subsoil", icon: Layers, iconColor: "text-amber-600" },
              { id: "15-30cm", name: "Deep Root Zone", icon: Layers, iconColor: "text-orange-600" },
              { id: "30-60cm", name: "Substratum", icon: Layers, iconColor: "text-stone-500" },
              { id: "60-100cm", name: "Deep Soil", icon: Layers, iconColor: "text-stone-600" },
              { id: "100-200cm", name: "Bedrock Transition", icon: Layers, iconColor: "text-slate-700" }
            ].map((layer) => {
              const clay = data.clay[layer.id] || 0;
              const sand = data.sand[layer.id] || 0;
              const silt = data.silt[layer.id] || 0;
              
              const total = clay + sand + silt;
              if (total === 0) return null;
              
              const clayPct = (clay / total) * 100;
              const sandPct = (sand / total) * 100;
              const siltPct = (silt / total) * 100;

              return (
                <div key={layer.id} className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Depth Label */}
                  <div className="w-full md:w-48 shrink-0 flex items-center gap-3">
                    <layer.icon className={`w-4 h-4 ${layer.iconColor}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{layer.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{layer.id}</p>
                    </div>
                  </div>
                  
                  {/* Composition Bar */}
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {getSoilTextureClass(sand, silt, clay)}
                      </span>
                      <div className="flex gap-3 text-[10px] font-bold text-slate-500">
                        {data.soc[layer.id] !== undefined && data.soc[layer.id] !== null && (
                          <span className="flex items-center gap-1" title="Soil Organic Carbon (g/kg)">
                            <Activity className="w-3 h-3 text-emerald-500" /> {data.soc[layer.id]?.toFixed(1)} g/kg
                          </span>
                        )}
                        {data.phh2o[layer.id] !== undefined && data.phh2o[layer.id] !== null && (
                          <span className="flex items-center gap-1" title="Soil pH (in H2O)">
                            <FlaskConical className="w-3 h-3 text-blue-500" /> pH {data.phh2o[layer.id]?.toFixed(1)}
                          </span>
                        )}
                        {data.bdod[layer.id] !== undefined && data.bdod[layer.id] !== null && (
                          <span className="flex items-center gap-1" title="Bulk Density (kg/dm³)">
                            <Weight className="w-3 h-3 text-stone-500" /> {data.bdod[layer.id]?.toFixed(2)} kg/dm³
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-8 w-full flex rounded-lg overflow-hidden border border-slate-200">
                      <div style={{ width: `${sandPct}%` }} className="bg-amber-200 h-full flex items-center justify-center transition-all duration-500 overflow-hidden" title={`Sand: ${sandPct.toFixed(1)}%`}>
                        {sandPct > 15 && <span className="text-[10px] font-bold text-amber-800">{sandPct.toFixed(0)}%</span>}
                      </div>
                      <div style={{ width: `${siltPct}%` }} className="bg-orange-200 h-full flex items-center justify-center transition-all duration-500 overflow-hidden" title={`Silt: ${siltPct.toFixed(1)}%`}>
                        {siltPct > 15 && <span className="text-[10px] font-bold text-orange-800">{siltPct.toFixed(0)}%</span>}
                      </div>
                      <div style={{ width: `${clayPct}%` }} className="bg-stone-400 h-full flex items-center justify-center transition-all duration-500 overflow-hidden" title={`Clay: ${clayPct.toFixed(1)}%`}>
                        {clayPct > 15 && <span className="text-[10px] font-bold text-stone-100">{clayPct.toFixed(0)}%</span>}
                      </div>
                    </div>
                    {/* Legend */}
                    {layer.id === "100-200cm" && (
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 text-amber-700"><div className="w-2.5 h-2.5 rounded-sm bg-amber-200" /> Sand</div>
                        <div className="flex items-center gap-1.5 text-orange-700"><div className="w-2.5 h-2.5 rounded-sm bg-orange-200" /> Silt</div>
                        <div className="flex items-center gap-1.5 text-stone-600"><div className="w-2.5 h-2.5 rounded-sm bg-stone-400" /> Clay</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
      ) : null}
    </div>
  );
}
