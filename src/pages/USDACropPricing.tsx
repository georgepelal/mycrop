import React, { useState } from "react";
import { ArrowLeft, Loader2, DollarSign, TrendingUp, Info, Activity, Factory } from "lucide-react";

interface USDAPricingProps {
  onNavigate: (page: string) => void;
}

interface PricingData {
  cropName: string;
  marketStats: {
    pricePerBushelUsd: number;
    activeExchange: string;
    tradingVolume: string;
    yieldPerAcreUsBushel: number;
    priceTrend: string;
  };
  apiCitation: string;
}

export default function USDACropPricing({ onNavigate }: USDAPricingProps) {
  const [data, setData] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropInput, setCropInput] = useState("Corn");
  const [showRawJSON, setShowRawJSON] = useState(false);

  const fetchData = async (cropName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/usda-crop-pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropName })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch commodity price and USDA yield indices");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (cropInput.trim()) {
      fetchData(cropInput);
    }
  };

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Raw API JSON payload copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between lg:pr-8">
        <div className="flex items-center gap-4 border-b border-transparent pb-2">
          <button 
            onClick={() => onNavigate("field-overview")}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-emerald-600" />
              USDA Crop Pricing
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Global commodity market contracts and yield index.
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="w-full md:w-96 flex relative">
           <input 
             type="text"
             value={cropInput}
             onChange={e => setCropInput(e.target.value)}
             className="w-full pl-4 pr-24 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-gray-700"
             placeholder="Search crop (e.g. Corn, Soybeans)..."
           />
           <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 bg-emerald-500 text-white px-4 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-sm active:scale-95 disabled:opacity-50">
             Query
             </button>
        </form>
      </div>

      {!data && !loading && !error && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-slate-50 shadow-sm text-center px-4">
          <TrendingUp className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            Search Commodity Metrics
          </h3>
          <p className="text-sm text-slate-500 max-w-md">
            Query the USDA NASS databases and World Bank Pink Sheet Reports for real-time agricultural pricing trends.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Scanning USDA / NASS Exchange Datasets...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm">
          Error: {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">

          <div className="bg-emerald-900 border border-emerald-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

             <div className="flex items-center gap-3 text-emerald-300 mb-6 relative z-10">
               <Factory className="w-5 h-5" />
               <h3 className="font-bold uppercase tracking-widest text-sm">{data.cropName} Market Profile</h3>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
               
               <div className="flex items-start gap-4 p-5 bg-white/5 border border-white/10 rounded-xl relative shadow-inner">
                  <div className="bg-emerald-500 text-emerald-950 p-3 rounded-lg shadow-sm">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-emerald-100/60 uppercase font-bold text-xs tracking-widest mb-1">Contract Price</h4>
                    <div className="text-4xl font-black text-white flex items-baseline gap-1">
                       {data.marketStats.pricePerBushelUsd.toFixed(2)}
                       <span className="text-sm font-medium opacity-60">USD/Bu</span>
                    </div>
                  </div>
               </div>

               <div className="flex flex-col justify-center space-y-4 p-5 bg-white/5 border border-white/10 rounded-xl shadow-inner">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-emerald-100/60 font-semibold text-xs tracking-widest uppercase">Exchange</span>
                    <span className="text-emerald-50 font-bold">{data.marketStats.activeExchange}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-emerald-100/60 font-semibold text-xs tracking-widest uppercase">Trading Temp</span>
                    <span className="text-emerald-50 font-bold">{data.marketStats.tradingVolume}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-100/60 font-semibold text-xs tracking-widest uppercase">Trend View</span>
                    <span className="text-emerald-50 font-bold bg-white/10 px-2 py-0.5 rounded text-xs">{data.marketStats.priceTrend}</span>
                  </div>
               </div>

             </div>

             <div className="mt-6 p-4 bg-emerald-950/50 border border-emerald-900/50 rounded-xl flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2 text-emerald-300">
                    <Activity className="w-5 h-5 opacity-70" />
                    <span className="font-bold uppercase tracking-wider text-xs">Projected Core Yield</span>
                 </div>
                 <div className="text-emerald-100 font-mono font-bold">
                    {data.marketStats.yieldPerAcreUsBushel} Bushels / Acre
                 </div>
             </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Standard Market Reporting</strong> 
              {data.apiCitation}
            </div>
          </div>

          <div className="bg-white border text-gray-900 border-gray-200 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Raw API Response Payload</h4>
              </div>
              <button 
                onClick={() => setShowRawJSON(!showRawJSON)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-700 transition"
              >
                {showRawJSON ? "Hide Payload" : "Inspect Payload"}
              </button>
            </div>

            {showRawJSON && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button 
                    onClick={handleCopyJSON}
                    className="px-2.5 py-1 text-[11px] font-bold bg-brand-green/10 text-brand-green hover:bg-brand-green/20 rounded-md transition"
                  >
                    Copy JSON to Clipboard
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
