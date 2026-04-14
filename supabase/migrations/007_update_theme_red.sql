-- ============================================================
-- LUMA JLPT — Database Migration 007
-- Update Application Theme to Premium Red
-- ============================================================

-- Menghapus "WHERE id = ..." karena app_theme dirancang sebagai tabel baris tunggal (satu row konfigurasi)
UPDATE app_theme
SET 
  primary_color = '#dc2626',      -- Red 600
  accent_color = '#b91c1c',       -- Red 700
  bg_gradient_from = '#fee2e2',   -- Red 100
  bg_gradient_to = '#fef2f2',     -- Red 50
  splash_gradient_from = '#ef4444', -- Red 500
  splash_gradient_to = '#991b1b',   -- Red 800
  nav_active_color = '#dc2626',
  button_primary_bg = '#dc2626';
