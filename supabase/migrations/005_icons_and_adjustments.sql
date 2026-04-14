-- ============================================================
-- LUMA JLPT — Database Migration 005
-- Base64 Icon URL columns
-- ============================================================

ALTER TABLE study_levels ADD COLUMN IF NOT EXISTS icon_url text DEFAULT '';
ALTER TABLE study_chapters ADD COLUMN IF NOT EXISTS icon_url text DEFAULT '';
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS icon_url text DEFAULT '';
