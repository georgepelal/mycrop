import re

with open("src/components/EarthIslandVisualizer.tsx", "r") as f:
    content = f.read()

bedrock_old = """            {/* Bedrock layer */}
            <div className="flex">
              {[...Array(20)].map((_, i) => (
                <div key={`bedrock-${i}`} className="w-[var(--block-size)] h-[var(--block-size)] bg-[#505050] border-[1px] md:border-[2px] border-t-[#787878] border-l-[#787878] border-b-[#2a2a2a] border-r-[#2a2a2a] shrink-0" />
              ))}
            </div>
            <div className="flex">
              {[...Array(20)].map((_, i) => (
                <div key={`bedrock-2-${i}`} className="w-[var(--block-size)] h-[var(--block-size)] bg-[#404040] border-[1px] md:border-[2px] border-t-[#606060] border-l-[#606060] border-b-[#1a1a1a] border-r-[#1a1a1a] shrink-0" />
              ))}
            </div>"""

bedrock_new = """            {/* Bedrock layer */}
            <div className="flex">
              {[...Array(20)].map((_, i) => (
                <div key={`bedrock-${i}`} className={`w-[var(--block-size)] h-[var(--block-size)] ${i % 2 === 0 ? 'bg-[#505050] border-t-[#787878] border-l-[#787878] border-b-[#2a2a2a] border-r-[#2a2a2a]' : 'bg-[#4a4a4a] border-t-[#6a6a6a] border-l-[#6a6a6a] border-b-[#222222] border-r-[#222222]'} border-[1px] md:border-[2px] shrink-0 relative overflow-hidden`}>
                  {i % 3 === 0 && <div className="absolute top-[20%] left-[20%] w-[20%] h-[20%] bg-[#333] opacity-30" />}
                </div>
              ))}
            </div>
            <div className="flex">
              {[...Array(20)].map((_, i) => (
                <div key={`bedrock-2-${i}`} className={`w-[var(--block-size)] h-[var(--block-size)] ${i % 2 !== 0 ? 'bg-[#454545] border-t-[#606060] border-l-[#606060] border-b-[#1a1a1a] border-r-[#1a1a1a]' : 'bg-[#3b3b3b] border-t-[#555555] border-l-[#555555] border-b-[#111111] border-r-[#111111]'} border-[1px] md:border-[2px] shrink-0 relative overflow-hidden`}>
                   {i % 4 === 1 && <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-[#222] opacity-40" />}
                </div>
              ))}
            </div>"""

content = content.replace(bedrock_old, bedrock_new)

with open("src/components/EarthIslandVisualizer.tsx", "w") as f:
    f.write(content)
print("done")
