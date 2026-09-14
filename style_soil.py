import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

new_cards = """              <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 max-w-4xl mx-auto mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Sprout className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Topsoil Summary (0-15cm)</h3>
                      <p className="text-sm font-medium text-slate-500 mt-0.5">Average conditions for root establishment</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Texture Class</p>
                      <p className="text-xl font-black text-slate-800">{texture}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200/50 text-[11px] font-bold text-slate-500 space-y-1.5">
                      <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-400" /> Sand</span> <span className="font-black text-slate-700">{sandPct}%</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-orange-400" /> Silt</span> <span className="font-black text-slate-700">{siltPct}%</span></div>
                      <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-stone-500" /> Clay</span> <span className="font-black text-slate-700">{clayPct}%</span></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/80 p-5 rounded-[1.5rem] border border-blue-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FlaskConical className="w-3.5 h-3.5 text-blue-400" /> Soil pH (H₂O)</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black text-blue-600">{avgPh}</p>
                        <p className="text-sm font-bold text-blue-600/60">pH</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-blue-200/50">
                      <p className="text-xs font-bold text-blue-700 bg-blue-100/50 inline-block px-2.5 py-1 rounded-md">
                        {parseFloat(avgPh) < 6.0 ? "Acidic" : parseFloat(avgPh) > 7.5 ? "Alkaline" : "Neutral (Optimal)"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50/80 p-5 rounded-[1.5rem] border border-emerald-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Organic Carbon</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black text-emerald-600">{avgSoc}</p>
                        <p className="text-sm font-bold text-emerald-600/60">g/kg</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-emerald-200/50">
                      <p className="text-xs font-bold text-emerald-700 bg-emerald-100/50 inline-block px-2.5 py-1 rounded-md">
                        Indicator of soil health
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-stone-50/50 to-stone-50/80 p-5 rounded-[1.5rem] border border-stone-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Weight className="w-3.5 h-3.5 text-stone-500" /> Bulk Density</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black text-stone-700">{avgBd}</p>
                        <p className="text-sm font-bold text-stone-500/60">kg/dm³</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-stone-200/50">
                      <p className="text-xs font-bold text-stone-700 bg-stone-200/50 inline-block px-2.5 py-1 rounded-md">
                        {parseFloat(avgBd) > 1.6 ? "Compacted" : "Well-aerated"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>"""

pattern = re.compile(r"              <div className=\"bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 max-w-3xl mx-auto mb-6\">\n                <div className=\"flex items-center gap-3 mb-6 pb-6 border-b border-slate-100\">\n                  <div className=\"w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center\">\n                    <Sprout className=\"w-5 h-5 text-emerald-600\" \/>\n                  <\/div>\n                  <div>\n                    <h3 className=\"text-lg font-black text-slate-800\">Topsoil Summary \(0-15cm\)<\/h3>\n                    <p className=\"text-xs font-medium text-slate-500\">Average conditions for root establishment<\/p>\n                  <\/div>\n                <\/div>.*?<\/p>\n                  <\/div>\n                <\/div>\n              <\/div>", re.DOTALL)

content = pattern.sub(new_cards, content)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)

print("done")
