-- Migration 039: Add metadata to study_materials for better asset management
ALTER TABLE study_materials
ADD COLUMN IF NOT EXISTS file_size BIGINT, -- Size in bytes
ADD COLUMN IF NOT EXISTS storage_provider TEXT; -- 'cloudinary' or 'supabase'

COMMENT ON COLUMN study_materials.file_size IS 'Exact file size in bytes for the associated media';
COMMENT ON COLUMN study_materials.storage_provider IS 'The service used to host the media asset';
