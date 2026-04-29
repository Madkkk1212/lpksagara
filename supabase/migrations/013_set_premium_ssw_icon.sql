-- ============================================================
-- LUMA JLPT — Database Migration 013
-- Set Premium Icon for SSW Category
-- ============================================================

-- Use a higher quality professional worker icon from Icons8 set
UPDATE material_categories 
SET icon_url = 'https://img.icons8.com/color/144/construction-worker--v1.png' 
WHERE name = 'SSW';

UPDATE material_categories 
SET icon_url = 'https://img.icons8.com/color/144/japan.png' 
WHERE name = 'JLPT';
