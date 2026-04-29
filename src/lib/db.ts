import { supabase } from './supabase'
<<<<<<< HEAD
import { 
  AppTheme, BannerSlide, MaterialCategory, Material, ExamLevel, ExamTest, 
  Question, Profile, StudyLevel, StudyChapter, StudyMaterial, AdminMenuConfig, 
  ProfileField, ProfileValue, IconCategory, IconLibraryItem, StudentBatch,
  WeeklyTarget, WeeklyReport 
} from './types'
=======
import { AppTheme, BannerSlide, MaterialCategory, Material, ExamLevel, ExamTest, Question, Profile, StudyLevel, StudyChapter, StudyMaterial, AdminMenuConfig, ProfileField, ProfileValue } from './types'
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790

// Theme
export async function getTheme(): Promise<AppTheme | null> {
  const { data, error } = await supabase.from('app_theme').select('*').single()
  if (error) return null
  return data
}

export async function updateTheme(theme: Partial<AppTheme>) {
  const { data, error } = await supabase.from('app_theme').update(theme).eq('id', theme.id).select()
  if (error) throw error
  return data
}

// Banner Slides
export async function getBanners(): Promise<BannerSlide[]> {
  const { data, error } = await supabase.from('banner_slides').select('*').eq('is_active', true).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getAllBanners(): Promise<BannerSlide[]> {
  const { data, error } = await supabase.from('banner_slides').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data
}

// Material Categories
export async function getMaterialCategories(): Promise<MaterialCategory[]> {
  const { data, error } = await supabase.from('material_categories').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data
}

// Materials
export async function getMaterials(): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getMaterialsByCategory(categoryId: string): Promise<Material[]> {
  const { data, error } = await supabase.from('materials').select('*').eq('category_id', categoryId).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getMaterialBySlug(slug: string): Promise<Material | null> {
  const { data, error } = await supabase.from('materials').select('*').eq('slug', slug).single()
  if (error) return null
  return data
}

// Exam Levels
export async function getExamLevels(): Promise<ExamLevel[]> {
  const { data, error } = await supabase.from('exam_levels').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data
}

// Exam Tests
export async function getExamTests(levelId: string): Promise<ExamTest[]> {
  const { data, error } = await supabase.from('exam_tests').select('*').eq('level_id', levelId).eq('is_active', true).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

// Questions
export async function getQuestions(testId: string): Promise<Question[]> {
  const { data, error } = await supabase.from('questions').select('*').eq('test_id', testId).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

// --- CRUD OPERATIONS FOR ADMIN ---

export async function upsertBanner(banner: Partial<BannerSlide>) {
  const { data, error } = await supabase.from('banner_slides').upsert(banner).select()
  if (error) throw error
  return data
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from('banner_slides').delete().eq('id', id)
  if (error) throw error
}

export async function upsertMaterialCategory(category: Partial<MaterialCategory>) {
  const { data, error } = await supabase.from('material_categories').upsert(category).select()
  if (error) throw error
  return data
}

export async function deleteMaterialCategory(id: string) {
  const { error } = await supabase.from('material_categories').delete().eq('id', id)
  if (error) throw error
}

export async function upsertMaterial(material: Partial<Material>) {
  const { data, error } = await supabase.from('materials').upsert(material).select()
  if (error) throw error
  return data
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
}

export async function upsertExamLevel(level: Partial<ExamLevel>) {
  const { data, error } = await supabase.from('exam_levels').upsert(level).select()
  if (error) throw error
  return data
}

export async function deleteExamLevel(id: string) {
  const { error } = await supabase.from('exam_levels').delete().eq('id', id)
  if (error) throw error
}

export async function upsertExamTest(test: Partial<ExamTest>) {
  const { data, error } = await supabase.from('exam_tests').upsert(test).select()
  if (error) throw error
  return data
}

export async function deleteExamTest(id: string) {
  const { error } = await supabase.from('exam_tests').delete().eq('id', id)
  if (error) throw error
}

export async function upsertQuestion(question: Partial<Question>) {
  const { data, error } = await supabase.from('questions').upsert(question).select()
  if (error) throw error
  return data
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) throw error
}

// --- PROFILES ---

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
<<<<<<< HEAD
    .select('id, email, full_name, nickname, phone, nip, batch, is_admin, is_teacher, is_student, is_alumni, is_premium, profile_completed, created_at, password, avatar_url, level, exp, target_level, unlocked_levels, unlocked_materials, institution, address, gender, birth_date, certificate_url')
=======
    .select('id, email, full_name, phone, nip, batch, is_admin, is_teacher, is_student, is_alumni, is_premium, profile_completed, created_at, password, avatar_url')
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
    .order('created_at', { ascending: false })
  if (error) return []
  return data as Profile[]
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) return null
  return data as Profile
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('email', email).single()
  if (error) return null
  return data
}

export async function getProfileByIdentifier(identifier: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.eq.${identifier},nip.eq.${identifier}`)
    .maybeSingle()
  if (error) return null
  return data
}

export async function upsertProfile(profile: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').upsert(profile, { onConflict: 'email' }).select()
  if (error) throw error
  return data
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}

// --- NEW HIERARCHY (Study Framework) ---
export async function getStudyLevels(): Promise<StudyLevel[]> {
  const { data, error } = await supabase.from('study_levels').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getStudyLevelByCode(levelCode: string): Promise<StudyLevel | null> {
  const { data, error } = await supabase.from('study_levels').select('*').eq('level_code', levelCode).single()
  if (error) return null
  return data
}

export async function upsertStudyLevel(level: Partial<StudyLevel>) {
  const { data, error } = await supabase.from('study_levels').upsert(level).select()
  if (error) throw error
  return data
}

export async function deleteStudyLevel(id: string) {
  const { error } = await supabase.from('study_levels').delete().eq('id', id)
  if (error) throw error
}

export async function getStudyChapters(levelId: string): Promise<StudyChapter[]> {
  const { data, error } = await supabase.from('study_chapters').select('*').eq('level_id', levelId).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

<<<<<<< HEAD
export async function getAllStudyChapters(): Promise<StudyChapter[]> {
  const { data, error } = await supabase.from('study_chapters').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data as StudyChapter[]
}

=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
export async function upsertStudyChapter(chapter: Partial<StudyChapter>) {
  const { data, error } = await supabase.from('study_chapters').upsert(chapter).select()
  if (error) throw error
  return data
}

export async function deleteStudyChapter(id: string) {
  const { error } = await supabase.from('study_chapters').delete().eq('id', id)
  if (error) throw error
}

export async function getStudyMaterials(chapterId: string): Promise<StudyMaterial[]> {
  const { data, error } = await supabase.from('study_materials').select('*').eq('chapter_id', chapterId).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getStudyMaterialById(id: string): Promise<StudyMaterial | null> {
  const { data, error } = await supabase.from('study_materials').select('*').eq('id', id).single()
  if (error) return null
  return data
}

export async function upsertStudyMaterial(material: Partial<StudyMaterial>) {
  const { data, error } = await supabase.from('study_materials').upsert(material).select()
  if (error) throw error
  return data
}

export async function deleteStudyMaterial(id: string) {
  const { error } = await supabase.from('study_materials').delete().eq('id', id)
  if (error) throw error
}

// ==========================================
// ICON GALLERY MANAGER
// ==========================================
<<<<<<< HEAD
=======
import { IconCategory, IconLibraryItem } from './types';
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790

export async function getIconCategories(): Promise<IconCategory[]> {
  const { data, error } = await supabase.from('icon_categories').select('*').order('created_at', { ascending: true })
  if (error) return []
  return data
}

export async function upsertIconCategory(categoryName: string) {
  const { data, error } = await supabase.from('icon_categories').insert({ name: categoryName }).select()
  if (error) throw error
  return data
}

export async function deleteIconCategory(id: string) {
  const { error } = await supabase.from('icon_categories').delete().eq('id', id)
  if (error) throw error
}

export async function getIconLibrary(categoryId: string): Promise<IconLibraryItem[]> {
  const { data, error } = await supabase.from('icon_library').select('*').eq('category_id', categoryId).order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function addIconsToLibrary(categoryId: string, urls: string[]) {
  const records = urls.map(url => ({ category_id: categoryId, url }));
  const { data, error } = await supabase.from('icon_library').insert(records);
  if (error) throw error;
  return data;
}

export async function deleteIconFromLibrary(id: string) {
  const { error } = await supabase.from('icon_library').delete().eq('id', id)
  if (error) throw error
}

// ==========================================
// MATERIAL PROGRESS TRACKING
// ==========================================

export async function getCompletedMaterials(userEmail: string): Promise<string[]> {
  const { data, error } = await supabase.from('user_material_progress').select('material_id').eq('user_email', userEmail);
  if (error || !data) return [];
  return data.map(row => row.material_id);
}

export async function markMaterialCompleted(userEmail: string, materialId: string) {
  const { data, error } = await supabase.from('user_material_progress').upsert(
    { user_email: userEmail, material_id: materialId, completed_at: new Date().toISOString() },
    { onConflict: 'user_email,material_id' }
  );
  if (error) throw error;
  return data;
}

export async function getTotalStudyMaterialsCount(): Promise<number> {
  const { count, error } = await supabase.from('study_materials').select('*', { count: 'exact', head: true });
  if (error || count === null) return 0;
  return count;
}

export async function getUserLastProgressDetails(userEmail: string): Promise<any[]> {
  // Ambil history progress 5 terakhir beserta detail materialnya
  const { data, error } = await supabase
    .from('user_material_progress')
    .select('completed_at, study_materials (title, material_type, chapter_id)')
    .eq('user_email', userEmail)
    .order('completed_at', { ascending: false })
    .limit(5);
  if (error || !data) return [];
  return data as any[];
}

export async function getLeaderboard(limit = 50): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_admin', false)
    .eq('is_teacher', false)
    .order('exp', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}

// ==========================================
// ADMIN MENU CONFIGURATION
// ==========================================

export async function getAdminMenuConfig(scope?: 'admin' | 'teacher'): Promise<AdminMenuConfig[]> {
  let query = supabase.from('admin_menu_config').select('*');
  
  if (scope) {
    query = query.eq('scope', scope);
  }
  
  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) return [];
  return data;
}

export async function updateAdminMenuConfig(config: Partial<AdminMenuConfig>) {
<<<<<<< HEAD
  // Try to find if it exists first since tab_id might not have a unique constraint
  const { data: existing } = await supabase
    .from('admin_menu_config')
    .select('id')
    .eq('tab_id', config.tab_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('admin_menu_config')
      .update(config)
      .eq('id', existing.id)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('admin_menu_config')
      .insert(config)
      .select();
    if (error) throw error;
    return data;
  }
=======
  const { data, error } = await supabase
    .from('admin_menu_config')
    .update(config)
    .eq('tab_id', config.tab_id)
    .select();
  if (error) throw error;
  return data;
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
}

// ==========================================
// DYNAMIC PROFILE FIELDS
// ==========================================

export async function getProfileFields(role: string = 'all'): Promise<ProfileField[]> {
<<<<<<< HEAD
  const query = supabase
=======
  let query = supabase
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
    .from('user_profile_fields')
    .select('*')
    .or(`target_role.eq.all,target_role.eq.${role}`);
  
  const { data, error } = await query.order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function upsertProfileField(field: Partial<ProfileField>) {
  const { data, error } = await supabase.from('user_profile_fields').upsert(field).select()
  if (error) throw error
  return data
}

export async function deleteProfileField(id: string) {
  const { error } = await supabase.from('user_profile_fields').delete().eq('id', id)
  if (error) throw error
}

export async function getProfileValuesByUserId(userId: string): Promise<ProfileValue[]> {
  const { data, error } = await supabase.from('user_profile_field_values').select('*').eq('user_id', userId)
  if (error) return []
  return data
}

export async function upsertProfileValue(profileValue: Partial<ProfileValue>) {
  const { data, error } = await supabase.from('user_profile_field_values').upsert(profileValue, { onConflict: 'user_id,field_id' }).select()
  if (error) throw error
  return data
}
<<<<<<< HEAD

// ==========================================
// STUDENT BATCHES
// ==========================================

export async function getStudentBatches(): Promise<StudentBatch[]> {
  const { data, error } = await supabase.from('student_batches').select('*').order('created_at', { ascending: false })
  if (error) return []
  return data
}

export async function upsertStudentBatch(batch: Partial<StudentBatch>) {
  const { data, error } = await supabase.from('student_batches').upsert(batch).select()
  if (error) throw error
  return data
}

export async function deleteStudentBatch(id: string) {
  const { error } = await supabase.from('student_batches').delete().eq('id', id)
  if (error) throw error
}

// ==========================================
// TEACHER STUDENTS
// ==========================================

export async function getTeacherStudents(teacherId: string): Promise<string[]> {
  const { data, error } = await supabase.from('teacher_students').select('student_id').eq('teacher_id', teacherId)
  if (error) return []
  return data.map(d => d.student_id)
}

export async function assignStudentToTeacher(teacherId: string, studentId: string) {
  const { error } = await supabase.from('teacher_students').upsert({ teacher_id: teacherId, student_id: studentId })
  if (error) throw error
}

export async function removeStudentFromTeacher(teacherId: string, studentId: string) {
  const { error } = await supabase
    .from('teacher_students')
    .delete()
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
  if (error) throw error
}

// WEEKLY TARGETS
export async function getWeeklyTargets(teacherId: string): Promise<WeeklyTarget[]> {
  const { data, error } = await supabase
    .from('weekly_targets')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data as WeeklyTarget[];
}

export async function getStudentWeeklyTargets(studentId: string, batchName?: string): Promise<WeeklyTarget[]> {
  let query = supabase
    .from('weekly_targets')
    .select('*')
    .eq('status', 'active');
  
  if (batchName) {
    query = query.or(`student_id.eq.${studentId},batch.eq.${batchName},batch.eq.Semua`);
  } else {
    query = query.or(`student_id.eq.${studentId},batch.eq.Semua`);
  }

  const { data, error } = await query.order('end_date', { ascending: true });
  if (error) return [];
  return data as WeeklyTarget[];
}

export async function upsertWeeklyTarget(target: Partial<WeeklyTarget>) {
  const { data, error } = await supabase
    .from('weekly_targets')
    .upsert(target)
    .select()
    .single();
  if (error) throw error;
  return data as WeeklyTarget;
}

export async function deleteWeeklyTarget(id: string) {
  const { error } = await supabase
    .from('weekly_targets')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getAllStudyMaterials(): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .order('title', { ascending: true });
  if (error) return [];
  return data as StudyMaterial[];
}

// MANUAL ASSESSMENTS
export async function getUserAssessments(userEmail: string, levelId?: string) {
  let query = supabase.from('user_manual_assessments').select('*').eq('user_email', userEmail);
  if (levelId) query = query.eq('level_id', levelId);
  
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function upsertUserAssessment(assessment: {
  user_email: string;
  level_id: string;
  section_label: string;
  column_label: string;
  value: string;
}) {
  const { data, error } = await supabase
    .from('user_manual_assessments')
    .upsert(assessment, { onConflict: 'user_email,level_id,section_label,column_label' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// WEEKLY REPORTS
export async function getWeeklyReports(teacherId?: string): Promise<WeeklyReport[]> {
  let query = supabase.from('weekly_reports').select('*, profiles(full_name)').order('report_date', { ascending: false });
  if (teacherId) query = query.eq('teacher_id', teacherId);
  
  const { data, error } = await query;
  if (error) return [];
  return data as any[];
}

export async function upsertWeeklyReport(report: Partial<WeeklyReport>) {
  const { data, error } = await supabase.from('weekly_reports').upsert(report).select().single();
  if (error) throw error;
  return data as WeeklyReport;
}

export async function deleteWeeklyReport(id: string) {
  const { error } = await supabase.from('weekly_reports').delete().eq('id', id);
  if (error) throw error;
}
=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
