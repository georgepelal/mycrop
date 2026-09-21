import { createContext } from "react";

/** A place a tool can fetch data for. */
export interface ToolLocation {
  lat: number;
  lng: number;
  /** What to call it in the UI. May be empty if only coordinates are known. */
  label: string;
}

export interface LocationContextType {
  /** Null until the visitor picks somewhere. No default city stands in for one. */
  location: ToolLocation | null;
  setLocation: (location: ToolLocation) => void;
  clearLocation: () => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(
  undefined,
);

export const LOCATION_STORAGE_KEY = "mycrop_last_location";

/** Rounded to ~1 m; keeps shared URLs short and cache keys stable. */
export function locationParams(location: ToolLocation): Record<string, string> {
  return {
    lat: location.lat.toFixed(5),
    lng: location.lng.toFixed(5),
    ...(location.label ? { place: location.label } : {}),
  };
}

/**
 * Builds a tool URL that carries the location, so the link reproduces what the
 * sender was looking at rather than just which tool they had open.
 */
export function toolHref(slug: string, location: ToolLocation | null): string {
  if (!location) return `/tools/${slug}`;
  return `/tools/${slug}?${new URLSearchParams(locationParams(location))}`;
}

export function parseLocation(
  lat: string | null,
  lng: string | null,
  place: string | null,
): ToolLocation | null {
  if (lat === null || lng === null) return null;
  if (lat.trim() === "" || lng.trim() === "") return null;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
  if (parsedLat < -90 || parsedLat > 90) return null;
  if (parsedLng < -180 || parsedLng > 180) return null;
  return { lat: parsedLat, lng: parsedLng, label: place ?? "" };
}
