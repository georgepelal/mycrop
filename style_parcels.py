import re

with open("src/pages/Parcels.tsx", "r") as f:
    content = f.read()

new_empty = """        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[400px]">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-2 border border-emerald-100">
            <Map className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="space-y-2 max-w-lg">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t("parcels.emptyTitle", "No Drawn Field Boundaries")}</h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              {t("parcels.emptyDesc", "Before we can measure NDVI vegetation scores or render 3D terrain configurations, we must draw GPS boundary nodes first.")}
            </p>
          </div>
          <button
            onClick={onNavigateToForm}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black px-8 py-4 rounded-2xl shadow-sm transition-all mt-4"
          >
            {t("parcels.emptyButton", "Open GPS Boundary Canvas")}
          </button>
        </div>"""

pattern = re.compile(r"        <div className=\"bg-slate-50 border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 min-h-\[300px\]\">\n          <div className=\"w-16 h-16 bg-brand-green\/10 rounded-2xl flex items-center justify-center mb-2\">\n            <Map className=\"w-8 h-8 text-brand-green\" \/>\n          <\/div>\n          <div className=\"space-y-1\.5\">\n            <h3 className=\"text-sm font-display font-black text-gray-950\">\{t\(\"parcels\.emptyTitle\", \"No Drawn Field Boundaries\"\)\}<\/h3>\n            <p className=\"text-xs text-gray-500 max-w-sm leading-relaxed\">\n              \{t\(\"parcels\.emptyDesc\", \"Before we can measure NDVI vegetation scores or render 3D terrain configurations, we must draw GPS boundary nodes first\.\"\)\}\n            <\/p>\n          <\/div>\n          <button\n            onClick=\{onNavigateToForm\}\n            className=\"bg-brand-green hover:bg-brand-green-hover text-white text-xs font-display font-extrabold px-5 py-3 rounded-xl shadow-sm transition-all\"\n          >\n            \{t\(\"parcels\.emptyButton\", \"Open GPS Boundary Canvas\"\)\}\n          <\/button>\n        <\/div>", re.DOTALL)

content = pattern.sub(new_empty, content)

with open("src/pages/Parcels.tsx", "w") as f:
    f.write(content)

print("done")
