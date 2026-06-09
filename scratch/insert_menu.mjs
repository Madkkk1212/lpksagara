import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('admin_menu_config').insert([
    {
      tab_id: 'student-progress',
      label: 'Progres Siswa',
      icon: '📈',
      is_active: true,
      sort_order: 13,
      scope: 'admin'
    }
  ]).select();
  
  if (error) {
    if (error.code === '23505') {
       console.log('Already exists in admin_menu_config');
    } else {
       console.error('Error inserting:', error);
    }
  } else {
    console.log('Inserted:', data);
  }
}

run();
