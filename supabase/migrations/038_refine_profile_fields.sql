-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 038
-- Refine Supporting Data Fields & Type Constraints
-- ============================================================

-- 1. Remove redundant/unused fields
DELETE FROM user_profile_fields 
WHERE name IN ('Pas Foto 3x4 (Background Merah/Biru)', 'Sertifikat Kemampuan Bahasa (JLPT/NAT)');

-- 2. Update allowed file types for existing file-based fields
UPDATE user_profile_fields 
SET allowed_file_types = ARRAY['jpg', 'jpeg', 'png', 'pdf']
WHERE type = 'file';

-- 3. Add new text/number based fields for testing and better data gathering
INSERT INTO user_profile_fields (name, type, is_required, target_role, sort_order)
VALUES 
    ('ID Instagram / Telegram', 'text', false, 'all', 60),
    ('Nomor Rekening Bank (BCA/Mandiri/Lainnya)', 'text', false, 'alumni', 70)
ON CONFLICT DO NOTHING;
