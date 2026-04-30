-- ============================================================
-- MASTER FIX: Open RLS Policies for Custom Auth App
-- ============================================================
-- This app uses custom auth (localStorage), NOT Supabase Auth.
-- Therefore auth.uid() is always NULL, and strict RLS blocks all writes.
-- We apply the same open-policy pattern used throughout the project.
-- ============================================================

-- 1. WEEKLY TARGETS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Teachers can manage their own weekly_targets" ON public.weekly_targets;
DROP POLICY IF EXISTS "Students can view their own weekly_targets" ON public.weekly_targets;
DROP POLICY IF EXISTS "Super Admins can do everything on weekly_targets" ON public.weekly_targets;
DROP POLICY IF EXISTS "Allow all on weekly_targets" ON public.weekly_targets;

ALTER TABLE public.weekly_targets DISABLE ROW LEVEL SECURITY;


-- 2. WEEKLY REPORTS
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Super Admins can do everything on weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Teachers can manage their own weekly_reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Admins can view weekly_reports if enabled" ON public.weekly_reports;
DROP POLICY IF EXISTS "Allow all on weekly_reports" ON public.weekly_reports;

ALTER TABLE public.weekly_reports DISABLE ROW LEVEL SECURITY;


-- 3. ADMIN MENU CONFIG
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow super admin to manage admin_menu_config" ON public.admin_menu_config;
DROP POLICY IF EXISTS "Allow all to view admin_menu_config" ON public.admin_menu_config;

ALTER TABLE public.admin_menu_config DISABLE ROW LEVEL SECURITY;


-- 4. PROFILES (already has open policy but let's confirm)
-- -------------------------------------------------------
DROP POLICY IF EXISTS "Allow service role full access" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow anon insert profiles" ON public.profiles;

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;


-- 5. Make sure weekly_targets table exists with correct schema
-- -------------------------------------------------------
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
