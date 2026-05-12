"use client";

import React, { useState, useEffect } from "react";
import { Profile, StudyChapter, StudyMaterial, StudyLevel } from "@/lib/types";
import { getAllStudyChapters, getBasicStudyMaterials, getStudyLevels } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { BookOpen, CheckCircle, XCircle, Search, Filter, ShieldCheck, Zap, X } from "lucide-react";

interface QuizAccessManagerProps {
  teacher: Profile;
  assignedStudentIds?: string[];
  isSuperAdmin?: boolean;
}

export default function QuizAccessManager({ teacher, assignedStudentIds = [], isSuperAdmin = false }: QuizAccessManagerProps) {
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<StudyMaterial[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Access states
  const [accessControls, setAccessControls] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("Semua");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null);
  const [pendingQuizTitle, setPendingQuizTitle] = useState("");
  const [pendingIsRemedial, setPendingIsRemedial] = useState(false);
  const [inputDuration, setInputDuration] = useState(60);
  const [tick, setTick] = useState(0);

  // Live progress monitoring states
  const [monitoringQuizId, setMonitoringQuizId] = useState<string | null>(null);
  const [monitoringQuizTitle, setMonitoringQuizTitle] = useState("");
  const [monitoringData, setMonitoringData] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!monitoringQuizId) {
      setMonitoringData([]);
      return;
    }

    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from("quiz_access_controls")
          .select("*")
          .eq("material_id", monitoringQuizId);
          
        if (data) {
          setMonitoringData(data);
        }
      } catch (e) {
        console.error("Gagal mengambil progress live:", e);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 3000);
    return () => clearInterval(interval);
  }, [monitoringQuizId]);

  useEffect(() => {
    fetchInitialData();
  }, [assignedStudentIds.join(',')]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email, batch')
        .neq('is_teacher', true)
        .neq('is_admin', true);

      if (isSuperAdmin) {
        // Super admin: load ALL students, no filter
        // (no extra .eq / .in filter — fetches everyone)
      } else if (assignedStudentIds.length > 0) {
        profilesQuery = profilesQuery.in('id', assignedStudentIds);
      } else {
        // Regular teacher with no assigned students — empty result
        profilesQuery = profilesQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      const [allChapters, allMaterials, profilesResult, { data: controls }, allLevels] = await Promise.all([
        getAllStudyChapters(),
        getBasicStudyMaterials(),
        profilesQuery,
        supabase.from('quiz_access_controls').select('*'),
        getStudyLevels()
      ]);

      setLevels(allLevels || []);

      const uniqueChapters = Array.from(new Map(allChapters.map((c: any) => [c.id, c])).values()) as StudyChapter[];
      const filteredQuizzes = allMaterials.filter((m: any) => m.material_type === 'quiz');
      const uniqueQuizzes = Array.from(new Map(filteredQuizzes.map((q: any) => [q.id, q])).values()) as StudyMaterial[];

      setChapters(uniqueChapters.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setQuizzes(uniqueQuizzes);
      
      const studentProfiles = (profilesResult.data || []) as Profile[];
      setStudents(studentProfiles);

      // Derive batches ONLY from assigned students — not from all system batches
      const batchNames = new Set<string>();
      studentProfiles.forEach(s => { if (s.batch) batchNames.add(s.batch); });
      const finalBatches = Array.from(batchNames).sort().map((name, idx) => ({
        id: `batch-${idx}`,
        name
      }));
      setBatches(finalBatches);

      setAccessControls(controls || []);
    } catch (err) {
      console.error("Error fetching quiz data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Resolve the effective student IDs for a given action:
  // - In 'student' mode: use selectedStudentIds directly
  // - In 'batch' mode: use assigned students that belong to the selected batch
  const resolveTargetStudentIds = (mode: 'batch' | 'student'): string[] => {
    if (mode === 'student') return selectedStudentIds;
    if (selectedBatch === 'Semua') return students.map(s => s.id!);
    return students.filter(s => s.batch === selectedBatch).map(s => s.id!);
  };

  const executeToggleAccess = async (quizId: string, newStatus: boolean, durationMinutes?: number, isRemedial?: boolean) => {
    const mode = selectedStudentIds.length > 0 ? 'student' : 'batch';
    const targetIds = resolveTargetStudentIds(mode);
    if (targetIds.length === 0) return;

    try {
      // 1. Update quiz duration in study_materials database if opening
      if (newStatus && durationMinutes !== undefined) {
        const currentQuiz = quizzes.find(q => q.id === quizId);
        if (currentQuiz) {
          const currentContent = { ...((currentQuiz.content as any) || {}) };
          currentContent.duration_minutes = durationMinutes;
          
          const { error: updateError } = await supabase
            .from('study_materials')
            .update({ content: currentContent })
            .eq('id', quizId);
            
          if (updateError) {
            console.error("Gagal memperbarui durasi kuis di database:", updateError);
          } else {
            // Update local state quizzes to reflect new duration
            setQuizzes(prev => prev.map(q => q.id === quizId ? { ...q, content: currentContent } : q));
          }
        }
      }

      // 2. Write access control updates to supabase
      const requests = targetIds.map(sid =>
        supabase.from('quiz_access_controls').upsert({
          material_id: quizId,
          student_id: sid,
          is_active: newStatus,
          is_remedial: isRemedial || false,
          teacher_id: teacher.id,
          // Reset batch progress so student can retake
          batch: newStatus ? null : undefined,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id,material_id' })
      );

      const results = await Promise.all(requests);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      setAccessControls(prev => {
        const updated = [...prev];
        const nowStr = new Date().toISOString();
        targetIds.forEach(sid => {
          const idx = updated.findIndex(c => c.student_id === sid && c.material_id === quizId);
          const payload = { 
            material_id: quizId, 
            student_id: sid, 
            is_active: newStatus, 
            teacher_id: teacher.id,
            updated_at: nowStr,
            created_at: nowStr
          };
          if (idx > -1) updated[idx] = { ...updated[idx], is_active: newStatus, updated_at: nowStr };
          else updated.push(payload);
        });
        return updated;
      });
    } catch (err: any) {
      alert("Gagal mengubah akses quiz: " + err.message);
    }
  };

  const toggleQuizAccess = async (quizId: string, currentStatus: boolean) => {
    const mode = selectedStudentIds.length > 0 ? 'student' : 'batch';
    const targetIds = resolveTargetStudentIds(mode);
    if (targetIds.length === 0) return;

    if (!currentStatus) {
      const currentQuiz = quizzes.find(q => q.id === quizId);
      const defaultDuration = (currentQuiz?.content as any)?.duration_minutes || 60;
      setPendingQuizId(quizId);
      setPendingQuizTitle(currentQuiz?.title || "");
      setPendingIsRemedial(false);
      setInputDuration(defaultDuration);
      setDurationModalOpen(true);
      return;
    }

    await executeToggleAccess(quizId, false);
  };

  const openRemedialAccess = async (quizId: string) => {
    const mode = selectedStudentIds.length > 0 ? 'student' : 'batch';
    const targetIds = resolveTargetStudentIds(mode);
    if (targetIds.length === 0) return;

    const currentQuiz = quizzes.find(q => q.id === quizId);
    const defaultDuration = (currentQuiz?.content as any)?.duration_minutes || 60;
    setPendingQuizId(quizId);
    setPendingQuizTitle(currentQuiz?.title || "");
    setPendingIsRemedial(true);
    setInputDuration(defaultDuration);
    setDurationModalOpen(true);
  };

  const handleConfirmDuration = async () => {
    if (!pendingQuizId) return;
    setDurationModalOpen(false);
    await executeToggleAccess(pendingQuizId, true, inputDuration, pendingIsRemedial);
    setPendingQuizId(null);
    setPendingIsRemedial(false);
  };

  const isQuizActive = (quizId: string) => {
    const mode = selectedStudentIds.length > 0 ? 'student' : 'batch';
    const targetIds = resolveTargetStudentIds(mode);
    if (targetIds.length === 0) return false;
    
    const quiz = quizzes.find(q => q.id === quizId);
    const duration = (quiz?.content as any)?.duration_minutes || 60;

    const activeCount = targetIds.filter(sid => {
      const control = accessControls.find(c => c.student_id === sid && c.material_id === quizId);
      if (!control || !control.is_active) return false;
      
      const openedTime = new Date(control.updated_at || control.created_at).getTime();
      const expirationTime = openedTime + (duration * 60 * 1000);
      return Date.now() <= expirationTime;
    }).length;

    if (activeCount === 0) return false;
    if (activeCount === targetIds.length) return true;
    return 'partial';
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleAllStudents = (select: boolean) => {
    if (select) {
      setSelectedStudentIds(filteredStudents.map(s => s.id!));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  if (loading) {
    return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Loading Quiz Controls...</div>;
  }

  // No students assigned — show full empty state, hide quiz controls entirely
  // Super admin always bypasses this check
  if (assignedStudentIds.length === 0 && !isSuperAdmin) {
    return (
      <div className="animate-in fade-in duration-700 flex flex-col items-center justify-center py-24 px-6">
        <div className="w-full max-w-lg bg-white rounded-[3rem] border border-slate-100 shadow-sm p-14 flex flex-col items-center text-center gap-8">
          {/* Icon */}
          <div className="h-24 w-24 rounded-[2rem] bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-5xl shadow-lg shadow-amber-100">
            🔒
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase leading-none">
              Belum Ada Murid
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Anda belum memiliki murid yang ditugaskan ke kelas Anda.
              Kontrol akses kuis hanya tersedia setelah Admin menetapkan murid kepada Anda.
            </p>
          </div>

          {/* Steps */}
          <div className="w-full space-y-3 text-left">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em] mb-4">Langkah Selanjutnya</p>
            {[
              { icon: "👤", step: "Hubungi Admin sistem Anda." },
              { icon: "📋", step: "Minta Admin untuk menambahkan murid ke kelas Anda melalui menu Manajemen Guru." },
              { icon: "✅", step: "Setelah murid ditetapkan, halaman ini akan otomatis menampilkan kontrol akses kuis." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xl shrink-0">{item.icon}</span>
                <p className="text-xs text-slate-600 font-medium leading-snug">{item.step}</p>
              </div>
            ))}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Menunggu Penugasan Murid
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">

      {isStudentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
             <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Pilih Murid</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{selectedStudentIds.length} Siswa Terpilih</p>
                </div>
                <button onClick={() => setIsStudentModalOpen(false)} className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"><X size={20} /></button>
             </div>

             <div className="space-y-4">
               <div className="relative">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text"
                   placeholder="Cari nama atau email..."
                   value={studentSearch}
                   onChange={(e) => setStudentSearch(e.target.value)}
                   className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10"
                 />
               </div>

               <div className="flex gap-2">
                 <button 
                   onClick={() => toggleAllStudents(true)}
                   className="flex-1 py-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                 >
                   Pilih Semua ({filteredStudents.length})
                 </button>
                 <button 
                   onClick={() => toggleAllStudents(false)}
                   className="flex-1 py-3 bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                 >
                   Hapus Semua
                 </button>
               </div>
             </div>

             <div className="h-96 overflow-y-auto pr-4 space-y-2 custom-scrollbar">
               {filteredStudents.map(s => {
                 const isSelected = selectedStudentIds.includes(s.id!);
                 return (
                   <div 
                     key={s.id} 
                     onClick={() => toggleStudentSelection(s.id!)} 
                     className={`cursor-pointer p-5 rounded-2xl flex items-center justify-between transition-all group ${isSelected ? 'bg-indigo-50 border-2 border-indigo-500' : 'bg-white border-2 border-slate-50 hover:border-indigo-100'}`}
                   >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-[11px] uppercase text-slate-900 leading-none">{s.full_name}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-1">{s.email}</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white group-hover:border-indigo-300'}`}>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </div>
                   </div>
                 );
               })}
             </div>

             <button 
               onClick={() => setIsStudentModalOpen(false)}
               className="w-full py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-600 transition-all"
             >
               Selesai & Simpan Pilihan
             </button>
          </div>
        </div>
      )}

      {durationModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-100 space-y-8 animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
             
             {/* Bouncing premium clock container */}
             <div className="mx-auto h-20 w-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/10 animate-bounce">
               ⏱️
             </div>
             
             <div className="space-y-2">
               <h3 className="text-xl font-black italic tracking-tight uppercase leading-none text-slate-900">Atur Durasi Kuis</h3>
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                 {pendingQuizTitle}
               </p>
               <p className="text-slate-500 text-xs font-medium px-4">
                 Tentukan durasi pengerjaan kuis dalam satuan menit sebelum akses dibuka untuk murid.
               </p>
             </div>

             <div className="space-y-4">
               <div className="relative max-w-[200px] mx-auto">
                 <input 
                   type="number" 
                   min="1"
                   value={inputDuration}
                   onChange={(e) => setInputDuration(Math.max(1, parseInt(e.target.value) || 1))}
                   className="w-full pl-6 pr-20 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-center text-3xl text-slate-800 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-inner"
                 />
                 <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-slate-400 tracking-wider">Menit</span>
               </div>
               
               {/* Premium Quick Selectors */}
               <div className="flex flex-wrap gap-2 justify-center pt-2">
                 {[15, 30, 45, 60, 90, 120].map((mins) => (
                   <button
                     key={mins}
                     type="button"
                     onClick={() => setInputDuration(mins)}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${inputDuration === mins ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}
                   >
                     {mins}m
                   </button>
                 ))}
               </div>
             </div>

             <div className="flex gap-4 pt-4 border-t border-slate-50">
               <button 
                 onClick={() => {
                   setDurationModalOpen(false);
                   setPendingQuizId(null);
                 }}
                 className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
               >
                 Batal
               </button>
               <button 
                 onClick={handleConfirmDuration}
                 className="flex-1 py-4 bg-slate-900 hover:bg-teal-500 hover:text-white text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-slate-900/10"
               >
                 ✓ Buka Akses
               </button>
             </div>
          </div>
        </div>
      )}

       {/* Real-time progress monitoring modal */}
       {monitoringQuizId && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 shrink-0">
                 <div className="space-y-1">
                   <div className="flex items-center gap-3">
                     <span className="flex h-3.5 w-3.5 relative">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                     </span>
                     <h3 className="text-xl font-black uppercase tracking-tight italic text-slate-800">📡 Pemantauan Real-Time</h3>
                   </div>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mt-1">
                     {monitoringQuizTitle}
                   </p>
                 </div>
                 <button 
                   onClick={() => {
                     setMonitoringQuizId(null);
                     setMonitoringQuizTitle("");
                   }} 
                   className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-sm"
                 >
                   <X size={20} />
                 </button>
              </div>

              {/* Live Indicators / Quick Summary */}
              <div className="grid grid-cols-3 gap-4 py-6 shrink-0 border-b border-slate-50 bg-slate-50/50 -mx-10 px-10">
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                      {students.length}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Siswa</p>
                      <p className="text-xs font-bold text-slate-800">Ditugaskan</p>
                    </div>
                 </div>
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-lg">
                      {students.filter(s => {
                        const ctrl = monitoringData.find(c => c.student_id === s.id);
                        if (!ctrl || !ctrl.batch || !ctrl.batch.startsWith("PROGRESS:")) return false;
                        return ctrl.batch !== "PROGRESS:SELESAI";
                      }).length}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sedang Mengisi</p>
                      <p className="text-xs font-bold text-slate-800">Pengerjaan Aktif</p>
                    </div>
                 </div>
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-lg">
                      {students.filter(s => {
                        const ctrl = monitoringData.find(c => c.student_id === s.id);
                        return ctrl && ctrl.batch === "PROGRESS:SELESAI";
                      }).length}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Selesai</p>
                      <p className="text-xs font-bold text-slate-800">Jawaban Masuk</p>
                    </div>
                 </div>
              </div>

              {/* Table container */}
              <div className="flex-1 overflow-y-auto min-h-0 py-6 custom-scrollbar pr-2">
                 {students.length === 0 ? (
                   <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                     Belum ada siswa yang ditugaskan ke kelas Anda.
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-slate-100 pb-4">
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider w-16">No</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Siswa</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider w-56">Progress Soal</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider w-44 text-right">Status Live</th>
                         </tr>
                       </thead>
                       <tbody>
                         {students.map((s, idx) => {
                           const ctrl = monitoringData.find(c => c.student_id === s.id);
                           let progress = { text: "-", percentage: 0, status: "tidak_ada_akses" };
                           
                           if (ctrl) {
                             if (!ctrl.is_active) {
                               progress = { text: "Akses Ditutup", percentage: 0, status: "ditutup" };
                             } else if (!ctrl.batch || !ctrl.batch.startsWith("PROGRESS:")) {
                               progress = { text: "Belum Mulai", percentage: 0, status: "belum_mulai" };
                             } else if (ctrl.batch === "PROGRESS:SELESAI") {
                               progress = { text: "Lengkap", percentage: 100, status: "selesai" };
                             } else {
                               const val = ctrl.batch.substring("PROGRESS:".length);
                               const parts = val.split("/");
                               const answered = parseInt(parts[0]) || 0;
                               const total = parseInt(parts[1]) || 1;
                               const percentage = Math.round((answered / total) * 100);
                               progress = { text: `${answered} / ${total} Soal`, percentage, status: "mengerjakan" };
                             }
                           }

                           return (
                             <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors group">
                               <td className="py-5 text-xs font-black text-slate-400 italic">
                                 {idx + 1}
                               </td>
                               <td className="py-5">
                                 <div className="flex items-center gap-4">
                                   <div className={`h-10 w-10 rounded-xl font-black text-xs flex items-center justify-center ${progress.status === 'selesai' ? 'bg-emerald-100 text-emerald-600' : progress.status === 'mengerjakan' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                                     {s.full_name?.charAt(0)}
                                   </div>
                                   <div>
                                     <p className="font-black text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">{s.full_name}</p>
                                     <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[9px] text-slate-400 font-medium">{s.email}</span>
                                       {s.batch && (
                                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-wider">{s.batch}</span>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-5">
                                 <div className="space-y-2">
                                   <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                     <span>{progress.text}</span>
                                     {progress.status === 'mengerjakan' && <span>{progress.percentage}%</span>}
                                   </div>
                                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                       className={`h-full transition-all duration-500 ${progress.status === 'selesai' ? 'bg-emerald-500' : progress.status === 'mengerjakan' ? 'bg-indigo-500' : 'bg-slate-200'}`}
                                       style={{ width: `${progress.percentage}%` }}
                                     />
                                   </div>
                                 </div>
                               </td>
                               <td className="py-5 text-right">
                                 {progress.status === 'selesai' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                     Selesai 🏁
                                   </span>
                                 )}
                                 {progress.status === 'mengerjakan' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">
                                     <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                                     Mengerjakan ⏳
                                   </span>
                                 )}
                                 {progress.status === 'belum_mulai' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
                                     Belum Mulai 💤
                                   </span>
                                 )}
                                 {progress.status === 'ditutup' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-500">
                                     Akses Ditutup 🔒
                                   </span>
                                 )}
                                 {progress.status === 'tidak_ada_akses' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300">
                                     Belum Dibuka 💤
                                   </span>
                                 )}
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-slate-100 shrink-0 text-center flex justify-between items-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                   📡 Data diperbarui secara otomatis setiap 3 detik.
                 </p>
                 <button 
                   onClick={() => {
                     setMonitoringQuizId(null);
                     setMonitoringQuizTitle("");
                   }}
                   className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-md"
                 >
                   Tutup Pemantauan
                 </button>
              </div>
           </div>
         </div>
       )}
  

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase leading-none">Kontrol Akses Quiz</h2>
          <p className="text-xs text-slate-500 font-medium">Buka kuis secara real-time untuk Batch atau sekelompok Siswa.</p>
        </div>
        
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Target Akses</label>
            <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
               <button 
                 onClick={() => setSelectedStudentIds([])}
                 className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedStudentIds.length === 0 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Per Batch
               </button>
               <button 
                 onClick={() => setIsStudentModalOpen(true)}
                 className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedStudentIds.length > 0 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Perorangan {selectedStudentIds.length > 0 && `(${selectedStudentIds.length})`}
               </button>
            </div>
          </div>

          {selectedStudentIds.length === 0 ? (
            <div className="flex flex-col gap-2 w-56">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Pilih Batch</label>
              <select 
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer"
              >
                <option value="Semua">Semua Batch</option>
                {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
               <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Siswa Terpilih</label>
               <div className="flex items-center gap-3">
                  <div className="flex -space-x-3 overflow-hidden">
                    {selectedStudentIds.slice(0, 5).map(sid => {
                      const s = students.find(st => st.id === sid);
                      return (
                        <div key={sid} className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-900 flex items-center justify-center text-[10px] text-white font-black">
                          {s?.full_name?.charAt(0)}
                        </div>
                      );
                    })}
                    {selectedStudentIds.length > 5 && (
                      <div className="flex items-center justify-center h-10 w-10 rounded-full ring-4 ring-white bg-slate-100 text-[10px] font-black text-slate-400">
                        +{selectedStudentIds.length - 5}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsStudentModalOpen(true)}
                    className="h-10 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 transition-all"
                  >
                    Ubah Daftar Siswa
                  </button>
               </div>
            </div>
          )}

          <div className="flex flex-col gap-2 w-56">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Filter Level Studi</label>
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(e.target.value)}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="">Semua Level</option>
              {levels.map((lvl: any) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.level_code} — {lvl.title || lvl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 w-72">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Cari Judul Kuis</label>
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Judul quiz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all w-full shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {chapters
          .filter(chapter => !selectedLevelId || chapter.level_id === selectedLevelId)
          .map(chapter => {
          const chapterQuizzes = quizzes.filter(q => q.chapter_id === chapter.id && q.title.toLowerCase().includes(searchTerm.toLowerCase()));
          if (chapterQuizzes.length === 0) return null;
          
          const isExpanded = expandedChapters.includes(chapter.id);
          
          return (
            <div key={chapter.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-md">
               <button 
                 onClick={() => toggleChapter(chapter.id)}
                 className="w-full px-10 py-10 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
               >
                  <div className="flex items-center gap-8">
                    <div className="h-16 w-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-slate-900/10">
                      📖
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 italic tracking-tight leading-none mb-2">{chapter.title}</h3>
                      <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{chapterQuizzes.length} Evaluation Materials</p>
                        {(() => {
                          const lvl = levels.find((l) => l.id === chapter.level_id);
                          return lvl ? (
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[9px] font-black uppercase tracking-wider text-indigo-500">
                              {lvl.level_code || lvl.title || lvl.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl border border-slate-100 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'rotate-180 bg-slate-900 text-white border-slate-900' : 'text-slate-300'}`}>
                    ▼
                  </div>
               </button>

               {isExpanded && (
                 <div className="px-10 pb-12 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-6 duration-700">
                    {chapterQuizzes.map(quiz => {
                      const active = isQuizActive(quiz.id);
                      const isPartial = active === 'partial';

                      let isExpired = false;
                      let remainingTimeText = "";
                      if (active !== true && active !== 'partial') {
                        const hasActiveRows = accessControls.some(c => c.material_id === quiz.id && c.is_active);
                        if (hasActiveRows) {
                          isExpired = true;
                        }
                      } else if (active === true) {
                        const duration = (quiz?.content as any)?.duration_minutes || 60;
                        const control = accessControls.find(c => c.material_id === quiz.id && c.is_active);
                        if (control) {
                          const openedTime = new Date(control.updated_at || control.created_at).getTime();
                          const expirationTime = openedTime + (duration * 60 * 1000);
                          const remMinutes = Math.max(0, Math.ceil((expirationTime - Date.now()) / (60 * 1000)));
                          if (remMinutes > 0) {
                            remainingTimeText = `(${remMinutes}m)`;
                          }
                        }
                      }

                      return (
                        <div key={quiz.id} className={`group p-8 rounded-[2.5rem] border transition-all duration-500 ${active === true ? 'bg-emerald-50 border-emerald-200' : isPartial ? 'bg-amber-50 border-amber-200' : isExpired ? 'bg-rose-50/40 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center justify-between mb-8">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                active === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse' 
                                : isPartial ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                                : isExpired ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/10'
                                : 'bg-slate-200 text-slate-500'
                              }`}>
                                {active === true ? `LIVE ${remainingTimeText}` : isPartial ? 'PARSIAL' : isExpired ? 'SELESAI / EXPIRED ⏰' : 'OFF'}
                              </span>
                              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active === true ? 'bg-emerald-100 text-emerald-600' : isPartial ? 'bg-amber-100 text-amber-600' : isExpired ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-300 shadow-sm'}`}>
                                <Zap size={20} className={active === true ? 'animate-pulse' : ''} />
                              </div>
                           </div>
                           
                           <h4 className="text-base font-black text-slate-800 mb-8 leading-tight min-h-[48px] group-hover:text-indigo-600 transition-colors">{quiz.title}</h4>
                           
                           <div className="space-y-3">
                              <button 
                                onClick={() => toggleQuizAccess(quiz.id, active === true)}
                                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${active === true ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600' : isPartial ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20 hover:bg-amber-700' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-emerald-600'}`}
                              >
                                {active === true ? 'Tutup Akses' : isPartial ? 'Buka Untuk Semua' : 'Buka Akses'}
                              </button>

                              {(active === true || isPartial || isExpired) && (
                                <button
                                  onClick={() => {
                                    setMonitoringQuizId(quiz.id);
                                    setMonitoringQuizTitle(quiz.title);
                                  }}
                                  className="w-full py-4 bg-indigo-50 border-2 border-indigo-100 hover:bg-indigo-100/50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  👁️ Pantau Live
                                </button>
                              )}

                              {(!active || isExpired) && (
                                <button
                                  onClick={() => openRemedialAccess(quiz.id)}
                                  className="w-full py-4 bg-teal-50 border-2 border-teal-200 hover:bg-teal-100/80 text-teal-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  🔄 Buka Remedial
                                </button>
                              )}
                            </div>
                        </div>
                      );
                    })}
                 </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
