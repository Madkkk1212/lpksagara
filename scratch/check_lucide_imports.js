const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'teacher', 'components', 'QuizAccessManager.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('lucide-react')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
