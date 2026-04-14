-- ============================================================
-- LUMA JLPT — Database Migration 009
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
