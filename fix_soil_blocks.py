import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

new_block = """        {data && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 max-w-4xl mx-auto mb-6 w-full">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">Vertical Soil Profile Horizons</h3>
                <p className="text-xs font-medium text-slate-500">Volumetric composition by horizon</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { id: "0-5cm", label: "0 - 5 cm", height: "h-12" },
                { id: "5-15cm", label: "5 - 15 cm", height: "h-14" },
                { id: "15-30cm", label: "15 - 30 cm", height: "h-16" },
                { id: "30-60cm", label: "30 - 60 cm", height: "h-20" },
                { id: "60-100cm", label: "60 - 100 cm", height: "h-24" },
                { id: "100-200cm", label: "100 - 200 cm", height: "h-32" }
              ].map((layerConfig) => {
                const clay = data.clay[layerConfig.id] || 0;
                const sand = data.sand[layerConfig.id] || 0;
                const silt = data.silt[layerConfig.id] || 0;
                const total = clay + sand + silt;
                if (total === 0) return null;
                
                const clayPct = (clay / total) * 100;
                const sandPct = (sand / total) * 100;
                const siltPct = (silt / total) * 100;

                return (
                  <div key={layerConfig.id} className="flex flex-col md:flex-row items-center gap-4 group">
                    <div className="w-full md:w-32 shrink-0 text-left md:text-right">
                      <span className="text-xs font-black text-slate-400 group-hover:text-slate-700 transition-colors">{layerConfig.label}</span>
                    </div>
                    
                    <div className={`flex-1 w-full flex rounded-xl overflow-hidden shadow-sm ${layerConfig.height} transition-all duration-300 hover:scale-[1.01]`}>
                      <div style={{ width: `${sandPct}%` }} className="bg-amber-300 flex items-center justify-center relative overflow-hidden group/layer cursor-help">
                        <span className="text-[10px] font-black text-amber-900 opacity-0 group-hover/layer:opacity-100 transition-opacity">
                          {sandPct.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ width: `${siltPct}%` }} className="bg-orange-300 flex items-center justify-center relative overflow-hidden group/layer cursor-help">
                        <span className="text-[10px] font-black text-orange-900 opacity-0 group-hover/layer:opacity-100 transition-opacity">
                          {siltPct.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ width: `${clayPct}%` }} className="bg-stone-500 flex items-center justify-center relative overflow-hidden group/layer cursor-help">
                        <span className="text-[10px] font-black text-stone-100 opacity-0 group-hover/layer:opacity-100 transition-opacity">
                          {clayPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="hidden md:flex w-24 shrink-0 flex-col gap-0.5">
                      <div className="flex justify-between text-[9px] font-bold text-slate-500"><span className="text-amber-600">Sand</span> {sandPct.toFixed(0)}%</div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500"><span className="text-orange-600">Silt</span> {siltPct.toFixed(0)}%</div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500"><span className="text-stone-600">Clay</span> {clayPct.toFixed(0)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}"""

pattern = re.compile(r"        \{data && \(\n          <div className=\"bg-\[#6b9fd4\] rounded-3xl p-6 shadow-sm border-4 border-slate-900 flex flex-col items-center justify-center relative overflow-hidden\">\n.*?<\/div>\n            <\/div>\n          <\/div>\n        \)\}", re.DOTALL)

content = pattern.sub(new_block, content)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)

print("done")
