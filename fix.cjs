const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages');
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('context/AuthContext')) {
      fs.writeFileSync(filePath, content.replace(/context\/AuthContext/g, 'contexts/AuthContext'));
    }
  }
});
console.log('Fixed imports');
