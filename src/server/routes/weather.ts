// weather endpoints, split out of the single server.ts.
import { Router } from "express";
import { num, leadingComplete, realSeries } from "../series";

export const router = Router();

router.post("/api/environmental-telemetry", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Missing lat/lng coordinate properties" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Every value below comes from the response or is null — no "safe"
    // placeholder values that would be shown as if measured.
    let airQuality: {
      aqi: number | null; aqiLabel: string | null; pm2_5: number | null; pm10: number | null;
      no2: number | null; ozone: number | null; so2: number | null;
    } | null = null;

    let elevationMeters = 0;
    let atmosphericPressure = 0;

    let isLiveAQ = false;
    // 1. Query free Open-Meteo Air Quality API
    try {
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone,sulphur_dioxide&timezone=auto`;
      const aqRes = await fetch(aqUrl);
      if (aqRes.ok) {
        const aqData = await aqRes.json();
        const cur = aqData.current || {};
        const usAqi = num(cur.us_aqi, 0);

        let label: string | null = null;
        if (usAqi !== null) {
          label = "Good";
          if (usAqi > 150) label = "Unhealthy";
          else if (usAqi > 100) label = "Unhealthy for Sensitive Groups";
          else if (usAqi > 50) label = "Moderate";
        }

        airQuality = {
          aqi: usAqi,
          aqiLabel: label,
          pm2_5: num(cur.pm2_5),
          pm10: num(cur.pm10),
          no2: num(cur.nitrogen_dioxide),
          ozone: num(cur.ozone),
          so2: num(cur.sulphur_dioxide),
        };
        isLiveAQ = usAqi !== null;
      }
    } catch (e) {
      console.warn("Upstream Open-Meteo Air Quality details unavailable:", e);
    }

    if (!isLiveAQ) {
      return res.status(502).json({ error: "Failed to gather environmental telemetry from the air quality provider." });
    }

    let isLiveElevation = false;
    // 2. Query free Open-Meteo Elevation API
    try {
      const elUrl = `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`;
      const elRes = await fetch(elUrl);
      if (elRes.ok) {
        const elData = await elRes.json();
        const elevation = num(elData.elevation?.[0], 0);
        if (elevation !== null) {
          elevationMeters = elevation;
          isLiveElevation = true;
        }
      }
    } catch (e) {
      console.warn("Upstream elevation API query failed:", e);
    }
    
    if (!isLiveElevation) {
      return res.status(502).json({ error: "Failed to gather elevation telemetry from the upstream geospatial provider." });
    }

    // Standard-atmosphere estimate from elevation (not a barometer reading).
    atmosphericPressure = parseFloat((101.325 * Math.exp(-0.00012 * elevationMeters) * 10).toFixed(1)); // in hPa / mbar

    res.json({
      latitude,
      longitude,
      elevation: elevationMeters,
      atmosphericPressure,
      airQuality,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Environmental telemetry extraction failed:", error);
    res.status(500).json({ error: "Failed to gather unified environmental telemetry" });
  }
});

// API Endpoint: Get river discharge and flood warning metric arrays

router.post("/api/climate-projection", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Missing coordinates" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // One CMIP6 HighResMIP model from Open-Meteo's climate API. Monthly values
    // are averaged over 2041-2050 (a single year is mostly weather noise), and
    // the warming delta is the same model's 2041-2050 mean against its own
    // 1991-2000 mean at this location — computed, not the hardcoded
    // "+1.8 to +2.4 °C" an earlier version showed everywhere. (That version
    // also asked for a model name the API doesn't serve.)
    const MODEL = "EC_Earth3P_HR";
    const monthsIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let monthlyData: Array<{ month: string; tempMax: number | null; tempMin: number | null; precipitation: number | null }> = [];
    let warmingDelta: number | null = null;

    try {
      const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${latitude}&longitude=${longitude}&start_date=1991-01-01&end_date=2050-12-31&models=${MODEL}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const d = data.daily;
        if (d && Array.isArray(d.time)) {
          const future = monthsIndex.map(() => ({ tMax: 0, tMin: 0, rain: 0, days: 0, years: new Set<number>() }));
          let baseSum = 0, baseN = 0, futSum = 0, futN = 0;
          (d.time as string[]).forEach((t, i) => {
            const year = Number(t.slice(0, 4));
            const month = Number(t.slice(5, 7)) - 1;
            const mx = d.temperature_2m_max?.[i];
            const mn = d.temperature_2m_min?.[i];
            const rn = d.precipitation_sum?.[i];
            if (typeof mx !== "number" || typeof mn !== "number") return;
            const mean = (mx + mn) / 2;
            if (year >= 1991 && year <= 2000) { baseSum += mean; baseN++; }
            if (year >= 2041 && year <= 2050) {
              futSum += mean; futN++;
              if (typeof rn === "number") {
                const m = future[month];
                m.tMax += mx; m.tMin += mn; m.rain += rn; m.days++; m.years.add(year);
              }
            }
          });
          monthlyData = future.map((m, i) => ({
            month: monthsIndex[i],
            tempMax: m.days > 0 ? parseFloat((m.tMax / m.days).toFixed(1)) : null,
            tempMin: m.days > 0 ? parseFloat((m.tMin / m.days).toFixed(1)) : null,
            // Average monthly total over the decade.
            precipitation: m.years.size > 0 ? parseFloat((m.rain / m.years.size).toFixed(1)) : null,
          }));
          if (baseN > 0 && futN > 0) warmingDelta = parseFloat((futSum / futN - baseSum / baseN).toFixed(1));
        }
      }
    } catch (e) {
      console.warn("Climate projection API failed:", e);
    }

    if (monthlyData.length === 0 || monthlyData.every((m) => m.tempMax === null)) {
      return res.status(502).json({ error: "Climate projection model data is unavailable right now." });
    }

    res.json({
      latitude,
      longitude,
      modelCode: `${MODEL} (CMIP6 HighResMIP, high-emission future forcing)`,
      monthlyProjectionMaxYear: 2050,
      projectionPeriod: "2041-2050 monthly averages",
      monthlyData,
      isLiveModel: true,
      warmingDeltaC: warmingDelta,
      globalWarmingDeltaEst: warmingDelta === null
        ? "Not available"
        : `${warmingDelta >= 0 ? "+" : ""}${warmingDelta} °C (2041-2050 vs 1991-2000, this model, this location)`,
    });
  } catch (error: any) {
    console.error("Climate projection process failed:", error);
    res.status(500).json({ error: "Failed to generate CMIP6 long-term climate predictions" });
  }
});

// API Endpoint: Get Decadal Historical Weather Reanalysis (Climate Drift since 1980)

router.post("/api/historical-reanalysis", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Real per-decade averages from ERA5 (1980 to the last full year). An
    // earlier version fetched two weeks of 2024 "to verify the archive",
    // returned an empty series, and still asserted "clear localized thermal
    // expansion" in its disclaimer.
    const lastFullYear = new Date().getUTCFullYear() - 1;
    const decadalData: Array<{ decade: string; avgTempMax: number; avgTempMin: number; cumulativeRain: number; accumulatedGdd: number; years: number }> = [];

    try {
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=1980-01-01&end_date=${lastFullYear}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const response = await fetch(archiveUrl);
      if (response.ok) {
        const data = await response.json();
        const d = data.daily;
        if (d && Array.isArray(d.time)) {
          const byDecade = new Map<number, { tMax: number; tMin: number; rain: number; gdd: number; days: number; years: Set<number> }>();
          (d.time as string[]).forEach((t, i) => {
            const mx = d.temperature_2m_max?.[i];
            const mn = d.temperature_2m_min?.[i];
            const rn = d.precipitation_sum?.[i];
            if (typeof mx !== "number" || typeof mn !== "number" || typeof rn !== "number") return;
            const year = Number(t.slice(0, 4));
            const decade = Math.floor(year / 10) * 10;
            const bucket = byDecade.get(decade) ?? { tMax: 0, tMin: 0, rain: 0, gdd: 0, days: 0, years: new Set<number>() };
            bucket.tMax += mx; bucket.tMin += mn; bucket.rain += rn;
            bucket.gdd += Math.max(0, (Math.max(10, mx) + Math.max(10, mn)) / 2 - 10);
            bucket.days++; bucket.years.add(year);
            byDecade.set(decade, bucket);
          });
          [...byDecade.entries()].sort(([a2], [b2]) => a2 - b2).forEach(([decade, b2]) => {
            const years = b2.years.size;
            decadalData.push({
              decade: `${decade}s`,
              avgTempMax: parseFloat((b2.tMax / b2.days).toFixed(2)),
              avgTempMin: parseFloat((b2.tMin / b2.days).toFixed(2)),
              // Mean annual totals, so a partial decade compares fairly.
              cumulativeRain: parseFloat((b2.rain / years).toFixed(0)),
              accumulatedGdd: parseFloat((b2.gdd / years).toFixed(0)),
              years,
            });
          });
        }
      }
    } catch (e) {
      console.warn("Historical Archive API timed out or rate-limited:", e);
    }

    if (decadalData.length === 0) {
      return res.status(502).json({ error: "Historical Archive API timed out or rate-limited from Open Meteo." });
    }

    const partial = decadalData.filter((x) => x.years < 10).map((x) => `${x.decade} (${x.years} years)`);
    res.json({
      latitude,
      longitude,
      decadalData,
      isLiveArchive: true,
      climateTrendDisclaimer: `Per-decade means of daily ERA5 reanalysis (Open-Meteo archive), 1980-${lastFullYear}. Rain and GDD (base 10 °C) are mean annual totals.` +
        (partial.length ? ` Partial decades: ${partial.join(", ")}.` : "") +
        " Reanalysis is a gridded model of past weather (~25 km), not a station record.",
    });
  } catch (error: any) {
    console.error("Historical reanalysis failed:", error);
    res.status(500).json({ error: "Failed to generate decadal historical reanalysis profiles" });
  }
});

// API Endpoint: Get 30-Member Weather Forecast Ensemble & Probability Spreads (GFS/ECMWF)

router.post("/api/ensemble-dispersion", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // The spread and rain probability come from the actual ensemble members.
    // An earlier version read ONE member and invented the spread (±1.2 °C,
    // rain ×1.5) and the probability (60% if wet, else 15%).
    const dates: string[] = [];
    const tempMaxMean: number[] = [];
    const tempMaxHigh: number[] = [];
    const tempMaxLow: number[] = [];
    const rainMean: number[] = [];
    const rainHigh: number[] = [];
    const rainProbability: number[] = [];
    let memberCount = 0;

    try {
      const url = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_sum&models=icon_seamless&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const d = data.daily;
        if (d && Array.isArray(d.time)) {
          const keys = Object.keys(d);
          const tKeys = keys.filter((k) => k === "temperature_2m_max" || k.startsWith("temperature_2m_max_member"));
          const rKeys = keys.filter((k) => k === "precipitation_sum" || k.startsWith("precipitation_sum_member"));
          memberCount = Math.min(tKeys.length, rKeys.length);
          (d.time as string[]).forEach((t, i) => {
            const temps = tKeys.map((k) => d[k][i]).filter((v: unknown): v is number => typeof v === "number");
            const rains = rKeys.map((k) => d[k][i]).filter((v: unknown): v is number => typeof v === "number");
            // Stop at the first day most members don't reach.
            if (temps.length < memberCount / 2 || rains.length < memberCount / 2) return;
            if (dates.length !== i) return;
            dates.push(t);
            const mean = (xs: number[]) => xs.reduce((a2, b2) => a2 + b2, 0) / xs.length;
            tempMaxMean.push(parseFloat(mean(temps).toFixed(1)));
            tempMaxHigh.push(parseFloat(Math.max(...temps).toFixed(1)));
            tempMaxLow.push(parseFloat(Math.min(...temps).toFixed(1)));
            rainMean.push(parseFloat(mean(rains).toFixed(1)));
            rainHigh.push(parseFloat(Math.max(...rains).toFixed(1)));
            rainProbability.push(Math.round((rains.filter((r) => r >= 1).length / rains.length) * 100));
          });
        }
      }
    } catch (e) {
      console.warn("Ensemble Forecast API returned error or timed out:", e);
    }

    if (dates.length === 0 || memberCount < 2) {
      return res.status(502).json({ error: "Failed to download ensemble members from the upstream weather provider." });
    }

    res.json({
      latitude,
      longitude,
      dates,
      tempMaxMean,
      tempMaxHigh,
      tempMaxLow,
      rainMean,
      rainHigh,
      rainProbability,
      memberCount,
      isLiveEnsemble: true,
      ensembleConfidenceScore: `${memberCount} ensemble members (DWD ICON via Open-Meteo). High/low are the warmest/coolest member; rain probability is the share of members with ≥1 mm.`,
    });
  } catch (error: any) {
    console.error("Ensemble resolution failed:", error);
    res.status(500).json({ error: "Failed to compile ensemble forecast spreads" });
  }
});

// API Endpoint: Get Marine Hydrodynamics & Near-Shore Aquaculture Wave/SeaTemp Parameters

router.post("/api/solar-energy-potential", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to calculate solar yields" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let times: string[] = [];
    let shortwave: number[] = [];
    let directNormal: number[] = [];
    let diffuse: number[] = [];
    let isLiveSolar = false;

    try {
      // Sourcing hourly or daily solar radiation indexes from Open-Meteo
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=shortwave_radiation_sum,et0_fao_evapotranspiration&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.shortwave_radiation_sum) {
          const n = leadingComplete(data.daily.shortwave_radiation_sum);
          times = (data.daily.time || []).slice(0, n);
          shortwave = realSeries(data.daily.shortwave_radiation_sum, n, 2);
          // Derive estimate for direct vs diffuse irradiance
          directNormal = shortwave.map(v => parseFloat((v * 0.65).toFixed(2)));
          diffuse = shortwave.map(v => parseFloat((v * 0.35).toFixed(2)));
          isLiveSolar = n > 0;
        }
      }
    } catch (e) {
      console.warn("Open-Meteo solar irradiance request failed:", e);
    }

    if (!isLiveSolar || times.length === 0) {
      return res.status(502).json({ error: "Failed to retrieve solar irradiation traces from Open-Meteo." });
    }

    // Propose an estimate for a baseline 5kW solar pump daily generation (kWh)
    const pvYieldFactor = 0.18; // panel efficiency conversion
    const panelAreaSqm = 25.0; // total array area
    const pvgisYieldKwh = shortwave.map(v => parseFloat((v * panelAreaSqm * pvYieldFactor).toFixed(1)));
    const totalYield7Days = parseFloat(pvgisYieldKwh.reduce((a, b) => a + b, 0).toFixed(1));

    res.json({
      latitude,
      longitude,
      dates: times,
      shortwaveRadiationMJ: shortwave,
      directNormalIrradianceMJ: directNormal,
      diffuseIrradianceMJ: diffuse,
      pvPumpYieldKwh: pvgisYieldKwh,
      totalYield7Days,
      pumpOperationalHours: pvgisYieldKwh.map(v => parseFloat(Math.min(10.0, v / 1.8).toFixed(1))), // operational pumping capacity hours
      isLiveSolar,
      solarAdvisory: "Under active solar clearway. Tilt panel array to " + Math.round(Math.abs(latitude)) + "° due South for optimized year-round hydraulic solar irrigation."
    });
  } catch (error: any) {
    console.error("Solar yield modeling failure:", error);
    res.status(500).json({ error: "Failed to compile photothermal energy analysis" });
  }
});

// API Endpoint: Get Accumulated Growing Degree Days (GDD) & Crop Phenology Forecasts

router.post("/api/climatology-nasa", async (req, res) => {
  try {
    const { lat, lng, startDaysAgo = 30 } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to query NASA POWER climatology databases" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(startDaysAgo));

    const formatDateStr = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}${mm}${dd}`;
    };

    const startStr = formatDateStr(startDate);
    const endStr = formatDateStr(endDate);
    const paramsQuery = "ALLSKY_SFC_SW_DWN,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR";

    const powerUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${paramsQuery}&community=ag&longitude=${longitude}&latitude=${latitude}&start=${startStr}&end=${endStr}&format=json`;
    
    let isLiveNasa = false;
    let records: any[] = [];

    try {
      const powerRes = await fetch(powerUrl);
      if (powerRes.ok) {
        const powerJson = await powerRes.json();
        if (powerJson && powerJson.properties && powerJson.properties.parameter) {
          isLiveNasa = true;
          const param = powerJson.properties.parameter;
          const solar = param.ALLSKY_SFC_SW_DWN || {};
          const temp = param.T2M || {};
          const tempMax = param.T2M_MAX || {};
          const tempMin = param.T2M_MIN || {};
          const prec = param.PRECTOTCORR || {};

          // Extract date keys
          const dates = Object.keys(solar);
          records = dates.map(dateKey => {
            // dateKey is usually like "20240601"
            const yr = dateKey.substring(0, 4);
            const mo = dateKey.substring(4, 6);
            const dy = dateKey.substring(6, 8);
            const dateDisplay = `${yr}-${mo}-${dy}`;

            // -999 is NASA POWER's "no data" marker — it's common for the
            // most recent days, which the dataset hasn't processed yet. It
            // becomes null, not a typical-looking 20 °C / 0 mm.
            const val = (series: Record<string, number>) =>
              typeof series[dateKey] === "number" && series[dateKey] !== -999 ? series[dateKey] : null;
            return {
              date: dateDisplay,
              solarRadiationMj: val(solar),
              temperatureC: val(temp),
              temperatureMaxC: val(tempMax),
              temperatureMinC: val(tempMin),
              precipitationMm: val(prec),
            };
          }).filter((r) => r.temperatureC !== null || r.precipitationMm !== null || r.solarRadiationMj !== null);
        }
      }
    } catch (e) {
      console.warn("NASA POWER API node request failed:", e);
    }

    if (!isLiveNasa || records.length === 0) {
      return res.status(502).json({ error: "Failed to collect NASA POWER satellite climatology data for the specified parameters." });
    }

    res.json({
      latitude,
      longitude,
      isLiveNasa,
      climatologyRecords: records,
      apiCitation: "Solar Radiation & Surface Climatology database generated by NASA Langley Research Center POWER Project."
    });
  } catch (error: any) {
    console.error("NASA Climatology server proxy failed:", error);
    res.status(500).json({ error: "Failed to assemble NASA POWER climatology databases" });
  }
});

// API Endpoint: Open-Meteo Pollen/Allergen Warning Index (Air Quality extension)

router.post("/api/openmeteo-historical-archive", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Location coordinates are required" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let avgHistoricalPrecip: number | null = null; // mm/day
    let avgHistoricalTemp: number | null = null;  // C

    try {
      // ERA5 reanalysis for 1-15 June 2015. This is ONE fortnight of one
      // year — a sample, not a climate normal (an earlier version called it a
      // "15-year" / "decadal" norm).
      const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=2015-06-01&end_date=2015-06-15&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
      const response = await fetch(archiveUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && json.daily && json.daily.temperature_2m_mean && json.daily.precipitation_sum) {
          const tempValues = json.daily.temperature_2m_mean.filter((v: any) => v !== null);
          const precipValues = json.daily.precipitation_sum.filter((v: any) => v !== null);
          if (tempValues.length > 0) {
            const sumT = tempValues.reduce((a: number, b: number) => a + b, 0);
            avgHistoricalTemp = parseFloat((sumT / tempValues.length).toFixed(1));
          }
          if (precipValues.length > 0) {
            const sumP = precipValues.reduce((a: number, b: number) => a + b, 0);
            avgHistoricalPrecip = parseFloat((sumP / precipValues.length).toFixed(2));
          }
          lives = avgHistoricalTemp !== null && avgHistoricalPrecip !== null;
        }
      }
    } catch (e) {
      console.warn("Open-Meteo Historical Archive network issue:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to fetch decadal climatic norms from Open-Meteo ERA5 reanalysis." });
    }

    res.json({
      latitude,
      longitude,
      isLiveHistoricalArchive: lives,
      historicalPeriod: "1-15 June 2015 (a single two-week sample, not a long-term average)",
      metrics: {
        avgHistoricalPrecip,
        avgHistoricalTemp
      },
      apiCitation: "ECMWF ERA5 reanalysis via the Open-Meteo archive API, 1-15 June 2015."
    });
  } catch (error: any) {
    console.error("Climatic historical archive look-up catch error:", error);
    res.status(500).json({ error: "Failed to analyze relative ERA5 climate anomalies" });
  }
});

// API Endpoint: OpenStreetMap Nominatim Reverse Geocoding

router.get("/api/global-greenhouse-gas-trends", async (req, res) => {
  try {
    let lives = false;
    let co2: number | undefined;
    let methane: number | undefined;
    let nitrous: number | undefined;

    try {
      const co2Res = await fetch("https://global-warming.org/api/co2-api");
      if (co2Res.ok) {
        const co2Json = await co2Res.json();
        if (co2Json && Array.isArray(co2Json.co2) && co2Json.co2.length > 0) {
          co2 = parseFloat(co2Json.co2[co2Json.co2.length - 1].trend);
        }
      }
      const ch4Res = await fetch("https://global-warming.org/api/methane-api");
      if (ch4Res.ok) {
        const ch4Json = await ch4Res.json();
        if (ch4Json && Array.isArray(ch4Json.methane) && ch4Json.methane.length > 0) {
          methane = parseFloat(ch4Json.methane[ch4Json.methane.length - 1].trend);
        }
      }
      const n2oRes = await fetch("https://global-warming.org/api/nitrous-oxide-api");
      if (n2oRes.ok) {
        const n2oJson = await n2oRes.json();
        if (n2oJson && Array.isArray(n2oJson.nitrous) && n2oJson.nitrous.length > 0) {
          nitrous = parseFloat(n2oJson.nitrous[n2oJson.nitrous.length - 1].trend);
        }
      }
      lives = co2 !== undefined && !isNaN(co2) && methane !== undefined && !isNaN(methane) && nitrous !== undefined && !isNaN(nitrous);
    } catch (e) {
      console.warn("Global warming indicators down:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Atmospheric trace gas trend data is currently unavailable from the upstream provider." });
    }

    res.json({
      isLiveGasTrends: lives,
      traceAtmosphere: {
        co2Ppm: co2,
        methanePpb: methane,
        nitrousOxidePpb: nitrous,
        description: "Global trace gas concentration values reflecting anthropogenically-induced planetary climate metrics."
      },
      apiCitation: "Atmospheric greenhouse gas trends provided directly by the Global Warming Index API tracking services."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble atmospheric greenhouse index trends" });
  }
});

// API Endpoint: Open-Meteo UV Index & Clear Sky Insolation Forecast

router.post("/api/openmeteo-uv-radiation", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Location coordinates required to forecast ultraviolet indices" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let uvIndexMax: number | undefined;
    let uvIndexClearSkyMax: number | undefined;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=uv_index_max,uv_index_clear_sky_max&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json && json.daily && json.daily.uv_index_max?.[0] !== undefined && json.daily.uv_index_max?.[0] !== null) {
          lives = true;
          uvIndexMax = json.daily.uv_index_max[0];
          uvIndexClearSkyMax = json.daily.uv_index_clear_sky_max?.[0] ?? uvIndexMax;
        }
      }
    } catch (e) {
      console.warn("Open-Meteo UV Index API call had network issues:", e);
    }

    if (!lives || uvIndexMax === undefined) {
      return res.status(502).json({ error: "Ultraviolet index forecast is currently unavailable from the upstream provider." });
    }

    res.json({
      latitude,
      longitude,
      isLiveUv: lives,
      uvIndexMax,
      uvIndexClearSkyMax,
      riskLevel: uvIndexMax >= 8 ? "Very High / Extreme" : uvIndexMax >= 6 ? "High Risk" : uvIndexMax >= 3 ? "Moderate Risk" : "Low Risk",
      apiCitation: "Ultraviolet Index and clear-sky solar insolation calculated globally via the Open-Meteo Atmospheric Forecast Suite."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble ultraviolet solar radiation index" });
  }
});

// API Endpoint: OpenStreetMap Overpass local physical features check (Nearby streams / forests)

router.post("/api/sunrise-sunset-astronomy", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    // No default location: answering for Ames, Iowa when none was sent
    // would look like an answer for the user's own field.
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    let lives = false;
    let results = {
      sunrise: "",
      sunset: "",
      solarNoon: "",
      dayLengthSec: 0,
      civilTwilightBegin: "",
      civilTwilightEnd: "",
      favorableWorkingHours: 0
    };

    try {
      const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json && json.status === "OK" && json.results) {
          lives = true;
          const resObj = json.results;
          
          const formatTime = (isoStr: string) => {
            if (!isoStr) return "N/A";
            try {
              const d = new Date(isoStr);
              return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            } catch {
              return isoStr;
            }
          };

          results = {
            sunrise: formatTime(resObj.sunrise),
            sunset: formatTime(resObj.sunset),
            solarNoon: formatTime(resObj.solar_noon),
            dayLengthSec: parseInt(resObj.day_length) || 0,
            civilTwilightBegin: formatTime(resObj.civil_twilight_begin),
            civilTwilightEnd: formatTime(resObj.civil_twilight_end),
            favorableWorkingHours: parseFloat(((parseInt(resObj.day_length) / 3600) + 1.2).toFixed(1))
          };
        }
      }
    } catch (e) {
      console.warn("Sunrise-Sunset API down or rate limited, computing solar geometry offline:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to assemble high-fidelity solar photoperiod indices from Sunrise-Sunset API." });
    }

    res.json({
      isLiveSolarPhotoperiod: lives,
      results,
      apiCitation: "High-precision solar daylight boundaries and legal civil twilight spans sourced dynamically from Sunrise-Sunset astronomical catalogs."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble high-fidelity solar photoperiod indices" });
  }
});

// API Endpoint: World Bank Forest Coverage Indicator and Regional Green Canopy Ratio

router.post("/api/openmeteo-boundary-layer", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Location coordinates are required to calculate boundary shear profiles" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let boundaryLayerHeight: number | null = null; // meters
    let windGusts: number | null = null; // m/s
    let surfacePressure: number | null = null; // hPa

    try {
      // wind_speed_unit=ms: the response is labelled m/s, and Open-Meteo's
      // default is km/h — the old request silently showed km/h as m/s.
      const pblUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=boundary_layer_height,wind_gusts_10m,pressure_msl&wind_speed_unit=ms&timezone=auto`;
      const response = await fetch(pblUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && json.current) {
          boundaryLayerHeight = num(json.current.boundary_layer_height, 0);
          windGusts = num(json.current.wind_gusts_10m);
          surfacePressure = num(json.current.pressure_msl);
          lives = boundaryLayerHeight !== null || windGusts !== null || surfacePressure !== null;
        }
      }
    } catch (e) {
      console.warn("Open-Meteo Planetary Boundary Layer query failed:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to download planetary boundary layer vectors from the upstream meteorological provider." });
    }

    res.json({
      latitude,
      longitude,
      isLiveBoundaryLayer: lives,
      aerodynamics: {
        boundaryLayerHeightMeters: boundaryLayerHeight,
        windGustsAt10mMeterPerSec: windGusts,
        meanSeaLevelPressureHpa: surfacePressure,
        thermalTurbulenceState: boundaryLayerHeight === null
          ? null
          : boundaryLayerHeight > 1000 ? "Highly Convective (Strong Updrafts)" : "Stable Stratified (Minimal Updrafts)"
      },
      apiCitation: "Boundary layer thickness, aerodynamic sheer, and mean sea-level pressure vectors extracted from high-resolution regional forecasting runs via Open-Meteo Global Forecasting Suite."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble convective planetary boundary layer metrics" });
  }
});

// API Endpoint: Open-Meteo Geotech Resolution Elevation and Precise Slope Dynamics

router.post("/api/weather-forecast", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Location coordinates required to resolve local weather" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,relative_humidity_2m,weather_code,precipitation_probability,wind_speed_10m&timezone=auto`;

    let data;
    try {
      const response = await fetch(url);
      if (response.ok) {
        data = await response.json();
      }
    } catch (e) {
      console.warn("Weather forecast request network issue:", e);
    }

    if (!data || !data.daily || !data.current) {
      // Upstream unavailable or incomplete. Say so; never invent a forecast.
      return res.status(502).json({
        error: "Open-Meteo is unreachable right now, so there is no forecast to show for this location.",
        source: "Open-Meteo",
        kind: "unavailable",
      });
    }

    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to assemble high-fidelity weather forecast" });
  }
});
