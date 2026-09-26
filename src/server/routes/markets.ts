// markets endpoints, split out of the single server.ts.
import { Router } from "express";
import { num } from "../series";
import { getGeminiClient } from "../context";

export const router = Router();

router.post("/api/macro-national", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute macro-analytics" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // 1. Resolve country and locality using BigDataCloud Reverse Geocoding API (Keyless)
    // The country decides which national statistics are shown, so it must
    // come from a real lookup. An earlier version fell back to "US" (or
    // guessed Spain/Brazil from a bounding box) and then presented that
    // country's statistics as if they were this location's.
    let countryCode: string | null = null;
    let countryName: string | null = null;
    let localityName: string | null = null;

    try {
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.countryCode) {
          countryCode = geoData.countryCode;
          countryName = geoData.countryName || geoData.countryCode;
          localityName = geoData.city || geoData.locality || geoData.principalSubdivision || null;
        }
      }
    } catch (e) {
      console.warn("Geocoding fetch failed:", e);
    }

    if (!countryCode) {
      return res.status(502).json({ error: "Couldn't determine the country for this location, so no national indicators are shown." });
    }

    // 2. Fetch World Bank indicators for resolved country
    // Since World Bank usually has lag in recent reporting years, query 2021/2022 as robust default values
    const fetchWorldBankMetric = async (indicator: string) => {
      try {
        const url = `http://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&date=2021:2022`;
        const r = await fetch(url);
        if (r.ok) {
          const d = await r.json();
          if (Array.isArray(d) && d.length > 1 && Array.isArray(d[1])) {
            const report = d[1].find((item: any) => item.value !== null);
            if (report && report.value !== undefined) {
              return parseFloat(report.value.toFixed(2));
            }
          }
        }
      } catch (err) {
        console.warn(`World Bank fetch failed for ${indicator}:`, err);
      }
      return null;
    };

    const [agLandPct, fertilizerKgHectare, arableLandPct, ruralPopPct] = await Promise.all([
      fetchWorldBankMetric("AG.LND.AGRI.ZS"), // Agricultural land (% of land area)
      fetchWorldBankMetric("AG.CON.FERT.ZS"), // Fertilizer usage
      fetchWorldBankMetric("AG.LND.ARBL.ZS"), // Arable land (% of total)
      fetchWorldBankMetric("SP.RUR.TOTL.ZS"), // Rural population %
    ]);

    if (agLandPct === null || fertilizerKgHectare === null) {
      return res.status(502).json({ 
        error: `Could not retrieve macro-economic indicators from the World Bank API for ${countryName}. Data may be unavailable for this coordinate.` 
      });
    }

    // 3. Fetch exact photoperiod and daylight parameters from Sunrise-Sunset.org
    let daylightStats: {
      sunrise: string | null; sunset: string | null; dayLengthHours: string | null;
      dayLengthSeconds: number | null; solarNoon: string | null;
    } = { sunrise: null, sunset: null, dayLengthHours: null, dayLengthSeconds: null, solarNoon: null };

    try {
      const sunUrl = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=1`;
      const sunRes = await fetch(sunUrl);
      if (sunRes.ok) {
        const sunData = await sunRes.json();
        if (sunData && sunData.results) {
          const r = sunData.results;
          daylightStats = {
            sunrise: r.sunrise ?? null,
            sunset: r.sunset ?? null,
            dayLengthHours: r.day_length ?? null,
            dayLengthSeconds: null,
            solarNoon: r.solar_noon ?? null,
          };
        }
      }
    } catch (e) {
      console.warn("Sunrise-Sunset API down:", e);
    }

    // 4. Fetch seismic activity within 200km from USGS Earthquake API
    let seismicStressLevel: string = "Unknown (USGS unavailable)";
    let seismicEvents: any[] = [];
    try {
      const usgsUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${latitude}&longitude=${longitude}&maxradiuskm=200&limit=3`;
      const usgsRes = await fetch(usgsUrl);
      if (usgsRes.ok) {
        const usgsData = await usgsRes.json();
        if (usgsData && Array.isArray(usgsData.features)) {
          seismicEvents = usgsData.features.map((f: any) => {
            const props = f.properties || {};
            const geom = f.geometry || {};
            const coords = geom.coordinates || [];
            return {
              id: f.id,
              mag: num(props.mag),
              place: props.place ?? null,
              time: props.time ? new Date(props.time).toISOString().split("T")[0] : null,
              depthKm: num(coords[2]),
            };
          });

          seismicStressLevel = "No events within 200 km (recent USGS catalogue)";
          const mags = seismicEvents.map((e) => e.mag).filter((m): m is number => m !== null);
          if (mags.length > 0) {
            const maxMag = Math.max(...mags);
            if (maxMag > 4.5) seismicStressLevel = "Moderate/Elevated Shear";
            else if (maxMag > 3.0) seismicStressLevel = "Slight Shaking Alert";
            else seismicStressLevel = "Nominal Micro-Tremors (Safe)";
          }
        }
      }
    } catch (e) {
      console.warn("USGS Seismic network offline:", e);
    }

    // 5. Generate AI Policy Assessment from Gemini
    // Plain restatement of the figures when there's no AI summary — no
    // invented conclusions (the old text claimed "fully secure foundation
    // settling" from an earthquake count).
    let policyAdvice = `${countryName}: agricultural land ${agLandPct}% of land area; fertilizer use ${fertilizerKgHectare} kg per hectare of arable land (World Bank, latest of 2021-2022). ` +
      (daylightStats.dayLengthHours ? `Day length today: ${daylightStats.dayLengthHours}. ` : "") +
      `Seismic activity: ${seismicStressLevel}.`;
    
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const prompt = `You are a national agricultural policy specialist and crop analyst. Let's analyze the agronomic indexes for ${localityName ?? "this location"}, ${countryName} (code: ${countryCode}):
        - Total Agricultural Land Area of country: ${agLandPct}%
        - Country's Fertilizer consumption rate: ${fertilizerKgHectare} kg per hectare of arable land
        - Country's total Arable land ratio: ${arableLandPct}%
        - Country Rural Population share: ${ruralPopPct}%
        - Today's Sunlight length at coordinate: ${daylightStats.dayLengthHours}
        - Sub-surface geological safety rating: ${seismicStressLevel} based on recent micro-tremor reports.

        Write a concise, polished, actionable paragraph (approx 65-80 words) telling the grower how they can leverage this regional macro context. Mention what this country's fertilizer index means for regional soil preservation and how the current photoperiod supports solar crops. Keep it highly professional, technical, and human-sounding.`;

        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        if (response && response.text) {
          policyAdvice = response.text.trim();
        }
      } catch (err) {
        console.warn("Gemini macro advisory compile failed:", err);
      }
    }

    res.json({
      latitude,
      longitude,
      countryCode,
      countryName,
      localityName,
      macroStats: {
        agLandPct,
        fertilizerKgHectare,
        arableLandPct,
        ruralPopPct
      },
      daylight: daylightStats,
      seismic: {
        stressLevel: seismicStressLevel,
        events: seismicEvents
      },
      policyAdvice,
      citations: {
        geocoding: "BigDataCloud Open-Access Reverse Geocoding Interface",
        worldbank: "World Bank API Database (v2 Indicators Catalog)",
        astronomical: "Sunrise-Sunset.org Civil Astronomical Daylight Engine",
        geological: "United States Geological Survey (USGS) Seismic Hazards Program"
      }
    });

  } catch (error: any) {
    console.error("Macro national analytics failed:", error);
    res.status(500).json({ error: "Failed to assemble macro policy and daylight indicators" });
  }
});

// API Endpoint: OpenEPI Geographic Soil Properties and Taxonomy (ISRIC Soil Information)

// USDA NASS Quick Stats: national monthly "price received by farmers".
// This used to return a hard-coded table (corn $4.32, "Slightly Bearish",
// "CBOT") labelled as NASS data. It now calls NASS, which needs a free key
// (https://quickstats.nass.usda.gov/api); without one it answers 503.
const NASS_COMMODITIES: Record<string, { commodity: string; prefix: string }> = {
  corn: { commodity: "CORN", prefix: "CORN, GRAIN" },
  soybeans: { commodity: "SOYBEANS", prefix: "SOYBEANS" },
  wheat: { commodity: "WHEAT", prefix: "WHEAT" },
  barley: { commodity: "BARLEY", prefix: "BARLEY" },
  sorghum: { commodity: "SORGHUM", prefix: "SORGHUM, GRAIN" },
  cotton: { commodity: "COTTON", prefix: "COTTON, UPLAND" },
  rice: { commodity: "RICE", prefix: "RICE" },
  potato: { commodity: "POTATOES", prefix: "POTATOES" },
  potatoes: { commodity: "POTATOES", prefix: "POTATOES" },
};
const NASS_MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

router.post("/api/usda-crop-pricing", async (req, res) => {
  try {
    const { cropName } = req.body;
    if (typeof cropName !== "string" || !cropName.trim()) {
      return res.status(400).json({ error: "cropName is required" });
    }
    const spec = NASS_COMMODITIES[cropName.toLowerCase().replace(/[^a-z]/g, "")];
    if (!spec) {
      return res.status(404).json({ error: `USDA NASS has no monthly national price for ${cropName}. Try ${Object.keys(NASS_COMMODITIES).join(", ")}.` });
    }
    const key = process.env.NASS_API_KEY;
    if (!key) {
      return res.status(503).json({ error: "USDA NASS isn't configured on this server (NASS_API_KEY)." });
    }

    const params = new URLSearchParams({
      key,
      source_desc: "SURVEY",
      commodity_desc: spec.commodity,
      statisticcat_desc: "PRICE RECEIVED",
      agg_level_desc: "NATIONAL",
      freq_desc: "MONTHLY",
      year__GE: String(new Date().getFullYear() - 1),
      format: "JSON",
    });
    const r = await fetch(`https://quickstats.nass.usda.gov/api/api_GET/?${params}`);
    let rows: any[] = [];
    if (r.ok) {
      rows = (await r.json())?.data ?? [];
    } else if (r.status !== 400) {
      return res.status(502).json({ error: `USDA NASS returned ${r.status}` });
    }

    let best: { rank: number; price: number; unit: string; row: any } | null = null;
    for (const row of rows) {
      const short = String(row.short_desc ?? "");
      if (!short.startsWith(spec.prefix) || !short.includes(" - PRICE RECEIVED")) continue;
      if (row.domain_desc && row.domain_desc !== "TOTAL") continue;
      const unit = short.match(/MEASURED IN \$ \/ (\w+)/)?.[1];
      const month = NASS_MONTHS.indexOf(String(row.reference_period_desc ?? "").toUpperCase());
      const price = Number(String(row.Value ?? "").replace(/,/g, ""));
      // "(D)" / "(NA)" are withheld values, not zero.
      if (!unit || month < 0 || !Number.isFinite(price) || String(row.Value).trim().startsWith("(")) continue;
      const rank = Number(row.year) * 12 + month;
      if (!best || rank > best.rank) best = { rank, price, unit, row };
    }
    if (!best) {
      return res.status(404).json({ error: `USDA NASS has no recent monthly price for ${cropName}.` });
    }

    const year = Math.floor(best.rank / 12);
    const month = (best.rank % 12) + 1;
    res.json({
      cropName,
      commodity: spec.commodity,
      series: best.row.short_desc,
      period: `${year}-${String(month).padStart(2, "0")}`,
      priceUsd: best.price,
      unit: best.unit.toLowerCase(),
      apiCitation: "US national average price received by farmers, USDA NASS Quick Stats (monthly survey). A reference, not a local bid.",
    });
  } catch (error: any) {
    console.error("USDA NASS price lookup failed:", error);
    res.status(502).json({ error: "Couldn't reach USDA NASS" });
  }
});

// API Endpoint: Open-Meteo GloFAS River Discharge & Forecast

router.get("/api/open-exchange-rates", async (req, res) => {
  try {
    let lives = false;
    let rates: Record<string, number> = { EUR: 0.93, BRL: 5.42, CAD: 1.37, AUD: 1.51, GBP: 0.79, INR: 83.50, CNY: 7.26 };

    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      if (response.ok) {
        const json = await response.json();
        if (json && json.rates) {
          lives = true;
          rates = json.rates;
        }
      }
    } catch (e) {
      console.warn("Open Exchange Rates lookup failed:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to assemble financial market rates from Open Exchange API." });
    }

    res.json({
      isLiveRates: lives,
      base: "USD",
      rates,
      apiCitation: "Global financial exchange ratios updated in real-time from the Open Exchange Rates Network Service."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble financial market rates" });
  }
});

// API Endpoint: Get Dynamic Crop Catalog Sourced via specialized AI lookup

router.post("/api/local-public-holidays", async (req, res) => {
  try {
    const { countryCode = "US", year = new Date().getFullYear() } = req.body;
    let lives = false;
    let holidaysList: any[] = [];

    try {
      const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json) && json.length > 0) {
          lives = true;
          holidaysList = json.map((h: any) => ({
            date: h.date,
            localName: h.localName,
            name: h.name,
            global: h.global,
            types: h.types || ["Public"]
          }));
        }
      }
    } catch (e) {
      console.warn("Nager Holiday API unavailable:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to assemble localized regional public holidays index from Nager API." });
    }

    res.json({
      isLiveHolidays: lives,
      year,
      countryCode,
      holidays: holidaysList,
      apiCitation: "Standard statutory calendar markers and national holiday records sourced live from the Nager Public Holidays Service."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble localized regional public holidays index" });
  }
});

// API Endpoint: Sovereign Nation Profile and Codes from RestCountries

router.post("/api/regional-country-sovereign", async (req, res) => {
  try {
    const { countryCode = "US" } = req.body;
    let lives = false;
    let details = {
      officialName: "United States of America",
      capital: "Washington D.C.",
      population: 331000000,
      region: "Americas",
      subregion: "North America",
      languages: ["English"],
      emergencyDialPrefix: "+1",
      flagUrl: "https://flagcdn.com/w320/us.png"
    };

    try {
      const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json) && json.length > 0) {
          lives = true;
          const raw = json[0];
          details = {
            officialName: raw.name?.official || raw.name?.common || "United States of America",
            capital: Array.isArray(raw.capital) ? raw.capital[0] : "Washington D.C.",
            population: raw.population || 331000000,
            region: raw.region || "Americas",
            subregion: raw.subregion || "North America",
            languages: raw.languages ? Object.values(raw.languages) : ["English"],
            emergencyDialPrefix: raw.idd?.root ? `${raw.idd.root}${raw.idd.suffixes?.[0] || ""}` : "+1",
            flagUrl: raw.flags?.png || `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`
          };
        }
      }
    } catch (e) {
      console.warn("RestCountries API offline:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to assemble national sovereign details from RestCountries." });
    }

    res.json({
      isLiveSovereign: lives,
      countryCode,
      details,
      apiCitation: "Sovereign geographic indicators, national flags, and administrative boundaries retrieved live from the RestCountries Global Database."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble national sovereign details" });
  }
});

// API Endpoint: Open Library Academic & Cultural Crop Literature Handbooks
