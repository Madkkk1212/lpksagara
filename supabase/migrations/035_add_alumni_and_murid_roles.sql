-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 035
-- Adding Alumni and Murid (Active Student) Roles
-- ============================================================

-- 1. Add is_alumni and is_student to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_alumni boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_student boolean DEFAULT false;

-- 2. Update existing verified users to be "Murid" by default
UPDATE profiles 
SET is_student = true 
WHERE profile_completed = true;

-- 3. Update target_role constraint in user_profile_fields
-- alumni, student, admin, teacher, premium, standard, all
ALTER TABLE user_profile_fields
DROP CONSTRAINT IF EXISTS valid_target_role;

ALTER TABLE user_profile_fields
ADD CONSTRAINT valid_target_role 
CHECK (target_role IN ('admin', 'teacher', 'premium', 'standard', 'all', 'alumni', 'student'));
