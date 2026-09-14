import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

target = """                    );
                  }
                };
              })}
            />"""

replacement = """                    );
                  }
                };
              })}
              legend={
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-white/20 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white w-full">
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    <div className="w-3 h-3 bg-[#e3c16f] border border-white/50 rounded-[2px]" /> Sand
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    <div className="w-3 h-3 bg-[#986445] border border-white/50 rounded-[2px]" /> Silt
                  </div>
                  <div className="flex items-center gap-1.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                    <div className="w-3 h-3 bg-[#a4a8aa] border border-white/50 rounded-[2px]" /> Clay
                  </div>
                </div>
              }
            />"""

content = content.replace(target, replacement)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)
print("done")
