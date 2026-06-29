import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../contexts/SettingsContext";
import { 
  Settings, 
  Map, 
  Cpu, 
  Layers, 
  Compass, 
  FolderLock, 
  Grid, 
  MonitorPlay,
  Check,
  ToggleLeft,
  RefreshCw,
  CheckSquare,
  Square,
  Play,
  XCircle,
  ShieldCheck,
  Zap,
  Lock
} from "lucide-react";

interface ApiCategory {
  id: string;
  name: string;
  category: string;
  description: string;
  status: boolean;
  token: string;
  lastRefreshed: string;
}

const INITIAL_CATEGORIES: ApiCategory[] = [
  { id: "copernicus", name: "Copernicus Sentinel-2", category: "Space-Reflectance", description: "Vegetation index proxies, canopy density, and surface reflectance models.", status: true, token: "tok_cop_8f7b2a59e17f", lastRefreshed: "2026-06-20T06:12" },
  { id: "noaa", name: "NOAA Space Weather", category: "Space-Weather", description: "K-Index status alerts, solar flare flux thresholds, and magnetic storm monitors.", status: true, token: "tok_noaa_3e21ab9084d", lastRefreshed: "2026-06-20T06:12" },
  { id: "usgs", name: "USGS National Hydrology", category: "Hydrologic-Basins", description: "HUC-12 watershed divisions, drainage flow factors, and river runoffs.", status: true, token: "tok_usgs_9d8c63f112a", lastRefreshed: "2026-06-20T06:11" },
  { id: "openmeteo", name: "OpenMeteo Aero & PBL", category: "Boundary-Layer", description: "Planetary Boundary Layer height, thermodynamic wind vectors, and local altimeters.", status: true, token: "tok_om_1b2c4df558e2", lastRefreshed: "2026-06-20T06:10" },
  { id: "worldbank", name: "World Bank Forestry", category: "Forestry-Data", description: "Sub-optimal land boundaries and geographic tree foliage percentage registries.", status: true, token: "tok_wb_7e9a8b11110f", lastRefreshed: "2026-06-20T06:12" },
  { id: "fao", name: "FAO Nutrient Yield", category: "Plant-Nutrition", description: "Edible-weight macronutrients, phytochemistry cataloging, and crop calorie ratios.", status: true, token: "tok_fao_5c6d7e0099ab", lastRefreshed: "2026-06-20T06:08" },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const {
    copernicusFeed,
    setCopernicusFeed,
    moistureAlerts,
    setMoistureAlerts,
    metricScale,
    setMetricScale,
    highContrast,
    setHighContrast,
    tempUnit,
    setTempUnit,
    rainUnit,
    setRainUnit,
    elevUnit,
    setElevUnit,
    pressUnit,
    setPressUnit,
  } = useSettings();

  // User vs Admin toggle mode state
  const [roleMode, setRoleMode] = useState<"user" | "admin">("user");

  // Admin specific parameters
  const [apiEnvironment, setApiEnvironment] = useState<"sandbox" | "production">("production");
  const [dailyRateLimit, setDailyRateLimit] = useState<number>(1000);
  const [slaFailureAlert, setSlaFailureAlert] = useState<boolean>(true);

  const [savedBadge, setSavedBadge] = useState(false);
  const [badgeMessage, setBadgeMessage] = useState("Settings saved successfully");

  // Multi-API states
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>(INITIAL_CATEGORIES);
  const [selectedIds, setSelectedIds] = useState<string[]>(["copernicus", "noaa", "usgs"]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const triggerSavedIndicator = (msg: string) => {
    setBadgeMessage(msg);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2500);
  };

  const handleSaveSettings = () => {
    triggerSavedIndicator("Settings saved successfully");
  };

  // Select all toggler
  const handleToggleSelectAll = () => {
    if (selectedIds.length === apiCategories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(apiCategories.map(c => c.id));
    }
  };

  const handleToggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  // Bulk active/inactive
  const handleBulkToggleStatus = (activate: boolean) => {
    if (selectedIds.length === 0) {
      triggerSavedIndicator("Please select at least 1 category for bulk update");
      return;
    }
    setApiCategories(prev => prev.map(c => {
      if (selectedIds.includes(c.id)) {
        return { ...c, status: activate };
      }
      return c;
    }));
    triggerSavedIndicator(`Bulk updated: ${selectedIds.length} categories ${activate ? "Activated" : "Deactivated"}`);
  };

  // Bulk credential regenerate
  const handleBulkRefreshKeys = () => {
    if (selectedIds.length === 0) {
      triggerSavedIndicator("Please select at least 1 category to refresh keys");
      return;
    }
    setBulkActionLoading(true);
    setTimeout(() => {
      setApiCategories(prev => prev.map(c => {
        if (selectedIds.includes(c.id)) {
          const randHex = Math.random().toString(16).substring(2, 14);
          return {
            ...c,
            token: `tok_${c.id.substring(0, 3)}_${randHex}`,
            lastRefreshed: new Date().toISOString().substring(0, 16).replace("T", " ")
          };
        }
        return c;
      }));
      setBulkActionLoading(false);
      triggerSavedIndicator(`Regenerated auth keys for ${selectedIds.length} selected services!`);
    }, 1500);
  };

  // Double toggle status
  const handleSingleToggleStatus = (id: string) => {
    setApiCategories(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = !c.status;
        return { ...c, status: nextStatus };
      }
      return c;
    }));
    triggerSavedIndicator("Service integration status toggled");
  };

  const handleSingleRefreshKey = (id: string) => {
    setApiCategories(prev => prev.map(c => {
      if (c.id === id) {
        const randHex = Math.random().toString(16).substring(2, 14);
        return {
          ...c,
          token: `tok_${c.id.substring(0, 3)}_${randHex}`,
          lastRefreshed: new Date().toISOString().substring(0, 16).replace("T", " ")
        };
      }
      return c;
    }));
    triggerSavedIndicator("API Key rotated successfully");
  };

  return (
    <div className="space-y-6" id="settings-page-main">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green font-mono">
            {t("settings.headerSubtitle")}
          </span>
          <h1 className="text-3xl font-display font-black tracking-tight text-gray-950">
            {t("settings.headerTitle")}
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl text-left leading-normal font-sans">
            {t("settings.headerDesc")}
          </p>
        </div>

        {savedBadge && (
          <div className="flex items-center gap-1 text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-150 px-3.5 py-1.5 rounded-xl animate-fade-in uppercase font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>{badgeMessage}</span>
          </div>
        )}
      </div>

      {/* USER VS ADMIN CONTROL ROLE SELECTOR */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 pl-2">
          <div className="p-2 bg-slate-200/50 rounded-xl shrink-0 text-slate-600">
            <FolderLock className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-[8.5px] font-mono font-black text-slate-400 uppercase tracking-widest block leading-none">Access Guard</span>
            <span className="text-xs font-bold text-slate-700 font-sans">API Authorization Mode</span>
          </div>
        </div>

        <div className="flex bg-slate-200/60 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setRoleMode("user");
              triggerSavedIndicator("Viewing User Settings Mode");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
              roleMode === "user"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            User Settings
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleMode("admin");
              triggerSavedIndicator("Viewing Admin Credentials Matrix");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              roleMode === "admin"
                ? "bg-slate-900 text-teal-350 shadow-xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Admin Console</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* Settings options panel (8/12 layout) */}
        <div className="lg:col-span-8 space-y-6">

          {roleMode === "admin" ? (
            /* ADMIN SECTION: FULL API MATRIX & INTERACTIVE PARAMETERS */
            <div className="space-y-6 animate-fade-in" id="admin-settings-container">
              
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-150">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest font-mono block">Bulk Integration Console</span>
                    <h2 className="text-lg font-display font-black text-gray-900 uppercase">Planetary API Credentials Matrix</h2>
                  </div>

                  {/* Bulk operations button triggers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleBulkToggleStatus(true)}
                      disabled={selectedIds.length === 0 || bulkActionLoading}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-gray-700 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 select-none"
                    >
                      Bulk Activate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleStatus(false)}
                      disabled={selectedIds.length === 0 || bulkActionLoading}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-gray-700 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 select-none"
                    >
                      Bulk Mute
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkRefreshKeys}
                      disabled={selectedIds.length === 0 || bulkActionLoading}
                      className="px-3.5 py-1.5 bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white text-[10px] font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                    >
                      {bulkActionLoading ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                      ) : (
                        <RefreshCw className="w-3 h-3 text-slate-300" />
                      )}
                      <span>Refresh Keys ({selectedIds.length})</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-normal font-sans text-left">
                  Select key satellite data layers inside the registry grid catalog to bulk toggle client status, rotate authentication keys, or refresh communication tunnels.
                </p>

                {/* Matrix table list view */}
                <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100 border-b border-slate-150 px-4 py-3 flex items-center justify-between font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                      >
                        {selectedIds.length === apiCategories.length ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <span>API Registry / Classification</span>
                    </div>
                    <div className="flex gap-16 mr-4">
                      <span>Sync Status</span>
                      <span>Credential Token</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-150">
                    {apiCategories.map((cat) => {
                      const isChecked = selectedIds.includes(cat.id);
                      return (
                        <div key={cat.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50/40 transition-all">
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSelection(cat.id)}
                              className="p-1 mt-0.5 hover:bg-slate-100 rounded text-slate-400 shrink-0 cursor-pointer"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            
                            <div className="space-y-1 text-left font-sans">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-900">{cat.name}</span>
                                <span className="text-[8px] font-mono px-1.5 py-0.5 font-bold uppercase border bg-slate-50 rounded text-slate-500 border-slate-200">
                                  {cat.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 max-w-md leading-normal">
                                {cat.description}
                              </p>
                              <div className="text-[9px] font-mono text-gray-400">
                                Last Refreshed: {cat.lastRefreshed}
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                            {/* Status Toggle Switches */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSingleToggleStatus(cat.id)}
                                className={`w-9 h-5 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                                  cat.status ? "bg-emerald-500" : "bg-gray-300"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                  cat.status ? "translate-x-4" : "translate-x-0"
                                }`} />
                              </button>
                              <span className="text-[10px] font-mono font-bold w-10 text-slate-600 capitalize">
                                {cat.status ? "Active" : "Muted"}
                              </span>
                            </div>

                            {/* Token preview and individual refresh */}
                            <div className="flex items-center gap-2">
                              <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-1.5 font-mono text-[9px] text-slate-600">
                                <Lock className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={2.5} />
                                <span className="font-semibold block">{cat.token}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSingleRefreshKey(cat.id)}
                                className="p-2 border border-gray-200 rounded-xl hover:bg-slate-50 hover:text-gray-900 text-gray-400 transition-all cursor-pointer"
                                title="Regenerate single token key"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Advanced System Endpoint Control parameters (Admin limits) */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="border-b border-gray-150 pb-4 text-left">
                  <span className="text-[9.5px] font-mono font-bold text-teal-650 uppercase tracking-widest block">System Constraints</span>
                  <h3 className="text-sm font-display font-black text-gray-900 uppercase">Advanced Telemetry Credentials Control</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Select option for Sandbox vs Production */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-gray-700 block font-sans">Gateway Target Environment</label>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Diverts API calls. Sandbox serves local high-efficiency static caches while Production hits real satellite transponders.
                    </p>
                    <select
                      value={apiEnvironment}
                      onChange={(e) => {
                        setApiEnvironment(e.target.value as "sandbox" | "production");
                        triggerSavedIndicator(`Target updated to ${e.target.value.toUpperCase()}`);
                      }}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-900 cursor-pointer"
                    >
                      <option value="production">🚀 Production (live-api1.mycrop-ag.org)</option>
                      <option value="sandbox">🛡️ Sandbox (sandbox.mycrop-ag.org)</option>
                    </select>
                  </div>

                  {/* Interactive Rate Limit Constraint Slider */}
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 block font-sans">Daily Fetch Quota Range Limit</label>
                      <span className="text-[11px] font-mono font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
                        {dailyRateLimit} req/day
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Hard constrain active coordinate searches to protect high cost cloud instances from background scraping crawls.
                    </p>
                    <input
                      type="range"
                      min="100"
                      max="5000"
                      step="100"
                      value={dailyRateLimit}
                      onChange={(e) => setDailyRateLimit(parseInt(e.target.value))}
                      className="w-full accent-slate-950 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none mt-1"
                    />
                    <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-0.5">
                      <span>Min: 100 req/day</span>
                      <span>Max: 5000 req/day</span>
                    </div>
                  </div>

                </div>

                {/* Additional SLA alerts Toggle */}
                <div className="pt-3 border-t border-slate-150 flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md text-left">
                    <span className="text-xs font-bold text-gray-900 block font-sans">SLA Failure Instant Alarms</span>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Dispatch Telegram webhooks to structural maintainers if primary Copernicus or USGS telemetry API returns exceed 3000ms response window heights.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSlaFailureAlert(!slaFailureAlert);
                      triggerSavedIndicator(`System SLA alarms ${!slaFailureAlert ? "Activated" : "Deactivated"}`);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                      slaFailureAlert ? "bg-slate-900" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      slaFailureAlert ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

              </div>
            </div>
          ) : (
            /* USER SECTION: PERSONAL RECIPIENT ALERTS & HEALTH OVERLAYS */
            <div className="space-y-6 animate-fade-in" id="user-settings-container">
              
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="space-y-4">
                  
                  {/* Sec A: Telemetry inputs */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Satellite API Linkages</span>
                    <div className="space-y-3 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                      
                      {/* Copernicus Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 max-w-md text-left">
                          <span className="text-xs font-bold text-gray-900 block font-sans">Copernicus Sentinel-2 Live Feed</span>
                          <p className="text-[10px] text-gray-400 leading-normal font-sans">
                            Automatically sync multi-spectral spatial boundaries every 5 days when Sentinel satellites orbit your farmland coordinates.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setCopernicusFeed(!copernicusFeed);
                            handleSaveSettings();
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                            copernicusFeed ? "bg-brand-green" : "bg-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            copernicusFeed ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Moisture Alerts Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 max-w-md text-left">
                          <span className="text-xs font-bold text-gray-900 block font-sans">Automated moisture drop alarms</span>
                          <p className="text-[10px] text-gray-400 leading-normal font-sans text-left">
                            Trigger direct coordinate alerts and SMS messages when localized satellite-scanned soil moisture levels fall below critical thresholds.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setMoistureAlerts(!moistureAlerts);
                            handleSaveSettings();
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                            moistureAlerts ? "bg-brand-green" : "bg-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            moistureAlerts ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Sec B: Regional Units options */}
                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Regional Scales & Contrast</span>
                    <div className="space-y-3 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                      
                      {/* Metric/Imperial toggle */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 max-w-md text-left">
                          <span className="text-xs font-bold text-gray-900 block font-sans">Hectares / Metric measuring units</span>
                          <p className="text-[10px] text-gray-400 leading-normal font-sans text-left">
                            Use Hectares (°C, t/Ha, cm) as standard, or switch to Imperial Acres (°F, Bu/Ac, in) for telemetry stats.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setMetricScale(!metricScale);
                            handleSaveSettings();
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                            metricScale ? "bg-brand-green" : "bg-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            metricScale ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* Detailed Unit Settings */}
                      <div className="space-y-4 pt-1 text-left pb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Fine-tuned Measurement Units</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white border border-slate-150 p-4 rounded-xl">
                          
                          {/* Temp Unit Selector */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-extrabold text-slate-700 block uppercase tracking-wide">Temperature Scale</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                              <button
                                type="button"
                                onClick={() => { setTempUnit("C"); triggerSavedIndicator("Set Temperature to Celsius (°C)"); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${tempUnit === "C" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                Celsius (°C)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setTempUnit("F"); triggerSavedIndicator("Set Temperature to Fahrenheit (°F)"); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${tempUnit === "F" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                Fahrenheit (°F)
                              </button>
                            </div>
                          </div>

                          {/* Rain Unit Selector */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-extrabold text-slate-700 block uppercase tracking-wide">Precipitation Depth</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                              <button
                                type="button"
                                onClick={() => { setRainUnit("mm"); triggerSavedIndicator("Set Rain depth to Millimeters (mm)"); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${rainUnit === "mm" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                Metric (mm)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setRainUnit("inch"); triggerSavedIndicator("Set Rain depth to Inches (in)"); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${rainUnit === "inch" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                Imperial (in)
                              </button>
                            </div>
                          </div>

                          {/* Elevation Selector */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-extrabold text-slate-700 block uppercase tracking-wide">Altitude / Elevation Scale</label>
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                              <button
                                type="button"
                                onClick={() => { setElevUnit("m"); triggerSavedIndicator("Set Elevation to Meters (m)"); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${elevUnit === "m" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                Meters (m)
                              </button>
                              <button
                                type="button"
                                onClick={() => { setElevUnit("ft"); triggerSavedIndicator("Set Elevation to Feet (ft)"); }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${elevUnit === "ft" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
                              >
                                Feet (ft)
                              </button>
                            </div>
                          </div>

                          {/* Pressure Selector */}
                          <div className="space-y-1.5 text-left">
                            <label className="text-[11px] font-extrabold text-slate-700 block uppercase tracking-wide">Atmospheric Pressure</label>
                            <select
                              value={pressUnit}
                              onChange={(e) => {
                                setPressUnit(e.target.value as any);
                                triggerSavedIndicator(`Set Pressure scale to ${e.target.value}`);
                              }}
                              className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 cursor-pointer w-full max-w-[200px]"
                            >
                              <option value="hPa">hPa (hectopascals)</option>
                              <option value="psi">psi (pounds/sq inch)</option>
                              <option value="atm">atm (atmospheres)</option>
                              <option value="mmHg">mmHg (millimeters of mercury)</option>
                            </select>
                          </div>

                        </div>
                      </div>

                      <div className="h-px bg-slate-200" />

                      {/* High Contrast */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5 max-w-md text-left">
                          <span className="text-xs font-bold text-gray-900 block font-sans">High contrast display overlay</span>
                          <p className="text-[10px] text-gray-400 leading-normal font-sans text-left">
                            Improve readability under direct solar sunlight during field inspections by boosting UI lines contrast margins.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setHighContrast(!highContrast);
                            handleSaveSettings();
                          }}
                          className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                            highContrast ? "bg-brand-green" : "bg-gray-300"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            highContrast ? "translate-x-5" : "translate-x-0"
                          }`} />
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Read Only Planetary API lists for users */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3 text-left">
                  <span className="text-[9.5px] font-mono font-bold text-emerald-600 uppercase tracking-widest block font-bold">Live Connections</span>
                  <h3 className="text-sm font-display font-black text-gray-950 uppercase">Active Telemetry API Status Catalog</h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-sans mt-1 text-left">
                  The following world-monitoring connections are linked to your MyCrop dashboard. Active credentials, rotate mechanisms, and rate limits can be mutated anytime in the <strong className="text-slate-900 font-bold">Admin Console</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-left">
                  {apiCategories.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50/75 border border-slate-150 rounded-2xl flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-bold text-slate-800 block truncate leading-tight">{c.name}</span>
                        <span className="text-[8px] font-mono bg-slate-200/50 text-slate-600 px-1 py-0.5 rounded uppercase mt-1 inline-block">
                          {c.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[9px] shrink-0">
                        <div className={`w-2 h-2 rounded-full ${c.status ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className={c.status ? "text-emerald-700 font-extrabold" : "text-slate-400 font-bold"}>
                          {c.status ? "ONLINE" : "MUTED"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Informative Side Card (4/12 layout) */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4 text-left">
          <div className="p-3 bg-brand-green/10 text-brand-green rounded-2xl w-fit">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-display font-black text-gray-950">System Link Active</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans mt-0.5">
              Settings automatically commit to your local storage session and coordinate with your Firebase client DB instance.
            </p>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="text-[10px] text-gray-400 font-mono space-y-1">
            <p>ACTIVE FEED: Sentinel v2.4</p>
            <p>POLLED ONCE: Every 10 mins</p>
            <p>SECURE LINK: SSL-TLS-1.3</p>
            <p className="text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>ROLE: {roleMode.toUpperCase()}_MODE</span>
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
