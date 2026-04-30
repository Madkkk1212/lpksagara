"use client";

import React, { useState, useEffect } from "react";
import { Profile, StudyChapter, StudyMaterial, StudyLevel } from "@/lib/types";
import { getStudyChapters, getStudyMaterials, getAllStudyChapters, getBasicStudyMaterials, getStudentBatches } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { BookOpen, CheckCircle, XCircle, Search, Filter, ShieldCheck, Zap, X } from "lucide-react";

interface QuizAccessManagerProps {
  teacher: Profile;
}

export default function QuizAccessManager({ teacher }: QuizAccessManagerProps) {
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [quizzes, setQuizzes] = useState<StudyMaterial[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Access states
  const [accessControls, setAccessControls] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("Semua");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch data without buggy inline .catch/.match builders
      const [allChapters, allMaterials, allBatches, profilesResult] = await Promise.all([
        getAllStudyChapters(),
        getBasicStudyMaterials(),
        getStudentBatches(),
        supabase.from('profiles').select('*').neq('is_teacher', true).neq('is_admin', true)
      ]);

      const uniqueChapters = Array.from(new Map(allChapters.map((c: any) => [c.id, c])).values()) as StudyChapter[];
      const filteredQuizzes = allMaterials.filter((m: any) => m.material_type === 'quiz');
      const uniqueQuizzes = Array.from(new Map(filteredQuizzes.map((q: any) => [q.id, q])).values()) as StudyMaterial[];

      setChapters(uniqueChapters.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
      setQuizzes(uniqueQuizzes);
      
      const studentProfiles = (profilesResult.data || []) as Profile[];
      setStudents(studentProfiles);

      const batchNames = new Set<string>();
      if (allBatches) allBatches.forEach((b: any) => batchNames.add(b.name));
      studentProfiles.forEach(s => { if (s.batch) batchNames.add(s.batch); });

      const finalBatches = Array.from(batchNames).sort().map((name, idx) => ({
        id: `batch-${idx}`,
        name: name
      }));
      
      setBatches(finalBatches);

      const { data: controls } = await supabase
        .from('quiz_access_controls')
        .select('*');
      
      setAccessControls(controls || []);
    } catch (err) {
      console.error("Error fetching quiz data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuizAccess = async (quizId: string, type: 'batch' | 'student', identifiers: string[], currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      const requests = identifiers.map(id => {
        const payload: any = {
          material_id: quizId,
          is_active: newStatus,
          teacher_id: teacher.id,
          updated_at: new Date().toISOString()
        };
        if (type === 'batch') payload.batch = id;
        else payload.student_id = id;
        
        return supabase.from('quiz_access_controls').upsert(payload, { 
          onConflict: type === 'batch' ? 'batch,material_id' : 'student_id,material_id' 
        });
      });

      const results = await Promise.all(requests);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

      setAccessControls(prev => {
        const updated = [...prev];
        identifiers.forEach(id => {
           const idx = updated.findIndex(c => 
             (type === 'batch' ? c.batch === id : c.student_id === id) && 
             c.material_id === quizId
           );
           const payload = {
             material_id: quizId,
             is_active: newStatus,
             teacher_id: teacher.id,
             ...(type === 'batch' ? { batch: id } : { student_id: id })
           };
           if (idx > -1) updated[idx] = { ...updated[idx], is_active: newStatus };
           else updated.push(payload);
        });
        return updated;
      });
    } catch (err: any) {
      alert("Gagal mengubah akses quiz: " + err.message);
    }
  };

  const isQuizActive = (quizId: string, batch: string, studentIds: string[]) => {
    if (studentIds.length > 0) {
      const activeCount = studentIds.filter(sid => {
        const control = accessControls.find(c => c.student_id === sid && c.material_id === quizId);
        return control ? control.is_active : false;
      }).length;
      
      if (activeCount === 0) return false;
      if (activeCount === studentIds.length) return true;
      return 'partial';
    }
    const control = accessControls.find(c => c.batch === batch && c.material_id === quizId);
    return control ? control.is_active : false;
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
        {chapters.map(chapter => {
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
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{chapterQuizzes.length} Evaluation Materials</p>
                    </div>
                  </div>
                  <div className={`h-12 w-12 rounded-2xl border border-slate-100 flex items-center justify-center transition-all duration-500 ${isExpanded ? 'rotate-180 bg-slate-900 text-white border-slate-900' : 'text-slate-300'}`}>
                    ▼
                  </div>
               </button>

               {isExpanded && (
                 <div className="px-10 pb-12 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-6 duration-700">
                    {chapterQuizzes.map(quiz => {
                      const active = isQuizActive(quiz.id, selectedBatch, selectedStudentIds);
                      const isPartial = active === 'partial';
                      
                      return (
                        <div key={quiz.id} className={`group p-8 rounded-[2.5rem] border transition-all duration-500 ${active === true ? 'bg-emerald-50 border-emerald-200' : isPartial ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center justify-between mb-8">
                              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${active === true ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : isPartial ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-200 text-slate-500'}`}>
                                {active === true ? 'LIVE' : isPartial ? 'PARSIAL' : 'OFF'}
                              </span>
                              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${active === true ? 'bg-emerald-100 text-emerald-600' : isPartial ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-300 shadow-sm'}`}>
                                <Zap size={20} className={active ? 'animate-pulse' : ''} />
                              </div>
                           </div>
                           
                           <h4 className="text-base font-black text-slate-800 mb-8 leading-tight min-h-[48px] group-hover:text-indigo-600 transition-colors">{quiz.title}</h4>
                           
                           <button 
                             onClick={() => toggleQuizAccess(
                               quiz.id, 
                               selectedStudentIds.length > 0 ? 'student' : 'batch', 
                               selectedStudentIds.length > 0 ? selectedStudentIds : [selectedBatch], 
                               active === true
                             )}
                             className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${active === true ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600' : isPartial ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20 hover:bg-amber-700' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-emerald-600'}`}
                           >
                             {active === true ? 'Tutup Akses' : isPartial ? 'Buka Untuk Semua' : 'Buka Akses'}
                           </button>
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
