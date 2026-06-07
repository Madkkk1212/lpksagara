import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('material_categories').select('*').limit(1);
  let output = '';
  if (error) {
    output = 'Error: ' + JSON.stringify(error, null, 2);
  } else {
    output = 'Columns: ' + JSON.stringify(Object.keys(data[0] || {})) + '\n\n' +
             'Row details: ' + JSON.stringify(data[0] || {}, null, 2);
  }
  fs.writeFileSync('scratch/schema_output.txt', output);
  console.log('Done writing schema_output.txt');
}

run();
