"use client";

import { useState, useEffect } from "react";
import { 
  getWeeklyTargets, 
  upsertWeeklyTarget, 
  deleteWeeklyTarget, 
  getAllStudyMaterials,
  getStudentBatches,
  getAllStudyChapters,
  getStudyLevels
} from "@/lib/db";
import { Profile, WeeklyTarget, StudyMaterial, StudentBatch, StudyChapter, StudyLevel } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function WeeklyTargetManager({ teacher, students }: { teacher: Profile, students: Profile[] }) {
  const [targets, setTargets] = useState<WeeklyTarget[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [allBatches, setAllBatches] = useState<StudentBatch[]>([]);
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [editingTarget, setEditingTarget] = useState<Partial<WeeklyTarget> | null>(null);
  const [targetType, setTargetType] = useState<'personal' | 'batch'>('batch');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  useEffect(() => {
    if (teacher.id) {
      fetchData();
    }
  }, [teacher.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [targetData, materialData, batchData, chapterData, levelData] = await Promise.all([
        getWeeklyTargets(teacher.id!),
        getAllStudyMaterials(),
        getStudentBatches(),
        getAllStudyChapters(),
        getStudyLevels()
      ]);
      setTargets(targetData);
      setMaterials(materialData);
      setAllBatches(batchData);
      setChapters(chapterData);
      setLevels(levelData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingTarget(null);
    setTargetType('batch');
    setSelectedStudentIds([]);
    setSelectedBatch("");
    setSelectedLevelId("");
    setSelectedChapterId("");
    setTitle("");
    setDescription("");
    setSelectedMaterialIds([]);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  };

  const handleEdit = (target: WeeklyTarget) => {
    setEditingTarget(target);
    setTargetType(target.target_type);
    setSelectedStudentIds(target.student_id ? [target.student_id] : []);
    setSelectedBatch(target.batch || "");
    setSelectedLevelId(""); // Level/Chapter info isn't stored in target, so we reset it
    setSelectedChapterId("");
    setTitle(target.title);
    setDescription(target.description || "");
    setSelectedMaterialIds(target.material_ids || []);
    setStartDate(target.start_date);
    setEndDate(target.end_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !teacher.id) return;
    setIsSubmitting(true);
    try {
      if (targetType === 'personal' && selectedStudentIds.length > 0 && !editingTarget) {
        // Multi-create for personal targets
        await Promise.all(selectedStudentIds.map(sid => {
          return upsertWeeklyTarget({
            teacher_id: teacher.id!,
            target_type: 'personal',
            student_id: sid,
            batch: null,
            title,
            description,
            material_ids: selectedMaterialIds,
            start_date: startDate,
            end_date: endDate,
            status: 'active'
          });
        }));
      } else {
        // Normal single create/update
        const targetData: Partial<WeeklyTarget> = {
          ...(editingTarget?.id ? { id: editingTarget.id } : {}),
          teacher_id: teacher.id,
          target_type: targetType,
          student_id: targetType === 'personal' ? (selectedStudentIds[0] || null) : null,
          batch: targetType === 'batch' ? selectedBatch : null,
          title,
          description,
          material_ids: selectedMaterialIds,
          start_date: startDate,
          end_date: endDate,
          status: editingTarget?.status || 'active'
        };
        await upsertWeeklyTarget(targetData);
      }
      await fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Gagal menyimpan laporan mingguan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan mingguan ini?")) return;
    try {
      await deleteWeeklyTarget(id);
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus laporan.");
    }
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest">Loading Reports...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Laporan Materi Mingguan</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Kelola target dan progress materi untuk murid Anda.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-6 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          + Buat Laporan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets.map(target => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            key={target.id} 
            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
               <button onClick={() => handleEdit(target)} className="h-8 w-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">✎</button>
               <button onClick={() => handleDelete(target.id)} className="h-8 w-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all">✕</button>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${target.target_type === 'batch' ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
                {target.target_type === 'batch' ? '📁 ' + target.batch : '👤 Personal'}
              </span>
              <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${target.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                {target.status}
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 uppercase tracking-tight">{target.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2 mb-6">{target.description}</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                <span>Timeline</span>
                <span className="text-slate-900">{new Date(target.start_date).toLocaleDateString('id-ID')} - {new Date(target.end_date).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="pt-4 border-t border-slate-50">
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{target.material_ids?.length || 0} Materi Terlampir</p>
                 <div className="flex flex-wrap gap-1">
                    {target.material_ids?.slice(0, 3).map(mid => {
                       const m = materials.find(mat => mat.id === mid);
                       return <span key={mid} className="px-2 py-1 bg-slate-50 rounded-md text-[8px] font-bold text-slate-500">{m?.title || 'Material'}</span>
                    })}
                    {(target.material_ids?.length || 0) > 3 && <span className="px-2 py-1 bg-slate-50 rounded-md text-[8px] font-bold text-slate-500">+{target.material_ids.length - 3}</span>}
                 </div>
              </div>
            </div>
          </motion.div>
        ))}

        {targets.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Belum ada laporan mingguan</p>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">
                  {editingTarget ? 'Edit Laporan' : 'Buat Laporan Mingguan'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all shadow-sm">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Jenis Target</label>
                      <div className="flex gap-3">
                        {['batch', 'personal'].map((t: any) => (
                          <button 
                            key={t}
                            onClick={() => setTargetType(t)}
                            className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${targetType === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                          >
                            {t === 'batch' ? '📁 Per Batch' : '👤 Personal'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {targetType === 'personal' ? (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                          Pilih Murid ({selectedStudentIds.length} Terpilih)
                        </label>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-h-[150px] overflow-y-auto custom-scrollbar space-y-1">
                          {students.map(s => (
                             <button 
                                key={s.id}
                                onClick={() => {
                                  setSelectedStudentIds(prev => 
                                    prev.includes(s.id!) ? prev.filter(id => id !== s.id) : [...prev, s.id!]
                                  );
                                }}
                                className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${selectedStudentIds.includes(s.id!) ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                             >
                                <div className="text-left">
                                  <p className="text-[9px] font-black uppercase leading-none">{s.full_name}</p>
                                  <p className="text-[7px] mt-1 opacity-60">{s.email}</p>
                                </div>
                                {selectedStudentIds.includes(s.id!) && <span className="text-[10px]">✓</span>}
                             </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Pilih Batch</label>
                        <select 
                          value={selectedBatch}
                          onChange={e => setSelectedBatch(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                        >
                          <option value="">-- Pilih Batch --</option>
                          <option value="Semua">🌐 SEMUA BATCH</option>
                          {/* Combine batches from student_batches table and unique batches from assigned students */}
                          {Array.from(new Set([
                            ...allBatches.map(b => b.name),
                            ...students.map(s => s.batch).filter(Boolean)
                          ])).sort().map(b => (
                             <option key={b as string} value={b as string}>{b}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Judul Laporan</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="CONTOH: TARGET MATERI N4 MINGGU KE-1"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Mulai</label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Selesai</label>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={e => setEndDate(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Catatan Tambahan</label>
                      <textarea 
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={4}
                        placeholder="BERIKAN INSTRUKSI ATAU CATATAN UNTUK MURID..."
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">1. Pilih Level</label>
                        <select 
                          value={selectedLevelId}
                          onChange={e => {
                            setSelectedLevelId(e.target.value);
                            setSelectedChapterId(""); // Reset chapter when level changes
                          }}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                        >
                          <option value="">-- Pilih Level --</option>
                          {levels.map(l => (
                            <option key={l.id} value={l.id}>{l.title} ({l.level_code})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">2. Pilih Bab</label>
                        <select 
                          value={selectedChapterId}
                          onChange={e => setSelectedChapterId(e.target.value)}
                          disabled={!selectedLevelId}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none disabled:opacity-50"
                        >
                          <option value="">-- Pilih Bab --</option>
                          {chapters
                            .filter(c => c.level_id === selectedLevelId)
                            .map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                      3. Pilih Materi ({selectedMaterialIds.length} Terpilih)
                    </label>
                    <div className="flex-1 bg-slate-50 rounded-[2rem] border border-slate-100 p-6 overflow-y-auto max-h-[300px] custom-scrollbar">
                       <div className="space-y-2">
                          {selectedChapterId ? (
                            materials.filter(m => m.chapter_id === selectedChapterId).length > 0 ? (
                              materials.filter(m => m.chapter_id === selectedChapterId).map(m => (
                                <button 
                                   key={m.id}
                                   onClick={() => toggleMaterial(m.id)}
                                   className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${selectedMaterialIds.includes(m.id) ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-slate-100 text-slate-600'}`}
                                >
                                   <span className="text-[9px] font-black uppercase truncate mr-4">{m.title}</span>
                                   {selectedMaterialIds.includes(m.id) && <span className="text-[10px]">✓</span>}
                                </button>
                              ))
                            ) : (
                              <p className="text-center py-10 text-[10px] font-black uppercase text-slate-400">Tidak ada materi di bab ini</p>
                            )
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                               <span className="text-4xl mb-4">📖</span>
                               <p className="text-[9px] font-black uppercase tracking-widest">Pilih Bab di atas</p>
                            </div>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title}
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'MENYIMPAN...' : 'SIMPAN LAPORAN'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
