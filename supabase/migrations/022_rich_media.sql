-- Add rich media support to questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Update question_type to support image and video types too
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions
ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('multiple_choice', 'listening', 'reading', 'image_based', 'video_based'));

-- Add video support to study_materials
ALTER TABLE study_materials
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for media (run this in Supabase dashboard if SQL doesn't work)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
