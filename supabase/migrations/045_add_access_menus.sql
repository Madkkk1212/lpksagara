-- Add Quiz Access and Exam Access to Admin menu
INSERT INTO public.admin_menu_config (tab_id, label, icon, is_active, scope, sort_order)
VALUES 
('quiz-access', 'Akses Quiz', '⚡', true, 'admin', 105),
('exam-access', 'Akses Exam', '🏆', true, 'admin', 106)
ON CONFLICT (tab_id, scope) DO UPDATE SET is_active = true;

-- Add Exam Access to Teacher menu
INSERT INTO public.admin_menu_config (tab_id, label, icon, is_active, scope, sort_order)
VALUES 
('quizzes', 'Akses Quiz', '⚡', true, 'teacher', 40),
('exams', 'Akses Exam', '🏆', true, 'teacher', 41)
ON CONFLICT (tab_id, scope) DO UPDATE SET is_active = true;
