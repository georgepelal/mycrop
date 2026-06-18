import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Parcel } from "./types";

// Pages
import Dashboard from "./pages/Dashboard";
import Parcels from "./pages/Parcels";
import ParcelForm from "./pages/ParcelForm";
import Predictor from "./pages/Predictor";
import WeatherOutlook from "./pages/WeatherOutlook";
import SettingsPage from "./pages/SettingsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import Field3DView from "./pages/Field3DView";
import AuthPage from "./pages/AuthPage";
import CompanyLogo from "./components/CompanyLogo";
import BillingConsole from "./pages/BillingConsole";

// Icons
import { 
  LayoutDashboard,
  Map, 
  Compass, 
  LineChart, 
  CloudSun, 
  Settings as SettingsIcon, 
  UserCheck, 
  LogOut,
  Sliders,
  Menu,
  X,
  Wallet
} from "lucide-react";

const INITIAL_PARCELS: Parcel[] = [
  {
    id: "p1",
    name: "North Barley Ring",
    cropType: "Barley",
    area: 45.8,
    farmSize: 45.8,
    soilMoisture: 42,
    predictedYield: 6.8,
    lat: 41.8902,
    lng: -87.6298,
    latitude: 41.8902,
    longitude: -87.6298,
    location: "41.89° N, 87.63° W",
    boundaries: [],
    ndvi: 0.82,
    ndviValue: 0.82,
    ndwiValue: 0.42,
    cropHeight: 85,
    soilType: "Clay Loam",
    soilPH: 6.4,
    nitrogen: "Optimal",
    plantingMonth: "May",
    costPerHectare: 900,
    marketPricePerTon: 220,
    createdAt: "2026-05-12",
    lastUpdated: "2026-05-12",
    userId: "mock-agronomist-george",
    ownerId: "mock-agronomist-george",
    customImage: null,
    billingStatus: "unpaid",
    billingCycle: "monthly",
    billingAmount: 0,
    billingExpiration: ""
  },
  {
    id: "p2",
    name: "Valley Soy Plot",
    cropType: "Soybeans",
    area: 28.4,
    farmSize: 28.4,
    soilMoisture: 58,
    predictedYield: 4.2,
    lat: 41.8950,
    lng: -87.6320,
    latitude: 41.8950,
    longitude: -87.6320,
    location: "41.90° N, 87.63° W",
    boundaries: [],
    ndvi: 0.74,
    ndviValue: 0.74,
    ndwiValue: 0.52,
    cropHeight: 65,
    soilType: "Silt Loam",
    soilPH: 6.2,
    nitrogen: "Optimal",
    plantingMonth: "May",
    costPerHectare: 950,
    marketPricePerTon: 340,
    createdAt: "2026-05-14",
    lastUpdated: "2026-05-14",
    userId: "mock-agronomist-george",
    ownerId: "mock-agronomist-george",
    customImage: null,
    billingStatus: "unpaid",
    billingCycle: "monthly",
    billingAmount: 0,
    billingExpiration: ""
  },
  {
    id: "p3",
    name: "Hillside Wheat Quadrant",
    cropType: "Winter Wheat",
    area: 64.2,
    farmSize: 64.2,
    soilMoisture: 24,
    predictedYield: 5.5,
    lat: 41.8880,
    lng: -87.6250,
    latitude: 41.8880,
    longitude: -87.6250,
    location: "41.89° N, 87.63° W",
    boundaries: [],
    ndvi: 0.45,
    ndviValue: 0.45,
    ndwiValue: 0.31,
    cropHeight: 92,
    soilType: "Sandy Loam",
    soilPH: 6.8,
    nitrogen: "Minimal",
    plantingMonth: "May",
    costPerHectare: 880,
    marketPricePerTon: 190,
    createdAt: "2026-05-15",
    lastUpdated: "2026-05-15",
    userId: "mock-agronomist-george",
    ownerId: "mock-agronomist-george",
    customImage: null,
    billingStatus: "unpaid",
    billingCycle: "monthly",
    billingAmount: 0,
    billingExpiration: ""
  }
];

function DashboardShell() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState<"dashboard" | "parcels" | "parcel-form" | "predictor" | "weather" | "settings" | "account" | "3d-view" | "billing">("dashboard");
  
  // Local state for parcels
  const [parcels, setParcels] = useState<Parcel[]>(() => {
    const cached = localStorage.getItem("mycrop_parcels");
    return cached ? JSON.parse(cached) : INITIAL_PARCELS;
  });

  const [activeParcelId, setActiveParcelId] = useState<string>(() => parcels[0]?.id || "");

  useEffect(() => {
    if (parcels.length > 0 && !activeParcelId) {
      setActiveParcelId(parcels[0].id);
    }
  }, [parcels, activeParcelId]);

  const [selectedParcel, setSelectedParcel] = useState<Parcel | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save parcels to localStorage
  useEffect(() => {
    localStorage.setItem("mycrop_parcels", JSON.stringify(parcels));
  }, [parcels]);

  const handleAddParcel = (newParcel: any) => {
    const defaultUid = user?.uid || "mock-agronomist-george";
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
      location: newParcel.location || `${newParcel.lat?.toFixed(4)}, ${newParcel.lng?.toFixed(4)}`,
      ndviValue: Number(newParcel.ndviValue ?? newParcel.ndvi),
      ndwiValue: Number(newParcel.ndwiValue ?? 0.45),
      soilPH: Number(newParcel.soilPH ?? 6.5),
      nitrogen: newParcel.nitrogen ?? "Optimal",
      plantingMonth: newParcel.plantingMonth ?? "May",
      costPerHectare: Number(newParcel.costPerHectare ?? 900),
      marketPricePerTon: Number(newParcel.marketPricePerTon ?? 210),
      customImage: newParcel.customImage ?? null,
      billingStatus: newParcel.billingStatus ?? "unpaid",
      billingCycle: newParcel.billingCycle ?? "monthly",
      billingAmount: Number(newParcel.billingAmount ?? 0),
      billingExpiration: newParcel.billingExpiration ?? ""
    };

    setParcels([fresh, ...parcels]);
    setActivePage("parcels");
  };

  const handleSelectParcelFor3D = (parcel: Parcel) => {
    setSelectedParcel(parcel);
    setActivePage("3d-view");
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            parcels={parcels}
            activeParcelId={activeParcelId || (parcels[0]?.id || "")}
            onSelectParcel={(id) => setActiveParcelId(id)}
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "parcels":
        return (
          <Parcels 
            parcels={parcels} 
            onSelectParcel={handleSelectParcelFor3D}
            onNavigateToForm={() => setActivePage("parcel-form")}
            onNavigateTo3D={() => setActivePage("3d-view")}
          />
        );
      case "parcel-form":
        return <ParcelForm onAddParcel={handleAddParcel} onNavigateBack={() => setActivePage("parcels")} />;
      case "predictor":
        return <Predictor parcels={parcels} />;
      case "3d-view":
        return <Field3DView parcels={parcels} initialSelectedParcelId={selectedParcel?.id} />;
      case "weather":
        return <WeatherOutlook parcels={parcels} />;
      case "settings":
        return <SettingsPage />;
      case "account":
        return <AccountSettingsPage />;
      case "billing":
        return <BillingConsole />;
      default:
        return <Parcels parcels={parcels} onSelectParcel={handleSelectParcelFor3D} onNavigateToForm={() => setActivePage("parcel-form")} onNavigateTo3D={() => setActivePage("3d-view")} />;
    }
  };

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative" id="mycrop-dashboard-shell">
      
      {/* Sidebar Navigation (Horizontal on mobile, vertical on desktop) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-150 flex flex-col shrink-0 z-30">
        
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <CompanyLogo />

          {/* Mobile hamburger menu toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-1.5 hover:bg-slate-50 border border-slate-150 rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation links block */}
        <nav className={`p-4 space-y-1.5 flex-1 flex-col ${mobileMenuOpen ? "flex" : "hidden md:flex"}`}>
          
          <button
            onClick={() => { setActivePage("dashboard"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "dashboard"
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
            <span>Telemetry Dashboard</span>
          </button>

          <button
            onClick={() => { setActivePage("parcels"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "parcels" || activePage === "parcel-form"
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Map className="w-4.5 h-4.5 shrink-0" />
            <span>Farmland Parcels</span>
          </button>

          <button
            onClick={() => { setActivePage("3d-view"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "3d-view" 
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Compass className="w-4.5 h-4.5 shrink-0 animate-pulse" />
            <span>3D Field Viewer (New)</span>
          </button>

          <button
            onClick={() => { setActivePage("predictor"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "predictor" 
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <LineChart className="w-4.5 h-4.5 shrink-0" />
            <span>Yield Predictor</span>
          </button>

          <button
            onClick={() => { setActivePage("weather"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "weather" 
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <CloudSun className="w-4.5 h-4.5 shrink-0" />
            <span>Weather Telemetry</span>
          </button>

          <div className="h-px bg-slate-100 my-4" />

          <button
            onClick={() => { setActivePage("billing"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "billing" 
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Wallet className="w-4.5 h-4.5 shrink-0" />
            <span>Billing &amp; Credits</span>
          </button>

          <button
            onClick={() => { setActivePage("account"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "account" 
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="w-4.5 h-4.5 shrink-0" />
            <span>Account Settings</span>
          </button>

          <button
            onClick={() => { setActivePage("settings"); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "settings" 
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <SettingsIcon className="w-4.5 h-4.5 shrink-0" />
            <span>Control Settings</span>
          </button>

        </nav>

        {/* Sidebar Footer User detail card */}
        <div className={`p-4 border-t border-gray-100 bg-gray-50/50 flex-col space-y-2 select-none ${mobileMenuOpen ? "flex" : "hidden md:flex"}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-green-600 text-sm shadow-xs flex items-center justify-center font-bold text-white uppercase select-none">
              {user.displayName ? Array.from(user.displayName)[0] : "🌱"}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-150 px-1.5 py-0.5 rounded-full font-bold font-mono uppercase tracking-wider block w-fit">
                Live Agent
              </span>
              <p className="text-[10px] font-black text-slate-800 leading-none truncate mt-1">
                {user.displayName || "George Pelal"}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Disconnect Station</span>
          </button>
        </div>

      </aside>

      {/* Main viewport Container (Scrollable) */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-8" id="mycrop-main-viewport">
        <div className="max-w-7xl mx-auto space-y-6">
          {renderActivePage()}
        </div>
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardShell />
    </AuthProvider>
  );
}
