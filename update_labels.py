import re

with open("src/components/EarthIslandVisualizer.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'className="flex items-center pr-1 sm:pr-2"',
    'className="flex items-center pr-2 sm:pr-3 justify-end w-full relative group"'
)

content = content.replace(
    'className="flex flex-col justify-center pl-1 sm:pl-2"',
    'className="flex flex-col justify-center pl-2 sm:pl-3 relative group"'
)

with open("src/components/EarthIslandVisualizer.tsx", "w") as f:
    f.write(content)
print("done")
