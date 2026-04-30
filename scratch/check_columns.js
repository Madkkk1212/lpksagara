const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumns() {
  const { data, error } = await supabase.from('study_materials').select('*').limit(1);
  if (error) {
    console.error(error);
    return;
  }
  console.log("Columns in study_materials:", Object.keys(data[0] || {}));
}

checkColumns();
