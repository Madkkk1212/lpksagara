-- Migration: Add audio_url column to study_materials table to fix DB fetch errors
ALTER TABLE public.study_materials
ADD COLUMN IF NOT EXISTS audio_url TEXT;
