-- Migration: Add Laporan Penilaian to Teacher Menu Configuration
-- Ensures the menu item is visible in the Teacher Dashboard using a safe Delete/Insert pattern

-- 1. Remove existing entry if any to prevent duplicates without needing a unique constraint
DELETE FROM public.admin_menu_config WHERE tab_id = 'grading' AND scope = 'teacher';

-- 2. Insert the new menu configuration
INSERT INTO public.admin_menu_config (tab_id, label, icon, is_active, scope, sort_order)
VALUES ('grading', '📝 Laporan Penilaian', 'FileText', true, 'teacher', 3);
