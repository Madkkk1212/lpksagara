-- Migration: Add browser, device, and user_agent fields to exam_violations table
ALTER TABLE public.exam_violations
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS device TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;
