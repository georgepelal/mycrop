import React, { useState } from "react";
import { ArrowLeft, Loader2, Orbit, MapPin, Compass, Eye, ShieldCheck, RefreshCw, Info } from "lucide-react";
import LocationSearch from "../components/LocationSearch";

interface IssSatelliteProps {
  onNavigate: (page: string) => void;
}

interface IssOverheadData {
  lives: boolean;
  iss: {
    latitude: number;
    longitude: number;
    altitudeKm: number;
    velocityKmh: number;
    distanceToGrowerKm: number;
    isNearOverhead: boolean;
    visibility: string;
  };
}

export default function IssSatelliteOverhead({ onNavigate }: IssSatelliteProps) {
  const [data, setData] = useState<IssOverheadData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    setLocationName(name);
    setCoords({ lat, lng });
    try {
      const response = await fetch("/api/iss-current-overhead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to trace current ISS coordinates");
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

  const handleRefresh = () => {
    if (coords) {
      fetchData(coords.lat, coords.lng, locationName);
    }
  };

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
              <Orbit className="w-7 h-7 text-indigo-600 animate-spin" style={{ animationDuration: "12s" }} />
              ISS Satellite Passing Footprint
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Trace the International Space Station coordinates and telemetry relative to your acreage.
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-96 flex gap-2">
          <div className="flex-1">
            <LocationSearch 
              onLocationSelect={handleLocationSelect} 
              placeholder="Search anywhere..." 
            />
          </div>
          {coords && (
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition shadow-sm disabled:opacity-50 shrink-0"
              title="Refresh Orbital Position"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          )}
        </div>
      </div>

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <Orbit className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Compute Orbital Passes
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Enter a location to query NORAD/where-the-iss-is live orbital ephemerides and measure instantaneous footprint geometry.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Fetching celestial coordinates and computing geodetic range...
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

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 px-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            Orbital Analysis: {locationName}
            {data.iss.isNearOverhead ? (
              <span className="ml-auto text-[10px] bg-emerald-50 text-emerald-600 px-2 flex items-center gap-1 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                ISS is over your regional horizon!
              </span>
            ) : (
              <span className="ml-auto text-[10px] bg-indigo-50 text-indigo-600 px-2 flex items-center gap-1 py-0.5 rounded-full border border-indigo-200">
                <Compass className="w-3 h-3" />
                Under the Horizon
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Big Footprint Range Card */}
             <div className="bg-indigo-950 border border-indigo-900 rounded-2xl p-6 shadow-xl relative overflow-hidden text-center flex flex-col justify-center min-h-[240px] text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                <div className="flex justify-center mb-4 relative z-10"><Orbit className="w-10 h-10 text-indigo-300 opacity-90 animate-spin" style={{ animationDuration: "20s" }} /></div>
                <div className="text-indigo-300 font-bold uppercase tracking-widest text-xs mb-2 relative z-10">Distance to ISS Footprint</div>
                <div className="text-6xl font-black text-white flex justify-center items-baseline gap-1 relative z-10">
                   {Math.round(data.iss.distanceToGrowerKm).toLocaleString()} <span className="text-xl text-indigo-200/60 font-medium">km</span>
                </div>
                <div className="text-[10px] font-mono text-indigo-300/60 mt-3 uppercase tracking-wider relative z-10">
                   (Straight-line Great Circle distance across Earth crust)
                </div>
             </div>

             <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[240px]">
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-500" /> Spacecraft Mechanics
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Velocity</div>
                    <div className="text-2xl font-black text-slate-800 font-mono">{Math.round(data.iss.velocityKmh).toLocaleString()} <span className="text-xs text-slate-400 font-normal">km/h</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altitude (Apogee)</div>
                    <div className="text-2xl font-black text-slate-800 font-mono">{Math.round(data.iss.altitudeKm)} <span className="text-xs text-slate-400 font-normal">km</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ISS Latitude</div>
                    <div className="text-xl font-bold font-mono text-indigo-600">{data.iss.latitude.toFixed(4)}°</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ISS Longitude</div>
                    <div className="text-xl font-bold font-mono text-indigo-600">{data.iss.longitude.toFixed(4)}°</div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Orbital Visibility:</span>
                  <span className="text-emerald-600 font-bold">{data.iss.visibility}</span>
                </div>
             </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-150 text-slate-800 rounded-2xl p-5 flex gap-4 text-sm leading-relaxed">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-indigo-500" />
            <div>
              <strong className="block mb-1">Low-Earth-Orbit Agricultural Telemetry</strong> 
              Many high-resolution multispectral instruments and thermal radiometers are mounted on the ISS. Knowing the ISS footprint enables agronomists to identify the exact satellite orbits recording imagery of their soil nodes.
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] font-mono text-slate-500 text-center">
             Data sourced live via NORAD Keplerian elements tracing space track catalog item #25544.
          </div>

        </div>
      )}
    </div>
  );
}
