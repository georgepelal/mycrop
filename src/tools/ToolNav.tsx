import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CATEGORIES, toolsInCategory } from "./registry";
import { toolHref } from "./locationContextValue";
import { useToolLocation } from "./useToolLocation";

/**
 * The sidebar, derived from the registry. Replaces the hand-maintained tree
 * that filed 60 tools three levels deep under Settings; adding a tool to the
 * registry now puts it in the nav, the catalog and the router at once.
 */
export default function ToolNav({ onSelectTool }: { onSelectTool: () => void }) {
  const { pathname } = useLocation();
  const { location } = useToolLocation();
  const [open, setOpen] = useState<string[]>(() => {
    // Start with whichever category contains the tool you are looking at.
    const current = CATEGORIES.find((category) =>
      toolsInCategory(category.id).some((tool) => pathname === `/tools/${tool.slug}`),
    );
    return current ? [current.id] : [];
  });

  const toggle = (id: string) =>
    setOpen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="space-y-0.5">
      {CATEGORIES.map((category) => {
        const tools = toolsInCategory(category.id);
        const holdsCurrent = tools.some((tool) => pathname === `/tools/${tool.slug}`);
        const isOpen = open.includes(category.id) || holdsCurrent;

        return (
          <div key={category.id}>
            <button
              type="button"
              onClick={() => toggle(category.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2 text-left text-[11px] font-bold transition-colors ${
                holdsCurrent
                  ? "text-brand-green dark:text-emerald-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40"
              }`}
              aria-expanded={isOpen}
            >
              <span className="truncate">{category.label}</span>
              <span className="flex items-center gap-1.5 shrink-0">
                <span className="text-[9px] font-black tabular-nums text-slate-400">
                  {tools.length}
                </span>
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </span>
            </button>

            {isOpen && (
              <div className="ml-4 space-y-0.5 border-l border-slate-150 pl-3 pt-0.5 dark:border-slate-800">
                {tools.map((tool) => (
                  <NavLink
                    key={tool.slug}
                    to={toolHref(tool.slug, location)}
                    onClick={onSelectTool}
                    className={() =>
                      // Compared on pathname alone: the same tool at a
                      // different location is still the active tool.
                      `block rounded-md px-2 py-1 text-[10px] transition-colors ${
                        pathname === `/tools/${tool.slug}`
                          ? "bg-emerald-50 font-bold text-brand-green dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/20"
                      }`
                    }
                  >
                    {tool.title}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
