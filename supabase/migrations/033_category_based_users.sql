-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 033
-- Category-Based User Tracks & Specific Onboarding Fields
-- ============================================================

-- 1. Add category_id to profiles (Track assigned by Admin)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES material_categories(id) ON DELETE SET NULL;

-- 2. Add category_id to user_profile_fields (Fields specific to a Track)
-- If category_id is NULL, the field is "Global" (required for everyone)
ALTER TABLE user_profile_fields 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES material_categories(id) ON DELETE CASCADE;

-- 3. Update RLS (already enabled, just making sure new columns are accessible)
-- policies from 032 already use 'true' for select, so they will see new columns.

-- 4. Seed example: Create a track and a track-specific field
DO $$
DECLARE 
    track_id uuid;
BEGIN
    -- Only seed if categories exist
    SELECT id INTO track_id FROM material_categories LIMIT 1;
    
    IF track_id IS NOT NULL THEN
        -- Add a field specific to the first category found
        INSERT INTO user_profile_fields (name, type, is_required, category_id, sort_order)
        VALUES ('Sertifikat Khusus Track', 'file', true, track_id, 100)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
