"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Users, FileText, ChevronRight, Layout, Download, CheckCircle2, Trash2, Star } from "lucide-react";

import { StudyLevel, StudyChapter, ColDef, AdditionalCol, ChapterTemplate, StudentBatch } from "@/lib/types";

const DEFAULT_COLS: ColDef[] = [
  { label: "Nilai", col_type: "number" },
  { label: "Predikat", col_type: "grade" },
  { label: "Keterangan", col_type: "text" },
];

const COL_TYPE_LABELS: Record<string, string> = {
  text: "Teks",
  number: "Angka",
  grade: "Predikat",
};

export default function AssessmentTemplateManager() {
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [templates, setTemplates] = useState<ChapterTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [activeView, setActiveView] = useState<"edit" | "recap">("edit");
  const [editingColTarget, setEditingColTarget] = useState<number | null>(null);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState<ColDef["col_type"]>("number");

  // Grouping Options
  const [groupingSize, setGroupingSize] = useState<number>(1); // 1 = Individual, 5, 10, etc.

  // New states for Group/Batch Preview
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Advanced Report Settings
  const [additionalCols, setAdditionalCols] = useState<AdditionalCol[]>([]);
  const [reportSettingsId, setReportSettingsId] = useState<string | null>(null);

  const fetchLevels = useCallback(async () => {
    const { data: levelData } = await supabase
      .from("study_levels")
      .select("*")
      .order("sort_order");
    setLevels(levelData || []);

    const { data: batchData } = await supabase
      .from("student_batches")
      .select("*")
      .order("created_at", { ascending: false });
    setBatches(batchData || []);
  }, []);

  const fetchChaptersAndTemplates = useCallback(async (levelId: string) => {
    setLoading(true);
    const [{ data: chapData }, { data: tplData }, { data: matData }] = await Promise.all([
      supabase
        .from("study_chapters")
        .select("*")
        .eq("level_id", levelId)
        .order("sort_order"),
      supabase
        .from("assessment_chapter_templates")
        .select("*")
        .eq("level_id", levelId)
        .order("sort_order"),
      supabase
        .from("study_materials")
        .select("id, chapter_id, title, material_type")
        .order("sort_order"),
    ]);

    const chaps: StudyChapter[] = chapData || [];
    const matsByChapter = new Map<string, any[]>();
    (matData || []).forEach(m => {
      if (!matsByChapter.has(m.chapter_id)) matsByChapter.set(m.chapter_id, []);
      matsByChapter.get(m.chapter_id)?.push(m);
    });
    const existingTemplates: ChapterTemplate[] = (tplData || []).map((t: any) => {
      // Auto-fix legacy labels that don't have the " ::: " delimiter
      const fixedColumns = (t.columns || []).map((col: ColDef) => {
        if (!col.label.includes(" ::: ")) {
          return { ...col, label: `${t.chapter_title} ::: ${col.label}` };
        }
        return col;
      });
      return {
        ...t,
        columns: fixedColumns.length > 0 ? fixedColumns : DEFAULT_COLS
      };
    });

    let merged: ChapterTemplate[] = [];

    if (existingTemplates.length > 0) {
      // If we have saved templates, ONLY use those (respect grouping)
      merged = existingTemplates;
    } else {
      // Only auto-generate if nothing exists yet
      merged = chaps.map((ch, idx) => {
        const chapterMats = (matsByChapter.get(ch.id) || []).filter(m => m.material_type === 'quiz');
        const dynamicCols: ColDef[] = chapterMats.length > 0 
          ? chapterMats.map(m => ({ 
              label: `${ch.title} ::: ${m.title}`, 
              col_type: 'number' 
            }))
          : [{ label: `${ch.title} ::: -`, col_type: "number" }];

        return {
          level_id: levelId,
          chapter_id: ch.id,
          chapter_title: ch.title,
          columns: dynamicCols,
          sort_order: idx,
          is_active: true,
        };
      });
    }

    // Fetch Report Settings (Additional Columns)
    const { data: settingsData } = await supabase
      .from("assessment_report_settings")
      .select("*")
      .eq("level_id", levelId)
      .single();

    if (settingsData) {
      setReportSettingsId(settingsData.id);
      setAdditionalCols(settingsData.additional_columns || []);
    } else {
      setReportSettingsId(null);
      setAdditionalCols([
        { id: 'avg-1', name: "Rata-rata", position: "after", type: "single", calculation: "average", is_global: false },
        { id: 'rem-1', name: "Remedial", position: "after", reference: "Rata-rata", type: "single", is_global: false }
      ]);
    }

    setChapters(chaps || []);
    setTemplates(merged || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLevels(); }, [fetchLevels]);
  useEffect(() => {
    if (selectedLevelId) {
      fetchChaptersAndTemplates(selectedLevelId);
    } else {
      setChapters([]);
      setTemplates([]);
    }
  }, [selectedLevelId, fetchChaptersAndTemplates]);



  const getCategory = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("moji") || l.includes("goi") || l.includes("kosa kata")) return { label: "Vocabulary", color: "bg-blue-50 text-blue-600 border-blue-100" };
    if (l.includes("bunpou") || l.includes("tata bahasa") || l.includes("grammar")) return { label: "Grammar", color: "bg-purple-50 text-purple-600 border-purple-100" };
    if (l.includes("dokkai") || l.includes("bacaan")) return { label: "Reading", color: "bg-amber-50 text-amber-600 border-amber-100" };
    if (l.includes("choukai") || l.includes("pendengaran")) return { label: "Listening", color: "bg-rose-50 text-rose-600 border-rose-100" };
    if (l.includes("quiz") || l.includes("ulangan")) return { label: "Quiz", color: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    return { label: "General", color: "bg-slate-50 text-slate-600 border-slate-100" };
  };



  const generateFromChapters = async () => {
    if (!chapters.length) return;
    
    let fresh: ChapterTemplate[] = [];

    // Re-fetch materials to ensure we have fresh data for the grouping
    const { data: matData } = await supabase
      .from("study_materials")
      .select("id, chapter_id, title, material_type")
      .order("sort_order");
    
    const matsByChapter = new Map<string, any[]>();
    (matData || []).forEach(m => {
      if (!matsByChapter.has(m.chapter_id)) matsByChapter.set(m.chapter_id, []);
      matsByChapter.get(m.chapter_id)?.push(m);
    });
    
    if (groupingSize === 1) {
      // Individual chapters
      fresh = chapters.map((ch, idx) => {
        const chapterMats = (matsByChapter.get(ch.id) || []).filter(m => m.material_type === 'quiz');
        const dynamicCols: ColDef[] = chapterMats.length > 0 
          ? chapterMats.map(m => ({ 
              label: `${ch.title} ::: ${m.title}`, // Consistent delimiter
              col_type: 'number' 
            }))
          : [{ label: `${ch.title} ::: Nilai`, col_type: 'number' }];
          
        return {
          level_id: selectedLevelId,
          chapter_id: ch.id,
          chapter_title: ch.title,
          columns: dynamicCols,
          sort_order: idx,
          is_active: true,
        };
      });
    } else {
      // Grouped chapters
      for (let i = 0; i < chapters.length; i += groupingSize) {
        const chunk = chapters.slice(i, i + groupingSize);
        const startNum = i + 1;
        const endNum = Math.min(i + groupingSize, chapters.length);
        const title = startNum === endNum ? `Bab ${startNum}` : `Bab ${startNum} - ${endNum}`;
        
        // When grouping, collect all QUIZ materials from ALL chapters in the chunk
        const groupedCols: ColDef[] = [];
        chunk.forEach(ch => {
          const chapterQuizzes = (matsByChapter.get(ch.id) || []).filter(m => m.material_type === 'quiz');
          
          if (chapterQuizzes.length > 0) {
            chapterQuizzes.forEach(q => {
              groupedCols.push({
                label: `${ch.title} ::: ${q.title}`,
                col_type: 'number'
              });
            });
          } else {
            // Even if empty (as per user JSON example), add the Bab as a column
            groupedCols.push({
              label: `${ch.title} ::: -`,
              col_type: 'number'
            });
          }
        });

        fresh.push({
          level_id: selectedLevelId,
          chapter_id: chunk[0].id,
          chapter_title: title,
          columns: groupedCols,
          sort_order: i,
          is_active: true,
        });
      }
    }
    setTemplates(fresh);
  };

  const handleSave = async () => {
    if (!selectedLevelId || !templates.length) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      // 1. Get existing templates to preserve IDs if possible
      const { data: existing } = await supabase
        .from("assessment_chapter_templates")
        .select("id, chapter_id, chapter_title")
        .eq("level_id", selectedLevelId);

      const existingMap = new Map(existing?.map(e => [e.chapter_title, e.id]));

      // 2. Prepare payload with stable IDs
      const payload = templates.map(tpl => {
        const id = existingMap.get(tpl.chapter_title);
        // If it's a custom chapter (starts with custom-), we set chapter_id to null
        // because it's a manual entry not linked to study_chapters table.
        const isCustom = tpl.chapter_id?.toString().startsWith("custom");
        
        const item: any = {
          level_id: tpl.level_id,
          chapter_id: isCustom ? null : tpl.chapter_id,
          chapter_title: tpl.chapter_title,
          columns: tpl.columns,
          sort_order: tpl.sort_order,
          is_active: tpl.is_active,
        };
        if (id) item.id = id;
        return item;
      });

      console.log("Saving Assessment Payload:", payload);

      // 3. Upsert templates
      const { error: tplErr } = await supabase.from("assessment_chapter_templates").upsert(payload);
      if (tplErr) {
        console.error("Template Upsert Error Detail:", tplErr);
        throw new Error(tplErr.message + " (Hint: Pastikan Anda sudah menjalankan migrasi database terbaru)");
      }

      // 4. Save Additional Columns (Report Settings)
      const settingsPayload = {
        level_id: selectedLevelId,
        additional_columns: additionalCols,
        updated_at: new Date().toISOString(),
      };

      const { error: setErr } = await supabase
        .from("assessment_report_settings")
        .upsert(settingsPayload, { onConflict: 'level_id' });
      
      if (setErr) throw setErr;
      
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveStatus("error");
      // Optional: alert more info if needed
      if (err?.message) alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = (idx: number) => {
    setTemplates(prev =>
      prev.map((t, i) => (i === idx ? { ...t, is_active: !t.is_active } : t))
    );
  };

  const addColumn = (tIdx: number) => {
    if (!newColLabel.trim()) return;
    setTemplates(prev =>
      prev.map((t, i) =>
        i === tIdx
          ? { ...t, columns: [...t.columns, { label: newColLabel.trim(), col_type: newColType }] }
          : t
      )
    );
    setNewColLabel("");
    setEditingColTarget(null);
  };

  const removeColumn = (tIdx: number, cIdx: number) => {
    setTemplates(prev =>
      prev.map((t, i) =>
        i === tIdx ? { ...t, columns: t.columns.filter((_, j) => j !== cIdx) } : t
      )
    );
  };

  const updateColLabel = (tIdx: number, cIdx: number, val: string) => {
    setTemplates(prev =>
      prev.map((t, i) =>
        i === tIdx
          ? { ...t, columns: t.columns.map((c, j) => (j === cIdx ? { ...c, label: val } : c)) }
          : t
      )
    );
  };

  const selectedLevel = levels.find(l => l.id === selectedLevelId);
  const activeTemplates = templates.filter(t => t.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black italic uppercase text-slate-900 tracking-tighter">
            Template Laporan Penilaian
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Generate laporan penilaian per bab dari materi yang sudah ada. Hanya Super Admin yang dapat mengatur ini.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {selectedLevelId && (
            <>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
              <div className="flex bg-slate-100 rounded-2xl p-1 gap-1 items-center">
                <div className="flex items-center gap-2 px-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase">Per</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={groupingSize}
                    onChange={(e) => setGroupingSize(Math.max(1, Number(e.target.value)))}
                    className="w-10 bg-white border border-slate-200 rounded-lg px-1 py-1 text-center text-[10px] font-black text-indigo-600 outline-none focus:border-indigo-400 transition-all shadow-sm"
                  />
                  <span className="text-[8px] font-black text-slate-400 uppercase">Bab</span>
                </div>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                  onClick={generateFromChapters}
                  disabled={!chapters.length}
                  className="px-4 py-2 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-100 transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  ⚡ Sync
                </button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !templates.length}
                className={`px-6 py-2.5 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg disabled:opacity-50 ${
                  saveStatus === "success"
                    ? "bg-emerald-500 shadow-emerald-200"
                    : saveStatus === "error"
                    ? "bg-rose-500"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                }`}
              >
                {saving
                  ? "Menyimpan..."
                  : saveStatus === "success"
                  ? "Tersimpan ✓"
                  : saveStatus === "error"
                  ? "Gagal ✕"
                  : "Simpan Template"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Level & Group Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
            Pilih Level Konfigurasi
          </label>
          <div className="flex flex-wrap gap-2">
            {levels.map(l => (
              <button
                key={l.id}
                onClick={() => setSelectedLevelId(l.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all border-2 ${
                  selectedLevelId === l.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                    : "bg-slate-50 text-slate-600 border-slate-100 hover:border-indigo-300"
                }`}
              >
                {l.level_code}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
            Filter Preview Grup (Batch)
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="">Semua Grup / Batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!selectedLevelId && (
        <div className="py-32 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Pilih level di atas untuk mulai mengatur template
          </p>
        </div>
      )}

      {/* Loading */}
      {selectedLevelId && loading && (
        <div className="py-20 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400">Memuat bab materi...</p>
        </div>
      )}

      {/* No chapters */}
      {selectedLevelId && !loading && chapters.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center bg-amber-50 rounded-3xl border border-amber-100">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
            Belum ada bab di level {selectedLevel?.level_code}
          </p>
          <p className="text-[10px] text-amber-400 mt-1">
            Tambahkan bab/chapter di menu Materials terlebih dahulu.
          </p>
        </div>
      )}

      {/* EDIT VIEW */}
      {selectedLevelId && !loading && chapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Konfigurasi Bab Laporan
            </p>
            <span className="text-[9px] font-bold text-slate-300 italic">
              Klik bab untuk mengedit kolom penilaian
            </span>
          </div>
          {templates.map((tpl, tIdx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tIdx * 0.05 }}
              key={tpl.chapter_id}
              className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all ${
                tpl.is_active ? "border-slate-100" : "border-slate-100 opacity-50 bg-slate-50/50"
              }`}
            >
              {/* Chapter header */}
              <div className={`flex items-center justify-between px-6 py-4 ${tpl.is_active ? 'bg-slate-900' : 'bg-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg ${tpl.is_active ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-300'}`}>
                    {tIdx + 1}
                  </span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Section Bab</p>
                    <h3 className="text-sm font-black text-white">{tpl.chapter_title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(tIdx)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                      tpl.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"
                    }`}
                  >
                    {tpl.is_active ? "✓ AKTIF" : "✕ NONAKTIF"}
                  </button>
                </div>
              </div>

              {/* Columns editor */}
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tpl.columns.map((col, cIdx) => (
                    <div
                      key={cIdx}
                      className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 group shadow-sm hover:border-indigo-200 transition-all"
                    >
                      <div className="flex flex-col">
                        <input
                          value={col.label}
                          onChange={e => updateColLabel(tIdx, cIdx, e.target.value)}
                          className="text-xs font-black text-slate-800 bg-transparent outline-none w-24 border-b border-transparent focus:border-indigo-400 transition-all"
                          placeholder="Nama Kolom"
                        />
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">
                          TYPE: {COL_TYPE_LABELS[col.col_type]}
                        </span>
                      </div>
                      <button
                        onClick={() => removeColumn(tIdx, cIdx)}
                        className="w-6 h-6 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditingColTarget(tIdx);
                      setNewColLabel("");
                      setNewColType("number");
                    }}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm flex items-center gap-2"
                  >
                    + Tambah Kolom
                  </button>
                </div>

                {/* Inline add column form */}
                <AnimatePresence>
                  {editingColTarget === tIdx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap items-center gap-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl px-5 py-4 mt-2">
                        <div className="flex-1">
                          <label className="text-[8px] font-black text-indigo-400 uppercase mb-1 block">Label Kolom</label>
                          <input
                            value={newColLabel}
                            onChange={e => setNewColLabel(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addColumn(tIdx)}
                            placeholder="Contoh: Bunpou, Quiz 1, dll"
                            autoFocus
                            className="w-full px-4 py-2.5 text-xs font-bold bg-white border border-indigo-100 rounded-xl outline-none focus:border-indigo-500 transition-all shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-indigo-400 uppercase mb-1 block">Tipe Data</label>
                          <select
                            value={newColType}
                            onChange={e => setNewColType(e.target.value as ColDef["col_type"])}
                            className="px-4 py-2.5 text-xs font-black bg-white border border-indigo-100 rounded-xl outline-none focus:border-indigo-500 appearance-none min-w-[100px] shadow-sm"
                          >
                            <option value="number">Angka (0-100)</option>
                            <option value="grade">Predikat (A, B, C)</option>
                            <option value="text">Keterangan Teks</option>
                          </select>
                        </div>
                        <div className="flex items-end self-end gap-2">
                          <button
                            onClick={() => addColumn(tIdx)}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setEditingColTarget(null)}
                            className="p-2.5 bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-indigo-100 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}

          {/* Add Manual Section at bottom */}
          <button
            onClick={() => {
              const newOrder = templates.length;
              setTemplates(prev => [...prev, {
                level_id: selectedLevelId,
                chapter_id: `custom-${Date.now()}`,
                chapter_title: `Materi Tambahan ${newOrder + 1}`,
                columns: [{ label: "Nilai", col_type: "number" }],
                sort_order: newOrder,
                is_active: true
              }]);
            }}
            className="w-full py-6 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-xl">+</div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tambah Materi / Bab Custom</span>
            <p className="text-[9px] font-medium opacity-60 italic">Gunakan ini untuk menambah penilaian materi di luar materi standar aplikasi</p>
          </button>

          {/* Additional Columns Manager */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">Materi Tambahan & Kolom Input</h3>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Tambahkan materi eksternal atau kolom input manual di posisi manapun</p>
              </div>
              <button
                onClick={() => setAdditionalCols([...additionalCols, { id: `add-${Date.now()}`, name: "Materi Baru", position: "after", type: "single", is_global: false }])}
                className="px-6 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <span>+ Tambah Materi/Kolom</span>
              </button>
            </div>
            <div className="space-y-4">
              {additionalCols.map((col, idx) => (
                <div key={col.id} className="flex flex-wrap items-center gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">{idx + 1}</div>
                  
                  <div className="flex-1 min-w-[150px]">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Nama Materi / Kategori</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={col.name.replace(/\s*\(.*\)$/, '')}
                        onChange={(e) => {
                          const base = e.target.value;
                          const partMatch = col.name.match(/\((.*)\)$/);
                          const part = partMatch ? partMatch[1] : "";
                          const newName = part ? `${base} (${part})` : base;
                          setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, name: newName } : c));
                        }}
                        placeholder="Misal: MTK"
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black focus:border-indigo-500 outline-none"
                      />
                      <div className="w-16">
                        <input
                          type="text"
                          value={col.name.match(/\((.*)\)$/)?.[1] || ""}
                          onChange={(e) => {
                            const part = e.target.value;
                            const base = col.name.replace(/\s*\(.*\)$/, '');
                            const newName = part ? `${base} (${part})` : base;
                            setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, name: newName } : c));
                          }}
                          placeholder="Part"
                          className="w-full bg-indigo-50 border border-indigo-100 rounded-xl px-2 py-2 text-xs font-black text-center text-indigo-600 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-48">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Tampilkan Di</p>
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                      <button
                        onClick={() => setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, is_global: false, position: "before" } : c))}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${!col.is_global && col.position === "before" ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        Sebelum
                      </button>
                      <button
                        onClick={() => setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, is_global: false, position: "after" } : c))}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${!col.is_global && col.position === "after" ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        Sesudah
                      </button>
                      <button
                        onClick={() => setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, is_global: true, reference: "" } : c))}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${col.is_global ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        Semua Grup
                      </button>
                    </div>
                  </div>

                  {!col.is_global && (
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Acuan Posisi Bab (Pilih Bab)</p>
                      <select
                        value={col.reference || ""}
                        onChange={(e) => setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, reference: e.target.value || undefined } : c))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:border-indigo-500 outline-none"
                      >
                        <option value="">Paling Kanan (Tanpa Acuan)</option>
                        {templates.map(t => (
                          <option key={t.chapter_id} value={t.chapter_title}>{t.chapter_title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="w-32 text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Kalkulasi</p>
                    <select
                      value={col.calculation || ""}
                      onChange={(e) => setAdditionalCols(prev => prev.map(c => c.id === col.id ? { ...c, calculation: e.target.value as any || undefined } : c))}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:border-indigo-500 outline-none"
                    >
                      <option value="">Input Manual</option>
                      <option value="sum">Total (SUM)</option>
                      <option value="average">Rata-rata</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setAdditionalCols(additionalCols.filter(c => c.id !== col.id))}
                    className="p-3 text-rose-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      <AnimatePresence>
        {showPreviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreviewModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">
                      Live Preview Laporan Penilaian
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[9px] font-black rounded uppercase tracking-widest border border-indigo-500/30">
                        Level: {selectedLevel?.level_code}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black rounded uppercase tracking-widest border border-emerald-500/30">
                        Grup: {batches.find(b => b.id === selectedBatchId)?.name || "Semua Batch"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all hover:rotate-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/50">
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Real Report Style Preview - Separated by Tables */}
                  {activeTemplates.length === 0 ? (
                    <div className="bg-white border-4 border-emerald-600 rounded-[2rem] py-24 text-center shadow-2xl">
                      <p className="text-slate-300 font-black uppercase tracking-[0.3em]">Belum ada bab aktif</p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Aktifkan minimal satu bab untuk melihat preview laporan.</p>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {/* Consolidated Summary Preview (Rekapitulasi) */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] overflow-hidden border-4 border-amber-500 shadow-xl shadow-amber-200/40 mb-16"
                      >
                        <div className="px-10 py-7 bg-gradient-to-r from-amber-600 to-amber-500 flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                              <Star className="w-6 h-6 text-white fill-white" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Rekapitulasi Nilai Konsolidasi</h2>
                              <p className="text-[10px] font-black text-amber-100 uppercase tracking-[0.2em] mt-1 opacity-80">Rata-rata Akumulasi Seluruh Bab (Skala 100)</p>
                            </div>
                          </div>
                          <div className="hidden md:block px-6 py-2 bg-black/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Preview Mode</span>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-0">
                            <thead>
                              <tr className="bg-amber-50/50">
                                <th className="p-6 border-b border-r border-amber-100 text-[11px] font-black text-amber-800 uppercase text-center w-20">Rank</th>
                                <th className="p-6 border-b border-r border-amber-100 text-[11px] font-black text-amber-800 uppercase text-left min-w-[280px]">Nama Lengkap Siswa</th>
                                {(() => {
                                  const uniqueQuizLabels = Array.from(new Set(
                                    templates.flatMap(t => t.columns.map(c => {
                                      const parts = c.label.split(" ::: ");
                                      return parts.length > 1 ? parts[1] : c.label;
                                    }))
                                  ));
                                  return uniqueQuizLabels.map(label => (
                                    <th key={label} className="p-6 border-b border-r border-amber-100 text-[11px] font-black text-amber-900 uppercase text-center bg-amber-50/30">{label}</th>
                                  ));
                                })()}
                                <th className="p-6 border-b border-amber-200 bg-amber-600 text-white text-[12px] font-black uppercase text-center italic w-32">Total AVG</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[1].map((_, i) => (
                                <tr key={i} className="bg-white">
                                  <td className="p-5 border-r border-amber-50 text-center">
                                    <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-[11px] font-black">1</span>
                                  </td>
                                  <td className="p-5 border-r border-amber-50">
                                    <div className="flex items-center gap-3 opacity-40">
                                      <div className="w-9 h-9 rounded-full bg-amber-100 border-2 border-amber-200"></div>
                                      <div className="w-32 h-4 bg-slate-100 rounded-md"></div>
                                    </div>
                                  </td>
                                  {Array.from(new Set(templates.flatMap(t => t.columns.map(c => c.label.split(" ::: ").pop())))).map((_, idx) => (
                                    <td key={idx} className="p-5 border-r border-amber-50 text-center font-black text-amber-600 italic">85</td>
                                  ))}
                                  <td className="p-5 bg-amber-600/5 text-center font-black text-amber-700 italic">85</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>

                      {/* Section Divider */}
                      <div className="flex items-center gap-4 mb-10">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Detail Per Bab Materi</span>
                        <div className="h-px flex-1 bg-slate-200"></div>
                      </div>

                      {/* Chapter Tables (Standard Materials) */}
                      {activeTemplates.map((tpl, tIdx) => {
                        const beforeTpl = additionalCols.filter(c => c.reference === tpl.chapter_title && c.position === "before" && !c.is_global);
                        const afterTpl = additionalCols.filter(c => c.reference === tpl.chapter_title && c.position === "after" && !c.is_global);
                        const globalCols = additionalCols.filter(c => c.is_global);

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: tIdx * 0.1 }}
                            key={tpl.chapter_id || tIdx} 
                            className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-200/20 mb-10"
                          >
                            <div className="px-8 py-5 bg-slate-900 flex items-center gap-4">
                              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-emerald-400" />
                              </div>
                              <h3 className="text-white font-bold tracking-tight uppercase">{tpl.chapter_title}</h3>
                            </div>

                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                              <table className="w-full border-separate border-spacing-0">
                                <thead>
                                  {/* Triple Header Simulation */}
                                  <tr>
                                    <th rowSpan={3} className="sticky left-0 z-20 p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-center w-16">No</th>
                                    <th rowSpan={3} className="sticky left-16 z-20 p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-left min-w-[240px]">Informasi Siswa</th>
                                    
                                    {beforeTpl.map(c => (
                                      <th key={c.id} rowSpan={3} className="p-5 bg-indigo-50 border-b border-r border-slate-200 text-[11px] font-bold text-indigo-600 uppercase text-center w-32">{c.name}</th>
                                    ))}

                                    <th colSpan={tpl.columns.length} className="p-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] text-center border-b border-emerald-700">Evaluasi Capaian Materi</th>

                                    {afterTpl.map(c => (
                                      <th key={c.id} rowSpan={3} className="p-5 bg-indigo-50 border-b border-r border-slate-200 text-[11px] font-bold text-indigo-600 uppercase text-center w-32">{c.name}</th>
                                    ))}

                                    <th rowSpan={3} className="p-5 bg-emerald-700 text-white border-b border-r border-emerald-800 text-[11px] font-black uppercase text-center w-28 italic">AVG</th>

                                    {globalCols.map(c => (
                                      <th key={c.id} rowSpan={3} className="p-5 bg-slate-50 border-b border-r border-slate-200 text-[11px] font-black text-slate-400 uppercase text-center w-32 italic">
                                        {c.name}
                                        <span className="block text-[8px] mt-1 opacity-50 tracking-widest">(Global)</span>
                                      </th>
                                    ))}
                                  </tr>

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
                                  {[1].map((_, sIdx) => (
                                    <tr key={sIdx} className="group hover:bg-emerald-50/20 transition-colors">
                                      <td className="p-4 bg-inherit border-r border-slate-100 text-center text-xs font-bold text-slate-400">{sIdx + 1}</td>
                                      <td className="p-4 bg-inherit border-r border-slate-100">
                                        <div className="flex items-center gap-3 opacity-30 grayscale">
                                          <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                                          <div className="space-y-1">
                                            <div className="w-24 h-3 bg-slate-100 rounded-md"></div>
                                            <div className="w-16 h-2 bg-slate-50 rounded-md"></div>
                                          </div>
                                        </div>
                                      </td>
                                      {/* Placeholder cells */}
                                      {beforeTpl.map(c => <td key={c.id} className="p-4 bg-indigo-50/10 border-r border-slate-100 text-center text-[10px] text-slate-300 italic">Nilai</td>)}
                                      {tpl.columns.map((_, ci) => <td key={ci} className="p-4 border-r border-slate-100 text-center text-[10px] text-slate-200 font-bold">Input</td>)}
                                      {afterTpl.map(c => <td key={c.id} className="p-4 bg-indigo-50/10 border-r border-slate-100 text-center text-[10px] text-slate-300 italic">Nilai</td>)}
                                      <td className="p-4 bg-emerald-50/30 text-center font-black text-emerald-700">85</td>
                                      {globalCols.map(c => <td key={c.id} className="p-4 bg-slate-50/50 border-r border-slate-100 text-center text-[10px] text-slate-400 font-bold italic">Global</td>)}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Dedicated Section for Unreferenced Additional Materials */}
                      {(() => {
                        const unreferenced = additionalCols.filter(c => !c.reference && !c.is_global);
                        if (unreferenced.length === 0) return null;

                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-xl shadow-slate-200/20"
                          >
                            <div className="px-8 py-5 bg-indigo-900 flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <ChevronRight className="w-5 h-5 text-indigo-400" />
                              </div>
                              <h3 className="text-white font-bold tracking-tight uppercase italic">Materi & Evaluasi Tambahan</h3>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full border-separate border-spacing-0">
                                <thead>
                                  <tr className="bg-slate-50">
                                    <th className="p-5 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-center w-16">No</th>
                                    <th className="p-5 border-b border-r border-slate-200 text-[11px] font-bold text-slate-500 uppercase text-left min-w-[240px]">Informasi Siswa</th>
                                    {unreferenced.map(c => (
                                      <th key={c.id} className="p-5 border-b border-r border-slate-200 text-[11px] font-bold text-indigo-600 uppercase text-center min-w-[140px] bg-indigo-50/30">
                                        {c.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="hover:bg-indigo-50/10">
                                    <td className="p-4 border-r border-slate-100 text-center text-xs font-bold text-slate-300">1</td>
                                    <td className="p-4 border-r border-slate-100 text-sm font-bold text-slate-300 uppercase">Nama Siswa (Contoh)</td>
                                    {unreferenced.map(c => (
                                      <td key={c.id} className="p-4 border-r border-slate-100 text-center text-[10px] text-indigo-400 font-bold italic">
                                        Input Manual
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Summary Info */}
                  <div className="mt-12 flex flex-wrap gap-4 items-center justify-between bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                    <div className="flex gap-12">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Seksi / Bab</p>
                        <p className="text-xl font-black text-slate-800 tracking-tighter italic">{activeTemplates.length} BAB</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materi Tambahan</p>
                        <p className="text-xl font-black text-indigo-600 tracking-tighter italic">{additionalCols.filter(c => !c.reference).length} MATERI</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 italic max-w-sm text-right leading-relaxed">
                      * Preview ini mensimulasikan lembar penilaian massal yang akan dilihat oleh guru saat melakukan pengisian nilai batch.
                    </p>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic opacity-60">LPK SAGARA</p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Simulation Ready</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-8 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Tutup Preview
                  </button>
                  <button
                    className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

