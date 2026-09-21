import type { Provenance } from "./ProvenanceBadge";

/**
 * Holds the provenance of the most recent /api response.
 *
 * Captured at the fetch boundary rather than threaded through 60 pages: every
 * page already calls fetch, and every response now carries provenance, so one
 * interceptor puts the source of what is on screen into the tool header
 * without each page having to remember to render it.
 */
let current: Provenance | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getProvenance() {
  return current;
}

/** Called when the visitor moves to another tool, so a stale source is not shown. */
export function clearProvenance() {
  if (current === null) return;
  current = null;
  emit();
}

let installed = false;

export function installProvenanceCapture() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await original(input, init);
    const url = typeof input === "string" ? input : (input as Request).url ?? String(input);
    if (!url.includes("/api/")) return response;

    // Read from a clone so the caller still gets an unconsumed body.
    response
      .clone()
      .json()
      .then((body) => {
        const found = (body as { provenance?: Provenance })?.provenance;
        if (found) {
          current = found;
          emit();
        }
      })
      .catch(() => {
        // Not JSON, or already gone: nothing to report.
      });

    return response;
  };
}
