-- Migration: Add custom type names mapping and active toggle to material categories
ALTER TABLE material_categories ADD COLUMN IF NOT EXISTS custom_type_names jsonb DEFAULT '{}'::jsonb;
ALTER TABLE material_categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
