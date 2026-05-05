-- Comprehensive Menu Configuration
INSERT INTO public.admin_menu_config (tab_id, label, icon, is_active, scope, sort_order)
VALUES 
-- Admin Scopes
('quiz-access', 'Akses Quiz', '⚡', true, 'admin', 105),
('exam-access', 'Akses Exam', '🏆', true, 'admin', 106),
('profile-config', 'Profile Config', '⚙️', true, 'admin', 150),
('menu-manager', 'Menu Manager', '🔧', true, 'admin', 160),
('teacher-menu', 'Menu Guru', '👨‍🏫', true, 'admin', 165),
('assessment-templates', 'Template Penilaian', '📝', true, 'admin', 170),
('all-students-assessment', 'Nilai Seluruh Siswa', '📊', true, 'admin', 180),
('material-recap', 'Rekapan Materi', '📋', true, 'admin', 190),
('video-manager', 'Video Manager', '🎞️', true, 'admin', 200),

-- Teacher Scopes
('students', 'Dashboard', '🏠', true, 'teacher', 10),
('targets', 'Target Mingguan', '🎯', true, 'teacher', 20),
('grading', 'Penilaian Siswa', '📝', true, 'teacher', 30),
('quizzes', 'Akses Quiz', '⚡', true, 'teacher', 40),
('exams', 'Akses Exam', '🏆', true, 'teacher', 41),
('reports', 'Riwayat Laporan', '📊', true, 'teacher', 50),
('proposals', 'Usulan Konten', '✉️', true, 'teacher', 60),
('profile', 'Profil Saya', '👤', true, 'teacher', 70)
ON CONFLICT (tab_id, scope) DO NOTHING;
