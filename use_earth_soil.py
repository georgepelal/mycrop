import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

new_block = """          <div className="mb-6">
            <EarthIslandVisualizer 
              cropType={activeParcel?.cropType || "Corn"}
              layers={[
                { id: "0-5cm", height: 1, label: "0-5cm" },
                { id: "5-15cm", height: 1, label: "5-15cm" },
                { id: "15-30cm", height: 2, label: "15-30cm" },
                { id: "30-60cm", height: 2, label: "30-60cm" },
                { id: "60-100cm", height: 2, label: "60-100cm" },
                { id: "100-200cm", height: 3, label: "100-200cm" }
              ].map((layerConfig) => {
                const clay = data.clay[layerConfig.id] || 0;
                const sand = data.sand[layerConfig.id] || 0;
                const silt = data.silt[layerConfig.id] || 0;
                const total = clay + sand + silt;
                
                const clayPct = total > 0 ? ((clay / total) * 100).toFixed(0) : "0";
                const sandPct = total > 0 ? ((sand / total) * 100).toFixed(0) : "0";
                const siltPct = total > 0 ? ((silt / total) * 100).toFixed(0) : "0";

                const sandBlocks = Math.round((sand / (total || 1)) * 20);
                const siltBlocks = Math.round((silt / (total || 1)) * 20);
                const clayBlocks = 20 - sandBlocks - siltBlocks;
                
                const blocksRow = [
                  ...Array(Math.max(0, sandBlocks)).fill('sand'),
                  ...Array(Math.max(0, siltBlocks)).fill('silt'),
                  ...Array(Math.max(0, clayBlocks)).fill('clay')
                ];

                return {
                  id: layerConfig.id,
                  height: layerConfig.height,
                  leftLabel: <span className="text-white/80 font-black text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{layerConfig.label}</span>,
                  rightLabel: (
                    <div className="flex flex-col gap-0.5 text-[10px] lg:text-[11px] font-extrabold text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                      <div className="flex items-center gap-1.5 text-amber-200"><div className="w-1.5 h-1.5 bg-[#e3c16f] rounded-[1px]"/> {sandPct}%</div>
                      <div className="flex items-center gap-1.5 text-orange-200"><div className="w-1.5 h-1.5 bg-[#986445] rounded-[1px]"/> {siltPct}%</div>
                      <div className="flex items-center gap-1.5 text-stone-200"><div className="w-1.5 h-1.5 bg-[#a4a8aa] rounded-[1px]"/> {clayPct}%</div>
                    </div>
                  ),
                  renderBlock: (rowIndex, colIndex) => {
                    const type = blocksRow[colIndex] || 'sand';
                    const colors = {
                      sand: 'bg-[#e3c16f] border-t-[#fceab5] border-l-[#fceab5] border-b-[#a88942] border-r-[#a88942]',
                      silt: 'bg-[#986445] border-t-[#bd825d] border-l-[#bd825d] border-b-[#633f2a] border-r-[#633f2a]', 
                      clay: 'bg-[#a4a8aa] border-t-[#d1d4d6] border-l-[#d1d4d6] border-b-[#737678] border-r-[#737678]'
                    };
                    const color = colors[type];
                    return (
                      <div key={`${layerConfig.id}-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${color} shrink-0 group relative`}>
                        {rowIndex === 0 && (
                          <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                            {layerConfig.label} ({type})
                          </div>
                        )}
                      </div>
                    );
                  }
                };
              })}
            />
          </div>"""

pattern = re.compile(r"          <div className=\"bg-white rounded-\[2rem\] p-6 shadow-sm border border-slate-100 max-w-4xl mx-auto mb-6 w-full\">\n            <div className=\"flex items-center gap-3 mb-6 pb-6 border-b border-slate-100\">\n              <div className=\"w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center\">\n                <Layers className=\"w-5 h-5 text-emerald-600\" \/>\n              <\/div>\n              <div>\n                <h3 className=\"text-lg font-black text-slate-800\">Vertical Soil Profile Horizons<\/h3>\n                <p className=\"text-xs font-medium text-slate-500\">Volumetric composition by horizon<\/p>\n              <\/div>\n            <\/div>\n\n            <div className=\"flex flex-col gap-3\">\n.*?<\/div>\n          <\/div>", re.DOTALL)

content = pattern.sub(new_block, content)

if "import { EarthIslandVisualizer }" not in content:
    content = content.replace('import { Droplets,', 'import { EarthIslandVisualizer } from "../components/EarthIslandVisualizer";\nimport { Droplets,')

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)

print("done")
