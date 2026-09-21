import { useEffect, useRef } from "react";
import { ToolLocation } from "./locationContextValue";

/**
 * Runs a tool's own fetch whenever the shared location changes.
 *
 * The callback is held in a ref, so a page can pass a plain function defined in
 * its body without wrapping it in useCallback and without the effect re-firing
 * on every render. The effect depends only on the coordinates, so re-rendering
 * for unrelated state does not refetch.
 */
export function useFetchOnLocation(
  location: ToolLocation | null,
  fetchForLocation: (lat: number, lng: number, label: string) => void,
) {
  const latest = useRef(fetchForLocation);
  latest.current = fetchForLocation;

  const lat = location?.lat;
  const lng = location?.lng;
  const label = location?.label;

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    latest.current(lat, lng, label ?? "");
  }, [lat, lng, label]);
}
