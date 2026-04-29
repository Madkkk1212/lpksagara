-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 031
-- System Role: Resolve Menu ID Conflict between Admin & Teacher
-- ============================================================

-- 1. Remove the old unique constraint on tab_id
-- We need to find the constraint name first. In Supabase/Postgres, 
-- it's usually table_column_key.
ALTER TABLE admin_menu_config DROP CONSTRAINT IF EXISTS admin_menu_config_tab_id_key;

-- 2. Add a new composite unique constraint (tab_id + scope)
-- This allows 'proposals' to exist in both 'admin' and 'teacher' scopes.
ALTER TABLE admin_menu_config ADD CONSTRAINT admin_menu_config_tab_scope_unique UNIQUE (tab_id, scope);

-- 3. Re-seed Teacher Menus (They will now succeed)
INSERT INTO admin_menu_config (tab_id, label, icon, sort_order, scope) VALUES
('students', '👥 Data Siswa', '', 1, 'teacher'),
('proposals', '📝 Usul Konten', '', 2, 'teacher')
ON CONFLICT (tab_id, scope) DO UPDATE SET 
    label = EXCLUDED.label,
    icon = EXCLUDED.icon;
