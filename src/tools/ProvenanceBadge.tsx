import React from "react";
import { AlertTriangle, BookOpen, CircleSlash, Sigma, Signal } from "lucide-react";

export interface Provenance {
  source: string;
  url: string | null;
  fetchedAt: string;
  kind: "measured" | "modeled" | "reference" | "estimate" | "unavailable";
  derivedFrom?: string;
}

const STYLES = {
  measured: {
    Icon: Signal,
    label: "Measured",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  modeled: {
    Icon: Sigma,
    label: "Modelled",
    className:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300",
  },
  reference: {
    Icon: BookOpen,
    label: "Reference table",
    className:
      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300",
  },
  estimate: {
    Icon: AlertTriangle,
    label: "Estimate, not measured",
    className:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  },
  unavailable: {
    Icon: CircleSlash,
    label: "Source unavailable",
    className:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
  },
} as const;

/**
 * Shows where the figures on screen came from, at the top of the tool rather
 * than in grey italics at the bottom. An estimate is labelled as one, so it
 * cannot be mistaken for a reading.
 */
export default function ProvenanceBadge({ provenance }: { provenance?: Provenance }) {
  if (!provenance) return null;
  const style = STYLES[provenance.kind] ?? STYLES.unavailable;
  const { Icon } = style;
  const fetchedAt = new Date(provenance.fetchedAt);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border px-3 py-1.5 text-[10px] font-medium ${style.className}`}
    >
      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
        <Icon className="h-3 w-3" />
        {style.label}
      </span>
      <span className="opacity-80">
        {provenance.url ? (
          <a
            href={provenance.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {provenance.source}
          </a>
        ) : (
          provenance.source
        )}
      </span>
      {provenance.derivedFrom && (
        <span className="opacity-70">· from {provenance.derivedFrom}</span>
      )}
      {!Number.isNaN(fetchedAt.valueOf()) && (
        <span className="opacity-60">
          · fetched {fetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}
