"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Profile, StudyLevel, StudyChapter, StudyMaterial } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GraduationCap, TrendingUp, Filter, BookOpen } from "lucide-react";
import { calculateChapterXPDistribution } from "@/lib/GamificationUtils";

export default function StudentProgressMonitoring({ students, levels }: { students: Profile[], levels: StudyLevel[] }) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedLevelId, setSelectedLevelId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({}); // Record<email, material_id[]>

  const [actionLoading, setActionLoading] = useState<string | null>(null); // "email-type" or "email-quiz-quizId"
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizModalData, setQuizModalData] = useState<{
    student: Profile;
    score: number;
  } | null>(null);
  const [quizScoreInput, setQuizScoreInput] = useState<string>("100");
  const [selectedQuizForGrading, setSelectedQuizForGrading] = useState<StudyMaterial | null>(null);

  const adjustUserXP = async (email: string, deltaXP: number) => {
    if (deltaXP === 0) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("exp")
        .eq("email", email)
        .maybeSingle();
        
      if (profile) {
        const currentExp = profile.exp || 0;
        const newExp = Math.max(0, currentExp + deltaXP);
        const newLevel = Math.floor(newExp / 1000) + 1;
        
        await supabase
          .from("profiles")
          .update({ exp: newExp, level: newLevel })
          .eq("email", email);
      }
    } catch (err) {
      console.error("Failed to adjust user XP:", err);
    }
  };

  const handleToggleMateri = async (student: Profile, currentStatus: boolean | null) => {
    if (currentStatus === null || !selectedChapterId) return;
    
    const email = student.email.trim().toLowerCase();
    const actionKey = `${email}-materi`;
    setActionLoading(actionKey);
    
    try {
      const distribution = calculateChapterXPDistribution(materiItems.length, quizItems.length);
      const completedIds = matrix[email] || [];
      
      if (currentStatus) {
        // Toggle from completed -> incomplete (UNCHECK)
        const materialIds = materiItems.map(m => m.id);
        if (materialIds.length > 0) {
          const completedMats = materiItems.filter(m => completedIds.includes(m.id));
          let totalDeltaXP = 0;
          completedMats.forEach(m => {
            const idx = materiItems.findIndex(x => x.id === m.id);
            const xp = (distribution.materials && distribution.materials[idx]) || 0;
            totalDeltaXP += xp;
          });

          await supabase
            .from("user_material_progress")
            .delete()
            .ilike("user_email", email)
            .in("material_id", materialIds);
            
          const { data: profile } = await supabase
            .from("profiles")
            .select("unlocked_materials")
            .eq("email", email)
            .maybeSingle();
            
          if (profile) {
            const current = profile.unlocked_materials || [];
            const updated = current.filter((id: string) => !materialIds.includes(id));
            await supabase
              .from("profiles")
              .update({ unlocked_materials: updated })
              .eq("email", email);
          }

          await adjustUserXP(email, -totalDeltaXP);
        }
      } else {
        // Toggle from incomplete -> completed (CHECK)
        const materialIds = materiItems.map(m => m.id);
        if (materialIds.length > 0) {
          const uncompletedMats = materiItems.filter(m => !completedIds.includes(m.id));
          let totalDeltaXP = 0;
          uncompletedMats.forEach(m => {
            const idx = materiItems.findIndex(x => x.id === m.id);
            const xp = (distribution.materials && distribution.materials[idx]) || 0;
            totalDeltaXP += xp;
          });

          const insertRows = materialIds.map(id => ({
            user_email: email,
            material_id: id,
            completed_at: new Date().toISOString()
          }));
          
          await supabase
            .from("user_material_progress")
            .upsert(insertRows, { onConflict: "user_email,material_id" });
            
          const { data: profile } = await supabase
            .from("profiles")
            .select("unlocked_materials")
            .eq("email", email)
            .maybeSingle();
            
          if (profile) {
            const current = profile.unlocked_materials || [];
            const newIds = materialIds.filter(id => !current.includes(id));
            if (newIds.length > 0) {
              await supabase
                .from("profiles")
                .update({ unlocked_materials: [...current, ...newIds] })
                .eq("email", email);
            }
          }

          await adjustUserXP(email, totalDeltaXP);
        }
      }
      
      await fetchProgressData();
    } catch (err) {
      console.error("Toggle materi error:", err);
      alert("Gagal merubah status materi.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSingleQuiz = async (student: Profile, quiz: StudyMaterial, currentStatus: boolean) => {
    if (!selectedChapterId) return;
    
    const email = student.email.trim().toLowerCase();
    const actionKey = `${email}-quiz-${quiz.id}`;
    
    try {
      const distribution = calculateChapterXPDistribution(materiItems.length, quizItems.length);
      const qIdx = quizItems.findIndex(x => x.id === quiz.id);
      const quizXP = (distribution.quizzes && distribution.quizzes[qIdx]) || 0;

      if (currentStatus) {
        if (!confirm(`Apakah Anda yakin ingin membatalkan status selesai kuis "${quiz.title}" untuk ${student.full_name}? Ini akan menghapus nilai kuis dan progres kuis.`)) {
          return;
        }
        
        setActionLoading(actionKey);
        // 1. Delete row from user_material_progress
        await supabase
          .from("user_material_progress")
          .delete()
          .ilike("user_email", email)
          .eq("material_id", quiz.id);
          
        // 2. Update profiles legacyUnlockedMaterials
        const { data: profile } = await supabase
          .from("profiles")
          .select("unlocked_materials")
          .eq("email", email)
          .maybeSingle();
          
        if (profile) {
          const current = profile.unlocked_materials || [];
          const updated = current.filter((id: string) => id !== quiz.id);
          await supabase
            .from("profiles")
            .update({ unlocked_materials: updated })
            .eq("email", email);
        }
        
        // 3. Delete grade from assessment_chapter_grades
        const { data: chapter } = await supabase
          .from("study_chapters")
          .select("title")
          .eq("id", selectedChapterId)
          .maybeSingle();
          
        if (chapter) {
          const columnLabel = `${chapter.title} ::: ${quiz.title}`;
          const columnLabelRemedial = `${chapter.title} ::: ${quiz.title} (Remedial)`;
          
          await supabase
            .from("assessment_chapter_grades")
            .delete()
            .ilike("student_email", email)
            .in("column_label", [columnLabel, columnLabelRemedial]);
        }

        await adjustUserXP(email, -quizXP);
        
        await fetchProgressData();
      } else {
        // Toggle from incomplete -> completed (CHECK)
        setQuizModalData({ student, score: 100 });
        setQuizScoreInput("100");
        setSelectedQuizForGrading(quiz);
        setShowQuizModal(true);
      }
    } catch (err) {
      console.error("Uncheck quiz error:", err);
      alert("Gagal membatalkan status kuis.");
      setActionLoading(null);
    }
  };

  const submitQuizScore = async () => {
    if (!quizModalData || !selectedChapterId || !selectedQuizForGrading) return;
    
    const student = quizModalData.student;
    const quiz = selectedQuizForGrading;
    const scoreVal = parseInt(quizScoreInput);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      alert("Masukkan nilai kuis antara 0 sampai 100.");
      return;
    }
    
    const email = student.email.trim().toLowerCase();
    const actionKey = `${email}-quiz-${quiz.id}`;
    
    setShowQuizModal(false);
    setActionLoading(actionKey);
    
    try {
      const distribution = calculateChapterXPDistribution(materiItems.length, quizItems.length);
      const qIdx = quizItems.findIndex(x => x.id === quiz.id);
      const quizXP = (distribution.quizzes && distribution.quizzes[qIdx]) || 0;

      // 1. Insert row into user_material_progress
      await supabase
        .from("user_material_progress")
        .upsert(
          { user_email: email, material_id: quiz.id, completed_at: new Date().toISOString() },
          { onConflict: "user_email,material_id" }
        );
        
      // 2. Update profiles legacyUnlockedMaterials
      const { data: profile } = await supabase
        .from("profiles")
        .select("unlocked_materials")
        .eq("email", email)
        .maybeSingle();
        
      if (profile) {
        const current = profile.unlocked_materials || [];
        if (!current.includes(quiz.id)) {
          await supabase
            .from("profiles")
            .update({ unlocked_materials: [...current, quiz.id] })
            .eq("email", email);
        }
      }
      
      // 3. Upsert grade into assessment_chapter_grades
      const { data: chapter } = await supabase
        .from("study_chapters")
        .select("title, level_id")
        .eq("id", selectedChapterId)
        .maybeSingle();
      
      if (chapter) {
        // Find template by level_id and check chapter mapping (handling grouped templates)
        const { data: allTemplates } = await supabase
          .from("assessment_chapter_templates")
          .select("id, chapter_id, chapter_title, columns")
          .eq("level_id", chapter.level_id)
          .eq("is_active", true);

        const columnLabel = `${chapter.title} ::: ${quiz.title}`;

        let tpl = allTemplates?.find(t => t.chapter_id === selectedChapterId);
        if (!tpl && allTemplates) {
          tpl = allTemplates.find(t => 
            Array.isArray(t.columns) && 
            t.columns.some((col: any) => col.label === columnLabel)
          );
        }
        if (!tpl && allTemplates) {
          const chNumMatch = chapter.title.match(/\d+/);
          const chNum = chNumMatch ? parseInt(chNumMatch[0]) : null;
          if (chNum !== null) {
            tpl = allTemplates.find(t => {
              const ranges = t.chapter_title?.match(/\d+/g);
              if (ranges && ranges.length === 2) {
                const start = parseInt(ranges[0]);
                const end = parseInt(ranges[1]);
                return chNum >= start && chNum <= end;
              } else if (ranges && ranges.length === 1) {
                return chNum === parseInt(ranges[0]);
              }
              return false;
            });
          }
        }
        let existingQuery = supabase
          .from("assessment_chapter_grades")
          .select("id")
          .eq("student_email", email)
          .eq("column_label", columnLabel);
          
        if (tpl?.id) {
          existingQuery = existingQuery.eq("template_id", tpl.id);
        } else {
          existingQuery = existingQuery.is("template_id", null).eq("level_id", chapter.level_id);
        }
        
        const { data: existingRows } = await existingQuery;
        
        const gradePayload = {
          student_email: email,
          template_id: tpl?.id || null,
          level_id: chapter.level_id,
          column_label: columnLabel,
          value: String(scoreVal),
          updated_at: new Date().toISOString()
        };
        
        if (existingRows && existingRows.length > 0) {
          await supabase
            .from("assessment_chapter_grades")
            .update(gradePayload)
            .eq("id", existingRows[0].id);
        } else {
          await supabase
            .from("assessment_chapter_grades")
            .insert(gradePayload);
        }
      }

      await adjustUserXP(email, quizXP);
      
      await fetchProgressData();
    } catch (err) {
      console.error("Submit quiz score error:", err);
      alert("Gagal menyimpan nilai kuis.");
    } finally {
      setActionLoading(null);
      setQuizModalData(null);
      setSelectedQuizForGrading(null);
    }
  };

  // Filter students based on role
  const HIDDEN_EMAILS = [
    'siswa.khusus@lpksagara.com',
    'guru.khusus@lpksagara.com',
    'siswa.super@lpksagara.com',
    'guru.super@lpksagara.com',
  ];

  const visibleStudents = useMemo(() => {
    return students.filter(s => !HIDDEN_EMAILS.includes(s.email));
  }, [students]);

  // Derived batches from visible students
  const availableBatches = Array.from(new Set(visibleStudents.map(s => s.batch).filter(Boolean))) as string[];

  // Fetch Chapters when Level changes
  useEffect(() => {
    async function fetchChapters() {
      if (!selectedLevelId) {
        setChapters([]);
        setSelectedChapterId("");
        return;
      }
      setChapterLoading(true);
      try {
        const { data } = await supabase
          .from("study_chapters")
          .select("*")
          .eq("level_id", selectedLevelId)
          .order("sort_order", { ascending: true });
        setChapters(data || []);
      } catch (err) {
        console.error("Fetch chapters error:", err);
      } finally {
        setChapterLoading(false);
      }
    }
    fetchChapters();
  }, [selectedLevelId]);

  // Reset chapter selection when level changes
  useEffect(() => {
    setSelectedChapterId("");
  }, [selectedLevelId]);

  // Fetch Progress and Materials when Chapter changes
  const fetchProgressData = useCallback(async () => {
    setLoading(true);
    try {
      const currentBatchStudents = selectedBatchId === "ALL" || !selectedBatchId
        ? visibleStudents 
        : visibleStudents.filter(s => s.batch === selectedBatchId);
      
      const studentEmails = currentBatchStudents.map(s => s.email.trim().toLowerCase());

      if (studentEmails.length === 0 || !selectedChapterId) {
        setMaterials([]);
        setMatrix({});
        setLoading(false);
        return;
      }

      // Fetch materials for the selected chapter
      const { data: mats } = await supabase
        .from("study_materials")
        .select("id, title, material_type, chapter_id")
        .eq("chapter_id", selectedChapterId);
      
      const chapterMaterials = (mats || []) as StudyMaterial[];
      setMaterials(chapterMaterials);

      const materialIds = chapterMaterials.map(m => m.id);

      if (materialIds.length === 0) {
        setMatrix({});
        setLoading(false);
        return;
      }

      // Fetch progress for these students and these materials
      // Since `in` clause has limits, we can just fetch all progress for these material IDs
      // and then filter by student emails locally, or query directly.
      const { data: progressRows } = await supabase
        .from("user_material_progress")
        .select("user_email, material_id")
        .in("material_id", materialIds);

      const newMatrix: Record<string, string[]> = {};
      
      studentEmails.forEach(email => {
        newMatrix[email] = [];
      });

      (progressRows || []).forEach((item: any) => {
        const email = String(item.user_email).trim().toLowerCase();
        if (newMatrix[email]) {
          newMatrix[email].push(item.material_id);
        } else {
          // just in case
          newMatrix[email] = [item.material_id];
        }
      });
      
      setMatrix(newMatrix);
    } catch (err) {
      console.error("Fetch progress error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId, selectedChapterId, visibleStudents]);

  useEffect(() => {
    if (selectedChapterId) {
      fetchProgressData();
    } else {
      setMaterials([]);
      setMatrix({});
    }
  }, [selectedBatchId, selectedChapterId, fetchProgressData]);

  const filteredStudents = selectedBatchId === "ALL" || !selectedBatchId
    ? visibleStudents 
    : visibleStudents.filter(s => s.batch === selectedBatchId);

  // Computed data
  const { materiItems, quizItems } = useMemo(() => {
    const materiItems = materials.filter(m => m.material_type !== "quiz");
    const quizItems = materials.filter(m => m.material_type === "quiz");
    return { materiItems, quizItems };
  }, [materials]);

  const computedData = useMemo(() => {
    if (!selectedChapterId) return [];

    const level = levels.find(l => l.id === selectedLevelId);
    const chapter = chapters.find(c => c.id === selectedChapterId);

    return filteredStudents.map((stu, sIdx) => {
      const email = stu.email?.trim().toLowerCase();
      const completedIds = matrix[email] || [];

      // Logic: ✓ if they completed ALL materi/quiz in the chapter. 
      // If there are no materi/quiz, show '-' (handled during render or mapped as null)
      
      let isMateriCompleted: boolean | null = null;
      if (materiItems.length > 0) {
        isMateriCompleted = materiItems.every(m => completedIds.includes(m.id));
      }

      let isQuizCompleted: boolean | null = null;
      if (quizItems.length > 0) {
        isQuizCompleted = quizItems.every(q => completedIds.includes(q.id));
      }

      return {
        stu,
        index: sIdx + 1,
        levelName: level ? `${level.level_code} - ${level.title}` : "-",
        chapterName: chapter ? chapter.title : "-",
        isMateriCompleted,
        isQuizCompleted
      };
    });
  }, [filteredStudents, matrix, materiItems, quizItems, levels, chapters, selectedLevelId, selectedChapterId]);

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
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Progres Pembelajaran</h2>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest opacity-70">Monitoring Penyelesaian Materi & Quiz</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <select
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-w-[180px] appearance-none uppercase tracking-widest"
              >
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
                <option value="">Pilih Kategori (JLPT)</option>
                {levels.map(l => (
                  <option key={l.id} value={l.id}>{l.level_code} — {l.title}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <select
                value={selectedChapterId}
                onChange={e => setSelectedChapterId(e.target.value)}
                disabled={!selectedLevelId || chapterLoading}
                className="pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-w-[200px] appearance-none uppercase tracking-widest disabled:opacity-50"
              >
                <option value="">Pilih Bab (Chapter)</option>
                {chapters.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(!selectedLevelId || !selectedChapterId) ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-[3rem] p-32 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-8"
          >
            <div className="relative">
              <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner">📖</div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-bounce">
                <Search className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase italic">Pilih Kategori & Bab</h3>
              <p className="text-slate-500 max-w-sm mx-auto font-medium leading-relaxed">Silakan pilih kategori (level JLPT) dan bab materi di atas untuk melihat progres penyelesaian siswa.</p>
            </div>
          </motion.div>
        ) : loading ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-40 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-slate-100 shadow-sm"
          >
            <div className="relative">
              <div className="w-20 h-20 border-[6px] border-slate-100 rounded-full" />
              <div className="absolute top-0 left-0 w-20 h-20 border-[6px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] mt-8 text-[10px]">Memuat Data Progres...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-200/60 shadow-2xl shadow-slate-200/20">
              <div className="px-10 py-8 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Status Progres Pembelajaran</h3>
                    <p className="text-[10px] text-emerald-300/60 font-black uppercase tracking-[0.2em]">Berdasarkan {filteredStudents.length} Siswa</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={fetchProgressData} 
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/10 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M21 20v-5h-.581m-15.356-2a8.001 8.001 0 11-1.21 3.11" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-900">
                      {/* Kolom Kiri */}
                      <th className="sticky left-0 z-20 p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center w-16 text-slate-400">#</th>
                      <th className="sticky left-16 z-20 p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-left min-w-[240px]">Nama Siswa</th>
                      <th className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center min-w-[120px]">NIP</th>
                      <th className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center min-w-[120px]">Batch/Kelas</th>
                      
                      {/* Kolom Kanan */}
                      <th className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center min-w-[160px] bg-white/50 text-slate-600">Kategori Materi</th>
                      <th className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center min-w-[180px] bg-white/50 text-slate-600">Bab Materi</th>
                                      {/* Jenis Konten */}
                      <th className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center bg-indigo-50/30 text-indigo-700 min-w-[120px]">
                        Materi
                        <span className="block text-[7px] mt-0.5 text-indigo-400 tracking-tighter opacity-70">({materiItems.length} items)</span>
                      </th>
                      
                      {quizItems.map((q) => (
                        <th key={q.id} className="p-6 border-b border-r border-slate-100 text-[10px] font-black uppercase text-center bg-indigo-50/30 text-indigo-700 min-w-[150px] last:border-r-0">
                          {q.title}
                          <span className="block text-[7px] mt-0.5 text-indigo-400 tracking-tighter opacity-70">(Kuis)</span>
                        </th>
                      ))}
                      {quizItems.length === 0 && (
                        <th className="p-6 border-b border-slate-100 text-[10px] font-black uppercase text-center bg-indigo-50/30 text-indigo-700 min-w-[120px]">
                          Quiz
                          <span className="block text-[7px] mt-0.5 text-indigo-400 tracking-tighter opacity-70">(0 items)</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {computedData.length === 0 ? (
                      <tr>
                        <td colSpan={7 + Math.max(1, quizItems.length)} className="p-10 text-center text-sm font-medium text-slate-400">Tidak ada siswa yang ditemukan.</td>
                      </tr>
                    ) : (
                      computedData.map(({ stu, index, levelName, chapterName, isMateriCompleted }) => {
                      const isMateriLoading = actionLoading === `${stu.email.trim().toLowerCase()}-materi`;
                      const completedIds = matrix[stu.email?.trim().toLowerCase()] || [];
                      
                      return (
                        <tr key={stu.id} className="hover:bg-indigo-50/10 transition-colors group">
                          <td className="sticky left-0 z-10 p-5 bg-white border-r border-slate-100 text-center">
                            <span className="text-[11px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors">
                              {index}
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
                          <td className="p-5 border-r border-slate-100 text-center">
                            <span className="text-xs font-semibold text-slate-500">{stu.nip || "-"}</span>
                          </td>
                          <td className="p-5 border-r border-slate-100 text-center">
                            <span className="text-xs font-bold text-slate-500 tracking-widest">{stu.batch || "-"}</span>
                          </td>
                          <td className="p-5 border-r border-slate-50 text-center">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{levelName}</span>
                          </td>
                          <td className="p-5 border-r border-slate-50 text-center">
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{chapterName}</span>
                          </td>
                          
                          {/* Materi */}
                          <td className="p-5 border-r border-slate-50 text-center bg-indigo-50/5">
                            {isMateriLoading ? (
                              <div className="w-6 h-6 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            ) : isMateriCompleted === null ? (
                              <span className="text-slate-300 font-bold">-</span>
                            ) : isMateriCompleted ? (
                              <button
                                onClick={() => handleToggleMateri(stu, isMateriCompleted)}
                                title="Klik untuk membatalkan status selesai"
                                className="w-8 h-8 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleMateri(stu, isMateriCompleted)}
                                title="Klik untuk menandai selesai"
                                className="w-8 h-8 mx-auto bg-slate-50 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all text-xs font-bold"
                              >
                                ○
                              </button>
                            )}
                          </td>

                          {/* Quiz List Columns */}
                          {quizItems.map((q) => {
                            const isCompleted = completedIds.includes(q.id);
                            const isThisQuizLoading = actionLoading === `${stu.email.trim().toLowerCase()}-quiz-${q.id}`;
                            
                            return (
                              <td key={q.id} className="p-5 text-center bg-indigo-50/5 border-r border-slate-50 last:border-r-0">
                                {isThisQuizLoading ? (
                                  <div className="w-6 h-6 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                ) : isCompleted ? (
                                  <button
                                    onClick={() => handleToggleSingleQuiz(stu, q, true)}
                                    title={`Klik untuk membatalkan status selesai kuis: ${q.title}`}
                                    className="w-8 h-8 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleSingleQuiz(stu, q, false)}
                                    title={`Klik untuk menginput nilai kuis: ${q.title}`}
                                    className="w-8 h-8 mx-auto bg-slate-50 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all text-xs font-bold"
                                  >
                                    ○
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          {quizItems.length === 0 && (
                            <td className="p-5 text-center bg-indigo-50/5">
                              <span className="text-slate-300 font-bold">-</span>
                            </td>
                          )}
                        </tr>
                      );
                    })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-10 py-4 bg-slate-50/50 border-t border-slate-100 text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">LPK SAGARA</p>
              </div>
            </div>
            
            {/* Legend / Info */}
            <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex items-start gap-5">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💡</div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-indigo-900">Informasi Status</p>
                <p className="text-xs text-indigo-600 leading-relaxed max-w-3xl opacity-80 font-medium">
                  Tanda centang (✓) pada <strong>Materi</strong> menunjukkan siswa telah menyelesaikan seluruh materi belajar pada bab yang dipilih. Tanda centang (✓) pada <strong>Quiz</strong> menunjukkan siswa telah menyelesaikan kuis pada bab tersebut. Tanda strip (-) berarti tidak ada konten terkait di bab ini. Anda dapat mengklik lingkaran status untuk mengubah progres penyelesaian secara manual jika diperlukan (misalnya ujian kertas/paper-replacement).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Score Modal */}
      {showQuizModal && quizModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6"
          >
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                📝
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">Input Nilai Kuis Paper</h3>
                <p className="text-xs text-slate-500 font-medium">{quizModalData.student.full_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Nilai Ujian Kertas (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={quizScoreInput}
                  onChange={(e) => setQuizScoreInput(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-center"
                  placeholder="100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizModalData(null);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Batal
              </button>
              <button
                onClick={submitQuizScore}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-200"
              >
                Simpan & Centang
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
