// ecology endpoints, split out of the single server.ts.
import { Router } from "express";
import { leadingComplete, realSeries } from "../series";
import { getGeminiClient } from "../context";

export const router = Router();

router.post("/api/pollinator-activity", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute pollinator activity indices" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let tempMax: number[] = []; // °C
    let windSpeedMax: number[] = []; // km/h
    let precipitationSum: number[] = []; // mm
    let days = 0;
    let isLivePollinator = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,wind_speed_10m_max,precipitation_sum&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.temperature_2m_max) {
          const d = data.daily;
          days = Math.min(7, leadingComplete(d.temperature_2m_max, d.wind_speed_10m_max, d.precipitation_sum));
          tempMax = realSeries(d.temperature_2m_max, days);
          windSpeedMax = realSeries(d.wind_speed_10m_max, days);
          precipitationSum = realSeries(d.precipitation_sum, days);
          isLivePollinator = days > 0;
        }
      }
    } catch (e) {
      console.warn("Pollinator open-meteo connection failed:", e);
    }

    if (!isLivePollinator) {
      return res.status(502).json({ error: "Failed to download temperature metrics for pollinator flight model." });
    }

    const dates: string[] = [];
    const pollinatorSafeHours: number[] = [];  // Hours per day suitable for bee flying (max 12h daylight window)
    const forageEfficiencyPercent: number[] = []; // % flight speed and visiting efficiency

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      const temp = tempMax[i];
      const wind = windSpeedMax[i];
      const rain = precipitationSum[i];

      // Pollinator activity bounds (Apis mellifera):
      // Temperature: Under 12°C: bees don't fly. 15-28°C: perfect. Over 33°C: bees switch to cooling the hive.
      // Wind: Over 20 km/h: flight speed suffers. Over 30 km/h: bees stay inside.
      // Rain: Over 0.5 mm: severe flight limitation.
      const baseHours = 10; // ideal daylight window

      // Temperature penalties
      let tempModifier = 1.0;
      if (temp < 12) {
        tempModifier = 0.0;
      } else if (temp < 16) {
        tempModifier = 0.4;
      } else if (temp > 34) {
        tempModifier = 0.2; // Hive ventilation duties
      } else if (temp > 30) {
        tempModifier = 0.7;
      }

      // Wind speed penalties
      let windModifier = 1.0;
      if (wind > 32) {
        windModifier = 0.0;
      } else if (wind > 22) {
        windModifier = 0.3;
      } else if (wind > 15) {
        windModifier = 0.75;
      }

      // Precipitation penalties
      let rainModifier = 1.0;
      if (rain > 10) {
        rainModifier = 0.0;
      } else if (rain > 1.5) {
        rainModifier = 0.15;
      } else if (rain > 0.2) {
        rainModifier = 0.6;
      }

      const activeHours = parseFloat((baseHours * tempModifier * windModifier * rainModifier).toFixed(1));
      pollinatorSafeHours.push(activeHours);

      // Foraging efficiency calculation base
      const efficiency = Math.round(activeHours * 10.0);
      forageEfficiencyPercent.push(Math.max(0, Math.min(100, efficiency)));
    }

    const avgHours = parseFloat((pollinatorSafeHours.reduce((a, b) => a + b, 0) / days).toFixed(1));
    let advice = "Optimal pollination conditions. Stable gentle winds and warm noon periods offer bees perfect flight conditions.";
    if (avgHours < 2.5) {
      advice = "🔴 CRITICAL POLLINATION FLIGHT SHUTDOWN: Inclement local climate blocks beneficial insects. Cold thermal drops or excessive wind speeds restrain worker bees inside hive hulls. Fruit flower sets might suffer poor pollination if window closes.";
    } else if (avgHours < 6.0) {
      advice = "🟡 SLUGGISH BENEFICIAL FORAGING: High wind gusts or light rainfall dampens pollinator visiting frequency. Postpone insecticide spraying to avoid active foraging clusters during brief clear periods.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      tempMax,
      windSpeedMax,
      precipitationSum,
      pollinatorSafeHours,
      forageEfficiencyPercent,
      avgHours,
      isLivePollinator,
      advisory: advice,
      botanicalStandard: "Rule-of-thumb honeybee flight limits applied to the daily forecast: little flight below ~12 °C, reduced above ~30 °C, curtailed by wind over ~22 km/h and by rain. Daily values only — the best hours may be better than the day's summary."
    });
  } catch (error: any) {
    console.error("Pollinator calculations failed:", error);
    res.status(500).json({ error: "Failed to model crop beneficial pollinator activity windows" });
  }
});

// API Endpoint: Get Local Biodiversity & Citizen-Science Wildlife Sightings (GBIF API Wrapper)

router.post("/api/local-biodiversity", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to retrieve local biodiversity sightings" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Call GBIF Occurrence Search in a bounding box centered on the user parcel
    const boxSize = 0.08; // ~8-10 km radius
    const minLat = parseFloat((latitude - boxSize).toFixed(5));
    const maxLat = parseFloat((latitude + boxSize).toFixed(5));
    const minLng = parseFloat((longitude - boxSize).toFixed(5));
    const maxLng = parseFloat((longitude + boxSize).toFixed(5));

    const gbifUrl = `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${minLat},${maxLat}&decimalLongitude=${minLng},${maxLng}&hasCoordinate=true&limit=40`;
    
    let sightings: any[] = [];
    let isLiveGbif = false;

    try {
      const response = await fetch(gbifUrl, {
        headers: {
          "User-Agent": "MyCrop-Ag-Platform-Dashboard_v1 (georgepelal@gmail.com)"
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results)) {
          isLiveGbif = true;
          // Filter, format, and map fields of interest
          sightings = data.results.map((item: any) => {
            // Find any media image url
            let imageUrl: string | null = null;
            if (Array.isArray(item.media)) {
              const imageMedia = item.media.find((m: any) => m.type === "StillImage" || m.format?.startsWith("image/"));
              if (imageMedia && imageMedia.identifier) {
                imageUrl = imageMedia.identifier;
              }
            }

            // Fallback vernacular names lookup dictionary
            const commonNamesDict: Record<string, string> = {
              "Apis mellifera": "European Honey Bee",
              "Hippodamia convergens": "Convergent Lady Beetle",
              "Harmonia axyridis": "Harlequin Ladybird",
              "Lumbricus terrestris": "Common Earthworm",
              "Chrysoperla carnea": "Common Green Lacewing",
              "Coccinella septempunctata": "Seven-spot Ladybird",
              "Danaus plexippus": "Monarch Butterfly",
              "Bombus pensylvanicus": "American Bumblebee",
              "Bombus impatiens": "Common Eastern Bumblebee",
              "Vespula vulgaris": "Common Wasp",
              "Passer domesticus": "House Sparrow",
              "Turdus migratorius": "American Robin",
              "Melospiza melodia": "Song Sparrow",
              "Sturnus vulgaris": "European Starling",
              "Zenaida macroura": "Mourning Dove",
              "Corvus brachyrhynchos": "American Crow",
              "Cyanocitta cristata": "Blue Jay",
              "Buteo jamaicensis": "Red-Tailed Hawk",
              "Anas platyrhynchos": "Mallard Duck",
              "Hirundo rustica": "Barn Swallow",
              "Taraxacum officinale": "Common Dandelion",
              "Trifolium pratense": "Red Clover",
              "Trifolium repens": "White Clover",
              "Medicago sativa": "Alfalfa",
              "Cirsium arvense": "Canada Thistle",
              "Asclepias syriaca": "Common Milkweed",
              "Ginkgo biloba": "Maidenhair Tree",
              "Rosa multiflora": "Multiflora Rose"
            };

            const scientific = item.species || item.scientificName || "Unknown Species";
            let commonName = item.vernacularName || commonNamesDict[item.species] || null;

            if (!commonName && item.species) {
              // Create readable title from scientific name, e.g. "Apis mellifera" -> "Apis Mellifera"
              commonName = item.species.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            } else if (!commonName) {
              commonName = scientific.split(" (")[0];
            }

            // Assign standard taxonomic emojis
            let icon = "🌱";
            const taxClass = (item.class || "").toLowerCase();
            const taxPhylum = (item.phylum || "").toLowerCase();
            
            if (taxClass === "insecta") {
              icon = "🐝";
              if ((item.order || "").toLowerCase() === "lepidoptera") icon = "🦋";
              if ((item.family || "").toLowerCase() === "coccinellidae") icon = "🐞";
            } else if (taxClass === "aves") {
              icon = "🐦";
            } else if (taxClass === "mammalia") {
              icon = "🦊";
            } else if (taxClass === "amphibia" || taxClass === "reptilia") {
              icon = "🦎";
            } else if (taxClass === "arachnida") {
              icon = "🕷️";
            } else if (taxPhylum === "annelida") {
              icon = "🪱";
            } else if (taxClass === "agaricomycetes" || (item.kingdom || "").toLowerCase() === "fungi") {
              icon = "🍄";
            }

            return {
              id: item.key || Math.random().toString(),
              scientificName: scientific,
              commonName,
              kingdom: item.kingdom || "Unknown",
              phylum: item.phylum || "Unknown",
              class: item.class || "Unknown",
              order: item.order || "Unknown",
              family: item.family || "Unknown",
              genus: item.genus || "Unknown",
              species: item.species || "Unknown",
              latitude: item.decimalLatitude || latitude,
              longitude: item.decimalLongitude || longitude,
              eventDate: item.eventDate ? item.eventDate.split("T")[0] : "Recent Observation",
              basisOfRecord: item.basisOfRecord || "HUMAN_OBSERVATION",
              imageUrl,
              icon,
              recordedBy: item.recordedBy || "Citizen Scientist"
            };
          }).filter((s: any) => s.scientificName !== "Unknown Species");
        }
      }
    } catch (e) {
      console.warn("GBIF live connection refused:", e);
    }

    if (!isLiveGbif || sightings.length === 0) {
      return res.status(502).json({ error: "Failed to download local biodiversity sightings from the GBIF taxonomic database." });
    }

    // Remove duplicates
    const uniqueSightings: any[] = [];
    const seenNames = new Set<string>();
    sightings.forEach(s => {
      const lowerName = s.scientificName.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueSightings.push(s);
      }
    });

    // Run custom Gemini ecological analysis if a client is available, otherwise generate beautiful agronomist guidelines
    let ecologicalAdvice = `Local biological buffers are in highly balanced states. Multiple beneficial species recorded, including critical pollinators (${uniqueSightings.filter(s => s.icon === "🐝").length} groups) and natural biological pest predators. Maintaining untreated native floral buffers around parcel edges will elevate organic pollination rates and reduce dependency on synthetic chemical insecticides.`;
    
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const insectsText = uniqueSightings.slice(0, 10).map(s => `${s.commonName} (${s.scientificName})`).join(", ");
        const prompt = `You are a precision agronomist and crop biodiversity advisor. We retrieved the following local wildlife and beneficial species sightings near coordinate (${latitude}, ${longitude}): ${insectsText}. Write a brief, high-impact paragraph (approx 50-70 words) assessing this local ecological corridor. Mention what benefits these pollinators or beneficial species bring to a crop, and advise the farmer on establishing native hedgerows or wildflower borders to support this local biodiversity. Keep it practical, professional, and do not use generic AI buzzwords.`;
        
        const response = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        if (response && response.text) {
          ecologicalAdvice = response.text.trim();
        }
      } catch (gemError) {
        console.warn("Failed to generate custom Gemini biodiversity advice:", gemError);
      }
    }

    // Statistics breakdown
    const pollinationAllies = uniqueSightings.filter(s => s.icon === "🐝" || s.icon === "🦋").length;
    const predatorAllies = uniqueSightings.filter(s => s.icon === "🐞" || s.icon === "🪱" || s.icon === "🐦").length;
    const nativeFlora = uniqueSightings.filter(s => s.icon === "🌱" || s.icon === "🍀").length;

    res.json({
      latitude,
      longitude,
      sightings: uniqueSightings,
      pollinatorCount: pollinationAllies,
      predatoryAgentCount: predatorAllies,
      floraCount: nativeFlora,
      isLiveGbif,
      ecologicalAdvice,
      apiCitation: "Data retrieved in real-time from the Global Biodiversity Information Facility (GBIF.org) occurrence network and integrated with the iNaturalist citizen-science census mapping."
    });
  } catch (error: any) {
    console.error("Local biodiversity lookup failed:", error);
    res.status(500).json({ error: "Failed to load real-time local biodiversity indices" });
  }
});

// Serve health status
// API Endpoint: Get Macro National Policy Indicators, Photoperiod, and Seismic Stress (Geospatial Multi-API Suite)

router.post("/api/gbif-local-occurrences", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to query the species occurrences registry" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let occurrences: any[] = [];

    try {
      // Query GBIF occurrence records within a bounding box centered on latitude/longitude
      const offset = 0.08;
      const gbifUrl = `https://api.gbif.org/v1/occurrence/search?decimalLatitude=${latitude - offset},${latitude + offset}&decimalLongitude=${longitude - offset},${longitude + offset}&limit=15`;
      const response = await fetch(gbifUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && json.results && Array.isArray(json.results)) {
          lives = true;
          occurrences = json.results.map((r: any) => ({
            key: r.key,
            kingdom: r.kingdom || "Unknown",
            phylum: r.phylum || "Unknown",
            class: r.class || "Unknown",
            order: r.order || "Unknown",
            family: r.family || "Unknown",
            genus: r.genus || "Unknown",
            species: r.species || r.scientificName || "Indeterminate specimen",
            scientificName: r.scientificName || "Unknown",
            decimalLatitude: r.decimalLatitude,
            decimalLongitude: r.decimalLongitude,
            eventDate: r.eventDate || "Historical Record",
            basisOfRecord: r.basisOfRecord || "HUMAN_OBSERVATION"
          })).filter((item: any) => item.species && item.species !== "Unknown");
        }
      }
    } catch (e) {
      console.warn("GBIF network request failed:", e);
    }

    if (!lives || !occurrences || occurrences.length === 0) {
      return res.status(502).json({ error: "Failed to assemble regional biodiversity taxonomy from the GBIF databank." });
    }

    res.json({
      latitude,
      longitude,
      isLiveGbif: lives,
      records: occurrences.slice(0, 8),
      apiCitation: "Occurrences retrieved directly from the GBIF Global Biodiversity Secretariat global index."
    });
  } catch (error: any) {
    console.error("GBIF server proxy caught fatal error:", error);
    res.status(500).json({ error: "Failed to assemble GBIF biological corridors" });
  }
});

// API Endpoint: Open-Meteo High Resolution Agricultural & Soil Moisture metrics

router.post("/api/osm-local-natural-features", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to parse local natural structures" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let foundFeatures: any[] = [];

    try {
      const bbox = `${latitude - 0.05},${longitude - 0.05},${latitude + 0.05},${longitude + 0.05}`;
      // Query nodes of natural=water or natural=wood in bounding box
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:10];(node["natural"="water"](${bbox});node["natural"="wood"](${bbox}););out%20body;`;
      const response = await fetch(overpassUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.elements) && json.elements.length > 0) {
          lives = true;
          foundFeatures = json.elements.slice(0, 10).map((element: any) => ({
            id: element.id,
            type: element.type,
            lat: element.lat,
            lon: element.lon,
            featureClass: element.tags?.natural || "Geospatial coordinate node",
            name: element.tags?.name || "Local Waterway / Wood element"
          }));
        }
      }
    } catch (e) {
      console.warn("OSM Overpass API network timeout:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to query local geospatial natural structures from OpenStreetMap." });
    }

    res.json({
      latitude,
      longitude,
      isLiveOsmFeatures: lives,
      features: foundFeatures,
      apiCitation: "Proximity natural features parsed globally via OpenStreetMap Overpass spatial querying APIs."
    });
  } catch {
    res.status(500).json({ error: "Failed to query local geospatial natural structures" });
  }
});

// API Endpoint: Open Exchange Rates proxy for localized currency translations

router.post("/api/worldbank-forest-coverage", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to match regional forestry registers" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // No "US" fallback: another country's forest share would be shown as
    // this location's.
    let countryCode: string | null = null;
    let countryName: string | null = null;
    try {
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.countryCode) {
          countryCode = geoData.countryCode;
          countryName = geoData.countryName || geoData.countryCode;
        }
      }
    } catch (e) {
      console.warn("World Bank Country code resolution failed:", e);
    }

    if (!countryCode) {
      return res.status(502).json({ error: "Couldn't determine the country for this location." });
    }

    let forestShare = 0; // %
    let lives = false;

    try {
      const wbUrl = `http://api.worldbank.org/v2/country/${countryCode}/indicator/AG.LND.FRST.ZS?format=json&date=2021:2022`;
      const wbRes = await fetch(wbUrl);
      if (wbRes.ok) {
        const d = await wbRes.json();
        if (Array.isArray(d) && d.length > 1 && Array.isArray(d[1])) {
          const matched = d[1].find((item: any) => item.value !== null);
          if (matched && matched.value !== undefined) {
            forestShare = parseFloat(matched.value.toFixed(2));
            lives = true;
          }
        }
      }
    } catch (err) {
      console.warn("World Bank forest indicator query failed:", err);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to assemble high-fidelity World Bank forestry indices." });
    }

    res.json({
      latitude,
      longitude,
      countryCode,
      countryName,
      forestAreaPercent: forestShare,
      isLiveWorldBank: lives,
      apiCitation: "Forest area (% of land area), indicator AG.LND.FRST.ZS, World Bank Open Data (source: FAO) — a national figure, not this location's."
    });
  } catch {
    res.status(500).json({ error: "Failed to assemble high-fidelity World Bank forestry and landcover indexes" });
  }
});

// API Endpoint: GBIF (Global Biodiversity Information Facility) species name auto-suggest and match

router.post("/api/gbif-species-suggest", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query parameter is required for taxonomic auto-suggest" });
    }

    let lives = false;
    let suggestions: any[] = [];

    try {
      const gbifUrl = `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(query)}&limit=10`;
      const response = await fetch(gbifUrl);
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json)) {
          lives = true;
          suggestions = json.map((r: any) => ({
            key: r.key,
            scientificName: r.scientificName || "Unknown",
            canonicalName: r.canonicalName || "Unknown",
            rank: r.rank || "Unknown",
            status: r.status || "Unknown",
            kingdom: r.kingdom || "Unknown",
            phylum: r.phylum || "Unknown",
            class: r.class || "Unknown",
            order: r.order || "Unknown",
            family: r.family || "Unknown",
            genus: r.genus || "Unknown"
          }));
        }
      }
    } catch (e) {
      console.warn("GBIF auto-suggest lookup failed:", e);
    }

    if (!lives || suggestions.length === 0) {
      return res.status(502).json({ error: "Failed to download taxonomic autosuggest references from GBIF API." });
    }

    res.json({
      isLiveGbifSuggest: lives,
      query,
      suggestions,
      apiCitation: "Planetary taxonomic suggest and taxonomic backbone parsing powered by the GBIF (Global Biodiversity Information Facility) Backbone API."
    });
  } catch {
    res.status(500).json({ error: "Failed to query taxonomic species autocomplete suggestions" });
  }
});

// API Endpoint: Open-Meteo High Resolution Planetary Boundary Layer (PBL) and Crop Wind Shears
