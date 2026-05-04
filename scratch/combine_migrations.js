const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const outputFile = path.join(__dirname, '..', 'reiwasupabase.sql');

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.startsWith('0'))
  .sort();

let combinedSql = `-- BACKUP SUPABASE - REIWA SUPABASE\n-- Generated on ${new Date().toISOString()}\n\n`;

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  combinedSql += `-- ==========================================\n`;
  combinedSql += `-- MIGRATION: ${file}\n`;
  combinedSql += `-- ==========================================\n\n`;
  combinedSql += content;
  combinedSql += `\n\n`;
});

fs.writeFileSync(outputFile, combinedSql);
console.log(`Successfully created ${outputFile}`);
