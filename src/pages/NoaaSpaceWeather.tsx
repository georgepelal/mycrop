import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Compass, SunDim, Radio, ShieldAlert, Cpu, AlertTriangle, RefreshCw } from "lucide-react";

interface SpaceWeatherScale {
  radiationStorms: number;
  radioBlackouts: number;
  geomagneticStorms: number;
  gpsIntegrityClass: string;
  scintillationRisk: string;
}

interface SpaceWeatherData {
  lives: boolean;
  scales: SpaceWeatherScale;
}

interface NoaaSpaceWeatherProps {
  onNavigate: (page: string) => void;
}

export default function NoaaSpaceWeather({ onNavigate }: NoaaSpaceWeatherProps) {
  const [data, setData] = useState<SpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpaceWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/noaa-space-weather-activity");
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to query Space Weather indices");
      }
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaceWeather();
  }, []);

  const getRiskColor = (scale: number) => {
    if (scale === 0) return "text-emerald-500 bg-emerald-50 border-emerald-200";
    if (scale <= 2) return "text-amber-500 bg-amber-50 border-amber-200";
    return "text-rose-500 bg-rose-50 border-rose-200";
  };

  const getStatusLabel = (scale: number) => {
    if (scale === 0) return "None (Normal)";
    return `G/S/R Class ${scale} Alert`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between lg:pr-8 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <SunDim className="w-7 h-7 text-amber-500 animate-pulse" />
              NOAA Space Weather & GPS Integrity
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Geomagnetic, radiation, and radio indices governing automated guidance systems.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSpaceWeather}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Indices
        </button>
      </div>

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Sourcing live logs from NOAA Space Weather Prediction Center...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          Error loading NOAA scales: {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">

          {/* Core Warning Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-950 rounded-2xl p-6 shadow-xl relative overflow-hidden text-white flex flex-col justify-center min-h-[220px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs mb-3">
                <Compass className="w-4 h-4 text-amber-400" /> Satellite Navigation Risk
              </div>
              <div className="text-medium text-slate-300 mb-1">GPS Telemetry Status:</div>
              <div className="text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
                {data.scales.gpsIntegrityClass}
              </div>
              <p className="text-xs text-slate-400 mt-3 font-mono leading-relaxed max-w-md">
                Critical for auto-steer tractor rigs and autonomous spraying UAV flights. Ionospheric anomalies delay carrier phase locks.
              </p>
            </div>

            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-center min-h-[220px]">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500" /> Ionospheric Scintillation
              </div>
              <div className="text-slate-500 text-sm mb-1 font-semibold">Wave Interruption Risk:</div>
              <div className="text-5xl font-black text-emerald-600 leading-tight">
                {data.scales.scintillationRisk}
              </div>
              <div className="text-slate-400 font-mono text-[10px] mt-3">
                Updated in real-time. Calculated based on NOAA swpc index arrays.
              </div>
            </div>
          </div>

          {/* Three Scales Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Geomagnetic Storms */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-400 tracking-wider">Geomagnetic (G-Scale)</div>
                  <Cpu className="w-4 h-4 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">
                  {getStatusLabel(data.scales.geomagneticStorms)}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Measures disturbances in the Earth's magnetic field triggered by Coronal Mass Ejections.
                </p>
              </div>
              <span className={`w-fit mt-4 px-3 py-1 rounded-full text-[10px] font-bold border ${getRiskColor(data.scales.geomagneticStorms)}`}>
                G{data.scales.geomagneticStorms} Class Indicator
              </span>
            </div>

            {/* Solar Radiation Storms */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-400 tracking-wider">Solar Radiation (S-Scale)</div>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">
                  {getStatusLabel(data.scales.radiationStorms)}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Calculates flux levels of high-energy solar protons crossing upper stratospheric flight vectors.
                </p>
              </div>
              <span className={`w-fit mt-4 px-3 py-1 rounded-full text-[10px] font-bold border ${getRiskColor(data.scales.radiationStorms)}`}>
                S{data.scales.radiationStorms} Class Indicator
              </span>
            </div>

            {/* Radio Blackouts */}
            <div className="bg-white border text-gray-900 border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="font-bold text-xs uppercase text-slate-400 tracking-wider">Radio Blackout (R-Scale)</div>
                  <Radio className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">
                  {getStatusLabel(data.scales.radioBlackouts)}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Measures ionization spikes blockading HF/UHF communication channels across daylit hemisphere areas.
                </p>
              </div>
              <span className={`w-fit mt-4 px-3 py-1 rounded-full text-[10px] font-bold border ${getRiskColor(data.scales.radioBlackouts)}`}>
                R{data.scales.radioBlackouts} Class Indicator
              </span>
            </div>

          </div>

          {/* Operational Recommendations */}
          <div className="bg-amber-50 border border-amber-200 text-slate-800 rounded-2xl p-5 md:p-6 flex gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm mb-1">Guidance on Autonomous Spraying / Heavy Machine Runs</h4>
              <p className="text-xs leading-relaxed text-amber-800">
                If scales are R0–R2, G0–G2, or S0–S2, base operations can proceed confidently with standard RTK baseline relays. If indices flare to class 3 or higher, differential GPS heading accuracy may suffer micro-drift. Ensure a spotter tracks coordinates during close-boundary headland turning circles.
              </p>
            </div>
          </div>

          <div className="border border-slate-150 bg-slate-50/50 p-4 rounded-xl text-[11px] font-mono text-slate-500">
            Source: NOAA Space Weather Prediction Center (SWPC). Scales map solar physical phenomena mathematically to critical terrestrial impacts.
          </div>

        </div>
      )}
    </div>
  );
}
