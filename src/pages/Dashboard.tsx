import React from "react";
import { 
  Sprout, 
  Droplets, 
  Sun, 
  Map as MapIcon, 
  Activity,
  ArrowRight,
  Wind
} from "lucide-react";
import { useSettings } from "../contexts/useSettings";
import { Parcel, CROP_PRESETS } from "../types";

interface DashboardProps {
  parcels: Parcel[];
  activeParcelId: string;
  onNavigate: (page: string) => void;
}

export default function Dashboard({ 
  parcels, 
  activeParcelId, 
  onNavigate 
}: DashboardProps) {
  const { formatArea, formatYield } = useSettings();
  const activeParcel = parcels.find(p => p.id === activeParcelId) || parcels[0];

  if (!activeParcel) {
    return <div>No field selected.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Friendly Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-700 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-emerald-100 font-bold uppercase tracking-widest text-xs mb-2 block font-mono">
              Field Overview
            </span>
            <h1 className="text-4xl font-display font-black tracking-tight mb-2">
              {activeParcel.name}
            </h1>
            <p className="text-emerald-50 max-w-lg leading-relaxed text-sm">
              Your {activeParcel.cropType} field is looking {activeParcel.ndviValue > 0.6 ? "great" : "like it needs attention"}. 
              Everything you need to know is broken down below. Click any card to dive deep into the science.
            </p>
          </div>
          <div className="shrink-0 text-center bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-2xl">
            <div className="text-4xl mb-1">{CROP_PRESETS[activeParcel.cropType]?.icon || "🌾"}</div>
            <div className="font-bold text-xs uppercase tracking-wider">{activeParcel.cropType}</div>
            <div className="text-emerald-100 text-[10px]">{formatArea(activeParcel.area)}</div>
          </div>
        </div>
      </div>

      {/* Fun, Simple Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        
        {/* Weather Card */}
        <button 
          onClick={() => onNavigate("field-weather")}
          className="bg-white border border-gray-200 hover:border-sky-300 rounded-3xl p-6 text-left group transition-all shadow-sm hover:shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl -z-10 group-hover:bg-sky-100 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center">
              <Sun className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Sky & Weather</h3>
          <p className="text-sm text-gray-500 mb-6">
            See the rain forecast, temperature trends, and how the sky affects your crop's growth today.
          </p>
          <div className="flex gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-gray-700">Good Sun</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-bold text-gray-700">Light Breeze</span>
            </div>
          </div>
        </button>

        {/* Soil Card */}
        <button 
          onClick={() => onNavigate("field-soil")}
          className="bg-white border border-gray-200 hover:border-amber-300 rounded-3xl p-6 text-left group transition-all shadow-sm hover:shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -z-10 group-hover:bg-amber-100 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Soil & Roots</h3>
          <p className="text-sm text-gray-500 mb-6">
            Check the moisture levels under the ground and see if your plants are thirsty or well-fed.
          </p>
          <div className="flex gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-700">{activeParcel.soilMoisture}% Water</span>
            </div>
          </div>
        </button>

        {/* Growth & Yield Card */}
        <div 
          className="bg-white border border-gray-200 rounded-3xl p-6 text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -z-10"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Growth & Harvest</h3>
          <p className="text-sm text-gray-500 mb-6">
            Track how fast your {activeParcel.cropType} is growing and estimate how much you'll harvest.
          </p>
          <div className="flex gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-gray-700">{formatYield(activeParcel.predictedYield)} Estimated</span>
            </div>
          </div>
        </div>

        {/* 3D Map Card */}
        <button 
          onClick={() => onNavigate("field-3d")}
          className="bg-white border border-gray-200 hover:border-indigo-300 rounded-3xl p-6 text-left group transition-all shadow-sm hover:shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100 transition-colors"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <MapIcon className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">3D Farm Map</h3>
          <p className="text-sm text-gray-500 mb-6">
            Fly over your farm in 3D to spot problem areas and see the shape of your land.
          </p>
          <div className="flex gap-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-bold text-gray-700">View Terrain</span>
            </div>
          </div>
        </button>
        
      </div>
    </div>
  );
}
