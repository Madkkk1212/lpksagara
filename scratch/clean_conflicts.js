const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const allFiles = walk(root);

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('HEAD')) {
    console.log(`Cleaning ${file}...`);
    const lines = content.split(/\r?\n/);
    const newLines = [];
    let skipping = false;
    
    for (const line of lines) {
      if (line.startsWith('HEAD')) {
        // Keep going, we want HEAD content
        continue;
      }
      if (line.startsWith('=======')) {
        skipping = true;
        continue;
      }
      if (line.startsWith('')) {
        skipping = false;
        continue;
      }
      
      if (!skipping) {
        newLines.push(line);
      }
    }
    
    const newContent = newLines.join('\n');
    fs.writeFileSync(file, newContent);
    console.log(`Cleaned ${file}`);
  }
});
