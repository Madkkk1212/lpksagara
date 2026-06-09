import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

if (!supabaseKey) {
  envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}

// Remove quotes if present
if (supabaseUrl.startsWith('"') || supabaseUrl.startsWith("'")) supabaseUrl = supabaseUrl.slice(1, -1);
if (supabaseKey.startsWith('"') || supabaseKey.startsWith("'")) supabaseKey = supabaseKey.slice(1, -1);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('admin_menu_config').insert([
    {
      tab_id: 'student-progress',
      label: 'Progres Siswa',
      icon: '📈',
      is_active: true,
      sort_order: 13,
      scope: 'admin'
    }
  ]).select();
  
  if (error) {
    if (error.code === '23505') {
       console.log('Already exists in admin_menu_config');
    } else {
       console.error('Error inserting:', error);
    }
  } else {
    console.log('Inserted:', data);
  }
}

run();
