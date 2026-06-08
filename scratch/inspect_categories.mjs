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
  const { data, error } = await supabase.from('material_categories').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log(`Total rows in material_categories: ${data.length}`);
  data.forEach(row => {
    const serialized = JSON.stringify(row);
    console.log(`ID: ${row.id}, Name: ${row.name}, Length of JSON representation: ${serialized.length} characters`);
    console.log(Object.keys(row));
  });
}
test();
