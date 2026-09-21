import type { NextFunction, Request, Response } from "express";

/**
 * Where a response's numbers came from.
 *
 * AGENTS.md forbids presenting invented figures as data. Rather than trusting
 * 62 handlers to remember that, every JSON response passes through here and
 * carries its own provenance, so a value on screen can always be traced to a
 * named source or is explicitly marked as not measured.
 */
export type ProvenanceKind =
  /** Observations from the named source. */
  | "measured"
  /** Computed from measured inputs by a documented method. */
  | "modeled"
  /** A static reference table, not a reading of anywhere. */
  | "reference"
  /** Derived without a real source. Never to be shown as a measurement. */
  | "estimate"
  /** The source could not be reached; the response carries no figures. */
  | "unavailable";

export interface Provenance {
  source: string;
  url: string | null;
  fetchedAt: string;
  kind: ProvenanceKind;
  /** For "modeled" and "estimate": what the figures were derived from. */
  derivedFrom?: string;
}

interface RouteSource {
  source: string;
  url: string | null;
  kind: ProvenanceKind;
  derivedFrom?: string;
}

/**
 * One entry per endpoint. A route missing from here answers with
 * kind "unavailable" and an undeclared source, which is deliberate: a new
 * endpoint is untrusted until someone says where its data comes from.
 */
export const ROUTE_SOURCES: Record<string, RouteSource> = {};

export function declareSources(entries: Record<string, RouteSource>) {
  Object.assign(ROUTE_SOURCES, entries);
}

const UNDECLARED: RouteSource = {
  source: "undeclared",
  url: null,
  kind: "unavailable",
};

/**
 * Attaches provenance to every /api JSON response.
 *
 * An error status always reports "unavailable" whatever the route declares,
 * so a failed upstream can never be dressed up as a measurement.
 */
export function provenance(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api/")) return next();

  const declared = ROUTE_SOURCES[req.path] ?? UNDECLARED;
  const original = res.json.bind(res);

  res.json = (body: unknown) => {
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return original(body as never);
    }
    const failed = res.statusCode >= 400;
    const record = body as Record<string, unknown>;
    const kind: ProvenanceKind = failed
      ? "unavailable"
      : ((record.kind as ProvenanceKind) ?? declared.kind);

    return original({
      ...record,
      provenance: {
        source: declared.source,
        url: declared.url,
        fetchedAt: new Date().toISOString(),
        kind,
        ...(declared.derivedFrom && !failed
          ? { derivedFrom: declared.derivedFrom }
          : {}),
      } satisfies Provenance,
    } as never);
  };

  next();
}
