import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LOCATION_STORAGE_KEY,
  LocationContext,
  ToolLocation,
  locationParams,
  parseLocation,
} from "./locationContextValue";

function readStored(): ToolLocation | null {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ToolLocation>;
    return parseLocation(
      String(parsed.lat ?? ""),
      String(parsed.lng ?? ""),
      parsed.label ?? "",
    );
  } catch {
    return null;
  }
}

/**
 * One location for the whole app, kept in the URL so that a tool plus its
 * location is a single shareable link, and so switching tools does not make
 * you re-enter where you are. The URL wins; localStorage only carries the
 * last choice into a fresh visit.
 */
export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");
  const placeParam = searchParams.get("place");
  const fromUrl = useMemo(
    () => parseLocation(latParam, lngParam, placeParam),
    [latParam, lngParam, placeParam],
  );
  const [fallback, setFallback] = useState<ToolLocation | null>(() => readStored());

  const location = fromUrl ?? fallback;

  // Serialised first so the effect depends on a primitive, not a fresh object
  // identity on every render.
  const urlJson = fromUrl ? JSON.stringify(fromUrl) : null;
  useEffect(() => {
    if (!urlJson) return;
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, urlJson);
    } catch {
      // Private browsing or blocked storage: the URL still carries it.
    }
  }, [urlJson]);

  const setLocation = useCallback(
    (next: ToolLocation) => {
      setFallback(next);
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(locationParams(next))) {
        params.set(key, value);
      }
      if (!next.label) params.delete("place");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearLocation = useCallback(() => {
    setFallback(null);
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
    const params = new URLSearchParams(searchParams);
    for (const key of ["lat", "lng", "place"]) params.delete(key);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const value = useMemo(
    () => ({ location, setLocation, clearLocation }),
    [location, setLocation, clearLocation],
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
};
