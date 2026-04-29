-- ============================================================
-- LUMA JLPT — Database Migration 011
-- Add icon_url to material_categories
-- ============================================================

ALTER TABLE material_categories 
ADD COLUMN IF NOT EXISTS icon_url text;

-- Update existing sample data if needed
UPDATE material_categories SET icon_url = 'https://img.icons8.com/color/96/japan.png' WHERE name = 'JLPT';
UPDATE material_categories SET icon_url = 'https://img.icons8.com/color/96/worker.png' WHERE name = 'SSW';
