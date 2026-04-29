-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 016
-- EXP System & Progress Tracking
-- ============================================================

-- 1. Update profiles with EXP and Tracking columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS exp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS target_level text DEFAULT 'N5',
ADD COLUMN IF NOT EXISTS last_material_id uuid REFERENCES study_materials(id),
ADD COLUMN IF NOT EXISTS last_test_id uuid REFERENCES exam_tests(id);

-- 2. Create Exam Results table
CREATE TABLE IF NOT EXISTS user_exam_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  test_id uuid REFERENCES exam_tests(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  is_passed boolean DEFAULT false,
  exp_gained integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. EXP Logs (Optional but good for auditing)
CREATE TABLE IF NOT EXISTS user_exp_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  activity_type text NOT NULL, -- 'material', 'test', 'target'
  activity_id uuid,
  exp_amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for new tables (Demo mode)
ALTER TABLE user_exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exp_logs DISABLE ROW LEVEL SECURITY;

-- 4. Initial seed for leaderboard simulation (if needed, but better to use real data)
-- UPDATE profiles SET exp = floor(random() * 2000 + 1000) WHERE exp = 0;
