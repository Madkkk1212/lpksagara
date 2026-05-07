const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const line of env) {
  if (line && line.includes('=')) {
    const parts = line.split('=');
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '');
  }
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fix() {
  const r2PublicUrl = "https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev";
  console.log("Fetching affected study_materials...");
  const { data: mats, error } = await supabase.from('study_materials').select('*');
  if (error) {
    console.error("Error fetching study_materials:", error);
    return;
  }

  const affected = mats.filter(m => {
    const str = JSON.stringify(m);
    return str.includes('undefined/');
  });

  console.log(`Found ${affected.length} affected materials.`);

  for (const m of affected) {
    console.log(`\nFixing Material [${m.id}]: "${m.title}"`);
    
    // Create copy of the data
    const updated = { ...m };

    // Fix video_url
    if (updated.video_url && updated.video_url.includes('undefined/')) {
      updated.video_url = updated.video_url.replace('undefined/', `${r2PublicUrl}/`);
      console.log(`- Updated video_url to: ${updated.video_url}`);
    }

    // Fix image_url
    if (updated.image_url && updated.image_url.includes('undefined/')) {
      updated.image_url = updated.image_url.replace('undefined/', `${r2PublicUrl}/`);
      console.log(`- Updated image_url to: ${updated.image_url}`);
    }

    // Fix content
    if (updated.content) {
      let contentStr = typeof updated.content === 'string' ? updated.content : JSON.stringify(updated.content);
      if (contentStr.includes('undefined/')) {
        contentStr = contentStr.replace(/undefined\//g, `${r2PublicUrl}/`);
        updated.content = JSON.parse(contentStr);
        console.log(`- Updated content fields.`);
      }
    }

    // Save changes back to database
    // We only need to supply the columns we want to update, plus id is ok
    const payload = {
      video_url: updated.video_url,
      image_url: updated.image_url,
      content: updated.content
    };

    const { error: updateError } = await supabase
      .from('study_materials')
      .update(payload)
      .eq('id', m.id);

    if (updateError) {
      console.error(`Gagal update material ${m.id}:`, updateError);
    } else {
      console.log(`✓ Material ${m.id} successfully fixed in Supabase!`);
    }
  }
}

fix().catch(console.error);
