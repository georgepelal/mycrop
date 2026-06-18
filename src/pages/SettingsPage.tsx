import React, { useState } from "react";
import { 
  Settings, 
  Map, 
  Cpu, 
  Layers, 
  Compass, 
  FolderLock, 
  Grid, 
  MonitorPlay,
  Check,
  ToggleLeft
} from "lucide-react";

export default function SettingsPage() {
  const [copernicusFeed, setCopernicusFeed] = useState(true);
  const [droneScans, setDroneScans] = useState(true);
  const [metricScale, setMetricScale] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  const [savedBadge, setSavedBadge] = useState(false);

  const handleSaveSettings = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2500);
  };

  return (
    <div className="space-y-6" id="settings-page-main">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-150 pb-5">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green font-mono">
            System Preferences
          </span>
          <h1 className="text-3xl font-display font-black tracking-tight text-gray-950">
            Control Settings
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl text-left leading-normal font-sans">
            Configure telemetry polling frequencies, satellite sync layers, unit coordinates, and satellite orbit defaults.
          </p>
        </div>

        {savedBadge && (
          <div className="flex items-center gap-1 text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-150 px-3.5 py-1.5 rounded-xl animate-fade-in uppercase font-bold">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* Settings options panel (8/12 layout) */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-6">
          
          <div className="space-y-4">
            
            {/* Sec A: Telemetry inputs */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Satellite API Linkages</span>
              <div className="space-y-3 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                
                {/* Copernicus Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-gray-900 block font-sans">Copernicus Sentinel-2 Live Feed</span>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Automatically sync multi-spectral spatial boundaries every 5 days when Sentinel satellites orbit your farmland coordinates.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCopernicusFeed(!copernicusFeed);
                      handleSaveSettings();
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                      copernicusFeed ? "bg-brand-green" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      copernicusFeed ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                <div className="h-px bg-slate-200" />

                {/* Drone Scans Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-gray-900 block font-sans">Automated Drone Flight scheduler</span>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Trigger local telemetry scans via linked DJI/ArduPilot nodes when localized moisture levels drop below 30% parameters.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setDroneScans(!droneScans);
                      handleSaveSettings();
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                      droneScans ? "bg-brand-green" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      droneScans ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

              </div>
            </div>

            {/* Sec B: Regional Units options */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Regional Scales & Contrast</span>
              <div className="space-y-3 bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                
                {/* Metric/Imperial toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-gray-900 block font-sans">Hectares / Metric measuring units</span>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Use Hectares (°C, t/Ha, cm) as standard, or switch to Imperial Acres (°F, Bu/Ac, in) for telemetry stats.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMetricScale(!metricScale);
                      handleSaveSettings();
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                      metricScale ? "bg-brand-green" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      metricScale ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                <div className="h-px bg-slate-200" />

                {/* High Contrast */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-gray-900 block font-sans">High contrast display overlay</span>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">
                      Improve readability under direct solar sunlight during field inspections by boosting UI lines contrast margins.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setHighContrast(!highContrast);
                      handleSaveSettings();
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-all focus:outline-none cursor-pointer ${
                      highContrast ? "bg-brand-green" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      highContrast ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Informative Side Card (4/12 layout) */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="p-3 bg-brand-green/10 text-brand-green rounded-2xl w-fit">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1 text-left">
            <h4 className="text-sm font-display font-black text-gray-950">System Link Active</h4>
            <p className="text-xs text-gray-500 leading-relaxed font-sans mt-0.5">
              Settings automatically commit to your local storage session and coordinate with your Firebase client DB instance.
            </p>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="text-[10px] text-gray-400 font-mono space-y-1">
            <p>ACTIVE FEED: Sentinel v2.4</p>
            <p>POLLED ONCE: Every 10 mins</p>
            <p>SECURE LINK: SSL-TLS-1.3</p>
          </div>
        </div>

      </div>

    </div>
  );
}
