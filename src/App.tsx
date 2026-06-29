import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
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
import Parcels from "./pages/Parcels";
import ParcelForm from "./pages/ParcelForm";
import SettingsPage from "./pages/SettingsPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import Field3DView from "./pages/Field3DView";
import AuthPage from "./pages/AuthPage";
import CompanyLogo from "./components/CompanyLogo";
import BillingConsole from "./pages/BillingConsole";
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
import CropDictionary from "./pages/CropDictionary";
import OpenEpiSoilQuality from "./pages/OpenEpiSoilQuality";
import AgronomicEvapotranspiration from "./pages/AgronomicEvapotranspiration";
import SoilTrafficability from "./pages/SoilTrafficability";

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
import SubSoilProfileNutrientPortal from "./pages/SubSoilProfileNutrientPortal";


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
  Wallet,
  Beaker,
  ChevronDown,
  ChevronRight,
  Activity,
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
    billingExpiration: "",
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
    billingStatus: "unpaid",
    billingCycle: "monthly",
    billingAmount: 0,
    billingExpiration: "",
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
    billingStatus: "unpaid",
    billingCycle: "monthly",
    billingAmount: 0,
    billingExpiration: "",
  },
];

function DashboardShell() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState<
    | "parcels"
    | "parcel-form"
    | "field-overview"
    | "field-3d"
    | "field-soil"
    | "field-ensemble"
    | "field-decadal"
    | "field-climate"
    | "field-env"
    | "field-crop-detection"
    | "field-frost-risk"
    | "field-gdd"
    | "field-uv"
    | "field-allergen"
    | "field-greenhouse"
    | "field-pest-disease"
    | "field-lodging"
    | "field-stomatal"
    | "field-par-ppfd"
    | "field-pollinator"
    | "field-dictionary"
    | "field-openepi-soil"
    | "field-agronomic-et0"
    | "field-soil-trafficability"
    | "field-soil-salinity"
    | "field-nutrient-leaching"
    | "field-flood-hydrology"
    | "field-usgs-waterwatch"
    | "field-cropland-fire-risk"
    | "field-local-biodiversity"
    | "field-nasa-eonet"
    | "field-gdacs-hazards"
    | "field-usgs-seismic"
    | "field-copernicus-reflectance"
    | "field-osm-natural"
    | "field-usda-crop-pricing"
    | "field-open-exchange-rates"
    | "field-world-bank-forests"
    | "field-regional-indicators"
    | "field-solar-energy"
    | "field-chilling-hours"
    | "field-wue"
    | "field-noaa-space-weather"
    | "field-iss-overhead"
    | "field-crop-library"
    | "field-marine-hydro"
    | "field-air-quality"
    | "field-openepi-fire"
    | "field-nasa-climatology"
    | "field-river-discharge"
    | "field-agri-soil"
    | "field-historical-archive"
    | "field-sunrise-sunset"
    | "field-plant-dictionary"
    | "field-gbif-occurrences"
    | "field-osm-reverse"
    | "field-client-ip"
    | "field-public-holidays"
    | "field-regional-sovereign"
    | "field-gbif-suggest"
    | "field-weather"
    | "field-subsoil-nutrient"

    | "settings"
    | "account"
    | "billing"
  >("parcels");

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

  useEffect(() => {
    // We don't auto-set activeParcelId unless needed inside a field view
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Save parcels to localStorage
  useEffect(() => {
    localStorage.setItem("mycrop_parcels", JSON.stringify(parcels));
  }, [parcels]);

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
      billingStatus: newParcel.billingStatus ?? "unpaid",
      billingCycle: newParcel.billingCycle ?? "monthly",
      billingAmount: Number(newParcel.billingAmount ?? 0),
      billingExpiration: "",
    };

    if (user && user.uid) {
      try {
        await createParcelForUser(user.uid, fresh);
      } catch (err) {
        console.error("Error creating parcel in Firestore:", err);
      }
    }

    setParcels([fresh, ...parcels]);
    setActivePage("parcels");
  };

  const handleSelectParcelForOverview = (parcel: Parcel) => {
    setActiveParcelId(parcel.id);
    setActivePage("field-overview");
  };

  const renderActivePage = () => {
    switch (activePage) {
      case "parcels":
        return (
          <Parcels
            parcels={parcels}
            onSelectParcel={handleSelectParcelForOverview}
            onNavigateToForm={() => setActivePage("parcel-form")}
            onNavigateTo3D={() => {}} // Remove global 3d view
          />
        );
      case "parcel-form":
        return (
          <ParcelForm
            onAddParcel={handleAddParcel}
            onNavigateBack={() => setActivePage("parcels")}
          />
        );
      case "field-overview":
        return (
          <Dashboard
            parcels={parcels}
            activeParcelId={activeParcelId || parcels[0]?.id || ""}
            onSelectParcel={(id) => setActiveParcelId(id)}
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-3d":
        return (
          <Field3DView
            parcels={parcels}
            initialSelectedParcelId={activeParcelId || undefined}
          />
        );
      case "field-ensemble":
        return (
          <EnsembleDispersion
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-decadal":
        return (
          <DecadalReanalysis
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-climate":
        return (
          <ClimateProjections
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-env":
        return (
          <EnvironmentalTelemetry
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-frost-risk":
        return (
          <FrostFreezeRisk
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-gdd":
        return (
          <GrowingDegreeDays
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-uv":
        return (
          <UvAndBoundaryLayer
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-allergen":
        return (
          <AllergenPollenForecasts
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-greenhouse":
        return (
          <GlobalGreenhouseGas
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-soil":
        return (
          <DiagnosticAnalytics
            parcels={parcels}
            activeParcelId={activeParcelId || parcels[0]?.id || ""}
            onSelectParcel={(id) => setActiveParcelId(id)}
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-crop-detection":
        return (
          <CropAutoDetection
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-pest-disease":
        return (
          <PestDiseaseRisk
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-lodging":
        return (
          <CropLodgingShear
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-stomatal":
        return (
          <StomatalConductance
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-par-ppfd":
        return (
          <ParPpfdData
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-pollinator":
        return (
          <PollinatorOutlooks
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-dictionary":
        return (
          <CropDictionary
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-openepi-soil":
        return (
          <OpenEpiSoilQuality
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-agronomic-et0":
        return (
          <AgronomicEvapotranspiration
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-soil-trafficability":
        return (
          <SoilTrafficability
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-soil-salinity":
        return (
          <SoilSalinityCapillary
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-nutrient-leaching":
        return (
          <AgronomicNutrientLeaching
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-flood-hydrology":
        return (
          <FloodHydrology
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-usgs-waterwatch":
        return (
          <USGSWaterWatch
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-cropland-fire-risk":
        return (
          <CroplandFireRisk
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-local-biodiversity":
        return (
          <LocalBiodiversity
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-nasa-eonet":
        return (
          <NasaEonetEvents
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-gdacs-hazards":
        return (
          <GdacsActiveHazards
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-usgs-seismic":
        return (
          <USGSSeismicMaps
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-copernicus-reflectance":
        return (
          <CopernicusReflectance
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-osm-natural":
        return (
          <OSMNaturalFeatures
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-usda-crop-pricing":
        return (
          <USDACropPricing
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-open-exchange-rates":
        return (
          <OpenExchangeRates
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-world-bank-forests":
        return (
          <WorldBankForests
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-regional-indicators":
        return (
          <RegionalIndicators
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-solar-energy":
        return (
          <SolarEnergyPotential
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-chilling-hours":
        return (
          <AgronomicChillingHours
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-wue":
        return (
          <CropWaterEfficiency
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-noaa-space-weather":
        return (
          <NoaaSpaceWeather
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-iss-overhead":
        return (
          <IssSatelliteOverhead
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-crop-library":
        return (
          <CropLiteratureLibrary
            onNavigate={(page) => setActivePage(page as any)}
          />
        );
      case "field-marine-hydro": return <MarineHydrodynamics />;
      case "field-air-quality": return <AirQualityAerosols />;
      case "field-openepi-fire": return <OpenEpiForestFire />;
      case "field-nasa-climatology": return <ClimatologyNasa />;
      case "field-river-discharge": return <RiverDischarge />;
      case "field-agri-soil": return <AgriSoilMoisture />;
      case "field-historical-archive": return <HistoricalArchive />;
      case "field-sunrise-sunset": return <SunriseSunsetAstronomy />;
      case "field-plant-dictionary": return <PlantDictionaryLookup />;
      case "field-gbif-occurrences": return <GbifLocalOccurrences />;
      case "field-osm-reverse": return <OsmReverseGeocode />;
      case "field-client-ip": return <ClientIpGeolocation />;
      case "field-public-holidays": return <LocalPublicHolidays />;
      case "field-regional-sovereign": return <RegionalCountrySovereign />;
      case "field-gbif-suggest": return <GbifSpeciesSuggest />;
      case "field-weather":
        return (
          <FieldWeatherPage
            parcels={parcels}
            activeParcelId={activeParcelId}
            onSelectParcel={(id) => setActiveParcelId(id)}
          />
        );
      case "field-subsoil-nutrient":
        return (
          <SubSoilProfileNutrientPortal
            parcels={parcels}
            activeParcelId={activeParcelId}
            onSelectParcel={(id) => setActiveParcelId(id)}
          />
        );
      case "settings":
        return <SettingsPage />;
      case "account":
        return <AccountSettingsPage />;
      case "billing":
        return <BillingConsole />;

      default:
        return (
          <Parcels
            parcels={parcels}
            onSelectParcel={handleSelectParcelForOverview}
            onNavigateToForm={() => setActivePage("parcel-form")}
            onNavigateTo3D={() => {}}
          />
        );
    }
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
              setActivePage("parcels");
              setActiveParcelId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "parcels" || activePage === "parcel-form"
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
              <button
                onClick={() => {
                  setActivePage("field-overview");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activePage === "field-overview"
                    ? "bg-emerald-50 text-brand-green"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Field Overview</span>
              </button>
              <button
                onClick={() => {
                  setActivePage("field-3d");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activePage === "field-3d"
                    ? "bg-emerald-50 text-brand-green"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>3D Terrain</span>
              </button>
              <button
                onClick={() => {
                  setActivePage("field-soil");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                  activePage === "field-soil"
                    ? "bg-emerald-50 text-brand-green"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Soil & Diagnostics</span>
              </button>
            </div>
          )}

          {/* Weather & Soil Category */}
          <div className="mt-4" id="weather-insights-sidebar-category">
            <button
              onClick={() => toggleCategory("weather")}
              className={`w-full flex justify-between items-center px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                expandedCategories.includes("weather") || activePage === "field-weather" || activePage === "field-subsoil-nutrient"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <CloudSun className="w-4.5 h-4.5 shrink-0" />
                <span>Weather & Soil</span>
              </div>
              {expandedCategories.includes("weather") || activePage === "field-weather" || activePage === "field-subsoil-nutrient" ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {(expandedCategories.includes("weather") || activePage === "field-weather" || activePage === "field-subsoil-nutrient") && (
              <div className="pl-4 pt-2 space-y-1.5 border-l-2 border-emerald-100 dark:border-emerald-900 ml-6 mt-1">
                <button
                  onClick={() => {
                    setActivePage("field-weather");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                    activePage === "field-weather"
                      ? "text-brand-green dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20"
                  }`}
                >
                  🌦️ Field Forecast
                </button>
                <button
                  onClick={() => {
                    setActivePage("field-subsoil-nutrient");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                    activePage === "field-subsoil-nutrient"
                      ? "text-brand-green dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 font-bold"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/20"
                  }`}
                >
                  🚜 Sub-Soil Profile
                </button>
              </div>
            )}
          </div>

          {/* Tools Nested Accordion */}
          <div className="mt-4">
            <button
              onClick={() => toggleCategory("science")}
              className={`w-full flex justify-between items-center px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                expandedCategories.includes("science")
                  ? "bg-purple-50 text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders className="w-4.5 h-4.5 shrink-0" />
                <span>Tools</span>
              </div>
              {expandedCategories.includes("science") ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {expandedCategories.includes("science") && (
              <div className="pl-4 pt-2 space-y-1.5 border-l-2 border-purple-100 ml-6 mt-1">
                {/* Category 1 */}
                <div>
                  <button
                    onClick={() => toggleCategory("science-weather")}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                      expandedCategories.includes("science-weather")
                        ? "text-purple-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">🌦️ Weather & Climate</span>
                    {expandedCategories.includes("science-weather") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>

                  {expandedCategories.includes("science-weather") && (
                    <div className="pl-3 space-y-1 mt-1 border-l border-purple-50 ml-3">
                      <button
                        onClick={() => {
                          setActivePage("field-ensemble");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-ensemble"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Ensemble Dispersion (30+ Models)
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-decadal");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-decadal"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Decadal Historical Reanalysis
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-climate");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-climate"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Long-Term Climate Projections
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-env");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-env"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Environmental Telemetry
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-frost-risk");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-frost-risk"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Frost/Freeze Risk
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-gdd");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-gdd"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Growing Degree Days (GDD)
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-solar-energy");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-solar-energy"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Solar Energy Potential
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-uv");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-uv"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        UV Radiation & Boundary Layer
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-allergen");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-allergen"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Allergen & Pollen Forecasts
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-greenhouse");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-greenhouse"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Global Greenhouse Gas Trends
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-noaa-space-weather");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-noaa-space-weather"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        NOAA Space Weather & GPS
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-iss-overhead");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-iss-overhead"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        ISS Space Tracking
                      </button>
                    </div>
                  )}
                </div>

                {/* Category 2 */}
                <div>
                  <button
                    onClick={() => toggleCategory("science-crop")}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                      expandedCategories.includes("science-crop")
                        ? "text-purple-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">🌱 Plant & Yield</span>
                    {expandedCategories.includes("science-crop") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {expandedCategories.includes("science-crop") && (
                    <div className="pl-3 space-y-1 mt-1 border-l border-purple-50 ml-3">
                      <button
                        onClick={() => {
                          setActivePage("field-crop-detection");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-crop-detection"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        Crop Auto-Detection API
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-pest-disease");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-pest-disease"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Pest & Disease Risk
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-lodging");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-lodging"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Crop Lodging Shear Risk
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-stomatal");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-stomatal"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Stomatal Conductance
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-par-ppfd");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-par-ppfd"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        PAR / PPFD Data
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-pollinator");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-pollinator"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Pollinator Outlooks
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-dictionary");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-dictionary"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Crop Dictionary
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-chilling-hours");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-chilling-hours"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Agronomic Chilling Hours
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-crop-library");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-crop-library"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Crop Literature Library
                      </button>
                    </div>
                  )}
                </div>

                {/* Category 3 */}
                <div>
                  <button
                    onClick={() => toggleCategory("science-soil")}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                      expandedCategories.includes("science-soil")
                        ? "text-purple-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">💧 Soil & Hydrology</span>
                    {expandedCategories.includes("science-soil") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {expandedCategories.includes("science-soil") && (
                    <div className="pl-3 space-y-1 mt-1 border-l border-purple-50 ml-3">
                      <button
                        onClick={() => {
                          setActivePage("field-agronomic-et0");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-agronomic-et0"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Agronomic Evapotranspiration
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-wue");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-wue"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Crop Water Efficiency
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-soil-trafficability");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-soil-trafficability"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Soil Trafficability
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-soil-salinity");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-soil-salinity"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Soil Salinity
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-nutrient-leaching");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-nutrient-leaching"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Agronomic Nutrient Leaching
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-flood-hydrology");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-flood-hydrology"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Flood Hydrology
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-usgs-waterwatch");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-usgs-waterwatch"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        USGS WaterWatch
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-openepi-soil");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-openepi-soil"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        OpenEPI Soil Conditions
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => toggleCategory("science-eco")}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                      expandedCategories.includes("science-eco")
                        ? "text-purple-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">🌍 Geo & Hazards</span>
                    {expandedCategories.includes("science-eco") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {expandedCategories.includes("science-eco") && (
                    <div className="pl-3 space-y-1 mt-1 border-l border-purple-50 ml-3">
                      <button
                        onClick={() => {
                          setActivePage("field-cropland-fire-risk");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-cropland-fire-risk"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Cropland Fire Risk
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-local-biodiversity");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-local-biodiversity"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Local Biodiversity
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-nasa-eonet");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-nasa-eonet"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        NASA EONET Events
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-gdacs-hazards");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-gdacs-hazards"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        GDACS Active Hazards
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-usgs-seismic");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-usgs-seismic"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        USGS Seismic Maps
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-copernicus-reflectance");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-copernicus-reflectance"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Copernicus Reflectance
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-osm-natural");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-osm-natural"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        OSM Natural Features
                      </button>
                    </div>
                  )}
                </div>

                {/* Category 5 */}
                <div>
                  <button
                    onClick={() => toggleCategory("science-markets")}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                      expandedCategories.includes("science-markets")
                        ? "text-purple-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">📉 Markets & Macro</span>
                    {expandedCategories.includes("science-markets") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {expandedCategories.includes("science-markets") && (
                    <div className="pl-3 space-y-1 mt-1 border-l border-purple-50 ml-3">
                      <button
                        onClick={() => {
                          setActivePage("field-usda-crop-pricing");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer mt-1 ${
                          activePage === "field-usda-crop-pricing"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        USDA Crop Pricing
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-open-exchange-rates");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-open-exchange-rates"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Open Exchange Rates
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-world-bank-forests");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-world-bank-forests"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        World Bank Forests
                      </button>
                      <button
                        onClick={() => {
                          setActivePage("field-regional-indicators");
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer ${
                          activePage === "field-regional-indicators"
                            ? "text-brand-green bg-emerald-50 font-bold"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                        }`}
                      >
                        Regional Indicators
                      </button>
                    </div>
                  )}
                </div>

                {/* Category 6 */}
                <div>
                  <button
                    onClick={() => toggleCategory("science-other")}
                    className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-[11px] font-bold transition-all text-left cursor-pointer ${
                      expandedCategories.includes("science-other")
                        ? "text-purple-700"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate">🔬 Core Open Data APIs</span>
                    {expandedCategories.includes("science-other") ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {expandedCategories.includes("science-other") && (
                    <div className="pl-3 space-y-1 mt-1 border-l border-purple-50 ml-3">
                      {[
                        { id: "field-marine-hydro", label: "Marine Hydrodynamics" },
                        { id: "field-air-quality", label: "Air Quality & Aerosols" },
                        { id: "field-openepi-fire", label: "OpenEPI Forest Fire Risk" },
                        { id: "field-nasa-climatology", label: "NASA Climatology" },
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
                      ].map((pageItem) => (
                        <button
                          key={pageItem.id}
                          onClick={() => {
                            setActivePage(pageItem.id as any);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full block px-3 py-1.5 rounded-md text-[10px] transition-all text-left cursor-pointer mt-1 ${
                            activePage === pageItem.id
                              ? "text-brand-green bg-emerald-50 font-bold"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          {pageItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          <div className="h-px bg-slate-100 my-4" />

          <button
            onClick={() => {
              setActivePage("billing");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "billing"
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Wallet className="w-4.5 h-4.5 shrink-0" />
            <span>{t("sidebar.billing")}</span>
          </button>

          <button
            onClick={() => {
              setActivePage("account");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "account"
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="w-4.5 h-4.5 shrink-0" />
            <span>{t("sidebar.accountSettings")}</span>
          </button>

          <button
            onClick={() => {
              setActivePage("settings");
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
              activePage === "settings"
                ? "bg-brand-green text-white shadow-md shadow-emerald-500/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <SettingsIcon className="w-4.5 h-4.5 shrink-0" />
            <span>{t("sidebar.controlSettings")}</span>
          </button>
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
        <div className="max-w-7xl mx-auto space-y-6">{renderActivePage()}</div>
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
