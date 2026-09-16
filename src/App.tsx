import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import { SettingsProvider } from "./contexts/SettingsContext";
import { Parcel } from "./types";
import { getParcelsForUser, createParcelForUser } from "./lib/db";
import { useTranslation } from "react-i18next";

// Pages
import Dashboard from "./pages/Dashboard";
import EnsembleDispersion from "./pages/EnsembleDispersion";
import DecadalReanalysis from "./pages/DecadalReanalysis";
import ClimateProjections from "./pages/ClimateProjections";
import EnvironmentalTelemetry from "./pages/EnvironmentalTelemetry";
import DiagnosticAnalytics from "./pages/DiagnosticAnalytics";
import CropAutoDetection from "./pages/CropAutoDetection";
import Chat from "./pages/Chat";
import Parcels from "./pages/Parcels";
import ParcelForm from "./pages/ParcelForm";
import SettingsPage from "./pages/SettingsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import Field3DView from "./pages/Field3DView";
import AuthPage from "./pages/AuthPage";
import CompanyLogo from "./components/CompanyLogo";
import LanguageSwitcher from "./components/LanguageSwitcher";
import ThemeToggle from "./components/ThemeToggle";
import FrostFreezeRisk from "./pages/FrostFreezeRisk";
import GrowingDegreeDays from "./pages/GrowingDegreeDays";
import UvAndBoundaryLayer from "./pages/UvAndBoundaryLayer";
import AllergenPollenForecasts from "./pages/AllergenPollenForecasts";
import GlobalGreenhouseGas from "./pages/GlobalGreenhouseGas";
import PestDiseaseRisk from "./pages/PestDiseaseRisk";
import CropLodgingShear from "./pages/CropLodgingShear";
import StomatalConductance from "./pages/StomatalConductance";
import ParPpfdData from "./pages/ParPpfdData";
import PollinatorOutlooks from "./pages/PollinatorOutlooks";
import SoilCompositionTexture from "./pages/SoilCompositionTexture";
import SoilOrganicCarbon from "./pages/SoilOrganicCarbon";
import NasaAgronomicSoil from "./pages/NasaAgronomicSoil";
import CropDictionary from "./pages/CropDictionary";
import OpenEpiSoilQuality from "./pages/OpenEpiSoilQuality";
import AgronomicEvapotranspiration from "./pages/AgronomicEvapotranspiration";
import SoilTrafficability from "./pages/SoilTrafficability";
import DeepSoilTemperature from "./pages/DeepSoilTemperature";

import SoilSalinityCapillary from "./pages/SoilSalinityCapillary";
import AgronomicNutrientLeaching from "./pages/AgronomicNutrientLeaching";
import FloodHydrology from "./pages/FloodHydrology";
import USGSWaterWatch from "./pages/USGSWaterWatch";
import CroplandFireRisk from "./pages/CroplandFireRisk";

import LocalBiodiversity from "./pages/LocalBiodiversity";
import NasaEonetEvents from "./pages/NasaEonetEvents";
import GdacsActiveHazards from "./pages/GdacsActiveHazards";
import USGSSeismicMaps from "./pages/USGSSeismicMaps";
import CopernicusReflectance from "./pages/CopernicusReflectance";
import OSMNaturalFeatures from "./pages/OSMNaturalFeatures";
import USDACropPricing from "./pages/USDACropPricing";
import OpenExchangeRates from "./pages/OpenExchangeRates";
import WorldBankForests from "./pages/WorldBankForests";
import RegionalIndicators from "./pages/RegionalIndicators";
import SolarEnergyPotential from "./pages/SolarEnergyPotential";
import AgronomicChillingHours from "./pages/AgronomicChillingHours";
import CropWaterEfficiency from "./pages/CropWaterEfficiency";
import NoaaSpaceWeather from "./pages/NoaaSpaceWeather";
import IssSatelliteOverhead from "./pages/IssSatelliteOverhead";
import CropLiteratureLibrary from "./pages/CropLiteratureLibrary";
import MarineHydrodynamics from "./pages/MarineHydrodynamics";
import AirQualityAerosols from "./pages/AirQualityAerosols";
import OpenEpiForestFire from "./pages/OpenEpiForestFire";
import ClimatologyNasa from "./pages/ClimatologyNasa";
import RiverDischarge from "./pages/RiverDischarge";
import AgriSoilMoisture from "./pages/AgriSoilMoisture";
import HistoricalArchive from "./pages/HistoricalArchive";
import SunriseSunsetAstronomy from "./pages/SunriseSunsetAstronomy";
import PlantDictionaryLookup from "./pages/PlantDictionaryLookup";
import GbifLocalOccurrences from "./pages/GbifLocalOccurrences";
import OsmReverseGeocode from "./pages/OsmReverseGeocode";
import ClientIpGeolocation from "./pages/ClientIpGeolocation";
import LocalPublicHolidays from "./pages/LocalPublicHolidays";
import RegionalCountrySovereign from "./pages/RegionalCountrySovereign";
import GbifSpeciesSuggest from "./pages/GbifSpeciesSuggest";
import FieldWeatherPage from "./pages/FieldWeatherPage";

// Icons
import {
  LayoutDashboard,
  Map,
  Compass,
  CloudSun,
  Layers,
  Settings as SettingsIcon,
  LogOut,
  Sliders,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Bot,
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
  },
  {
    id: "p2",
    name: "Valley Soy Plot",
    cropType: "Soybeans",
    area: 28.4,
    farmSize: 28.4,
    soilMoisture: 58,
    predictedYield: 4.2,
    lat: 41.895,
    lng: -87.632,
    latitude: 41.895,
    longitude: -87.632,
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
  },
  {
    id: "p3",
    name: "Hillside Wheat Quadrant",
    cropType: "Winter Wheat",
    area: 64.2,
    farmSize: 64.2,
    soilMoisture: 24,
    predictedYield: 5.5,
    lat: 41.888,
    lng: -87.625,
    latitude: 41.888,
    longitude: -87.625,
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
  },
];

// ---------------------------------------------------------------------------
// Data-driven sidebar navigation config
// ---------------------------------------------------------------------------

interface NavLeaf {
  id: string;
  label: string;
}

type NavTheme = "emerald" | "amber" | "slate" | "purple";

interface NavGroup {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  theme: NavTheme;
  items?: NavLeaf[];
  subGroups?: NavGroup[];
}

const NAV_SECTIONS: NavGroup[] = [
  {
    key: "weather",
    label: "Weather",
    icon: CloudSun,
    theme: "emerald",
    items: [{ id: "field-weather", label: "🌦️ Field Forecast" }],
  },
  {
    key: "soil",
    label: "Soil Insights",
    icon: Layers,
    theme: "amber",
    items: [
      { id: "soil-composition", label: "🧪 Soil Composition & Texture" },
      { id: "field-deep-soil-temp", label: "🌡️ Deep Soil Temperature" },
      { id: "soil-organic-carbon", label: "🌱 Soil Organic Carbon" },
      { id: "nasa-agronomic-soil", label: "🛰️ Agronomic Soil Health" },
    ],
  },
  {
    key: "settings-group",
    label: "Settings",
    icon: SettingsIcon,
    theme: "slate",
    items: [
      { id: "settings", label: "⚙️ Control Settings" },
      { id: "account", label: "👤 Account Settings" },
    ],
    subGroups: [
      {
        key: "science",
        label: "Scientific Tools",
        icon: Sliders,
        theme: "purple",
        subGroups: [
          {
            key: "science-weather",
            label: "🌦️ Weather & Climate",
            theme: "purple",
            items: [
              { id: "field-ensemble", label: "Ensemble Dispersion (30+ Models)" },
              { id: "field-decadal", label: "Decadal Historical Reanalysis" },
              { id: "field-climate", label: "Long-Term Climate Projections" },
              { id: "field-env", label: "Environmental Telemetry" },
              { id: "field-frost-risk", label: "Frost/Freeze Risk" },
              { id: "field-gdd", label: "Growing Degree Days (GDD)" },
              { id: "field-solar-energy", label: "Solar Energy Potential" },
              { id: "field-uv", label: "UV Radiation & Boundary Layer" },
              { id: "field-allergen", label: "Allergen & Pollen Forecasts" },
              { id: "field-greenhouse", label: "Global Greenhouse Gas Trends" },
              { id: "field-noaa-space-weather", label: "NOAA Space Weather & GPS" },
              { id: "field-iss-overhead", label: "ISS Space Tracking" },
            ],
          },
          {
            key: "science-crop",
            label: "🌱 Plant & Yield",
            theme: "purple",
            items: [
              { id: "field-crop-detection", label: "Crop Auto-Detection API" },
              { id: "field-pest-disease", label: "Pest & Disease Risk" },
              { id: "field-lodging", label: "Crop Lodging Shear Risk" },
              { id: "field-stomatal", label: "Stomatal Conductance" },
              { id: "field-par-ppfd", label: "PAR / PPFD Data" },
              { id: "field-pollinator", label: "Pollinator Outlooks" },
              { id: "field-dictionary", label: "Crop Dictionary" },
              { id: "field-chilling-hours", label: "Agronomic Chilling Hours" },
              { id: "field-crop-library", label: "Crop Literature Library" },
            ],
          },
          {
            key: "science-soil",
            label: "💧 Soil & Hydrology",
            theme: "purple",
            items: [
              { id: "field-agronomic-et0", label: "Agronomic Evapotranspiration" },
              { id: "field-wue", label: "Crop Water Efficiency" },
              { id: "field-soil-trafficability", label: "Soil Trafficability" },
              { id: "field-soil-salinity", label: "Soil Salinity" },
              { id: "field-deep-soil-temp", label: "Deep Soil Temperature" },
              { id: "field-nutrient-leaching", label: "Agronomic Nutrient Leaching" },
              { id: "field-flood-hydrology", label: "Flood Hydrology" },
              { id: "field-usgs-waterwatch", label: "USGS WaterWatch" },
              { id: "field-openepi-soil", label: "Soil Conditions" },
            ],
          },
          {
            key: "science-eco",
            label: "🌍 Geo & Hazards",
            theme: "purple",
            items: [
              { id: "field-cropland-fire-risk", label: "Cropland Fire Risk" },
              { id: "field-local-biodiversity", label: "Local Biodiversity" },
              { id: "field-nasa-eonet", label: "Environmental Events" },
              { id: "field-gdacs-hazards", label: "GDACS Active Hazards" },
              { id: "field-usgs-seismic", label: "USGS Seismic Maps" },
              { id: "field-copernicus-reflectance", label: "Satellite Reflectance" },
              { id: "field-osm-natural", label: "OSM Natural Features" },
            ],
          },
          {
            key: "science-markets",
            label: "📉 Markets & Macro",
            theme: "purple",
            items: [
              { id: "field-usda-crop-pricing", label: "USDA Crop Pricing" },
              { id: "field-open-exchange-rates", label: "Open Exchange Rates" },
              { id: "field-world-bank-forests", label: "World Bank Forests" },
              { id: "field-regional-indicators", label: "Regional Indicators" },
            ],
          },
          {
            key: "science-other",
            label: "🔬 Core Open Data APIs",
            theme: "purple",
            items: [
              { id: "field-marine-hydro", label: "Marine Hydrodynamics" },
              { id: "field-air-quality", label: "Air Quality & Aerosols" },
              { id: "field-openepi-fire", label: "Forest Fire Risk" },
              { id: "field-nasa-climatology", label: "Climatology" },
              { id: "field-river-discharge", label: "River Discharge" },
              { id: "field-agri-soil", label: "Agri-Soil Moisture" },
              { id: "field-historical-archive", label: "Historical Archive" },
              { id: "field-sunrise-sunset", label: "Sunrise & Astronomy" },
              { id: "field-plant-dictionary", label: "Plant Dictionary Lookup" },
              { id: "field-gbif-occurrences", label: "GBIF Occurrences" },
              { id: "field-osm-reverse", label: "Reverse Geocoding" },
              { id: "field-client-ip", label: "Client IP Geolocation" },
              { id: "field-public-holidays", label: "Public Holidays" },
              { id: "field-regional-sovereign", label: "Regional/Sovereign Meta" },
              { id: "field-gbif-suggest", label: "GBIF Species Suggest" },
            ],
          },
        ],
      },
    ],
  },
];

const THEME: Record<NavTheme, { headerActive: string; border: string; leafActive: string }> = {
  emerald: {
    headerActive: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 shadow-sm",
    border: "border-emerald-100 dark:border-emerald-900",
    leafActive: "text-brand-green dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-bold",
  },
  amber: {
    headerActive: "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 shadow-sm",
    border: "border-amber-100 dark:border-amber-900",
    leafActive: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-bold",
  },
  slate: {
    headerActive: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm",
    border: "border-slate-200 dark:border-slate-800",
    leafActive: "text-brand-green dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-bold",
  },
  purple: {
    headerActive: "bg-purple-50 dark:bg-purple-950/20 text-purple-750 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-900",
    leafActive: "text-brand-green bg-emerald-50 font-bold",
  },
};

const HEADER_INACTIVE = "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40";
const SUBHEADER_INACTIVE = "text-slate-500 hover:text-slate-800";
const LEAF_INACTIVE = "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20";

// Collects every leaf page id reachable under a group (recursing through subGroups),
// used to auto-expand a section when the active route is inside it.
function collectLeafIds(group: NavGroup): string[] {
  const ids = (group.items || []).map((i) => i.id);
  (group.subGroups || []).forEach((sg) => ids.push(...collectLeafIds(sg)));
  return ids;
}

function NavSection({
  group,
  depth,
  expandedCategories,
  toggleCategory,
  pathname,
  onLeafClick,
}: {
  group: NavGroup;
  depth: number;
  expandedCategories: string[];
  toggleCategory: (key: string) => void;
  pathname: string;
  onLeafClick: () => void;
}) {
  const theme = THEME[group.theme];
  const isDescendantActive = collectLeafIds(group).some((id) => pathname === "/" + id);
  const isExpanded = expandedCategories.includes(group.key) || isDescendantActive;
  const Icon = group.icon;

  const headerPad = depth === 0 ? "px-4 py-3 rounded-2xl text-xs" : depth === 1 ? "px-2 py-1.5 rounded-lg text-[10px]" : "px-2 py-1 rounded text-[9px]";
  const iconSize = depth === 0 ? "w-4.5 h-4.5" : "w-3.5 h-3.5";
  const chevronSize = depth === 0 ? "w-4 h-4" : depth === 1 ? "w-3.5 h-3.5" : "w-3 h-3";
  const headerActiveClass = depth <= 1 ? theme.headerActive : "text-purple-700";
  const headerInactiveClass = depth <= 1 ? HEADER_INACTIVE : SUBHEADER_INACTIVE;
  const wrapperBorder = depth === 0 ? `border-l-2 ${theme.border}` : depth === 1 ? `border-l ${theme.border}` : "border-l border-purple-50";
  const wrapperPad = depth === 0 ? "pl-4 pt-2 space-y-1.5 ml-6 mt-1" : depth === 1 ? "pl-2 pt-2 space-y-1.5 ml-4 mt-1" : "pl-2 space-y-1 mt-1 ml-2";
  const leafPad = depth === 0 ? "px-3 py-1.5 rounded-md text-[10px]" : "px-2 py-1 rounded text-[9px]";

  return (
    <div className={depth === 0 ? "mt-4" : undefined}>
      <button
        onClick={() => toggleCategory(group.key)}
        className={`w-full flex justify-between items-center ${headerPad} font-bold transition-all text-left cursor-pointer ${
          isExpanded ? headerActiveClass : headerInactiveClass
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && <Icon className={`${iconSize} shrink-0`} />}
          <span className="truncate">{group.label}</span>
        </div>
        {isExpanded ? <ChevronDown className={chevronSize} /> : <ChevronRight className={chevronSize} />}
      </button>

      {isExpanded && (
        <div className={`${wrapperPad} ${wrapperBorder}`}>
          {(group.items || []).map((leaf) => (
            <NavLink
              key={leaf.id}
              to={"/" + leaf.id}
              onClick={onLeafClick}
              className={({ isActive }) =>
                `w-full block ${leafPad} transition-all text-left cursor-pointer ${isActive ? theme.leafActive : LEAF_INACTIVE}`
              }
            >
              {leaf.label}
            </NavLink>
          ))}

          {group.subGroups && group.subGroups.length > 0 && (
            <div className={depth === 0 ? "mt-2 border-t border-slate-100 dark:border-slate-800/60 pt-2" : undefined}>
              {group.subGroups.map((sg) => (
                <NavSection
                  key={sg.key}
                  group={sg}
                  depth={depth + 1}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  pathname={pathname}
                  onLeafClick={onLeafClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DashboardShell() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Local state for parcels
  const [parcels, setParcels] = useState<Parcel[]>(() => {
    const cached = localStorage.getItem("mycrop_parcels");
    return cached ? JSON.parse(cached) : INITIAL_PARCELS;
  });

  // Synchronize parcels with Firestore when logged in, or use localStorage as fallback
  useEffect(() => {
    let active = true;
    async function syncParcels() {
      if (user && user.uid) {
        try {
          const dbParcels = await getParcelsForUser(user.uid);
          if (active) {
            if (dbParcels && dbParcels.length > 0) {
              setParcels(dbParcels);
            } else {
              // Seed the database with INITIAL_PARCELS for this user so they have real persistent data
              for (const p of INITIAL_PARCELS) {
                await createParcelForUser(user.uid, {
                  ...p,
                  userId: user.uid,
                  ownerId: user.uid
                });
              }
              const seeded = INITIAL_PARCELS.map(p => ({ ...p, userId: user.uid, ownerId: user.uid }));
              setParcels(seeded);
            }
          }
        } catch (err) {
          console.error("Failed to sync parcels with Firestore:", err);
        }
      } else {
        const cached = localStorage.getItem("mycrop_parcels");
        if (active) {
          setParcels(cached ? JSON.parse(cached) : INITIAL_PARCELS);
        }
      }
    }
    syncParcels();
    return () => {
      active = false;
    };
  }, [user]);

  const [activeParcelId, setActiveParcelId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save parcels to localStorage
  useEffect(() => {
    localStorage.setItem("mycrop_parcels", JSON.stringify(parcels));
  }, [parcels]);

  // Shared navigation callback handed to every tool page (their `onNavigate` prop
  // contract is unchanged — only the implementation now pushes a real route).
  const onNavigate = (page: string) => navigate("/" + page);

  const handleAddParcel = async (newParcel: any) => {
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

  if (!user) {
    return <AuthPage />;
  }

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
          <button
            onClick={() => {
              navigate("/parcels");
              setActiveParcelId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              location.pathname === "/parcels" || location.pathname === "/parcel-form" || location.pathname === "/"
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

          {NAV_SECTIONS.map((group, idx) => (
            <React.Fragment key={group.key}>
              <NavSection
                group={group}
                depth={0}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
                pathname={location.pathname}
                onLeafClick={() => setMobileMenuOpen(false)}
              />
              {idx < NAV_SECTIONS.length - 1 && <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />}
            </React.Fragment>
          ))}
        </nav>

        <div className="mt-auto pt-2 pb-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between px-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Sidebar Footer User detail card */}
        <div
          className={`p-4 border-t border-gray-100 bg-gray-50/50 flex-col space-y-2 select-none ${mobileMenuOpen ? "flex" : "hidden md:flex"}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-green-600 text-sm shadow-xs flex items-center justify-center font-bold text-white uppercase select-none">
              {user.displayName ? Array.from(user.displayName)[0] : "🌱"}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                {user.displayName || "George Pelal"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-none mt-0.5">
                {user.email || "georgepelal@gmail.com"}
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
        </div>
      </aside>

      {/* Main viewport Container (Scrollable) */}
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-8"
        id="mycrop-main-viewport"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <Routes>
            <Route path="/" element={<Navigate to="/parcels" replace />} />
            <Route
              path="/parcels"
              element={
                <Parcels
                  parcels={parcels}
                  onSelectParcel={handleSelectParcelForOverview}
                  onNavigateToForm={() => navigate("/parcel-form")}
                  onNavigateTo3D={() => {}}
                />
              }
            />
            <Route
              path="/parcel-form"
              element={<ParcelForm onAddParcel={handleAddParcel} onNavigateBack={() => navigate("/parcels")} />}
            />
            <Route
              path="/field-overview"
              element={
                <Dashboard
                  parcels={parcels}
                  activeParcelId={activeParcelId || parcels[0]?.id || ""}
                  onNavigate={onNavigate}
                />
              }
            />
            <Route
              path="/field-3d"
              element={<Field3DView parcels={parcels} initialSelectedParcelId={activeParcelId || undefined} />}
            />
            <Route
              path="/soil-composition"
              element={
                <SoilCompositionTexture
                  parcels={parcels}
                  activeParcelId={activeParcelId}
                  onSelectParcel={(id) => setActiveParcelId(id)}
                  onNavigate={onNavigate}
                />
              }
            />
            <Route
              path="/soil-organic-carbon"
              element={
                <SoilOrganicCarbon
                  parcels={parcels}
                  activeParcelId={activeParcelId}
                  onSelectParcel={setActiveParcelId}
                  onNavigate={onNavigate}
                />
              }
            />
            <Route
              path="/nasa-agronomic-soil"
              element={
                <NasaAgronomicSoil
                  parcels={parcels}
                  activeParcelId={activeParcelId}
                  onSelectParcel={setActiveParcelId}
                  onNavigate={onNavigate}
                />
              }
            />
            <Route path="/field-ensemble" element={<EnsembleDispersion onNavigate={onNavigate} />} />
            <Route path="/field-decadal" element={<DecadalReanalysis onNavigate={onNavigate} />} />
            <Route path="/field-climate" element={<ClimateProjections onNavigate={onNavigate} />} />
            <Route path="/field-env" element={<EnvironmentalTelemetry onNavigate={onNavigate} />} />
            <Route path="/field-frost-risk" element={<FrostFreezeRisk onNavigate={onNavigate} />} />
            <Route path="/field-gdd" element={<GrowingDegreeDays onNavigate={onNavigate} />} />
            <Route path="/field-uv" element={<UvAndBoundaryLayer onNavigate={onNavigate} />} />
            <Route path="/field-allergen" element={<AllergenPollenForecasts onNavigate={onNavigate} />} />
            <Route path="/field-greenhouse" element={<GlobalGreenhouseGas onNavigate={onNavigate} />} />
            <Route
              path="/field-soil"
              element={
                <DiagnosticAnalytics
                  parcels={parcels}
                  activeParcelId={activeParcelId || parcels[0]?.id || ""}
                  onSelectParcel={(id) => setActiveParcelId(id)}
                  onNavigate={onNavigate}
                />
              }
            />
            <Route
              path="/chat"
              element={
                <Chat
                  parcels={parcels}
                  activeParcelId={activeParcelId || parcels[0]?.id || ""}
                  onSelectParcel={(id) => setActiveParcelId(id)}
                />
              }
            />
            <Route path="/field-crop-detection" element={<CropAutoDetection onNavigate={onNavigate} />} />
            <Route path="/field-pest-disease" element={<PestDiseaseRisk onNavigate={onNavigate} />} />
            <Route path="/field-lodging" element={<CropLodgingShear onNavigate={onNavigate} />} />
            <Route path="/field-stomatal" element={<StomatalConductance onNavigate={onNavigate} />} />
            <Route path="/field-par-ppfd" element={<ParPpfdData onNavigate={onNavigate} />} />
            <Route path="/field-pollinator" element={<PollinatorOutlooks onNavigate={onNavigate} />} />
            <Route path="/field-dictionary" element={<CropDictionary onNavigate={onNavigate} />} />
            <Route path="/field-openepi-soil" element={<OpenEpiSoilQuality onNavigate={onNavigate} />} />
            <Route path="/field-agronomic-et0" element={<AgronomicEvapotranspiration onNavigate={onNavigate} />} />
            <Route path="/field-soil-trafficability" element={<SoilTrafficability onNavigate={onNavigate} />} />
            <Route path="/field-soil-salinity" element={<SoilSalinityCapillary onNavigate={onNavigate} />} />
            <Route
              path="/field-deep-soil-temp"
              element={
                <DeepSoilTemperature
                  parcels={parcels}
                  activeParcelId={activeParcelId}
                  onSelectParcel={(id) => setActiveParcelId(id)}
                  onNavigate={onNavigate}
                />
              }
            />
            <Route path="/field-nutrient-leaching" element={<AgronomicNutrientLeaching onNavigate={onNavigate} />} />
            <Route path="/field-flood-hydrology" element={<FloodHydrology onNavigate={onNavigate} />} />
            <Route path="/field-usgs-waterwatch" element={<USGSWaterWatch onNavigate={onNavigate} />} />
            <Route path="/field-cropland-fire-risk" element={<CroplandFireRisk onNavigate={onNavigate} />} />
            <Route path="/field-local-biodiversity" element={<LocalBiodiversity onNavigate={onNavigate} />} />
            <Route path="/field-nasa-eonet" element={<NasaEonetEvents onNavigate={onNavigate} />} />
            <Route path="/field-gdacs-hazards" element={<GdacsActiveHazards onNavigate={onNavigate} />} />
            <Route path="/field-usgs-seismic" element={<USGSSeismicMaps onNavigate={onNavigate} />} />
            <Route path="/field-copernicus-reflectance" element={<CopernicusReflectance onNavigate={onNavigate} />} />
            <Route path="/field-osm-natural" element={<OSMNaturalFeatures onNavigate={onNavigate} />} />
            <Route path="/field-usda-crop-pricing" element={<USDACropPricing onNavigate={onNavigate} />} />
            <Route path="/field-open-exchange-rates" element={<OpenExchangeRates onNavigate={onNavigate} />} />
            <Route path="/field-world-bank-forests" element={<WorldBankForests onNavigate={onNavigate} />} />
            <Route path="/field-regional-indicators" element={<RegionalIndicators onNavigate={onNavigate} />} />
            <Route path="/field-solar-energy" element={<SolarEnergyPotential onNavigate={onNavigate} />} />
            <Route path="/field-chilling-hours" element={<AgronomicChillingHours onNavigate={onNavigate} />} />
            <Route path="/field-wue" element={<CropWaterEfficiency onNavigate={onNavigate} />} />
            <Route path="/field-noaa-space-weather" element={<NoaaSpaceWeather onNavigate={onNavigate} />} />
            <Route path="/field-iss-overhead" element={<IssSatelliteOverhead onNavigate={onNavigate} />} />
            <Route path="/field-crop-library" element={<CropLiteratureLibrary onNavigate={onNavigate} />} />
            <Route path="/field-marine-hydro" element={<MarineHydrodynamics />} />
            <Route path="/field-air-quality" element={<AirQualityAerosols />} />
            <Route path="/field-openepi-fire" element={<OpenEpiForestFire />} />
            <Route path="/field-nasa-climatology" element={<ClimatologyNasa />} />
            <Route path="/field-river-discharge" element={<RiverDischarge />} />
            <Route path="/field-agri-soil" element={<AgriSoilMoisture />} />
            <Route path="/field-historical-archive" element={<HistoricalArchive />} />
            <Route path="/field-sunrise-sunset" element={<SunriseSunsetAstronomy />} />
            <Route path="/field-plant-dictionary" element={<PlantDictionaryLookup />} />
            <Route path="/field-gbif-occurrences" element={<GbifLocalOccurrences />} />
            <Route path="/field-osm-reverse" element={<OsmReverseGeocode />} />
            <Route path="/field-client-ip" element={<ClientIpGeolocation />} />
            <Route path="/field-public-holidays" element={<LocalPublicHolidays />} />
            <Route path="/field-regional-sovereign" element={<RegionalCountrySovereign />} />
            <Route path="/field-gbif-suggest" element={<GbifSpeciesSuggest />} />
            <Route
              path="/field-weather"
              element={
                <FieldWeatherPage
                  parcels={parcels}
                  activeParcelId={activeParcelId}
                  onSelectParcel={(id) => setActiveParcelId(id)}
                />
              }
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/account" element={<AccountSettingsPage />} />
            <Route path="*" element={<Navigate to="/parcels" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <DashboardShell />
      </SettingsProvider>
    </AuthProvider>
  );
}
