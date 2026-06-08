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
  console.log("Checking for large base64/text fields in tables...");

  // 1. material_categories
  const { data: cats } = await supabase.from('material_categories').select('*');
  console.log("\n--- Material Categories icon_url lengths ---");
  cats?.forEach(c => {
    console.log(`Category: ${c.name}, icon_url length: ${c.icon_url?.length || 0}`);
  });

  // 2. study_levels
  const { data: lvls } = await supabase.from('study_levels').select('*');
  console.log("\n--- Study Levels icon_url lengths ---");
  lvls?.forEach(l => {
    console.log(`Level: ${l.title}, icon_url length: ${l.icon_url?.length || 0}`);
  });

  // 3. study_materials
  const { data: mats } = await supabase.from('study_materials').select('id, title, icon_url, image_url, video_url, audio_url');
  console.log("\n--- Study Materials field lengths ---");
  let totalIconLen = 0, totalImageLen = 0, totalVideoLen = 0, totalAudioLen = 0;
  let maxIcon = { title: '', len: 0 }, maxImage = { title: '', len: 0 };
  
  mats?.forEach(m => {
    const iconLen = m.icon_url?.length || 0;
    const imgLen = m.image_url?.length || 0;
    const vidLen = m.video_url?.length || 0;
    const audLen = m.audio_url?.length || 0;
    totalIconLen += iconLen;
    totalImageLen += imgLen;
    totalVideoLen += vidLen;
    totalAudioLen += audLen;
    if (iconLen > maxIcon.len) maxIcon = { title: m.title, len: iconLen };
    if (imgLen > maxImage.len) maxImage = { title: m.title, len: imgLen };
  });

  console.log(`Total Materials Checked: ${mats?.length || 0}`);
  console.log(`Total icon_url length sum: ${totalIconLen}`);
  console.log(`Max icon_url length: ${maxIcon.len} ("${maxIcon.title}")`);
  console.log(`Total image_url length sum: ${totalImageLen}`);
  console.log(`Max image_url length: ${maxImage.len} ("${maxImage.title}")`);
  console.log(`Total video_url length sum: ${totalVideoLen}`);
  console.log(`Total audio_url length sum: ${totalAudioLen}`);
}

run();
