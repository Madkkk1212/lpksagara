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
  data.forEach(row => {
    console.log(`\n=== ROW: ${row.name} ===`);
    for (const key of Object.keys(row)) {
      const val = row[key];
      const len = val ? JSON.stringify(val).length : 0;
      console.log(`  - Column "${key}": size = ${len} chars`);
    }
  });
}
test();
