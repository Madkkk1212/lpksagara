const fs = require('fs');
const path = require('path');

const filesToFix = [
  'package.json',
  'src/lib/types.ts',
  'src/lib/GamificationUtils.ts',
  'src/lib/db.ts',
  'src/app/components/MediaUploader.tsx',
  'src/app/teacher/TeacherClient.tsx',
  'src/app/register/RegisterClient.tsx',
  'src/app/page.tsx',
  'src/app/login/LoginClient.tsx',
  'src/app/learning/page.tsx',
  'src/app/learning/LearningSystem.tsx',
  'src/app/learning/components/ProfileView.tsx',
  'src/app/learning/components/DashboardView.tsx',
  'src/app/layout.tsx',
  'src/app/admin/AdminClient.tsx',
  'src/app/admin/components/UserManager.tsx',
  'src/app/admin/components/StudyHierarchyManager.tsx',
  'src/app/admin/components/SettingsPanel.tsx',
  'src/app/admin/components/ReportManager.tsx',
  'src/app/admin/components/MenuManager.tsx'
];

const root = process.argv[2] || '.';

filesToFix.forEach(file => {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Simple regex to find conflict markers and take the HEAD version
  // This looks for:
  // HEAD
  // [OUR CONTENT]
  // =======
  // [THEIR CONTENT]
  // [HASH]
  
  const regex = / HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n.*\r?\n/g;
  
  const newContent = content.replace(regex, (match, headContent, theirContent) => {
    console.log(`Resolving conflict in ${file}: favoring HEAD`);
    return headContent + '\n';
  });

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`No conflict markers found in ${file} with the regex`);
  }
});
