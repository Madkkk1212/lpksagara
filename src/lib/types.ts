export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface AppTheme {
  id: string
  app_name: string
  tagline: string
  logo_text: string
  header_use_logo_image: boolean
  header_logo_url: string
  primary_color: string
  accent_color: string
  bg_gradient_from: string
  bg_gradient_to: string
  card_bg: string
  text_primary: string
  text_secondary: string
  nav_bg: string
  nav_active_color: string
  button_primary_bg: string
  button_primary_text: string
  splash_gradient_from: string
  splash_gradient_to: string
  favicon_url: string
  social_instagram: string | null
  social_twitter: string | null
  social_website: string | null
  updated_at: string
}

export interface BannerSlide {
  id: string
  image_url: string
  title: string
  subtitle: string | null
  cta_text: string | null
  badge_text: string | null
  badge_color: string | null
  title_color: string | null
  overlay_color: string | null
  overlay_opacity: number | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MaterialCategory {
  id: string
  name: string
  description: string | null
  badge_color: string | null
  icon_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  category_id: string
  slug: string
  title: string
  subtitle: string | null
  japanese_text: string | null
  indonesian_text: string | null
  example_sentence: string | null
  is_locked: boolean
  icon_url: string | null
  card_accent_color: string | null
  tag_color: string | null
  detail_content: Json | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ExamLevel {
  id: string
  level_code: string
  title: string
  description: string | null
  gradient_from: string | null
  gradient_to: string | null
  badge_color: string | null
  icon_url: string | null
  is_locked: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ExamTest {
  id: string
  level_id: string
  category: 'full' | 'mini' | 'skill'
  title: string
  duration_minutes: number
  pass_point: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  test_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: number
  explanation: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id?: string
  email: string
  full_name: string
  gender: 'Laki-laki' | 'Perempuan'
  phone: string
  is_admin: boolean
  is_premium: boolean
  unlocked_materials: string[] | null
  unlocked_levels: string[] | null
  created_at?: string
  updated_at?: string
}

export interface StudyLevel {
  id: string
  level_code: string
  title: string
  description: string | null
  category_id: string | null
  badge_color: string | null
  icon_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface StudyChapter {
  id: string
  level_id: string
  title: string
  description: string | null
  sort_order: number
  is_locked: boolean
  icon_url: string | null
  created_at: string
  updated_at: string
}

export interface StudyMaterial {
  id: string
  chapter_id: string
  material_type: 'moji_goi' | 'bunpou' | 'dokkai' | 'choukai' | 'quiz'
  title: string
  content: Json
  sort_order: number
  icon_url: string | null
  is_locked: boolean
  created_at: string
  updated_at: string
}

export interface IconCategory {
  id: string
  name: string
  created_at: string
}

export interface IconLibraryItem {
  id: string
  category_id: string
  url: string
  created_at: string
}
