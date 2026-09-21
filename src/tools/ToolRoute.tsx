import React, { Suspense, lazy, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Parcel } from "../types";
import { TOOLS_BY_SLUG, ToolComponent, ToolMeta, ToolProps } from "./registry";
import { useToolLocation } from "./useToolLocation";
import RequireAuth from "./RequireAuth";
import ToolErrorBoundary from "./ToolErrorBoundary";
import ProvenanceBadge from "./ProvenanceBadge";
import { clearProvenance, installProvenanceCapture } from "./provenanceStore";
import { useProvenance } from "./useProvenance";

/**
 * React.lazy must be called once per component, not once per render, or the
 * tool remounts on every parent update. One cache keyed by slug.
 */
const lazyCache = new Map<string, ToolComponent>();

function componentFor(tool: ToolMeta): ToolComponent {
  const cached = lazyCache.get(tool.slug);
  if (cached) return cached;
  const component = lazy(tool.load);
  lazyCache.set(tool.slug, component);
  return component;
}

export interface ToolRouteShellContext {
  parcels: Parcel[];
  activeParcelId: string | null;
  onSelectParcel: (id: string) => void;
}

type ToolRouteContext = ToolRouteShellContext & {
  location: ToolProps["location"];
  setLocation: ToolProps["setLocation"];
};

/**
 * Every page now takes the same contract: the shared location, plus the saved
 * field only where the tool is built on one. A handful of pages (dictionaries,
 * lookups) need nothing at all.
 */
function propsFor(tool: ToolMeta, ctx: ToolRouteContext): Partial<ToolProps> {
  if (tool.takesProps === "none") return {};
  return {
    location: ctx.location,
    setLocation: ctx.setLocation,
    ...(tool.needs === "field"
      ? {
          parcels: ctx.parcels,
          activeParcelId: ctx.activeParcelId,
          onSelectParcel: ctx.onSelectParcel,
        }
      : {}),
  };
}

function ToolLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-xs font-medium">Loading tool…</span>
    </div>
  );
}

/**
 * A tool whose data is not backed by a live source says so above its own
 * output, rather than leaving the caveat in a footnote nobody reads.
 */
function ToolNotice({ notice }: { notice: string }) {
  return (
    <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <p>{notice}</p>
    </div>
  );
}

export default function ToolRoute(shell: ToolRouteShellContext) {
  const { slug } = useParams<{ slug: string }>();
  const { location, setLocation } = useToolLocation();
  const ctx: ToolRouteContext = { ...shell, location, setLocation };

  installProvenanceCapture();
  const dataProvenance = useProvenance();

  // A new tool must not inherit the last one's source line.
  useEffect(() => clearProvenance, [slug]);
  const tool = slug ? TOOLS_BY_SLUG[slug] : undefined;

  // An unknown slug is a dead link: send them to the catalog to find the tool.
  if (!tool) return <Navigate to="/tools" replace />;

  const Component = componentFor(tool);

  const body = (
    <ToolErrorBoundary
      toolName={tool.title}
      resetKey={`${tool.slug}:${location?.lat ?? ""},${location?.lng ?? ""}`}
    >
      <Suspense fallback={<ToolLoading />}>
        <Component {...(propsFor(tool, ctx) as ToolProps)} />
      </Suspense>
    </ToolErrorBoundary>
  );

  return (
    <>
      {tool.notice && <ToolNotice notice={tool.notice} />}
      {dataProvenance && (
        <div className="mx-4 mt-4">
          <ProvenanceBadge provenance={dataProvenance} />
        </div>
      )}
      {/* Only the field-backed tools need an account; the rest run on a location. */}
      {tool.needs === "field" ? (
        <RequireAuth what={tool.title}>{body}</RequireAuth>
      ) : (
        body
      )}
    </>
  );
}
