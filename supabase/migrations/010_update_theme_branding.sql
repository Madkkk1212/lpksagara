-- ============================================================
-- LUMA JLPT — Database Migration 010
-- Add favicon_url to app_theme
-- ============================================================

ALTER TABLE app_theme 
ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT 'https://nextjs.org/favicon.ico';
