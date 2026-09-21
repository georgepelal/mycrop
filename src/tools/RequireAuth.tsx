import React from "react";
import { Link } from "react-router-dom";
import { LogIn, UserCircle2 } from "lucide-react";
import { useAuth } from "../contexts/useAuth";

/**
 * Wraps the parts of the app that genuinely need an account: saved fields and
 * anything built on them. Everything else -- the catalog and every tool that
 * works from a location -- is reachable without signing in, so a shared link
 * lands on the tool rather than on a login wall.
 */
export default function RequireAuth({
  children,
  what = "This view",
}: {
  children: React.ReactNode;
  what?: string;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">Checking your session…</div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <UserCircle2 className="h-10 w-10 text-slate-300 dark:text-slate-600" />
        <h2 className="text-sm font-display font-black text-slate-900 dark:text-slate-100">
          Sign in to use saved fields
        </h2>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {what} works from field boundaries you have saved, so it needs an
          account. Every tool that works from a location does not — browse those
          without signing in.
        </p>
        <div className="mt-2 flex gap-2">
          <Link
            to="/auth"
            className="flex items-center gap-1.5 rounded-lg bg-brand-green px-4 py-2 text-xs font-bold text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign in
          </Link>
          <Link
            to="/tools"
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
          >
            Browse all tools
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
