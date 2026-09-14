import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

new_seeding = """              {/* Tab 2: Seeding Safety Evaluation */}
              {activeTab === "crop" && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-center shrink-0">
                      <Sprout className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Crop Planting & Germination Suitability
                      </h3>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Determine if current subsurface soil heat levels meet physical sprouting thresholds.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-2">
                        Select Crop Category
                      </label>
                      <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow appearance-none"
                      >
                        {CROP_THRESHOLDS.map((crop) => (
                          <option key={crop.name} value={crop.name}>
                            {crop.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Threshold quick spec card */}
                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-4 text-center">
                      <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Min Germination</p>
                        <p className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                          {activeCropThreshold.minGermination}°C <span className="text-xs text-slate-500">({ (activeCropThreshold.minGermination * 9/5 + 32).toFixed(0) }°F)</span>
                        </p>
                      </div>
                      <div className="flex flex-col justify-center border-l border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Optimal Min</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-1">
                          {activeCropThreshold.optMin}°C <span className="text-xs text-emerald-600/60">({ (activeCropThreshold.optMin * 9/5 + 32).toFixed(0) }°F)</span>
                        </p>
                      </div>
                      <div className="flex flex-col justify-center border-l border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Optimal Max</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-500 mt-1">
                          {activeCropThreshold.optMax}°C <span className="text-xs text-emerald-600/60">({ (activeCropThreshold.optMax * 9/5 + 32).toFixed(0) }°F)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Suitability Result */}
                  <div className={`p-5 rounded-2xl border-2 ${suitability.color} space-y-2`}>
                    <div className="flex items-center gap-3">
                      <suitability.icon className="w-6 h-6" />
                      <span className="text-sm font-black uppercase tracking-widest">
                        {suitability.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed opacity-90">{suitability.msg}</p>
                  </div>
                </div>
              )}"""

pattern = re.compile(r"              \{\/\* Tab 2: Seeding Safety Evaluation \*\/\}\n              \{activeTab === \"crop\" && \(\n                <div className=\"bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 space-y-4\">\n                  <div>\n                    <h3 className=\"text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2\">\n                      <Sprout className=\"w-5 h-5 text-emerald-500\" \/>\n                      Crop Planting & Germination Suitability Evaluator\n                    <\/h3>\n                    <p className=\"text-\[11px\] text-slate-500 dark:text-slate-400\">\n                      Determine if current subsurface soil heat levels meet physical sprouting thresholds\.\n                    <\/p>\n                  <\/div>.*?<\/p>\n                  <\/div>\n                <\/div>\n              \)\}", re.DOTALL)

content = pattern.sub(new_seeding, content)

with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
    f.write(content)

print("done")
