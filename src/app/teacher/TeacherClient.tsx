"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProfiles, getAdminMenuConfig } from "@/lib/db";
import { Profile, StudyLevel } from "@/lib/types";
import WeeklyTargetManager from "./components/WeeklyTargetManager";
import AssessmentManager from "./components/AssessmentManager";
import WeeklyReportManager from "./components/WeeklyReportManager";

type TeacherTab = "students" | "proposals" | "weekly" | "target-mingguan" | "weekly-targets" | "laporan-mingguan" | "grading" | "laporan-penilaian" | "weekly-report";

export default function TeacherClient() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<Profile | null>(null);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);

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
      fetchData(profile);
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

  const fetchData = async (profile: Profile) => {
    if (!profile?.id) {
       setLoading(false);
       return;
    }
    setLoading(true);
    
    try {
      const { getTeacherStudents, getProfiles, getStudyLevels } = await import('@/lib/db');
      const [assignedIds, allProfiles, levels] = await Promise.all([
        getTeacherStudents(profile.id),
        getProfiles(),
        getStudyLevels()
      ]);
      
      const myStudents = allProfiles.filter(p => 
        p.id && assignedIds.includes(p.id)
      );
      
      setStudents(myStudents);
      setStudyLevels(levels);
    } catch (err) {
      console.error("Error fetching teacher students:", err);
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacherProfile?.email) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const { upsertProfile } = await import('@/lib/db');
        await upsertProfile({ email: teacherProfile.email, avatar_url: base64 });
        
        const updatedProfile = { ...teacherProfile, avatar_url: base64 };
        setTeacherProfile(updatedProfile);
        localStorage.setItem("luma-user-profile", JSON.stringify(updatedProfile));
        
        // Also update students list if needed (not needed for current teacher avatar)
      } catch (err) {
        console.error("Failed to upload avatar", err);
        alert("Gagal mengunggah foto profil.");
      }
    };
    reader.readAsDataURL(file);
  };

        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.open('/', '_blank')} className="px-5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all text-xs font-bold shadow-sm">
            Preview App
          </button>
          <button onClick={handleLogout} className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all text-xs font-bold shadow-sm">
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 bg-white sticky top-[73px] z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {(numDynamicTabs > 0 ? (
               teacherProfile?.is_super_admin 
                 ? dynamicTabs 
                 : dynamicTabs.filter(t => t.is_active !== false)
            ) : [
              { id: 'students', label: '👥 Data Siswa' },
              { id: 'weekly', label: '📊 Target Mingguan' },
              { id: 'weekly-report', label: '📋 Riwayat Laporan' },
              { id: 'grading', label: '📝 Laporan Penilaian' },
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
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
        {(activeTab === 'weekly' || activeTab === 'target-mingguan' || activeTab === 'weekly-targets' || activeTab === 'laporan-mingguan') ? (
           <WeeklyTargetManager teacher={teacherProfile!} students={students} />
        ) : activeTab === 'weekly-report' ? (
           <WeeklyReportManager teacher={teacherProfile!} />
        ) : (activeTab === 'grading' || activeTab === 'laporan-penilaian') ? (
           <AssessmentManager students={students} levels={studyLevels} />
        ) : activeTab === 'proposals' ? (
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
        ) : (
          /* ── STUDENTS TAB ── */
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
                          <div className="flex items-center gap-2">
                             <p className="text-xs text-slate-400">{s.email}</p>
                             {s.nip && <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded italic">ID: {s.nip}</span>}
                          </div>
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
                <p className="text-xs text-slate-400 mb-4 font-mono uppercase tracking-tighter font-black">
                   ID SISWA: <span className="text-indigo-600">{selectedStudent.nip || selectedStudent.id?.substring(0, 16)}</span>
                </p>
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
        {showProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100"
            >
              {/* Profile Header */}
              <div className="h-32 bg-gradient-to-br from-indigo-600 to-indigo-800 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <div className="w-24 h-24 bg-white rounded-[2rem] p-1.5 shadow-xl relative group">
                    <div className="w-full h-full bg-slate-900 rounded-[1.7rem] flex items-center justify-center text-3xl font-black text-white italic overflow-hidden">
                      {teacherProfile?.avatar_url ? (
                        <img src={teacherProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        teacherProfile?.full_name?.charAt(0)
                      )}
                    </div>
                    {/* Upload Overlay */}
                    <label className="absolute inset-1.5 rounded-[1.7rem] bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-[18px]">📷</span>
                      <span className="text-[8px] font-black text-white uppercase tracking-tighter mt-1">Ganti Foto</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Profile Body */}
              <div className="pt-16 pb-10 px-8 text-center">
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{teacherProfile?.full_name}</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Guru Pengajar — {teacherProfile?.batch || "Semua Angkatan"}</p>
                
                <div className="mt-8 space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">📧</div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                      <p className="text-xs font-bold text-slate-700">{teacherProfile?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">📱</div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                      <p className="text-xs font-bold text-slate-700">{teacherProfile?.phone || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100/50">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">👤</div>
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                      <p className="text-xs font-bold text-slate-700">{teacherProfile?.gender || "-"}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                  Tutup Profil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
