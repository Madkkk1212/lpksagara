-- ============================================================
-- LUMA JLPT — Database Migration 012
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
