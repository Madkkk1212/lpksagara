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
  const email = 'mr1875413@gmail.com';
  const { data: progress, error } = await supabase
    .from('user_material_progress')
    .select('material_id')
    .ilike('user_email', email);

  if (error) {
    console.error("Error fetching progress:", error);
    return;
  }

  console.log("Total completed materials for student:", progress.length);
}

run();
