import re

with open("src/components/EarthIslandVisualizer.tsx", "r") as f:
    content = f.read()

# Update sky background
content = content.replace(
    'className="island-wrapper bg-[#6b9fd4] rounded-3xl',
    'className="island-wrapper bg-gradient-to-b from-[#38bdf8] to-[#0284c7] rounded-3xl'
)

# Replace cloud decorations with animated ones and a sun
clouds_old = """      {/* Cloud pixel decorations */}
      <div className="absolute top-4 left-8 w-16 h-6 bg-white/80 rounded-sm" />
      <div className="absolute top-8 right-12 w-24 h-8 bg-white/80 rounded-sm" />
      <div className="absolute top-12 left-1/3 w-20 h-6 bg-white/80 rounded-sm" />"""

clouds_new = """      {/* Retro Sun & Clouds */}
      <div className="absolute top-8 right-16 w-12 h-12 bg-yellow-300 border-4 border-yellow-100 shadow-[0_0_30px_rgba(253,224,71,0.6)] rounded-sm animate-pulse" />
      <div className="absolute top-6 left-8 w-16 h-6 bg-white/90 rounded-sm" style={{ animation: "float 6s ease-in-out infinite" }} />
      <div className="absolute top-10 right-32 w-24 h-8 bg-white/90 rounded-sm" style={{ animation: "float 8s ease-in-out infinite reverse" }} />
      <div className="absolute top-16 left-1/3 w-20 h-6 bg-white/90 rounded-sm" style={{ animation: "float 7s ease-in-out infinite 1s" }} />"""
content = content.replace(clouds_old, clouds_new)

# Add keyframes to style
style_old = """.island-wrapper {
            container-type: inline-size;
          }"""

style_new = """.island-wrapper {
            container-type: inline-size;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }"""
content = content.replace(style_old, style_new)

with open("src/components/EarthIslandVisualizer.tsx", "w") as f:
    f.write(content)
print("done")
