const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages');

const replacements = {
  'MarineHydrodynamics.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'AirQualityAerosols.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'OpenEpiForestFire.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'ClimatologyNasa.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng, startDaysAgo: 30 })',
  },
  'RiverDischarge.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'AgriSoilMoisture.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'HistoricalArchive.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'SunriseSunsetAstronomy.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'PlantDictionaryLookup.tsx': {
     fetchBody: 'JSON.stringify({ cropName: "Wheat" })',
     noCoords: true
  },
  'GbifLocalOccurrences.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'OsmReverseGeocode.tsx': {
     fetchBody: 'JSON.stringify({ lat: coords.lat, lng: coords.lng })',
  },
  'ClientIpGeolocation.tsx': {
     // GET request handled as is
  },
  'LocalPublicHolidays.tsx': {
     fetchBody: 'JSON.stringify({ countryCode: "US", year: new Date().getFullYear() })',
     noCoords: true
  },
  'RegionalCountrySovereign.tsx': {
     fetchBody: 'JSON.stringify({ countryCode: "US" })',
     noCoords: true
  },
  'GbifSpeciesSuggest.tsx': {
     fetchBody: 'JSON.stringify({ query: "Panthera" })',
     noCoords: true
  }
};

Object.entries(replacements).forEach(([file, data]) => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (data.fetchBody) {
    content = content.replace(
      /body: JSON\.stringify\(\{ latitude: coords\.lat, longitude: coords\.lng \}\)/,
      `body: ${data.fetchBody}`
    );
  }
  
  if (data.noCoords) {
    // remove the Current Coordinates UI section
    content = content.replace(/<div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">([\s\S]*?)<\/div>/, '');
  }
  
  fs.writeFileSync(filePath, content);
});

console.log("Pages patched");
