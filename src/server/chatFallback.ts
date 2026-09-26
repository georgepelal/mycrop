// Used when no Gemini key is configured: a rule-based reply, clearly not a
// model's output. Kept out of the route modules so both can import it.
// Rule-of-thumb replies used when no GEMINI_API_KEY is configured. They only
// quote numbers the parcel actually has; a missing value is said to be missing
// rather than replaced with a "typical" one (the old version assumed pH 6.5,
// 60% moisture and NDVI 0.7 and told the farmer those were their readings).
const OFFLINE_NOTE = "_The AI advisor isn't configured on this server, so this is a fixed rule-of-thumb reply, not an analysis of your field._";

function reading(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function generateFallbackChatResponse(userMessage: string, activeParcel: any): string {
  const msg = userMessage.toLowerCase();
  const crop = activeParcel?.cropType || "your crop";
  const pName = activeParcel?.name || "your parcel";
  const pH = reading(activeParcel?.soilPH);
  const moisture = reading(activeParcel?.soilMoisture);
  const ndvi = reading(activeParcel?.ndviValue);
  const ndwi = reading(activeParcel?.ndwiValue);
  const nitro: string | null = typeof activeParcel?.nitrogen === "string" ? activeParcel.nitrogen : null;
  const missing = (what: string) => `There's no ${what} recorded for **${pName}**, so I can't say anything specific. Add a soil test or reading to the parcel and ask again.`;

  if (msg.includes("ph") || msg.includes("acid") || msg.includes("alkaline") || msg.includes("lime")) {
    let advice: string;
    if (pH === null) advice = missing("soil pH");
    else if (pH < 5.5) advice = `A pH of **${pH}** is highly acidic for most field crops and limits phosphorus and other nutrient uptake. Agricultural limestone is the usual fix; the rate depends on your soil's buffer pH, so ask your lab for a lime requirement.`;
    else if (pH < 6.2) advice = `A pH of **${pH}** is slightly acidic. Most crops tolerate it; a maintenance lime application is common if you're aiming for 6.2–7.0.`;
    else if (pH > 7.5) advice = `A pH of **${pH}** is alkaline and can tie up iron, zinc and manganese (look for leaf chlorosis). Elemental sulfur or ammonium-based fertilisers lower pH slowly.`;
    else advice = `A pH of **${pH}** is in the 6.2–7.5 range most crops do well in; no correction is needed for pH alone.`;
    return `### Soil pH — ${pName}\n\n${advice}\n\n${OFFLINE_NOTE}`;
  }

  if (msg.includes("water") || msg.includes("irrigation") || msg.includes("moisture") || msg.includes("dry") || msg.includes("drought") || msg.includes("ndwi") || msg.includes("rain") || msg.includes("humidity")) {
    let advice: string;
    if (moisture === null && ndwi === null) advice = missing("soil moisture or NDWI reading");
    else if ((moisture !== null && moisture < 35) || (ndwi !== null && ndwi < 0.25)) advice = `The recorded readings (moisture ${moisture ?? "—"}%, NDWI ${ndwi ?? "—"}) point to drought stress for **${crop}**. Check the soil at root depth and the forecast before deciding how much to irrigate.`;
    else if ((moisture !== null && moisture > 80) || (ndwi !== null && ndwi > 0.75)) advice = `The recorded readings (moisture ${moisture ?? "—"}%, NDWI ${ndwi ?? "—"}) suggest waterlogging. Halt all irrigation until you've checked drainage — saturated soil starves roots of oxygen.`;
    else advice = `The recorded readings (moisture ${moisture ?? "—"}%, NDWI ${ndwi ?? "—"}) don't show water stress.`;
    return `### Water — ${pName}\n\n${advice}\n\n${OFFLINE_NOTE}`;
  }

  if (msg.includes("nitrogen") || msg.includes("npk") || msg.includes("fertilizer") || msg.includes("fertiliser") || msg.includes("soil")) {
    let advice: string;
    if (nitro === null) advice = missing("nitrogen status");
    else if (nitro === "Deficient") advice = `Nitrogen is recorded as **Deficient**. A side-dress is the usual response; base the rate on a soil nitrate test and your yield goal rather than a fixed number.`;
    else if (nitro === "Surplus") advice = `Nitrogen is recorded as **Surplus**. Hold further nitrogen — excess drives leafy growth, lodging and pest pressure, and is lost to leaching.`;
    else advice = `Nitrogen is recorded as **${nitro}**. No change is suggested from that alone.`;
    return `### Nitrogen — ${pName}\n\n${advice}\n\n${OFFLINE_NOTE}`;
  }

  if (msg.includes("ndvi") || msg.includes("biomass") || msg.includes("satellite") || msg.includes("sentinel")) {
    const advice = ndvi === null
      ? missing("NDVI value")
      : `The NDVI recorded for **${pName}** is **${ndvi}** (${ndvi > 0.7 ? "dense canopy" : ndvi > 0.45 ? "moderate canopy" : "sparse or early canopy"}). NDVI compares near-infrared and red reflectance; compare it with the same field earlier in the season rather than with a fixed threshold.`;
    return `### Vegetation index — ${pName}\n\n${advice}\n\n${OFFLINE_NOTE}`;
  }

  return `### MyCrop advisor\n\nI can give rule-of-thumb notes on **soil pH**, **water**, **nitrogen** and **NDVI** using the values saved on your parcel.\n\n${OFFLINE_NOTE}`;
}
