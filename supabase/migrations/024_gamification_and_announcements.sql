-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 024
-- Gamification (Streaks, Achievements) & Announcements
-- ============================================================

-- 1. Update profiles table with streak columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT NULL;

-- 2. Create Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Create Achievements table (Master Data)
CREATE TABLE IF NOT EXISTS achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL, -- e.g. 'first_quiz', 'seven_day_streak'
  title text NOT NULL,
  description text NOT NULL,
  icon_url text, -- Can use emojis or SVG paths
  points_reward integer DEFAULT 100,
  criteria_type text NOT NULL, -- 'quiz_complete', 'streak', 'exp_total'
  criteria_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. Create User Achievements table (Link)
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_email, achievement_id)
);

-- 5. Seed Initial Achievements
INSERT INTO achievements (code, title, description, icon_url, criteria_type, criteria_value, points_reward) VALUES
('first_step', 'Langkah Pertama', 'Selesaikan materi pertama Anda.', '👣', 'material_complete', 1, 100),
('quiz_master', 'Quiz Master', 'Lulus 5 ujian JLPT.', '🎓', 'quiz_pass', 5, 500),
('burn_it_up', 'Membara!', 'Pertahankan streak belajar selama 7 hari.', '🔥', 'streak', 7, 1000),
('exp_hoarder', 'Kolektor XP', 'Capai total 5000 XP.', '💰', 'exp_total', 5000, 2000)
ON CONFLICT (code) DO NOTHING;

-- Disable RLS for simplicity (Demo Mode)
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;
