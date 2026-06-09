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
  const { data, error } = await supabase
    .from('admin_menu_config')
    .select('*')
    .order('scope', { ascending: true })
    .order('sort_order', { ascending: true });
    
  if (error) {
    console.error('Error fetching admin_menu_config:', error);
  } else {
    console.log('admin_menu_config contains count:', data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
