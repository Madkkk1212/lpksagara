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
  const email = 'mr1875413@gmail.com';
  
  // Set unlocked_levels to exclude N4 (758dec75-f11b-4210-9ade-a1bbf7c774e4) and N3 (a50deab1-7b30-46ef-87da-7ec4705f43d3)
  const { data, error } = await supabase
    .from('profiles')
    .update({
      unlocked_levels: [
        '2a953468-ef3c-4a41-8aff-8c806be3a16a', // Keep N5 (although it unlocks automatically as index 0)
        '3d103d37-a1b4-4dfd-9abc-4d5824c2df62', // Keep H&K
        '58d0e7e9-1a54-4f70-9818-eea4d7d5f98b', // Keep New Level
        '54cd3d8b-eecb-4004-940f-7c78186df287'  // Keep Kanji
      ]
    })
    .eq('email', email)
    .select();

  if (error) {
    console.error("Error updating profile:", error);
    return;
  }

  console.log("Profile updated successfully!");
  console.log("New unlocked_levels:", data[0]?.unlocked_levels);
}

run();
