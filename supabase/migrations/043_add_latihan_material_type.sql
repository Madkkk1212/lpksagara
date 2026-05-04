-- Add 'latihan' to material_type enum/check constraint
-- Since Supabase might be using a check constraint on the text column:

-- 1. First, check if the constraint exists and drop it if it does
-- (Based on migration 003 or 034, it's likely a check constraint)

ALTER TABLE study_materials DROP CONSTRAINT IF EXISTS study_materials_material_type_check;

ALTER TABLE study_materials ADD CONSTRAINT study_materials_material_type_check 
CHECK (material_type = ANY (ARRAY['moji_goi'::text, 'bunpou'::text, 'dokkai'::text, 'choukai'::text, 'quiz'::text, 'latihan'::text]));
