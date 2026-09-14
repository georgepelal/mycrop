import re

with open("src/pages/DeepSoilTemperature.tsx", "r") as f:
    content = f.read()

# Add ReferenceLine import
content = content.replace("  CartesianGrid,\n  Legend\n} from \"recharts\";", "  CartesianGrid,\n  Legend,\n  ReferenceLine\n} from \"recharts\";")

# Add ReferenceLine to chart
yaxis = """                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                          label={{ value: `Temp (°${tempUnit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#64748b' } }}
                        />"""

reference_line = """                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="#94a3b8"
                          label={{ value: `Temp (°${tempUnit})`, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 10, fill: '#64748b' } }}
                        />
                        <ReferenceLine y={tempUnit === "C" ? 0 : 32} stroke="#3b82f6" strokeDasharray="3 3" strokeOpacity={0.5} label={{ position: 'insideTopLeft', value: `Freezing point (${tempUnit === "C" ? "0°C" : "32°F"})`, fill: '#3b82f6', fontSize: 9, opacity: 0.8 }} />"""

content = content.replace(yaxis, reference_line)

with open("src/pages/DeepSoilTemperature.tsx", "w") as f:
    f.write(content)
print("done")
