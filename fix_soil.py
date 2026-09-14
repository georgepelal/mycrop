import re

with open("src/pages/SoilCompositionTexture.tsx", "r") as f:
    content = f.read()

new_effect = """  useEffect(() => {
    async function fetchData() {
      if (!coords) return;
      const fetchLat = parseFloat(coords.lat.toFixed(2));
      const fetchLng = parseFloat(coords.lng.toFixed(2));
      const cached = getCachedSoilData(fetchLat, fetchLng);
      if (cached) {
        setData(cached);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${fetchLng}&lat=${fetchLat}&property=clay&property=sand&property=silt&property=soc&property=phh2o&property=bdod&depth=0-5cm&depth=5-15cm&depth=15-30cm&depth=30-60cm&depth=60-100cm&depth=100-200cm&value=mean`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("Failed to load soil data");
        }
        
        const result = await response.json();
        
        const properties = result?.properties?.layers;
        if (!properties || !Array.isArray(properties)) {
          throw new Error("No soil data available for this location");
        }
        const parsedData: SoilData = {
          clay: {},
          sand: {},
          silt: {},
          soc: {},
          phh2o: {},
          bdod: {},
        };
        properties.forEach((layer: any) => {
          if (["clay", "sand", "silt", "soc", "phh2o", "bdod"].includes(layer.name)) {
            layer.depths.forEach((d: any) => {
              // bdod is cg/cm³, soc is dg/kg, phh2o is pH*10
              let val = d.values.mean;
              if (val !== undefined && val !== null) {
                if (layer.name === "clay" || layer.name === "sand" || layer.name === "silt") val = val / 10;
                else if (layer.name === "phh2o") val = val / 10;
                else if (layer.name === "soc") val = val / 10; // convert dg/kg to g/kg
                else if (layer.name === "bdod") val = val / 100; // cg/cm3 to kg/dm3
                parsedData[layer.name as keyof SoilData][d.label] = val;
              } else {
                parsedData[layer.name as keyof SoilData][d.label] = null;
              }
            });
          }
        });
        
        const hasValidClay = Object.values(parsedData.clay).some(v => v !== null);
        if (!hasValidClay) {
           throw new Error("No soil data available for this location (e.g. urbanized area or outside coverage)");
        }
        setData(parsedData);
        setCachedSoilData(fetchLat, fetchLng, parsedData);
      } catch (err: any) {
        setData(null);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [coords]);"""

pattern = re.compile(r"  useEffect\(\(\) => \{\n    async function fetchData\(\) \{.*?\n    fetchData\(\);\n  \}, \[coords\]\);", re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_effect, content)
    with open("src/pages/SoilCompositionTexture.tsx", "w") as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Pattern not found")
