import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

# Texture Class Card
content = content.replace(
    'className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"',
    'className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50 p-5 rounded-[1.5rem] border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"'
)
content = content.replace(
    '<p className="text-xl font-black text-slate-800">{texture}</p>',
    '<p className="text-xl font-black text-slate-800 dark:text-slate-100">{texture}</p>'
)
content = content.replace(
    'className="mt-4 pt-4 border-t border-slate-200/50 text-[11px] font-bold text-slate-500 space-y-1.5"',
    'className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 space-y-1.5"'
)
content = content.replace(
    '<span className="font-black text-slate-700">{sandPct}%</span>',
    '<span className="font-black text-slate-700 dark:text-slate-300">{sandPct}%</span>'
)
content = content.replace(
    '<span className="font-black text-slate-700">{siltPct}%</span>',
    '<span className="font-black text-slate-700 dark:text-slate-300">{siltPct}%</span>'
)
content = content.replace(
    '<span className="font-black text-slate-700">{clayPct}%</span>',
    '<span className="font-black text-slate-700 dark:text-slate-300">{clayPct}%</span>'
)

# Soil pH Card
content = content.replace(
    'className="bg-gradient-to-br from-blue-50/50 to-blue-50/80 p-5 rounded-[1.5rem] border border-blue-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"',
    'className="bg-gradient-to-br from-blue-50/50 to-blue-50/80 dark:from-blue-900/20 dark:to-blue-900/10 p-5 rounded-[1.5rem] border border-blue-100/60 dark:border-blue-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"'
)
content = content.replace(
    '<p className="text-3xl font-black text-blue-600">{avgPh}</p>',
    '<p className="text-3xl font-black text-blue-600 dark:text-blue-400">{avgPh}</p>'
)
content = content.replace(
    'className="mt-4 pt-4 border-t border-blue-200/50"',
    'className="mt-4 pt-4 border-t border-blue-200/50 dark:border-blue-800/50"'
)
content = content.replace(
    'className="text-xs font-bold text-blue-700 bg-blue-100/50 inline-block px-2.5 py-1 rounded-md"',
    'className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/50 inline-block px-2.5 py-1 rounded-md"'
)

# Organic Carbon Card
content = content.replace(
    'className="bg-gradient-to-br from-emerald-50/50 to-emerald-50/80 p-5 rounded-[1.5rem] border border-emerald-100/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"',
    'className="bg-gradient-to-br from-emerald-50/50 to-emerald-50/80 dark:from-emerald-900/20 dark:to-emerald-900/10 p-5 rounded-[1.5rem] border border-emerald-100/60 dark:border-emerald-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"'
)
content = content.replace(
    '<p className="text-3xl font-black text-emerald-600">{avgSoc}</p>',
    '<p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{avgSoc}</p>'
)
content = content.replace(
    'className="mt-4 pt-4 border-t border-emerald-200/50"',
    'className="mt-4 pt-4 border-t border-emerald-200/50 dark:border-emerald-800/50"'
)
content = content.replace(
    'className="text-xs font-bold text-emerald-700 bg-emerald-100/50 inline-block px-2.5 py-1 rounded-md"',
    'className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/50 inline-block px-2.5 py-1 rounded-md"'
)

# Bulk Density Card
content = content.replace(
    'className="bg-gradient-to-br from-stone-50/50 to-stone-50/80 p-5 rounded-[1.5rem] border border-stone-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"',
    'className="bg-gradient-to-br from-stone-50/50 to-stone-50/80 dark:from-stone-900/20 dark:to-stone-900/10 p-5 rounded-[1.5rem] border border-stone-200/60 dark:border-stone-800/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"'
)
content = content.replace(
    '<p className="text-3xl font-black text-stone-700">{avgBd}</p>',
    '<p className="text-3xl font-black text-stone-700 dark:text-stone-300">{avgBd}</p>'
)
content = content.replace(
    'className="mt-4 pt-4 border-t border-stone-200/50"',
    'className="mt-4 pt-4 border-t border-stone-200/50 dark:border-stone-800/50"'
)
content = content.replace(
    'className="text-xs font-bold text-stone-700 bg-stone-100/50 inline-block px-2.5 py-1 rounded-md"',
    'className="text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100/50 dark:bg-stone-900/50 inline-block px-2.5 py-1 rounded-md"'
)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)
print("done")
