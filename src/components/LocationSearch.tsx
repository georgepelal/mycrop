import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  placeholder?: string;
  initialLocationName?: string;
}

export default function LocationSearch({ onLocationSelect, placeholder = "Search for a location...", initialLocationName = "" }: LocationSearchProps) {
  const [query, setQuery] = useState(initialLocationName);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const searchGeocode = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(debouncedQuery)}&count=5&language=en&format=json`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to geocode", err);
      } finally {
        setIsSearching(false);
      }
    };

    searchGeocode();
  }, [debouncedQuery]);

  const handleSelect = (loc: Location) => {
    const name = `${loc.name}, ${loc.admin1 ? loc.admin1 + ', ' : ''}${loc.country}`;
    setQuery(name);
    setIsOpen(false);
    onLocationSelect(loc.latitude, loc.longitude, name);
  };

  return (
    <div className="relative w-full max-w-md" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green text-sm"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-60">
          {results.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc)}
              className="flex items-start text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
            >
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 mr-3 shrink-0" />
              <div>
                <div className="text-sm font-medium text-slate-700">{loc.name}</div>
                <div className="text-xs text-slate-500">
                  {loc.admin1 && `${loc.admin1}, `}{loc.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
