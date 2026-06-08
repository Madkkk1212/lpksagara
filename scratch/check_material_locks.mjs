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
  const { data: materials, error } = await supabase
    .from('study_materials')
    .select('id, title, is_locked, material_type');

  if (error) {
    console.error("Error:", error);
    return;
  }

  const locked = materials.filter(m => m.is_locked === true).length;
  const unlocked = materials.filter(m => m.is_locked !== true).length;

  console.log(`Total materials: ${materials.length}`);
  console.log(`Locked (Premium): ${locked}`);
  console.log(`Unlocked (Free): ${unlocked}`);
}

inspect();
