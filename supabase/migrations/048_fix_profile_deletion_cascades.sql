-- 1. Fix quiz_access_controls
ALTER TABLE quiz_access_controls 
DROP CONSTRAINT IF EXISTS quiz_access_controls_student_id_fkey,
ADD CONSTRAINT quiz_access_controls_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE quiz_access_controls 
DROP CONSTRAINT IF EXISTS quiz_access_controls_teacher_id_fkey,
ADD CONSTRAINT quiz_access_controls_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 2. Fix exam_access_controls
ALTER TABLE exam_access_controls 
DROP CONSTRAINT IF EXISTS exam_access_controls_student_id_fkey,
ADD CONSTRAINT exam_access_controls_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE exam_access_controls 
DROP CONSTRAINT IF EXISTS exam_access_controls_teacher_id_fkey,
ADD CONSTRAINT exam_access_controls_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 3. Fix teacher_students
ALTER TABLE teacher_students 
DROP CONSTRAINT IF EXISTS teacher_students_teacher_id_fkey,
ADD CONSTRAINT teacher_students_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE teacher_students 
DROP CONSTRAINT IF EXISTS teacher_students_student_id_fkey,
ADD CONSTRAINT teacher_students_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 4. Fix weekly_targets
ALTER TABLE weekly_targets 
DROP CONSTRAINT IF EXISTS weekly_targets_teacher_id_fkey,
ADD CONSTRAINT weekly_targets_teacher_id_fkey 
  FOREIGN KEY (teacher_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE weekly_targets 
DROP CONSTRAINT IF EXISTS weekly_targets_student_id_fkey,
ADD CONSTRAINT weekly_targets_student_id_fkey 
  FOREIGN KEY (student_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;
