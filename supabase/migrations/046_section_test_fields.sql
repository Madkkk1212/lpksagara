-- ============================================================
-- LUMA JLPT — Database Migration 046
-- Section-based CBT testing and essay grading parameters
-- ============================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_title text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_instructions text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_audio_url text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_image_url text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_pdf_url text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_ppt_url text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_video_url text DEFAULT NULL;

-- Support additional modern formats
ALTER TABLE questions ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS rubric text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS audio_play_limit integer DEFAULT 0;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS autoplay boolean DEFAULT false;
