-- Migration: Final Fix for assessment_chapter_grades uniqueness
-- Use a unified unique index that handles NULL values properly for upsert operations

-- 1. Remove old indexes/constraints
DROP INDEX IF EXISTS public.assessment_chapter_grades_unique_idx;
DROP INDEX IF EXISTS public.assessment_chapter_grades_template_unique_idx;
ALTER TABLE public.assessment_chapter_grades DROP CONSTRAINT IF EXISTS assessment_chapter_grades_unique;

-- 2. Create a unified unique index using COALESCE to handle NULLs
-- This ensures (student, label, template, null) and (student, label, null, level) are both uniquely identifiable
CREATE UNIQUE INDEX assessment_chapter_grades_upsert_idx ON public.assessment_chapter_grades (
  student_email, 
  column_label, 
  (COALESCE(template_id, '00000000-0000-0000-0000-000000000000'::uuid)),
  (COALESCE(level_id, '00000000-0000-0000-0000-000000000000'::uuid))
);

-- Note: Supabase JS upsert works best with actual Constraints for the 'onConflict' parameter.
-- Let's try to use a standard unique constraint if possible, but PG 15 is required for NULLS NOT DISTINCT.
-- As a fallback for older PG, we'll use partial unique indexes but call them separately in JS.

DROP INDEX IF EXISTS public.assessment_chapter_grades_upsert_idx;

-- Final approach: Two clean partial indexes
CREATE UNIQUE INDEX assessment_grades_chapter_idx ON public.assessment_chapter_grades (student_email, column_label, template_id) WHERE template_id IS NOT NULL;
CREATE UNIQUE INDEX assessment_grades_additional_idx ON public.assessment_chapter_grades (student_email, column_label, level_id) WHERE template_id IS NULL;
