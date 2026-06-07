-- Migration: Create exam_violations table for real-time exam monitoring
CREATE TABLE IF NOT EXISTS exam_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  student_email TEXT NOT NULL,
  test_id TEXT,
  test_title TEXT,
  violation_type TEXT NOT NULL DEFAULT 'tab_switch', -- 'tab_switch', 'screenshot', 'blur', 'keyboard', 'page_hide'
  violation_count INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE, -- TRUE = student currently in exam
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_exam_violations_student_email ON exam_violations(student_email);
CREATE INDEX IF NOT EXISTS idx_exam_violations_test_id ON exam_violations(test_id);
CREATE INDEX IF NOT EXISTS idx_exam_violations_is_active ON exam_violations(is_active);
CREATE INDEX IF NOT EXISTS idx_exam_violations_updated_at ON exam_violations(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE exam_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers and admins can view all violations
CREATE POLICY "Teachers and admins can read violations" ON exam_violations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = auth.uid()::text
      AND (profiles.is_teacher = true OR profiles.is_admin = true)
    )
  );

-- Policy: System/students can insert violations (via service role or student auth)
CREATE POLICY "Anyone authenticated can insert violations" ON exam_violations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Anyone authenticated can update their own violations
CREATE POLICY "Anyone can update violations" ON exam_violations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE exam_violations;
