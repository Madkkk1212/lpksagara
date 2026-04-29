-- Assessment Chapter Report System
-- Super Admin generates per-chapter (bab) assessment templates
-- Teachers fill in grades; report auto-generates from chapter structure

-- Table: Chapter-based assessment template (one per level)
-- Each record links a study_chapter to a set of column definitions
CREATE TABLE IF NOT EXISTS public.assessment_chapter_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL,
  chapter_id uuid NOT NULL,                        -- linked to study_chapters
  chapter_title text NOT NULL,                     -- snapshot of chapter title
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,      -- [{label, col_type}]
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_chapter_templates_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_chapter_templates_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_templates_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.study_chapters(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_templates_unique UNIQUE (level_id, chapter_id)
);

-- Table: Grades entered by teacher per student per chapter column
CREATE TABLE IF NOT EXISTS public.assessment_chapter_grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  student_email text NOT NULL,
  column_label text NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_chapter_grades_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_chapter_grades_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_chapter_templates(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_grades_unique UNIQUE (template_id, student_email, column_label)
);

-- Enable RLS
ALTER TABLE public.assessment_chapter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_chapter_grades ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read chapter templates" ON public.assessment_chapter_templates FOR SELECT USING (true);
CREATE POLICY "Allow all chapter templates" ON public.assessment_chapter_templates FOR ALL USING (true);

CREATE POLICY "Allow read chapter grades" ON public.assessment_chapter_grades FOR SELECT USING (true);
CREATE POLICY "Allow all chapter grades" ON public.assessment_chapter_grades FOR ALL USING (true);
