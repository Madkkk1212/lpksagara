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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  const { data: categories, error: catErr } = await supabase.from('material_categories').select('*');
  const { data: levels, error: lvlErr } = await supabase.from('study_levels').select('*');
  const { data: chapters, error: chapErr } = await supabase.from('study_chapters').select('*');

  console.log("=== MATERIAL CATEGORIES ===");
  categories?.forEach(c => {
    console.log(`- ID: ${c.id}, Name: ${c.name}, Active: ${c.is_active}`);
  });

  console.log("\n=== STUDY LEVELS ===");
  levels?.forEach(l => {
    console.log(`- ID: ${l.id}, Code: ${l.level_code}, Title: ${l.title}, Category ID: ${l.category_id}`);
  });

  console.log(`\nTotal chapters: ${chapters?.length || 0}`);
}

inspect();
