-- ============================================================
-- LUMA JLPT — Database Migration 002: User Profiles & Access
-- Paste seluruh script ini ke Supabase SQL Editor lalu klik Run
-- ============================================================

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  gender text DEFAULT 'Laki-laki', -- 'Laki-laki' / 'Perempuan'
  phone text DEFAULT '',
  is_admin boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  unlocked_materials uuid[] DEFAULT '{}',
  unlocked_levels uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- SEED DATA (Admin Example)
INSERT INTO profiles (email, full_name, is_admin, is_premium)
VALUES ('admin@luma-jlpt.app', 'Luma Admin Specialist', true, true)
ON CONFLICT (email) DO NOTHING;

-- SEED DATA (Example Student)
INSERT INTO profiles (email, full_name, gender, phone, is_premium)
VALUES ('demo@luma-jlpt.app', 'Demo Student', 'Laki-laki', '08123456789', false)
ON CONFLICT (email) DO NOTHING;
