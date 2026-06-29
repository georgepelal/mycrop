const fs = require('fs');
const path = require('path');

const pagesToCreate = [
  { name: 'MarineHydrodynamics', api: '/api/marine-hydrodynamics', title: 'Marine Hydrodynamics Data', icon: 'Waves' },
  { name: 'AirQualityAerosols', api: '/api/air-quality-aerosols', title: 'Air Quality & Aerosols', icon: 'Wind' },
  { name: 'OpenEpiForestFire', api: '/api/openepi-forest-fire', title: 'OpenEPI Forest Fire Risk', icon: 'Flame' },
  { name: 'ClimatologyNasa', api: '/api/climatology-nasa', title: 'NASA Climatology', icon: 'Sun' },
  { name: 'RiverDischarge', api: '/api/openmeteo-river-discharge', title: 'River Discharge', icon: 'Droplets' },
  { name: 'AgriSoilMoisture', api: '/api/openmeteo-agri-soil', title: 'Agri-Soil Moisture', icon: 'Sprout' },
  { name: 'HistoricalArchive', api: '/api/openmeteo-historical-archive', title: 'Historical Climate Archive', icon: 'History' },
  { name: 'SunriseSunsetAstronomy', api: '/api/sunrise-sunset-astronomy', title: 'Sunrise & Astronomy', icon: 'Sunrise' },
  { name: 'PlantDictionaryLookup', api: '/api/plant-dictionary-lookup', title: 'Plant Dictionary Lookup', icon: 'Search' },
  { name: 'GbifLocalOccurrences', api: '/api/gbif-local-occurrences', title: 'GBIF Local Occurrences', icon: 'Bug' },
  { name: 'OsmReverseGeocode', api: '/api/osm-reverse-geocode', title: 'Reverse Geocoding', icon: 'MapPin' },
  { name: 'ClientIpGeolocation', api: '/api/client-ip-geolocation', title: 'Client IP Geolocation', icon: 'Globe' },
  { name: 'LocalPublicHolidays', api: '/api/local-public-holidays', title: 'Local Public Holidays', icon: 'CalendarDays' },
  { name: 'RegionalCountrySovereign', api: '/api/regional-country-sovereign', title: 'Regional Country Data', icon: 'Flag' },
  { name: 'GbifSpeciesSuggest', api: '/api/gbif-species-suggest', title: 'GBIF Species Suggest', icon: 'Leaf' },
];

const template = (name, api, title, icon) => `import React, { useState, useEffect } from "react";
import { ${icon}, AlertCircle, MapPin as MapPinIcon, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export default function ${name}() {
  const { t } = useTranslation();
  const { user } = useAuth();
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
        (err) => {
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
        if ("${api}".includes("health") || "${api}".includes("ip-geolocation")) {
          response = await fetch("${api}");
        } else {
          response = await fetch("${api}", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }),
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
          <${icon} className="w-6 h-6 text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t("sidebar.${name}") || "${title}"}</h1>
          <p className="text-sm font-medium text-slate-500">Live API Endpoint: ${api}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
          <MapPinIcon className="w-5 h-5 text-slate-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-800">Current Coordinates</h3>
          <p className="text-xs font-medium text-slate-500">Latitude: {coords.lat.toFixed(4)}, Longitude: {coords.lng.toFixed(4)}</p>
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
`;

pagesToCreate.forEach(page => {
  fs.writeFileSync(path.join(__dirname, 'src', 'pages', page.name + '.tsx'), template(page.name, page.api, page.title, page.icon));
});

console.log("Created pages:", pagesToCreate.map(p => p.name).join(', '));
