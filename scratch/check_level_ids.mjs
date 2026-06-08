import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    val = val.trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: levels, error } = await supabase
    .from('study_levels')
    .select('id, title, level_code');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("=== Levels in DB ===");
  levels.forEach(l => {
    console.log(`ID: ${l.id} | Code: ${l.level_code} | Title: ${l.title}`);
  });
}

run();
