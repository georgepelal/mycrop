import re

with open("src/components/EarthIslandVisualizer.tsx", "r") as f:
    content = f.read()

target = """            {/* Grass layer */}
            <div className="flex">
              {[...Array(20)].map((_, i) => (
                <div key={`grass-${i}`} className="w-[var(--block-size)] h-[var(--block-size)] bg-[#528a36] border-[1px] md:border-[2px] border-t-[#70b24b] border-l-[#70b24b] border-b-[#325720] border-r-[#325720] shrink-0" />
              ))}
            </div>"""

replacement = """            {/* Grass layer */}
            <div className="flex">
              {[...Array(20)].map((_, i) => (
                <div key={`grass-${i}`} className={`w-[var(--block-size)] h-[var(--block-size)] ${i % 2 === 0 ? 'bg-[#528a36] border-t-[#70b24b] border-l-[#70b24b] border-b-[#325720] border-r-[#325720]' : 'bg-[#4b7a32] border-t-[#66a345] border-l-[#66a345] border-b-[#2a4d1b] border-r-[#2a4d1b]'} border-[1px] md:border-[2px] shrink-0 relative overflow-hidden`}>
                  {i % 4 === 2 && <div className="absolute bottom-0 left-[20%] w-[40%] h-[40%] bg-[#3d6328] rounded-t-full" />}
                </div>
              ))}
            </div>"""

content = content.replace(target, replacement)

with open("src/components/EarthIslandVisualizer.tsx", "w") as f:
    f.write(content)
print("done")
