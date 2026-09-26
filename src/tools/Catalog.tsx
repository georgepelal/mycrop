import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, MapPin, Search, X } from "lucide-react";
import LocationSearch from "../components/LocationSearch";
import { CATEGORIES, CategoryId, ToolMeta, TOOLS, searchTools } from "./registry";
import { toolHref } from "./locationContextValue";
import { useToolLocation } from "./useToolLocation";

function ToolCard({ tool }: { tool: ToolMeta }) {
  const { location } = useToolLocation();
  return (
    <Link
      to={toolHref(tool.slug, location)}
      className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-green hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-display font-black leading-tight text-slate-900 group-hover:text-brand-green dark:text-slate-100 dark:group-hover:text-emerald-400">
          {tool.title}
        </h3>
        {tool.notice && (
          <AlertTriangle
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
            aria-label="Not backed by a live source"
          />
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
        {tool.blurb}
      </p>

      {/* The sources are the point: a tool that names one is a tool you can check. */}
      <div className="mt-auto flex flex-wrap gap-1 pt-1">
        {tool.sources.length > 0 ? (
          tool.sources.map((source) => (
            <span
              key={source.name}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            >
              {source.name}
            </span>
          ))
        ) : (
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            No live source
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Catalog() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all");
  const { location, setLocation, clearLocation } = useToolLocation();

  const matches = useMemo(() => {
    const found = searchTools(query);
    return activeCategory === "all"
      ? found
      : found.filter((tool) => tool.category === activeCategory);
  }, [query, activeCategory]);

  const countsByCategory = useMemo(() => {
    const searched = searchTools(query);
    const counts = new Map<CategoryId, number>();
    for (const tool of searched) {
      counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
    }
    return counts;
  }, [query]);

  const shown = activeCategory === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.id === activeCategory);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-display font-black text-slate-900 dark:text-slate-100">
          {TOOLS.length} tools
        </h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Pick a location, then pick a tool. Each one fetches live data for that
          point from a named public source.
        </p>
      </header>

      {/* One location for every tool, carried in the URL so a link reproduces it. */}
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Location
          </label>
          {location && (
            <button
              type="button"
              onClick={clearLocation}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
        <LocationSearch
          onLocationSelect={(lat, lng, label) => setLocation({ lat, lng, label })}
          initialLocationName={location?.label ?? ""}
          placeholder="Search for a place, or a town near your field…"
        />
        {location ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <MapPin className="h-3 w-3 text-brand-green" />
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {location.label || "Selected point"}
            </span>
            <span className="tabular-nums">
              {location.lat.toFixed(3)}, {location.lng.toFixed(3)}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-slate-400">
            No location chosen yet. Tools that need one will ask.
          </p>
        )}
      </section>

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools — try soil, frost, NASA, bees"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-green focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors ${
              activeCategory === "all"
                ? "bg-brand-green text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            All {searchTools(query).length}
          </button>
          {CATEGORIES.map((category) => {
            const count = countsByCategory.get(category.id) ?? 0;
            return (
              <button
                key={category.id}
                type="button"
                disabled={count === 0}
                onClick={() => setActiveCategory(category.id)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activeCategory === category.id
                    ? "bg-brand-green text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {category.label} {count}
              </button>
            );
          })}
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 py-16 text-center text-xs text-slate-400 dark:border-slate-700">
          Nothing matches “{query}”.
        </p>
      ) : (
        shown.map((category) => {
          const inCategory = matches.filter((tool) => tool.category === category.id);
          if (inCategory.length === 0) return null;
          return (
            <section key={category.id} className="mb-7">
              <div className="mb-2.5">
                <h2 className="text-xs font-display font-black uppercase tracking-wide text-slate-700 dark:text-slate-300">
                  {category.label}
                </h2>
                <p className="text-[10px] text-slate-400">{category.blurb}</p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {inCategory.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
