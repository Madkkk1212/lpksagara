-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 017
-- System Role: Teacher
-- ============================================================

-- 1. Add is_teacher column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_teacher boolean DEFAULT false;

-- 2. Seed a Demo Teacher Account
-- As per rules, teachers must be premium automatically.
INSERT INTO profiles (email, full_name, is_teacher, is_premium, exp, level)
VALUES ('teacher@luma-jlpt.app', 'Sensei Demo', true, true, 5000, 5)
ON CONFLICT (email) DO UPDATE SET 
  is_teacher = true, 
  is_premium = true;

-- Notice: Teachers only use this to track, but the logic handles them as premium to ensure they can preview materials if needed.
