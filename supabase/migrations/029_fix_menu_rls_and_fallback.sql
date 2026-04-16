-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 029
-- System Role: Fix Menu RLS & Persistence
-- ============================================================

-- 1. Disable RLS on admin_menu_config 
-- This ensures the custom Staff Gateway can save changes 
-- without needing a standard Supabase Auth session.
ALTER TABLE admin_menu_config DISABLE ROW LEVEL SECURITY;

-- 2. Ensure all existing menus are properly initialized
-- (Sanity check to make sure they are NOT all stuck in one state)
UPDATE admin_menu_config SET is_active = true WHERE is_active IS NULL;
