import React, { useEffect } from "react";
import { useMap, Map as GMPMap, AdvancedMarker, Pin, APIProvider } from "@vis.gl/react-google-maps";

interface StaticFieldMapProps {
  lat: number;
  lng: number;
  height?: string;
  zoom?: number;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function StaticMapComponent({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setCenter({ lat, lng });
      if (zoom !== undefined) {
        map.setZoom(zoom);
      }
    }
  }, [lat, lng, map, zoom]);

  return (
    <GMPMap
      defaultZoom={zoom ?? 14}
      defaultCenter={{ lat, lng }}
      mapId="STATIC_FIELD_MAP"
      gestureHandling={"cooperative"}
      disableDefaultUI={true}
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
    >
      <AdvancedMarker position={{ lat, lng }}>
        <Pin background="#10B981" glyphColor="#fff" borderColor="#047857" />
      </AdvancedMarker>
    </GMPMap>
  );
}

export default function StaticFieldMap({ lat, lng, height = "220px", zoom = 14 }: StaticFieldMapProps) {
  if (!hasValidKey) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-slate-100 rounded-3xl border border-slate-200"
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-sm font-medium text-slate-500 mb-2">Map unavailable (No API Key)</p>
          <div className="text-xs text-slate-400">Add GOOGLE_MAPS_PLATFORM_KEY in settings to render.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-3xl overflow-hidden border border-slate-200 shadow-xs" style={{ height }}>
      <APIProvider apiKey={API_KEY} version="weekly">
        <StaticMapComponent lat={lat} lng={lng} zoom={zoom} />
      </APIProvider>
    </div>
  );
}
