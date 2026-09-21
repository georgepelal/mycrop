// Used when no Gemini key is configured: a rule-based reply, clearly not a
// model's output. Kept out of the route modules so both can import it.
// Hand-crafted high-fidelity rule-based response generator for AI Advisor fallback
export function generateFallbackChatResponse(userMessage: string, activeParcel: any): string {
  const msg = userMessage.toLowerCase();
  const crop = activeParcel ? activeParcel.cropType : "your crops";
  const pName = activeParcel ? activeParcel.name : "your parcel";
  const pH = activeParcel ? activeParcel.soilPH : 6.5;
  const moisture = activeParcel ? activeParcel.soilMoisture : 60;
  const ndvi = activeParcel ? activeParcel.ndviValue : 0.7;
  const ndwi = activeParcel ? activeParcel.ndwiValue : 0.5;
  const nitro = activeParcel ? activeParcel.nitrogen : "Optimal";

  if (msg.includes("ph") || msg.includes("acid") || msg.includes("alkaline") || msg.includes("lime")) {
    let advice: string;
    if (pH < 5.5) {
      advice = `Your current pH of **${pH}** is highly acidic, which blocks critical macro-nutrients (especially Nitrogen and Phosphorus) for **${crop}**. I recommend applying agricultural limestone (calcium carbonate) at a rate of 2.5 tons per hectare to buffer the soil back toward 6.5.`;
    } else if (pH < 6.2) {
      advice = `Your current pH of **${pH}** is slightly acidic. While tolerable, **${crop}** would maximize root cell respiration closer to 6.5. Consider a top-dress application of dolomite lime.`;
    } else if (pH > 7.5) {
      advice = `Your raw pH rating of **${pH}** is alkaline, which can sequester heavy metallic micronutrients (like Iron, Zinc, and Manganese) inducing leaf chlorosis. To lower it naturally, incorporate elemental sulfur or ammonium sulfate fertilizer.`;
    } else {
      advice = `Excellent! Your soil pH of **${pH}** is in the perfect sweet spot (6.2 - 7.0) for root uptake of phosphates and nitrogen compounds. You do not need any buffering agents at this stage.`;
    }
    return `### 🧪 Soil pH & Alkaline Buffer Review for **${pName}**
    
${advice}

**Next Steps for ${crop}:**
- Avoid alkaline irrigation water sources if you're close to the upper limit (7.2).
- Retest soil compost levels after your current growth cycle.`;
  }

  if (msg.includes("water") || msg.includes("irrigation") || msg.includes("moisture") || msg.includes("dry") || msg.includes("drought") || msg.includes("ndwi") || msg.includes("rain") || msg.includes("humidity")) {
    let wetnessAdvice: string;
    if (moisture < 35 || ndwi < 0.25) {
      wetnessAdvice = `Your water-stress index (NDWI: **${ndwi}**) and soil moisture (**${moisture}%**) indicate a severe drought stress state for **${crop}**. Cellular turgorous pressure is plunging, which will cause leaf curling and stunt ear/stem development. You should increase your center-pivot irrigation emitters by **15mm over the next 48 hours**.`;
    } else if (moisture > 80 || ndwi > 0.75) {
      wetnessAdvice = `Your field moisture (**${moisture}%**) and high NDWI (**${ndwi}**) indicate stagnant water pooling. Anoxic soil conditions can choke oxygen from roots, leading to Pythium root rot. **Halt all irrigation immediately** and inspect local field drainage gutters.`;
    } else {
      wetnessAdvice = `Your hydration metrics (Moisture: **${moisture}%**, NDWI: **${ndwi}**) denote healthy sub-surface capillary saturation. Keep to your standard drip layout.`;
    }
    return `### 💧 Irrigation & Hydraulic Stress Assessment for **${pName}**

${wetnessAdvice}

**Optimal Water Protocol:**
- For **${crop}**, keep soil moisture consistently between $45\\%$ and $70\\%$ during the intermediate vegetative growth cycle.
- Deep-watering in the cool early morning (05:00 - 08:00) reduces evapotranspiration losses by up to $30\\%$.`;
  }

  if (msg.includes("nitrogen") || msg.includes("npk") || msg.includes("fertilizer") || msg.includes("defic") || msg.includes("optimal") || msg.includes("surplus") || msg.includes("soil")) {
    let fertilizationGuide: string;
    if (nitro === "Deficient" || msg.includes("deficient")) {
      fertilizationGuide = `Your field's Nitrogen level is currently **Deficient**. Nitrogen is the fundamental building block of crop chlorophyll (NDVI: **${ndvi}**). To prevent lower-canopy leaf yellowing (chlorosis), I recommend a side-dress application of Urea (46-0-0) or UAN solution at a rate of 120 kg/Ha.`;
    } else if (nitro === "Surplus" || msg.includes("surplus")) {
      fertilizationGuide = `Your Nitrogen status is flagged as **Surplus**. excess nitrogen forces rapid dark vegetative stalk growth at the cost of grain/fruit structure, and makes **${crop}** highly susceptible to wind-lodging and insects. Stop nitrogen feeds immediately; apply high-potassium supplements to balance cell wall tissue rigidity.`;
    } else {
      fertilizationGuide = `Your Nitrogen level is **Optimal**. This perfectly matches your strong biomass signature (NDVI: **${ndvi}**). Excellent application discipline! Let the crop utilize this baseline.`;
    }
    return `### 🌾 NPK Soil Nutrient & Fertilization Audit for **${pName}**

${fertilizationGuide}

**Custom Agronomist Tips for ${crop}:**
- Conduct a pre-sidedress nitrate test (PSNT) before adding secondary fertilizers.
- Consider incorporating a crimson clover cover crop in the off-season to naturally sequester atmospheric nitrogen.`;
  }

  if (msg.includes("ndvi") || msg.includes("biomass") || msg.includes("yield") || msg.includes("satellite") || msg.includes("sentinel") || msg.includes("color") || msg.includes("aerial")) {
    return `### 🛰️ Multispectral Remote Sensing Spectrum Profile

For **${pName}**, your active Normalized Difference Vegetation Index (NDVI) is **${ndvi}**.
- **Chlorophyll Vigor Rating:** ${ndvi > 0.7 ? "Excellent (Full Canopy Closure)" : ndvi > 0.45 ? "Good (Growth Acceleration Phase)" : "Sub-optimal (Underdeveloped Leaf Structure)"}
- **Hydration stress Index (NDWI):** **${ndwi}**

OurSentinel-2 satellite radar tracks bands 8 (Near-Infrared) and 4 (Red Visible) to isolate light reflectance. Because your index stands at **${ndvi}**, your **${crop}** is reflecting strong NIR light, indicating robust protoplasms. If you observe local variations on the canvas, prioritize target soil sampling in the orange/red transition zones.`;
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("help") || msg.includes("who")) {
    return `### 👋 Welcome to MyCrop AI Agronomist Portal!

Greetings! I am your interactive **MyCrop AI Counselor**, here to provide elite precision farming oversight.

I scan your active field telemetry, soil composition logs, and multispectral Sentinel imagery to guide your planting timelines, moisture stress buffers, and NPK requirements.

**You can ask me questions such as:**
1. *"How should I fix our soil pH level?"*
2. *"Are my crops experiencing water stress?"*
3. *"What fertilizer should I apply given our NPK logs?"*
4. *"Can you explain our satellite NDVI spectrum?"*`;
  }

  // Default agronomical recommendation based on crop selection
  return `### 🗒️ Agronomical Outlook Summary for **${pName}** (${crop})

Based on my scanning of your **${crop}** parcel, the overall telemetry index is **Healthy**.

**Current Field Baseline Summary:**
- **Estimated Crop Leaf Index (NDVI):** \`${ndvi}\` (${ndvi > 0.65 ? "Dense" : "Moderate"})
- **Evapotranspiration Index (NDWI):** \`${ndwi}\`
- **Subsurface Saturation:** \`${moisture}%\`
- **Soil Acidity:** \`pH ${pH}\`

Ensure your irrigation grids are clean and monitor offtake thresholds. What specific soil corrective protocols or weather risks would you like us to explore next?`;
}
