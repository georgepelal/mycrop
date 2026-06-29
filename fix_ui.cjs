const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages');

const files = [
  'PlantDictionaryLookup.tsx',
  'LocalPublicHolidays.tsx',
  'RegionalCountrySovereign.tsx',
  'GbifSpeciesSuggest.tsx'
];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /<div className="flex-1">\s*<h3 className="text-sm font-bold text-slate-800">Current Coordinates<\/h3>\s*<p className="text-xs font-medium text-slate-500">Latitude: \{coords\.lat\.toFixed\(4\)\}, Longitude: \{coords\.lng\.toFixed\(4\)\}<\/p>\s*<\/div>\s*<\/div>/,
    ''
  );
  fs.writeFileSync(filePath, content);
}
console.log("Fixed");
