import React, { useState, useEffect } from "react";
import { MapPin, AlertCircle, MapPin as MapPinIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LocationMapPicker from "../components/LocationMapPicker";

export default function OsmReverseGeocode() {
  const { t } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState({ lat: 40.7128, lng: -74.006 }); // Default New York

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {
          console.warn("Geolocation denied or failed, using defaults");
        }
      );
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        let response;
        if ("/api/osm-reverse-geocode".includes("health") || "/api/osm-reverse-geocode".includes("ip-geolocation")) {
          response = await fetch("/api/osm-reverse-geocode");
        } else {
          response = await fetch("/api/osm-reverse-geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
          });
        }
        
        if (!response.ok) {
          throw new Error("Failed to load data");
        }
        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }
        setData(result);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [coords]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t("sidebar.OsmReverseGeocode") || "Reverse Geocoding"}</h1>
          <p className="text-sm font-medium text-slate-500">Live API Endpoint: /api/osm-reverse-geocode</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPinIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Current Coordinates</h3>
              <p className="text-xs font-medium text-slate-500">Live Observation Point</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latitude</p>
              <p className="text-sm font-mono font-bold text-slate-700">{coords.lat.toFixed(4)}°</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Longitude</p>
              <p className="text-sm font-mono font-bold text-slate-700">{coords.lng.toFixed(4)}°</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <LocationMapPicker 
            lat={coords.lat} 
            lng={coords.lng} 
            onChange={(lat, lng) => setCoords({ lat, lng })}
            height="180px"
          />
        </div>
      </div>
        

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-100">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-500">Fetching API Analysis...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-rose-800">Observation Failed</h3>
            <p className="text-sm font-medium text-rose-600 mt-1">{error}</p>
            <p className="text-xs text-rose-400 mt-2">The API may be rate-limited, unavailable, or unsupported for the current coordinates.</p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 overflow-x-auto">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Raw API Response Target</h3>
          <pre className="text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap word-break">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
