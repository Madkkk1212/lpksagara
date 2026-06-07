-- Migration: Fix RLS policies on exam_violations table to allow anonymous student and teacher access
DROP POLICY IF EXISTS "Teachers and admins can read violations" ON exam_violations;
DROP POLICY IF EXISTS "Anyone authenticated can insert violations" ON exam_violations;
DROP POLICY IF EXISTS "Anyone can update violations" ON exam_violations;

DROP POLICY IF EXISTS "Allow read violations for all" ON exam_violations;
DROP POLICY IF EXISTS "Allow insert violations for all" ON exam_violations;
DROP POLICY IF EXISTS "Allow update violations for all" ON exam_violations;

-- Create new policies allowing public access (needed since students & teachers use custom localStorage auth rather than Supabase Auth)
CREATE POLICY "Allow read violations for all" ON exam_violations FOR SELECT USING (true);
CREATE POLICY "Allow insert violations for all" ON exam_violations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update violations for all" ON exam_violations FOR UPDATE USING (true);

-- Drop NOT NULL constraint on student_id to prevent insert failures when ID is not yet resolved
ALTER TABLE exam_violations ALTER COLUMN student_id DROP NOT NULL;
