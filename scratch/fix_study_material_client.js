const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'study', 'material', '[id]', 'StudyMaterialClient.tsx');
console.log("Target path:", filePath);

if (!fs.existsSync(filePath)) {
  console.error("File does not exist!");
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Replace the video source line to add the poster attribute (matching without leading spaces)
const oldVideoStr = 'src={materialData.video_url}';
const newVideoStr = 'src={materialData.video_url}\n                  poster={materialData.image_url || undefined}';

if (content.includes(oldVideoStr)) {
  content = content.replace(oldVideoStr, newVideoStr);
  console.log("Successfully updated video player element with poster cover!");
} else {
  console.warn("Could not find video src target to replace.");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done fixing StudyMaterialClient.tsx!");
