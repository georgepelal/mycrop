// season endpoints, split out of the single server.ts.
import { Router } from "express";
import { leadingComplete, realSeries } from "../series";
import { getGeminiClient } from "../context";
import { CROP_PARAMETERS } from "../context";

export const router = Router();

router.post("/api/detect-crop", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Missing lat/lng coordinate properties" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Regional guess only. This never looks at the field itself (no imagery,
    // no crop map), so it returns the crops commonly grown in a broad region
    // and no confidence number. An earlier version flipped between Corn and
    // Soybeans with `|lat*lng| % 2`, defaulted everything else to Corn and
    // reported a made-up 75–95% confidence.
    let detectedCrop: string | null = null;
    let explanation = "No regional guess for this location. Tell us what you grow instead.";
    const confidence: number | null = null;
    let method: "regional-heuristic" | "ai-guess" | "none" = "none";

    const regions: { test: boolean; crop: string; why: string }[] = [
      { test: latitude > 42 && latitude < 49 && longitude > -118 && longitude < -111, crop: "Potato", why: "The Columbia Basin and Snake River Plain are major potato regions." },
      { test: latitude > 35 && latitude < 49 && longitude > -105 && longitude < -75, crop: "Corn or Soybeans", why: "The US Corn Belt is dominated by corn–soybean rotations." },
      { test: latitude > 47 && latitude < 58 && longitude > -125 && longitude < -98, crop: "Canola or Spring Wheat", why: "The Canadian Prairies mostly grow canola and spring cereals." },
      { test: latitude > 25 && latitude < 36 && longitude > -110 && longitude < -78, crop: "Cotton", why: "This band covers much of the US Cotton Belt." },
      { test: latitude > 40 && latitude < 55 && longitude > -10 && longitude < 50, crop: "Winter Wheat or Barley", why: "Winter cereals are the most common arable crops in this part of Europe." },
      { test: latitude > -10 && latitude < 25 && longitude > 95 && longitude < 142, crop: "Rice", why: "Rice is the main field crop across lowland Southeast Asia." },
      { test: latitude > 45 && latitude < 55 && longitude > 50 && longitude < 130, crop: "Sunflower or Wheat", why: "The steppe belt grows mainly wheat and sunflower." },
    ];
    const region = regions.find((r) => r.test);
    if (region) {
      detectedCrop = region.crop;
      explanation = `${region.why} This is a guess from the region only — it doesn't look at your field.`;
      method = "regional-heuristic";
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const prompt = `
        You are MyCrop Agronomist AI. A farmer has clicked a field on a satellite map at coordinates:
        Latitude: ${latitude}
        Longitude: ${longitude}

        Identify exactly what location of the world this is (e.g. state/province, country, agricultural region, and climate biome).
        According to modern geographic crop census records, crop production maps, and local agricultural outputs, determine the highly probable agricultural crop growing in this exact geographic sector.
        
        You MUST pick exactly ONE crop name from the following valid agronomist list:
        ["Corn", "Soybeans", "Winter Wheat", "Spring Wheat", "Barley", "Oats", "Alfalfa", "Canola", "Cotton", "Rice", "Potato", "Sugar Beets", "Sorghum", "Sunflower", "Peanut", "Sugarcane", "Rye", "Chickpeas", "Dry Beans"]

        Format your response ONLY as a raw, single-line JSON string without formatting/markdown fences (do not wrap in \`\`\`json) with these keys:
        - "detectedCrop": string representing the exact crop name chosen from the valid list.
        - "explanation": a detailed, highly relevant 2-sentence agronomical justification stating what region this maps to, why this crop makes sense for this climate/soil, and what seasonal cycle it represents.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          }
        });

        const rawText = response.text || "";
        const cleanJSON = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJSON);

        if (parsed.detectedCrop && typeof parsed.detectedCrop === "string") {
          // Normalize to match valid keys exactly
          const matchedKey = Object.keys(CROP_PARAMETERS).concat([
            "Spring Wheat", "Oats", "Alfalfa", "Potato", "Sugar Beets", "Sorghum", "Sunflower", "Peanut", "Sugarcane", "Rye", "Chickpeas", "Dry Beans"
          ]).find(k => k.toLowerCase() === parsed.detectedCrop.toLowerCase());
          
          if (matchedKey) {
            detectedCrop = matchedKey;
          } else {
            detectedCrop = parsed.detectedCrop;
          }
          if (parsed.explanation) {
            explanation = parsed.explanation;
          }
          // The model's self-rated "confidence" isn't a calibrated probability,
          // so it isn't passed on.
          method = "ai-guess";
        }
      } catch (gemError) {
        console.warn("Gemini crop guess failed; returning the regional heuristic:", gemError);
      }
    }

    res.json({
      detectedCrop,
      confidence,
      method,
      explanation
    });

  } catch (error: any) {
    console.error("Geocoding crop recognition failed:", error);
    res.status(500).json({ error: "Could not auto-detect regional crop" });
  }
});

// API Endpoint: Get complete multi-spectral environmental telemetry from multiple free open-access APIs

router.post("/api/growing-degree-days", async (req, res) => {
  try {
    const { lat, lng, crop = "corn", plantingDate } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute GDD accumulations" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Base temperatures are the standard published ones. A season target and
    // stage thresholds are only given for corn, where they're well established
    // (Purdue / Iowa State stage guides, converted from °F to °C base 10) —
    // for the other crops they vary too much by variety to state one number.
    const CROP_GDD: Record<string, { baseTemp: number; targetGdd: number | null }> = {
      corn: { baseTemp: 10.0, targetGdd: 1500 },
      soybean: { baseTemp: 10.0, targetGdd: null },
      soy: { baseTemp: 10.0, targetGdd: null },
      wheat: { baseTemp: 0.0, targetGdd: null },
      cotton: { baseTemp: 15.6, targetGdd: null },
    };
    const cropKey = String(crop).toLowerCase();
    const config = CROP_GDD[cropKey] ?? CROP_GDD.corn;
    const { baseTemp, targetGdd } = config;

    // Accumulate from the planting date when we know it (up to the 92 days of
    // history Open-Meteo serves with a forecast). Without one, the window is
    // labelled for what it is — never topped up with an assumed "mid-season"
    // starting total, which an earlier version did.
    const todayIso = new Date().toISOString().split("T")[0];
    let pastDays = 0;
    let sincePlanting = false;
    if (typeof plantingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(plantingDate) && plantingDate <= todayIso) {
      const daysSince = Math.floor((Date.parse(todayIso) - Date.parse(plantingDate)) / 86400000);
      pastDays = Math.min(92, daysSince);
      sincePlanting = daysSince <= 92;
    }

    let dates: string[] = [];
    let tempMax: number[] = [];
    let tempMin: number[] = [];
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&past_days=${pastDays}&forecast_days=7&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && Array.isArray(data.daily.time)) {
          const n = leadingComplete(data.daily.temperature_2m_max, data.daily.temperature_2m_min);
          dates = data.daily.time.slice(0, n);
          tempMax = realSeries(data.daily.temperature_2m_max, n);
          tempMin = realSeries(data.daily.temperature_2m_min, n);
        }
      }
    } catch (e) {
      console.warn("GDD temperature fetching failed:", e);
    }

    if (dates.length === 0) {
      return res.status(502).json({ error: "Failed to fetch necessary temperature metrics for GDD calculation." });
    }

    const dailyGdd: number[] = [];
    const cumulativeGdd: number[] = [];
    let cumSum = 0;
    for (let i = 0; i < dates.length; i++) {
      // Standard averaging method with the lower threshold applied to both
      // extremes: ((max(Tmax, Tbase) + max(Tmin, Tbase)) / 2) - Tbase.
      const avgT = (Math.max(baseTemp, tempMax[i]) + Math.max(baseTemp, tempMin[i])) / 2;
      const gdd = parseFloat(Math.max(0, avgT - baseTemp).toFixed(1));
      dailyGdd.push(gdd);
      cumSum = parseFloat((cumSum + gdd).toFixed(1));
      cumulativeGdd.push(cumSum);
    }

    const accumulatedSince = sincePlanting ? plantingDate : dates[0];
    const todayIndex = dates.indexOf(todayIso);
    const observedGdd = todayIndex > 0 ? cumulativeGdd[todayIndex - 1] : 0;

    // Stage and time-to-maturity only mean something when counted from
    // planting, and only for the crop we have thresholds for.
    let phenologicalPhase: string | null = null;
    let daysToHarvest: number | null = null;
    if (sincePlanting && cropKey === "corn") {
      const stages: [number, string][] = [
        [1500, "Physiological maturity (R6, black layer)"],
        [1361, "Dent (R5)"],
        [1069, "Dough (R4)"],
        [778, "Silking (R1)"],
        [631, "Tasseling (VT)"],
        [411, "Late vegetative (V10)"],
        [264, "Vegetative (V6)"],
        [67, "Emergence (VE)"],
      ];
      const reached = stages.find(([threshold]) => observedGdd >= threshold);
      phenologicalPhase = reached ? reached[1] : "Planted, not yet emerged";

      const forecastDaily = todayIndex >= 0 ? dailyGdd.slice(todayIndex) : [];
      const rate = forecastDaily.length > 0 ? forecastDaily.reduce((a, b) => a + b, 0) / forecastDaily.length : 0;
      if (targetGdd !== null && rate > 0) {
        daysToHarvest = observedGdd >= targetGdd ? -1 : Math.round((targetGdd - observedGdd) / rate);
      }
    }

    res.json({
      latitude,
      longitude,
      crop,
      baseTemp,
      targetGdd,
      dates,
      dailyGdd,
      cumulativeGdd,
      accumulatedSince,
      sincePlanting,
      observedThrough: todayIso,
      observedGdd,
      phenologicalPhase,
      daysToHarvest,
      isLiveGdd: true,
      phenologyFormula: `Averaging method, base ${baseTemp}°C, from Open-Meteo daily max/min temperatures (past days observed, then forecast).` +
        (cropKey === "corn" ? " Corn stage thresholds: typical mid-maturity hybrid (Purdue/Iowa State guides, °F converted to °C); your hybrid's rating may differ." : ""),
    });
  } catch (error: any) {
    console.error("Phenology GDD compiler error:", error);
    res.status(500).json({ error: "Failed to compile developmental GDD heat indices" });
  }
});

// API Endpoint: Get Keetch-Byram Drought Index (KBDI) & Cropland Wildfire Index

router.post("/api/agronomic-chilling-hours", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute chilling projections" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Chill is counted from the start of the dormancy season (1 Nov in the
    // northern hemisphere, 1 May in the southern), from REAL hourly
    // temperatures — an earlier version reconstructed hours from a sine wave
    // between the daily min and max, and started from an invented 420 h.
    // Open-Meteo serves at most 92 days of history with a forecast, so an
    // older season start is clipped and the response says so.
    const today = new Date();
    const todayIso = today.toISOString().split("T")[0];
    const year = today.getUTCFullYear();
    const startMonth = latitude >= 0 ? 10 : 4; // 0-based: November / May
    let seasonStart = new Date(Date.UTC(year, startMonth, 1));
    if (seasonStart > today) seasonStart = new Date(Date.UTC(year - 1, startMonth, 1));
    const daysSinceStart = Math.floor((today.getTime() - seasonStart.getTime()) / 86400000);
    const pastDays = Math.min(92, Math.max(0, daysSinceStart));
    const clipped = daysSinceStart > 92;

    let hourlyTimes: string[] = [];
    let hourlyTemps: number[] = [];
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&past_days=${pastDays}&forecast_days=7&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.hourly && Array.isArray(data.hourly.time)) {
          const n = leadingComplete(data.hourly.temperature_2m);
          hourlyTimes = data.hourly.time.slice(0, n);
          hourlyTemps = realSeries(data.hourly.temperature_2m, n);
        }
      }
    } catch (e) {
      console.warn("Chilling API failed:", e);
    }

    if (hourlyTimes.length === 0) {
      return res.status(502).json({ error: "Failed to download hourly temperatures from Open-Meteo." });
    }

    // Weinberger chill-hours model: each hour with 0 °C <= T <= 7.2 °C counts one.
    const perDay = new Map<string, number>();
    const hoursSeen = new Map<string, number>();
    hourlyTimes.forEach((t, i) => {
      const day = t.slice(0, 10);
      hoursSeen.set(day, (hoursSeen.get(day) ?? 0) + 1);
      const inBand = hourlyTemps[i] >= 0 && hourlyTemps[i] <= 7.2 ? 1 : 0;
      perDay.set(day, (perDay.get(day) ?? 0) + inBand);
    });
    // A day cut short by a data gap would under-count; leave it out.
    const times = [...perDay.keys()].filter((d) => hoursSeen.get(d) === 24);
    const chillingHoursDaily = times.map((d) => perDay.get(d) ?? 0);
    const cumulativeChilling: number[] = [];
    let running = 0;
    for (const h of chillingHoursDaily) {
      running += h;
      cumulativeChilling.push(running);
    }
    const observedIndex = times.filter((d) => d < todayIso).length;
    const observedTotal = observedIndex > 0 ? cumulativeChilling[observedIndex - 1] : 0;
    const cumulativeTotal = running;
    const countedFrom = times[0];

    res.json({
      latitude,
      longitude,
      isLiveChilling: true,
      times,
      chillingHoursDaily,
      cumulativeChilling,
      cumulativeTotal,
      observedTotal,
      countedFrom,
      seasonStart: seasonStart.toISOString().split("T")[0],
      seasonStartClipped: clipped,
      vernalizationStatus: `${observedTotal} h observed since ${countedFrom}` +
        (clipped ? " (season start is more than 92 days back, so earlier chill isn't included)" : ""),
      chillingModelDescription: "Weinberger chill-hours model: every hour between 0 °C and 7.2 °C counts as one chill hour. " +
        "Computed from Open-Meteo hourly air temperature — observed up to today, forecast for the next 7 days. " +
        "Compare the observed total with your variety's chill requirement (commonly a few hundred to over 1,000 hours).",
      apiCitation: "Hourly 2 m temperature from Open-Meteo (observed past days + forecast).",
    });
  } catch (error: any) {
    console.error("Chilling calculation failed:", error);
    res.status(500).json({ error: "Failed to map chilling and orchard dormancy models" });
  }
});

// API Endpoint: Get Crop Lodging & Severe Wind-Shear Safety Projections

router.post("/api/crop-lodging-shear", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute crop wind shear risks" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let maxWindSpeed: number[] = []; // km/h
    let dailyRain: number[] = []; // mm
    let days = 0;
    let isLiveLodging = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=wind_speed_10m_max,precipitation_sum&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.wind_speed_10m_max) {
          days = Math.min(7, leadingComplete(data.daily.wind_speed_10m_max, data.daily.precipitation_sum));
          maxWindSpeed = realSeries(data.daily.wind_speed_10m_max, days);
          dailyRain = realSeries(data.daily.precipitation_sum, days);
          isLiveLodging = days > 0;
        }
      }
    } catch (e) {
      console.warn("Lodging wind API node failed:", e);
    }

    if (!isLiveLodging) {
      return res.status(502).json({ error: "Failed to assemble wind shears and precipitation vectors from the upstream provider." });
    }

    const dates: string[] = [];
    const lodgingIndices: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      // Calculate a lodging danger ratio (0 - 100%)
      // Wet soil (high daily rain or preceding days) reduces root anchorage.
      // Wind speed above 25 km/h creates dynamic lodging hazard on tall stalk crops (corn, wheat).
      const soilWetnessFactor = Math.min(2.0, 1.0 + (dailyRain[i] / 10)); 
      const windForceFactor = Math.pow(maxWindSpeed[i] / 40, 2); // non-linear aerodynamic lodging drag
      const risk = Math.min(100, Math.round(100 * windForceFactor * soilWetnessFactor));
      lodgingIndices.push(Math.max(5, risk));
    }

    const peakRisk = Math.max(...lodgingIndices);
    let cropLodgingAdvisory = "Stalk and culm structural strength is fully stable. Winds are within safe thresholds.";
    if (peakRisk > 75) {
      cropLodgingAdvisory = "⚠️ CRITICAL LEVEL: Extremely high wind shear with saturated soils. Severe stem breakage (green snap) and root lodging expected. Harvest high-risk fields immediately.";
    } else if (peakRisk > 40) {
      cropLodgingAdvisory = "MODERATE ALERT: Stalk bending could occur. Avoid high nitrogen fertilizer application right before high-wind windows to prevent weak fiber cell development.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      maxWindSpeed,
      dailyRain,
      lodgingIndices,
      peakRisk,
      isLiveLodging,
      advisory: cropLodgingAdvisory,
      physioReference: "Rule-of-thumb index (0-100) from forecast daily max wind and rain: risk rises with the square of wind speed and with wet soil. Not a calibrated lodging model — use it to decide when to check tall crops."
    });
  } catch (error: any) {
    console.error("Lodging API failing:", error);
    res.status(500).json({ error: "Failed to estimate crop structural lodging indices" });
  }
});

// API Endpoint: Get Frost Warning & Soil Freeze Depth Analysis

router.post("/api/frost-freeze-risk", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute frost freeze models" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let tempMin: number[] = [];
    let dewPoint: number[] = [];
    let days = 0;
    let isLiveFrost = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_min,dew_point_2m_min&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.temperature_2m_min) {
          // Dew point is needed for the tiers below; it's never derived from
          // temperature (an earlier version assumed Tmin - 4 °C).
          days = Math.min(7, leadingComplete(data.daily.temperature_2m_min, data.daily.dew_point_2m_min));
          tempMin = realSeries(data.daily.temperature_2m_min, days);
          dewPoint = realSeries(data.daily.dew_point_2m_min, days);
          isLiveFrost = days > 0;
        }
      }
    } catch (e) {
      console.warn("Frost API failed:", e);
    }

    if (!isLiveFrost) {
      return res.status(502).json({ error: "Failed to assemble frost risk indices from the meteorological provider." });
    }

    const dates: string[] = [];
    const frostProbability: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      // Frost occurs when temp approaches 0°C on ground, influenced by Dew Point
      // If Dew Point < 0°C and Tmin < 3°C, radiation frost is extremely likely
      let frostProb = 0;
      const tMin = tempMin[i];
      const dp = dewPoint[i];
      if (tMin <= 0) {
        frostProb = 100;
      } else if (tMin < 3 && dp < 0) {
        frostProb = 85;
      } else if (tMin < 5 && dp < 2) {
        frostProb = 45;
      } else {
        frostProb = 5;
      }
      frostProbability.push(frostProb);
    }

    const nextFrostDate = dates[frostProbability.findIndex(p => p > 50)];
    let protectiveAction = "No freeze danger imminent. Vegetable and berry crops are in safe atmospheric bounds.";
    if (Math.max(...frostProbability) > 75) {
      protectiveAction = "🔴 HIGH FROST WARNING: Deploy overhead frost-irrigation sprinklers, activate wind draft micro-climate machines, or cover sensitive fruit trees/shrubs before sunrise.";
    } else if (Math.max(...frostProbability) > 35) {
      protectiveAction = "🟡 LIGHT FROST ALERT: Monitor canopy dew points. Be ready with thermal blanketing for delicate high-value crops.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      tempMin,
      dewPoint,
      frostProbability,
      protectiveAction,
      nextFrostDate: nextFrostDate || "None Projected",
      isLiveFrost,
      disclaimer: "Frost risk tiers (5 / 45 / 85 / 100) from the forecast minimum air temperature and dew point — a rule of thumb, not a statistical probability. Canopy and ground temperatures can be several degrees colder than the 2 m forecast, especially in hollows on clear, still nights."
    });
  } catch (error: any) {
    console.error("Frost model compilation failure:", error);
    res.status(500).json({ error: "Failed to compile plant frost and freeze depth ratings" });
  }
});

// API Endpoint: Get PAR & PPFD Canopy Dynamics Projections

router.post("/api/agronomic-par-ppfd", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute PAR parameters" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let shortwaveRadiationMJ: number[] = []; // MJ/m2/day
    let days = 0;
    let isLivePar = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=shortwave_radiation_sum&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.shortwave_radiation_sum) {
          days = Math.min(7, leadingComplete(data.daily.shortwave_radiation_sum));
          shortwaveRadiationMJ = realSeries(data.daily.shortwave_radiation_sum, days);
          isLivePar = days > 0;
        }
      }
    } catch (e) {
      console.warn("PAR open-meteo connection failed:", e);
    }

    if (!isLivePar) {
      return res.status(502).json({ error: "Failed to assemble high-fidelity PAR metrics from the upstream provider." });
    }

    const dates: string[] = [];
    const peakPpfd: number[] = []; // umol/m2/s
    const dailyLightIntegral: number[] = []; // mol/m2/day

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      // Conversions: 
      // 1 MJ/m²/day = 1,000,000 Joules/m²/day.
      // 1 W/m² = 1 Joule/second/m².
      // PAR fraction of total shortwave ≈ 45%. 
      // Average conversion: 1 MJ/m²/day of shortwave ≈ 2.07 mol/m²/day of PAR.
      const dli = parseFloat((shortwaveRadiationMJ[i] * 2.07 * 0.95).toFixed(1));
      dailyLightIntegral.push(dli);

      // Estimate peak PPFD during maximum noon solar elevation
      // Standard daylight period is approx 43200 seconds (12 hours) with sinusoidal intensity
      // Peak PPFD (umol/m2/s) under noon is estimated as DLI * (Math.PI / 2) * 10^6 / Seconds Of Sunlight
      const peak = Math.round((dli * 1000000 * Math.PI) / (2 * 12 * 3600));
      peakPpfd.push(peak);
    }

    const avgDli = parseFloat((dailyLightIntegral.reduce((a, b) => a + b, 0) / days).toFixed(1));
    let advice = "Optimal quantum light delivery for general C3/C4 leaf photosynthetic saturation.";
    if (avgDli < 12.0) {
      advice = "⚠️ LIGHT DEFICIENCY: Under average 12 mol/m²/day daily light integral (DLI), greenhouse cultivation should engage supplementary lighting fixtures to prevent crop physiological etiolation.";
    } else if (avgDli > 30.0) {
      advice = "☀️ SOL-SATURATION: Elevated solar radiation. Crops might initiate solar-stress photoinhibition. Monitor soil moisture deficits carefully to ease cellular leaf scorching.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      shortwaveRadiationMJ,
      peakPpfd,
      dailyLightIntegral,
      avgDli,
      isLivePar,
      advisory: advice,
      scientificReference: "DLI from forecast shortwave radiation using the standard conversion (≈45% of shortwave is PAR, ≈4.57 µmol per joule). Peak PPFD assumes a 12-hour, sine-shaped day, so treat it as approximate."
    });
  } catch (error: any) {
    console.error("PAR calculations failed:", error);
    res.status(500).json({ error: "Failed to evaluate Photosynthetically Active Radiation loads" });
  }
});



// API Endpoint: Get Soil Salinity & Capillary Rise Modeling

router.post("/api/canopy-stomatal-conductance", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute canopy stomatal parameters" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let tempMax: number[] = []; // °C
    let humidityMean: number[] = []; // %
    let days = 0;
    let isLiveConductance = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,relative_humidity_2m_mean&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.temperature_2m_max) {
          days = Math.min(7, leadingComplete(data.daily.temperature_2m_max, data.daily.relative_humidity_2m_mean));
          tempMax = realSeries(data.daily.temperature_2m_max, days);
          humidityMean = realSeries(data.daily.relative_humidity_2m_mean, days, 0);
          isLiveConductance = days > 0;
        }
      }
    } catch (e) {
      console.warn("Conductance API forecast retrieval error:", e);
    }

    if (!isLiveConductance) {
      return res.status(502).json({ error: "Failed to download temperature metrics for conductance calculation." });
    }

    const dates: string[] = [];
    const vaporPressureDeficitKpa: number[] = [];
    const stomatalConductanceMmol: number[] = []; // mmol H2O / m2 / s (conductance)
    const stomatalClosurePercent: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      // Calculate Vapor Pressure Deficit (VPD):
      // Saturation Vapor Pressure (Es) = 0.6108 * exp((17.27 * T) / (T + 237.3))
      // Actual Vapor Pressure (Ea) = Es * (Humid / 100)
      // VPD = Es - Ea
      const temp = tempMax[i];
      const humid = humidityMean[i];
      const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
      const ea = es * (humid / 100);
      const vpd = parseFloat((es - ea).toFixed(2));
      vaporPressureDeficitKpa.push(vpd);

      // Healthy crop maximum stomatal conductance is around 350-400 mmol/m2/s.
      // High VPD or high temperature restricts conductance as guard cells shrink.
      let conductance = 380;
      if (vpd > 1.5) {
        conductance = Math.round(380 - (vpd - 1.5) * 120);
      }
      if (temp > 28.0) {
        conductance = Math.round(conductance * (1 - (temp - 28.0) * 0.08));
      }
      conductance = Math.max(40, conductance);
      stomatalConductanceMmol.push(conductance);

      const closure = Math.round(100 - (conductance / 380) * 100);
      stomatalClosurePercent.push(Math.max(0, closure));
    }

    const maxVpd = Math.max(...vaporPressureDeficitKpa);
    let stomatalAdvice = "Canopy pores are fully dilated. Free carbon assimilation (photosynthesis) aligns with local humidity parameters.";
    if (maxVpd > 2.0) {
      stomatalAdvice = "⚠️ PHYSIOLOGICAL SHUTDOWN: VPD exceeds 2.0 kPa. Crop stomates have closed to conserve cellulary moisture, halting carbon capture despite full solar irradiance. Irrigate immediately to maintain moisture cushions.";
    } else if (maxVpd > 1.2) {
      stomatalAdvice = "MODERATE TRANSPIRATION: Stomata are active but partially constricted. Crop moisture consumption is elevated. Keep canopy hydrated.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      tempMax,
      humidityMean,
      vaporPressureDeficitKpa,
      stomatalConductanceMmol,
      stomatalClosurePercent,
      maxVpd,
      isLiveConductance,
      advisory: stomatalAdvice,
      biomodelSpecification: "VPD is computed from forecast max temperature and mean humidity (Tetens equation) — pairing the day's max temperature with its mean humidity makes it an upper-end estimate. Conductance and closure are an illustrative response curve (380 mmol/m²/s at low VPD, falling with VPD and heat), not a measurement or a calibrated model."
    });
  } catch (error: any) {
    console.error("Conductance API failing:", error);
    res.status(500).json({ error: "Failed to model crop stomatal conductance" });
  }
});

// API Endpoint: Get NPK Subsurface Leaching & Soil Runoff Hazard Index

router.post("/api/crop-water-efficiency", async (req, res) => {
  try {
    const { lat, lng, crop = "maize" } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute crop water demand" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Mid-season crop coefficients from FAO Irrigation & Drainage Paper 56,
    // Table 12. This replaces an earlier version that invented Kc and a
    // "water use efficiency" with sine/cosine wobbles: WUE needs yield data,
    // which a weather API can't provide, so it is no longer claimed.
    const KC_MID: Record<string, number> = {
      maize: 1.2, wheat: 1.15, barley: 1.15, cotton: 1.15, potato: 1.15, tomato: 1.15,
      soybean: 1.15, "sugar beet": 1.2, rice: 1.2, alfalfa: 0.95, olive: 0.7, grapes: 0.7,
    };
    const cropKey = String(crop).toLowerCase();
    const kc = KC_MID[cropKey];
    if (kc === undefined) {
      return res.status(400).json({ error: `No FAO-56 mid-season Kc for "${crop}". Choose one of: ${Object.keys(KC_MID).join(", ")}.` });
    }

    let times: string[] = [];
    let referenceEt0: number[] = [];
    let precipitation: number[] = [];
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=et0_fao_evapotranspiration,precipitation_sum&forecast_days=7&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && Array.isArray(data.daily.time)) {
          const n = leadingComplete(data.daily.et0_fao_evapotranspiration, data.daily.precipitation_sum);
          times = data.daily.time.slice(0, n);
          referenceEt0 = realSeries(data.daily.et0_fao_evapotranspiration, n);
          precipitation = realSeries(data.daily.precipitation_sum, n);
        }
      }
    } catch (e) {
      console.warn("Crop water demand: Open-Meteo request failed:", e);
    }

    if (times.length === 0) {
      return res.status(502).json({ error: "Failed to get reference evapotranspiration from Open-Meteo." });
    }

    const cropEtc = referenceEt0.map((et0) => parseFloat((et0 * kc).toFixed(1)));
    const sum = (xs: number[]) => parseFloat(xs.reduce((a, b) => a + b, 0).toFixed(1));
    const cumulativeEvapotranspirationMm = sum(referenceEt0);
    const cumulativeCropDemandMm = sum(cropEtc);
    const forecastRainMm = sum(precipitation);
    // Upper bound: full canopy, all forecast rain assumed effective, no credit
    // for water already stored in the soil. The FAO-56 soil water balance is
    // what gives a real irrigation depth; this is the demand side only.
    const netCropDemandMm = parseFloat(Math.max(0, cumulativeCropDemandMm - forecastRainMm).toFixed(1));

    res.json({
      latitude,
      longitude,
      isLiveWue: true,
      crop: cropKey,
      cropKc: kc,
      times,
      referenceEt0,
      cropEtc,
      precipitation,
      cumulativeEvapotranspirationMm,
      cumulativeCropDemandMm,
      forecastRainMm,
      netCropDemandMm,
      availableCrops: Object.keys(KC_MID),
      apiCitation: "ET0 (FAO-56 Penman-Monteith) and rainfall from Open-Meteo; mid-season Kc from FAO-56 Table 12. Crop demand = ET0 × Kc at full canopy.",
    });
  } catch (error: any) {
    console.error("Crop water demand failed:", error);
    res.status(500).json({ error: "Failed to compute crop water demand" });
  }
});

// API Endpoint: Get Pollinator Activity Flight Capability Index
