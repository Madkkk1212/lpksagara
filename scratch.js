const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const line of env) {
  if (line && line.includes('=')) {
    const parts = line.split('=');
    process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
  }
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Mock db.ts function WITHOUT document_url
async function getBasicStudyMaterials(chapterId) {
  let query = supabase.from('study_materials').select('id, title, chapter_id, material_type, is_locked, sort_order, icon_url, video_url, image_url');
  if (chapterId) query = query.eq('chapter_id', chapterId);
  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) {
    console.error("Error in getBasicStudyMaterials:", error);
    return [];
  }
  return data;
}

async function check() {
  const allMaterials = await getBasicStudyMaterials();
  console.log(`Total materials returned by getBasicStudyMaterials (fixed): ${allMaterials.length}`);
  const quizMaterials = allMaterials.filter(m => m.material_type === 'quiz');
  console.log(`Quiz materials count: ${quizMaterials.length}`);
  console.log("Quiz materials:", quizMaterials);
}

check().catch(console.error);
