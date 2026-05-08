-- Migration 047: Remedial Quiz Support
-- Tambahkan kolom is_remedial ke quiz_access_controls
-- Saat guru membuka akses dengan is_remedial = true, nilai murid disimpan 
-- sebagai kolom terpisah "(Remedial)" di assessment_chapter_grades

ALTER TABLE quiz_access_controls
ADD COLUMN IF NOT EXISTS is_remedial boolean DEFAULT false;

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_quiz_access_remedial 
ON quiz_access_controls (material_id, student_id, is_remedial);
