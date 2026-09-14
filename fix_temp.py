import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

new_effect = """  useEffect(() => {
    if (!coords) return;

    let active = true;
    
    const fetchLat = parseFloat(coords.lat.toFixed(2));
    const fetchLng = parseFloat(coords.lng.toFixed(2));
    
    const cached = getCachedTempData(fetchLat, fetchLng);
    if (cached) {
      setSoilData(cached);
      return;
    }
    
    setLoading(true);
    setError(null);

    const fetchSoilParameters = async () => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${fetchLat}&longitude=${fetchLng}&hourly=soil_temperature_0_to_7cm,soil_temperature_7_to_28cm,soil_temperature_28_to_100cm,soil_temperature_100_to_255cm,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,soil_moisture_28_to_100cm,soil_moisture_100_to_255cm`;
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error("Failed to fetch sub-surface data from Open-Meteo.");
        }

        const json = await res.json();
        if (!json.hourly || !json.hourly.time || json.hourly.time.length === 0) {
          throw new Error("Open-Meteo telemetry response contained empty sub-surface matrices.");
        }

        const hasData = json.hourly.soil_temperature_0_to_7cm?.some((v: any) => v !== null);
        if (!hasData) {
          throw new Error("No sub-surface soil data available for this location (e.g. urbanized area or outside coverage).");
        }

        if (active) {
          const parsedData = {
            times: json.hourly.time ?? [],
            temp_0_7: json.hourly.soil_temperature_0_to_7cm ?? [],
            temp_7_28: json.hourly.soil_temperature_7_to_28cm ?? [],
            temp_28_100: json.hourly.soil_temperature_28_to_100cm ?? [],
            temp_100_255: json.hourly.soil_temperature_100_to_255cm ?? [],
            moist_0_7: json.hourly.soil_moisture_0_to_7cm ?? [],
            moist_7_28: json.hourly.soil_moisture_7_to_28cm ?? [],
            moist_28_100: json.hourly.soil_moisture_28_to_100cm ?? [],
            moist_100_255: json.hourly.soil_moisture_100_to_255cm ?? [],
          };
          setSoilData(parsedData);
          setCachedTempData(fetchLat, fetchLng, parsedData);
        }
      } catch (err: any) {
        if (active) {
          setSoilData(null);
          setError(err.message || "An unknown telemetry error occurred.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSoilParameters();

    return () => {
      active = false;
    };
  }, [coords]);"""

pattern = re.compile(r"  useEffect\(\(\) => \{\n    if \(\!coords\) return;\n\n    let active = true;\n    \n    const cached = getCachedTempData\(coords\.lat, coords\.lng\).*?\n    \};\n  \}, \[coords\]\);", re.DOTALL)

if pattern.search(content):
    new_content = pattern.sub(new_effect, content)
    with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
        f.write(new_content)
    print("Replaced successfully")
else:
    print("Pattern not found")
