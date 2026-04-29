"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Profile, StudyLevel, ChapterTemplate, AdditionalCol } from "@/lib/types";
import { exportToExcel, exportToPDF } from "@/lib/ExportUtils";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, ChevronRight, FileText, Star, TrendingUp, Users, Download, Filter } from "lucide-react";

export default function AllStudentsAssessment({ students, levels }: { students: Profile[], levels: StudyLevel[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  
  const [templates, setTemplates] = useState<ChapterTemplate[]>([]);
  const [additionalCols, setAdditionalCols] = useState<AdditionalCol[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, Record<string, Record<string, string>>>>({});

  // Derived batches from ALL students in the system
  const availableBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean))) as string[];

  const fetchTemplatesAndSettings = useCallback(async (levelId: string) => {
    setTemplateLoading(true);
    try {
      const [tplRes, setRes] = await Promise.all([
        supabase.from("assessment_chapter_templates").select("*").eq("level_id", levelId).eq("is_active", true).order("sort_order"),
        supabase.from("assessment_report_settings").select("*").eq("level_id", levelId).maybeSingle()
      ]);

      setTemplates(tplRes.data || []);
      setAdditionalCols(setRes.data?.additional_columns || []);
    } catch (err) {
      console.error("Fetch template error:", err);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const fetchGradesForBatch = useCallback(async () => {
    setLoading(true);
    try {
      const currentBatchStudents = selectedBatchId === "ALL" 
        ? students 
        : students.filter(s => s.batch === selectedBatchId);
      const studentEmails = currentBatchStudents.map(s => s.email);

      if (studentEmails.length === 0) {
        setMatrix({});
        return;
      }

      const { data } = await supabase
        .from("assessment_chapter_grades")
        .select("*")
        .in("student_email", studentEmails)
        .or(`level_id.eq.${selectedLevelId},template_id.in.(${templates.map(t => t.id).join(",")})`);

      const newMatrix: Record<string, Record<string, Record<string, string>>> = {};
      (data || []).forEach((item: any) => {
        const email = item.student_email;
        const key = item.template_id || "additional";
        if (!newMatrix[email]) newMatrix[email] = {};
        if (!newMatrix[email][key]) newMatrix[email][key] = {};
        newMatrix[email][key][item.column_label] = item.value;
      });
      setMatrix(newMatrix);
    } catch (err) {
      console.error("Fetch grades error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId, selectedLevelId, students, templates]);

  useEffect(() => {
    if (selectedLevelId) {
      fetchTemplatesAndSettings(selectedLevelId);
    } else {
      setTemplates([]);
      setAdditionalCols([]);
    }
  }, [selectedLevelId, fetchTemplatesAndSettings]);

  useEffect(() => {
    if (selectedBatchId && selectedLevelId && templates.length > 0) {
      fetchGradesForBatch();
    }
  }, [selectedBatchId, selectedLevelId, templates, fetchGradesForBatch]);

  const filteredStudents = selectedBatchId === "ALL" 
    ? students 
    : students.filter(s => s.batch === selectedBatchId);

  const getBaseName = (name: string) => name.replace(/\s*[\(\d].*$/, '').trim();

  // Compute Columns and Data
  const uniqueBaseQuizNames = useMemo(() => {
    return Array.from(new Set(
      templates.flatMap(t => t.columns.map(c => {
        const parts = c.label.split(" ::: ");
        const label = parts.length > 1 ? parts[1] : c.label;
        return getBaseName(label);
      }))
    )).filter(l => l && l !== "-");
  }, [templates]);

  const uniqueBaseManualNames = useMemo(() => {
    return Array.from(new Set(
      additionalCols
        .map(c => getBaseName(c.name))
        .filter(n => {
          const un = n.toUpperCase();
          return un !== "RATA-RATA" && un !== "REMEDIAL" && un !== "AVG" && un !== "-";
        })
    ));
  }, [additionalCols]);

  const computedData = useMemo(() => {
    return filteredStudents.map((stu, sIdx) => {
      const stuMatrix = matrix[stu.email] || {};
      
      const quizGroupScores: Record<string, number[]> = {};
      uniqueBaseQuizNames.forEach(l => quizGroupScores[l] = []);

      templates.forEach(tpl => {
        const tplGrades = stuMatrix[tpl.id || ""] || {};
        tpl.columns.forEach(col => {
          const parts = col.label.split(" ::: ");
          const label = parts.length > 1 ? parts[1] : col.label;
          const base = getBaseName(label);
          if (uniqueBaseQuizNames.includes(base)) {
            const val = parseFloat(tplGrades[col.label]);
            if (!isNaN(val)) quizGroupScores[base].push(val);
          }
        });
      });

      const consolidatedQuizAvgs = uniqueBaseQuizNames.map(base => {
        const scores = quizGroupScores[base];
        return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      });

      const manualGroupScores: Record<string, number[]> = {};
      uniqueBaseManualNames.forEach(n => manualGroupScores[n] = []);

      const addMatrix = stuMatrix["additional"] || {};
      additionalCols.forEach(col => {
        const base = getBaseName(col.name);
        if (uniqueBaseManualNames.includes(base)) {
          const val = parseFloat(addMatrix[col.id]);
          if (!isNaN(val)) manualGroupScores[base].push(val);
        }
      });

      const consolidatedManualAvgs = uniqueBaseManualNames.map(base => {
        const scores = manualGroupScores[base];
        return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      });

      return {
        stu,
        index: sIdx + 1,
        consolidatedQuizAvgs,
        consolidatedManualAvgs
      };
    });
  }, [filteredStudents, matrix, templates, additionalCols, uniqueBaseQuizNames, uniqueBaseManualNames]);

  const handleExportExcel = () => {
    const data = computedData.map(row => {
      const result: any = {
        'Rank': row.index,
        'Nama Lengkap Siswa': row.stu.full_name,
        'Batch': row.stu.batch || 'NO BATCH'
      };
      
      uniqueBaseQuizNames.forEach((name, i) => {
        result[name + ' (Quiz)'] = row.consolidatedQuizAvgs[i] || 0;
      });
      
      uniqueBaseManualNames.forEach((name, i) => {
        result[name + ' (Manual)'] = row.consolidatedManualAvgs[i] || 0;
      });

      return result;
    });

    exportToExcel(data, `Rekapitulasi_Nilai_${selectedBatchId}_${new Date().toISOString().split('T')[0]}`, 'Rekapitulasi Nilai');
  };

  const handleExportPDF = () => {
    const columns = [
      'Rank', 'Nama Lengkap', 'Batch',
      ...uniqueBaseQuizNames.map(n => n + ' (Q)'),
      ...uniqueBaseManualNames.map(n => n + ' (M)')
    ];

    const rows = computedData.map(row => [
      row.index,
      row.stu.full_name,
      row.stu.batch || '-',
      ...row.consolidatedQuizAvgs.map(v => v || 0),
      ...row.consolidatedManualAvgs.map(v => v || 0)
    ]);

    exportToPDF('Rekapitulasi Nilai Konsolidasi', columns, rows, `Rekapitulasi_Nilai_${selectedBatchId}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Filter Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Nilai Seluruh Siswa</h2>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest opacity-70">Laporan Rekapitulasi Nilai Konsolidasi Global</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-w-[240px] appearance-none uppercase tracking-widest"
              >
                <option value="">Pilih Angkatan (Batch)</option>
                <option value="ALL">Semua Angkatan</option>
                {availableBatches.map(batchName => (
                  <option key={batchName} value={batchName}>{batchName}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <select
                value={selectedLevelId}
                onChange={e => setSelectedLevelId(e.target.value)}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-w-[200px] appearance-none uppercase tracking-widest"
              >
                <option value="">Pilih Level Studi</option>
                {levels.map(l => (
                  <option key={l.id} value={l.id}>{l.level_code} — {l.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(!selectedBatchId || !selectedLevelId) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-[3rem] p-32 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-8"
          >
            <div className="relative">
              <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner">📋</div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-bounce">
                <Search className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">Siap Melihat Laporan?</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">Pilih angkatan dan level studi untuk menampilkan rekapitulasi nilai konsolidasi seluruh siswa secara real-time.</p>
            </div>
          </motion.div>
        ) : (templateLoading || loading) ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-40 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm"
          >
            <div className="relative">
              <div className="w-20 h-20 border-[6px] border-slate-100 rounded-full" />
              <div className="absolute top-0 left-0 w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] mt-8 text-[10px]">Sinkronisasi Data Nilai...</p>
          </motion.div>
        ) : templates.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Consolidated Summary Table (Rekapitulasi) */}
            <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/20">
              <div className="px-10 py-8 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Rekapitulasi Nilai Konsolidasi</h3>
                    <p className="text-[10px] text-indigo-300/60 font-black uppercase tracking-[0.2em]">Berdasarkan {filteredStudents.length} Siswa — {selectedBatchId === 'ALL' ? 'Semua Angkatan' : selectedBatchId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                    <Download className="w-3.5 h-3.5" />
                    Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                    <FileText className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-900">
                      <th className="sticky left-0 z-20 p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center w-16 text-slate-400">Rank</th>
                      <th className="sticky left-16 z-20 p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-left min-w-[280px]">Nama Lengkap Siswa</th>
                      
                      {/* Consolidated Quiz Headers (Smart Grouping) */}
                      {uniqueBaseQuizNames.map(label => (
                        <th key={label} className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center bg-white/50 text-slate-600">
                          {label}
                          <span className="block text-[7px] mt-0.5 text-indigo-400 tracking-tighter opacity-70">(GROUP AVG)</span>
                        </th>
                      ))}

                      {/* Consolidated Manual Additional Materials Headers (Smart Grouping) */}
                      {uniqueBaseManualNames.map(name => (
                        <th key={name} className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center bg-indigo-50/30 text-indigo-600">
                          {name}
                          <span className="block text-[7px] mt-0.5 text-indigo-400 tracking-tighter opacity-70">(Manual Group)</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {computedData.map(({ stu, index, consolidatedQuizAvgs, consolidatedManualAvgs }) => (
                      <tr key={stu.id} className="hover:bg-indigo-50/10 transition-colors group">
                        <td className="sticky left-0 z-10 p-5 bg-white border-r border-slate-100 text-center">
                          <span className="text-[11px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors">
                            #{index}
                          </span>
                        </td>
                        <td className="sticky left-16 z-10 p-5 bg-white border-r border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase border border-slate-100">
                              {stu.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">{stu.full_name}</p>
                              <p className="text-[9px] text-slate-400 font-bold tracking-widest">{stu.batch || 'NO BATCH'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Render Consolidated Quiz Group Averages */}
                        {consolidatedQuizAvgs.map((avg, i) => (
                          <td key={i} className="p-5 border-r border-slate-50 text-center">
                            <span className={`text-[14px] font-black tabular-nums ${avg >= 75 ? 'text-slate-600' : 'text-rose-400'}`}>{avg || ""}</span>
                          </td>
                        ))}

                        {/* Render Consolidated Manual Group Averages */}
                        {consolidatedManualAvgs.map((avg, i) => (
                          <td key={i} className="p-5 border-r border-slate-50 text-center bg-indigo-50/5 last:border-r-0">
                            <span className="text-[14px] font-black text-indigo-500 tabular-nums">{avg || ""}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-10 py-4 bg-slate-50/50 border-t border-slate-100 text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">LPK SAGARA</p>
              </div>
            </div>

            {/* Hint for Admin */}
            <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-start gap-5">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💡</div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-indigo-900">Tips Navigasi</p>
                <p className="text-xs text-indigo-600 leading-relaxed max-w-2xl opacity-80 font-medium">Laporan ini bersifat global. Anda dapat mengekspor data ini ke Excel untuk keperluan administrasi atau melakukan filter per angkatan untuk melihat progres spesifik setiap kelompok belajar.</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 rounded-[3rem] p-24 border border-amber-100 flex flex-col items-center text-center space-y-4"
          >
            <div className="text-5xl">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-amber-900">Konfigurasi Belum Siap</h3>
              <p className="text-amber-600 text-sm max-w-xs mx-auto">Level studi ini belum memiliki template penilaian aktif. Silakan buat template di menu Template Penilaian terlebih dahulu.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
