import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
  console.log("Measuring categories query optimization...");

  console.time('categories with icon_url');
  const res1 = await supabase.from('material_categories').select('*').order('sort_order', { ascending: true });
  console.timeEnd('categories with icon_url');
  console.log(`With icon_url: retrieved ${res1.data?.length} rows, size: ${JSON.stringify(res1.data).length} chars`);

  console.time('categories without icon_url');
  const res2 = await supabase.from('material_categories')
    .select('id, name, description, badge_color, sort_order, created_at, updated_at, custom_type_names, is_active')
    .order('sort_order', { ascending: true });
  console.timeEnd('categories without icon_url');
  console.log(`Without icon_url: retrieved ${res2.data?.length} rows, size: ${JSON.stringify(res2.data).length} chars`);
}
test();
