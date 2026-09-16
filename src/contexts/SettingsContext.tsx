import React, { useState, useEffect } from "react";
import { Settings, SettingsContext } from "./settingsContextValue";

export type { Settings };

const LOCAL_STORAGE_KEY = "mycrop_global_settings";

const DEFAULT_SETTINGS: Settings = {
  tempUnit: "C",
  rainUnit: "mm",
  elevUnit: "m",
  pressUnit: "hPa",
  metricScale: true,
  highContrast: false,
  moistureAlerts: true,
  copernicusFeed: true,
  theme: "light",
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed, theme: parsed.theme || "light" };
      }
    } catch (e) {
      console.error("Error loading settings from localStorage:", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Error saving settings to localStorage:", e);
    }
  }, [settings]);

  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("dark");
    }
  }, [settings.theme]);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      
      // Auto-update subordinate units if master metricScale changes
      if (key === "metricScale") {
        const isMetric = value as boolean;
        next.tempUnit = isMetric ? "C" : "F";
        next.rainUnit = isMetric ? "mm" : "inch";
        next.elevUnit = isMetric ? "m" : "ft";
        next.pressUnit = isMetric ? "hPa" : "psi";
      }
      
      return next;
    });
  };

  const setTempUnit = (unit: "C" | "F") => updateSetting("tempUnit", unit);
  const setRainUnit = (unit: "mm" | "inch") => updateSetting("rainUnit", unit);
  const setElevUnit = (unit: "m" | "ft") => updateSetting("elevUnit", unit);
  const setPressUnit = (unit: "hPa" | "psi" | "atm" | "mmHg") => updateSetting("pressUnit", unit);
  const setMetricScale = (val: boolean) => updateSetting("metricScale", val);
  const setHighContrast = (val: boolean) => updateSetting("highContrast", val);
  const setMoistureAlerts = (val: boolean) => updateSetting("moistureAlerts", val);
  const setCopernicusFeed = (val: boolean) => updateSetting("copernicusFeed", val);
  const setTheme = (theme: "light" | "dark") => updateSetting("theme", theme);

  // Conversion core logics
  const convertTemp = (celsius: number) => {
    if (settings.tempUnit === "F") {
      return parseFloat((celsius * 1.8 + 32).toFixed(1));
    }
    return celsius;
  };

  const convertRain = (mm: number) => {
    if (settings.rainUnit === "inch") {
      return parseFloat((mm * 0.0393701).toFixed(2));
    }
    return mm;
  };

  const convertElev = (m: number) => {
    if (settings.elevUnit === "ft") {
      return parseFloat((m * 3.28084).toFixed(1));
    }
    return m;
  };

  const convertPress = (hPa: number) => {
    if (settings.pressUnit === "psi") return parseFloat((hPa * 0.0145038).toFixed(3));
    if (settings.pressUnit === "atm") return parseFloat((hPa * 0.000986923).toFixed(4));
    if (settings.pressUnit === "mmHg") return parseFloat((hPa * 0.750062).toFixed(1));
    return hPa;
  };

  const formatArea = (hectares: number) => {
    if (!settings.metricScale) {
      const acres = hectares * 2.47105;
      return `${acres.toLocaleString(undefined, { maximumFractionDigits: 1 })} Acres`;
    }
    return `${hectares.toLocaleString(undefined, { maximumFractionDigits: 1 })} Hectares`;
  };

  const formatYield = (tHa: number) => {
    if (!settings.metricScale) {
      const buAc = tHa * 14.87;
      return `${buAc.toLocaleString(undefined, { maximumFractionDigits: 1 })} Bu/Ac`;
    }
    return `${tHa.toLocaleString(undefined, { maximumFractionDigits: 1 })} t/ha`;
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setTempUnit,
        setRainUnit,
        setElevUnit,
        setPressUnit,
        setMetricScale,
        setHighContrast,
        setMoistureAlerts,
        setCopernicusFeed,
        setTheme,
        formatArea,
        formatYield,
        convertTemp,
        convertRain,
        convertElev,
        convertPress,
      }}
    >
      <div className={settings.highContrast ? "high-contrast-mode" : ""}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
};
