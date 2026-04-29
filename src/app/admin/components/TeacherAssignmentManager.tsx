"use client";

import { useState, useEffect } from "react";
import { 
  getProfiles,
  getStudentBatches, 
  getTeacherStudents, 
  assignStudentToTeacher, 
  removeStudentFromTeacher,
  getStudyLevels
} from "@/lib/db";
import { Profile, StudentBatch, StudyLevel } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherAssignmentManager({ user: userProfile }: { user: Profile }) {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTeacher, setSelectedTeacher] = useState<Profile | null>(null);
  const [selectedLevelCode, setSelectedLevelCode] = useState<string>("all");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  const [batchSearch, setBatchSearch] = useState("");
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = useState(false);
  
  // stagedStudentIds tracks the current selection in the UI
  // originalStudentIds tracks what is currently in the database
  const [stagedStudentIds, setStagedStudentIds] = useState<string[]>([]);
  const [originalStudentIds, setOriginalStudentIds] = useState<string[]>([]);
  
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [profiles, batchData, levelData] = await Promise.all([
        getProfiles(),
        getStudentBatches(),
        getStudyLevels()
      ]);
      setTeachers(profiles.filter(p => p.is_teacher));
      setStudents(profiles.filter(p => p.is_student));
      setBatches(batchData);
      setLevels(levelData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeacher = async (teacher: Profile) => {
    setSelectedTeacher(teacher);
    setIsUpdating(true);
    try {
      if (teacher.id) {
        const ids = await getTeacherStudents(teacher.id);
        setOriginalStudentIds(ids);
        setStagedStudentIds(ids);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setStagedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleSaveAssignments = async () => {
    if (!selectedTeacher?.id) return;
    setIsUpdating(true);
    try {
      // Find students to add (in staged but not in original)
      const toAdd = stagedStudentIds.filter(id => !originalStudentIds.includes(id));
      // Find students to remove (in original but not in staged)
      const toRemove = originalStudentIds.filter(id => !stagedStudentIds.includes(id));

      await Promise.all([
        ...toAdd.map(id => assignStudentToTeacher(selectedTeacher.id!, id)),
        ...toRemove.map(id => removeStudentFromTeacher(selectedTeacher.id!, id))
      ]);

      setOriginalStudentIds([...stagedStudentIds]);
      alert("Daftar murid berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading Teachers...</div>;

  const allBatchNames = Array.from(new Set([
    ...batches.map(b => b.name),
    ...students.map(s => s.batch).filter(Boolean) as string[]
  ])).sort();

  const filteredStudents = students.filter(s => {
     const matchesBatch = selectedBatchId === "all" || s.batch === selectedBatchId;
     const matchesLevel = selectedLevelCode === "all" || s.target_level === selectedLevelCode;
     return matchesBatch && matchesLevel;
  });

  const hasChanges = JSON.stringify([...stagedStudentIds].sort()) !== JSON.stringify([...originalStudentIds].sort());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[70vh]">
      
      {/* 1. PILIH GURU */}
      <div className="lg:col-span-4 space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">1</div>
           <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Pilih Guru</h3>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[60vh]">
           <div className="p-6 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daftar Guru Pengajar</p>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {teachers.map(t => (
                 <button 
                    key={t.id}
                    onClick={() => handleSelectTeacher(t)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedTeacher?.id === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}
                 >
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-black border border-white/10 shrink-0">
                       {t.full_name?.charAt(0) || "G"}
                    </div>
                    <div className="text-left overflow-hidden">
                       <p className={`font-black text-[10px] uppercase truncate ${selectedTeacher?.id === t.id ? 'text-white' : 'text-slate-900'}`}>{t.full_name}</p>
                       <p className={`text-[8px] font-bold truncate ${selectedTeacher?.id === t.id ? 'text-indigo-100' : 'text-slate-400'}`}>{t.email}</p>
                    </div>
                 </button>
              ))}
           </div>
        </div>
      </div>

      {/* 2. PILIH BATCH & 3. PILIH MURID */}
      <div className="lg:col-span-8 space-y-6">
         {!selectedTeacher ? (
            <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 opacity-60">
               <span className="text-4xl mb-4">...</span>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Silakan pilih guru terlebih dahulu</p>
            </div>
         ) : (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 h-full flex flex-col">
               
               {/* FILTER KATEGORI & BATCH */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PILIH KATEGORI (LEVEL) */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-4 mb-2">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">2</div>
                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Pilih Kategori</h3>
                     </div>
                     <div className="relative w-full">
                        <button 
                           onClick={() => { setIsLevelDropdownOpen(!isLevelDropdownOpen); setIsBatchDropdownOpen(false); }}
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm hover:border-indigo-500 transition-all group"
                        >
                           <span className="font-black text-[10px] uppercase tracking-widest text-slate-900">
                              {selectedLevelCode === "all" ? "Semua Kategori (Level)" : selectedLevelCode}
                           </span>
                           <span className={`transition-transform duration-300 ${isLevelDropdownOpen ? 'rotate-180' : ''}`}>v</span>
                        </button>
                        <AnimatePresence>
                           {isLevelDropdownOpen && (
                              <motion.div 
                                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                 className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                              >
                                 <div className="max-h-[250px] overflow-y-auto p-2 custom-scrollbar">
                                    <button 
                                       onClick={() => { setSelectedLevelCode("all"); setIsLevelDropdownOpen(false); }}
                                       className={`w-full text-left px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedLevelCode === "all" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                                    >
                                       Semua Kategori
                                    </button>
                                    {levels.map(l => (
                                       <button 
                                          key={l.id}
                                          onClick={() => { setSelectedLevelCode(l.level_code); setIsLevelDropdownOpen(false); }}
                                          className={`w-full text-left px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedLevelCode === l.level_code ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                                       >
                                          {l.level_code} - {l.title}
                                       </button>
                                    ))}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>

                  {/* PILIH BATCH DROPDOWN WITH SEARCH */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-4 mb-2">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">3</div>
                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Pilih Batch</h3>
                     </div>
                     
                     <div className="relative w-full">
                        <button 
                           onClick={() => { setIsBatchDropdownOpen(!isBatchDropdownOpen); setIsLevelDropdownOpen(false); }}
                           className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm hover:border-indigo-500 transition-all group"
                        >
                           <span className="font-black text-[10px] uppercase tracking-widest text-slate-900">
                              {selectedBatchId === "all" ? "Semua Batch" : selectedBatchId}
                           </span>
                           <span className={`transition-transform duration-300 ${isBatchDropdownOpen ? 'rotate-180' : ''}`}>v</span>
                        </button>

                        <AnimatePresence>
                           {isBatchDropdownOpen && (
                              <motion.div 
                                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                 className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                              >
                                 <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                                    <input 
                                       type="text" 
                                       placeholder="Cari Batch..." 
                                       className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold focus:border-indigo-500 outline-none"
                                       value={batchSearch}
                                       onChange={e => setBatchSearch(e.target.value)}
                                       onClick={e => e.stopPropagation()}
                                    />
                                 </div>
                                 <div className="max-h-[250px] overflow-y-auto p-2 custom-scrollbar">
                                    <button 
                                       onClick={() => { setSelectedBatchId("all"); setIsBatchDropdownOpen(false); }}
                                       className={`w-full text-left px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedBatchId === "all" ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                                    >
                                       Semua Batch
                                    </button>
                                    {allBatchNames.filter(name => name.toLowerCase().includes(batchSearch.toLowerCase())).map(name => (
                                       <button 
                                          key={name}
                                          onClick={() => { setSelectedBatchId(name); setIsBatchDropdownOpen(false); }}
                                          className={`w-full text-left px-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedBatchId === name ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                                       >
                                          {name}
                                       </button>
                                    ))}
                                 </div>
                              </motion.div>
                           )}
                        </AnimatePresence>
                     </div>
                  </div>
               </div>

               {/* PILIH MURID */}
               <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">4</div>
                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">Pilih Murid</h3>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                           {stagedStudentIds.length} Murid Terpilih
                        </div>
                        {hasChanges && (
                           <button 
                              onClick={handleSaveAssignments}
                              disabled={isUpdating}
                              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all animate-bounce"
                           >
                              {isUpdating ? 'Saving...' : 'Simpan Perubahan'}
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Guru: {selectedTeacher.full_name}</p>
                           <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Klik pada nama murid untuk menambah/menghapus dari daftar ajar</p>
                        </div>
                        {isUpdating && <span className="text-[8px] font-black text-indigo-500 animate-pulse uppercase">Syncing...</span>}
                     </div>
                     <div className="flex-1 overflow-y-auto p-8 custom-scrollbar max-h-[50vh]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {filteredStudents.map(student => {
                              const isAssigned = stagedStudentIds.includes(student.id!);
                              return (
                                 <button 
                                    key={student.id}
                                    onClick={() => toggleStudent(student.id!)}
                                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all text-left ${isAssigned ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                                 >
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-[10px] transition-all ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                       {isAssigned ? 'OK' : student.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <div className="overflow-hidden">
                                       <p className={`font-black text-[9px] uppercase truncate ${isAssigned ? 'text-indigo-900' : 'text-slate-600'}`}>{student.full_name}</p>
                                       <p className="text-[8px] text-slate-400 truncate">{student.email}</p>
                                    </div>
                                 </button>
                              )
                           })}
                           {filteredStudents.length === 0 && (
                              <div className="col-span-full py-20 text-center opacity-30">
                                 <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada murid di batch ini</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>

            </motion.div>
         )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
