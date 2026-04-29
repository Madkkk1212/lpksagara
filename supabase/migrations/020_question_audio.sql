-- Add audio_url and question_type fields to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'multiple_choice';
-- Types: 'multiple_choice', 'listening', 'reading'
