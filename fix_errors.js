import * as fs from 'fs';
import * as path from 'path';

const pagesDir = path.join(__dirname, 'src', 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let changed = 0;
for (const file of pages) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to match the typical response check
  // if (!response.ok) {\n  throw new Error("...");\n}
  const regex = /if \(!response\.ok\) \{\s*throw new Error\("([^"]+)"\);\s*\}/g;

  if (regex.test(content)) {
    content = content.replace(regex, (match, errorMsg) => {
      if (match.includes('errData')) return match; // already modified
      return `if (!response.ok) {\n        const errData = await response.json().catch(() => ({}));\n        throw new Error(errData.error || "${errorMsg}");\n      }`;
    });
    fs.writeFileSync(filePath, content, 'utf-8');
    changed++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Updated ${changed} files.`);
