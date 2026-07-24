const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'node_modules', 'corpora-project', 'data');
const result = [];

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.json')) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        // Find arrays in the json
        for (const [key, val] of Object.entries(content)) {
          if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
            if (val.length >= 30) {
              result.push({ name: key.replace(/_/g, ' '), words: val });
            }
          } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
            // some have array of objects, e.g. {name: "foo"}
            const names = val.map(v => v.name || v.title || v.word).filter(Boolean);
            if (names.length >= 30) {
              result.push({ name: key.replace(/_/g, ' '), words: names });
            }
          }
        }
      } catch (e) {}
    }
  }
}

walkDir(dataPath);
console.log('Total categories found:', result.length);
fs.writeFileSync('corpora_parsed.json', JSON.stringify(result, null, 2));
