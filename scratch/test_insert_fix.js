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
  // 1. Ambil template yang ada
  const { data: templates } = await supabase
    .from('assessment_chapter_templates')
    .select('id, chapter_title, chapter_id, level_id')
    .eq('is_active', true)
    .limit(1);

  if (!templates || templates.length === 0) {
    console.log('Tidak ada template aktif, skip test.');
    return;
  }

  const tpl = templates[0];

  // 2. Cek kolom apa saja yang ada di tabel assessment_chapter_grades
  console.log('=== Mengecek kolom tabel assessment_chapter_grades ===');
  const { data: sample, error: sampleErr } = await supabase
    .from('assessment_chapter_grades')
    .select('*')
    .limit(1);
  
  if (sampleErr) {
    console.error('Error akses tabel:', sampleErr.message);
  } else {
    console.log('Tabel accessible. Kolom sample:', sample.length > 0 ? Object.keys(sample[0]) : '(tabel kosong, kolom tidak bisa dideteksi dari query kosong)');
  }

  // 3. Test insert TANPA created_at (sudah fix)
  console.log('\n=== Test INSERT (tanpa created_at) ===');
  const payload = {
    student_email: 'test_fix@debug.com',
    template_id: tpl.id,
    level_id: tpl.level_id,
    column_label: `${tpl.chapter_title} ::: FIX_TEST`,
    value: '77',
    updated_at: new Date().toISOString()
  };
  console.log('Payload:', JSON.stringify(payload, null, 2));

  const { data: inserted, error: insertErr } = await supabase
    .from('assessment_chapter_grades')
    .insert(payload)
    .select();

  if (insertErr) {
    console.error('❌ INSERT GAGAL:', insertErr.message, '| code:', insertErr.code);
  } else {
    console.log('✅ INSERT BERHASIL! Data tersimpan:', inserted);

    // Cleanup
    if (inserted && inserted[0]) {
      await supabase.from('assessment_chapter_grades').delete().eq('id', inserted[0].id);
      console.log('(test row dihapus)');
    }
  }

  // 4. Cek total isi tabel sekarang
  console.log('\n=== Total baris di assessment_chapter_grades ===');
  const { count } = await supabase
    .from('assessment_chapter_grades')
    .select('*', { count: 'exact', head: true });
  console.log('Total rows:', count);
}

run().catch(console.error);
