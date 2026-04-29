-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 036
-- Advanced User Management & Strategic Indexing
-- ============================================================

-- 1. Add batch and nip columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS batch text,
ADD COLUMN IF NOT EXISTS nip text;

-- 2. Add nip_prefix to app_theme
ALTER TABLE app_theme 
ADD COLUMN IF NOT EXISTS nip_prefix text DEFAULT 'R';

-- 3. Strategic Indexing for High-Performance Reading
-- Role Flags (Frequent Filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles (is_admin, is_teacher, is_student, is_alumni, is_premium);

-- Sorting & Search (Fast Table Views)
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_exp ON profiles (exp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_nip ON profiles (nip);
CREATE INDEX IF NOT EXISTS idx_profiles_batch ON profiles (batch);

-- Relation performance
CREATE INDEX IF NOT EXISTS idx_profiles_category_id ON profiles (category_id);
CREATE INDEX IF NOT EXISTS idx_materials_category_id ON materials (category_id);
CREATE INDEX IF NOT EXISTS idx_user_material_progress_email ON user_material_progress (user_email);
