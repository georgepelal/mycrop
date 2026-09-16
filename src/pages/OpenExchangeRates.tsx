import React, { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Coins, Landmark, LineChart, Info } from "lucide-react";

interface OpenExchangeRatesProps {
  onNavigate: (page: string) => void;
}

interface RatesData {
  isLiveRates: boolean;
  base: string;
  rates: Record<string, number>;
  apiCitation: string;
}

export default function OpenExchangeRates({ onNavigate }: OpenExchangeRatesProps) {
  const [data, setData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJSON, setShowRawJSON] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/open-exchange-rates", {
        method: "GET"
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to assemble financial market rates");
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJSON = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Raw API JSON payload copied to clipboard!");
    }
  };

  // Select top agricultural currencies
  const featuredCurrencies = ["EUR", "BRL", "CAD", "AUD", "GBP", "INR", "CNY", "MXN", "JPY"];

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
              <Landmark className="w-7 h-7 text-indigo-600" />
              Open Exchange Rates
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Live spot market foreign exchange ratios against USD base.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="h-96 flex flex-col items-center justify-center border border-gray-100 rounded-3xl bg-white shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500">
            Querying active Open Exchange Rates index...
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

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 px-2 uppercase tracking-wide border-b border-slate-100 pb-2">
            <LineChart className="w-4 h-4 text-indigo-500" />
            Global Fiat Benchmarks
            
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {Object.entries(data.rates)
                .filter(([code]) => featuredCurrencies.includes(code) || Object.keys(data.rates).length < 20)
                .slice(0, 12)
                .map(([code, rate]) => (
                  <div key={code} className="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-center text-center transition-all">
                     <h3 className="font-bold text-slate-500 uppercase tracking-widest text-sm mb-1">{code}</h3>
                     <div className="text-2xl font-black text-slate-800">{rate.toFixed(4)}</div>
                     <p className="text-[10px] text-slate-400 mt-1">per 1 {data.base}</p>
                  </div>
             ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm text-center">
            <Coins className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
            <div className="font-bold text-slate-700 text-sm">International Export Valuation</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Currency fluctuations directly impact crop export competitiveness. Monitoring BRL, CAD, and EUR helps domestic growers price futures contracts accurately.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 text-slate-700">
            <Info className="w-6 h-6 shrink-0 mt-0.5 text-slate-500" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1">Financial Data Provider</strong> 
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
                <pre className="p-4 bg-slate-900 text-indigo-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-80 border border-slate-950 leading-relaxed">
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
