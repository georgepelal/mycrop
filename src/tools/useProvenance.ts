import { useSyncExternalStore } from "react";
import { getProvenance, subscribe } from "./provenanceStore";

export function useProvenance() {
  return useSyncExternalStore(subscribe, getProvenance, () => null);
}
