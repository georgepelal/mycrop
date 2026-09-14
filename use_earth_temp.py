import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

new_block = """              <div className="mb-6">
                <EarthIslandVisualizer 
                  cropType={selectedCrop}
                  layers={[
                    { 
                      id: "0-7cm", 
                      height: 2, 
                      leftLabel: <span className="text-white/80 font-black text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">0-7cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          <span className="text-amber-200">{convertTemp(currentTempShallow).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistShallow.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`0-7cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempShallow)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              0-7cm: {convertTemp(currentTempShallow).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { 
                      id: "7-28cm", 
                      height: 3, 
                      leftLabel: <span className="text-white/80 font-black text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">7-28cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          <span className="text-amber-200">{convertTemp(currentTempMid).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistMid.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`7-28cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempMid)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              7-28cm: {convertTemp(currentTempMid).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { 
                      id: "28-100cm", 
                      height: 4, 
                      leftLabel: <span className="text-white/80 font-black text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">28-100cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          <span className="text-amber-200">{convertTemp(currentTempDeep).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistDeep.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`28-100cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempDeep)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              28-100cm: {convertTemp(currentTempDeep).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    },
                    { 
                      id: "100-255cm", 
                      height: 4, 
                      leftLabel: <span className="text-white/80 font-black text-[10px] lg:text-xs whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">100-255cm</span>,
                      rightLabel: (
                        <div className="flex flex-col text-[10px] font-extrabold text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                          <span className="text-amber-200">{convertTemp(currentTempBedrock).toFixed(1)}°{tempUnit}</span>
                          <span className="text-sky-200 text-[9px]">{currentMoistBedrock.toFixed(0)}% VWC</span>
                        </div>
                      ),
                      renderBlock: (rowIndex, colIndex) => (
                        <div key={`100-255cm-${rowIndex}-${colIndex}`} className={`w-[var(--block-size)] h-[var(--block-size)] border-[1px] md:border-[2px] ${getRetroBlockColor(currentTempBedrock)} shrink-0 group relative`}>
                          {rowIndex === 0 && colIndex === 10 && (
                            <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20">
                              100-255cm: {convertTemp(currentTempBedrock).toFixed(1)}°{tempUnit}
                            </div>
                          )}
                        </div>
                      )
                    }
                  ]}
                  legend={
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-white/20 text-[9px] font-black uppercase tracking-wider text-white w-full">
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        <div className="w-2.5 h-2.5 bg-[#1d4ed8] border border-white" /> Cold (≤0°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        <div className="w-2.5 h-2.5 bg-[#0284c7] border border-white" /> Cool (&lt;8°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        <div className="w-2.5 h-2.5 bg-[#0d9488] border border-white" /> Mild (&lt;15°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        <div className="w-2.5 h-2.5 bg-[#ea580c] border border-white" /> Warm (&lt;25°C)
                      </div>
                      <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                        <div className="w-2.5 h-2.5 bg-[#dc2626] border border-white" /> Hot (≥25°C)
                      </div>
                    </div>
                  }
                />
              </div>"""

pattern = re.compile(r"              <div className=\"bg-white dark:bg-slate-900 rounded-\[2rem\] p-6 shadow-sm border border-slate-100 dark:border-slate-800 max-w-4xl mx-auto mb-6 w-full\">\n                <div className=\"flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800\">\n                  <div className=\"w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900\/30 flex items-center justify-center\">\n                    <Thermometer className=\"w-5 h-5 text-blue-600 dark:text-blue-500\" \/>\n                  <\/div>\n                  <div>\n                    <h3 className=\"text-lg font-black text-slate-800 dark:text-slate-100\">Sub-Surface Thermal Profile<\/h3>\n                    <p className=\"text-xs font-medium text-slate-500 dark:text-slate-400\">Current temperature & moisture by depth<\/p>\n                  <\/div>\n                <\/div>\n\n                <div className=\"flex flex-col gap-3\">\n.*?<\/div>\n              <\/div>", re.DOTALL)

content = pattern.sub(new_block, content)

# Need to add import
if "import { EarthIslandVisualizer }" not in content:
    content = content.replace('import { Thermometer,', 'import { EarthIslandVisualizer } from "../components/EarthIslandVisualizer";\nimport { Thermometer,')

with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
    f.write(content)

print("done")
