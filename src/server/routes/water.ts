// water endpoints, split out of the single server.ts.
import { Router } from "express";
import { num, leadingComplete, realSeries } from "../series";

export const router = Router();

router.post("/api/flood-hydrology", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Missing lat/lng parameters" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let riverDischarge: number[] = [];
    let dates: string[] = [];
    let isLiveDevice = false;

    try {
      const url = `https://flood-api.open-meteo.com/v1/flood?latitude=${latitude}&longitude=${longitude}&daily=river_discharge&forecast_days=7`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.river_discharge && data.daily.time) {
          // Cut at the first day GloFAS has no value for — a missing day is
          // unknown, not "0 m³/s" (which would read as a dry river).
          const n = leadingComplete(data.daily.river_discharge);
          riverDischarge = realSeries(data.daily.river_discharge, n, 2);
          dates = data.daily.time.slice(0, n);
          isLiveDevice = n > 0;
        }
      }
    } catch (e) {
      console.warn("Flood API unavailable:", e);
    }

    if (!isLiveDevice || riverDischarge.length === 0) {
      return res.status(502).json({ error: "Failed to gather river discharge metrics from the GloFAS flood provider." });
    }

    // Classify flood warning category
    const maxDischarge = Math.max(...riverDischarge);
    const meanDischarge = riverDischarge.reduce((a, b) => a + b, 0) / riverDischarge.length;
    let riskLevel: "Normal Flow" | "Action Stage" | "Minor Flood Warning" | "Major Inundation Alert" = "Normal Flow";
    
    if (maxDischarge > meanDischarge * 1.6) {
      riskLevel = "Major Inundation Alert";
    } else if (maxDischarge > meanDischarge * 1.35) {
      riskLevel = "Minor Flood Warning";
    } else if (maxDischarge > meanDischarge * 1.15) {
      riskLevel = "Action Stage";
    }

    res.json({
      latitude,
      longitude,
      dates,
      riverDischarge,
      riskLevel,
      maxDischarge,
      meanDischarge,
      isLiveDevice,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Hydrological computation failed:", error);
    res.status(500).json({ error: "Failed to resolve river discharge hydrology" });
  }
});

// API Endpoint: Get 30-Year Climate Projection trends for 2050 (CMIP6 Models)

router.post("/api/marine-hydrodynamics", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let waveHeightMax: number | undefined;
    let wavePeriod: number | null = null;
    let waveDirection: string | null = null;
    let seaSurfaceTemp: number | null = null;
    let isCoastalZone = false;

    try {
      // Query Open-Meteo Marine API
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&daily=wave_height_max,wave_direction_dominant,wave_period_max&current=sea_surface_temperature&timezone=auto`;
      const response = await fetch(marineUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.wave_height_max) {
          const maxH = data.daily.wave_height_max[0];
          if (maxH !== null && maxH !== undefined) {
            waveHeightMax = parseFloat(maxH.toFixed(2));
            wavePeriod = num(data.daily.wave_period_max?.[0]);
            const angleVal = num(data.daily.wave_direction_dominant?.[0], 0);
            if (angleVal !== null) {
              const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
              waveDirection = directions[Math.round(angleVal / 22.5) % 16];
            }
            seaSurfaceTemp = num(data.current?.sea_surface_temperature);
            isCoastalZone = true;
          }
        }
      }
    } catch (e) {
      console.warn("Marine wave telemetry failed:", e);
    }

    if (!isCoastalZone || waveHeightMax === undefined) {
      return res.status(502).json({ error: "No marine wave data available for this location (it may not be a coastal or marine area, or the marine forecast provider is unavailable)." });
    }

    // Sea surface temperature comes from the marine model (an earlier
    // version estimated it from latitude alone). Null if not provided.

    // Evaluate Risk Levels & Suitability for coastal marine agriculture (Aquaculture)
    let turbulenceRisk: "Very Calm" | "Moderate Surge" | "Storm Swell Warning" = "Very Calm";
    if (waveHeightMax > 2.5) {
      turbulenceRisk = "Storm Swell Warning";
    } else if (waveHeightMax > 1.2) {
      turbulenceRisk = "Moderate Surge";
    }

    // Suitability calculations
    const kelpSuitability = seaSurfaceTemp === null ? "Unknown (no sea temperature)" : (seaSurfaceTemp < 20.0 && waveHeightMax < 3.0) ? "Optimal (Cool nutrient-dense flow)" : "Poor (Excess thermal stress)";
    const oysterSuitability = seaSurfaceTemp === null ? "Unknown (no sea temperature)" : (seaSurfaceTemp > 12.0 && waveHeightMax < 1.5) ? "Optimal (Protected estuary zone)" : "Sub-optimal (Exposed swell dynamics)";
    const seaPenSuitability = (waveHeightMax < 2.0) ? "Good (Stable structural safety)" : "Hazardous (Extreme structural sheer stress)";

    res.json({
      latitude,
      longitude,
      waveHeightMax,
      wavePeriod,
      waveDirection,
      seaSurfaceTemp,
      isCoastalZone,
      turbulenceRisk,
      aquacultureSuitability: {
        kelp: kelpSuitability,
        oysters: oysterSuitability,
        seaPens: seaPenSuitability
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Marine extraction failed:", error);
    res.status(500).json({ error: "Failed to resolve coastal marine hydrodynamics parameters" });
  }
});

// API Endpoint: Get Localized AQI Copernicus Air Quality & Suspended Particulates

router.post("/api/agronomic-evapotranspiration", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let et0Values: number[] = [];
    let dates: string[] = [];
    let soilMoisture0to10cm: number | null = null;
    let isLiveAgro = false;

    try {
      const apiUr = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=et0_fao_evapotranspiration,soil_moisture_0_to_10cm&timezone=auto`;
      const response = await fetch(apiUr);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.et0_fao_evapotranspiration) {
          const n = leadingComplete(data.daily.et0_fao_evapotranspiration);
          et0Values = realSeries(data.daily.et0_fao_evapotranspiration, n, 2);
          dates = (data.daily.time || []).slice(0, n);
          // Missing soil moisture stays null: the stress index below needs a
          // real reading, not an assumed 28%.
          soilMoisture0to10cm = num(data.daily.soil_moisture_0_to_10cm?.[0], 3);
          isLiveAgro = n > 0;
        }
      }
    } catch (e) {
      console.warn("FAO ET0 endpoint failed:", e);
    }

    if (!isLiveAgro || et0Values.length === 0) {
      return res.status(502).json({ error: "Failed to download ET0 metrics from the upstream Open-Meteo weather provider." });
    }

    // Crop Water Stress Index estimation
    const avgEt0 = parseFloat((et0Values.reduce((sum, v) => sum + v, 0) / et0Values.length).toFixed(2));
    // A simple dryness index from modelled topsoil moisture, relative to an
    // assumed 0.40 m³/m³ "wet" reference. Null when there's no soil reading.
    const cropWaterStressIndex = soilMoisture0to10cm === null
      ? null
      : parseFloat(Math.min(1.0, Math.max(0.0, 1.0 - (soilMoisture0to10cm / 0.4))).toFixed(2));

    let waterStressIndicator: "Adequate Moisture" | "Incipient Stress" | "Severe Wilting Susceptibility" | null = null;
    if (cropWaterStressIndex !== null) {
      waterStressIndicator = "Adequate Moisture";
      if (cropWaterStressIndex > 0.65) {
        waterStressIndicator = "Severe Wilting Susceptibility";
      } else if (cropWaterStressIndex > 0.35) {
        waterStressIndicator = "Incipient Stress";
      }
    }

    res.json({
      latitude,
      longitude,
      dates,
      et0Values,
      avgEt0,
      soilMoisture0to10cm,
      cropWaterStressIndex,
      waterStressIndicator,
      isLiveAgro,
      faoDisclaimer: "Calculation modeled using Penman-Monteith equation (FAO-56 standard) for grass reference canopy."
    });
  } catch (error: any) {
    console.error("Agronomy ET0 calculation failure:", error);
    res.status(500).json({ error: "Failed to map FAO Evapotranspiration dynamics" });
  }
});

// API Endpoint: Get Pest & Disease Risk Indexes (Agrometeorological Spore & Vector Viability)

router.post("/api/openmeteo-river-discharge", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to match Global Flood forecasting grids" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let dischargeValue = 0;
    let forecast: number[] = [];

    try {
      const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${latitude}&longitude=${longitude}&daily=river_discharge&forecast_days=7&timezone=auto`;
      const response = await fetch(floodUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && json.daily && json.daily.river_discharge) {
          // Cut at the first missing day (filtering nulls out would shift
          // later days onto the wrong dates).
          const n = leadingComplete(json.daily.river_discharge);
          forecast = realSeries(json.daily.river_discharge, n, 2);
          if (n > 0) {
            dischargeValue = forecast[0];
            lives = true;
          }
        }
      }
    } catch (e) {
      console.warn("Open-Meteo Flood API call had network issues:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to assemble hydrologic river profiles from the upstream dataset provider." });
    }

    let floodSeverity = "No Threat Detected";
    if (dischargeValue > 450.0) floodSeverity = "Extreme Basin Overrun";
    else if (dischargeValue > 150.0) floodSeverity = "Severe Inundation Watch";
    else if (dischargeValue > 40.0) floodSeverity = "Moderate Channel Swelling";
    else if (dischargeValue > 5.0) floodSeverity = "Stable Hydrologic Runoff";

    res.json({
      latitude,
      longitude,
      isLiveFlood: lives,
      currentDischarge: dischargeValue,
      sevenDayForecast: forecast,
      floodSeverity,
      apiCitation: "Discharge rates fetched programmatically using the Joint Research Centre Global Flood Awareness System (GloFAS) via Open-Meteo."
    });
  } catch (error: any) {
    console.error("GloFAS river discharge lookup failed:", error);
    res.status(500).json({ error: "Failed to assemble hydrologic river profiles" });
  }
});

// API Endpoint: GBIF (Global Biodiversity Information Facility) species occurrences endpoint

router.post("/api/usgs-hydrology-waterwatch", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Location coordinates required to resolve USGS water monitoring structures" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    const stations: any[] = [];

    try {
      // Query USGS stream values within a narrow square bounding box
      const halfSize = 0.4;
      const bBox = `${(longitude - halfSize).toFixed(3)},${(latitude - halfSize).toFixed(3)},${(longitude + halfSize).toFixed(3)},${(latitude + halfSize).toFixed(3)}`;
      const waterUrl = `https://waterservices.usgs.gov/nwis/iv/?format=json&bBox=${bBox}&parameterCd=00060,00065&siteStatus=active`;
      const response = await fetch(waterUrl);
      if (response.ok) {
        const json = await response.json();
        const timeSeries = json?.value?.timeSeries;
        if (Array.isArray(timeSeries) && timeSeries.length > 0) {
          lives = true;
          timeSeries.forEach((series: any) => {
            const sourceInfo = series.sourceInfo || {};
            const values = series.values?.[0]?.value || [];
            const siteName = sourceInfo.siteName || "Unnamed USGS streamgauge";
            const siteCode = sourceInfo.siteCode?.[0]?.value || "";
            const paramName = series.variable?.variableName || "Discharge";
            const lastValStr = values[values.length - 1]?.value || "0";
            const parsedVal = parseFloat(lastValStr);

            stations.push({
              siteName,
              siteCode,
              latitude: sourceInfo.geoLocation?.geogLocation?.latitude,
              longitude: sourceInfo.geoLocation?.geogLocation?.longitude,
              parameter: paramName,
              latestValue: parsedVal,
              unit: series.variable?.unit?.unitCode || "cfs"
            });
          });
        }
      }
    } catch (e) {
      console.warn("USGS NWIS Hydrology Service network failure:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to locate any active USGS streamgages within the selected bounding box." });
    }

    res.json({
      latitude,
      longitude,
      isLiveUsgsHydrology: lives,
      stations: stations.slice(0, 5),
      apiCitation: "Stream flow and groundwater levels collected from the United States Geological Survey National Water Information System."
    });
  } catch (error: any) {
    console.error("USGS waterwatch lookup failed:", error);
    res.status(500).json({ error: "Failed to assemble high-fidelity hydrologic stream monitoring networks" });
  }
});

// API Endpoint: Atmospheric Trace Gases & Greenhouse Indicators (CO2, Methane, Nitrous Oxide)
