import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, BookOpen, Sprout, Search, Droplets, ThermometerSun, CalendarClock } from "lucide-react";

interface CropDictionaryProps {
  onNavigate: (page: string) => void;
}

interface CropEntry {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  soilPHRange: string;
  waterRequirement: string;
  growthDuration: string;
}

interface CropCatalogData {
  source: string;
  crops: CropEntry[];
}

export default function CropDictionary({ onNavigate }: CropDictionaryProps) {
  const [data, setData] = useState<CropCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dynamic-crops");
        if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch crop catalog");
      }
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ["All", ...Array.from(new Set(data?.crops.map(c => c.category) || []))].sort();

  const filteredCrops = data?.crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          crop.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || crop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-600" />
              Agronomic Crop Dictionary
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Global taxonomic catalog of commercial agriculture varieties and physiological parameters.
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Synthesizing global taxonomic catalogs...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          Error: {error}
        </div>
      )}

      {data && !loading && (
        <>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 px-2 uppercase tracking-wide">
            <Sprout className="w-4 h-4 text-emerald-500" />
            Showing {filteredCrops.length} Species Profiles
            <span className="ml-auto text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
              Source: {data.source === "gemini_synthesis" ? "AI Generated Taxonomy" : "Standard Fallback Archive"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCrops.map((crop) => (
              <div key={crop.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-xl border border-slate-100 shadow-sm">
                        {crop.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{crop.name}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 border border-emerald-100/50">
                          {crop.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 leading-relaxed mb-5 min-h-[40px]">
                    {crop.description}
                  </p>
                </div>

                <div className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Droplets className="w-3.5 h-3.5 text-blue-500" />
                      Water Needs
                    </div>
                    <span className="font-medium text-slate-700 text-right max-w-[140px] truncate" title={crop.waterRequirement}>
                      {crop.waterRequirement}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <ThermometerSun className="w-3.5 h-3.5 text-amber-500" />
                      Soil pH Factor
                    </div>
                    <span className="font-medium text-slate-700">
                      {crop.soilPHRange}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <CalendarClock className="w-3.5 h-3.5 text-indigo-500" />
                      Growth Duration
                    </div>
                    <span className="font-medium text-slate-700">
                      {crop.growthDuration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredCrops.length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center border border-dashed border-slate-200 rounded-3xl bg-slate-50">
                <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700 text-lg">No cultivars found.</h4>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search query or category filter.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
