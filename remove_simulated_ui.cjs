const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let changed = 0;

for (const file of pages) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to remove the block:
  // {!data.isLiveXYZ && ( ... )}
  // Since it can span multiple lines, we need a robust replacement
  // Actually, wait, it's easier to just match `{!\w*\.?isLive\w+ && \([\s\S]*?\)}`? No, nested parentheses might mess it up.
  // We can just match the span itself and the conditional wrapper.
  
  const regex = /\{!.*?isLive.*?\&\&\s*\(\s*<[^>]+>\s*(<[^>]+><\/[^>]+>\s*)*[^<]*\(?Simulated Data\)?.*\s*<\/[^>]+>\s*\)\}/gi;
  const regex2 = /\{!.*?isLive.*?\&\&\s*\(\s*<span.*?>[\s\S]*?<\/span>\s*\)\}/gi;
  const regex3 = /\{!.*?isLive.*?\&\&\s*\(\s*<div.*?>[\s\S]*?<\/div>\s*\)\}/gi;
  
  let originalContent = content;
  content = content.replace(regex2, '');
  content = content.replace(regex3, '');
  
  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, 'utf-8');
    changed++;
    console.log(`Removed simulated warning from ${file}`);
  }
}

console.log(`Updated ${changed} files.`);
