// Shared by the route modules: the Gemini client and the crop model
// parameters that several handlers compute from.
import { GoogleGenAI } from "@google/genai";

// Helper function to lazy-initialize GoogleGenAI
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("GEMINI_API_KEY is not defined. Using direct scientific calculation with synthetic agronomist summaries.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

interface CropConfig {
  baseYield: number; // tons per hectare
  standardPrice: number; // USD per ton
  standardExpense: number; // base input cost per hectare
  waterRequirement: string;
  growCycleDays: number;
}

const CROP_PARAMETERS: Record<string, CropConfig> = {
  Corn: { baseYield: 10.2, standardPrice: 180, standardExpense: 950, waterRequirement: "High", growCycleDays: 120 },
  Soybeans: { baseYield: 3.4, standardPrice: 380, standardExpense: 650, waterRequirement: "Moderate", growCycleDays: 130 },
  Wheat: { baseYield: 4.6, standardPrice: 220, standardExpense: 500, waterRequirement: "Low-Moderate", growCycleDays: 100 },
  "Winter Wheat": { baseYield: 4.8, standardPrice: 230, standardExpense: 520, waterRequirement: "Low-Moderate", growCycleDays: 240 },
  "Spring Wheat": { baseYield: 4.2, standardPrice: 240, standardExpense: 480, waterRequirement: "Moderate", growCycleDays: 110 },
  Rice: { baseYield: 6.8, standardPrice: 320, standardExpense: 1100, waterRequirement: "Very High", growCycleDays: 140 },
  Cotton: { baseYield: 1.4, standardPrice: 1600, standardExpense: 850, waterRequirement: "Moderate", growCycleDays: 150 },
  Barley: { baseYield: 4.1, standardPrice: 190, standardExpense: 480, waterRequirement: "Low-Moderate", growCycleDays: 95 },
  Canola: { baseYield: 2.3, standardPrice: 480, standardExpense: 550, waterRequirement: "Moderate", growCycleDays: 110 },
  Tomatoes: { baseYield: 65.0, standardPrice: 190, standardExpense: 4500, waterRequirement: "High", growCycleDays: 90 },
  Potato: { baseYield: 38.5, standardPrice: 150, standardExpense: 2200, waterRequirement: "High", growCycleDays: 120 },
  "Sugar Beets": { baseYield: 58.0, standardPrice: 65, standardExpense: 1400, waterRequirement: "High", growCycleDays: 160 },
  Chickpeas: { baseYield: 2.1, standardPrice: 750, standardExpense: 450, waterRequirement: "Low", growCycleDays: 110 },
};

export { getGeminiClient, CROP_PARAMETERS };
export type { CropConfig };
