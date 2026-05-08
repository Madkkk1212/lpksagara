const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '', supabaseAnonKey = '';
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = parts.slice(1).join('=').trim().replace(/["']/g, '');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = parts.slice(1).join('=').trim().replace(/["']/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data } = await supabase.from('assessment_chapter_templates').select('id, level_id, chapter_title, columns');
  data.forEach(t => {
    console.log('\n--- Template:', t.chapter_title, '---');
    t.columns.forEach(c => console.log('  ', c.label));
  });
}
run();
