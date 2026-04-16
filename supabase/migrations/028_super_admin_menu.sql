-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 028
-- System Role: Superduper Admin & Dynamic Menu Config
-- ============================================================

-- 1. Add is_super_admin column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- 2. Create Admin Menu Configuration Table
CREATE TABLE IF NOT EXISTS admin_menu_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tab_id text UNIQUE NOT NULL,
    label text NOT NULL,
    icon text NOT NULL,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on admin_menu_config
ALTER TABLE admin_menu_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (needed for filtering tabs during login)
CREATE POLICY "Allow anyone to read menu config" 
ON admin_menu_config FOR SELECT 
USING (true);

-- Only Super Admins can modify
CREATE POLICY "Only super admins can modify menu config" 
ON admin_menu_config FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_super_admin = true
    )
);

-- 4. Seed Initial Menu Config (Based on AdminClient.tsx tabs)
INSERT INTO admin_menu_config (tab_id, label, icon, sort_order) VALUES
('dashboard', 'Dashboard', '📊', 1),
('reports', 'Laporan', '📈', 2),
('announcements', 'Pengumuman', '📢', 3),
('bulk-import', 'Bulk Import', '🚀', 4),
('icons', 'Icons Gallery', '✨', 5),
('theme', 'Theme', '🎨', 6),
('banners', 'Banners', '🖼️', 7),
('materials', 'Materials', '📚', 8),
('exams', 'Exams', '🎯', 9),
('users', 'Users', '👥', 10),
('proposals', 'Usulan Guru', '📝', 11),
('settings', 'Settings', '⚙️', 12)
ON CONFLICT (tab_id) DO NOTHING;

-- 5. Create Superduper Admin Profile
-- Note: In a real app, this should be done via Auth or a secure setup.
-- We use a known email and set is_super_admin = true.
-- You will need to login with this email.
INSERT INTO profiles (email, full_name, gender, phone, is_admin, is_super_admin, staff_password, exp, level)
VALUES ('owner@sagara.app', 'Sagara Owner', 'Laki-laki', '+62000000000', true, true, 'sagara-boss-secret', 0, 1)
ON CONFLICT (email) DO UPDATE SET is_super_admin = true, staff_password = 'sagara-boss-secret';
