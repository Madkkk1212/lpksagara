const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') {
    supabaseUrl = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '');
  }
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    supabaseAnonKey = parts.slice(1).join('=').trim().replace(/"/g, '').replace(/'/g, '');
  }
});

console.log('Supabase URL:', supabaseUrl ? '✓ found' : '✗ missing');

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('\n=== 1. Cek tabel assessment_chapter_grades (semua data) ===');
  const { data: grades, error: grErr } = await supabase
    .from('assessment_chapter_grades')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (grErr) {
    console.error('ERROR baca grades:', grErr.message, grErr.code, grErr.details);
  } else {
    console.log('Jumlah baris:', grades.length);
    grades.forEach(g => {
      console.log(`  - ${g.student_email} | "${g.column_label}" | nilai: ${g.value} | template_id: ${g.template_id || 'NULL'}`);
    });
  }

  console.log('\n=== 2. Cek tabel assessment_chapter_templates ===');
  const { data: templates, error: tplErr } = await supabase
    .from('assessment_chapter_templates')
    .select('id, chapter_title, chapter_id, level_id, is_active')
    .order('chapter_title');

  if (tplErr) {
    console.error('ERROR baca templates:', tplErr.message);
  } else {
    console.log('Jumlah template:', templates.length);
    templates.forEach(t => {
      console.log(`  - [${t.is_active ? 'ACTIVE' : 'INACTIVE'}] "${t.chapter_title}" | chapter_id: ${t.chapter_id} | level_id: ${t.level_id}`);
    });
  }

  console.log('\n=== 3. Cek quiz materials yang ada ===');
  const { data: quizzes, error: qErr } = await supabase
    .from('study_materials')
    .select('id, title, material_type, chapter_id, study_chapters(title, level_id, study_levels(level_code))')
    .eq('material_type', 'quiz')
    .limit(20);

  if (qErr) {
    console.error('ERROR baca quizzes:', qErr.message);
  } else {
    console.log('Jumlah quiz:', quizzes.length);
    quizzes.forEach(q => {
      const chap = q.study_chapters;
      const level = chap?.study_levels?.level_code || '?';
      console.log(`  - "${q.title}" | chapter: "${chap?.title}" | level: ${level} | material_id: ${q.id}`);
    });
  }

  console.log('\n=== 4. Test INSERT nilai ke assessment_chapter_grades ===');
  // Ambil template pertama yang ada untuk test
  if (templates && templates.length > 0) {
    const tpl = templates[0];
    const testPayload = {
      student_email: 'test@debug.com',
      template_id: tpl.id,
      level_id: tpl.level_id,
      column_label: `${tpl.chapter_title} ::: DEBUG_TEST`,
      value: '99',
      updated_at: new Date().toISOString()
    };
    console.log('Mencoba insert test row:', testPayload);
    const { data: insertData, error: insertErr } = await supabase
      .from('assessment_chapter_grades')
      .insert(testPayload)
      .select();

    if (insertErr) {
      console.error('INSERT GAGAL:', insertErr.message, insertErr.code, insertErr.details, insertErr.hint);
    } else {
      console.log('INSERT BERHASIL:', insertData);
      // cleanup test row
      if (insertData && insertData[0]) {
        await supabase.from('assessment_chapter_grades').delete().eq('id', insertData[0].id);
        console.log('Test row dihapus.');
      }
    }
  } else {
    console.log('Tidak ada template → skip test insert');
    // Test insert tanpa template (template_id = null)
    const { data: chapters } = await supabase
      .from('study_chapters')
      .select('id, title, level_id')
      .limit(1);
    
    if (chapters && chapters.length > 0) {
      const ch = chapters[0];
      const testPayload = {
        student_email: 'test@debug.com',
        template_id: null,
        level_id: ch.level_id,
        column_label: `${ch.title} ::: DEBUG_TEST`,
        value: '99',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('Mencoba insert tanpa template:', testPayload);
      const { data: insertData, error: insertErr } = await supabase
        .from('assessment_chapter_grades')
        .insert(testPayload)
        .select();

      if (insertErr) {
        console.error('INSERT GAGAL:', insertErr.message, insertErr.code, insertErr.details, insertErr.hint);
      } else {
        console.log('INSERT BERHASIL:', insertData);
        if (insertData && insertData[0]) {
          await supabase.from('assessment_chapter_grades').delete().eq('id', insertData[0].id);
          console.log('Test row dihapus.');
        }
      }
    }
  }
}

run().catch(console.error);
