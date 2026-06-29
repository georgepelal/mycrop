const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files that don't have coords state
  if (!content.includes('const [coords, setCoords] = useState')) continue;

  // Add import if missing
  if (!content.includes('LocationMapPicker')) {
    content = content.replace(
      'import { useAuth } from "../contexts/AuthContext";',
      'import { useAuth } from "../contexts/AuthContext";\nimport LocationMapPicker from "../components/LocationMapPicker";'
    );
  }

  // Replace Current Coordinates section
  const coordsSection = /<div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">([\s\S]*?)<\/div>/;
  
  if (coordsSection.test(content)) {
    content = content.replace(
      coordsSection,
      `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPinIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Current Coordinates</h3>
              <p className="text-xs font-medium text-slate-500">Live Observation Point</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latitude</p>
              <p className="text-sm font-mono font-bold text-slate-700">{coords.lat.toFixed(4)}°</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Longitude</p>
              <p className="text-sm font-mono font-bold text-slate-700">{coords.lng.toFixed(4)}°</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <LocationMapPicker 
            lat={coords.lat} 
            lng={coords.lng} 
            onChange={(lat, lng) => setCoords({ lat, lng })}
            height="180px"
          />
        </div>
      </div>`
    );
    fs.writeFileSync(filePath, content);
  }
}

console.log("Map added to coordinate pages");
