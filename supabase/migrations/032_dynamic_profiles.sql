-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 032
-- Dynamic Profiles & Unified Password Auth
-- ============================================================

-- 1. Add unified password column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password text;

-- Migrate existing staff_password to unified password
UPDATE profiles 
SET password = staff_password 
WHERE staff_password IS NOT NULL;

-- 2. Create Profile Fields definitions table
CREATE TABLE IF NOT EXISTS user_profile_fields (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('text', 'number', 'file')),
    is_required boolean DEFAULT false,
    allowed_file_types text[] DEFAULT NULL, -- e.g. ['pdf', 'jpg', 'png']
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create Profile Field Values table
CREATE TABLE IF NOT EXISTS user_profile_field_values (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    field_id uuid REFERENCES user_profile_fields(id) ON DELETE CASCADE,
    value text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, field_id)
);

-- 4. RLS - Keeping it consistent with 'profiles' table (not strictly enforced via auth.uid() in this app)
-- We will allow access for the custom auth system logic
ALTER TABLE user_profile_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read fields" ON user_profile_fields FOR SELECT USING (true);
CREATE POLICY "Allow anon mod fields" ON user_profile_fields FOR ALL USING (true); -- In production, restrict by IP or role if using Supabase Auth

CREATE POLICY "Allow anon read values" ON user_profile_field_values FOR SELECT USING (true);
CREATE POLICY "Allow anon mod values" ON user_profile_field_values FOR ALL USING (true);

-- 5. Seed some initial fields (Optional, based on user's examples)
INSERT INTO user_profile_fields (name, type, is_required, allowed_file_types, sort_order) VALUES
('KTP / Identitas', 'file', true, ARRAY['pdf', 'jpg', 'png'], 1),
('Akta Kelahiran', 'file', false, ARRAY['pdf', 'jpg', 'png'], 2),
('Nomor HP Darurat', 'number', true, NULL, 3)
ON CONFLICT DO NOTHING;
