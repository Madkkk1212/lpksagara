-- ============================================================
-- LUMA JLPT — Database Migration 008
-- Material Premium Locks & Progress Tracking
-- ============================================================

-- 1. Add is_locked to study_materials
ALTER TABLE study_materials 
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- 2. Create User Material Progress table
CREATE TABLE IF NOT EXISTS user_material_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  material_id uuid REFERENCES study_materials(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_email, material_id)
);

-- disable RLS for simplicity
ALTER TABLE user_material_progress DISABLE ROW LEVEL SECURITY;
