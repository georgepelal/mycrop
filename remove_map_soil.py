import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

# Replace the layout map section
map_pattern = re.compile(r"      <div className=\{\`grid grid-cols-1 \$\{data \? 'lg:grid-cols-2' : ''\} gap-6\`\}>\n        <div className=\"w-full h-\[350px\] lg:h-auto lg:min-h-\[500px\] bg-slate-900 rounded-3xl relative overflow-hidden border border-slate-200 shadow-sm\">\n             \{\!isLeafletLoaded && \(\n              <div className=\"absolute inset-0 flex items-center justify-center bg-slate-900 z-10\">\n                <Loader2 className=\"w-8 h-8 text-emerald-500 animate-spin\" \/>\n              <\/div>\n            \)\}\n            <div ref=\{containerRef\} className=\"w-full h-full z-0 cursor-crosshair\" \/>\n            <div className=\"absolute bottom-4 left-4 bg-white\/90 backdrop-blur-md px-3 py-1\.5 rounded-lg border border-slate-200 shadow-sm text-xs font-bold text-slate-700 pointer-events-none z-\[1000\]\">\n               🎯 Click inside the green field boundary to sample soil data\n            <\/div>\n            \{coords && \(\n              <div className=\"absolute top-4 right-4 bg-white\/90 backdrop-blur-md px-3 py-1\.5 rounded-lg border border-slate-200 shadow-sm text-xs font-mono font-bold text-slate-700 pointer-events-none z-\[1000\]\">\n                 \{coords\.lat\.toFixed\(5\)\}, \{coords\.lng\.toFixed\(5\)\}\n              <\/div>\n            \)\}\n        <\/div>")

new_map_str = "      <div className={`flex justify-center w-full`}>"
content = map_pattern.sub(new_map_str, content)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)

print("done")
