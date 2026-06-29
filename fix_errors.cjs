const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let changed = 0;
for (const file of pages) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to match the typical response check
  // if (!response.ok) {\n  throw new Error("...");\n}
  const regex = /if \(!?(\w+)\.ok\) \{\s*throw new Error\("([^"]+)"\);\s*\}/g;

  if (regex.test(content)) {
    content = content.replace(regex, (match, paramName, errorMsg) => {
      // Avoid modifying if errData is already there
      if (match.includes('errData')) return match; 
      return `if (!${paramName}.ok) {\n        const errData = await ${paramName}.json().catch(() => ({}));\n        throw new Error(errData.error || "${errorMsg}");\n      }`;
    });
    fs.writeFileSync(filePath, content, 'utf-8');
    changed++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${changed} files.`);
