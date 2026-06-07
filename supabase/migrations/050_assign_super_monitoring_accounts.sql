-- Migration: Assign siswa.super ke guru.super untuk keperluan monitoring
-- Kedua akun ini hanya untuk keperluan pengawasan, tidak bisa dilihat admin biasa

-- 1. Pastikan kedua akun ada di profiles
INSERT INTO profiles (id, email, full_name, is_admin, is_super_admin, is_teacher, is_student, is_premium)
VALUES 
  (gen_random_uuid(), 'siswa.super@lpksagara.com', 'Siswa Monitoring', false, false, false, true, true),
  (gen_random_uuid(), 'guru.super@lpksagara.com',  'Guru Monitoring',  false, false, true,  false, false)
ON CONFLICT (email) DO UPDATE SET
  full_name   = EXCLUDED.full_name,
  is_teacher  = EXCLUDED.is_teacher,
  is_student  = EXCLUDED.is_student,
  is_premium  = EXCLUDED.is_premium;

-- 2. Assign siswa.super ke guru.super di teacher_students
INSERT INTO teacher_students (teacher_id, student_id)
SELECT 
  t.id AS teacher_id,
  s.id AS student_id
FROM 
  profiles t,
  profiles s
WHERE 
  t.email = 'guru.super@lpksagara.com'
  AND s.email = 'siswa.super@lpksagara.com'
ON CONFLICT DO NOTHING;
