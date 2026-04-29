-- Migration: Fix chapter_id, Create settings table, AND add level_id to grades

-- 1. Create the missing settings table
CREATE TABLE IF NOT EXISTS public.assessment_report_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    level_id uuid NOT NULL,
    additional_columns jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT assessment_report_settings_pkey PRIMARY KEY (id),
    CONSTRAINT assessment_report_settings_level_id_key UNIQUE (level_id),
    CONSTRAINT assessment_report_settings_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id) ON DELETE CASCADE
);

ALTER TABLE public.assessment_report_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on assessment_report_settings" ON public.assessment_report_settings FOR ALL USING (true);

-- 2. Add level_id to grades table if missing
-- This is crucial for manual/additional materials not linked to a chapter
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='assessment_chapter_grades' AND column_name='level_id') THEN
        ALTER TABLE public.assessment_chapter_grades ADD COLUMN level_id uuid REFERENCES public.study_levels(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Make chapter_id nullable in templates
ALTER TABLE public.assessment_chapter_templates ALTER COLUMN chapter_id DROP NOT NULL;

-- 4. Update the unique constraint for chapter templates
ALTER TABLE public.assessment_chapter_templates DROP CONSTRAINT IF EXISTS assessment_chapter_templates_unique;
DROP INDEX IF EXISTS assessment_chapter_templates_unified_unique_idx;

CREATE UNIQUE INDEX assessment_chapter_templates_unified_unique_idx 
ON public.assessment_chapter_templates (level_id, COALESCE(chapter_id, '00000000-0000-0000-0000-000000000000'), chapter_title);

-- 5. Finalize Grades Uniqueness for Upsert
DROP INDEX IF EXISTS assessment_grades_chapter_idx;
DROP INDEX IF EXISTS assessment_grades_additional_idx;

CREATE UNIQUE INDEX assessment_grades_chapter_idx ON public.assessment_chapter_grades (student_email, column_label, template_id) WHERE template_id IS NOT NULL;
CREATE UNIQUE INDEX assessment_grades_additional_idx ON public.assessment_chapter_grades (student_email, column_label, level_id) WHERE template_id IS NULL;
