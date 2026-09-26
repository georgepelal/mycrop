// soil endpoints, split out of the single server.ts.
import { Router } from "express";
import { num, leadingComplete, realSeries } from "../series";

export const router = Router();

router.post("/api/soil-salinity-capillary", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute soil salinity hazards" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let referenceEt0: number[] = []; // mm/day
    let days = 0;
    let isLiveSalinity = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=et0_fao_evapotranspiration&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.et0_fao_evapotranspiration) {
          days = Math.min(7, leadingComplete(data.daily.et0_fao_evapotranspiration));
          referenceEt0 = realSeries(data.daily.et0_fao_evapotranspiration, days);
          isLiveSalinity = days > 0;
        }
      }
    } catch (e) {
      console.warn("Salinity ET0 coordinate link missing:", e);
    }

    if (!isLiveSalinity) {
      return res.status(502).json({ error: "Failed to assemble ET0 parameters." });
    }

    const dates: string[] = [];
    const capillaryRiseMm: number[] = [];
    const electricalConductivityDsm: number[] = []; // Estimated root salinity ECe

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      // Capillary rise is fueled by heavy evaporation dragging ground water up.
      // Silt-loam soil transfers water up to 1.5 - 2.5 mm per day under high tension.
      const et0 = referenceEt0[i];
      const rise = parseFloat(Math.min(3.0, et0 * 0.42).toFixed(2));
      capillaryRiseMm.push(rise);

      // Higher capillary rise under dry weather accumulates salts, boosting ECe
      // Base regional ground salinity is modeled roughly as 1.2 dS/m
      const ece = parseFloat((1.2 + (rise * 0.75) + (et0 > 5 ? 0.3 : 0)).toFixed(1));
      electricalConductivityDsm.push(ece);
    }

    const maxEce = Math.max(...electricalConductivityDsm);
    let saltRiskRating = "Negligible salinity risk. Root zones are in healthy non-saline conditions.";
    let saltAdvisory = "Soluble salt accumulation is well controlled. Periodic rainwater flushing keeps root structures safe.";

    if (maxEce > 3.0) {
      saltRiskRating = "High Capillary Salt Risk (Root stress)";
      saltAdvisory = "⚠️ SALINITY ALERT: High evaporation is actively drawing ground saline water into topsoil. Crops may suffer osmotic leaf tip necrosis. Irrigate heavily with low-saline water for flush-leaching.";
    } else if (maxEce > 2.0) {
      saltRiskRating = "Moderate Salinity Accumulation";
      saltAdvisory = "OSMOTIC SHIFT: Soil salts are accumulating. Highly sensitive crops (strawberries, beans) will show minor yield drag. Employ drip irrigation to sustain active damp dilution.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      referenceEt0,
      capillaryRiseMm,
      electricalConductivityDsm,
      maxEce,
      saltRiskRating,
      isLiveSalinity,
      advisory: saltAdvisory,
      // This tool has no salinity measurement. The only real input is ET0;
      // the "ECe" is an illustrative index built on an ASSUMED 1.2 dS/m
      // baseline and an assumed shallow water table, and says so.
      physicsStandard: "Illustrative only — not a salinity measurement. The one real input is forecast evaporative demand (ET0, Open-Meteo). Capillary rise and the salinity index assume a shallow saline water table and a 1.2 dS/m baseline that were not measured at this location. Test your soil (ECe) to know its actual salinity."
    });
  } catch (error: any) {
    console.error("Salinity calculation failed:", error);
    res.status(500).json({ error: "Failed to model soil salinity and capillary upward flow dynamics" });
  }
});

// API Endpoint: Get Canopy Stomatal Resistance & Crop Transpiration Rates

router.post("/api/agronomic-nutrient-leaching", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to compute nutrient leaching indices" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let precipitationSum: number[] = []; // mm
    let days = 0;
    let isLiveLeaching = false;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=precipitation_sum&timezone=auto`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.daily && data.daily.precipitation_sum) {
          // A day with no value is unknown, not "0 mm" (which reads as "no leaching risk").
          days = Math.min(7, leadingComplete(data.daily.precipitation_sum));
          precipitationSum = realSeries(data.daily.precipitation_sum, days);
          isLiveLeaching = days > 0;
        }
      }
    } catch (e) {
      console.warn("NPK open-meteo connection failed:", e);
    }

    if (!isLiveLeaching) {
      return res.status(502).json({ error: "Failed to download precipitation metrics for nutrient leaching calculation." });
    }

    const dates: string[] = [];
    const nitrateLeachingRisk: number[] = []; // % (nitrogen is highly soluble, moves with water flux)
    const phosphorusRunoffRisk: number[] = []; // % (phosphorus binds to soil colloids, carried by physical soil runoff)
    const potassiumDrainLoss: number[] = []; // % (potassium is moderately mobile in clay structures)

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);

      const rain = precipitationSum[i];

      // Nitrate leaching models (extremely linear to rain water infiltration volume)
      let nRisk = 5;
      if (rain > 15) {
        nRisk = Math.min(100, Math.round(35 + (rain - 15) * 2.8));
      } else if (rain > 2) {
        nRisk = Math.round(5 + rain * 2.0);
      }
      nitrateLeachingRisk.push(nRisk);

      // Phosphorus surface runoff (requires high intensity rain to dislodge surface colloids)
      let pRisk = 2;
      if (rain > 10) {
        pRisk = Math.min(100, Math.round(15 + (rain - 10) * 3.5));
      } else if (rain > 1) {
        pRisk = Math.round(rain * 1.5);
      }
      phosphorusRunoffRisk.push(pRisk);

      // Potassium leaching (slower, binds to clay-cation exchange sites)
      let kRisk = 4;
      if (rain > 15) {
        kRisk = Math.min(100, Math.round(12 + (rain - 15) * 1.6));
      } else if (rain > 2) {
        kRisk = Math.round(4 + rain * 0.82);
      }
      potassiumDrainLoss.push(kRisk);
    }

    const maxRain = Math.max(...precipitationSum);
    let advice = "Optimal nutrient stability. Low soil moisture movement indicates applied fertilizers are locked in root horizons.";
    if (maxRain > 15) {
      advice = "🔴 CRITICAL LEACHING DANGER: Soil pore water flux is extreme. Soluble Nitrates (NO3-) will drain deep into ground water systems beyond the root zone. Avoid spreading urea or slurry preceding these precipitation triggers.";
    } else if (maxRain > 6) {
      advice = "🟡 MODERATE RUNOFF ALERT: Surface rain volumes are sufficient to dislodge particulate soil. Phosphorus bonds on topsoil silt can slide into municipal drainage channels. Monitor tillage compaction.";
    }

    res.json({
      latitude,
      longitude,
      dates,
      precipitationSum,
      nitrateLeachingRisk,
      phosphorusRunoffRisk,
      potassiumDrainLoss,
      isLiveLeaching,
      advisory: advice,
      physicsStandard: "Rule-of-thumb risk scores from forecast daily rainfall only: nitrate risk rises above ~2 mm and steeply above 15 mm, phosphorus runoff above ~10 mm. Soil type, slope and cover aren't considered, so this is a reminder to time fertiliser before dry spells — not a leaching model."
    });
  } catch (error: any) {
    console.error("NPK calculations failed:", error);
    res.status(500).json({ error: "Failed to model soil nutrient leaching dynamics" });
  }
});

// API Endpoint: Get Crop Water Use Efficiency (WUE) & Transpiration Index

router.post("/api/openepi-soil", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Coordinates are required to pull soil mechanical properties" });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Every property must come from SoilGrids (via OpenEPI). An earlier
    // version started from a "typical Luvisol" (24.5% clay, pH 6.4, ...) and
    // kept those numbers whenever a layer — or the whole properties call —
    // was missing, while still reporting the result as live.
    let soilClass: string | null = null;
    let props: Record<string, number | null> | null = null;

    try {
      const propUrl = `https://api.openepi.io/soil/property?lat=${latitude}&lon=${longitude}&depths=0-5cm&properties=ph_h2o,clay,sand,silt,nitrogen,soc`;
      const propRes = await fetch(propUrl);
      if (propRes.ok) {
        const propJson = await propRes.json();
        const layers = propJson?.properties?.layers;
        if (Array.isArray(layers)) {
          const mean = (name: string): number | null => {
            const match = layers.find((l: any) => l.name === name);
            const v = match?.depths?.[0]?.values?.mean;
            return typeof v === "number" ? v : null;
          };
          props = {
            ph_h2o: mean("ph_h2o"), clay: mean("clay"), sand: mean("sand"),
            silt: mean("silt"), soc: mean("soc"), nitrogen: mean("nitrogen"),
          };
        }
      }
    } catch (e) {
      console.warn("OpenEPI Soil Property endpoint request failed:", e);
    }

    try {
      const typeUrl = `https://api.openepi.io/soil/type?lat=${latitude}&lon=${longitude}`;
      const typeRes = await fetch(typeUrl);
      if (typeRes.ok) {
        const typeJson = await typeRes.json();
        if (typeof typeJson?.properties?.most_common === "string") {
          soilClass = typeJson.properties.most_common;
        }
      }
    } catch (e) {
      console.warn("OpenEPI Soil Taxonomy endpoint request failed:", e);
    }

    if (!props || Object.values(props).some((v) => v === null) || soilClass === null) {
      return res.status(502).json({
        error: "SoilGrids (via OpenEPI) didn't return complete soil data for this point — often water, urban or out-of-coverage areas.",
        source: "OpenEPI / ISRIC SoilGrids",
        kind: "unavailable",
      });
    }
    const isLiveOpenEpi = true;

    // SoilGrids units: pH x10, texture g/kg, SOC dg/kg, nitrogen cg/kg.
    const phWater = parseFloat(((props.ph_h2o as number) / 10).toFixed(1));
    const clayContent = parseFloat(((props.clay as number) / 10).toFixed(1));
    const sandContent = parseFloat(((props.sand as number) / 10).toFixed(1));
    const siltContent = parseFloat(((props.silt as number) / 10).toFixed(1));
    const organicCarbon = parseFloat(((props.soc as number) / 10).toFixed(1));
    const nitrogen = parseFloat(((props.nitrogen as number) / 100).toFixed(2));

    // Compute additional soil metrics
    const sandSiltRatio = Number((sandContent / Math.max(1, siltContent)).toFixed(2));
    const textureClass = clayContent > 40 ? "Clay" : clayContent > 20 && sandContent > 45 ? "Sandy Clay Loam" : sandContent > 70 ? "Sandy Loam" : "Loam";

    res.json({
      latitude,
      longitude,
      isLiveOpenEpi,
      soilProperties: {
        soilClass,
        phWater,
        clayContent,
        sandContent,
        siltContent,
        organicCarbon,
        nitrogen,
        textureClass,
        sandSiltRatio
      },
      apiCitation: "Soil properties & World Reference Base taxonomy retrieved in real-time from ISRIC - World Soil Information via OpenEPI Open Geodata services."
    });
  } catch (error: any) {
    console.error("OpenEPI Soil Analytics API failure:", error);
    res.status(500).json({ error: "Failed to assemble high-precision OpenEPI soil diagnostics" });
  }
});

// API Endpoint: OpenEPI Real-time Forest Fire and Wildfire severity indicators

router.post("/api/openmeteo-agri-soil", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "Location coordinates required to resolve agricultural ground truths" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let lives = false;
    let moisture0to7: number | null = null;
    let moisture7to28: number | null = null;
    let temp0to7: number | null = null;
    let evapotranspirationEt0: number | null = null;

    try {
      const agriUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_temperature_0_to_7cm,et0_grass_reference&timezone=auto`;
      const response = await fetch(agriUrl);
      if (response.ok) {
        const json = await response.json();
        if (json && json.current) {
          const c = json.current;
          moisture0to7 = num(c.soil_moisture_0_to_7cm, 3);
          moisture7to28 = num(c.soil_moisture_7_to_28cm, 3);
          temp0to7 = num(c.soil_temperature_0_to_7cm);
          evapotranspirationEt0 = num(c.et0_grass_reference, 2);
          lives = moisture0to7 !== null || temp0to7 !== null;
        }
      }
    } catch (e) {
      console.warn("Agri-Soil Moisture API request network fault:", e);
    }

    if (!lives) {
      return res.status(502).json({ error: "Failed to download high-resolution subsurface agricultural levels from Open-Meteo." });
    }

    res.json({
      latitude,
      longitude,
      isLiveAgriSoil: lives,
      microclimate: {
        soilMoisture0to7cm: moisture0to7,
        soilMoisture7to28cm: moisture7to28,
        soilTemperature0to7cm: temp0to7,
        evapotranspirationEt0
      },
      apiCitation: "Agrometeorological surface attributes extracted from Open-Meteo High-Resolution Agricultural Model and ERA5 Land reanalysis."
    });
  } catch (error: any) {
    console.error("Agronomic agri-soil lookup failed:", error);
    res.status(500).json({ error: "Failed to load high-resolution subsurface agricultural levels" });
  }
});

// API Endpoint: Open-Meteo ERA5 15-Year Historical Climate Deviation
