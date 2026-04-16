-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 027
-- Add Cloudinary Settings for Media Optimization
-- ============================================================

-- 1. Add Cloudinary columns to app_theme
ALTER TABLE app_theme 
ADD COLUMN IF NOT EXISTS cloudinary_cloud_name TEXT,
ADD COLUMN IF NOT EXISTS cloudinary_upload_preset TEXT;

-- 2. Add description for tracking in Admin panel (optional but good for context)
COMMENT ON COLUMN app_theme.cloudinary_cloud_name IS 'Cloudinary Cloud Name for automatic media optimization';
COMMENT ON COLUMN app_theme.cloudinary_upload_preset IS 'Cloudinary Unsigned Upload Preset for secure client-side uploads';
