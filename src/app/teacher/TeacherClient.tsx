"use client";

import React, { useState, useEffect } from "react";
import { getProfiles, getAdminMenuConfig, getTeacherStudents, getStudyLevels } from "@/lib/db";
import { Profile, StudyLevel } from "@/lib/types";
import WeeklyTargetManager from "./components/WeeklyTargetManager";
import WeeklyReportManager from "./components/WeeklyReportManager";
import AssessmentManager from "./components/AssessmentManager";
import QuizAccessManager from "./components/QuizAccessManager";
import { User, LogOut, LayoutDashboard, Target, FileText, ClipboardCheck, MessageSquarePlus, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TeacherTab = "students" | "targets" | "reports" | "grading" | "proposals" | "quizzes";

export default function TeacherClient() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>('students');
  const [numDynamicTabs, setNumDynamicTabs] = useState<number>(-1);
  const [dynamicTabs, setDynamicTabs] = useState<{ id: TeacherTab; label: string; is_active?: boolean }[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Proposals
  const [proposals, setProposals] = useState<any[]>([]);
  const [proposalForm, setProposalForm] = useState(false);
  const [propType, setPropType] = useState<'question' | 'material'>('question');
  const [propTitle, setPropTitle] = useState('');
  const [propContent, setPropContent] = useState('');
  const [propSubmitting, setPropSubmitting] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem("luma-auth");
    const rawProfile = localStorage.getItem("luma-user-profile");

    if (authStatus !== "true" || !rawProfile) {
      window.location.href = "/";
      return;
    }

    try {
      const profile: Profile = JSON.parse(rawProfile);
      if (profile.is_admin) {
        window.location.href = "/admin";
        return;
      } else if (!profile.is_teacher) {
        window.location.href = "/";
        return;
      }
      setTeacherProfile(profile);
      setIsAuthorized(true);
      fetchData(profile.id!);
      fetchProposals(profile.email);
      fetchMenuConfig();
    } catch {
      window.location.href = "/";
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  const fetchMenuConfig = async () => {
    try {
      const config = await getAdminMenuConfig('teacher');
      if (config) {
        const mapped = config.map(c => ({
          id: c.tab_id as TeacherTab,
          label: c.label,
          is_active: c.is_active
        }));
        setDynamicTabs(mapped);
        setNumDynamicTabs(config.length);
      }
    } catch (err) {
      console.error("Failed to load teacher menu config", err);
    }
  };

  const fetchData = async (teacherId: string) => {
    setLoading(true);
    try {
      const [allProfiles, assignedIds, allLevels] = await Promise.all([
        getProfiles(),
        getTeacherStudents(teacherId),
        getStudyLevels()
      ]);
      
      const onlyStudents = allProfiles.filter(p => !p.is_teacher && !p.is_admin);
      setStudents(onlyStudents);
      setAssignedStudentIds(assignedIds);
      setLevels(allLevels);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async (email: string) => {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase
      .from('teacher_proposals')
      .select('*')
      .eq('teacher_email', email)
      .order('created_at', { ascending: false });
    setProposals(data || []);
  };

  const handleSubmitProposal = async () => {
    if (!propTitle || !propContent || !teacherProfile) return;
    setPropSubmitting(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('teacher_proposals').insert({
        teacher_email: teacherProfile.email,
        teacher_name: teacherProfile.full_name,
        proposal_type: propType,
        title: propTitle,
        content: { description: propContent },
        status: 'pending'
      });

      if (error) throw error;

      alert('Usulan berhasil dikirim! Menunggu tinjauan admin.');
      setPropTitle('');
      setPropContent('');
      setProposalForm(false);
      fetchProposals(teacherProfile.email);
    } catch (err: any) {
      console.error("Proposal Error:", err);
      alert('Gagal mengirim usulan: ' + (err.message || 'Error tidak diketahui'));
    } finally {
      setPropSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("luma-auth");
    localStorage.removeItem("luma-admin-auth");
    localStorage.removeItem("luma-user-profile");
    window.location.href = "/?logout=1";
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium text-sm">Verifying Access...</div>;
  }

  if (!isAuthorized) return null;

  const filteredStudents = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExp = students.reduce((sum, s) => sum + (s.exp || 0), 0);
  const avgExp = students.length > 0 ? Math.round(totalExp / students.length) : 0;
  const pendingCount = proposals.filter((p: any) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 selection:bg-indigo-100">
      {/* Header */}
      <header className="px-6 lg:px-10 py-5 border-b border-slate-200 bg-white sticky top-0 z-20 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teacher Hub</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Student Performance Telemetry</p>
        </div>
        <div className="flex items-center gap-6">
           <button 
             onClick={() => setIsProfileModalOpen(true)}
             className="hidden md:flex items-center gap-3 pr-6 border-r border-slate-100 hover:opacity-80 transition-all cursor-pointer group"
           >
              <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white ring-4 ring-slate-50 overflow-hidden group-hover:ring-indigo-100 transition-all">
                 {teacherProfile?.avatar_url ? (
                   <img src={teacherProfile.avatar_url} className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-5 h-5" />
                 )}
              </div>
              <div className="text-left">
                 <p className="text-xs font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{teacherProfile?.full_name}</p>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{teacherProfile?.nip || 'Teacher Account'}</p>
              </div>
           </button>
           <div className="flex items-center gap-3">
             <button onClick={() => window.open('/', '_blank')} className="px-5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all text-xs font-bold shadow-sm">
               Preview App
             </button>
             <button onClick={handleLogout} className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm group" title="Logout">
               <LogOut className="w-5 h-5" />
             </button>
           </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 bg-white sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {([
              { id: 'students', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
              { id: 'targets', label: 'Target Mingguan', icon: <Target className="w-4 h-4" /> },
              { id: 'grading', label: 'Penilaian Siswa', icon: <ClipboardCheck className="w-4 h-4" /> },
              { id: 'quizzes', label: 'Akses Quiz', icon: <Zap className="w-4 h-4" /> },
              { id: 'reports', label: 'Riwayat Laporan', icon: <FileText className="w-4 h-4" /> },
              { id: 'proposals', label: 'Usul Konten', icon: <MessageSquarePlus className="w-4 h-4" /> },
            ] as { id: TeacherTab; label: string; icon: React.ReactNode }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-6 py-5 text-sm font-bold transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                {tab.label}
                {tab.id === 'proposals' && pendingCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 mt-10">
        {activeTab === 'proposals' ? (
          /* ── PROPOSALS TAB ── */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Usulan Konten</h2>
                <p className="text-xs text-slate-500 mt-1">Kirim usulan soal atau materi baru untuk ditinjau Admin.</p>
              </div>
              <button
                onClick={() => setProposalForm(true)}
                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
              >
                + Kirim Usulan Baru
              </button>
            </div>

            <div className="space-y-4">
              {proposals.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-sm font-semibold text-slate-400">Belum ada usulan yang dikirim.</p>
                </div>
              ) : proposals.map((p: any) => (
                <div key={p.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                        p.proposal_type === 'question' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'
                      }`}>
                        {p.proposal_type === 'question' ? '📝 Soal' : '📖 Materi'}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                        p.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        p.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {p.status === 'pending' ? '⏳ Menunggu' : p.status === 'approved' ? '✅ Disetujui' : '❌ Ditolak'}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{p.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{p.content?.description}</p>
                    {p.admin_note && (
                      <p className="text-xs mt-2 p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                        💬 Catatan Admin: {p.admin_note}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 shrink-0">
                    {new Date(p.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'targets' ? (
          <WeeklyTargetManager 
            teacher={teacherProfile!} 
            students={assignedStudentIds.length > 0 ? students.filter(s => assignedStudentIds.includes(s.id!)) : students} 
          />
        ) : activeTab === 'grading' ? (
          <AssessmentManager 
            teacher={teacherProfile!} 
            students={assignedStudentIds.length > 0 ? students.filter(s => assignedStudentIds.includes(s.id!)) : students} 
            levels={levels} 
          />
        ) : activeTab === 'quizzes' ? (
          <QuizAccessManager teacher={teacherProfile!} />
        ) : activeTab === 'reports' ? (
          <WeeklyReportManager teacher={teacherProfile!} />
        ) : (
          /* ── STUDENTS DASHBOARD ── */
          <div>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-semibold text-slate-500">Total Active Students</p>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md">STU-1</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{filteredStudents.length}</p>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-semibold text-slate-500">Global Average XP</p>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md">LVL-X</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{avgExp}</p>
              </div>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-semibold text-slate-500">Cumulative System XP</p>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md">SYS-X</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{totalExp.toLocaleString()}</p>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari siswa..."
                className="w-full md:w-80 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all shadow-sm"
              />
            </div>

            {/* Student Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {loading ? (
                <div className="text-center py-16 text-slate-400 text-sm font-medium">Loading...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm font-medium">Tidak ada siswa ditemukan.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Siswa</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Level</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">XP</th>
                      <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredStudents.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{s.full_name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">Lv. {s.level || 1}</span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">{(s.exp || 0).toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                          >
                            Detail →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Drawer */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Detail Siswa</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">{selectedStudent.email}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="h-8 w-8 bg-slate-100 text-slate-500 hover:text-slate-900 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{selectedStudent.full_name}</h3>
                <p className="text-xs text-slate-400 mb-4 font-mono">UID: {selectedStudent.id?.substring(0, 16)}...</p>
                <div className="flex gap-3 flex-wrap">
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg">Level {selectedStudent.level || 1}</span>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg">{(selectedStudent.exp || 0).toLocaleString()} XP</span>
                  {selectedStudent.target_level && (
                    <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">Target: {selectedStudent.target_level}</span>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <h5 className="font-bold text-slate-800 text-sm mb-4">Materi Selesai</h5>
                <ul className="space-y-2">
                  {(selectedStudent.unlocked_materials && selectedStudent.unlocked_materials.length > 0) ? (
                    selectedStudent.unlocked_materials.map((matId) => (
                      <li key={matId} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded-xl">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                        </div>
                        <span className="text-slate-500 font-mono text-xs truncate">{matId}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                      Belum ada materi yang diselesaikan.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Form Modal */}
      {proposalForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6">📝 Kirim Usulan Konten</h3>
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Jenis Usulan</label>
                <div className="flex gap-3">
                  {[
                    { value: 'question', label: '📝 Soal Baru' },
                    { value: 'material', label: '📖 Materi Baru' }
                  ].map(t => (
                    <button
                      key={t.value}
                      onClick={() => setPropType(t.value as any)}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        propType === t.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-100 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Judul Usulan</label>
                <input
                  value={propTitle}
                  onChange={e => setPropTitle(e.target.value)}
                  placeholder={propType === 'question' ? 'Contoh: Soal Listening N4 Set A' : 'Contoh: Materi Kanji N3 Bab 2'}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Deskripsi / Konten</label>
                <textarea
                  value={propContent}
                  onChange={e => setPropContent(e.target.value)}
                  placeholder="Jelaskan isi usulan secara detail. Sertakan teks soal, opsi, kunci jawaban, atau isi materi..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setProposalForm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitProposal}
                disabled={propSubmitting || !propTitle || !propContent}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm"
              >
                {propSubmitting ? 'Mengirim...' : '✉️ Kirim ke Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 text-center">
                 <div className="h-24 w-24 rounded-full bg-slate-900 mx-auto mb-6 flex items-center justify-center text-white ring-8 ring-slate-50 overflow-hidden shadow-xl">
                    {teacherProfile?.avatar_url ? (
                      <img src={teacherProfile.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10" />
                    )}
                 </div>
                 <h3 className="text-xl font-black text-slate-900 mb-1">{teacherProfile?.full_name}</h3>
                 <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-6">{teacherProfile?.nip || 'Teacher Account'}</p>
                 
                 <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 mb-8">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Email</span>
                       <span className="text-slate-900 lowercase">{teacherProfile?.email}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Total Murid</span>
                       <span className="text-slate-900">{filteredStudents.length} Siswa</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span>Role</span>
                       <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">TEACHER</span>
                    </div>
                 </div>

                 <button 
                   onClick={() => setIsProfileModalOpen(false)}
                   className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                 >
                   Tutup
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
