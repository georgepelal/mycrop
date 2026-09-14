import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

new_block = """              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 max-w-4xl mx-auto mb-6 w-full">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Thermometer className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Sub-Surface Thermal Profile</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Current temperature & moisture by depth</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {[
                    { id: "0-7cm", label: "0 - 7 cm", height: "h-14", temp: currentTempShallow, moist: currentMoistShallow },
                    { id: "7-28cm", label: "7 - 28 cm", height: "h-16", temp: currentTempMid, moist: currentMoistMid },
                    { id: "28-100cm", label: "28 - 100 cm", height: "h-24", temp: currentTempDeep, moist: currentMoistDeep },
                    { id: "100-255cm", label: "100 - 255 cm", height: "h-32", temp: currentTempBedrock, moist: currentMoistBedrock },
                  ].map((layerConfig) => {
                    // Create a color based on the temperature
                    const tempC = layerConfig.temp;
                    let bgColor = "bg-emerald-500";
                    if (tempC <= 0) bgColor = "bg-blue-700";
                    else if (tempC < 8) bgColor = "bg-sky-500";
                    else if (tempC < 15) bgColor = "bg-teal-500";
                    else if (tempC < 25) bgColor = "bg-orange-500";
                    else bgColor = "bg-red-500";

                    return (
                      <div key={layerConfig.id} className="flex flex-col md:flex-row items-center gap-4 group">
                        <div className="w-full md:w-32 shrink-0 text-left md:text-right">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">{layerConfig.label}</span>
                        </div>
                        
                        <div className={`flex-1 w-full flex rounded-xl overflow-hidden shadow-sm ${layerConfig.height} transition-all duration-300 hover:scale-[1.01]`}>
                          <div className={`${bgColor} w-full flex items-center justify-between px-4 relative overflow-hidden group/layer`}>
                             <div className="flex flex-col z-10 text-white drop-shadow-md">
                               <span className="text-xl font-black">{convertTemp(layerConfig.temp).toFixed(1)}°{tempUnit}</span>
                               <span className="text-[10px] font-bold text-white/80">{layerConfig.moist.toFixed(0)}% Volumetric Water Content</span>
                             </div>
                             
                             {/* Abstract waves/pattern based on moisture */}
                             <div className="absolute right-0 bottom-0 opacity-20 w-1/2 h-full bg-gradient-to-l from-white/40 to-transparent" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>"""

pattern = re.compile(r"              <div className=\"bg-\[#6b9fd4\] rounded-3xl p-6 shadow-md border-4 border-slate-900 flex flex-col items-center justify-center relative overflow-hidden\">\n.*?<\/div>\n              <\/div>", re.DOTALL)

content = pattern.sub(new_block, content)

with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
    f.write(content)

print("done")
