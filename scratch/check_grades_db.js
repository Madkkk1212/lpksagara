const fs = require('fs');
const path = require('path');

// Read supabase keys from .env.local
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
  const { data, error } = await supabase
    .from('assessment_chapter_grades')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching grades:', error);
  } else {
    console.log('Total grades fetched:', data.length);
    data.forEach(g => {
      console.log(`Email: ${g.student_email} | Label: ${g.column_label} | Val: ${g.value} | Temp: ${g.template_id} | Upd: ${g.updated_at}`);
    });
  }
}

run();
