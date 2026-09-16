import React, { useEffect, useMemo, useRef, useState } from "react";
import { Parcel } from "../types";
import { useSettings } from "../contexts/useSettings";

interface CustomFieldVisualMapProps {
  parcel: Parcel;
  weatherCode?: number;
  windSpeed?: number;
  windDirection?: number;
}

export default function CustomFieldVisualMap({ 
  parcel 
}: CustomFieldVisualMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonLayerRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const { theme } = useSettings();
  const isDarkMode = theme === "dark";

  const lat = parcel?.latitude || parcel?.lat || 35.0;
  const lng = parcel?.longitude || parcel?.lng || 35.0;
  const boundaries = useMemo(() => parcel?.boundaries || [], [parcel?.boundaries]);


  // 1. Load Leaflet script & CSS once
  useEffect(() => {
    if (!document.getElementById("leaflet-css-link")) {
      const link = document.createElement("link");
      link.id = "leaflet-css-link";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Get crop boundaries colors (use the signature website brand green)
  const brandGreenColors = React.useMemo(() => {
    return {
      stroke: isDarkMode ? "#34D399" : "#059669", // emerald-400 in dark, emerald-600 in light
      fill: "#10B981", // emerald-500
    };
  }, [isDarkMode]);

  // 2. Map Initialization with strict non-interactive options and Zoom Out
  useEffect(() => {
    if (!isLeafletLoaded || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Unmovable, Unzoomable, Locked Minimalistic Map
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 10, // Zoomed out slightly more for better context
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Apply Minimalist CartoDB Style (Auto dark/light adaptive)
    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    const tiles = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tiles;

    // Add Field Boundary outline using signature emerald green
    if (boundaries.length >= 3) {
      const latLngs = boundaries.map(b => [b.lat, b.lng]);
      const polygon = L.polygon(latLngs, {
        color: brandGreenColors.stroke,
        weight: 3,
        fillColor: brandGreenColors.fill,
        fillOpacity: 0.35,
        dashArray: "2, 4"
      }).addTo(map);
      polygonLayerRef.current = polygon;
    } else {
      const circle = L.circle([lat, lng], {
        color: brandGreenColors.stroke,
        fillColor: brandGreenColors.fill,
        fillOpacity: 0.3,
        radius: 500,
        weight: 2,
        dashArray: "2, 4"
      }).addTo(map);
      polygonLayerRef.current = circle;
    }

    // Add clean center point marker
    const markerIcon = L.divIcon({
      className: "custom-point-icon",
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <div class="absolute w-5 h-5 rounded-full bg-emerald-500/50 animate-ping"></div>
          <div class="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-md"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
    markerLayerRef.current = marker;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLeafletLoaded, lat, lng, isDarkMode, boundaries, brandGreenColors]);

  return (
    <div className="w-full h-[180px] bg-slate-50 dark:bg-slate-900 rounded-2xl relative overflow-hidden border border-emerald-500/20 dark:border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.06)] dark:shadow-[0_0_15px_rgba(16,185,129,0.08)]">
      {!isLeafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}
