import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const r2PublicUrl = env.CLOUDFLARE_R2_PUBLIC_URL!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("Scanning materials for invalid video URLs starting with 'undefined/'...");
  
  const { data, error } = await supabase
    .from('study_materials')
    .select('id, title, video_url');
    
  if (error) {
    console.error("Error fetching materials:", error);
    return;
  }

  const invalidMaterials = data.filter(m => m.video_url && m.video_url.startsWith('undefined/'));
  
  if (invalidMaterials.length === 0) {
    console.log("No materials with invalid 'undefined/' video URLs found.");
    return;
  }

  console.log(`Found ${invalidMaterials.length} invalid materials. Fixing...`);

  for (const mat of invalidMaterials) {
    const filename = mat.video_url.substring('undefined/'.length);
    const correctedUrl = `${r2PublicUrl}/${filename}`;
    
    console.log(`Fixing "${mat.title}" (${mat.id}):`);
    console.log(`  - Old: ${mat.video_url}`);
    console.log(`  - New: ${correctedUrl}`);

    const { error: updateError } = await supabase
      .from('study_materials')
      .update({ video_url: correctedUrl })
      .eq('id', mat.id);

    if (updateError) {
      console.error(`  - Error updating "${mat.title}":`, updateError);
    } else {
      console.log(`  - Successfully corrected!`);
    }
  }
}

main();
