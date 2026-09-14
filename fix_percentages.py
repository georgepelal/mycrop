import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

replacement = """              {/* Right side labels - Percentages */}
              <div className="hidden xl:flex flex-col items-start pt-[calc(var(--block-size)+4px)] lg:pt-[calc(var(--block-size)+6px)]">
                {[
                  { id: "0-5cm", height: 1 },
                  { id: "5-15cm", height: 1 },
                  { id: "15-30cm", height: 2 },
                  { id: "30-60cm", height: 2 },
                  { id: "60-100cm", height: 2 },
                  { id: "100-200cm", height: 3 }
                ].map((layerConfig, i) => {
                  const clay = data.clay[layerConfig.id] || 0;
                  const sand = data.sand[layerConfig.id] || 0;
                  const silt = data.silt[layerConfig.id] || 0;
                  const total = clay + sand + silt;
                  
                  if (total === 0) return null;
                  
                  const clayPct = ((clay / total) * 100).toFixed(0);
                  const sandPct = ((sand / total) * 100).toFixed(0);
                  const siltPct = ((silt / total) * 100).toFixed(0);

                  return (
                    <div key={`pct-${i}`} style={{ height: `calc(${layerConfig.height} * var(--block-size))` }} className="flex flex-col justify-center pl-4">
                      <div className="flex flex-col gap-1 text-[10px] lg:text-[11px] font-bold text-white/90">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-[#e3c16f]"></div>
                          <span className="w-10">Sand</span>
                          <span className="text-amber-200 w-8 text-right">{sandPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-[#986445]"></div>
                          <span className="w-10">Silt</span>
                          <span className="text-orange-300 w-8 text-right">{siltPct}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-sm bg-[#a4a8aa]"></div>
                          <span className="w-10">Clay</span>
                          <span className="text-stone-200 w-8 text-right">{clayPct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>"""

pattern = re.compile(r"              \{\/\* Right side labels - Percentages \*\/\}\n              <div className=\"hidden xl:flex flex-col items-start pt-\[calc\(var\(--block-size\)\+4px\)\] lg:pt-\[calc\(var\(--block-size\)\+6px\)\]\">.*?\n                  \);\n                \}\)\}\n              </div>", re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(replacement, content)
    with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Pattern not found")
