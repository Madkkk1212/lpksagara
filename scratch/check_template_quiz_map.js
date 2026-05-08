const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
let supabaseUrl = '', supabaseAnonKey = '';
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = parts.slice(1).join('=').trim().replace(/["']/g, '');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = parts.slice(1).join('=').trim().replace(/["']/g, '');
});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Cek chapter_id yang ada di template vs chapter_id yang ada di quiz
  const { data: templates } = await supabase
    .from('assessment_chapter_templates')
    .select('id, chapter_title, chapter_id, level_id, columns')
    .eq('is_active', true);

  const { data: quizzes } = await supabase
    .from('study_materials')
    .select('id, title, chapter_id, study_chapters(id, title, level_id)')
    .eq('material_type', 'quiz');

  console.log('\n=== Mapping Template → Quiz ===');
  templates.forEach(t => {
    const matchingQuizzes = quizzes.filter(q => q.chapter_id === t.chapter_id);
    const cols = t.columns || [];
    
    console.log(`\nTemplate: "${t.chapter_title}" (chapter_id: ${t.chapter_id})`);
    if (matchingQuizzes.length === 0) {
      console.log('  ⚠️  Tidak ada quiz di chapter ini → Murid tidak bisa mengerjakan quiz yang terhubung ke template ini!');
    } else {
      matchingQuizzes.forEach(q => {
        const chapterTitle = q.study_chapters?.title || '?';
        const expectedLabel = `${chapterTitle} ::: ${q.title}`;
        const colExists = cols.some(c => c.label === expectedLabel);
        console.log(`  Quiz: "${q.title}" | chapter.title dari DB: "${chapterTitle}"`);
        console.log(`  column_label yang akan disimpan: "${expectedLabel}"`);
        console.log(`  Ada di kolom template: ${colExists ? '✅ YA' : '❌ TIDAK — nilai tidak akan muncul!'}`);
        if (!colExists) {
          console.log(`  Kolom yang ada di template:`, cols.map(c => c.label));
        }
      });
    }
  });

  console.log('\n=== Quiz yang TIDAK punya template di chapter-nya ===');
  quizzes.forEach(q => {
    const chapterTitle = q.study_chapters?.title;
    const hasTemplate = templates.some(t => t.chapter_id === q.chapter_id);
    if (!hasTemplate) {
      console.log(`  ❌ "${q.title}" di chapter "${chapterTitle}" — tidak ada template → nilai tidak akan muncul`);
    }
  });
}

run().catch(console.error);
