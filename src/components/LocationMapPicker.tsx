import React, { useState, useEffect, useRef } from "react";
import { useMap, Map as GMPMap, AdvancedMarker, Pin, APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Search } from "lucide-react";

interface LocationMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
  showInstruction?: boolean;
}

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function AutocompleteSearch({ onPlaceSelect }: { onPlaceSelect: (lat: number, lng: number) => void }) {
  const [placeAutocomplete, setPlaceAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const placesContext = useMapsLibrary("places");

  useEffect(() => {
    if (!placesContext || !inputRef.current) return;

    const options = {
      fields: ["geometry", "name", "formatted_address"],
    };

    setPlaceAutocomplete(new placesContext.Autocomplete(inputRef.current, options));
  }, [placesContext]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener("place_changed", () => {
      const place = placeAutocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        onPlaceSelect(place.geometry.location.lat(), place.geometry.location.lng());
      }
    });
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className="absolute top-3 right-3 left-[160px] md:left-auto md:w-64 z-10 pointer-events-auto">
      <div className="relative shadow-sm rounded-xl">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-white backdrop-blur-md border outline-none border-slate-200 text-slate-900 text-xs rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block pl-9 pr-3 py-2"
          placeholder="Search location..."
        />
      </div>
    </div>
  );
}

function MapComponent({ lat, lng, onChange, zoom }: Omit<LocationMapPickerProps, "height">) {
  const map = useMap();
  const [position, setPosition] = useState({ lat, lng });

  useEffect(() => {
    setPosition({ lat, lng });
    if (map) {
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);

  return (
    <>
      <GMPMap
        defaultZoom={zoom ?? 11}
        defaultCenter={{ lat, lng }}
        mapId="LOCATION_PICKER_MAP"
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onClick={(e) => {
          if (e.detail.latLng) {
            const lat = e.detail.latLng.lat;
            const lng = e.detail.latLng.lng;
            setPosition({ lat, lng });
            onChange(lat, lng);
          }
        }}
      >
        <AdvancedMarker position={position}>
          <Pin background="#10B981" glyphColor="#fff" borderColor="#047857" />
        </AdvancedMarker>
      </GMPMap>
      <AutocompleteSearch onPlaceSelect={(newLat, newLng) => {
        setPosition({ lat: newLat, lng: newLng });
        if (map) {
            map.panTo({ lat: newLat, lng: newLng });
            map.setZoom(zoom ?? 11);
        }
        onChange(newLat, newLng);
      }} />
    </>
  );
}

export default function LocationMapPicker({ lat, lng, onChange, height = "200px", zoom, showInstruction = true }: LocationMapPickerProps) {
  if (!hasValidKey) {
    return (
      <div 
        className="w-full flex items-center justify-center bg-slate-100 rounded-3xl border border-slate-200"
        style={{ height }}
      >
        <div className="text-center p-4">
          <p className="text-sm font-medium text-slate-500 mb-2">Map unavailable (No API Key)</p>
          <div className="text-xs text-slate-400">Add GOOGLE_MAPS_PLATFORM_KEY in settings to enable map selection.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <APIProvider apiKey={API_KEY} version="weekly" libraries={["places"]}>
        <MapComponent lat={lat} lng={lng} onChange={onChange} zoom={zoom} />
      </APIProvider>
      {showInstruction && (
        <div className="absolute top-3 left-3 pointer-events-none flex">
           <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-700 shadow-sm border border-slate-200 z-10 pointer-events-auto">
             Click map to update
           </div>
        </div>
      )}
    </div>
  );
}
