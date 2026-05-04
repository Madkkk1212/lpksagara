const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const line of env) {
  if (line && line.includes('=')) {
    const parts = line.split('=');
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
  }
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('materials').select('id, title, description, category_id, sort_order').order('sort_order', { ascending: true });
  console.log("materials error:", error);
  const { data: d2, error: e2 } = await supabase.from('study_materials').select('id, title, material_type, chapter_id, sort_order, is_locked, icon_url').order('sort_order', { ascending: true });
  console.log("study_materials error:", e2);
  const { data: d3, error: e3 } = await supabase.from('materials').select('id, title, category_id, sort_order').order('sort_order', { ascending: true });
  console.log("materials (no desc) error:", e3);
}

check().catch(console.error);
