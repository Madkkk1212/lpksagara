-- Migration: Create student_presence table for real-time user tracking
CREATE TABLE IF NOT EXISTS public.student_presence (
  student_email TEXT PRIMARY KEY,
  student_name TEXT,
  current_path TEXT NOT NULL DEFAULT '/',
  device TEXT,
  browser TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast sorting of active users
CREATE INDEX IF NOT EXISTS idx_student_presence_last_active_at ON public.student_presence(last_active_at DESC);

-- Enable RLS
ALTER TABLE public.student_presence ENABLE ROW LEVEL SECURITY;

-- Allow read access for all
CREATE POLICY "Allow read presence for all" ON public.student_presence FOR SELECT USING (true);

-- Allow insert/update access for all
CREATE POLICY "Allow insert presence for all" ON public.student_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update presence for all" ON public.student_presence FOR UPDATE USING (true);

-- Enable Supabase Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE student_presence;
