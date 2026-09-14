import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

new_cards = """          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-stone-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Vertical Soil Profile</h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">Composition structure by precise depth horizons</p>
                </div>
              </div>
            </div>"""

pattern = re.compile(r"          <div className=\"bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 max-w-3xl mx-auto\">\n            <div className=\"flex items-center gap-3 mb-8 pb-6 border-b border-slate-100\">\n              <div className=\"w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center\">\n                <Layers className=\"w-5 h-5 text-stone-600\" \/>\n              <\/div>\n              <div>\n                <h3 className=\"text-lg font-black text-slate-800\">Vertical Soil Profile<\/h3>\n                <p className=\"text-xs font-medium text-slate-500\">Composition by depth<\/p>\n              <\/div>\n            <\/div>", re.DOTALL)

content = pattern.sub(new_cards, content)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)

print("done")
