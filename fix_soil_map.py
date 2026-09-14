import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

# Remove the map container HTML
map_pattern = re.compile(r"          \{\/\* Map Section \*\/\}\n          <div className=\"relative w-full h-\[250px\] lg:h-\[300px\].*?          <\/div>\n\n", re.DOTALL)
content = map_pattern.sub("", content)

# Remove the leaflet state and refs
refs_pattern = re.compile(r"  const containerRef = useRef<HTMLDivElement>\(null\);\n  const mapInstanceRef = useRef<any>\(null\);\n  const polygonLayerRef = useRef<any>\(null\);\n  const markerLayerRef = useRef<any>\(null\);\n  const \[isLeafletLoaded, setIsLeafletLoaded\] = useState\(false\);\n")
content = refs_pattern.sub("", content)

# Remove Leaflet use effects
effects_pattern = re.compile(r"  useEffect\(\(\) => \{\n    if \(!document\.getElementById\(\"leaflet-css-link\"\)\).*?  \}, \[coords, isLeafletLoaded\]\);\n\n", re.DOTALL)
content = effects_pattern.sub("", content)

with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
    f.write(content)
print("done")
