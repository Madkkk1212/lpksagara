-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 034
-- Role-Based User Categorization & Onboarding
-- ============================================================

-- 1. Add target_role column to dynamic fields
ALTER TABLE user_profile_fields 
ADD COLUMN IF NOT EXISTS target_role text DEFAULT 'all';

-- 2. Add constraint for valid roles
-- admin, teacher, premium, standard, all
ALTER TABLE user_profile_fields
DROP CONSTRAINT IF EXISTS valid_target_role;

ALTER TABLE user_profile_fields
ADD CONSTRAINT valid_target_role 
CHECK (target_role IN ('admin', 'teacher', 'premium', 'standard', 'all'));

-- 3. Seed example for Roles
-- Create a field only for Teachers
INSERT INTO user_profile_fields (name, type, is_required, target_role, sort_order)
VALUES ('ID Kartu Guru', 'text', true, 'teacher', 50)
ON CONFLICT DO NOTHING;

-- Create a field only for Premium Users
INSERT INTO user_profile_fields (name, type, is_required, target_role, sort_order)
VALUES ('Bukti Pembayaran Premium', 'file', true, 'premium', 60)
ON CONFLICT DO NOTHING;
