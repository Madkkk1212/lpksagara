-- ============================================================
-- LUMA JLPT — Database Migration 001
-- Paste seluruh script ini ke Supabase SQL Editor lalu klik Run
-- ============================================================

-- TABLE: app_theme (single-row config)
CREATE TABLE IF NOT EXISTS app_theme (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  app_name text DEFAULT 'Luma JLPT',
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
