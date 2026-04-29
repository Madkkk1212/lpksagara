-- ============================================================
-- LUMA JLPT — Database Migration 003
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
