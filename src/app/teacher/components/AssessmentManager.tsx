"use client";

import { useState, useEffect, useMemo } from "react";
import { Profile, StudyLevel, ChapterTemplate, AdditionalCol, StudentBatch } from "@/lib/types";
import { exportToExcel, exportToPDF } from "@/lib/ExportUtils";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Save, CheckCircle2, Users, Search, GraduationCap, ChevronRight, FileText, Star, TrendingUp } from "lucide-react";

export default function AssessmentManager({ students, levels, teacher }: { students: Profile[], levels: StudyLevel[], teacher?: Profile }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  
  const [templates, setTemplates] = useState<ChapterTemplate[]>([]);
  const [additionalCols, setAdditionalCols] = useState<AdditionalCol[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [matrix, setMatrix] = useState<Record<string, Record<string, Record<string, string>>>>({});

  // Derived batches from students prop
  const availableBatches = Array.from(new Set(students.map(s => s.batch).filter(Boolean))) as string[];

  useEffect(() => {
    if (selectedLevelId) {
      fetchTemplatesAndSettings(selectedLevelId);
    } else {
      setTemplates([]);
      setAdditionalCols([]);
    }
  }, [selectedLevelId]);

  useEffect(() => {
    if (selectedBatchId && selectedLevelId && templates.length > 0) {
      fetchGradesForBatch();
    }
  }, [selectedBatchId, selectedLevelId, templates]);

  const fetchTemplatesAndSettings = async (levelId: string) => {
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
  };

  const fetchGradesForBatch = async () => {
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
  };

  const handleValueChange = (email: string, templateId: string | null, columnLabel: string, value: string) => {
    const key = templateId || "additional";
    setMatrix(prev => ({
      ...prev,
      [email]: {
        ...(prev[email] || {}),
        [key]: {
          ...(prev[email]?.[key] || {}),
          [columnLabel]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedBatchId || !selectedLevelId) return;
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const chapterPayload: any[] = [];
      const additionalPayload: any[] = [];

      Object.entries(matrix).forEach(([email, data]) => {
        Object.entries(data).forEach(([key, cols]) => {
          Object.entries(cols).forEach(([label, val]) => {
            const isCalc = additionalCols.find(ac => ac.id === label && ac.calculation);
            if (isCalc) return;

            const item = {
              student_email: email,
              column_label: label,
              value: val,
              updated_at: new Date().toISOString()
            };

            if (key === "additional") {
              additionalPayload.push({ ...item, template_id: null, level_id: selectedLevelId });
            } else {
              chapterPayload.push({ ...item, template_id: key, level_id: null });
            }
          });
        });
      });

      const promises = [];
      if (chapterPayload.length > 0) {
        promises.push(supabase.from("assessment_chapter_grades").upsert(chapterPayload, {
          onConflict: "student_email,column_label,template_id"
        }));
      }
      if (additionalPayload.length > 0) {
        promises.push(supabase.from("assessment_chapter_grades").upsert(additionalPayload, {
          onConflict: "student_email,column_label,level_id"
        }));
      }

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error).map(r => r.error);
      if (errors.length > 0) throw errors[0];
      
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const currentBatchName = selectedBatchId === "ALL" ? "Semua Murid Saya" : selectedBatchId;
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

    exportToExcel(data, `Penilaian_Siswa_${selectedBatchId}_${new Date().toISOString().split('T')[0]}`, 'Penilaian Siswa');
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

    exportToPDF('Penilaian Siswa', columns, rows, `Penilaian_Siswa_${selectedBatchId}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-4">
      {/* Header & Filter Section */}
      <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Evaluasi Pembelajaran</h2>
              <p className="text-slate-500 text-sm font-medium">Pengelolaan nilai akademik per angkatan</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-w-[240px] appearance-none"
              >
                <option value="">Pilih Kategori Batch</option>
                <option value="ALL">Semua Murid Saya</option>
                {availableBatches.map(batchName => (
                  <option key={batchName} value={batchName}>{batchName}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
              <select
                value={selectedLevelId}
                onChange={e => setSelectedLevelId(e.target.value)}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-w-[200px] appearance-none"
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
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-3xl p-24 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl">📊</div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Siap untuk Menilai?</h3>
              <p className="text-slate-500 max-w-md mx-auto">Silakan pilih kategori batch dan level studi untuk membuka lembar penilaian interaktif.</p>
            </div>
          </motion.div>
        ) : (templateLoading || loading) ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-32 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm"
          >
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data penilaian...</p>
          </motion.div>
        ) : templates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">Active View</span>
                <h4 className="text-lg font-bold text-slate-800">{currentBatchName} <span className="text-slate-400 font-normal px-2">|</span> {filteredStudents.length} Siswa</h4>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all shadow-lg ${
                  saveStatus === "success" ? "bg-emerald-600 text-white" :
                  saveStatus === "error" ? "bg-rose-600 text-white" :
                  "bg-slate-900 text-white hover:bg-slate-800 active:scale-95"
                }`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveStatus === "success" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isSaving ? "Menyimpan Data..." : saveStatus === "success" ? "Perubahan Disimpan" : "Simpan Semua Nilai"}
              </button>
            </div>

            {/* Consolidated Summary Table (Rekapitulasi) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-100/50 mb-16"
            >
              <div className="px-10 py-7 bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Star className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Rekapitulasi & Capaian Akhir</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 opacity-80">Rangkuman Nilai Konsolidasi & Materi Tambahan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="hidden md:flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    ↓ Export Excel
                  </button>
                  <button onClick={handleExportPDF} className="hidden md:flex items-center gap-2 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-all border border-rose-500/30 text-[10px] font-black uppercase tracking-widest shadow-sm">
                    ↓ Export PDF
                  </button>
                  <div className="hidden md:flex items-center gap-4 px-6 py-2 bg-white/5 rounded-2xl border border-white/10 ml-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unified Report View</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-900">
                      <th className="sticky left-0 z-20 p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center w-16 text-slate-400">Rank</th>
                      <th className="sticky left-16 z-20 p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-left min-w-[280px]">Siswa</th>
                      
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
                            <p className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">{stu.full_name}</p>
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
                          <td key={i} className="p-5 border-r border-slate-50 text-center bg-indigo-50/5">
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
            </motion.div>

            {/* Section Divider */}
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Detail Per Bab Materi</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            {/* Assessment Tables */}
            {templates.map((tpl, tIdx) => {
              const beforeTpl = additionalCols.filter(c => c.reference === tpl.chapter_title && c.position === "before" && !c.is_global);
              const afterTpl = additionalCols.filter(c => c.reference === tpl.chapter_title && c.position === "after" && !c.is_global);
              const globalCols = additionalCols.filter(c => c.is_global);

              return (
                <div key={tpl.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-200/20 mb-10">
                  <div className="px-8 py-5 bg-slate-900 flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-white font-bold tracking-tight uppercase">{tpl.chapter_title}</h3>
                  </div>

                  <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        {/* Header Level 1: Meta & Sections */}
                        <tr>
                          <th rowSpan={3} className="sticky left-0 z-20 p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-center w-16">No</th>
                          <th rowSpan={3} className="sticky left-16 z-20 p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-left min-w-[240px]">Informasi Siswa</th>
                          <th rowSpan={3} className="p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-center w-20">Gender</th>
                          
                          {beforeTpl.map(c => (
                            <th key={c.id} rowSpan={3} className="p-5 bg-indigo-50/50 border-b border-r border-slate-200 text-[11px] font-bold text-indigo-600 uppercase text-center w-32">{c.name}</th>
                          ))}

                          <th colSpan={tpl.columns.length} className="p-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] text-center border-b border-emerald-700">Evaluasi Capaian Materi</th>

                          {afterTpl.map(c => (
                            <th key={c.id} rowSpan={3} className="p-5 bg-indigo-50/50 border-b border-r border-slate-200 text-[11px] font-bold text-indigo-600 uppercase text-center w-32">{c.name}</th>
                          ))}

                          <th rowSpan={3} className="p-5 bg-emerald-700 text-white border-b border-r border-emerald-800 text-[11px] font-black uppercase text-center w-28 italic">AVG</th>
                          
                          {globalCols.map(c => (
                            <th key={c.id} rowSpan={3} className="p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-black text-slate-400 uppercase text-center w-32 italic">
                              {c.name}
                              <span className="block text-[8px] mt-1 opacity-50 tracking-widest">(Global)</span>
                            </th>
                          ))}
                        </tr>

                        {/* Header Level 2: Chapters */}
                        <tr>
                          {(() => {
                            const chapters: { label: string, count: number }[] = [];
                            tpl.columns.forEach(col => {
                              const parts = col.label.split(" ::: ");
                              const chName = parts.length > 1 ? parts[0] : "Umum";
                              const last = chapters[chapters.length - 1];
                              if (last && last.label === chName) last.count++;
                              else chapters.push({ label: chName, count: 1 });
                            });
                            return chapters.map((ch, ci) => (
                              <th key={ci} colSpan={ch.count} className="p-3 bg-emerald-50 border-b border-r border-emerald-100 text-[10px] font-bold text-emerald-800 uppercase tracking-wide text-center">
                                {ch.label}
                              </th>
                            ));
                          })()}
                        </tr>

                        {/* Header Level 3: Quiz Items */}
                        <tr className="bg-white">
                          {tpl.columns.map((col, ci) => {
                            const parts = col.label.split(" ::: ");
                            const quizName = parts.length > 1 ? parts[1] : col.label;
                            return (
                              <th key={ci} className="p-3 border-b border-r border-slate-100 text-[10px] font-medium text-slate-400 lowercase text-center min-w-[100px]">
                                {quizName}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((stu, sIdx) => {
                          const stuMatrix = matrix[stu.email] || {};
                          const tplGrades = stuMatrix[tpl.id || ""] || {};
                          const scores = tpl.columns.map(col => tplGrades[col.label] || "");
                          const numScores = scores.map(s => parseFloat(s)).filter(n => !isNaN(n));
                          const total = numScores.reduce((a, b) => a + b, 0);
                          const avg = numScores.length > 0 ? Math.round(total / numScores.length) : 0;

                          return (
                            <tr key={stu.id} className="group hover:bg-emerald-50/20 transition-colors even:bg-slate-50/30">
                              <td className="sticky left-0 z-10 p-4 bg-inherit border-r border-slate-100 text-center text-xs font-bold text-slate-400">{sIdx + 1}</td>
                              <td className="sticky left-16 z-10 p-4 bg-inherit border-r border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                    {stu.full_name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{stu.full_name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{stu.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 border-r border-slate-100 text-center text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {stu.gender === 'Perempuan' ? 'P' : 'L'}
                              </td>

                              {beforeTpl.map(c => (
                                <td key={c.id} className="p-3 border-r border-slate-100 bg-indigo-50/5">
                                  {c.calculation ? (
                                    <div className="w-full text-center text-sm font-bold text-indigo-600/80 italic select-none">
                                      {c.calculation === 'sum' ? total : stuMatrix["additional"]?.[c.name] || "-"}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={stuMatrix["additional"]?.[c.id] || ""}
                                      onChange={e => handleValueChange(stu.email, null, c.id, e.target.value)}
                                      className="w-full h-10 px-2 bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none text-center text-sm font-bold text-slate-700 transition-all placeholder:text-slate-200"
                                      placeholder="—"
                                    />
                                  )}
                                </td>
                              ))}

                              {tpl.columns.map((col, ci) => {
                                const isQuiz = col.label.toLowerCase().includes("quiz") || col.col_type === "number";
                                return (
                                  <td key={ci} className={`p-2 border-r border-slate-100 ${isQuiz ? 'bg-emerald-50/5' : ''}`}>
                                    {isQuiz ? (
                                      <div className="w-full text-center text-sm font-black text-emerald-600/70 select-none tabular-nums">
                                        {tplGrades[col.label] || "0"}
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        value={tplGrades[col.label] || ""}
                                        onChange={e => handleValueChange(stu.email, tpl.id || null, col.label, e.target.value)}
                                        className="w-full h-10 bg-transparent border-b-2 border-transparent focus:border-emerald-500 outline-none text-center text-sm font-bold text-slate-700 transition-all placeholder:text-slate-200"
                                        placeholder="0"
                                      />
                                    )}
                                  </td>
                                );
                              })}

                              {afterTpl.map(c => (
                                <td key={c.id} className="p-3 border-r border-slate-100 bg-indigo-50/5">
                                  {c.calculation ? (
                                    <div className="w-full text-center text-sm font-bold text-indigo-600/80 italic select-none">
                                      {c.calculation === 'average' ? avg : stuMatrix["additional"]?.[c.name] || "-"}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={stuMatrix["additional"]?.[c.id] || ""}
                                      onChange={e => handleValueChange(stu.email, null, c.id, e.target.value)}
                                      className="w-full h-10 px-2 bg-transparent border-b-2 border-transparent focus:border-indigo-400 outline-none text-center text-sm font-bold text-slate-700 transition-all placeholder:text-slate-200"
                                      placeholder="—"
                                    />
                                  )}
                                </td>
                              ))}

                              <td className="p-3 border-r border-slate-100 bg-emerald-50/40 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-lg font-black text-emerald-700 tabular-nums">{avg}</span>
                                </div>
                              </td>

                              {globalCols.map(c => (
                                <td key={c.id} className="p-3 border-r border-slate-100 bg-slate-50/50">
                                  <input
                                    type="text"
                                    value={stuMatrix["additional"]?.[c.id] || ""}
                                    onChange={e => handleValueChange(stu.email, null, c.id, e.target.value)}
                                    className="w-full h-10 bg-transparent border-b-2 border-transparent focus:border-slate-400 outline-none text-center text-sm font-black text-slate-600 transition-all placeholder:text-slate-200"
                                    placeholder="—"
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer / Info */}
                  <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Otomatis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Indikator Tambahan</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 italic">
                      Lpk Sagara Assessment Engine v2.0
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dedicated Section for Unreferenced Additional Materials */}
            {(() => {
              const unreferenced = additionalCols.filter(c => !c.reference && !c.is_global);
              if (unreferenced.length === 0) return null;

              return (
                <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-200/20">
                  <div className="px-8 py-5 bg-indigo-900 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-white font-bold tracking-tight uppercase">Materi & Evaluasi Tambahan</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="sticky left-0 z-20 p-5 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-center w-16">No</th>
                          <th className="sticky left-16 z-20 p-5 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-left min-w-[240px]">Informasi Siswa</th>
                          {unreferenced.map(c => (
                            <th key={c.id} className="p-5 border-b border-r border-slate-200 text-[11px] font-bold text-indigo-600 uppercase text-center min-w-[140px] bg-indigo-50/30">
                              {c.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map((stu, sIdx) => {
                          const stuMatrix = matrix[stu.email] || {};
                          const addMatrix = stuMatrix["additional"] || {};

                          return (
                            <tr key={stu.id} className="group hover:bg-indigo-50/10 transition-colors even:bg-slate-50/30">
                              <td className="sticky left-0 z-10 p-4 bg-inherit border-r border-slate-100 text-center text-xs font-bold text-slate-400">{sIdx + 1}</td>
                              <td className="sticky left-16 z-10 p-4 bg-inherit border-r border-slate-100">
                                <p className="text-sm font-bold text-slate-800">{stu.full_name}</p>
                              </td>
                              {unreferenced.map(c => (
                                <td key={c.id} className="p-3 border-r border-slate-100">
                                  {c.calculation ? (
                                    <div className="w-full text-center text-sm font-bold text-indigo-600/80 italic select-none">
                                      {addMatrix[c.name] || "-"}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      value={addMatrix[c.name] || ""}
                                      onChange={e => handleValueChange(stu.email, null, c.name, e.target.value)}
                                      className="w-full h-10 bg-transparent border-b-2 border-transparent focus:border-indigo-500 outline-none text-center text-sm font-bold text-slate-700 transition-all placeholder:text-slate-200"
                                      placeholder="—"
                                    />
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
