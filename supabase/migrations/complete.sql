-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon_url text,
  points_reward integer DEFAULT 100,
  criteria_type text NOT NULL,
  criteria_value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_menu_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tab_id text NOT NULL,
  label text NOT NULL,
  icon text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  scope text DEFAULT 'admin'::text,
  CONSTRAINT admin_menu_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info'::text CHECK (type = ANY (ARRAY['info'::text, 'warning'::text, 'success'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT announcements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_theme (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  app_name text DEFAULT 'Luma JLPT'::text,
  tagline text DEFAULT 'Premium Japanese Study Experience'::text,
  logo_text text DEFAULT 'L'::text,
  primary_color text DEFAULT '#14b8a6'::text,
  accent_color text DEFAULT '#f59e0b'::text,
  bg_gradient_from text DEFAULT '#dff8f6'::text,
  bg_gradient_to text DEFAULT '#eff4f8'::text,
  card_bg text DEFAULT '#ffffff'::text,
  text_primary text DEFAULT '#0f172a'::text,
  text_secondary text DEFAULT '#64748b'::text,
  nav_bg text DEFAULT '#0f172a'::text,
  nav_active_color text DEFAULT '#2dd4bf'::text,
  button_primary_bg text DEFAULT '#0f172a'::text,
  button_primary_text text DEFAULT '#ffffff'::text,
  splash_gradient_from text DEFAULT '#14b8a6'::text,
  splash_gradient_to text DEFAULT '#f59e0b'::text,
  social_instagram text DEFAULT ''::text,
  social_twitter text DEFAULT ''::text,
  social_website text DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  header_use_logo_image boolean DEFAULT false,
  header_logo_url text DEFAULT ''::text,
  favicon_url text DEFAULT 'https://nextjs.org/favicon.ico'::text,
  cloudinary_cloud_name text,
  cloudinary_upload_preset text,
  nip_prefix text DEFAULT 'R'::text,
  ai_sensei_active boolean DEFAULT true,
  CONSTRAINT app_theme_pkey PRIMARY KEY (id)
);
CREATE TABLE public.assessment_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_id uuid UNIQUE,
  config_json jsonb NOT NULL DEFAULT '{"sections": []}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_configs_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_configs_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id)
);
CREATE TABLE public.assessment_chapter_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL,
  chapter_id uuid NOT NULL,
  chapter_title text NOT NULL,
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_chapter_templates_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_chapter_templates_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_templates_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.study_chapters(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_templates_unique UNIQUE (level_id, chapter_id)
);
CREATE TABLE public.assessment_chapter_grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  student_email text NOT NULL,
  column_label text NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT assessment_chapter_grades_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_chapter_grades_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.assessment_chapter_templates(id) ON DELETE CASCADE,
  CONSTRAINT assessment_chapter_grades_unique UNIQUE (template_id, student_email, column_label)
);
CREATE TABLE public.banner_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  image_url text NOT NULL DEFAULT ''::text,
  title text NOT NULL DEFAULT 'Belajar Bahasa Jepang'::text,
  subtitle text DEFAULT ''::text,
  cta_text text DEFAULT 'Mulai Belajar'::text,
  badge_text text DEFAULT 'Study Hub'::text,
  badge_color text DEFAULT '#10b981'::text,
  title_color text DEFAULT '#f97316'::text,
  overlay_color text DEFAULT '#111827'::text,
  overlay_opacity real DEFAULT 0.35,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT banner_slides_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exam_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text DEFAULT ''::text,
  gradient_from text DEFAULT '#14b8a6'::text,
  gradient_to text DEFAULT '#10b981'::text,
  badge_color text DEFAULT '#14b8a6'::text,
  is_locked boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  icon_url text,
  CONSTRAINT exam_levels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exam_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_id uuid,
  category text NOT NULL DEFAULT 'full'::text CHECK (category = ANY (ARRAY['full'::text, 'mini'::text, 'skill'::text])),
  title text NOT NULL,
  duration_minutes integer DEFAULT 60,
  pass_point integer DEFAULT 75,
  difficulty text DEFAULT 'Medium'::text CHECK (difficulty = ANY (ARRAY['Easy'::text, 'Medium'::text, 'Hard'::text])),
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_tests_pkey PRIMARY KEY (id),
  CONSTRAINT exam_tests_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.exam_levels(id)
);
CREATE TABLE public.icon_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT icon_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.icon_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT icon_library_pkey PRIMARY KEY (id),
  CONSTRAINT icon_library_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.icon_categories(id)
);
CREATE TABLE public.material_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  badge_color text DEFAULT '#14b8a6'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  icon_url text,
  CONSTRAINT material_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text DEFAULT ''::text,
  japanese_text text DEFAULT ''::text,
  indonesian_text text DEFAULT ''::text,
  example_sentence text DEFAULT ''::text,
  is_locked boolean DEFAULT false,
  card_accent_color text DEFAULT '#14b8a6'::text,
  tag_color text DEFAULT '#10b981'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  icon_url text,
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT ''::text,
  gender text DEFAULT 'Laki-laki'::text,
  phone text DEFAULT ''::text,
  is_admin boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  unlocked_materials ARRAY DEFAULT '{}'::uuid[],
  unlocked_levels ARRAY DEFAULT '{}'::uuid[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  exp integer DEFAULT 0,
  level integer DEFAULT 1,
  avatar_url text,
  target_level text DEFAULT 'N5'::text,
  last_material_id uuid,
  last_test_id uuid,
  is_teacher boolean DEFAULT false,
  staff_password text,
  birth_date date,
  address text,
  institution text,
  certificate_url text,
  profile_completed boolean DEFAULT false,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_at timestamp with time zone,
  is_super_admin boolean DEFAULT false,
  password text,
  category_id uuid,
  is_alumni boolean DEFAULT false,
  is_student boolean DEFAULT false,
  batch text,
  nip text,
  nickname text DEFAULT ''::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_last_material_id_fkey FOREIGN KEY (last_material_id) REFERENCES public.study_materials(id),
  CONSTRAINT profiles_last_test_id_fkey FOREIGN KEY (last_test_id) REFERENCES public.exam_tests(id),
  CONSTRAINT profiles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  test_id uuid,
  question_text text NOT NULL,
  option_a text NOT NULL DEFAULT ''::text,
  option_b text NOT NULL DEFAULT ''::text,
  option_c text NOT NULL DEFAULT ''::text,
  option_d text NOT NULL DEFAULT ''::text,
  correct_option integer NOT NULL DEFAULT 0 CHECK (correct_option >= 0 AND correct_option <= 3),
  explanation text DEFAULT ''::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  audio_url text,
  question_type text DEFAULT 'multiple_choice'::text CHECK (question_type = ANY (ARRAY['multiple_choice'::text, 'listening'::text, 'reading'::text, 'image_based'::text, 'video_based'::text])),
  image_url text,
  video_url text,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.exam_tests(id)
);
CREATE TABLE public.student_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  start_date date,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_batches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.study_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_id uuid,
  title text NOT NULL,
  description text DEFAULT ''::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_locked boolean DEFAULT false,
  icon_url text DEFAULT ''::text,
  CONSTRAINT study_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT study_chapters_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id)
);
CREATE TABLE public.study_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  level_code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text DEFAULT ''::text,
  badge_color text DEFAULT '#14b8a6'::text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  icon_url text DEFAULT ''::text,
  category_id uuid,
  CONSTRAINT study_levels_pkey PRIMARY KEY (id),
  CONSTRAINT study_levels_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id)
);
CREATE TABLE public.study_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid,
  material_type text NOT NULL CHECK (material_type = ANY (ARRAY['moji_goi'::text, 'bunpou'::text, 'dokkai'::text, 'choukai'::text, 'quiz'::text])),
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  icon_url text DEFAULT ''::text,
  is_locked boolean DEFAULT false,
  video_url text,
  image_url text,
  CONSTRAINT study_materials_pkey PRIMARY KEY (id),
  CONSTRAINT study_materials_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.study_chapters(id)
);
CREATE TABLE public.teacher_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  teacher_email text NOT NULL,
  teacher_name text NOT NULL,
  proposal_type text NOT NULL CHECK (proposal_type = ANY (ARRAY['question'::text, 'material'::text])),
  title text NOT NULL,
  content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  admin_note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teacher_proposals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.teacher_students (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT teacher_students_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_students_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT teacher_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  achievement_id uuid,
  awarded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id)
);
CREATE TABLE public.user_exam_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  test_id uuid,
  score integer DEFAULT 0,
  is_passed boolean DEFAULT false,
  exp_gained integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_exam_results_pkey PRIMARY KEY (id),
  CONSTRAINT user_exam_results_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.exam_tests(id)
);
CREATE TABLE public.user_exp_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  activity_type text NOT NULL,
  activity_id uuid,
  exp_amount integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_exp_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  front text NOT NULL,
  back text NOT NULL,
  example_sentence text DEFAULT ''::text,
  tag text DEFAULT 'vocabulary'::text,
  level integer DEFAULT 0,
  interval integer DEFAULT 0,
  ease_factor real DEFAULT 2.5,
  next_review_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_flashcards_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_manual_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  level_id uuid,
  section_label text NOT NULL,
  column_label text NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_manual_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT user_manual_assessments_level_id_fkey FOREIGN KEY (level_id) REFERENCES public.study_levels(id)
);
CREATE TABLE public.user_material_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  material_id uuid,
  completed_at timestamp with time zone DEFAULT now(),
  score integer,
  CONSTRAINT user_material_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_material_progress_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.study_materials(id)
);
CREATE TABLE public.user_profile_field_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  field_id uuid,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profile_field_values_pkey PRIMARY KEY (id),
  CONSTRAINT user_profile_field_values_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_profile_field_values_field_id_fkey FOREIGN KEY (field_id) REFERENCES public.user_profile_fields(id)
);
CREATE TABLE public.user_profile_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['text'::text, 'number'::text, 'file'::text])),
  is_required boolean DEFAULT false,
  allowed_file_types ARRAY,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  category_id uuid,
  target_role text DEFAULT 'all'::text CHECK (target_role = ANY (ARRAY['admin'::text, 'teacher'::text, 'premium'::text, 'standard'::text, 'all'::text, 'alumni'::text, 'student'::text])),
  CONSTRAINT user_profile_fields_pkey PRIMARY KEY (id),
  CONSTRAINT user_profile_fields_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.material_categories(id)
);
CREATE TABLE public.weekly_targets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  teacher_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['personal'::text, 'batch'::text])),
  student_id uuid,
  batch text,
  title text NOT NULL,
  description text,
  material_ids ARRAY DEFAULT '{}'::uuid[],
  custom_content text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + '7 days'::interval),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT weekly_targets_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_targets_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT weekly_targets_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);