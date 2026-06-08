-- Centralized system monitoring for Super Admin.
-- Run this migration in Supabase before relying on persisted monitoring data.

CREATE TABLE IF NOT EXISTS public.system_error_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  source text NOT NULL DEFAULT 'frontend',
  error_type text NOT NULL DEFAULT 'unknown',
  message text NOT NULL DEFAULT '',
  stack_trace text,
  page text,
  url text,
  api_endpoint text,
  api_method text,
  status_code integer,
  request_payload jsonb,
  response_payload jsonb,
  user_id text,
  user_name text,
  user_email text,
  user_role text,
  browser text,
  device text,
  user_agent text,
  ip_address text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_error_logs_created_at ON public.system_error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_status ON public.system_error_logs (status);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_severity ON public.system_error_logs (severity);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_user_email ON public.system_error_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_error_type ON public.system_error_logs (error_type);
CREATE INDEX IF NOT EXISTS idx_system_error_logs_page ON public.system_error_logs (page);

ALTER TABLE public.system_error_logs DISABLE ROW LEVEL SECURITY;
