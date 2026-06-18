export interface Coordinate {
  lat: number;
  lng: number;
}

export interface UserSubscription {
  uid: string;
  planId: string;
  planName: string;
  status: string;
  billingPeriod: string;
  currentPeriodEnd: string;
  amount: number;
  updatedAt: string;
}

export interface Parcel {
  id: string;
  name: string;
  cropType: string;
  area: number; // area
  farmSize: number; // farmSize
  soilMoisture: number; // percentage
  predictedYield: number; // tonnes per hectare
  lat: number; // lat
  lng: number; // lng
  latitude: number; // latitude
  longitude: number; // longitude
  location: string;
  boundaries: Coordinate[]; // polygon vertices
  createdAt: string;
  lastUpdated: string;
  userId: string;
  ownerId: string;
  ndvi: number; // NDVI Index
  ndviValue: number; // Alternate NDVI
  ndwiValue: number;
  cropHeight: number; // in cm
  soilType: string;
  soilPH: number;
  nitrogen: string;
  plantingMonth: string;
  costPerHectare: number;
  marketPricePerTon: number;
  customImage: string | null;
  billingStatus: string;
  billingCycle: string;
  billingAmount: number;
  billingExpiration: string;
  
  // Real SoilGrids ISRIC Global API records
  soilGridsClay?: number;
  soilGridsSand?: number;
  soilGridsSilt?: number;
  soilGridsSoc?: number;
  soilGridsNitrogenValue?: number;
  isRealSoilGridsUsed?: boolean;
}

export interface WeatherDay {
  day: string;
  condition: "Sunny" | "Cloudy" | "Rainy" | "Drizzle" | "Stormy";
  temp: number;
  humidity: number;
  precipitation: number; // percentage chance
}

export interface UserProfile {
  displayName: string;
  photoURL: string;
  email: string;
  phone?: string;
  region?: string;
  title?: string;
}

export const CROP_PRESETS: Record<string, { icon: string }> = {
  "Corn": { icon: "🌽" },
  "Soybeans": { icon: "🌱" },
  "Winter Wheat": { icon: "🌾" },
  "Spring Wheat": { icon: "🌾" },
  "Barley": { icon: "🌾" },
  "Oats": { icon: "🌾" },
  "Alfalfa": { icon: "🌿" },
  "Canola": { icon: "🌻" },
  "Cotton": { icon: "☁️" },
  "Rice": { icon: "🍚" },
  "Potato": { icon: "🥔" },
  "Sugar Beets": { icon: "🍠" },
  "Sorghum": { icon: "🌾" },
  "Sunflower": { icon: "🌻" },
  "Peanut": { icon: "🥜" },
  "Sugarcane": { icon: "🎋" },
  "Rye": { icon: "🌾" },
  "Chickpeas": { icon: "🌱" },
  "Dry Beans": { icon: "🫘" },
  "Lentils": { icon: "🫛" },
  "Peas": { icon: "🫛" },
  "Tomatoes": { icon: "🍅" },
  "Onions": { icon: "🧅" },
  "Garlic": { icon: "🧄" },
  "Grapes": { icon: "🍇" },
  "Citrus": { icon: "🍊" },
  "Apples": { icon: "🍎" },
  "Olives": { icon: "🫒" },
  "Coffee": { icon: "☕" },
  "Cocoa": { icon: "🍫" },
  "Tea": { icon: "🍃" },
  "Hops": { icon: "🌿" },
  "Tobacco": { icon: "🍂" },
  "Cabbage": { icon: "🥬" },
  "Carrots": { icon: "🥕" },
  "Strawberries": { icon: "🍓" },
  "Blueberries": { icon: "🫐" },
  "Avocados": { icon: "🥑" },
  "Millet": { icon: "🌾" }
};

export function calculateFieldRate(farmSize: number) {
  const size = farmSize || 0;
  return {
    monthly: Math.max(10, Math.round(size * 150)),
    yearly: Math.max(100, Math.round(size * 120 * 12))
  };
}

export interface Crop {
  id: string;
  name: string;
  icon: string;
  description?: string;
  category?: string;
  soilPHRange?: string;
  waterRequirement?: string;
  growthDuration?: string;
  sourcedAt?: string;
}

