-- ============================================================
-- SAGARA LEARNING SYSTEM — Database Migration 037
-- Default Supporting Data Fields for Students & Alumni
-- ============================================================

-- Insert default fields for onboarding
INSERT INTO user_profile_fields (name, type, is_required, target_role, sort_order)
VALUES 
    ('Foto KTP / Kartu Identitas', 'file', true, 'all', 10),
    ('Pas Foto 3x4 (Background Merah/Biru)', 'file', true, 'student', 20),
    ('CV / Riwayat Hidup Terbaru', 'file', true, 'alumni', 30),
    ('Sertifikat Kemampuan Bahasa (JLPT/NAT)', 'file', false, 'all', 40),
    ('Bukti Pembayaran / Slip Gaji', 'file', false, 'standard', 50)
ON CONFLICT DO NOTHING;
