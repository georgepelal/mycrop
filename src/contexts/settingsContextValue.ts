import { createContext } from "react";

export interface Settings {
  tempUnit: "C" | "F";
  rainUnit: "mm" | "inch";
  elevUnit: "m" | "ft";
  pressUnit: "hPa" | "psi" | "atm" | "mmHg";
  metricScale: boolean;
  highContrast: boolean;
  moistureAlerts: boolean;
  copernicusFeed: boolean;
  theme: "light" | "dark";
}

export interface SettingsContextType extends Settings {
  setTempUnit: (unit: "C" | "F") => void;
  setRainUnit: (unit: "mm" | "inch") => void;
  setElevUnit: (unit: "m" | "ft") => void;
  setPressUnit: (unit: "hPa" | "psi" | "atm" | "mmHg") => void;
  setMetricScale: (val: boolean) => void;
  setHighContrast: (val: boolean) => void;
  setMoistureAlerts: (val: boolean) => void;
  setCopernicusFeed: (val: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;

  // High-performance conversions & formats
  formatArea: (hectares: number) => string;
  formatYield: (tHa: number) => string;
  convertTemp: (celsius: number) => number;
  convertRain: (mm: number) => number;
  convertElev: (m: number) => number;
  convertPress: (hPa: number) => number;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
