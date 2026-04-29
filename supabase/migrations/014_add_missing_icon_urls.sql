-- ============================================================
-- LUMA JLPT — Database Migration 014
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
