// GENERATED SHAPE, HAND-MAINTAINED CONTENT.
// One entry per tool. The catalog, the sidebar, the routes and the search
// index are all derived from this file, so a tool is added here and nowhere else.
//
// `sources` is the real upstream behind the tool, taken from the endpoint it
// calls. An empty `sources` with a `notice` means the tool is not backed by a
// live source yet -- the catalog shows that rather than hiding it.
import type { ComponentType } from "react";
import type { Parcel } from "../types";
import type { ToolLocation } from "./locationContextValue";

/** The contract every migrated tool page takes. */
export interface ToolProps {
  /** Null until somewhere is chosen. No city stands in for one. */
  location: ToolLocation | null;
  setLocation: (location: ToolLocation) => void;
  /** Supplied only to needs:"field" tools. */
  parcels?: Parcel[];
  activeParcelId?: string | null;
  onSelectParcel?: (id: string) => void;
}

export type ToolComponent = ComponentType<ToolProps>;

export interface DataSource {
  name: string;
  url: string;
}

/** What a tool needs before it can render anything. */
export type Needs = "location" | "field" | "none";

/** Whether the page takes ToolProps or no props at all. */
export type TakesProps = "tool" | "none";

export type CategoryId =
  | "weather"
  | "soil"
  | "season"
  | "water"
  | "hazards"
  | "ecology"
  | "markets"
  | "reference"
  | "utility";

export interface ToolMeta {
  /** URL segment: /tools/<slug>. Stable; treat a change as a breaking link. */
  slug: string;
  title: string;
  /** One sentence for the catalog card. */
  blurb: string;
  category: CategoryId;
  needs: Needs;
  sources: DataSource[];
  /** Extra search terms beyond the title and blurb. */
  keywords: string[];
  /** The pre-refactor path, kept as a redirect so shared links survive. */
  legacyPath: string;
  takesProps: TakesProps;
  /** Shown prominently by the tool header and the catalog card. */
  notice?: string;
  load: () => Promise<{ default: ToolComponent }>;
}

export interface Category {
  id: CategoryId;
  label: string;
  blurb: string;
}

export const CATEGORIES: Category[] = [
  { id: "weather", label: "Weather & Climate", blurb: "Forecasts, reanalysis, projections and the light and heat a season delivers." },
  { id: "soil", label: "Soil", blurb: "Composition, moisture, temperature and chemistry through the profile." },
  { id: "season", label: "Growing Season", blurb: "Thermal time, phenology and the stresses a standing crop meets." },
  { id: "water", label: "Water & Hydrology", blurb: "Irrigation demand, river flow and flood exposure." },
  { id: "hazards", label: "Risks & Hazards", blurb: "Pests, fire, disasters, seismicity and air quality." },
  { id: "ecology", label: "Ecology & Biodiversity", blurb: "Species, pollinators and the mapped landscape around a field." },
  { id: "markets", label: "Markets & Regional", blurb: "Prices, currencies and national agricultural context." },
  { id: "reference", label: "Reference", blurb: "Dictionaries and literature, static by design." },
  { id: "utility", label: "Location & Utilities", blurb: "Geocoding and lookups that support the other tools." },
];

const SOURCES = {
  bigDataCloud: { name: "BigDataCloud", url: "https://www.bigdatacloud.com" },
  eonet: { name: "NASA EONET", url: "https://eonet.gsfc.nasa.gov" },
  erApi: { name: "Exchange Rate API", url: "https://www.exchangerate-api.com" },
  gbif: { name: "GBIF", url: "https://www.gbif.org" },
  gdacs: { name: "GDACS", url: "https://www.gdacs.org" },
  gemini: { name: "Google Gemini", url: "https://ai.google.dev" },
  globalWarming: { name: "Global Warming API", url: "https://global-warming.org" },
  ipapi: { name: "ipapi.co", url: "https://ipapi.co" },
  nager: { name: "Nager.Date", url: "https://date.nager.at" },
  nasaPower: { name: "NASA POWER", url: "https://power.larc.nasa.gov" },
  noaaSwpc: { name: "NOAA Space Weather Prediction Center", url: "https://www.swpc.noaa.gov" },
  openEpi: { name: "OpenEPI", url: "https://openepi.io" },
  openLibrary: { name: "Open Library", url: "https://openlibrary.org" },
  openMeteo: { name: "Open-Meteo", url: "https://open-meteo.com" },
  overpass: { name: "OpenStreetMap Overpass", url: "https://overpass-api.de" },
  restCountries: { name: "REST Countries", url: "https://restcountries.com" },
  soilGrids: { name: "ISRIC SoilGrids", url: "https://soilgrids.org" },
  sunriseSunset: { name: "Sunrise-Sunset.org", url: "https://sunrise-sunset.org" },
  usgsNhd: { name: "USGS National Hydrography Dataset", url: "https://hydro.nationalmap.gov" },
  usgsQuake: { name: "USGS Earthquake Catalog", url: "https://earthquake.usgs.gov" },
  usgsWater: { name: "USGS Water Services", url: "https://waterservices.usgs.gov" },
  wheretheiss: { name: "WhereTheISS.at", url: "https://wheretheiss.at" },
  worldBank: { name: "World Bank Open Data", url: "https://data.worldbank.org" },
} as const satisfies Record<string, DataSource>;

export const TOOLS: ToolMeta[] = [
  {
    slug: "field-forecast",
    title: "Field Forecast",
    blurb:
      "Current conditions and a seven-day forecast for a field, with hourly temperature, wind and precipitation probability.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["weather", "forecast", "rain", "temperature", "wind"],
    legacyPath: "/field-weather",
    takesProps: "tool",
    load: () =>
      import("../pages/FieldWeatherPage") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "ensemble-dispersion",
    title: "Ensemble Dispersion",
    blurb:
      "Spread across 30+ numerical weather models, so you can see how much the forecasts disagree before trusting one.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["ensemble", "models", "spread", "uncertainty", "forecast"],
    legacyPath: "/field-ensemble",
    takesProps: "tool",
    load: () =>
      import("../pages/EnsembleDispersion") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "decadal-reanalysis",
    title: "Decadal Reanalysis",
    blurb:
      "Decades of reconstructed daily weather for one point, for comparing this season against the long record.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["historical", "reanalysis", "decades", "climate", "archive"],
    legacyPath: "/field-decadal",
    takesProps: "tool",
    load: () =>
      import("../pages/DecadalReanalysis") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "climate-projections",
    title: "Climate Projections",
    blurb:
      "Downscaled CMIP6 climate model output to mid-century for a location.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["climate", "projection", "cmip", "scenario", "future"],
    legacyPath: "/field-climate",
    takesProps: "tool",
    load: () =>
      import("../pages/ClimateProjections") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "climatology",
    title: "Climatology",
    blurb:
      "Long-term monthly climate normals from NASA POWER: the baseline a season gets judged against.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.nasaPower],
    keywords: ["climatology", "normals", "averages", "nasa", "power"],
    legacyPath: "/field-nasa-climatology",
    takesProps: "tool",
    load: () =>
      import("../pages/ClimatologyNasa") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "historical-archive",
    title: "Historical Archive",
    blurb:
      "Daily observed weather for any past date range at a location.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["history", "archive", "past", "observations"],
    legacyPath: "/field-historical-archive",
    takesProps: "tool",
    load: () =>
      import("../pages/HistoricalArchive") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "current-conditions",
    title: "Current Conditions",
    blurb:
      "Present-moment weather and air readings for a location, pulled fresh on each request.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["conditions", "now", "current", "humidity", "air"],
    legacyPath: "/field-env",
    takesProps: "tool",
    load: () =>
      import("../pages/EnvironmentalTelemetry") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "uv-boundary-layer",
    title: "UV & Boundary Layer",
    blurb:
      "UV index and atmospheric boundary-layer depth, the pair that decides whether spray drifts or settles.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["uv", "radiation", "boundary layer", "spraying", "inversion"],
    legacyPath: "/field-uv",
    takesProps: "tool",
    load: () =>
      import("../pages/UvAndBoundaryLayer") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "greenhouse-gas-trends",
    title: "Greenhouse Gas Trends",
    blurb:
      "Global CO2, methane and nitrous oxide concentration trends. Global series, not local readings.",
    category: "weather",
    needs: "none",
    sources: [SOURCES.globalWarming],
    keywords: ["co2", "methane", "greenhouse", "emissions", "global"],
    legacyPath: "/field-greenhouse",
    takesProps: "none",
    load: () =>
      import("../pages/GlobalGreenhouseGas") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "sunrise-astronomy",
    title: "Sunrise & Astronomy",
    blurb:
      "Sunrise, sunset, twilight bounds and day length for a location and date.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.sunriseSunset],
    keywords: ["sunrise", "sunset", "daylight", "twilight", "photoperiod"],
    legacyPath: "/field-sunrise-sunset",
    takesProps: "tool",
    load: () =>
      import("../pages/SunriseSunsetAstronomy") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "solar-energy-potential",
    title: "Solar Energy Potential",
    blurb:
      "Shortwave irradiance over the coming week, and the yield a modest panel array would produce from it.",
    category: "weather",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["solar", "irradiance", "pv", "panels", "pumping"],
    legacyPath: "/field-solar-energy",
    takesProps: "tool",
    load: () =>
      import("../pages/SolarEnergyPotential") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "soil-composition",
    title: "Soil Composition & Texture",
    blurb:
      "Clay, sand, silt, organic carbon, pH and bulk density down six depth layers to two metres.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.soilGrids],
    keywords: ["soil", "clay", "sand", "silt", "texture", "ph"],
    legacyPath: "/soil-composition",
    takesProps: "tool",
    load: () =>
      import("../pages/SoilCompositionTexture") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "soil-organic-carbon",
    title: "Soil Organic Carbon",
    blurb:
      "Soil organic carbon by depth, the stock that governs water holding and fertility.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.soilGrids],
    keywords: ["carbon", "soc", "organic matter", "sequestration"],
    legacyPath: "/soil-organic-carbon",
    takesProps: "tool",
    load: () =>
      import("../pages/SoilOrganicCarbon") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "deep-soil-temperature",
    title: "Deep Soil Temperature",
    blurb:
      "Soil temperature at several depths, for germination timing and root-zone conditions.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["soil temperature", "root zone", "germination", "depth"],
    legacyPath: "/field-deep-soil-temp",
    takesProps: "tool",
    load: () =>
      import("../pages/DeepSoilTemperature") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "soil-moisture",
    title: "Soil Moisture",
    blurb:
      "Volumetric soil moisture through the profile, past and forecast.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["moisture", "water content", "irrigation", "volumetric"],
    legacyPath: "/field-agri-soil",
    takesProps: "tool",
    load: () =>
      import("../pages/AgriSoilMoisture") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "soil-salinity",
    title: "Soil Salinity",
    blurb:
      "Salinity risk from capillary rise, driven by evaporation against rainfall leaching.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["salinity", "salt", "capillary", "evaporation"],
    legacyPath: "/field-soil-salinity",
    takesProps: "tool",
    load: () =>
      import("../pages/SoilSalinityCapillary") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "soil-trafficability",
    title: "Soil Trafficability",
    blurb:
      "Whether the ground is dry enough to carry machinery without compacting it.",
    category: "soil",
    needs: "location",
    sources: [],
    keywords: ["trafficability", "machinery", "compaction", "field access"],
    legacyPath: "/field-soil-trafficability",
    takesProps: "tool",
    notice:
      "Not working: the page calls /api/soil-trafficability, which does not exist in server.ts. Needs implementing or removing.",
    load: () =>
      import("../pages/SoilTrafficability") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "nutrient-leaching",
    title: "Nutrient Leaching",
    blurb:
      "Leaching risk for applied nutrients, from rainfall and drainage against the soil's holding capacity.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["leaching", "nitrate", "runoff", "fertiliser", "drainage"],
    legacyPath: "/field-nutrient-leaching",
    takesProps: "tool",
    load: () =>
      import("../pages/AgronomicNutrientLeaching") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "agronomic-soil-health",
    title: "Agronomic Soil Health",
    blurb:
      "Surface and root-zone soil wetness plus the energy balance above it, from NASA POWER.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.nasaPower],
    keywords: ["soil health", "nasa", "surface", "wetness", "root zone"],
    legacyPath: "/nasa-agronomic-soil",
    takesProps: "tool",
    load: () =>
      import("../pages/NasaAgronomicSoil") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "soil-conditions",
    title: "Soil Conditions",
    blurb:
      "WRB soil class and measured topsoil properties for a location.",
    category: "soil",
    needs: "location",
    sources: [SOURCES.openEpi, SOURCES.soilGrids],
    keywords: ["soil", "wrb", "taxonomy", "classification", "openepi"],
    legacyPath: "/field-openepi-soil",
    takesProps: "tool",
    load: () =>
      import("../pages/OpenEpiSoilQuality") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "growing-degree-days",
    title: "Growing Degree Days",
    blurb:
      "Accumulated thermal time against a crop's base temperature, and the growth stage it implies.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["gdd", "heat units", "phenology", "crop stage", "thermal time"],
    legacyPath: "/field-gdd",
    takesProps: "tool",
    load: () =>
      import("../pages/GrowingDegreeDays") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "chilling-hours",
    title: "Chilling Hours",
    blurb:
      "Winter chill accumulation for orchard and vine crops that need it to break dormancy.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["chilling", "dormancy", "fruit", "orchard", "vernalisation"],
    legacyPath: "/field-chilling-hours",
    takesProps: "tool",
    load: () =>
      import("../pages/AgronomicChillingHours") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "frost-freeze-risk",
    title: "Frost & Freeze Risk",
    blurb:
      "Overnight frost and hard-freeze risk across the forecast window, with the damage threshold per crop stage.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["frost", "freeze", "cold", "damage", "minimum temperature"],
    legacyPath: "/field-frost-risk",
    takesProps: "tool",
    load: () =>
      import("../pages/FrostFreezeRisk") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "par-ppfd",
    title: "PAR / PPFD",
    blurb:
      "Photosynthetically active radiation reaching the canopy, as daily light integral and instantaneous flux.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["par", "ppfd", "light", "photosynthesis", "quantum"],
    legacyPath: "/field-par-ppfd",
    takesProps: "tool",
    load: () =>
      import("../pages/ParPpfdData") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "stomatal-conductance",
    title: "Stomatal Conductance",
    blurb:
      "Modelled canopy stomatal conductance from vapour pressure deficit: how freely the crop is breathing.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["stomata", "transpiration", "vpd", "water stress", "canopy"],
    legacyPath: "/field-stomatal",
    takesProps: "tool",
    load: () =>
      import("../pages/StomatalConductance") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "lodging-shear-risk",
    title: "Lodging Shear Risk",
    blurb:
      "Wind shear against stem strength at the current crop height, for standing-crop collapse risk.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["lodging", "wind", "stem", "shear", "collapse"],
    legacyPath: "/field-lodging",
    takesProps: "tool",
    load: () =>
      import("../pages/CropLodgingShear") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "crop-auto-detection",
    title: "Crop Auto-Detection",
    blurb:
      "Suggests the likely crop for a location from its climate and regional context.",
    category: "season",
    needs: "location",
    sources: [SOURCES.gemini],
    keywords: ["crop", "identify", "detection", "ai", "image"],
    legacyPath: "/field-crop-detection",
    takesProps: "tool",
    notice:
      "Needs a Gemini API key. Without one it falls back to a regional heuristic and says so.",
    load: () =>
      import("../pages/CropAutoDetection") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "water-use-efficiency",
    title: "Water-Use Efficiency",
    blurb:
      "Biomass produced per unit of water transpired, for judging irrigation return.",
    category: "season",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["wue", "water efficiency", "yield per mm", "irrigation"],
    legacyPath: "/field-wue",
    takesProps: "tool",
    load: () =>
      import("../pages/CropWaterEfficiency") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "evapotranspiration",
    title: "Evapotranspiration",
    blurb:
      "Reference evapotranspiration and crop water demand, the basis of an irrigation schedule.",
    category: "water",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["et0", "evapotranspiration", "irrigation", "water demand", "penman"],
    legacyPath: "/field-agronomic-et0",
    takesProps: "tool",
    load: () =>
      import("../pages/AgronomicEvapotranspiration") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "flood-hydrology",
    title: "Flood Hydrology",
    blurb:
      "River discharge forecasts and return-period context for flood risk near a field.",
    category: "water",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["flood", "inundation", "river", "discharge", "risk"],
    legacyPath: "/field-flood-hydrology",
    takesProps: "tool",
    load: () =>
      import("../pages/FloodHydrology") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "river-discharge",
    title: "River Discharge",
    blurb:
      "Daily river discharge for the catchment containing a location, past and forecast.",
    category: "water",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["river", "discharge", "flow", "catchment", "streamflow"],
    legacyPath: "/field-river-discharge",
    takesProps: "tool",
    load: () =>
      import("../pages/RiverDischarge") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "usgs-waterwatch",
    title: "USGS WaterWatch",
    blurb:
      "Nearby USGS stream gauges and their current flow against historical percentiles. United States only.",
    category: "water",
    needs: "location",
    sources: [SOURCES.usgsWater, SOURCES.usgsNhd],
    keywords: ["usgs", "streamflow", "gauge", "waterwatch", "hydrology"],
    legacyPath: "/field-usgs-waterwatch",
    takesProps: "tool",
    load: () =>
      import("../pages/USGSWaterWatch") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "marine-hydrodynamics",
    title: "Marine Hydrodynamics",
    blurb:
      "Wave height, period and direction plus sea surface temperature for coastal locations.",
    category: "water",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["marine", "waves", "sea", "swell", "coastal"],
    legacyPath: "/field-marine-hydro",
    takesProps: "tool",
    load: () =>
      import("../pages/MarineHydrodynamics") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "pest-disease-risk",
    title: "Pest & Disease Risk",
    blurb:
      "Infection pressure for common fungal and pest problems, from the temperature and humidity they need.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["pest", "disease", "fungal", "blight", "infection", "spray"],
    legacyPath: "/field-pest-disease",
    takesProps: "tool",
    load: () =>
      import("../pages/PestDiseaseRisk") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "cropland-fire-risk",
    title: "Cropland Fire Risk",
    blurb:
      "Ignition and spread risk over dry cropland, from fuel dryness, wind and humidity.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["fire", "stubble", "drought", "ignition", "harvest"],
    legacyPath: "/field-cropland-fire-risk",
    takesProps: "tool",
    load: () =>
      import("../pages/CroplandFireRisk") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "forest-fire-risk",
    title: "Forest Fire Risk",
    blurb:
      "Fire danger index for wooded land around a location.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.openEpi],
    keywords: ["fire", "forest", "wildfire", "danger index"],
    legacyPath: "/field-openepi-fire",
    takesProps: "tool",
    load: () =>
      import("../pages/OpenEpiForestFire") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "gdacs-hazards",
    title: "GDACS Active Hazards",
    blurb:
      "Active disaster alerts worldwide, filtered to those within reach of a location.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.gdacs],
    keywords: ["disaster", "hazard", "alert", "cyclone", "flood", "earthquake"],
    legacyPath: "/field-gdacs-hazards",
    takesProps: "tool",
    load: () =>
      import("../pages/GdacsActiveHazards") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "eonet-events",
    title: "Environmental Events",
    blurb:
      "Natural events NASA is tracking worldwide right now: fires, storms, volcanic activity, each with its own location.",
    category: "hazards",
    needs: "none",
    sources: [SOURCES.eonet],
    keywords: ["events", "wildfire", "storm", "volcano", "nasa", "eonet"],
    legacyPath: "/field-nasa-eonet",
    takesProps: "none",
    load: () =>
      import("../pages/NasaEonetEvents") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "seismic-maps",
    title: "Seismic Maps",
    blurb:
      "Recent earthquakes within a radius of a location, with magnitude and depth.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.usgsQuake],
    keywords: ["earthquake", "seismic", "magnitude", "usgs", "tremor"],
    legacyPath: "/field-usgs-seismic",
    takesProps: "tool",
    load: () =>
      import("../pages/USGSSeismicMaps") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "space-weather",
    title: "Space Weather",
    blurb:
      "Geomagnetic activity from NOAA SWPC, which is what degrades RTK and GPS guidance accuracy.",
    category: "hazards",
    needs: "none",
    sources: [SOURCES.noaaSwpc],
    keywords: ["space weather", "kp", "geomagnetic", "gps", "solar storm"],
    legacyPath: "/field-noaa-space-weather",
    takesProps: "none",
    load: () =>
      import("../pages/NoaaSpaceWeather") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "air-quality",
    title: "Air Quality & Aerosols",
    blurb:
      "Particulates, ozone and aerosol load for a location, with the standard AQI banding.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["air quality", "aqi", "pm2.5", "ozone", "dust", "aerosol"],
    legacyPath: "/field-air-quality",
    takesProps: "tool",
    load: () =>
      import("../pages/AirQualityAerosols") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "allergens-pollen",
    title: "Allergens & Pollen",
    blurb:
      "Pollen forecasts by species: grass, tree and weed loads over the coming days.",
    category: "hazards",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["pollen", "allergen", "grass", "birch", "ragweed"],
    legacyPath: "/field-allergen",
    takesProps: "tool",
    load: () =>
      import("../pages/AllergenPollenForecasts") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "local-biodiversity",
    title: "Local Biodiversity",
    blurb:
      "Species recorded near a location, grouped into pollinators, pest predators and the rest.",
    category: "ecology",
    needs: "location",
    sources: [SOURCES.gbif],
    keywords: ["biodiversity", "species", "pollinators", "predators", "ecology"],
    legacyPath: "/field-local-biodiversity",
    takesProps: "tool",
    load: () =>
      import("../pages/LocalBiodiversity") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "gbif-occurrences",
    title: "GBIF Occurrences",
    blurb:
      "Raw biodiversity occurrence records near a point, straight from GBIF.",
    category: "ecology",
    needs: "location",
    sources: [SOURCES.gbif],
    keywords: ["gbif", "occurrence", "records", "sightings", "species"],
    legacyPath: "/field-gbif-occurrences",
    takesProps: "tool",
    load: () =>
      import("../pages/GbifLocalOccurrences") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "gbif-species-suggest",
    title: "GBIF Species Suggest",
    blurb:
      "Type a common or scientific name and get matching GBIF taxa.",
    category: "ecology",
    needs: "none",
    sources: [SOURCES.gbif],
    keywords: ["species", "taxonomy", "lookup", "scientific name"],
    legacyPath: "/field-gbif-suggest",
    takesProps: "none",
    load: () =>
      import("../pages/GbifSpeciesSuggest") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "pollinator-outlooks",
    title: "Pollinator Outlooks",
    blurb:
      "Whether the coming days suit pollinator flight: the temperature, wind and rain windows bees will use.",
    category: "ecology",
    needs: "location",
    sources: [SOURCES.openMeteo],
    keywords: ["pollinator", "bees", "flight", "foraging", "orchard"],
    legacyPath: "/field-pollinator",
    takesProps: "tool",
    load: () =>
      import("../pages/PollinatorOutlooks") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "osm-natural-features",
    title: "OSM Natural Features",
    blurb:
      "Mapped natural features around a field: woodland, water, hedgerows and wetland.",
    category: "ecology",
    needs: "location",
    sources: [SOURCES.overpass],
    keywords: ["osm", "hedgerow", "woodland", "water", "landscape", "buffer"],
    legacyPath: "/field-osm-natural",
    takesProps: "tool",
    load: () =>
      import("../pages/OSMNaturalFeatures") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "world-bank-forests",
    title: "World Bank Forests",
    blurb:
      "National forest cover and how it has changed over decades. Country-level, not field-level.",
    category: "ecology",
    needs: "location",
    sources: [SOURCES.worldBank, SOURCES.bigDataCloud],
    keywords: ["forest", "deforestation", "land use", "country", "world bank"],
    legacyPath: "/field-world-bank-forests",
    takesProps: "tool",
    load: () =>
      import("../pages/WorldBankForests") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "usda-crop-pricing",
    title: "Crop Pricing",
    blurb:
      "Reference contract prices and yield indices for major commodity crops.",
    category: "markets",
    needs: "none",
    sources: [],
    keywords: ["price", "market", "commodity", "bushel", "futures"],
    legacyPath: "/field-usda-crop-pricing",
    takesProps: "none",
    notice:
      "Static reference figures held in server.ts, not a live USDA feed. Wire a real source or relabel it.",
    load: () =>
      import("../pages/USDACropPricing") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "exchange-rates",
    title: "Exchange Rates",
    blurb:
      "Current currency rates, for pricing inputs and produce across borders.",
    category: "markets",
    needs: "none",
    sources: [SOURCES.erApi],
    keywords: ["currency", "fx", "exchange", "rates", "conversion"],
    legacyPath: "/field-open-exchange-rates",
    takesProps: "none",
    load: () =>
      import("../pages/OpenExchangeRates") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "regional-indicators",
    title: "Regional Indicators",
    blurb:
      "National agricultural indicators for the country a location falls in: fertiliser use, land area, policy context.",
    category: "markets",
    needs: "location",
    sources: [SOURCES.worldBank, SOURCES.bigDataCloud, SOURCES.sunriseSunset, SOURCES.usgsQuake],
    keywords: ["indicators", "fertiliser", "policy", "macro", "country"],
    legacyPath: "/field-regional-indicators",
    takesProps: "tool",
    load: () =>
      import("../pages/RegionalIndicators") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "sovereign-metadata",
    title: "Sovereign Metadata",
    blurb:
      "Country reference data: currencies, languages, borders, region and subregion.",
    category: "markets",
    needs: "none",
    sources: [SOURCES.restCountries],
    keywords: ["country", "currency", "region", "borders", "metadata"],
    legacyPath: "/field-regional-sovereign",
    takesProps: "none",
    load: () =>
      import("../pages/RegionalCountrySovereign") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "public-holidays",
    title: "Public Holidays",
    blurb:
      "Public holidays for a country and year, for planning labour around them.",
    category: "markets",
    needs: "none",
    sources: [SOURCES.nager],
    keywords: ["holidays", "calendar", "labour", "shifts", "planning"],
    legacyPath: "/field-public-holidays",
    takesProps: "none",
    load: () =>
      import("../pages/LocalPublicHolidays") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "crop-dictionary",
    title: "Crop Dictionary",
    blurb:
      "Reference entries per crop: pH range, water requirement and growth duration.",
    category: "reference",
    needs: "none",
    sources: [],
    keywords: ["crop", "dictionary", "reference", "ph range", "water requirement"],
    legacyPath: "/field-dictionary",
    takesProps: "none",
    notice:
      "A static reference table, deliberately. Not a measurement of anywhere.",
    load: () =>
      import("../pages/CropDictionary") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "plant-dictionary",
    title: "Plant Dictionary",
    blurb:
      "Look up a plant species and see its accepted taxonomy and distribution.",
    category: "reference",
    needs: "none",
    sources: [SOURCES.gbif],
    keywords: ["plant", "species", "lookup", "taxonomy", "botany"],
    legacyPath: "/field-plant-dictionary",
    takesProps: "none",
    load: () =>
      import("../pages/PlantDictionaryLookup") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "crop-literature",
    title: "Crop Literature Library",
    blurb:
      "Agronomy handbooks and monographs for a crop or topic, searched against Open Library.",
    category: "reference",
    needs: "none",
    sources: [SOURCES.openLibrary],
    keywords: ["books", "literature", "handbook", "agronomy", "reading"],
    legacyPath: "/field-crop-library",
    takesProps: "none",
    load: () =>
      import("../pages/CropLiteratureLibrary") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "reverse-geocode",
    title: "Reverse Geocoding",
    blurb:
      "Turn coordinates into a place name, administrative area and country.",
    category: "utility",
    needs: "location",
    sources: [SOURCES.bigDataCloud],
    keywords: ["geocode", "address", "place", "coordinates", "locality"],
    legacyPath: "/field-osm-reverse",
    takesProps: "tool",
    load: () =>
      import("../pages/OsmReverseGeocode") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "ip-geolocation",
    title: "IP Geolocation",
    blurb:
      "Approximate location from the requesting IP address. A utility, not an agronomy tool.",
    category: "utility",
    needs: "none",
    sources: [SOURCES.ipapi],
    keywords: ["ip", "location", "network", "approximate"],
    legacyPath: "/field-client-ip",
    takesProps: "tool",
    load: () =>
      import("../pages/ClientIpGeolocation") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "iss-overhead",
    title: "ISS Overhead",
    blurb:
      "Where the International Space Station is now and whether it passes near a location.",
    category: "utility",
    needs: "location",
    sources: [SOURCES.wheretheiss],
    keywords: ["iss", "satellite", "orbit", "overhead", "space station"],
    legacyPath: "/field-iss-overhead",
    takesProps: "tool",
    load: () =>
      import("../pages/IssSatelliteOverhead") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
  {
    slug: "satellite-reflectance",
    title: "Satellite Reflectance",
    blurb:
      "Vegetation, water and bare-soil indices for a field.",
    category: "utility",
    needs: "location",
    sources: [],
    keywords: ["ndvi", "ndwi", "sentinel", "copernicus", "vegetation index"],
    legacyPath: "/field-copernicus-reflectance",
    takesProps: "tool",
    notice:
      "Not measured: these indices are derived from the coordinates alone, because this deployment has no Copernicus Data Space credentials. Wire real imagery or retire the tool.",
    load: () =>
      import("../pages/CopernicusReflectance") as unknown as Promise<{
        default: ToolComponent;
      }>,
  },
];

export const TOOLS_BY_SLUG: Record<string, ToolMeta> = Object.fromEntries(
  TOOLS.map((t) => [t.slug, t]),
);

/** Pre-refactor path -> new slug, for the sidebar and the redirect routes. */
export const SLUG_BY_LEGACY_PATH: Record<string, string> = Object.fromEntries(
  TOOLS.map((t) => [t.legacyPath, t.slug]),
);

/**
 * Where a sidebar entry should point. Nav ids predate the registry, so an id
 * that maps to a tool resolves to its new path and anything else is left alone.
 */
export function navPathFor(navId: string): string {
  const slug = SLUG_BY_LEGACY_PATH["/" + navId];
  return slug ? "/tools/" + slug : "/" + navId;
}

export function toolsInCategory(id: CategoryId): ToolMeta[] {
  return TOOLS.filter((t) => t.category === id);
}

/** Case-insensitive match over title, blurb, keywords and source names. */
export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  const terms = q.split(/\s+/);
  return TOOLS.filter((t) => {
    const haystack = [
      t.title,
      t.blurb,
      ...t.keywords,
      ...t.sources.map((s) => s.name),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
