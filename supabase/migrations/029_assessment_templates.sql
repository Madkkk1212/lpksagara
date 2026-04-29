-- Assessment Template System
-- Allows Admin to define the structure (sections + columns) of grading rubrics

-- Main template table: one row per "rubric"
CREATE TABLE IF NOT EXISTS public.assessment_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- e.g. "Rapor N5 2024"
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_templates_pkey PRIMARY KEY (id)
);

-- Sections (rows of the rubric)
CREATE TABLE IF NOT EXISTS public.assessment_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  label text NOT NULL,                         -- e.g. "Moji-Goi (Kosakata)"
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_sections_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_sections_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE
);

-- Columns (columns of the rubric)
CREATE TABLE IF NOT EXISTS public.assessment_columns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  label text NOT NULL,                         -- e.g. "Nilai", "Predikat", "Keterangan"
  col_type text DEFAULT 'text' CHECK (col_type = ANY (ARRAY['text','number','grade','select'])),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_columns_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_columns_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_templates(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_columns ENABLE ROW LEVEL SECURITY;

-- Policies: read by all authenticated users, write by admin
CREATE POLICY "Allow read assessment_templates" ON public.assessment_templates FOR SELECT USING (true);
CREATE POLICY "Allow all assessment_templates" ON public.assessment_templates FOR ALL USING (true);

CREATE POLICY "Allow read assessment_sections" ON public.assessment_sections FOR SELECT USING (true);
CREATE POLICY "Allow all assessment_sections" ON public.assessment_sections FOR ALL USING (true);

CREATE POLICY "Allow read assessment_columns" ON public.assessment_columns FOR SELECT USING (true);
CREATE POLICY "Allow all assessment_columns" ON public.assessment_columns FOR ALL USING (true);
