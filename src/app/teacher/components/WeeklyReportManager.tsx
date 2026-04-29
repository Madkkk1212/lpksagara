"use client";

import { useState, useEffect } from "react";
import { 
  getWeeklyReports, 
  upsertWeeklyReport, 
  deleteWeeklyReport, 
  getStudentBatches 
} from "@/lib/db";
import { Profile, WeeklyReport, StudentBatch } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function WeeklyReportManager({ teacher }: { teacher: Profile }) {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [allBatches, setAllBatches] = useState<StudentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('history');

  // Form State
  const [editingReport, setEditingReport] = useState<Partial<WeeklyReport> | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [obstacles, setObstacles] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (teacher.id) {
      fetchData();
    }
  }, [teacher.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportData, batchData] = await Promise.all([
        getWeeklyReports(teacher.id!),
        getStudentBatches()
      ]);
      setReports(reportData);
      setAllBatches(batchData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingReport(null);
    setSelectedBatch("");
    setTitle("");
    setContent("");
    setObstacles("");
    setSuggestions("");
    setReportDate(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (report: WeeklyReport) => {
    setEditingReport(report);
    setSelectedBatch(report.batch);
    setTitle(report.title);
    setContent(report.content);
    setObstacles(report.obstacles || "");
    setSuggestions(report.suggestions || "");
    setReportDate(report.report_date);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title || !content || !selectedBatch || !teacher.id) {
        alert("Mohon lengkapi Batch, Judul, dan Isi Laporan.");
        return;
    }
    setIsSubmitting(true);
    try {
      const reportData: Partial<WeeklyReport> = {
        ...(editingReport?.id ? { id: editingReport.id } : {}),
        teacher_id: teacher.id,
        batch: selectedBatch,
        title,
        content,
        obstacles,
        suggestions,
        report_date: reportDate
      };
      
      await upsertWeeklyReport(reportData as WeeklyReport);
      await fetchData();
      setIsModalOpen(false);
      resetForm();
      setActiveTab('history');
    } catch (err) {
      alert("Gagal menyimpan laporan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan mingguan ini?")) return;
    try {
      await deleteWeeklyReport(id);
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus laporan.");
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-300 font-black uppercase tracking-widest">Loading Reports...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Riwayat Laporan Mingguan</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Pantau dan kelola laporan kemajuan pembelajaran mingguan.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Riwayat
            </button>
            <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all ml-1"
            >
                + Buat Laporan
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.length > 0 ? (
          reports.map(report => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              key={report.id} 
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                 <button onClick={() => handleEdit(report)} className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm">✎</button>
                 <button onClick={() => handleDelete(report.id!)} className="h-10 w-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">✕</button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-100">
                    📋
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                            Batch {report.batch}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(report.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{report.title}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Isi Laporan / Kemajuan</h4>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-[2rem] border border-slate-50">
                            {report.content}
                        </p>
                    </div>
                </div>
                <div className="space-y-6">
                    {report.obstacles && (
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Kendala</h4>
                            <div className="text-xs text-rose-600 bg-rose-50/50 p-5 rounded-2xl border border-rose-50 italic">
                                "{report.obstacles}"
                            </div>
                        </div>
                    )}
                    {report.suggestions && (
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Saran & Masukan</h4>
                            <div className="text-xs text-emerald-600 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-50 italic">
                                "{report.suggestions}"
                            </div>
                        </div>
                    )}
                    <div className="pt-4 border-t border-slate-50">
                        <p className="text-[8px] font-medium text-slate-400 italic">Terakhir diperbarui: {new Date(report.updated_at || "").toLocaleString('id-ID')}</p>
                    </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
             <div className="text-4xl mb-4">📭</div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Belum ada riwayat laporan</p>
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
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">📝</div>
                    <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">
                    {editingReport ? 'Edit Laporan' : 'Buat Laporan Mingguan'}
                    </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all shadow-sm">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">1. Pilih Batch</label>
                      <select 
                        value={selectedBatch}
                        onChange={e => setSelectedBatch(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                      >
                        <option value="">-- Pilih Batch --</option>
                        {allBatches.map(b => (
                           <option key={b.id} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">2. Tanggal Laporan</label>
                      <input 
                        type="date" 
                        value={reportDate}
                        onChange={e => setReportDate(e.target.value)}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">3. Judul Laporan</label>
                      <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="CONTOH: LAPORAN PROGRES MINGGU 1 - MEI"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">4. Isi Laporan / Kemajuan</label>
                        <textarea 
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={8}
                            placeholder="Jelaskan kemajuan materi, aktivitas kelas, dan pencapaian murid..."
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-rose-50/30 p-8 rounded-[2rem] border border-rose-100">
                        <label className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-3 block">Kendala (Opsional)</label>
                        <textarea 
                            value={obstacles}
                            onChange={e => setObstacles(e.target.value)}
                            rows={4}
                            placeholder="Apa kendala yang dihadapi selama seminggu ini?"
                            className="w-full px-6 py-4 bg-white border border-rose-100 rounded-2xl text-[10px] font-black uppercase focus:border-rose-400 outline-none resize-none"
                        />
                    </div>

                    <div className="bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100">
                        <label className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 block">Saran & Masukan (Opsional)</label>
                        <textarea 
                            value={suggestions}
                            onChange={e => setSuggestions(e.target.value)}
                            rows={4}
                            placeholder="Berikan saran untuk perbaikan atau kebutuhan murid..."
                            className="w-full px-6 py-4 bg-white border border-emerald-100 rounded-2xl text-[10px] font-black uppercase focus:border-emerald-400 outline-none resize-none"
                        />
                    </div>

                    <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Tips Pengisian</p>
                        <ul className="text-[9px] space-y-2 opacity-80 list-disc pl-4 font-medium leading-relaxed">
                            <li>Gunakan bahasa yang jelas dan profesional.</li>
                            <li>Fokus pada fakta kemajuan dan data yang objektif.</li>
                            <li>Kendala akan membantu Admin/Super Admin memberikan solusi.</li>
                        </ul>
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
                  disabled={isSubmitting || !title || !content || !selectedBatch}
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
