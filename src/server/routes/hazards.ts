// hazards endpoints, split out of the single server.ts.
import { Router } from "express";
import { num, leadingComplete, realSeries } from "../series";

export const router = Router();

router.post("/api/air-quality-aerosols", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let pm10: number | null = null;
    let pm2_5: number | null = null;
    let carbonMonoxide: number | null = null;
    let nitrogenDioxide: number | null = null;
    let sulphurDioxide: number | null = null;
    let ozone: number | null = null;
    let dust: number | null = null;
    let isLiveAQ = false;

    try {
      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust&timezone=auto`;
      const response = await fetch(aqUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.current) {
          // `value || default` used to turn a real 0 into a guess; num() keeps
          // a 0 as 0 and a missing value as null.
          const c = data.current;
          pm10 = num(c.pm10);
          pm2_5 = num(c.pm2_5);
          carbonMonoxide = num(c.carbon_monoxide);
          nitrogenDioxide = num(c.nitrogen_dioxide);
          sulphurDioxide = num(c.sulphur_dioxide);
          ozone = num(c.ozone);
          dust = num(c.dust);
          isLiveAQ = pm10 !== null || pm2_5 !== null;
        }
      }
    } catch (e) {
      console.warn("Air quality API stalled:", e);
    }

    if (!isLiveAQ) {
      return res.status(502).json({ error: "Failed to assemble particulate and aerosol telemetry from the environmental provider." });
    }

    // Classify AQI category and dust threat level
    const p25 = pm2_5 ?? 0;
    const p10 = pm10 ?? 0;
    let aqiText = "Good";
    let alertLevel = "No risk for general farming activities";
    if (p25 > 35 || p10 > 50) {
      aqiText = "Moderate";
      alertLevel = "Slight particulate residue risk on sensitive foliage";
    }
    if (p25 > 150 || p10 > 250) {
      aqiText = "Hazardous / Stomata clogging";
      alertLevel = "High aerosol density detected. Postpone pesticide and leaf spraying";
    }

    res.json({
      latitude,
      longitude,
      pm10,
      pm2_5,
      carbonMonoxide,
      nitrogenDioxide,
      sulphurDioxide,
      ozone,
      dust,
      aqiText,
      alertLevel,
      isLiveAQ,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("AQI endpoint failed:", error);
    res.status(500).json({ error: "Failed to compile localized air quality modeling" });
  }
});

// API Endpoint: Get FAO-56 Evapotranspiration & Microclimate Soil Hydric Deficits

router.post("/api/pest-disease-risk", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to calculate pathogen risks" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let tempMax: number[] = [];
    let tempMin: number[] = [];
    let precip: number[] = [];
    let relativeHumidity: number[] = [];
    let days = 0;
    let isLivePathogen = false;

    try {
      // Query daily relative humidity mean, max temp, min temp, and precipitation sum from free open-meteo forecast
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.temperature_2m_max) {
          const d = data.daily;
          days = Math.min(7, leadingComplete(d.temperature_2m_max, d.temperature_2m_min, d.precipitation_sum, d.relative_humidity_2m_mean));
          tempMax = realSeries(d.temperature_2m_max, days);
          tempMin = realSeries(d.temperature_2m_min, days);
          precip = realSeries(d.precipitation_sum, days);
          relativeHumidity = realSeries(d.relative_humidity_2m_mean, days);
          isLivePathogen = days > 0;
        }
      }
    } catch (e) {
      console.warn("Pathogen API failed:", e);
    }

    if (!isLivePathogen) {
      return res.status(502).json({ error: "Failed to download pest and disease metrics from the Open Meteo API." });
    }

    // Propose 7 days of risk modeling
    const dates: string[] = [];
    const downyMildewRisk: number[] = [];
    const lateBlightRisk: number[] = [];
    const stemRustRisk: number[] = [];
    const leafWetnessHours: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      // Calculate Leaf Wetness Hours (LWD) dynamic proxy: scale with average humidity and rain presence
      const rh = relativeHumidity[i];
      const ran = precip[i];
      let lwd = Math.max(0, parseFloat(((rh - 60) * 0.35 + (ran > 0 ? 4 : 0)).toFixed(1)));
      lwd = Math.min(24, lwd);
      leafWetnessHours.push(lwd);

      // 1. Downy Mildew Risk Index (Plasmopara viticola)
      // Thrives with Leaf Wetness and temp is between 12 and 24 degrees C
      const avgT = (tempMax[i] + tempMin[i]) / 2;
      let dmRisk = 0;
      if (avgT >= 10 && avgT <= 25) {
        dmRisk = (lwd / 12) * 50 + (rh > 80 ? 30 : 10) + (ran > 0 ? 20 : 0);
      } else {
        dmRisk = (lwd / 15) * 20;
      }
      downyMildewRisk.push(Math.round(Math.min(100, Math.max(0, dmRisk))));

      // 2. Potato/Tomato Late Blight Risk (Phytophthora infestans)
      // High humidity (>90%) for prolonged times is crucial
      let blight = 0;
      if (tempMin[i] >= 10 && rh >= 85) {
        blight = (lwd / 10) * 60 + (rh - 80) * 2;
      } else {
        blight = (rh > 80 ? 20 : 5);
      }
      lateBlightRisk.push(Math.round(Math.min(100, Math.max(0, blight))));

      // 3. Wheat Stem Rust Risk (Puccinia graminis)
      // Warm daytime temperatures coupled with dew/leaf wetness in the morning
      let rust = 0;
      if (tempMax[i] >= 18 && tempMax[i] <= 30) {
        rust = (lwd / 10) * 40 + (tempMax[i] - 15) * 3;
      } else {
        rust = rh * 0.3;
      }
      stemRustRisk.push(Math.round(Math.min(100, Math.max(0, rust))));
    }

    // Calculate aggregate risk summary metrics
    const avgDm = Math.round(downyMildewRisk.reduce((a, b) => a + b, 0) / days);
    const avgBlight = Math.round(lateBlightRisk.reduce((a, b) => a + b, 0) / days);
    const avgRust = Math.round(stemRustRisk.reduce((a, b) => a + b, 0) / days);

    let biocontrolRecommendation = "All disease vectors are currently within safe baseline parameters. Standard preventative biological coating applies.";
    if (avgDm > 60 || avgBlight > 60 || avgRust > 60) {
      biocontrolRecommendation = "Favorable spore gestation atmosphere expected. We recommend reinforcing copper-based biological shield or Bacillus subtilis sprays prior to incoming rain events.";
    } else if (avgDm > 40 || avgBlight > 40 || avgRust > 40) {
      biocontrolRecommendation = "Sub-critical disease risk values. Initiate periodic physical inspection underleaf and maintain low-frequency organic fungicide coverage.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      downyMildewRisk,
      lateBlightRisk,
      stemRustRisk,
      leafWetnessHours,
      avgDm,
      avgBlight,
      avgRust,
      biocontrolRecommendation,
      isLivePathogen,
      // Honest description of what this is. It is NOT a validated disease
      // model (an earlier version claimed "Smith-Period and Senteligo"
      // algorithms, which it never implemented).
      scientificModel: "Rule-of-thumb risk scores (0-100) from the daily forecast: mean humidity, temperature band and rain. Leaf wetness is a rough proxy from humidity, not measured. Use as a prompt to scout, not as a validated disease forecast."
    });
  } catch (error: any) {
    console.error("Pathogen modeling error:", error);
    res.status(500).json({ error: "Failed to compile agronomic disease risk profiles" });
  }
});

// API Endpoint: Get Solar Energy Potential & Irradiance Analysis (GHI, DNI, DIF, PV yield)

router.post("/api/cropland-fire-risk", async (req, res) => {
  try {
    const { lat, lng, annualPrecip = 850 } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to calculate forest/field combustive risks" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let currentTempMax: number | null = null;
    let windSpeedMax: number | null = null;
    let humidityMean: number | null = null;
    let recentDrySpellDays: number | null = null;

    try {
      // Past 30 days of observed rain so the dry spell is counted backwards
      // from today — an earlier version counted trailing dry days at the END
      // of the forecast and then added an invented 6-day "baseline".
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=wind_speed_10m,relative_humidity_2m&daily=temperature_2m_max,precipitation_sum&past_days=30&forecast_days=1&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        windSpeedMax = num(data.current?.wind_speed_10m);
        humidityMean = num(data.current?.relative_humidity_2m);
        const daily = data.daily;
        if (daily && Array.isArray(daily.precipitation_sum) && Array.isArray(daily.temperature_2m_max)) {
          currentTempMax = num(daily.temperature_2m_max[daily.temperature_2m_max.length - 1]);
          // Observed days only (everything before the final, forecast day).
          const observed: unknown[] = daily.precipitation_sum.slice(0, -1);
          let dryCount = 0;
          let complete = true;
          for (let i = observed.length - 1; i >= 0; i--) {
            const v = observed[i];
            if (typeof v !== "number") { complete = false; break; }
            if (v < 0.2) dryCount++; else break;
          }
          // A gap in the record means we can't say how long it's been dry.
          recentDrySpellDays = complete || dryCount > 0 ? dryCount : null;
        }
      }
    } catch (e) {
      console.warn("Fire weather request failed:", e);
    }

    if (currentTempMax === null || windSpeedMax === null || humidityMean === null || recentDrySpellDays === null) {
      return res.status(502).json({ error: "Failed to download complete fire weather conditions from Open-Meteo." });
    }

    // A heuristic dryness score on a 0-800 scale. NOT the Keetch-Byram
    // Drought Index (which needs a daily running soil-moisture budget); an
    // earlier version labelled it as KBDI.
    const baseKbdi = Math.min(800, Math.max(0, Math.round(
      (recentDrySpellDays * 12) + (currentTempMax * 6.5) - (annualPrecip * 0.15)
    )));

    // Fire Weather Index (FWI) hazard rating
    let riskRating: "Low" | "Moderate" | "High" | "Extremely Combustive" = "Low";
    if (baseKbdi > 600 || (currentTempMax > 35 && windSpeedMax > 25)) {
      riskRating = "Extremely Combustive";
    } else if (baseKbdi > 400 || (currentTempMax > 30 && windSpeedMax > 15)) {
      riskRating = "High";
    } else if (baseKbdi > 200 || humidityMean < 40) {
      riskRating = "Moderate";
    }

    let combustibleMaterialClass = "Cured fine forest grass and twigs ignite instantly with sustained burning";
    if (riskRating === "Low") {
      combustibleMaterialClass = "High relative fuel moisture dampens spore and matches combustion success.";
    } else if (riskRating === "Moderate") {
      combustibleMaterialClass = "Litter layer begins drying out. Windward surface burns easily.";
    } else if (riskRating === "High") {
      combustibleMaterialClass = "Deep duff and slash piles combust with vigor. Difficult to contain.";
    }

    res.json({
      latitude,
      longitude,
      kbdiScore: baseKbdi,
      riskRating,
      windSpeedKph: windSpeedMax,
      humidityPercentage: humidityMean,
      excessDrySpellDays: recentDrySpellDays,
      combustibleMaterialClass,
      isLiveFire: true,
      algorithmDisclaimer: "Heuristic dryness score (0-800) from days since measurable rain (observed), today's forecast max temperature and your annual rainfall. It borrows the KBDI scale for familiarity but is not the Keetch-Byram Drought Index. For official fire danger, use your national service or EFFIS."
    });
  } catch (error: any) {
    console.error("Wildfire calculation failed:", error);
    res.status(500).json({ error: "Failed to map cropland wildfire and flammability indices" });
  }
});

// API Endpoint: Get Chilling Hours & Deciduous Winter Dormancy Accumulation

router.post("/api/openepi-forest-fire", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute wildfire danger severity" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let fireIndexValue: number | null = null;
    let dangerRating: string | null = null;
    let isLiveOpenEpiFire = false;

    try {
      const fireUrl = `https://api.openepi.io/forest-fire/forecast?lat=${latitude}&lon=${longitude}`;
      const fireRes = await fetch(fireUrl);
      if (fireRes.ok) {
        const fireJson = await fireRes.json();
        if (fireJson && fireJson.properties) {
          const f = fireJson.properties;
          fireIndexValue = num(f.fwi);
          dangerRating = typeof f.danger_rating_description === "string" ? f.danger_rating_description : null;
          isLiveOpenEpiFire = fireIndexValue !== null || dangerRating !== null;
        }
      }
    } catch (e) {
      console.warn("OpenEPI Forest Fire API fetch failed:", e);
    }

    if (!isLiveOpenEpiFire) {
      return res.status(502).json({ error: "Failed to load Copernicus fire forecast vectors from the upstream provider." });
    }

    res.json({
      latitude,
      longitude,
      fireIndexValue,
      dangerRating,
      isLiveOpenEpiFire,
      apiCitation: "Wildfire prognosis indices compiled by Copernicus European Forest Fire Information System (EFFIS) and streamed via OpenEPI forecast gateways."
    });
  } catch (error: any) {
    console.error("OpenEPI Forest Fire API failure:", error);
    res.status(500).json({ error: "Failed to map Copernicus forest fire forecast vectors" });
  }
});

// API Endpoint: Server-side secure routing proxy for NASA POWER Daily Agrometeorology database (avoiding mixed contents or frontend timeouts)

router.post("/api/allergen-pollen-forecast", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to forecast regional allergological indices" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Pollen is only modelled for some regions (Europe, for Open-Meteo): a
    // missing value is null, not "0 grains", which would read as "no pollen".
    let birchPollen: number | null = null;
    let grassPollen: number | null = null;
    let ragweedPollen: number | null = null;
    let isLiveAllergen = false;

    try {
      const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=birch_pollen,grass_pollen,ragweed_pollen&timezone=auto`;
      const pollenRes = await fetch(pollenUrl);
      if (pollenRes.ok) {
        const pollenJson = await pollenRes.json();
        if (pollenJson && pollenJson.current) {
          birchPollen = num(pollenJson.current.birch_pollen);
          grassPollen = num(pollenJson.current.grass_pollen);
          ragweedPollen = num(pollenJson.current.ragweed_pollen);
          isLiveAllergen = birchPollen !== null || grassPollen !== null || ragweedPollen !== null;
        }
      }
    } catch (e) {
      console.warn("Open-Meteo Pollen API failed:", e);
    }

    if (!isLiveAllergen) {
      return res.status(502).json({ error: "No pollen forecast for this location — Open-Meteo's pollen model covers Europe only." });
    }

    const totalSeverity = parseFloat(((birchPollen ?? 0) + (grassPollen ?? 0) + (ragweedPollen ?? 0)).toFixed(1));
    let dangerCategory = "Low Risk";
    if (totalSeverity > 50) dangerCategory = "Severe Allergen Threshold";
    else if (totalSeverity > 20) dangerCategory = "High Atmospheric Load";
    else if (totalSeverity > 5) dangerCategory = "Moderate Allergy Level";

    res.json({
      latitude,
      longitude,
      isLiveAllergen,
      allergens: {
        birchPollen,
        grassPollen,
        ragweedPollen,
        dangerCategory,
        totalSeverity
      },
      apiCitation: "Atmospheric allergen spore variables fetched in real-time from Open-Meteo Air Quality climatology vectors."
    });
  } catch (error: any) {
    console.error("Allergen forecast failed:", error);
    res.status(500).json({ error: "Failed to assemble high-fidelity aero-allergent grids" });
  }
});

// API Endpoint: Herbaceous crop botanical encyclopedia proxy (companion plants, watering intervals, pruning schedules) with live GBIF Taxonomy integration

router.post("/api/gdacs-active-hazards", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates required to calculate hazard radii" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    const nearbyHazards: any[] = [];

    try {
      const gdacsUrl = "https://www.gdacs.org/xml/gdacs.geojson";
      const response = await fetch(gdacsUrl);
      if (response.ok) {
        const geojson = await response.json();
        if (geojson && Array.isArray(geojson.features)) {
          lives = true;
          // Haversine distance helper (approximate)
          const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          geojson.features.forEach((feat: any) => {
            if (feat.geometry && feat.geometry.coordinates) {
              const [geomLng, geomLat] = feat.geometry.coordinates;
              const dist = calculateDistance(latitude, longitude, geomLat, geomLng);
              // Focus on threats within 1000 km radius
              if (dist < 1000) {
                const props = feat.properties || {};
                nearbyHazards.push({
                  id: props.eventid || Math.random().toString(),
                  name: props.eventname || props.name || "Unnamed Episode",
                  type: props.eventtype || "Unknown Hazard",
                  severity: props.severity || "Moderate",
                  level: props.alertlevel || "Green",
                  distanceKm: parseFloat(dist.toFixed(1)),
                  date: props.fromdate || "Recent"
                });
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn("GDACS live risk feed parsing issue:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to resolve active global natural threats from GDACS." });
    }

    res.json({
      latitude,
      longitude,
      isLiveGdacs: lives,
      hazards: nearbyHazards.slice(0, 5),
      apiCitation: "Disaster warning systems queried live from the United Nations & European Commission Global Disaster Alert Joint Research Centre."
    });
  } catch (error: any) {
    console.error("GDACS hazard filter route failed:", error);
    res.status(500).json({ error: "Failed to resolve active global natural threats" });
  }
});

// API Endpoint: USGS Seismic Event Radial Search

router.post("/api/usgs-seismic-radial", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates required to calculate tectonic alignments" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let events: any[] = [];

    try {
      const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradiuskm=350&limit=8&minmagnitude=1.0`;
      const response = await fetch(usgsUrl);
      if (response.ok) {
        const geojson = await response.json();
        if (geojson && Array.isArray(geojson.features)) {
          lives = true;
          events = geojson.features.map((feat: any) => {
            const props = feat.properties || {};
            const coords = feat.geometry?.coordinates || [];
            return {
              id: feat.id,
              place: props.place || "Subsurface shift",
              magnitude: props.mag || 1.2,
              time: props.time ? new Date(props.time).toLocaleDateString() : "Historical",
              tsunami: props.tsunami === 1,
              depthKm: coords[2] !== undefined ? parseFloat(coords[2].toFixed(1)) : 10.0,
              feltCount: props.felt || 0
            };
          });
        }
      }
    } catch (e) {
      console.warn("USGS Earthquake API coordinate check network issue:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to download tectonic alignments from the USGS Earthquake API." });
    }

    res.json({
      latitude,
      longitude,
      isLiveUsgsSeismic: lives,
      events,
      apiCitation: "Planetary seismicity data retrieved directly from the United States Geological Survey Earthquake Hazards Program."
    });
  } catch (error: any) {
    console.error("USGS seismic proxy route caught error:", error);
    res.status(500).json({ error: "Failed to assemble geological seismic strain" });
  }
});

// API Endpoint: USGS Water Watch Hydrologics Site Feed

// Satellite-navigation effects per geomagnetic storm level, paraphrased from
// NOAA's scale descriptions (https://www.swpc.noaa.gov/noaa-scales-explanation).
// NOAA lists none for G1-G2. The old version invented its own "GPS integrity"
// classes from the max of R/S/G and defaulted missing scales to 0.
const NOAA_G_GNSS: Record<number, string> = {
  3: "Intermittent satellite navigation and low-frequency radio navigation problems may occur.",
  4: "Satellite navigation degraded for hours; low-frequency radio navigation disrupted.",
  5: "Satellite navigation may be degraded for days; low-frequency radio navigation out for hours.",
};

router.get("/api/noaa-space-weather-activity", async (req, res) => {
  try {
    const response = await fetch("https://services.swpc.noaa.gov/products/noaa-scales.json");
    const json = response.ok ? await response.json() : null;
    const current = json?.["0"];
    if (!current) {
      return res.status(502).json({ error: "Failed to load space weather scales from NOAA." });
    }
    // NOAA sends the scale as a string ("0".."5"); a missing one stays null.
    const scale = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
    const geomagneticStorms = scale(current.G?.Scale);
    res.json({
      isLiveSpaceWeather: true,
      observedAt: current.DateStamp && current.TimeStamp ? `${current.DateStamp}T${current.TimeStamp}Z` : null,
      scales: {
        radioBlackouts: scale(current.R?.Scale),
        radiationStorms: scale(current.S?.Scale),
        geomagneticStorms,
        gnssEffect: geomagneticStorms !== null ? NOAA_G_GNSS[geomagneticStorms] ?? null : null,
      },
      apiCitation: "Current R/S/G space weather scales from the NOAA Space Weather Prediction Center. Navigation effects are NOAA's scale descriptions.",
    });
  } catch {
    res.status(502).json({ error: "Couldn't reach NOAA SWPC" });
  }
});

// API Endpoint: Keyless IP-based client geolocation proxy

router.get("/api/nasa-eonet-active-events", async (req, res) => {
  try {
    let lives = false;
    let events: any[] = [];
    try {
      const response = await fetch("https://eonet.gsfc.nasa.gov/api/v3/events?limit=8&status=open");
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.events)) {
          lives = true;
          events = json.events.map((ev: any) => {
            const latLng = ev.geometries?.[0]?.coordinates;
            return {
              id: ev.id,
              title: ev.title,
              category: ev.categories?.[0]?.title || "Climatic Hazard",
              date: ev.geometries?.[0]?.date || new Date().toISOString(),
              coordinates: Array.isArray(latLng) && latLng.length >= 2 ? { lat: latLng[1], lng: latLng[0] } : null,
              link: ev.sources?.[0]?.url || ev.link || "https://eonet.gsfc.nasa.gov"
            };
          });
        }
      }
    } catch (e) {
      console.warn("NASA EONET Service down:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to fetch active natural events from NASA EONET API. Service may be down or rate-limited." });
    }

    res.json({
      isLiveNasaEonet: lives,
      events,
      apiCitation: "Near real-time planetary events, severe storm tracks, and wildfire warnings parsed directly from NASA Earth Observatory Natural Event Tracker (EONET)."
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch NASA EONET climatic hazards" });
  }
});

// API Endpoint: Sunrise-Sunset Solar Ephemerides and Photoperiod Planning
