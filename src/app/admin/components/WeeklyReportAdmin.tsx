"use client";

import { useState, useEffect } from "react";
import { 
  getWeeklyReports, 
  getStudentBatches,
  getProfiles,
  deleteWeeklyReport
} from "@/lib/db";
import { Profile, WeeklyReport, StudentBatch } from "@/lib/types";
import { exportToExcel, exportToPDF } from "@/lib/ExportUtils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Filter, 
  User, 
  Calendar, 
  Search, 
  Trash2, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Users
} from "lucide-react";

export default function WeeklyReportAdmin() {
  const [reports, setReports] = useState<(WeeklyReport & { profiles?: { full_name: string } })[]>([]);
  const [allBatches, setAllBatches] = useState<StudentBatch[]>([]);
  const [allTeachers, setAllTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal for detail view
  const [selectedReport, setSelectedReport] = useState<(WeeklyReport & { profiles?: { full_name: string } }) | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportData, batchData, profiles] = await Promise.all([
        getWeeklyReports(),
        getStudentBatches(),
        getProfiles()
      ]);
      setReports(reportData as any);
      setAllBatches(batchData);
      setAllTeachers(profiles.filter(p => p.is_teacher));
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan mingguan ini?")) return;
    try {
      await deleteWeeklyReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (selectedReport?.id === id) setSelectedReport(null);
    } catch (err) {
      alert("Gagal menghapus laporan.");
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesBatch = selectedBatch === "all" || report.batch === selectedBatch;
    const matchesTeacher = selectedTeacher === "all" || report.teacher_id === selectedTeacher;
    const matchesSearch = searchQuery === "" || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesBatch && matchesTeacher && matchesSearch;
  });

  const handleExportExcel = () => {
    const data = filteredReports.map(r => ({
      'Tanggal': new Date(r.report_date).toLocaleDateString('id-ID'),
      'Batch': r.batch,
      'Instruktur': r.profiles?.full_name || '-',
      'Judul Laporan': r.title,
      'Isi Kemajuan': r.content,
      'Kendala': r.obstacles || '-',
      'Saran & Solusi': r.suggestions || '-'
    }));
    exportToExcel(data, `Laporan_Mingguan_Guru_${new Date().toISOString().split('T')[0]}`, 'Laporan Mingguan');
  };

  const handleExportPDF = () => {
    const columns = ['Tanggal', 'Batch', 'Instruktur', 'Judul Laporan', 'Isi Laporan'];
    const rows = filteredReports.map(r => [
      new Date(r.report_date).toLocaleDateString('id-ID'),
      r.batch,
      r.profiles?.full_name || '-',
      r.title,
      r.content.length > 50 ? r.content.substring(0, 50) + '...' : r.content
    ]);
    exportToPDF('Laporan Mingguan Guru', columns, rows, `Laporan_Mingguan_Guru_${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Loading Weekly Reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Riwayat Laporan Mingguan Guru</h2>
           <p className="text-xs text-slate-500 font-medium mt-1">Monitoring progres pengajaran dan kendala dari seluruh instruktur.</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 flex items-center gap-3">
              <div className="h-8 w-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-100">
                {reports.length}
              </div>
              <div>
                 <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Total Laporan</p>
                 <p className="text-xs font-bold text-indigo-900 leading-none mt-1">Mingguan</p>
              </div>
           </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex items-center gap-4 justify-end">
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
          >
            ↓ Export Excel
          </button>
          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
          >
            ↓ Export PDF
          </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/40">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
                  <Search className="w-3 h-3" /> Search Report
               </label>
               <input 
                 type="text"
                 placeholder="Cari judul atau isi..."
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
                 className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
               />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
                  <Users className="w-3 h-3" /> Pilih Batch
               </label>
               <select 
                 value={selectedBatch}
                 onChange={e => setSelectedBatch(e.target.value)}
                 className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
               >
                  <option value="all">Semua Batch</option>
                  {allBatches.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
               </select>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 flex items-center gap-2">
                  <User className="w-3 h-3" /> Pilih Guru
               </label>
               <select 
                 value={selectedTeacher}
                 onChange={e => setSelectedTeacher(e.target.value)}
                 className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
               >
                  <option value="all">Semua Guru</option>
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
               </select>
            </div>

            <button 
              onClick={() => { setSelectedBatch("all"); setSelectedTeacher("all"); setSearchQuery(""); }}
              className="px-5 py-3 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all"
            >
               Reset Filter
            </button>
         </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={report.id}
              className="bg-white border border-slate-100 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all group flex flex-col md:flex-row md:items-center gap-6 cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="h-16 w-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <span className="text-[8px] font-black uppercase leading-none mb-1 opacity-60">BATCH</span>
                  <span className="text-lg font-black italic leading-none">{report.batch}</span>
              </div>

              <div className="flex-1 space-y-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{report.profiles?.full_name || 'Guru'}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold text-slate-400">{new Date(report.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                 </div>
                 <h3 className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{report.title}</h3>
                 <p className="text-xs text-slate-500 line-clamp-1 font-medium italic">&quot;{report.content.substring(0, 100)}...&quot;</p>
              </div>

              <div className="flex items-center gap-4">
                 <div className="hidden lg:flex items-center gap-3">
                    {report.obstacles && (
                       <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100">
                          Kendala Ada
                       </div>
                    )}
                    {report.suggestions && (
                       <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                          Saran Ada
                       </div>
                    )}
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(report.id!); }}
                      className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all border border-slate-100"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-all border border-indigo-100">
                       <ChevronRight className="w-4 h-4" />
                    </div>
                 </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
             <div className="text-4xl mb-4">📭</div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tidak ada laporan yang sesuai filter</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                       <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                              Batch {selectedReport.batch}
                           </span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedReport.profiles?.full_name}</span>
                        </div>
                        <h3 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">
                          Detail Laporan Mingguan
                        </h3>
                    </div>
                </div>
                <button onClick={() => setSelectedReport(null)} className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all shadow-sm border border-slate-100">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                {/* Info Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Calendar className="w-3 h-3" /> Tanggal Laporan</p>
                      <p className="text-sm font-bold text-slate-900">{new Date(selectedReport.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   </div>
                   <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><User className="w-3 h-3" /> Instruktur</p>
                      <p className="text-sm font-bold text-slate-900">{selectedReport.profiles?.full_name || 'Tidak diketahui'}</p>
                   </div>
                   <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Status</p>
                      <p className="text-sm font-bold text-emerald-600 uppercase tracking-widest text-[10px]">Tersubmit</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2 flex items-center gap-2">
                        <FileText className="w-3 h-3 text-indigo-600" /> Isi Laporan & Kemajuan
                      </h4>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-5">
                            <FileText className="w-24 h-24" />
                         </div>
                         <h5 className="text-lg font-black text-slate-900 mb-4 uppercase tracking-tight underline decoration-indigo-200 decoration-4 underline-offset-8">{selectedReport.title}</h5>
                         <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {selectedReport.content}
                         </p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {selectedReport.obstacles && (
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-2 flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" /> Kendala / Masalah
                            </h4>
                            <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 relative overflow-hidden">
                               <p className="text-xs text-rose-700 leading-relaxed font-bold italic">
                                  &quot;{selectedReport.obstacles}&quot;
                                </p>
                            </div>
                         </div>
                      )}

                      {selectedReport.suggestions && (
                         <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 px-2 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3" /> Saran & Solusi
                            </h4>
                            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 relative overflow-hidden">
                               <p className="text-xs text-emerald-700 leading-relaxed font-bold italic">
                                  &quot;{selectedReport.suggestions}&quot;
                                </p>
                            </div>
                         </div>
                      )}
                   </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Tutup Detail
                </button>
                <button 
                  onClick={() => handleDelete(selectedReport.id!)}
                  className="px-8 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  Hapus
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
