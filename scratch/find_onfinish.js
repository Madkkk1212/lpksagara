const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'components', 'ModernQuizPlayer.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('onFinish') || line.includes('Finish') || line.includes('submit')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
