-- Migration: Create Weekly Reports Table and monitoring settings
-- Table for teachers to submit their weekly progress reports

CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    batch text NOT NULL,
    title text NOT NULL,
    content text NOT NULL, -- Detailed report content
    obstacles text, -- Challenges faced during the week
    suggestions text, -- Proposed solutions or next steps
    report_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT weekly_reports_pkey PRIMARY KEY (id)
);

-- Add column to app_theme for visibility control
ALTER TABLE public.app_theme ADD COLUMN IF NOT EXISTS show_weekly_reports_to_admin boolean DEFAULT false;

-- Enable RLS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Super Admins can do everything on weekly_reports"
ON public.weekly_reports FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

CREATE POLICY "Teachers can manage their own weekly_reports"
ON public.weekly_reports FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Admins can view weekly_reports if enabled"
ON public.weekly_reports FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) AND EXISTS (
    SELECT 1 FROM public.app_theme
    WHERE app_theme.show_weekly_reports_to_admin = true
  )
);
