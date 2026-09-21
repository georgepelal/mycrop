import React, { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import { SettingsProvider } from "./contexts/SettingsContext";
import { Parcel } from "./types";
import { getParcelsForUser, createParcelForUser } from "./lib/db";
import { TOOLS } from "./tools/registry";
import ToolRoute from "./tools/ToolRoute";
import { LocationProvider } from "./tools/LocationProvider";
import RequireAuth from "./tools/RequireAuth";
import ToolNav from "./tools/ToolNav";
const Catalog = lazy(() => import("./tools/Catalog"));

// Route-level code splitting: a view's bundle downloads when it is opened.
// AuthPage stays eager because it is the gate every visit passes through.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const Parcels = lazy(() => import("./pages/Parcels"));
const ParcelForm = lazy(() => import("./pages/ParcelForm"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AccountSettingsPage = lazy(() => import("./pages/AccountSettingsPage"));
const Field3DView = lazy(() => import("./pages/Field3DView"));
const DiagnosticAnalytics = lazy(() => import("./pages/DiagnosticAnalytics"));
import { useTranslation } from "react-i18next";

// Pages
import AuthPage from "./pages/AuthPage";
import CompanyLogo from "./components/CompanyLogo";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ThemeToggle from "./components/ThemeToggle";



// Icons
import {
  LayoutDashboard,
  Map,
  Compass,
  LogOut,
  LogIn,
  Menu,
  X,
  Activity,
  Bot,
} from "lucide-react";


function DashboardShell() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Local state for parcels
  const [parcels, setParcels] = useState<Parcel[]>(() => {
    const cached = localStorage.getItem("mycrop_parcels");
    return cached ? JSON.parse(cached) : [];
  });

  // Synchronize parcels with Firestore when logged in, or use localStorage as fallback
  useEffect(() => {
    let active = true;
    async function syncParcels() {
      if (user && user.uid) {
        try {
          const dbParcels = await getParcelsForUser(user.uid);
          if (active) {
            // A new account starts empty. Fields are created by the user, never seeded.
            setParcels(dbParcels ?? []);
          }
        } catch (err) {
          console.error("Failed to sync parcels with Firestore:", err);
        }
      } else {
        const cached = localStorage.getItem("mycrop_parcels");
        if (active) {
          setParcels(cached ? JSON.parse(cached) : []);
        }
      }
    }
    syncParcels();
    return () => {
      active = false;
    };
  }, [user]);

  const [activeParcelId, setActiveParcelId] = useState<string | null>(null);


  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save parcels to localStorage
  useEffect(() => {
    localStorage.setItem("mycrop_parcels", JSON.stringify(parcels));
  }, [parcels]);


  const handleAddParcel = async (newParcel: any) => {
    if (!user?.uid) {
      throw new Error("Sign in to save a field.");
    }
    const defaultUid = user.uid;
    const fresh: Parcel = {
      ...newParcel,
      id: "p_" + Date.now(),
      createdAt: new Date().toISOString().substring(0, 10),
      lastUpdated: new Date().toISOString().substring(0, 10),
      userId: defaultUid,
      ownerId: defaultUid,
      farmSize: Number(newParcel.farmSize || newParcel.area),
      latitude: Number(newParcel.latitude || newParcel.lat),
      longitude: Number(newParcel.longitude || newParcel.lng),
      location:
        newParcel.location ||
        `${newParcel.lat?.toFixed(4)}, ${newParcel.lng?.toFixed(4)}`,
      ndviValue: Number(newParcel.ndviValue ?? newParcel.ndvi),
      ndwiValue: Number(newParcel.ndwiValue ?? 0.45),
      soilPH: Number(newParcel.soilPH ?? 6.5),
      nitrogen: newParcel.nitrogen ?? "Optimal",
      plantingMonth: newParcel.plantingMonth ?? "May",
      costPerHectare: Number(newParcel.costPerHectare ?? 900),
      marketPricePerTon: Number(newParcel.marketPricePerTon ?? 210),
      customImage: newParcel.customImage ?? null,
    };

    if (user && user.uid) {
      try {
        await createParcelForUser(user.uid, fresh);
      } catch (err) {
        console.error("Error creating parcel in Firestore:", err);
      }
    }

    setParcels([fresh, ...parcels]);
    navigate("/parcels");
  };

  const handleSelectParcelForOverview = (parcel: Parcel) => {
    setActiveParcelId(parcel.id);
    navigate("/field-overview");
  };


  return (
    <div
      className="min-h-screen md:h-screen md:overflow-hidden bg-gray-50 dark:bg-slate-950 flex flex-col md:flex-row relative text-slate-800 dark:text-slate-100 transition-colors duration-300"
      id="mycrop-dashboard-shell"
    >
      {/* Sidebar Navigation (Horizontal on mobile, vertical on desktop) */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-gray-150 dark:border-slate-800 flex flex-col shrink-0 z-30 print:hidden transition-colors duration-300 md:h-screen md:overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <CompanyLogo />

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 hover:bg-slate-50 border border-slate-150 rounded-xl"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation links block */}
        <nav
          className={`p-4 space-y-1.5 flex-1 flex-col ${mobileMenuOpen ? "flex" : "hidden md:flex"}`}
        >
          <NavLink
            to="/tools"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                isActive
                  ? "bg-brand-green text-white shadow-md shadow-emerald-500/10"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`
            }
          >
            <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
            <span>All Tools</span>
          </NavLink>

          <button
            onClick={() => {
              navigate("/parcels");
              setActiveParcelId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              location.pathname === "/parcels" || location.pathname === "/parcel-form"
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Map className="w-4.5 h-4.5 shrink-0" />
            <span>My Fields</span>
          </button>

          {activeParcelId && (
            <div className="pl-6 space-y-1 pt-2 pb-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-2">
                Active Field
              </div>
              <NavLink
                to="/field-overview"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive ? "bg-emerald-50 text-brand-green" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Field Overview</span>
              </NavLink>
              <NavLink
                to="/field-3d"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive ? "bg-emerald-50 text-brand-green" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>3D Terrain</span>
              </NavLink>
              <NavLink
                to="/field-soil"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive ? "bg-emerald-50 text-brand-green" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Soil & Diagnostics</span>
              </NavLink>
              <NavLink
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive ? "bg-emerald-50 text-brand-green" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`
                }
              >
                <Bot className="w-4 h-4 shrink-0" />
                <span>{t("sidebar.aiChat")}</span>
              </NavLink>
            </div>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />

          <ToolNav onSelectTool={() => setMobileMenuOpen(false)} />
        </nav>

        <div className="mt-auto pt-2 pb-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between px-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Sidebar footer: the account card when signed in, an invitation when not. */}
        <div
          className={`p-4 border-t border-gray-100 bg-gray-50/50 flex-col space-y-2 select-none ${mobileMenuOpen ? "flex" : "hidden md:flex"}`}
        >
          {user ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-green-600 text-sm shadow-xs flex items-center justify-center font-bold text-white uppercase select-none">
                  {user.displayName ? Array.from(user.displayName)[0] : "🌱"}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                    {user.displayName || user.email || "Account"}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-none mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("sidebar.disconnect")}</span>
              </button>
            </>
          ) : (
            <>
              <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                Every tool works without an account. Sign in to save fields.
              </p>
              <NavLink
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </NavLink>
            </>
          )}
        </div>
      </aside>

      {/* Main viewport Container (Scrollable) */}
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-8"
        id="mycrop-main-viewport"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24 text-xs text-slate-400">
                Loading…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Navigate to="/tools" replace />} />
            <Route path="/tools" element={<Catalog />} />
            <Route path="/auth" element={user ? <Navigate to="/tools" replace /> : <AuthPage />} />
              <Route
                path="/parcels"
                element={
<RequireAuth what="Your field list">
  <Parcels
                    parcels={parcels}
                    onSelectParcel={handleSelectParcelForOverview}
                  />
</RequireAuth>
}
              />
              <Route
                path="/parcel-form"
                element={
<RequireAuth what="Drawing a field">
  <ParcelForm onAddParcel={handleAddParcel} />
</RequireAuth>
}
              />
              <Route
                path="/field-overview"
                element={
<RequireAuth what="The field dashboard">
  <Dashboard
                    parcels={parcels}
                    activeParcelId={activeParcelId || parcels[0]?.id || ""}
                  />
</RequireAuth>
}
              />
              <Route
                path="/field-3d"
                element={
<RequireAuth what="The 3D field view">
  <Field3DView parcels={parcels} initialSelectedParcelId={activeParcelId || undefined} />
</RequireAuth>
}
              />
              <Route
                path="/field-soil"
                element={
<RequireAuth what="Field diagnostics">
  <DiagnosticAnalytics
                    parcels={parcels}
                    activeParcelId={activeParcelId || parcels[0]?.id || ""}
                    onSelectParcel={(id) => setActiveParcelId(id)}
                  />
</RequireAuth>
}
              />
              <Route
                path="/chat"
                element={
<RequireAuth what="The AI agronomist">
  <Chat
                    parcels={parcels}
                    activeParcelId={activeParcelId || parcels[0]?.id || ""}
                    onSelectParcel={(id) => setActiveParcelId(id)}
                  />
</RequireAuth>
}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/account" element={
<RequireAuth what="Account settings">
  <AccountSettingsPage />
</RequireAuth>
} />

              {/* Every tool in the catalog: one lazy route, resolved against the registry. */}
              <Route
                path="/tools/:slug"
                element={
                  <ToolRoute
                    parcels={parcels}
                    activeParcelId={activeParcelId}
                    onSelectParcel={(id) => setActiveParcelId(id)}
                  />
                }
              />

              {/* Pre-refactor tool paths, kept as redirects so shared links keep working. */}
              {TOOLS.map((tool) => (
                <Route
                  key={tool.legacyPath}
                  path={tool.legacyPath}
                  element={<Navigate to={`/tools/${tool.slug}`} replace />}
                />
              ))}

              <Route path="*" element={<Navigate to="/tools" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <LocationProvider>
          <DashboardShell />
        </LocationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
