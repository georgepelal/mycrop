const fs = require('fs');
const path = require('path');

const serverContent = fs.readFileSync('server.ts', 'utf8');
const regex = /app\.\w+\("(\/api\/[a-zA-Z0-9_-]+)"/g;
let match;
const apis = [];
while ((match = regex.exec(serverContent)) !== null) {
  apis.push(match[1]);
}

const pagesDir = path.join(__dirname, 'src', 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

const unusedApis = [];
for (const api of apis) {
  let found = false;
  for (const page of pages) {
    const pageContent = fs.readFileSync(path.join(pagesDir, page), 'utf8');
    if (pageContent.includes(api)) {
      found = true;
      break;
    }
  }
  if (!found) {
    unusedApis.push(api);
  }
}

console.log("Unused APIs or APIs without individual usage:", unusedApis);
