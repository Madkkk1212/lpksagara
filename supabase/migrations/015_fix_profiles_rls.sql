-- ============================================================
-- LUMA JLPT — Database Migration 015: Fix Profiles RLS
-- Paste script ini ke Supabase SQL Editor lalu klik Run
-- ============================================================

-- Disable RLS on profiles table to allow public registration (Demo Mode)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Ensure profiles table has the correct structure (sanity check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='gender') THEN
        ALTER TABLE profiles ADD COLUMN gender text DEFAULT 'Laki-laki';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
        ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
    END IF;
END $$;

-- Optional: Add public policy if you prefer keeping RLS enabled (commented out)
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public registration" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to see their own profile" ON profiles FOR SELECT USING (true);
*/
