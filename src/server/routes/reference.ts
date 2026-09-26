// reference endpoints, split out of the single server.ts.
import { Router } from "express";
import { getGeminiClient } from "../context";

export const router = Router();

router.post("/api/plant-dictionary-lookup", async (req, res) => {
  try {
    const { cropName = "Corn" } = req.body;
    
    // Fallback/Encyclopedic encyclopedia for common ag crops
    const botanicalData: Record<string, any> = {
      corn: {
        scientificName: "Zea mays",
        family: "Poaceae (Grasses)",
        optimalHumidity: "60-80%",
        companionCrops: "Beans, Squash (The Traditional Three Sisters), Melons",
        majorPests: "Corn Earworm, Fall Armyworm, Corn Rootworm",
        wateringNeeds: "Deep soaking weekly to root depth (1.5 - 2 inches/week)",
        pruningInterval: "Minimal (Removal of dead foliage or basal tillers if desired)",
        nativeDistribution: "Mesoamerica (Mexico/Central America)"
      },
      soybeans: {
        scientificName: "Glycine max",
        family: "Fabaceae (Legumes)",
        optimalHumidity: "55-70%",
        companionCrops: "Corn, Sunflowers, Potatoes, Cucumbers",
        majorPests: "Soybean Aphid, Kudzu Bug, Brown Marmorated Stink Bug",
        wateringNeeds: "Moderate (1.0 - 1.5 inches per week, critical at reflow)",
        pruningInterval: "None critical, standard mechanical canopy separation",
        nativeDistribution: "East Asia (China/Siberia)"
      },
      wheat: {
        scientificName: "Triticum aestivum",
        family: "Poaceae (Grasses)",
        optimalHumidity: "50-65%",
        companionCrops: "Chickpeas, Peas, Alfalfa, Field Clover",
        majorPests: "Hessian Fly, Cereal Leaf Beetle, Aphids",
        wateringNeeds: "Low to Moderate (1.0 inch/week or dryland irrigation templates)",
        pruningInterval: "Harvested entirely post-dormancy",
        nativeDistribution: "Fertile Crescent (Middle East)"
      },
      barley: {
        scientificName: "Hordeum vulgare",
        family: "Poaceae (Grasses)",
        optimalHumidity: "45-60%",
        companionCrops: "Vetch, Crimson Clover, Spring Peas",
        majorPests: "Armyworms, Wireworms, Aphids",
        wateringNeeds: "Very low water footprints (Adaptive deep roots system)",
        pruningInterval: "Requires uniform cutting only when yellow lines dry out",
        nativeDistribution: "Western Asia & Northeast Africa"
      },
      potato: {
        scientificName: "Solanum tuberosum",
        family: "Solanaceae (Nightshades)",
        optimalHumidity: "80-90% (In underground matrix)",
        companionCrops: "Bush Beans, Horseradish, Marigolds, Garlic",
        majorPests: "Colorado Potato Beetle, Flea Beetles, Aphids",
        wateringNeeds: "1 - 2 inches per week (Consistently damp soil layers)",
        pruningInterval: "Hilling/earthing up of soil to block light exposure to tubers",
        nativeDistribution: "Andean Highlands (Peru/Bolivia)"
      },
      tomato: {
        scientificName: "Solanum lycopersicum",
        family: "Solanaceae (Nightshades)",
        optimalHumidity: "65-75%",
        companionCrops: "Basil, Marigolds (Repels Nematodes), Carrots, Nasturtiums",
        majorPests: "Tomato Hornworm, Whiteflies, Spider Mites",
        wateringNeeds: "Heavy, consistent watering (2.0 inches/week at base)",
        pruningInterval: "Suckering (Pruning of leaf-axil auxiliary growth shoots)",
        nativeDistribution: "South America (Andean Regions)"
      }
    };

    const normKey = cropName.toLowerCase().replace(/[^a-z]/g, "");
    let match = botanicalData[normKey];
    if (!match) {
      // Heuristic generator for generic crops
      match = {
        scientificName: `${cropName.charAt(0).toUpperCase() + cropName.slice(1)} domestica`,
        family: "Angiospermae (Flowering Crops)",
        optimalHumidity: "60-70% Relative Humidity",
        companionCrops: "Alliums (Garlic/Onions), Marigolds, Legumes (Nitrogen helpers)",
        majorPests: "Cutworms, Aphids, Mites",
        wateringNeeds: "Standard balanced irrigation (1.2 inches per week)",
        pruningInterval: "Trim yellowed lower-tier canopy leaves to bolster aeration",
        nativeDistribution: "Global Agronomic Zones"
      };
    }

    let isLiveGbifMatch = false;
    let gbifTaxonomy = null;

    try {
      const gbifMatchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(cropName)}`;
      const gbifRes = await fetch(gbifMatchUrl);
      if (gbifRes.ok) {
        const gbifData = await gbifRes.json();
        if (gbifData && gbifData.usageKey) {
          isLiveGbifMatch = true;
          gbifTaxonomy = {
            canonicalName: gbifData.canonicalName || gbifData.scientificName || cropName,
            scientificName: gbifData.scientificName || match.scientificName,
            family: gbifData.family || match.family,
            genus: gbifData.genus || cropName,
            kingdom: gbifData.kingdom || "Plantae",
            phylum: gbifData.phylum || "Tracheophyta",
            class: gbifData.class || "Magnoliopsida",
            order: gbifData.order || "Unknown",
            status: gbifData.status || "ACCEPTED",
            confidence: gbifData.confidence || 100
          };
          // enrich original match with live GBIF data
          match.scientificName = gbifData.scientificName || match.scientificName;
          match.family = gbifData.family || match.family;
        }
      }
    } catch (e) {
      console.warn("GBIF Taxon Match failed:", e);
    }

    if (!isLiveGbifMatch) {
      return res.status(502).json({ error: "Failed to download complete botanical taxometric hierarchy from the GBIF backbone servers." });
    }

    res.json({
      cropName,
      profile: match,
      isLiveGbifMatch,
      gbifTaxonomy,
      apiCitation: "Botanical taxonomy resolved live using the Global Biodiversity Information Facility (GBIF) Backbone Taxonomy, combined with localized companion planting profiles."
    });
  } catch (error: any) {
    console.error("Perenual/GBIF plant database lookup failed:", error);
    res.status(500).json({ error: "Failed to load botanical plant specifications" });
  }
});

// API Endpoint: USDA Quick Stats and World Bank crop economic market price trackers

router.get("/api/dynamic-crops", async (req, res) => {
  const fallbackCrops = [
    { id: "corn", name: "Corn", icon: "🌽", category: "Cereals & Grains", description: "High-yielding cereal grain, sensitive to drought during pollination.", soilPHRange: "6.0 - 7.2", waterRequirement: "High (500-800mm)", growthDuration: "100 - 140 days" },
    { id: "soybeans", name: "Soybeans", icon: "🌱", category: "Pulses & Legumes", description: "Major nitrogen-fixing legume crop used for oil and protein feed.", soilPHRange: "6.2 - 7.0", waterRequirement: "Moderate (450-700mm)", growthDuration: "110 - 150 days" },
    { id: "wheat", name: "Winter Wheat", icon: "🌾", category: "Cereals & Grains", description: "Staple cereal grain sown in autumn, harvested in early summer.", soilPHRange: "6.0 - 7.5", waterRequirement: "Low - Moderate", growthDuration: "240 days" },
    { id: "barley", name: "Barley", icon: "🌾", category: "Cereals & Grains", description: "Robust grain, highly tolerant of alkaline and saline soils.", soilPHRange: "6.0 - 8.0", waterRequirement: "Low - Moderate (350-500mm)", growthDuration: "90 - 120 days" },
    { id: "potato", name: "Potato", icon: "🥔", category: "Tubers & Root Crops", description: "Highly efficient starch-producing cool season tuber.", soilPHRange: "5.0 - 6.0", waterRequirement: "Moderate (500-700mm)", growthDuration: "90 - 120 days" },
    { id: "tomato", name: "Tomatoes", icon: "🍅", category: "Vegetables", description: "Sun-loving solanaceous plant requiring consistent soil moisture.", soilPHRange: "6.0 - 6.8", waterRequirement: "High (600-800mm)", growthDuration: "75 - 90 days" },
    { id: "onion", name: "Onions", icon: "🧅", category: "Vegetables", description: "Photoperiod-sensitive bulb vegetable with shallow roots.", soilPHRange: "6.0 - 6.7", waterRequirement: "Moderate (350-550mm)", growthDuration: "100 - 140 days" },
    { id: "garlic", name: "Garlic", icon: "🧄", category: "Vegetables", description: "Sown in cold weather, requires long days to swell bulbs.", soilPHRange: "6.0 - 7.0", waterRequirement: "Low - Moderate", growthDuration: "240 days" },
    { id: "grape", name: "Grapes", icon: "🍇", category: "Fruits & Berries", description: "Perennial woody vine suited to warm sunny slopes.", soilPHRange: "5.5 - 6.5", waterRequirement: "Low (250-400mm)", growthDuration: "Perennial Fruit Cycle" },
    { id: "apple", name: "Apples", icon: "🍎", category: "Fruits & Berries", description: "Deciduous orchard tree requiring chilling hours for fruit set.", soilPHRange: "6.0 - 6.8", waterRequirement: "Moderate (600-800mm)", growthDuration: "Perennial Orchard" },
    { id: "coffee", name: "Coffee", icon: "☕", category: "Cash Crops & Others", description: "Tropical highland evergreen shrub, highly sensitive to frost.", soilPHRange: "5.2 - 6.0", waterRequirement: "High (1200-1800mm)", growthDuration: "Perennial Shrub" },
    { id: "rice", name: "Rice (Paddy)", icon: "🍚", category: "Cereals & Grains", description: "Staple global food grown in flooded paddies or high rain basins.", soilPHRange: "5.5 - 6.7", waterRequirement: "Extremely High (1200-1600mm)", growthDuration: "105 - 150 days" },
    { id: "alfalfa", name: "Alfalfa", icon: "🌿", category: "Pulses & Legumes", description: "Deep-rooted perennial forage legume supplying exceptional nitrogen and feed.", soilPHRange: "6.5 - 7.5", waterRequirement: "High (800-1200mm)", growthDuration: "Perennial / Multi-cut" },
    { id: "canola", name: "Canola", icon: "🌻", category: "Cash Crops & Others", description: "Bright yellow flowering brassica grown for premium heart-healthy oil.", soilPHRange: "6.0 - 7.0", waterRequirement: "Moderate (400-600mm)", growthDuration: "95 - 110 days" },
    { id: "cotton", name: "Cotton", icon: "☁️", category: "Cash Crops & Others", description: "Vigorous field fiber shrub thriving in high warmth and full sun.", soilPHRange: "5.8 - 8.0", waterRequirement: "High (600-1000mm)", growthDuration: "140 - 180 days" },
    { id: "chickpeas", name: "Chickpeas", icon: "🌱", category: "Pulses & Legumes", description: "Extremely drought-tough seed legume suited for dryland crop rotations.", soilPHRange: "6.0 - 8.0", waterRequirement: "Low (200-350mm)", growthDuration: "100 - 120 days" },
    { id: "sugarcane", name: "Sugarcane", icon: "🎋", category: "Cash Crops & Others", description: "Giant tropical perennial grass with thick carbon-assimilating stalks.", soilPHRange: "5.5 - 7.5", waterRequirement: "Extremely High (1500-2500mm)", growthDuration: "270 - 365 days" },
    { id: "strawberries", name: "Strawberries", icon: "🍓", category: "Fruits & Berries", description: "Low-lying perennial berry, high labor crop demanding rapid sun.", soilPHRange: "5.5 - 6.2", waterRequirement: "Moderate - High", growthDuration: "60 - 90 days after planting" },
    { id: "carrots", name: "Carrots", icon: "🥕", category: "Tubers & Root Crops", description: "Biennial root crop requiring friable, stone-free deep organic soil.", soilPHRange: "6.0 - 6.8", waterRequirement: "Moderate (400-550mm)", growthDuration: "70 - 100 days" },
    { id: "tea", name: "Tea Camellia", icon: "🍃", category: "Cash Crops & Others", description: "Highland acidic soil shrub, leaves hand-harvested periodically.", soilPHRange: "4.5 - 5.6", waterRequirement: "Very High (1500-2000mm)", growthDuration: "Perennial Bush" },
    { id: "olives", name: "Olives", icon: "🫒", category: "Fruits & Berries", description: "Sparsely growing, ultra-durable evergreen tree of the Mediterranean basin.", soilPHRange: "6.5 - 8.5", waterRequirement: "Very Low (200-350mm)", growthDuration: "Perennial Olive Grove" },
    { id: "millet", name: "Millet", icon: "🌾", category: "Cereals & Grains", description: "Hardy dryland small grain, requires minimal nutrients to grow.", soilPHRange: "5.5 - 7.0", waterRequirement: "Very Low (150-300mm)", growthDuration: "60 - 80 days" },
    { id: "cabbage", name: "Cabbage", icon: "🥬", category: "Vegetables", description: "Cool-season brassica with packed nutrient-dense waxy foliage.", soilPHRange: "6.2 - 7.2", waterRequirement: "Moderate", growthDuration: "80 - 120 days" },
    { id: "avocado", name: "Avocados", icon: "🥑", category: "Fruits & Berries", description: "Perennial subtropical tree, requires zero-frost climates and high drainage.", soilPHRange: "5.0 - 6.5", waterRequirement: "High", growthDuration: "Perennial Orchard" },
    { id: "chili", name: "Chili Peppers", icon: "🌶️", category: "Vegetables", description: "Warm-season solanaceous spicy pod crop with rich capsaicin content.", soilPHRange: "6.0 - 6.8", waterRequirement: "Moderate", growthDuration: "90 - 120 days" }
  ];

  const gemini = getGeminiClient();
  if (!gemini) {
    console.log("No Gemini API key available. Returning standard 25-crop catalog.");
    return res.json({ source: "hardcoded_fallback", crops: fallbackCrops });
  }

  try {
    const prompt = `You are an expert global agricultural taxonomist. Create a complete, diverse JSON list of 45 real-world commercial crop types grown worldwide for crop telemetry tracking.
Define EACH crop as a JSON object with these EXACT keys (maintain strict case and type compliance):
- "id": a unique, lowercase string (e.g. "soybeans", "canola", "cassava", "chili")
- "name": beautiful, title-case name (e.g. "Soybeans", "Canola", "Cassava", "Chili Peppers")
- "icon": a single emoji (e.g. "🌱", "🌻", "🥔", "🌶️")
- "category": choice of: "Cereals & Grains", "Vegetables", "Fruits & Berries", "Pulses & Legumes", "Tubers & Root Crops", "Cash Crops & Others"
- "description": exactly one highly scientific, practical agronomic advice sentence (approx 15-20 words) detailing soil/weather limits
- "soilPHRange": ideal soil pH range (e.g. "6.0 - 7.5")
- "waterRequirement": ideal water needs (e.g. "Low (200-300mm)", "Moderate", "High")
- "growthDuration": typical crop cycle span (e.g. "90-110 days")

Make sure the output is strictly a flat JSON array of these 45 objects. Do NOT use markdown formatting (such as \`\`\`json or \`\`\`), do NOT output preambles or chat conversational sentences. Start writing the array immediately [ ... ]. Include diverse crops such as Grains, Brassicas, Roots, Citrus, Berries, Legumes, Cover Crops, Beverage Crops (Coffee, Cocoa, Tea), and Orchard varieties.`;

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    if (response && response.text) {
      let rawText = response.text.trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
      }
      try {
        const parsedCrops = JSON.parse(rawText);
        if (Array.isArray(parsedCrops) && parsedCrops.length > 5) {
          console.log(`Successfully generated ${parsedCrops.length} custom crop products from Gemini. Let's merge them!`);
          return res.json({ source: "gemini_synthesis", crops: parsedCrops });
        }
      } catch (err) {
        console.warn("Gemini crop list parsing failed; returning the built-in list.", err);
      }
    }
  } catch (err) {
    console.error("Gemini crop synthesis fetch error:", err);
  }

  return res.json({ source: "hardcoded_fallback", crops: fallbackCrops });
});

// API Endpoint: NOAA Space Weather & Ionosphere Scales (Real-time S, R, G indices for GPS signal integrity)

router.post("/api/crop-literature-handbooks", async (req, res) => {
  try {
    const { cropName = "Corn" } = req.body;
    let lives = false;
    let books: any[] = [];

    try {
      const query = `${encodeURIComponent(cropName + " agriculture cultivation")}`;
      const response = await fetch(`https://openlibrary.org/search.json?q=${query}&limit=6`);
      if (response.ok) {
        const json = await response.json();
        if (json && Array.isArray(json.docs) && json.docs.length > 0) {
          lives = true;
          books = json.docs.slice(0, 5).map((doc: any) => ({
            title: doc.title,
            author: doc.author_name ? doc.author_name[0] : "Agronomy Scholar Club",
            publishYear: doc.first_publish_year || doc.publish_year?.[0] || "N/A",
            publisher: doc.publisher ? doc.publisher[0] : "Academic Press",
            isbn: doc.isbn ? doc.isbn[0] : null,
            coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
            openLibraryUrl: `https://openlibrary.org${doc.key || ""}`
          }));
        }
      }
    } catch (e) {
      console.warn("Open Library lookup failed:", e);
    }

    if (!lives || books.length === 0) {
      return res.status(502).json({ error: "Failed to compile agronomic books portfolio from Open Library." });
    }

    res.json({
      isLiveLiterature: lives,
      cropName,
      books,
      apiCitation: "Open-access books directory and cultural scientific handbooks queried from the Open Library Search APIs."
    });
  } catch {
    res.status(500).json({ error: "Failed to compile agronomic books portfolio" });
  }
});

// API Endpoint: NASA Earth Observatory Natural Event Tracker (EONET) Climatic Hazards Feed
