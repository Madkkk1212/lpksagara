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
  cloudinary_cloud_name: string | null
  cloudinary_upload_preset: string | null
  nip_prefix: string | null
  ai_sensei_active: boolean | null
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
  question_type: 'multiple_choice' | 'listening' | 'reading' | 'image_based' | 'video_based'
  question_text: string
  audio_url?: string | null
  image_url?: string | null
  video_url?: string | null
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
  is_super_admin?: boolean
  is_teacher: boolean
  is_premium: boolean
  staff_password?: string | null
  password?: string | null
  unlocked_materials: string[] | null
  unlocked_levels: string[] | null
  exp: number
  level: number
  target_level: string | null
  avatar_url: string | null
  birth_date?: string | null
  current_streak?: number
  longest_streak?: number
  last_activity_at?: string | null
  created_at?: string
  address?: string | null
  institution?: string | null
  certificate_url?: string | null
  profile_completed?: boolean
  is_alumni?: boolean
  is_student?: boolean
  batch?: string | null
  nip?: string | null
  category_id?: string | null
  nickname?: string | null
  updated_at?: string
}

export interface ProfileField {
  id: string
  name: string
  type: 'text' | 'number' | 'file'
  is_required: boolean
  allowed_file_types: string[] | null
  category_id: string | null
  target_role: 'admin' | 'teacher' | 'premium' | 'standard' | 'alumni' | 'student' | 'all'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProfileValue {
  id: string
  user_id: string
  field_id: string
  value: string
  created_at: string
  updated_at: string
}

export interface StudyLevel {
  id: string
  level_code: string
  name: string
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
  video_url: string | null
  audio_url?: string | null
  image_url: string | null
  file_size?: number | null
  storage_provider?: string | null
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
  id: string;
  category_id: string;
  url: string;
  created_at: string;
}

export interface AdminMenuConfig {
  id: string;
  tab_id: string;
  label: string;
  icon: string;
  is_active: boolean;
  scope?: 'admin' | 'teacher';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WeeklyTarget {
  id: string;
  teacher_id: string;
  target_type: 'personal' | 'batch';
  student_id: string | null;
  batch: string | null;
  title: string;
  description: string | null;
  material_ids: string[];
  custom_content: string | null;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface WeeklyReport {
  id: string;
  teacher_id: string;
  batch: string;
  title: string;
  content: string;
  obstacles: string | null;
  suggestions: string | null;
  report_date: string;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string };
}

export interface StudentBatch {
  id: string;
  name: string;
  description: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
}

export interface ColDef {
  label: string;
  col_type: 'number' | 'text' | 'date' | 'boolean' | 'grade';
}

export interface ChapterTemplate {
  id?: string;
  level_id: string;
  title?: string;
  chapter_id?: string;
  chapter_title?: string;
  sort_order: number;
  columns: ColDef[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdditionalCol {
  id: string;
  level_id?: string;
  name: string;
  label?: string;
  sort_order?: number;
  position?: string;
  type?: string;
  calculation?: string;
  reference?: string;
  is_global?: boolean;
  created_at?: string;
  updated_at?: string;
}