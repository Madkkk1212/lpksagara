const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssessments() {
  const { data, error } = await supabase
    .from('user_manual_assessments')
    .select('*')
    .limit(10);
  
  if (error) {
    console.error(error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

checkAssessments();
