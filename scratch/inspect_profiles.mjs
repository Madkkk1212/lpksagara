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
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('email, full_name, is_student, is_premium, unlocked_levels, profile_completed');

  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  console.log("=== INSPECTING PROFILES ===");
  console.log(`Total profiles found: ${profiles.length}`);
  console.log("--------------------------------------------------");
  profiles.forEach(p => {
    console.log(`Email: ${p.email}`);
    console.log(`  Name: ${p.full_name}`);
    console.log(`  Is Student: ${p.is_student}`);
    console.log(`  Is Premium: ${p.is_premium}`);
    console.log(`  Unlocked Levels: ${JSON.stringify(p.unlocked_levels)}`);
    console.log(`  Onboarding Completed: ${p.profile_completed}`);
    console.log("--------------------------------------------------");
  });
}

inspect();
