import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

/**
 * What a location-based tool shows before anywhere has been chosen. It replaces
 * the old behaviour of quietly defaulting to New York and presenting that data
 * as if the visitor had asked for it.
 */
export default function NeedsLocation({ what }: { what: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2.5 px-6 py-20 text-center">
      <MapPin className="h-8 w-8 text-slate-300 dark:text-slate-600" />
      <h2 className="text-sm font-display font-black text-slate-900 dark:text-slate-100">
        Choose a location
      </h2>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        {what} needs somewhere to report on. Search above, or pick a location on
        the catalog and it will follow you between tools.
      </p>
      <Link
        to="/tools"
        className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
      >
        Back to all tools
      </Link>
    </div>
  );
}
