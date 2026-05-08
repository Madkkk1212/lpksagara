const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'teacher', 'components', 'QuizAccessManager.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('✓ Buka Akses')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
    // Print 5 lines before and after
    for (let i = Math.max(0, idx - 5); i <= Math.min(lines.length - 1, idx + 10); i++) {
      console.log(`[L${i+1}] ${lines[i]}`);
    }
  }
});
