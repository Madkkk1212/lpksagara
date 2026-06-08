import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env parsing
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data: levels, error } = await supabase
    .from('exam_levels')
    .select('id, level_code, title, is_locked');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("=== EXAM LEVELS ===");
  levels.forEach(l => {
    console.log(`- Code: ${l.level_code}, Title: ${l.title}, Is Locked (Premium): ${l.is_locked}`);
  });
}

inspect();
