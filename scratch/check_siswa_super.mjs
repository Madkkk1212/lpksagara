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
  const email = 'siswa.super@lpksagara.com';
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return;
  }

  console.log("=== Profile Details ===");
  console.log("ID:", profile.id);
  console.log("Email:", profile.email);
  console.log("Full Name:", profile.full_name);
  console.log("is_admin:", profile.is_admin);
  console.log("is_super_admin:", profile.is_super_admin);
  console.log("is_teacher:", profile.is_teacher);
  console.log("is_student:", profile.is_student);
  console.log("is_premium:", profile.is_premium);
  console.log("unlocked_levels:", profile.unlocked_levels);
  console.log("category_id:", profile.category_id);
}

run();
