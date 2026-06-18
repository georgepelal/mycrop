import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

interface ProfitMetricChartsProps {
  cropType: string;
  targetYieldHectare: number;
  netProfit: number;
  plantingMonth: string;
}

export default function ProfitMetricCharts({
  cropType,
  targetYieldHectare,
  netProfit,
  plantingMonth,
}: ProfitMetricChartsProps) {
  
  // Calculate simulated yield data depending on planting month offsets
  // This demonstrates dynamic analytics curves
  const plantingTimelineData = [
    { name: "Early (-30d)", yield: Number((targetYieldHectare * 0.78).toFixed(1)), profit: Math.round(netProfit * 0.72) },
    { name: "Optimal Peak", yield: Number((targetYieldHectare * 1.15).toFixed(1)), profit: Math.round(netProfit * 1.25) },
    { name: "Chosen Window", yield: targetYieldHectare, profit: netProfit },
    { name: "Late (+15d)", yield: Number((targetYieldHectare * 0.88).toFixed(1)), profit: Math.round(netProfit * 0.82) },
    { name: "Delayed (+30d)", yield: Number((targetYieldHectare * 0.65).toFixed(1)), profit: Math.round(netProfit * 0.55) },
  ];

  // Dynamic scenarios: how profit is squeezed by climate factors
  const climateScenarioData = [
    {
      scenario: "Severe Drought",
      Expenses: Math.round(netProfit * 0.45 < 0 ? 1000 : netProfit * 0.15),
      Revenue: Math.round(netProfit * 0.4),
      Profit: Math.round(netProfit * 0.3)
    },
    {
      scenario: "Moderate Dry",
      Expenses: Math.round(netProfit * 0.85),
      Revenue: Math.round(netProfit * 0.75),
      Profit: Math.round(netProfit * 0.7)
    },
    {
      scenario: "Actual Predict",
      Expenses: Math.round(netProfit * 1.2),
      Revenue: Math.round(netProfit * 1.15 + netProfit * 0.85),
      Profit: netProfit
    },
    {
      scenario: "Optimal Rains",
      Expenses: Math.round(netProfit * 0.95),
      Revenue: Math.round(netProfit * 2.22),
      Profit: Math.round(netProfit * 1.35)
    }
  ];

  const formatCurrency = (val: number) => {
    if (val === undefined || isNaN(val)) return "$0";
    if (Math.abs(val) >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    } else if (Math.abs(val) >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Chart 1: Planting Offset Optimization */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm text-text-dark">
        <div className="mb-4">
          <h4 className="font-display font-semibold text-base text-text-dark flex items-center gap-2">
            📊 Planting Offsets vs. Projected Harvest Metrics
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Analyzing yield curves based on timing deviations surrounding your chosen <strong className="text-brand-green">{plantingMonth}</strong> window.
          </p>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plantingTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} name="Yield" tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                labelStyle={{ fontWeight: "bold", color: "#2D5A27", fontSize: "11px" }}
                itemStyle={{ fontSize: "12px", color: "#1e293b" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Line
                name={`Yield Yield (tons/ha)`}
                type="monotone"
                dataKey="yield"
                stroke="#2D5A27"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
              <Line
                name="Projected Net Margin ($)"
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Climate Scenario Resilience Matrix */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm text-text-dark">
        <div className="mb-4">
          <h4 className="font-display font-semibold text-base text-text-dark flex items-center gap-2">
            ⛈️ Market & Weather Stress Scenario Stress-Testing
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Resilience screening of your {cropType} operations under severe precipitation bounds.
          </p>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={climateScenarioData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="scenario" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => formatCurrency(v)} tickLine={false} />
              <Tooltip
                formatter={(value: any) => [formatCurrency(value), ""]}
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                labelStyle={{ fontWeight: "bold", color: "#2D5A27", fontSize: "11px" }}
                itemStyle={{ fontSize: "12px", color: "#1e293b" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              <Bar name="Net Profit ($)" dataKey="Profit" fill="#2D5A27" radius={[4, 4, 0, 0]} />
              <Bar name="Est. Expenses ($)" dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
