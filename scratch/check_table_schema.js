const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseAnonKey = '';

envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') {
    supabaseUrl = parts[1].trim().replace(/"/g, '').replace(/'/g, '');
  }
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    supabaseAnonKey = parts[1].trim().replace(/"/g, '').replace(/'/g, '');
  }
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Try inserting a dummy grade to see if it throws an error and why
  console.log('Testing insert on assessment_chapter_grades...');
  const { data, error } = await supabase
    .from('assessment_chapter_grades')
    .insert({
      student_email: 'test_student@gmail.com',
      column_label: 'Bab 1 ::: quiz bab 1',
      value: '100',
      level_id: '960e38a2-dcb1-4091-88f5-9b2f6df4da81', // dummy UUID or similar
      template_id: null
    });

  if (error) {
    console.error('Insert error details:', error);
  } else {
    console.log('Insert succeeded! Return data:', data);
    // Cleanup if succeeded
    await supabase
      .from('assessment_chapter_grades')
      .delete()
      .eq('student_email', 'test_student@gmail.com');
  }
}

run();
