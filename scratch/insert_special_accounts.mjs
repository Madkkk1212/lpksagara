import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Inserting accounts...');

  const studentAccount = {
    email: 'siswa.super@lpksagara.com',
    full_name: 'Siswa Super',
    gender: 'Laki-laki',
    phone: '081234567890',
    password: 'PasswordSiswa123',
    is_admin: false,
    is_teacher: false,
    is_student: true,
    is_premium: false,
    profile_completed: true,
    exp: 0,
    level: 1,
    nip: 'S-SUPER-001'
  };

  const teacherAccount = {
    email: 'guru.super@lpksagara.com',
    full_name: 'Guru Super',
    gender: 'Perempuan',
    phone: '081234567891',
    password: 'PasswordGuru123',
    is_admin: false,
    is_teacher: true,
    is_student: false,
    is_premium: false,
    profile_completed: true,
    exp: 0,
    level: 1,
    nip: 'G-SUPER-001'
  };

  // Insert Student
  const { data: sData, error: sErr } = await supabase
    .from('profiles')
    .upsert(studentAccount, { onConflict: 'email' })
    .select();

  if (sErr) {
    console.error('Error upserting student:', sErr);
  } else {
    console.log('Upserted student successfully:', sData[0]?.email);
  }

  // Insert Teacher
  const { data: tData, error: tErr } = await supabase
    .from('profiles')
    .upsert(teacherAccount, { onConflict: 'email' })
    .select();

  if (tErr) {
    console.error('Error upserting teacher:', tErr);
  } else {
    console.log('Upserted teacher successfully:', tData[0]?.email);
  }

  console.log('Done.');
}

run();
