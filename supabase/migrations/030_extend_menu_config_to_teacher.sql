-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 030
-- System Role: Extend Menu Config to Teacher Hub
-- ============================================================

-- 1. Add scope column to distinguish between dashboards
ALTER TABLE admin_menu_config 
ADD COLUMN IF NOT EXISTS scope text DEFAULT 'admin';

-- 2. Seed Teacher Hub Menus
INSERT INTO admin_menu_config (tab_id, label, icon, sort_order, scope) VALUES
('students', '👥 Data Siswa', '', 1, 'teacher'),
('proposals', '📝 Usul Konten', '', 2, 'teacher')
ON CONFLICT (tab_id) DO NOTHING;

-- 3. Update existing records to ensure they have the 'admin' scope
UPDATE admin_menu_config SET scope = 'admin' WHERE scope IS NULL;
