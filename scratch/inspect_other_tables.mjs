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
  console.log("Inspecting study_levels...");
  const { data: levels, error: lvlErr } = await supabase.from('study_levels').select('*');
  if (lvlErr) console.error(lvlErr);
  else {
    console.log(`Total levels: ${levels.length}`);
    levels.forEach(l => {
      const len = JSON.stringify(l).length;
      if (len > 5000) {
        console.log(`Level "${l.title}" (ID: ${l.id}) is large: ${len} chars`);
        for (const k of Object.keys(l)) {
          const v = l[k];
          const kLen = v ? JSON.stringify(v).length : 0;
          if (kLen > 1000) console.log(`  - Column "${k}": ${kLen} chars`);
        }
      }
    });
  }

  console.log("\nInspecting study_chapters...");
  const { data: chapters, error: chapErr } = await supabase.from('study_chapters').select('*');
  if (chapErr) console.error(chapErr);
  else {
    console.log(`Total chapters: ${chapters.length}`);
    chapters.forEach(c => {
      const len = JSON.stringify(c).length;
      if (len > 5000) {
        console.log(`Chapter "${c.title}" (ID: ${c.id}) is large: ${len} chars`);
        for (const k of Object.keys(c)) {
          const v = c[k];
          const kLen = v ? JSON.stringify(v).length : 0;
          if (kLen > 1000) console.log(`  - Column "${k}": ${kLen} chars`);
        }
      }
    });
  }
}
test();
