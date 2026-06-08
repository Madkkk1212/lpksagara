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
  const { data: study } = await supabase.from('study_levels').select('id, level_code, title');
  const { data: exam } = await supabase.from('exam_levels').select('id, level_code, title');

  console.log("=== STUDY LEVELS ===");
  study?.forEach(l => {
    console.log(`- Code: ${l.level_code}, ID: ${l.id}, Title: ${l.title}`);
  });

  console.log("\n=== EXAM LEVELS ===");
  exam?.forEach(l => {
    console.log(`- Code: ${l.level_code}, ID: ${l.id}, Title: ${l.title}`);
  });
}

inspect();
