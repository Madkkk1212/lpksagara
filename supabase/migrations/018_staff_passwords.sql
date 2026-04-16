-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 018
-- System Role: Staff Passwords
-- ============================================================

-- 1. Add staff_password column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS staff_password text DEFAULT NULL;

-- 2. Update Demo Admin & Teacher Accounts with passwords
UPDATE profiles SET staff_password = 'admin' WHERE email = 'admin@luma-jlpt.app';
UPDATE profiles SET staff_password = 'guru' WHERE email = 'teacher@luma-jlpt.app';
