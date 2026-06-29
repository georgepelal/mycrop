const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const endpoints = [
  '/api/marine-hydrodynamics',
  '/api/air-quality-aerosols',
  '/api/openepi-forest-fire',
  '/api/climatology-nasa',
  '/api/openmeteo-river-discharge',
  '/api/openmeteo-agri-soil',
  '/api/openmeteo-historical-archive',
  '/api/sunrise-sunset-astronomy',
  '/api/plant-dictionary-lookup',
  '/api/gbif-local-occurrences',
  '/api/osm-reverse-geocode',
  '/api/client-ip-geolocation',
  '/api/local-public-holidays',
  '/api/regional-country-sovereign',
  '/api/gbif-species-suggest'
];

for (const ep of endpoints) {
  const index = content.indexOf(`app.post("${ep}"`);
  if (index === -1) {
    if (content.indexOf(`app.get("${ep}"`) !== -1) {
        console.log(`${ep}: GET request`);
    } else {
        console.log(`${ep}: missing`);
    }
    continue;
  }
  const slice = content.slice(index, index + 200);
  const match = slice.match(/req\.body[^}]+}/);
  if (match) {
    console.log(`${ep}: ${match[0].split('\n')[0]}`);
  } else {
    const match2 = slice.match(/const \{[^}]+\}.*req\.body/s);
    if(match2) {
       console.log(`${ep}: ${match2[0].replace(/\n/g, ' ')}`);
    } else {
        console.log(`${ep}: unknown params`);
    }
  }
}
