-- ============================================================
-- LUMA JLPT — Database Migration 004
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
