-- ============================================================
-- LUMA JLPT — Database Migration 006
-- Icon Library & Picker System
-- ============================================================

CREATE TABLE IF NOT EXISTS icon_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- disable RLS
ALTER TABLE icon_categories DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS icon_library (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid REFERENCES icon_categories(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- disable RLS
ALTER TABLE icon_library DISABLE ROW LEVEL SECURITY;
