-- Migration: Create Weekly Targets Table
-- Table for teachers to assign weekly material targets to students/batches

CREATE TABLE IF NOT EXISTS public.weekly_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL DEFAULT 'batch' CHECK (target_type = ANY (ARRAY['personal'::text, 'batch'::text])),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  batch text,
  title text NOT NULL,
  description text,
  material_ids uuid[] DEFAULT '{}'::uuid[],
  custom_content text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT weekly_targets_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.weekly_targets ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own targets
CREATE POLICY "Teachers can manage their own weekly_targets"
ON public.weekly_targets FOR ALL TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students can view targets assigned to them or their batch
CREATE POLICY "Students can view their own weekly_targets"
ON public.weekly_targets FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.batch = weekly_targets.batch
  )
);

-- Super Admins can see everything
CREATE POLICY "Super Admins can do everything on weekly_targets"
ON public.weekly_targets FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_weekly_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_targets_updated_at
  BEFORE UPDATE ON public.weekly_targets
  FOR EACH ROW EXECUTE FUNCTION update_weekly_targets_updated_at();
