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
  const { data, error } = await supabase
    .from('quiz_access_controls')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching quiz_access_controls:', error);
  } else {
    console.log('Sample row from quiz_access_controls:', data[0]);
  }
}

run();
