-- Migration: Insert hidden accounts for super admin
-- These accounts will be hidden from regular admins in the UI.

INSERT INTO profiles (id, email, full_name, is_admin, is_super_admin, is_teacher, is_premium)
VALUES 
  (gen_random_uuid(), 'siswa.khusus@lpksagara.com', 'Siswa Khusus', false, false, false, true),
  (gen_random_uuid(), 'guru.khusus@lpksagara.com', 'Guru Khusus', false, false, true, false)
ON CONFLICT (email) DO NOTHING;
