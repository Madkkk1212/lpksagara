import { supabase } from './supabase'
import { AppTheme, BannerSlide, MaterialCategory, Material, ExamLevel, ExamTest, Question, Profile, StudyLevel, StudyChapter, StudyMaterial, AdminMenuConfig, ProfileField, ProfileValue, WeeklyTarget, WeeklyReport, StudentBatch, ChapterTemplate } from './types'

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

export async function bulkUpdateMaterialCategories(categories: any[]) {
  // Use individual updates to avoid NOT NULL constraints on other columns during upsert
  const results = [];
  for (const c of categories) {
    const { data, error } = await supabase.from('material_categories').update({ sort_order: c.sort_order }).eq('id', c.id).select();
    if (error) {
      console.error(`Failed to update category ${c.id}:`, error.message);
    } else {
      results.push(data[0]);
    }
  }
  return results;
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

export async function bulkUpdateExamLevels(levels: Partial<ExamLevel>[]) {
  const { data, error } = await supabase.from('exam_levels').upsert(levels).select()
  if (error) throw error
  return data
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

export async function bulkUpdateExamTests(tests: Partial<ExamTest>[]) {
  const { data, error } = await supabase.from('exam_tests').upsert(tests).select()
  if (error) throw error
  return data
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

export async function bulkUpdateQuestions(questions: Partial<Question>[]) {
  const { data, error } = await supabase.from('questions').upsert(questions).select()
  if (error) throw error
  return data
}

// --- PROFILES ---

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, nip, batch, is_admin, is_teacher, is_student, is_alumni, is_premium, profile_completed, created_at, password, avatar_url')
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

export async function bulkUpdateStudyLevels(levels: any[]) {
  const results = [];
  for (const l of levels) {
    const { data, error } = await supabase.from('study_levels').update({ sort_order: l.sort_order }).eq('id', l.id).select();
    if (error) console.error(`Failed to update level ${l.id}:`, error.message);
    else results.push(data[0]);
  }
  return results;
}

export async function getStudyChapters(levelId: string): Promise<StudyChapter[]> {
  const { data, error } = await supabase.from('study_chapters').select('*').eq('level_id', levelId).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getAllStudyChapters(): Promise<StudyChapter[]> {
  const { data, error } = await supabase.from('study_chapters').select('*').order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function upsertStudyChapter(chapter: Partial<StudyChapter>) {
  const { data, error } = await supabase.from('study_chapters').upsert(chapter).select()
  if (error) throw error
  return data
}

export async function deleteStudyChapter(id: string) {
  const { error } = await supabase.from('study_chapters').delete().eq('id', id)
  if (error) throw error
}

export async function bulkUpdateStudyChapters(chapters: any[]) {
  const results = [];
  for (const c of chapters) {
    const { data, error } = await supabase.from('study_chapters').update({ sort_order: c.sort_order }).eq('id', c.id).select();
    if (error) console.error(`Failed to update chapter ${c.id}:`, error.message);
    else results.push(data[0]);
  }
  return results;
}

export async function getStudyMaterials(chapterId: string): Promise<StudyMaterial[]> {
  const { data, error } = await supabase.from('study_materials').select('*').eq('chapter_id', chapterId).order('sort_order', { ascending: true })
  if (error) return []
  return data
}

export async function getAllStudyMaterials(): Promise<StudyMaterial[]> {
  const { data, error } = await supabase.from('study_materials').select('*').order('sort_order', { ascending: true });
  if (error) return [];
  return data;
}

export async function getMaterialsWithVideos(): Promise<Partial<StudyMaterial>[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('id, title, chapter_id, material_type, video_url, image_url, file_size, storage_provider, created_at')
    .not('video_url', 'is', null)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getBasicStudyMaterials(chapterId?: string): Promise<Partial<StudyMaterial>[]> {
  let query = supabase.from('study_materials').select('id, title, chapter_id, material_type, is_locked, sort_order, icon_url');
  if (chapterId) query = query.eq('chapter_id', chapterId);
  const { data, error } = await query.order('sort_order', { ascending: true });
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

export async function bulkUpdateStudyMaterials(materials: any[]) {
  const results = [];
  for (const m of materials) {
    const { data, error } = await supabase.from('study_materials').update({ sort_order: m.sort_order }).eq('id', m.id).select();
    if (error) {
      console.error(`Failed to update material ${m.id}:`, error.message);
    } else {
      results.push(data[0]);
    }
  }
  return results;
}

// ==========================================
// ICON GALLERY MANAGER
// ==========================================
import { IconCategory, IconLibraryItem } from './types';

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
  const { data, error } = await supabase
    .from('admin_menu_config')
    .update(config)
    .eq('tab_id', config.tab_id)
    .select();
  if (error) throw error;
  return data;
}

// ==========================================
// DYNAMIC PROFILE FIELDS
// ==========================================

export async function getProfileFields(role: string = 'all'): Promise<ProfileField[]> {
  let query = supabase
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
// TEACHER-STUDENT ASSIGNMENTS
// ==========================================

export async function getTeacherStudents(teacherId: string): Promise<string[]> {
  const { data, error } = await supabase.from('teacher_student_assignments').select('student_id').eq('teacher_id', teacherId);
  if (error) return [];
  return data.map(d => d.student_id);
}

export async function assignStudentToTeacher(teacherId: string, studentId: string) {
  const { error } = await supabase.from('teacher_student_assignments').upsert({ teacher_id: teacherId, student_id: studentId });
  if (error) throw error;
}

export async function removeStudentFromTeacher(teacherId: string, studentId: string) {
  const { error } = await supabase.from('teacher_student_assignments').delete().eq('teacher_id', teacherId).eq('student_id', studentId);
  if (error) throw error;
}

// ==========================================
// ASSESSMENT TEMPLATES
// ==========================================

export async function getChapterTemplates(levelId?: string): Promise<ChapterTemplate[]> {
  let query = supabase.from('assessment_chapter_templates').select('*').order('sort_order', { ascending: true });
  if (levelId) {
    query = query.eq('level_id', levelId);
  }
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function upsertChapterTemplate(template: Partial<ChapterTemplate>) {
  const { data, error } = await supabase.from('assessment_chapter_templates').upsert(template).select();
  if (error) throw error;
  return data;
}

// ==========================================
// WEEKLY TARGETS (MISSIONS)
// ==========================================

export async function getWeeklyTargets(teacherId?: string): Promise<WeeklyTarget[]> {
  let query = supabase.from('weekly_targets').select('*').order('created_at', { ascending: false });
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function getStudentWeeklyTargets(studentEmail: string, batch?: string | null): Promise<WeeklyTarget[]> {
  // Fetch the student's profile ID
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', studentEmail).single();

  // Build an OR filter: personal assignment OR their batch OR the 'Semua' (everyone) batch
  const orParts: string[] = [`batch.eq.Semua`];
  if (profile?.id) orParts.push(`student_id.eq.${profile.id}`);
  if (batch) orParts.push(`batch.eq.${batch}`);

  const { data, error } = await supabase
    .from('weekly_targets')
    .select('*')
    .eq('status', 'active')
    .or(orParts.join(','))
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function upsertWeeklyTarget(target: Partial<WeeklyTarget>) {
  const { data, error } = await supabase.from('weekly_targets').upsert(target).select();
  if (error) throw error;
  return data;
}

export async function deleteWeeklyTarget(id: string) {
  const { error } = await supabase.from('weekly_targets').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// WEEKLY REPORTS
// ==========================================

export async function getWeeklyReports(teacherId?: string): Promise<WeeklyReport[]> {
  let query = supabase.from('weekly_reports').select('*, profiles:teacher_id(full_name)').order('report_date', { ascending: false });
  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }
  const { data, error } = await query;
  if (error) return [];
  return data;
}

export async function upsertWeeklyReport(report: Partial<WeeklyReport>) {
  const { data, error } = await supabase.from('weekly_reports').upsert(report).select();
  if (error) throw error;
  return data;
}

export async function deleteWeeklyReport(id: string) {
  const { error } = await supabase.from('weekly_reports').delete().eq('id', id);
  if (error) throw error;
}
