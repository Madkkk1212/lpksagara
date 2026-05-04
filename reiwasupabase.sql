-- BACKUP SUPABASE - REIWA SUPABASE
-- Generated on 2026-05-02T08:56:58.507Z

-- ==========================================
-- MIGRATION: 001_init.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 001
-- Paste seluruh script ini ke Supabase SQL Editor lalu klik Run
-- ============================================================

-- TABLE: app_theme (single-row config)
CREATE TABLE IF NOT EXISTS app_theme (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name text DEFAULT 'REIWA JLPT',
  tagline text DEFAULT 'Premium Japanese Study Experience',
  logo_text text DEFAULT 'L',
  primary_color text DEFAULT '#14b8a6',
  accent_color text DEFAULT '#f59e0b',
  bg_gradient_from text DEFAULT '#dff8f6',
  bg_gradient_to text DEFAULT '#eff4f8',
  card_bg text DEFAULT '#ffffff',
  text_primary text DEFAULT '#0f172a',
  text_secondary text DEFAULT '#64748b',
  nav_bg text DEFAULT '#0f172a',
  nav_active_color text DEFAULT '#2dd4bf',
  button_primary_bg text DEFAULT '#0f172a',
  button_primary_text text DEFAULT '#ffffff',
  splash_gradient_from text DEFAULT '#14b8a6',
  splash_gradient_to text DEFAULT '#f59e0b',
  social_instagram text DEFAULT '',
  social_twitter text DEFAULT '',
  social_website text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- TABLE: banner_slides
CREATE TABLE IF NOT EXISTS banner_slides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT 'Belajar Bahasa Jepang',
  subtitle text DEFAULT '',
  cta_text text DEFAULT 'Mulai Belajar',
  badge_text text DEFAULT 'Study Hub',
  badge_color text DEFAULT '#10b981',
  title_color text DEFAULT '#f97316',
  overlay_color text DEFAULT '#111827',
  overlay_opacity real DEFAULT 0.35,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE: material_categories
CREATE TABLE IF NOT EXISTS material_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  badge_color text DEFAULT '#14b8a6',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE: materials
CREATE TABLE IF NOT EXISTS materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES material_categories(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text DEFAULT '',
  japanese_text text DEFAULT '',
  indonesian_text text DEFAULT '',
  example_sentence text DEFAULT '',
  is_locked boolean DEFAULT false,
  card_accent_color text DEFAULT '#14b8a6',
  tag_color text DEFAULT '#10b981',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE: exam_levels
CREATE TABLE IF NOT EXISTS exam_levels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level_code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  gradient_from text DEFAULT '#14b8a6',
  gradient_to text DEFAULT '#10b981',
  badge_color text DEFAULT '#14b8a6',
  is_locked boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE: exam_tests
CREATE TABLE IF NOT EXISTS exam_tests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid REFERENCES exam_levels(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'full' CHECK (category IN ('full', 'mini', 'skill')),
  title text NOT NULL,
  duration_minutes integer DEFAULT 60,
  pass_point integer DEFAULT 75,
  difficulty text DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLE: questions
CREATE TABLE IF NOT EXISTS questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id uuid REFERENCES exam_tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL DEFAULT '',
  option_b text NOT NULL DEFAULT '',
  option_c text NOT NULL DEFAULT '',
  option_d text NOT NULL DEFAULT '',
  correct_option integer NOT NULL DEFAULT 0 CHECK (correct_option BETWEEN 0 AND 3),
  explanation text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- DISABLE RLS (demo mode — allow anon key full access)
ALTER TABLE app_theme DISABLE ROW LEVEL SECURITY;
ALTER TABLE banner_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE material_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Theme
INSERT INTO app_theme (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Banner Slides
INSERT INTO banner_slides (image_url, title, subtitle, cta_text, badge_text, badge_color, title_color, sort_order) VALUES
('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=900&q=80',
 'Fokus latihan, progres, dan materi',
 'Kurikulum terbaru 2024 untuk penguasaan bahasa Jepang', 
 'Masuk Online Exam', 'Study Hub', '#10b981', '#f97316', 1),
('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80',
 'Premium Japanese Study',
 'Materi lengkap N5 sampai N1 dan SSW tersedia', 
 'Lihat Materi', 'JLPT Master', '#6366f1', '#ffffff', 2),
('https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=900&q=80',
 'Ujian Online Setiap Saat',
 'Full Test, Mini Test dan Skill Test tersedia kapanpun',
 'Mulai Ujian', 'Exam Center', '#f59e0b', '#ffffff', 3);

-- Material Categories
INSERT INTO material_categories (id, name, description, badge_color, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'JLPT', 'Materi untuk ujian JLPT N5 hingga N1', '#14b8a6', 1),
('22222222-2222-2222-2222-222222222222', 'SSW', 'Materi untuk pekerja SSW di Jepang', '#f59e0b', 2)
ON CONFLICT DO NOTHING;

-- Materials — JLPT
INSERT INTO materials (category_id, slug, title, subtitle, japanese_text, indonesian_text, example_sentence, is_locked, card_accent_color, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'n5-aisatsu', 'N5 Salam Dasar', 'Aisatsu untuk pemula', 'おはよう・こんにちは・こんばんは', 'Selamat pagi / siang / malam', 'おはようございます。Saya ucapkan selamat pagi dengan sopan.', false, '#14b8a6', 1),
('11111111-1111-1111-1111-111111111111', 'n4-aktivitas', 'N4 Aktivitas Harian', 'Kata kerja sehari-hari', '起きる・食べる・働く', 'Bangun / makan / bekerja', 'わたしは まいあさ 6じに おきます。Saya bangun jam 6 setiap pagi.', false, '#0ea5e9', 2),
('11111111-1111-1111-1111-111111111111', 'n3-perasaan', 'N3 Perasaan & Pendapat', 'Ekspresi menengah', 'うれしい・不安・意見', 'Senang / cemas / pendapat', 'わたしの意見では、その方法がいいです。', true, '#8b5cf6', 3),
('11111111-1111-1111-1111-111111111111', 'n2-kantor', 'N2 Bahasa Kerja', 'Ungkapan formal kantor', '確認・報告・対応', 'Konfirmasi / laporan / penanganan', '内容を確認してから報告します。', true, '#6366f1', 4),
('11111111-1111-1111-1111-111111111111', 'n1-akademik', 'N1 Wacana Lanjut', 'Nuansa akademik dan opini', '概念・背景・傾向', 'Konsep / latar belakang / kecenderungan', '社会の傾向 को विश्लेषण गर्न आवश्यक छ।', true, '#ec4899', 5)
ON CONFLICT DO NOTHING;

-- Materials — SSW
INSERT INTO materials (category_id, slug, title, subtitle, japanese_text, indonesian_text, example_sentence, is_locked, card_accent_color, sort_order) VALUES
('22222222-2222-2222-2222-222222222222', 'ssw-kaigo', 'SSW Kaigo', 'Caregiver basic terms', '食事介助・移動・体温', 'Bantu makan / perpindahan / suhu tubuh', '体温を確認します。Saya akan cek suhu tubuh.', false, '#f59e0b', 1),
('22222222-2222-2222-2222-222222222222', 'ssw-food', 'SSW Food Service', 'Bahasa kerja restoran', '注文・会計・片付け', 'Pesanan / pembayaran / merapikan', 'ご注文をお願いします。Silakan sampaikan pesanannya.', true, '#f97316', 2),
('22222222-2222-2222-2222-222222222222', 'ssw-factory', 'SSW Factory', 'Instruksi kerja dasar', '点検・作業・安全', 'Pemeriksaan / pekerjaan / keselamatan', '作業の前に安全を確認します।', true, '#ef4444', 3)
ON CONFLICT DO NOTHING;

-- Exam Levels
INSERT INTO exam_levels (id, level_code, title, description, gradient_from, gradient_to, badge_color, is_locked, sort_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'n5', 'Beginning', 'Level paling dasar, cocok untuk pemula', '#14b8a6', '#10b981', '#14b8a6', false, 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'n4', 'Basic Japanese', 'Kosakata dan tata bahasa dasar', '#f97316', '#f59e0b', '#f97316', true, 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'n3', 'Daily Context', 'Bahasa Jepang sehari-hari', '#3b82f6', '#06b6d4', '#3b82f6', true, 3),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'n2', 'Professional', 'Bahasa formal dan profesional', '#6366f1', '#818cf8', '#6366f1', true, 4),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'n1', 'Mastery', 'Tingkat mahir dan akademik', '#ec4899', '#f43f5e', '#ec4899', true, 5)
ON CONFLICT DO NOTHING;

-- Exam Tests (N5)
INSERT INTO exam_tests (id, level_id, category, title, duration_minutes, pass_point, difficulty, sort_order) VALUES
('10101010-1010-1010-1010-101010101010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'full', 'Full Test #1', 60, 75, 'Easy', 1),
('20202020-2020-2020-2020-202020202020', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'full', 'Full Test #2', 60, 75, 'Medium', 2),
('30303030-3030-3030-3030-303030303030', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mini', 'Mini Test #1', 20, 70, 'Easy', 3),
('40404040-4040-4040-4040-404040404040', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mini', 'Mini Test #2', 20, 70, 'Medium', 4),
('50505050-5050-5050-5050-505050505050', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'skill', 'Skill Test #1', 30, 80, 'Easy', 5),
('60606060-6060-6060-6060-606060606060', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'skill', 'Skill Test #2', 30, 80, 'Medium', 6)
ON CONFLICT DO NOTHING;

-- Questions for Full Test #1 (N5)
INSERT INTO questions (test_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, sort_order) VALUES
('10101010-1010-1010-1010-101010101010', 'Baca kata: 「先生」', 'Gakusei', 'Sensei', 'Tenshu', 'Isha', 1, 'Sensei artinya guru.', 1),
('10101010-1010-1010-1010-101010101010', 'Partikel apa yang digunakan untuk menandai subjek?', 'wa (は)', 'ga (が)', 'wo (を)', 'ni (ni)', 1, 'Partikel ga adalah penanda subjek.', 2),
('10101010-1010-1010-1010-101010101010', 'Arti dari 「ありがとう」?', 'Halo', 'Selamat tinggal', 'Terima kasih', 'Maaf', 2, 'Arigatou artinya Terima kasih.', 3),
('10101010-1010-1010-1010-101010101010', 'Baca kata: 「水」', 'Mizu', 'Hi', 'Ki', 'Tsuchi', 0, 'Mizu artinya air.', 4),
('10101010-1010-1010-1010-101010101010', '"Tunggu sebentar" dalam bahasa Jepang?', 'Chotto matte', 'Hayaku', 'Oshiete', 'Sumimasen', 0, 'Chotto matte kudasai = Tunggu sebentar.', 5)
ON CONFLICT DO NOTHING;


-- ==========================================
-- MIGRATION: 002_profiles.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 002: User Profiles & Access
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
VALUES ('admin@REIWA-jlpt.app', 'REIWA Admin Specialist', true, true)
ON CONFLICT (email) DO NOTHING;

-- SEED DATA (Example Student)
INSERT INTO profiles (email, full_name, gender, phone, is_premium)
VALUES ('demo@REIWA-jlpt.app', 'Demo Student', 'Laki-laki', '08123456789', false)
ON CONFLICT (email) DO NOTHING;


-- ==========================================
-- MIGRATION: 003_study_hierarchy.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 003
-- Hierarchical Materials & Header Config
-- ============================================================

-- 1. HEADER CONFIG
ALTER TABLE app_theme ADD COLUMN IF NOT EXISTS header_use_logo_image boolean DEFAULT false;
ALTER TABLE app_theme ADD COLUMN IF NOT EXISTS header_logo_url text DEFAULT '';

-- 2. NEW MATERIAL HIERARCHY TABLES
CREATE TABLE IF NOT EXISTS study_levels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level_code text UNIQUE NOT NULL, -- e.g., 'n5', 'n4', 'n3'
  title text NOT NULL,
  description text DEFAULT '',
  badge_color text DEFAULT '#14b8a6',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_chapters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id uuid REFERENCES study_levels(id) ON DELETE CASCADE,
  title text NOT NULL, -- e.g., 'Bab 1'
  description text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid REFERENCES study_chapters(id) ON DELETE CASCADE,
  material_type text NOT NULL CHECK (material_type IN ('moji_goi', 'bunpou', 'dokkai', 'choukai')),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE study_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials DISABLE ROW LEVEL SECURITY;

-- 3. SEED DUMMY DATA (N5, N4, N3)
DO $$
DECLARE
    lvl_n5 UUID;
    lvl_n4 UUID;
    lvl_n3 UUID;
    chap_id UUID;
    i INT;
    
    moji_content JSONB := '{"items": [{"jp": "食べる", "id": "Makan", "example": "ご飯を食べる", "audioUrl": ""}]}';
    bunpou_content JSONB := '{"items": [{"explanation": "Pola kalimat dasar bentuk positif.", "pattern": "N1 は N2 です", "examples": [{"jp":"わたしは学生です","id":"Saya adalah seorang siswa"}]}]}';
    dokkai_content JSONB := '{"text_jp": "私は毎日日本語を勉強します。日本語は面白いです。", "text_id": "Saya setiap hari belajar bahasa Jepang. Bahasa Jepang menarik.", "exercises": [{"q": "毎日何をしますか？", "options": ["寝る", "勉強する", "遊ぶ", "食べる"], "answer": 1}]}';
    choukai_content JSONB := '{"audioUrl": "https://actions.google.com/sounds/v1/water/rain_on_roof.ogg", "exercises": [{"q": "男の人は何と言いましたか？", "options": ["おはよう", "こんにちは", "こんばんは", "さようなら"], "answer": 0}]}';
BEGIN
    -- Only insert if they do not exist
    IF NOT EXISTS (SELECT 1 FROM study_levels WHERE level_code = 'n5') THEN
        INSERT INTO study_levels (level_code, title, badge_color, sort_order) VALUES ('n5', 'Level N5', '#14b8a6', 1) RETURNING id INTO lvl_n5;
        -- Generate 20 Babs for N5
        FOR i IN 1..20 LOOP
            INSERT INTO study_chapters (level_id, title, sort_order) VALUES (lvl_n5, 'Bab ' || i, i) RETURNING id INTO chap_id;
            INSERT INTO study_materials (chapter_id, material_type, title, content, sort_order) VALUES 
            (chap_id, 'moji_goi', 'Moji & Goi Bab ' || i, moji_content, 1),
            (chap_id, 'bunpou', 'Bunpou Bab ' || i, bunpou_content, 2),
            (chap_id, 'dokkai', 'Dokkai Bab ' || i, dokkai_content, 3),
            (chap_id, 'choukai', 'Choukai Bab ' || i, choukai_content, 4);
        END LOOP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM study_levels WHERE level_code = 'n4') THEN
        INSERT INTO study_levels (level_code, title, badge_color, sort_order) VALUES ('n4', 'Level N4', '#f59e0b', 2) RETURNING id INTO lvl_n4;
        -- Generate 20 Babs for N4
        FOR i IN 1..20 LOOP
            INSERT INTO study_chapters (level_id, title, sort_order) VALUES (lvl_n4, 'Bab ' || i, i) RETURNING id INTO chap_id;
            INSERT INTO study_materials (chapter_id, material_type, title, content, sort_order) VALUES 
            (chap_id, 'moji_goi', 'Moji & Goi Bab ' || i, moji_content, 1),
            (chap_id, 'bunpou', 'Bunpou Bab ' || i, bunpou_content, 2),
            (chap_id, 'dokkai', 'Dokkai Bab ' || i, dokkai_content, 3),
            (chap_id, 'choukai', 'Choukai Bab ' || i, choukai_content, 4);
        END LOOP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM study_levels WHERE level_code = 'n3') THEN
        INSERT INTO study_levels (level_code, title, badge_color, sort_order) VALUES ('n3', 'Level N3', '#3b82f6', 3) RETURNING id INTO lvl_n3;
        -- Generate 36 Babs for N3
        FOR i IN 1..36 LOOP
            INSERT INTO study_chapters (level_id, title, sort_order) VALUES (lvl_n3, 'Bab ' || i, i) RETURNING id INTO chap_id;
            INSERT INTO study_materials (chapter_id, material_type, title, content, sort_order) VALUES 
            (chap_id, 'moji_goi', 'Moji & Goi Bab ' || i, moji_content, 1),
            (chap_id, 'bunpou', 'Bunpou Bab ' || i, bunpou_content, 2),
            (chap_id, 'dokkai', 'Dokkai Bab ' || i, dokkai_content, 3),
            (chap_id, 'choukai', 'Choukai Bab ' || i, choukai_content, 4);
        END LOOP;
    END IF;

END $$;


-- ==========================================
-- MIGRATION: 004_manual_add_quiz_lock.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 004
-- Manual Add, Premium Locks, and Chapter Quizzes
-- ============================================================

-- 1. Add `is_locked` to `study_chapters`
ALTER TABLE study_chapters ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- 2. Modify `study_materials` check constraint to allow 'quiz'
-- First, drop the existing constraint. We have to find its name or recreate the logic.
-- Since Supabase creates constraints automatically with table name + constraint name, 
-- we can just recreate the table constraints by dropping the old one.
-- Actually, a safer way in Postgres when constraint name is unknown is just to alter type, 
-- but we know Supabase creates `study_materials_material_type_check`.
-- We will just try to drop the standard ones, then add the new one.
DO $$
BEGIN
    ALTER TABLE study_materials DROP CONSTRAINT IF EXISTS study_materials_material_type_check;
    ALTER TABLE study_materials ADD CONSTRAINT study_materials_material_type_check 
        CHECK (material_type IN ('moji_goi', 'bunpou', 'dokkai', 'choukai', 'quiz'));
EXCEPTION
    WHEN undefined_object THEN
        -- Do nothing if it fails, fallback
        NULL;
END $$;

-- 3. Add dummy quiz data to existig N5 chapters for demonstration
DO $$
DECLARE
    chap RECORD;
    quiz_content JSONB := '{"exercises": [{"q": "Apa bacaan dari 食べる?", "options": ["たべる", "のむ", "いく", "くる"], "answer": 0}, {"q": "Apa arti dari わかる?", "options": ["Makan", "Minum", "Mengerti", "Tidur"], "answer": 2}]}';
BEGIN
    FOR chap IN SELECT id FROM study_chapters WHERE title = 'Bab 1' LOOP
        IF NOT EXISTS (SELECT 1 FROM study_materials WHERE chapter_id = chap.id AND material_type = 'quiz') THEN
            INSERT INTO study_materials (chapter_id, material_type, title, content, sort_order)
            VALUES (chap.id, 'quiz', 'Quiz Bab 1', quiz_content, 5);
        END IF;
    END LOOP;
END $$;


-- ==========================================
-- MIGRATION: 005_icons_and_adjustments.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 005
-- Base64 Icon URL columns
-- ============================================================

ALTER TABLE study_levels ADD COLUMN IF NOT EXISTS icon_url text DEFAULT '';
ALTER TABLE study_chapters ADD COLUMN IF NOT EXISTS icon_url text DEFAULT '';
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS icon_url text DEFAULT '';


-- ==========================================
-- MIGRATION: 006_icon_manager_gallery.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 006
-- Icon Library & Picker System
-- ============================================================

CREATE TABLE IF NOT EXISTS icon_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- disable RLS
ALTER TABLE icon_categories DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS icon_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES icon_categories(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- disable RLS
ALTER TABLE icon_library DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 007_update_theme_red.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 007
-- Update Application Theme to Premium Red
-- ============================================================

-- Menghapus "WHERE id = ..." karena app_theme dirancang sebagai tabel baris tunggal (satu row konfigurasi)
UPDATE app_theme
SET 
  primary_color = '#dc2626',      -- Red 600
  accent_color = '#b91c1c',       -- Red 700
  bg_gradient_from = '#fee2e2',   -- Red 100
  bg_gradient_to = '#fef2f2',     -- Red 50
  splash_gradient_from = '#ef4444', -- Red 500
  splash_gradient_to = '#991b1b',   -- Red 800
  nav_active_color = '#dc2626',
  button_primary_bg = '#dc2626';


-- ==========================================
-- MIGRATION: 008_material_lock_and_progress.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 008
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


-- ==========================================
-- MIGRATION: 009_add_category_to_study_levels.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 009
-- Add category_id to study_levels and Fix SSW Mapping
-- ============================================================

-- 1. Tambahkan kolom relasi kategori
ALTER TABLE study_levels 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES material_categories(id) ON DELETE CASCADE;

-- 2. Pindahkan otomatis level berbau "N" (N5, N4, dst) ke kategori JLPT
UPDATE study_levels
SET category_id = '11111111-1111-1111-1111-111111111111'
WHERE level_code ILIKE 'n%' AND category_id IS NULL;

-- Jika ada level yang masih kosong kategorinya, by default ke JLPT
UPDATE study_levels
SET category_id = '11111111-1111-1111-1111-111111111111'
WHERE category_id IS NULL;

-- 3. Ciptakan dummy level khusus SSW agar murid punya opsi level di bawah kategori SSW
INSERT INTO study_levels (id, level_code, title, description, badge_color, sort_order, category_id)
VALUES (
  '33333333-3333-3333-3333-333333333333', 
  'ssw-nurse', 
  'SSW Caregiver', 
  'Dasar keperawatan dan kosa kata lingkungan panti jompo Jepang.', 
  '#f59e0b', 
  1, 
  '22222222-2222-2222-2222-222222222222'
) ON CONFLICT (level_code) DO NOTHING;


-- ==========================================
-- MIGRATION: 010_update_theme_branding.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 010
-- Add favicon_url to app_theme
-- ============================================================

ALTER TABLE app_theme 
ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT 'https://nextjs.org/favicon.ico';


-- ==========================================
-- MIGRATION: 011_add_icon_to_categories.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 011
-- Add icon_url to material_categories
-- ============================================================

ALTER TABLE material_categories 
ADD COLUMN IF NOT EXISTS icon_url text;

-- Update existing sample data if needed
UPDATE material_categories SET icon_url = 'https://img.icons8.com/color/96/japan.png' WHERE name = 'JLPT';
UPDATE material_categories SET icon_url = 'https://img.icons8.com/color/96/worker.png' WHERE name = 'SSW';


-- ==========================================
-- MIGRATION: 012_add_icon_to_exam_levels.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 012
-- Add icon_url to exam_levels
-- ============================================================

ALTER TABLE exam_levels 
ADD COLUMN IF NOT EXISTS icon_url text;

-- Update existing sample data with some colored icons
UPDATE exam_levels SET icon_url = 'https://img.icons8.com/color/96/japan.png' WHERE level_code = 'n5';
UPDATE exam_levels SET icon_url = 'https://img.icons8.com/color/96/topaz.png' WHERE level_code = 'n4';
UPDATE exam_levels SET icon_url = 'https://img.icons8.com/color/96/emerald.png' WHERE level_code = 'n3';
UPDATE exam_levels SET icon_url = 'https://img.icons8.com/color/96/ruby.png' WHERE level_code = 'n2';
UPDATE exam_levels SET icon_url = 'https://img.icons8.com/color/96/diamond.png' WHERE level_code = 'n1';


-- ==========================================
-- MIGRATION: 013_set_premium_ssw_icon.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 013
-- Set Premium Icon for SSW Category
-- ============================================================

-- Use a higher quality professional worker icon from Icons8 set
UPDATE material_categories 
SET icon_url = 'https://img.icons8.com/color/144/construction-worker--v1.png' 
WHERE name = 'SSW';

UPDATE material_categories 
SET icon_url = 'https://img.icons8.com/color/144/japan.png' 
WHERE name = 'JLPT';


-- ==========================================
-- MIGRATION: 014_add_missing_icon_urls.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 014
-- Add icon_url to all material-related tables
-- ============================================================

-- 1. Add icon_url to study_levels (Materi tab levels)
ALTER TABLE study_levels 
ADD COLUMN IF NOT EXISTS icon_url text;

-- 2. Add icon_url to study_chapters
ALTER TABLE study_chapters 
ADD COLUMN IF NOT EXISTS icon_url text;

-- 3. Add icon_url to study_materials
ALTER TABLE study_materials 
ADD COLUMN IF NOT EXISTS icon_url text;

-- 4. Add icon_url to materials (Older hub table)
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS icon_url text;

-- Default icons for existing study levels
UPDATE study_levels SET icon_url = 'https://img.icons8.com/color/96/japan-circular.png' WHERE level_code = 'n5';
UPDATE study_levels SET icon_url = 'https://img.icons8.com/color/96/japan.png' WHERE level_code = 'n4';
UPDATE study_levels SET icon_url = 'https://img.icons8.com/color/96/temple.png' WHERE level_code = 'n3';
UPDATE study_levels SET icon_url = 'https://img.icons8.com/color/96/torii-gate.png' WHERE level_code = 'n2';
UPDATE study_levels SET icon_url = 'https://img.icons8.com/color/96/fuji-mountain.png' WHERE level_code = 'n1';


-- ==========================================
-- MIGRATION: 015_fix_profiles_rls.sql
-- ==========================================

-- ============================================================
-- REIWA JLPT — Database Migration 015: Fix Profiles RLS
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


-- ==========================================
-- MIGRATION: 016_learning_system_exp.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 016
-- EXP System & Progress Tracking
-- ============================================================

-- 1. Update profiles with EXP and Tracking columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS exp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS target_level text DEFAULT 'N5',
ADD COLUMN IF NOT EXISTS last_material_id uuid REFERENCES study_materials(id),
ADD COLUMN IF NOT EXISTS last_test_id uuid REFERENCES exam_tests(id);

-- 2. Create Exam Results table
CREATE TABLE IF NOT EXISTS user_exam_results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  test_id uuid REFERENCES exam_tests(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  is_passed boolean DEFAULT false,
  exp_gained integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. EXP Logs (Optional but good for auditing)
CREATE TABLE IF NOT EXISTS user_exp_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  activity_type text NOT NULL, -- 'material', 'test', 'target'
  activity_id uuid,
  exp_amount integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Disable RLS for new tables (Demo mode)
ALTER TABLE user_exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_exp_logs DISABLE ROW LEVEL SECURITY;

-- 4. Initial seed for leaderboard simulation (if needed, but better to use real data)
-- UPDATE profiles SET exp = floor(random() * 2000 + 1000) WHERE exp = 0;


-- ==========================================
-- MIGRATION: 017_add_teacher_role.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 017
-- System Role: Teacher
-- ============================================================

-- 1. Add is_teacher column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_teacher boolean DEFAULT false;

-- 2. Seed a Demo Teacher Account
-- As per rules, teachers must be premium automatically.
INSERT INTO profiles (email, full_name, is_teacher, is_premium, exp, level)
VALUES ('teacher@REIWA-jlpt.app', 'Sensei Demo', true, true, 5000, 5)
ON CONFLICT (email) DO UPDATE SET 
  is_teacher = true, 
  is_premium = true;

-- Notice: Teachers only use this to track, but the logic handles them as premium to ensure they can preview materials if needed.


-- ==========================================
-- MIGRATION: 018_staff_passwords.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 018
-- System Role: Staff Passwords
-- ============================================================

-- 1. Add staff_password column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS staff_password text DEFAULT NULL;

-- 2. Update Demo Admin & Teacher Accounts with passwords
UPDATE profiles SET staff_password = 'admin' WHERE email = 'admin@REIWA-jlpt.app';
UPDATE profiles SET staff_password = 'guru' WHERE email = 'teacher@REIWA-jlpt.app';


-- ==========================================
-- MIGRATION: 019_profile_onboarding.sql
-- ==========================================

-- Add new fields for mandatory profile onboarding
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS institution TEXT,
ADD COLUMN IF NOT EXISTS certificate_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;


-- ==========================================
-- MIGRATION: 020_question_audio.sql
-- ==========================================

-- Add audio_url and question_type fields to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice';
-- Types: 'multiple_choice', 'listening', 'reading'


-- ==========================================
-- MIGRATION: 021_teacher_proposals.sql
-- ==========================================

-- Teacher Content Proposal System
CREATE TABLE IF NOT EXISTS teacher_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_email TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('question', 'material')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 022_rich_media.sql
-- ==========================================

-- Add rich media support to questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update question_type to support image and video types too
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'listening', 'reading', 'image_based', 'video_based'));

-- Add video support to study_materials
ALTER TABLE study_materials
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for media (run this in Supabase dashboard if SQL doesn't work)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;


-- ==========================================
-- MIGRATION: 023_storage_bucket.sql
-- ==========================================

-- Create public storage bucket for media files
-- (Run this in Supabase SQL Editor)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 
  'media', 
  true,
  52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','audio/mpeg','audio/mp3','audio/ogg','audio/wav','video/mp4','video/webm','video/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Allow public access to read media files
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;
CREATE POLICY "Public can read media" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated can upload media" ON storage.objects;
CREATE POLICY "Authenticated can upload media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');


-- ==========================================
-- MIGRATION: 024_gamification_and_announcements.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 024
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


-- ==========================================
-- MIGRATION: 025_srs_flashcards.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 025
-- Spaced Repetition System (SRS) Flashcards
-- ============================================================

-- 1. Create User Flashcards table
CREATE TABLE IF NOT EXISTS user_flashcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email text NOT NULL,
  
  -- Flashcard content
  front text NOT NULL, -- e.g. "食べる"
  back text NOT NULL,  -- e.g. "Makan"
  example_sentence text DEFAULT '',
  tag text DEFAULT 'vocabulary', -- 'vocabulary', 'kanji', 'grammar'
  
  -- SRS Data (SM-2 Algorithm based)
  level integer DEFAULT 0, -- Current level (0-10)
  interval integer DEFAULT 0, -- Days until next review
  ease_factor real DEFAULT 2.5,
  next_review_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_email ON user_flashcards(user_email);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON user_flashcards(next_review_at);

-- Disable RLS (Demo Mode)
ALTER TABLE user_flashcards DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 026_fix_teacher_proposals_rls.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 026
-- Fix: Teacher Proposals RLS Policies
-- ============================================================

-- 1. Disable RLS for this table to support manual auth system
ALTER TABLE teacher_proposals DISABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 027_cloudinary_integration.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 027
-- Add Cloudinary Settings for Media Optimization
-- ============================================================

-- 1. Add Cloudinary columns to app_theme
ALTER TABLE app_theme 
ADD COLUMN IF NOT EXISTS cloudinary_cloud_name TEXT,
ADD COLUMN IF NOT EXISTS cloudinary_upload_preset TEXT;

-- 2. Add description for tracking in Admin panel (optional but good for context)
COMMENT ON COLUMN app_theme.cloudinary_cloud_name IS 'Cloudinary Cloud Name for automatic media optimization';
COMMENT ON COLUMN app_theme.cloudinary_upload_preset IS 'Cloudinary Unsigned Upload Preset for secure client-side uploads';


-- ==========================================
-- MIGRATION: 028_super_admin_menu.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 028
-- System Role: Superduper Admin & Dynamic Menu Config
-- ============================================================

-- 1. Add is_super_admin column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- 2. Create Admin Menu Configuration Table
CREATE TABLE IF NOT EXISTS admin_menu_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tab_id text UNIQUE NOT NULL,
    label text NOT NULL,
    icon text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on admin_menu_config
ALTER TABLE admin_menu_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (needed for filtering tabs during login)
CREATE POLICY "Allow anyone to read menu config" 
ON admin_menu_config FOR SELECT 
USING (true);

-- Only Super Admins can modify
CREATE POLICY "Only super admins can modify menu config" 
ON admin_menu_config FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_super_admin = true
    )
);

-- 4. Seed Initial Menu Config (Based on AdminClient.tsx tabs)
INSERT INTO admin_menu_config (tab_id, label, icon, sort_order) VALUES
('dashboard', 'Dashboard', '📊', 1),
('reports', 'Laporan', '📈', 2),
('announcements', 'Pengumuman', '📢', 3),
('bulk-import', 'Bulk Import', '🚀', 4),
('icons', 'Icons Gallery', '✨', 5),
('theme', 'Theme', '🎨', 6),
('banners', 'Banners', '🖼️', 7),
('materials', 'Materials', '📚', 8),
('exams', 'Exams', '🎯', 9),
('users', 'Users', '👥', 10),
('proposals', 'Usulan Guru', '📝', 11),
('settings', 'Settings', '⚙️', 12)
ON CONFLICT (tab_id) DO NOTHING;

-- 5. Create Superduper Admin Profile
-- Note: In a real app, this should be done via Auth or a secure setup.
-- We use a known email and set is_super_admin = true.
-- You will need to login with this email.
INSERT INTO profiles (email, full_name, gender, phone, is_admin, is_super_admin, staff_password, exp, level)
VALUES ('owner@REIWA.app', 'REIWA Owner', 'Laki-laki', '+62000000000', true, true, 'REIWA-boss-secret', 0, 1)
ON CONFLICT (email) DO UPDATE SET is_super_admin = true, staff_password = 'REIWA-boss-secret';


-- ==========================================
-- MIGRATION: 029_assessment_templates.sql
-- ==========================================

-- Assessment Template System
-- Allows Admin to define the structure (sections + columns) of grading rubrics

-- Main template table: one row per "rubric"
CREATE TABLE IF NOT EXISTS public.assessment_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- e.g. "Rapor N5 2024"
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_templates_pkey PRIMARY KEY (id)
);

-- Sections (rows of the rubric)
CREATE TABLE IF NOT EXISTS public.assessment_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  label text NOT NULL,                         -- e.g. "Moji-Goi (Kosakata)"
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_sections_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE
);

-- Columns (columns of the rubric)
CREATE TABLE IF NOT EXISTS public.assessment_columns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  label text NOT NULL,                         -- e.g. "Nilai", "Predikat", "Keterangan"
  col_type text DEFAULT 'text' CHECK (col_type = ANY (ARRAY['text','number','grade','select'])),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_columns_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_columns_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_columns ENABLE ROW LEVEL SECURITY;

-- Policies: read by all authenticated users, write by admin
CREATE POLICY "Allow read assessment_templates" ON public.assessment_templates FOR SELECT USING (true);
CREATE POLICY "Allow all assessment_templates" ON public.assessment_templates FOR ALL USING (true);

CREATE POLICY "Allow read assessment_sections" ON public.assessment_sections FOR SELECT USING (true);
CREATE POLICY "Allow all assessment_sections" ON public.assessment_sections FOR ALL USING (true);

CREATE POLICY "Allow read assessment_columns" ON public.assessment_columns FOR SELECT USING (true);
CREATE POLICY "Allow all assessment_columns" ON public.assessment_columns FOR ALL USING (true);


-- ==========================================
-- MIGRATION: 029_fix_menu_rls_and_fallback.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 029
-- System Role: Fix Menu RLS & Persistence
-- ============================================================

-- 1. Disable RLS on admin_menu_config 
-- This ensures the custom Staff Gateway can save changes 
-- without needing a standard Supabase Auth session.
ALTER TABLE admin_menu_config DISABLE ROW LEVEL SECURITY;

-- 2. Ensure all existing menus are properly initialized
-- (Sanity check to make sure they are NOT all stuck in one state)
UPDATE admin_menu_config SET is_active = true WHERE is_active IS NULL;


-- ==========================================
-- MIGRATION: 030_assessment_chapter_reports.sql
-- ==========================================

-- Assessment Chapter Report System
-- Super Admin generates per-chapter (bab) assessment templates
-- Teachers fill in grades; report auto-generates from chapter structure

-- Table: Chapter-based assessment template (one per level)
-- Each record links a study_chapter to a set of column definitions
CREATE TABLE IF NOT EXISTS public.assessment_chapter_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL,
  chapter_id uuid NOT NULL,                        -- linked to study_chapters
  chapter_title text NOT NULL,                     -- snapshot of chapter title
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,      -- [{label, col_type}]
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_chapter_templates_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_chapter_templates_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_templates_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.study_chapters(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_templates_unique UNIQUE (level_id, chapter_id)
);

-- Table: Grades entered by teacher per student per chapter column
CREATE TABLE IF NOT EXISTS public.assessment_chapter_grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  student_email text NOT NULL,
  column_label text NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_chapter_grades_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_chapter_grades_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_chapter_templates(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_grades_unique UNIQUE (template_id, student_email, column_label)
);

-- Enable RLS
ALTER TABLE public.assessment_chapter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_chapter_grades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read chapter templates" ON public.assessment_chapter_templates FOR SELECT USING (true);
CREATE POLICY "Allow all chapter templates" ON public.assessment_chapter_templates FOR ALL USING (true);

CREATE POLICY "Allow read chapter grades" ON public.assessment_chapter_grades FOR SELECT USING (true);
CREATE POLICY "Allow all chapter grades" ON public.assessment_chapter_grades FOR ALL USING (true);


-- ==========================================
-- MIGRATION: 030_extend_menu_config_to_teacher.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 030
-- System Role: Extend Menu Config to Teacher Hub
-- ============================================================

-- 1. Add scope column to distinguish between dashboards
ALTER TABLE admin_menu_config 
ADD COLUMN IF NOT EXISTS scope text DEFAULT 'admin';

-- 2. Seed Teacher Hub Menus
INSERT INTO admin_menu_config (tab_id, label, icon, sort_order, scope) VALUES
('students', '👥 Data Siswa', '', 1, 'teacher'),
('proposals', '📝 Usul Konten', '', 2, 'teacher')
ON CONFLICT (tab_id) DO NOTHING;

-- 3. Update existing records to ensure they have the 'admin' scope
UPDATE admin_menu_config SET scope = 'admin' WHERE scope IS NULL;


-- ==========================================
-- MIGRATION: 031_assessment_report_settings.sql
-- ==========================================



-- ==========================================
-- MIGRATION: 031_fix_menu_scope_conflict.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 031
-- System Role: Resolve Menu ID Conflict between Admin & Teacher
-- ============================================================

-- 1. Remove the old unique constraint on tab_id
-- We need to find the constraint name first. In Supabase/Postgres, 
-- it's usually table_column_key.
ALTER TABLE admin_menu_config DROP CONSTRAINT IF EXISTS admin_menu_config_tab_id_key;

-- 2. Add a new composite unique constraint (tab_id + scope)
-- This allows 'proposals' to exist in both 'admin' and 'teacher' scopes.
ALTER TABLE admin_menu_config ADD CONSTRAINT admin_menu_config_tab_scope_unique UNIQUE (tab_id, scope);

-- 3. Re-seed Teacher Menus (They will now succeed)
INSERT INTO admin_menu_config (tab_id, label, icon, sort_order, scope) VALUES
('students', '👥 Data Siswa', '', 1, 'teacher'),
('proposals', '📝 Usul Konten', '', 2, 'teacher')
ON CONFLICT (tab_id, scope) DO UPDATE SET 
    label = EXCLUDED.label,
    icon = EXCLUDED.icon;


-- ==========================================
-- MIGRATION: 032_dynamic_profiles.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 032
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


-- ==========================================
-- MIGRATION: 032_fix_grades_schema.sql
-- ==========================================

-- Migration: Final Fix for assessment_chapter_grades uniqueness
-- Use a unified unique index that handles NULL values properly for upsert operations

-- 1. Remove old indexes/constraints
DROP INDEX IF EXISTS public.assessment_chapter_grades_unique_idx;
DROP INDEX IF EXISTS public.assessment_chapter_grades_template_unique_idx;
ALTER TABLE public.assessment_chapter_grades DROP CONSTRAINT IF EXISTS assessment_chapter_grades_unique;

-- 2. Create a unified unique index using COALESCE to handle NULLs
-- This ensures (student, label, template, null) and (student, label, null, level) are both uniquely identifiable
CREATE UNIQUE INDEX assessment_chapter_grades_upsert_idx ON public.assessment_chapter_grades (
  student_email, 
  column_label, 
  (COALESCE(template_id, '00000000-0000-0000-0000-000000000000'::uuid)),
  (COALESCE(level_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Note: Supabase JS upsert works best with actual Constraints for the 'onConflict' parameter.
-- Let's try to use a standard unique constraint if possible, but PG 15 is required for NULLS NOT DISTINCT.
-- As a fallback for older PG, we'll use partial unique indexes but call them separately in JS.

DROP INDEX IF EXISTS public.assessment_chapter_grades_upsert_idx;

-- Final approach: Two clean partial indexes
CREATE UNIQUE INDEX assessment_grades_chapter_idx ON public.assessment_chapter_grades (student_email, column_label, template_id) WHERE template_id IS NOT NULL;
CREATE UNIQUE INDEX assessment_grades_additional_idx ON public.assessment_chapter_grades (student_email, column_label, level_id) WHERE template_id IS NULL;


-- ==========================================
-- MIGRATION: 033_add_grading_menu_to_teacher.sql
-- ==========================================

-- Migration: Add Laporan Penilaian to Teacher Menu Configuration
-- Ensures the menu item is visible in the Teacher Dashboard using a safe Delete/Insert pattern

-- 1. Remove existing entry if any to prevent duplicates without needing a unique constraint
DELETE FROM public.admin_menu_config WHERE tab_id = 'grading' AND scope = 'teacher';

-- 2. Insert the new menu configuration
INSERT INTO public.admin_menu_config (tab_id, label, icon, is_active, scope, sort_order)
VALUES ('grading', '📝 Laporan Penilaian', 'FileText', true, 'teacher', 3);


-- ==========================================
-- MIGRATION: 033_category_based_users.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 033
-- Category-Based User Tracks & Specific Onboarding Fields
-- ============================================================

-- 1. Add category_id to profiles (Track assigned by Admin)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES material_categories(id) ON DELETE SET NULL;

-- 2. Add category_id to user_profile_fields (Fields specific to a Track)
-- If category_id is NULL, the field is "Global" (required for everyone)
ALTER TABLE user_profile_fields 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES material_categories(id) ON DELETE CASCADE;

-- 3. Update RLS (already enabled, just making sure new columns are accessible)
-- policies from 032 already use 'true' for select, so they will see new columns.

-- 4. Seed example: Create a track and a track-specific field
DO $$
DECLARE 
    track_id uuid;
BEGIN
    -- Only seed if categories exist
    SELECT id INTO track_id FROM material_categories LIMIT 1;
    
    IF track_id IS NOT NULL THEN
        -- Add a field specific to the first category found
        INSERT INTO user_profile_fields (name, type, is_required, category_id, sort_order)
        VALUES ('Sertifikat Khusus Track', 'file', true, track_id, 100)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;


-- ==========================================
-- MIGRATION: 034_make_chapter_id_nullable.sql
-- ==========================================

-- Migration: Fix chapter_id, Create settings table, AND add level_id to grades

-- 1. Create the missing settings table
CREATE TABLE IF NOT EXISTS public.assessment_report_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    level_id uuid NOT NULL,
    additional_columns jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assessment_report_settings_pkey PRIMARY KEY (id),
    CONSTRAINT assessment_report_settings_level_id_key UNIQUE (level_id),
    CONSTRAINT assessment_report_settings_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id) ON DELETE CASCADE
);

ALTER TABLE public.assessment_report_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on assessment_report_settings" ON public.assessment_report_settings FOR ALL USING (true);

-- 2. Add level_id to grades table if missing
-- This is crucial for manual/additional materials not linked to a chapter
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_chapter_grades' AND column_name='level_id') THEN
        ALTER TABLE public.assessment_chapter_grades ADD COLUMN level_id uuid REFERENCES public.study_levels(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Make chapter_id nullable in templates
ALTER TABLE public.assessment_chapter_templates ALTER COLUMN chapter_id DROP NOT NULL;

-- 4. Update the unique constraint for chapter templates
ALTER TABLE public.assessment_chapter_templates DROP CONSTRAINT IF EXISTS assessment_chapter_templates_unique;
DROP INDEX IF EXISTS assessment_chapter_templates_unified_unique_idx;

CREATE UNIQUE INDEX assessment_chapter_templates_unified_unique_idx 
ON public.assessment_chapter_templates (level_id, COALESCE(chapter_id, '00000000-0000-0000-0000-000000000000'), chapter_title);

-- 5. Finalize Grades Uniqueness for Upsert
DROP INDEX IF EXISTS assessment_grades_chapter_idx;
DROP INDEX IF EXISTS assessment_grades_additional_idx;

CREATE UNIQUE INDEX assessment_grades_chapter_idx ON public.assessment_chapter_grades (student_email, column_label, template_id) WHERE template_id IS NOT NULL;
CREATE UNIQUE INDEX assessment_grades_additional_idx ON public.assessment_chapter_grades (student_email, column_label, level_id) WHERE template_id IS NULL;


-- ==========================================
-- MIGRATION: 034_role_based_onboarding.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 034
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


-- ==========================================
-- MIGRATION: 035_add_alumni_and_murid_roles.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 035
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


-- ==========================================
-- MIGRATION: 035_weekly_reports.sql
-- ==========================================

-- Migration: Create Weekly Reports Table and monitoring settings
-- Table for teachers to submit their weekly progress reports

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    batch text NOT NULL,
    title text NOT NULL,
    content text NOT NULL, -- Detailed report content
    obstacles text, -- Challenges faced during the week
    suggestions text, -- Proposed solutions or next steps
    report_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT weekly_reports_pkey PRIMARY KEY (id)
);

-- Add column to app_theme for visibility control
ALTER TABLE public.app_theme ADD COLUMN IF NOT EXISTS show_weekly_reports_to_admin boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Super Admins can do everything on weekly_reports"
ON public.weekly_reports FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

CREATE POLICY "Teachers can manage their own weekly_reports"
ON public.weekly_reports FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can view weekly_reports if enabled"
ON public.weekly_reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) AND EXISTS (
    SELECT 1 FROM public.app_theme
    WHERE app_theme.show_weekly_reports_to_admin = true
  )
);


-- ==========================================
-- MIGRATION: 036_advanced_user_management.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 036
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


-- ==========================================
-- MIGRATION: 037_default_supporting_fields.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 037
-- Default Supporting Data Fields for Students & Alumni
-- ============================================================

-- Insert default fields for onboarding
INSERT INTO user_profile_fields (name, type, is_required, target_role, sort_order)
VALUES 
    ('Foto KTP / Kartu Identitas', 'file', true, 'all', 10),
    ('Pas Foto 3x4 (Background Merah/Biru)', 'file', true, 'student', 20),
    ('CV / Riwayat Hidup Terbaru', 'file', true, 'alumni', 30),
    ('Sertifikat Kemampuan Bahasa (JLPT/NAT)', 'file', false, 'all', 40),
    ('Bukti Pembayaran / Slip Gaji', 'file', false, 'standard', 50)
ON CONFLICT DO NOTHING;


-- ==========================================
-- MIGRATION: 038_refine_profile_fields.sql
-- ==========================================

-- ============================================================
-- REIWA LEARNING SYSTEM — Database Migration 038
-- Refine Supporting Data Fields & Type Constraints
-- ============================================================

-- 1. Remove redundant/unused fields
DELETE FROM user_profile_fields 
WHERE name IN ('Pas Foto 3x4 (Background Merah/Biru)', 'Sertifikat Kemampuan Bahasa (JLPT/NAT)');

-- 2. Update allowed file types for existing file-based fields
UPDATE user_profile_fields 
SET allowed_file_types = ARRAY['jpg', 'jpeg', 'png', 'pdf']
WHERE type = 'file';

-- 3. Add new text/number based fields for testing and better data gathering
INSERT INTO user_profile_fields (name, type, is_required, target_role, sort_order)
VALUES 
    ('ID Instagram / Telegram', 'text', false, 'all', 60),
    ('Nomor Rekening Bank (BCA/Mandiri/Lainnya)', 'text', false, 'alumni', 70)
ON CONFLICT DO NOTHING;


-- ==========================================
-- MIGRATION: 039_add_asset_metadata.sql
-- ==========================================

-- Migration 039: Add metadata to study_materials for better asset management
ALTER TABLE study_materials
ADD COLUMN IF NOT EXISTS file_size BIGINT, -- Size in bytes
ADD COLUMN IF NOT EXISTS storage_provider TEXT; -- 'cloudinary' or 'supabase'

COMMENT ON COLUMN study_materials.file_size IS 'Exact file size in bytes for the associated media';
COMMENT ON COLUMN study_materials.storage_provider IS 'The service used to host the media asset';


-- ==========================================
-- MIGRATION: 040_weekly_targets.sql
-- ==========================================

-- Migration: Create Weekly Targets Table
-- Table for teachers to assign weekly material targets to students/batches

CREATE TABLE IF NOT EXISTS public.weekly_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'batch' CHECK (target_type = ANY (ARRAY['personal'::text, 'batch'::text])),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch text,
  title text NOT NULL,
  description text,
  material_ids uuid[] DEFAULT '{}'::uuid[],
  custom_content text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_targets_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.weekly_targets ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own targets
CREATE POLICY "Teachers can manage their own weekly_targets"
ON public.weekly_targets FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students can view targets assigned to them or their batch
CREATE POLICY "Students can view their own weekly_targets"
ON public.weekly_targets FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.batch = weekly_targets.batch
  )
);

-- Super Admins can see everything
CREATE POLICY "Super Admins can do everything on weekly_targets"
ON public.weekly_targets FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_weekly_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_targets_updated_at
  BEFORE UPDATE ON public.weekly_targets
  FOR EACH ROW EXECUTE FUNCTION update_weekly_targets_updated_at();


-- ==========================================
-- MIGRATION: 041_fix_weekly_targets_rls.sql
-- ==========================================

-- ============================================================
-- MASTER FIX: Open RLS Policies for Custom Auth App
-- ============================================================
-- This app uses custom auth (localStorage), NOT Supabase Auth.
-- Therefore auth.uid() is always NULL, and strict RLS blocks all writes.
-- We apply the same open-policy pattern used throughout the project.
-- ============================================================

-- 1. WEEKLY TARGETS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage their own weekly_targets" ON public.weekly_targets;
DROP POLICY IF EXISTS "Students can view their own weekly_targets" ON public.weekly_targets;
DROP POLICY IF EXISTS "Super Admins can do everything on weekly_targets" ON public.weekly_targets;
DROP POLICY IF EXISTS "Allow all on weekly_targets" ON public.weekly_targets;

ALTER TABLE public.weekly_targets DISABLE ROW LEVEL SECURITY;


-- 2. WEEKLY REPORTS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Super Admins can do everything on weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Teachers can manage their own weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Admins can view weekly_reports if enabled" ON public.weekly_reports;
DROP POLICY IF EXISTS "Allow all on weekly_reports" ON public.weekly_reports;

ALTER TABLE public.weekly_reports DISABLE ROW LEVEL SECURITY;


-- 3. ADMIN MENU CONFIG
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow super admin to manage admin_menu_config" ON public.admin_menu_config;
DROP POLICY IF EXISTS "Allow all to view admin_menu_config" ON public.admin_menu_config;

ALTER TABLE public.admin_menu_config DISABLE ROW LEVEL SECURITY;


-- 4. PROFILES (already has open policy but let's confirm)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon insert profiles" ON public.profiles;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;


-- 5. Make sure weekly_targets table exists with correct schema
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'batch' CHECK (target_type = ANY (ARRAY['personal'::text, 'batch'::text])),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch text,
  title text NOT NULL,
  description text,
  material_ids uuid[] DEFAULT '{}'::uuid[],
  custom_content text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_targets_pkey PRIMARY KEY (id)
);


-- ==========================================
-- MIGRATION: 042_quiz_guru
-- ==========================================

-- 1. Buat tabel kontrol akses kuis
create table if not exists quiz_access_controls (
  id uuid default gen_random_uuid() primary key,
  batch text,
  student_id uuid references profiles(id),
  material_id uuid references study_materials(id) not null,
  is_active boolean default false,
  teacher_id uuid references profiles(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Aktifkan Row Level Security (RLS)
alter table quiz_access_controls enable row level security;

-- 3. Berikan akses (Policy) agar guru & murid bisa membaca/menulis data
create policy "Allow all access for now" on quiz_access_controls
  for all using (true) with check (true);

-- 4. Tambahkan batasan agar tidak ada data duplikat per batch/siswa
create unique index if not exists quiz_access_batch_idx on quiz_access_controls (batch, material_id) where batch is not null;
create unique index if not exists quiz_access_student_idx on quiz_access_controls (student_id, material_id) where student_id is not null;


-- jika eror

-- 1. Hapus index lama jika ada
drop index if exists quiz_access_batch_idx;
drop index if exists quiz_access_student_idx;

-- 2. Tambahkan UNIQUE CONSTRAINT resmi
-- Ini memungkinkan sistem melakukan 'upsert' (update jika sudah ada, insert jika belum)
alter table quiz_access_controls 
add constraint quiz_access_batch_unique unique (batch, material_id);

alter table quiz_access_controls 
add constraint quiz_access_student_unique unique (student_id, material_id);


