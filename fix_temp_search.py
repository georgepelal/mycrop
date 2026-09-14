import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

# Remove LocationSearch import
content = re.sub(r"import LocationSearch from \"\.\./components/LocationSearch\";\n", "", content)

# Remove LocationSearch element
search_pattern = re.compile(r"        \{\/\* Location search dropdown \*\/\}\n        <div className=\"w-full md:w-80\">\n          <LocationSearch \n            onLocationSelect=\{handleLocationSelect\} \n            placeholder=\"Search sub-surface location\.\.\.\" \n          />\n        <\/div>\n")
content = search_pattern.sub("", content)

# Remove handleLocationSelect
handle_pattern = re.compile(r"  const handleLocationSelect = \(lat: number, lng: number, name: string\) => \{\n    setCoords\(\{ lat, lng \}\);\n    setLocationName\(name\);\n  \};\n\n")
content = handle_pattern.sub("", content)

with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
    f.write(content)
print("done")
