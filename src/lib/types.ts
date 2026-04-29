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
  show_weekly_reports_to_admin: boolean | null
  gender: 'Laki-laki' | 'Perempuan'
  phone: string
  is_admin: boolean
  is_super_admin?: boolean
  is_teacher: boolean
  is_premium: boolean
  avatar_url?: string | null
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
  batch_id?: string | null
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
  image_url: string | null
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

export type ColDef = { 
  label: string; 
  col_type: "text" | "number" | "grade" 
};

export interface AdditionalCol {
  id: string;
  name: string;
  position: "before" | "after";
  reference?: string;
  type: "single" | "group";
  calculation?: "sum" | "average";
  is_global?: boolean;
}

export interface ChapterTemplate {
  id?: string;
  level_id: string;
  chapter_id: string;
  chapter_title: string;
  columns: ColDef[];
  sort_order: number;
  is_active: boolean;
}

export interface WeeklyReport {
  id?: string;
  teacher_id: string;
  batch: string;
  title: string;
  content: string;
  obstacles?: string;
  suggestions?: string;
  report_date: string;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    full_name: string;
  };
}
