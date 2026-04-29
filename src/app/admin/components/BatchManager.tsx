"use client";

import { useState, useEffect } from "react";
import { Profile, StudentBatch } from "@/lib/types";
import { 
  getProfiles, 
  getStudentBatches, 
  upsertStudentBatch, 
  deleteStudentBatch,
  upsertProfile
} from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

export default function BatchManager({ user: userProfile }: { user: Profile }) {
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Partial<StudentBatch> | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | "all">("all");

  const isAdmin = userProfile.is_admin || userProfile.is_super_admin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bData, pData] = await Promise.all([
        getStudentBatches(),
        getProfiles()
      ]);
      setBatches(bData);
      setProfiles(pData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    try {
      await upsertStudentBatch(editingBatch);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan batch.");
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm("Hapus batch ini?")) return;
    try {
      await deleteStudentBatch(id);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus batch.");
    }
  };

  const filteredTeachers = profiles.filter(p => p.is_teacher && (selectedBatchId === "all" || p.batch === batches.find(b => b.id === selectedBatchId)?.name));
  const filteredStudents = profiles.filter(p => p.is_student && (selectedBatchId === "all" || p.batch === batches.find(b => b.id === selectedBatchId)?.name));

  if (loading) return <div className="p-10 text-center font-black text-slate-300 uppercase tracking-widest animate-pulse">Loading Batch Data...</div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase underline decoration-indigo-500 decoration-8 underline-offset-4">Batch Management</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Organize Teachers & Students by Group</p>
        </div>
        
        {isAdmin && (
           <button 
             onClick={() => {
               setEditingBatch({ name: "", description: "", start_date: "", end_date: "" });
               setIsModalOpen(true);
             }}
             className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-slate-900 transition-all active:scale-95 italic"
           >
             + Create New Batch
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR: BATCH LIST */}
        <aside className="lg:col-span-1 space-y-4">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Batch Group</p>
              </div>
              <div className="p-2 space-y-1">
                 <button 
                    onClick={() => setSelectedBatchId("all")}
                    className={`w-full text-left px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedBatchId === "all" ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                    🌐 All Members
                 </button>
                 {batches.map(batch => (
                    <div key={batch.id} className="relative group">
                       <button 
                          onClick={() => setSelectedBatchId(batch.id)}
                          className={`w-full text-left px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedBatchId === batch.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                       >
                          📁 {batch.name}
                       </button>
                       {isAdmin && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => { setEditingBatch(batch); setIsModalOpen(true); }} className="h-7 w-7 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-xs shadow-sm hover:bg-indigo-50">✍️</button>
                             <button onClick={() => handleDeleteBatch(batch.id)} className="h-7 w-7 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-xs shadow-sm hover:bg-rose-50 text-rose-500">🗑️</button>
                          </div>
                       )}
                    </div>
                 ))}
                 {batches.length === 0 && (
                    <p className="p-6 text-center text-[9px] font-bold text-slate-300 italic uppercase">No batches found</p>
                 )}
              </div>
           </div>
        </aside>

        {/* MAIN CONTENT: TEACHERS & STUDENTS */}
        <main className="lg:col-span-3 space-y-8">
           {/* TEACHERS SECTION */}
           <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 {/* <h3 className="text-xl font-black italic text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-sm">👨‍🏫</span>
                    KELOLA GURU {selectedBatchId !== "all" ? `- ${batches.find(b => b.id === selectedBatchId)?.name}` : ""}
                 </h3> */}
                 {/* <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">{filteredTeachers.length} Persons</span> */}
              </div>
              <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTeachers.map(teacher => (
                       <div key={teacher.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="h-16 w-16 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shrink-0 flex items-center justify-center font-black text-slate-300">
                             {teacher.avatar_url ? <img src={teacher.avatar_url} className="w-full h-full object-cover" /> : teacher.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                             <p className="font-black text-slate-900 italic uppercase text-xs truncate">{teacher.full_name}</p>
                             <p className="text-[9px] font-bold text-slate-400 font-mono truncate">{teacher.email}</p>
                             <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[8px] font-black uppercase tracking-widest">TEACHER</span>
                                {teacher.batch && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">{teacher.batch}</span>}
                             </div>
                          </div>
                       </div>
                    ))}
                    {filteredTeachers.length === 0 && (
                       <div className="col-span-full py-10 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No teachers in this batch</p>
                       </div>
                    )}
                 </div>
              </div>
           </section>

           {/* STUDENTS SECTION */}
           <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                 <h3 className="text-xl font-black italic text-slate-900 tracking-tight flex items-center gap-3">
                    <span className="h-8 w-8 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center text-sm">🎓</span>
                    KELOLA MURID {selectedBatchId !== "all" ? `- ${batches.find(b => b.id === selectedBatchId)?.name}` : ""}
                 </h3>
                 <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500">{filteredStudents.length} Students</span>
              </div>
              <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredStudents.map(student => (
                       <div key={student.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm shrink-0 flex items-center justify-center font-black text-slate-300">
                             {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : student.full_name.charAt(0)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                             <p className="font-black text-slate-900 italic uppercase text-xs truncate">{student.full_name}</p>
                             <p className="text-[9px] font-bold text-slate-400 font-mono truncate">{student.email}</p>
                             <div className="flex gap-2 mt-2">
                                <span className="px-2 py-0.5 bg-teal-100 text-teal-600 rounded-md text-[8px] font-black uppercase tracking-widest">STUDENT</span>
                                {student.batch && <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">{student.batch}</span>}
                             </div>
                          </div>
                       </div>
                    ))}
                    {filteredStudents.length === 0 && (
                       <div className="col-span-full py-10 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No students in this batch</p>
                       </div>
                    )}
                 </div>
              </div>
           </section>
        </main>
      </div>

      {/* BATCH MODAL */}
      <AnimatePresence>
         {isModalOpen && editingBatch && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                  onClick={() => setIsModalOpen(false)} 
               />
               <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                  className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10"
               >
                  <h3 className="text-2xl font-black italic text-slate-900 uppercase mb-8">{editingBatch.id ? "Edit Batch" : "Create New Batch"}</h3>
                  <form onSubmit={handleSaveBatch} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Batch Name</label>
                        <input 
                           required
                           className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none font-bold shadow-sm transition-all"
                           placeholder="Contoh: Batch 12"
                           value={editingBatch.name || ""}
                           onChange={e => setEditingBatch({...editingBatch, name: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Description</label>
                        <textarea 
                           className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none font-bold shadow-sm transition-all min-h-[100px]"
                           placeholder="Optional description..."
                           value={editingBatch.description || ""}
                           onChange={e => setEditingBatch({...editingBatch, description: e.target.value})}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Start Date</label>
                           <input 
                              type="date"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none font-bold shadow-sm transition-all"
                              value={editingBatch.start_date || ""}
                              onChange={e => setEditingBatch({...editingBatch, start_date: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">End Date</label>
                           <input 
                              type="date"
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:border-indigo-600 outline-none font-bold shadow-sm transition-all"
                              value={editingBatch.end_date || ""}
                              onChange={e => setEditingBatch({...editingBatch, end_date: e.target.value})}
                           />
                        </div>
                     </div>
                     <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition">Cancel</button>
                        <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-slate-900/20 active:scale-95 transition italic">Save Batch Identity</button>
                     </div>
                  </form>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
