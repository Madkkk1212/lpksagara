import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Manual env parsing
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^"|"$/g, '');
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const email = 'mr1875413@gmail.com';
  
  console.log("Measuring Supabase queries...");

  console.time('profile');
  const profileRes = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
  console.timeEnd('profile');
  
  console.time('categories');
  const categoriesRes = await supabase.from('material_categories').select('*').order('sort_order', { ascending: true });
  console.timeEnd('categories');

  console.time('levels');
  const levelsRes = await supabase.from('study_levels').select('*').order('sort_order', { ascending: true });
  console.timeEnd('levels');

  console.time('progress');
  const progressRes = await supabase.from('user_material_progress').select('material_id, completed_at, created_at').ilike('user_email', email);
  console.timeEnd('progress');

  console.time('weeklyTargets');
  const weeklyTargetsRes = await supabase.from('weekly_targets').select('*').eq('status', 'active');
  console.timeEnd('weeklyTargets');

  console.time('count');
  const countRes = await supabase.from('study_materials').select('id', { count: 'exact', head: true });
  console.timeEnd('count');
}
test();
