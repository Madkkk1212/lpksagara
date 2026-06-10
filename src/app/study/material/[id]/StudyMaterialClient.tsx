"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudyMaterial } from "@/lib/types";
import { markMaterialCompleted, getBasicStudyMaterials, getProfileByEmail, upsertProfile, getStudyLevels } from "@/lib/db";
import { calculateChapterXPDistribution } from "@/lib/GamificationUtils";
import { supabase } from "@/lib/supabase";
import KioskBarrier from "@/app/components/KioskBarrier";
import ModernQuizPlayer, { NormalizedQuestion } from "@/app/components/ModernQuizPlayer";

export default function StudyMaterialClient({ materialData }: { materialData: StudyMaterial }) {
  const router = useRouter();
  const [showPdf, setShowPdf] = useState(false);
  const [showPpt, setShowPpt] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showPracticeQuiz, setShowPracticeQuiz] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [alertData, setAlertData] = useState<{ title: string; message: string; type?: 'warning' | 'error' | 'success' } | null>(null);
  const [isAccessActive, setIsAccessActive] = useState(false);
  const [isRemedialAccess, setIsRemedialAccess] = useState(false);
  const [accessOpenedAt, setAccessOpenedAt] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [categoryCustomTypeNames, setCategoryCustomTypeNames] = useState<Record<string, string>>({});
  const [isChapterLocked, setIsChapterLocked] = useState(false);
  const [isLevelLocked, setIsLevelLocked] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('luma-user-profile');
    if (sessionStr) {
      try {
        const u = JSON.parse(sessionStr);
        if (u.email) setUserEmail(u.email);
        if (u.full_name) setUserName(u.full_name);
        // Check if this material was already completed
        const unlocked: string[] = u.unlocked_materials || [];
        setIsAlreadyCompleted(unlocked.includes(materialData.id));
      } catch(e){}
    }
  }, [materialData.id]);

  useEffect(() => {
    const fetchCategoryCustomTypeNames = async () => {
      try {
        // Single JOIN query replaces 3 sequential roundtrips
        const { data: chapterData } = await supabase
          .from('study_chapters')
          .select('level_id, study_levels(category_id, material_categories(custom_type_names))')
          .eq('id', materialData.chapter_id)
          .single();
        
        const catData = (chapterData as any)?.study_levels?.material_categories;
        if (catData?.custom_type_names) {
          setCategoryCustomTypeNames(catData.custom_type_names);
        }
      } catch (e) {
        console.error("Failed to fetch parent category custom names:", e);
      }
    };

    if (materialData.chapter_id) {
      fetchCategoryCustomTypeNames();
    }
  }, [materialData.chapter_id]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userEmail) {
        setCheckingAccess(false);
        return;
      }
      try {
        // Fetch profile first, then use profile.id for parallel queries below
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, batch, is_admin, is_super_admin, is_teacher, is_premium, unlocked_levels, unlocked_materials")
          .eq("email", userEmail)
          .maybeSingle();

        if (profile) {
          setStudentProfileId(profile.id);
          const unlocked = profile.unlocked_materials || [];
          setIsAlreadyCompleted(unlocked.includes(materialData.id));
          
          const isStaff = profile.is_admin || profile.is_super_admin || profile.is_teacher;
          if (isStaff) {
            setIsAccessActive(true);
            setIsRemedialAccess(false);
            setIsChapterLocked(false);
            setIsLevelLocked(false);
          } else {
            // Fetch chapter's level_id, quiz access, all study levels, and user's completed materials in parallel
            const [chapterInfoRes, quizAccessRes, studyLevelsRes, completedRes] = await Promise.all([
              supabase
                .from('study_chapters')
                .select('level_id, study_levels(id, category_id, sort_order)')
                .eq('id', materialData.chapter_id)
                .single(),
              materialData.material_type === "quiz"
                ? supabase
                    .from("quiz_access_controls")
                    .select("is_active, updated_at, created_at, is_remedial, batch")
                    .eq("material_id", materialData.id)
                    .eq("student_id", profile.id)
                    .eq("is_active", true)
                : Promise.resolve({ data: null }),
              getStudyLevels().catch(() => []),
              supabase
                .from('user_material_progress')
                .select('material_id')
                .eq('user_email', userEmail.trim().toLowerCase())
            ]);

            const chapterInfo = chapterInfoRes.data;
            const levelInfo = (chapterInfo as any)?.study_levels;
            const allLevels = studyLevelsRes || [];

            let isLevelUnlocked = false;
            if (levelInfo) {
              const sameCatLevels = allLevels
                .filter((l: any) => l.category_id === levelInfo.category_id)
                .sort((a: any, b: any) => a.sort_order - b.sort_order);
              const slIdx = sameCatLevels.findIndex((l: any) => l.id === levelInfo.id);
              const isFirstLevel = slIdx === 0;

              let isPrevLvlCompleted = false;
              const completed = (completedRes.data || []).map((r: any) => r.material_id);
              if (slIdx > 0) {
                const prevLvl = sameCatLevels[slIdx - 1];
                const { data: prevChaps } = await supabase.from('study_chapters').select('id').eq('level_id', prevLvl.id);
                const prevChapIds = prevChaps?.map(c => c.id) || [];
                if (prevChapIds.length > 0) {
                   const { data: prevMats } = await supabase.from('study_materials').select('id').in('chapter_id', prevChapIds);
                   const prevMatIds = prevMats?.map(m => m.id) || [];
                   if (prevMatIds.length > 0) {
                      isPrevLvlCompleted = prevMatIds.every(id => completed.includes(id));
                   }
                }
              }

              isLevelUnlocked = isFirstLevel || profile.is_premium || isPrevLvlCompleted || (profile.unlocked_levels || []).includes(levelInfo.id);
            }

            if (!isLevelUnlocked) {
              console.warn(`[Security Alert] User ${userEmail} tried to access material from locked study level: ${levelInfo?.id}`);
              setIsLevelLocked(true);
              setIsAccessActive(false);
              setCheckingAccess(false);
              return;
            }

            // Chapter locking check
            if (chapterInfo?.level_id) {
              const { data: siblingChapters } = await supabase
                .from('study_chapters')
                .select('id, sort_order')
                .eq('level_id', chapterInfo.level_id)
                .order('sort_order', { ascending: true });
              
              if (siblingChapters) {
                const curIndex = siblingChapters.findIndex(c => c.id === materialData.chapter_id);
                if (curIndex > 0) {
                  const prevChapters = siblingChapters.slice(0, curIndex);
                  const prevChapterIds = prevChapters.map(c => c.id);
                  
                  // Fetch previous materials and completed progress in parallel
                  const [prevMaterialsRes, completedRes] = await Promise.all([
                    supabase
                      .from('study_materials')
                      .select('id, chapter_id')
                      .in('chapter_id', prevChapterIds),
                    supabase
                      .from('user_material_progress')
                      .select('material_id')
                      .eq('user_email', userEmail.trim().toLowerCase())
                  ]);

                  const prevMaterials = prevMaterialsRes.data;
                  const completedIds = new Set((completedRes.data || []).map(r => r.material_id));
                  
                  if (prevMaterials && prevMaterials.length > 0) {
                    for (const prevCh of prevChapters) {
                      const chMats = prevMaterials.filter(m => m.chapter_id === prevCh.id);
                      if (chMats.length > 0 && !chMats.every(m => completedIds.has(m.id))) {
                        setIsChapterLocked(true);
                        break;
                      }
                    }
                  }
                }
              }
            }

            // Handle quiz access result
            if (materialData.material_type === "quiz") {
              const accessData = (quizAccessRes as any).data;
              if (accessData && accessData.length > 0) {
                const duration = (materialData.content as any)?.duration_minutes || 60;
                const activeControl = accessData.find((control: any) => {
                  if (control.batch === 'PROGRESS:SELESAI') return false;
                  const openedTime = new Date(control.updated_at || control.created_at).getTime();
                  const expirationTime = openedTime + (duration * 60 * 1000);
                  return Date.now() <= expirationTime;
                });
                setIsAccessActive(!!activeControl);
                setIsRemedialAccess(!!(activeControl?.is_remedial));
                if (activeControl) {
                  setAccessOpenedAt(activeControl.updated_at || activeControl.created_at);
                } else {
                  setAccessOpenedAt(null);
                }
              } else {
                setIsAccessActive(false);
                setIsRemedialAccess(false);
                setAccessOpenedAt(null);
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Check access error:", err);
        setAlertData({
          title: "Gagal Memverifikasi Akses",
          message: err?.message || "Terjadi kesalahan saat memverifikasi hak akses Anda ke materi ini.",
          type: "error"
        });
      } finally {
        setCheckingAccess(false);
      }
    };

    if (userEmail) {
      checkAccess();
    } else {
      setCheckingAccess(false);
    }
  }, [userEmail, materialData.id, materialData.chapter_id]);

  const handleLiveProgressUpdate = async (answeredCount: number, totalCount: number) => {
    if (!studentProfileId) return;
    try {
      await supabase
        .from("quiz_access_controls")
        .update({ batch: `PROGRESS:${answeredCount}/${totalCount}` })
        .eq("material_id", materialData.id)
        .eq("student_id", studentProfileId);
    } catch (e) {
      console.error("Gagal memperbarui progress real-time:", e);
    }
  };

  const content: any = materialData.content || {};

  // Retry utility: attempts an async function up to maxRetries times with exponential backoff
  const retryAsync = async <T,>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1500): Promise<T> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        console.warn(`[Retry] Attempt ${attempt}/${maxRetries} failed:`, err);
        if (attempt === maxRetries) throw err;
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
    throw new Error("retryAsync: unreachable");
  };

  // Flush any pending grade saves that were queued due to previous network failures
  useEffect(() => {
    const flushPendingGrades = async () => {
      const PENDING_KEY = "lpk_pending_grade_saves";
      try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (!raw) return;
        const pending: any[] = JSON.parse(raw);
        if (!pending.length) return;

        console.log(`[Quiz Grade] Flushing ${pending.length} pending grade save(s)...`);
        const failed: any[] = [];

        for (const payload of pending) {
          try {
            // Check if already exists
            let existingQuery = supabase
              .from("assessment_chapter_grades")
              .select("id")
              .eq("student_email", payload.student_email)
              .eq("column_label", payload.column_label);

            if (payload.template_id) {
              existingQuery = existingQuery.eq("template_id", payload.template_id);
            } else {
              existingQuery = existingQuery.is("template_id", null).eq("level_id", payload.level_id);
            }

            const { data: existingRows } = await existingQuery;

            if (existingRows && existingRows.length > 0) {
              const { error } = await supabase
                .from("assessment_chapter_grades")
                .update(payload)
                .eq("id", existingRows[0].id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from("assessment_chapter_grades")
                .insert(payload);
              if (error) throw error;
            }
            console.log("[Quiz Grade] ✅ Pending grade flushed:", payload.column_label);
          } catch (e) {
            console.error("[Quiz Grade] ❌ Pending grade still failing:", e);
            failed.push(payload);
          }
        }

        if (failed.length > 0) {
          localStorage.setItem(PENDING_KEY, JSON.stringify(failed));
        } else {
          localStorage.removeItem(PENDING_KEY);
        }
      } catch (e) {
        console.error("[Quiz Grade] Error flushing pending grades:", e);
      }
    };

    flushPendingGrades();
  }, []);

  const handleFinish = async (passedAnswers?: Record<string, any>, scorePercent?: number) => {
    if (!userEmail) { 
      setAlertData({ title: "Sesi Berakhir", message: "Silakan login kembali untuk melanjutkan.", type: 'warning' });
      return; 
    }

    setIsFinishing(true);
    try {
      // Check if already completed — skip XP award if so
      const alreadyDone = isAlreadyCompleted;

      // Save quiz score to assessment matrix if this is a quiz
      if (materialData.material_type === 'quiz') {
        const normalizedQuestions = content.is_section_test
          ? (content.sections || []).flatMap((sec: any) => 
              (sec.questions || []).map((ex: any, idx: number) => ({
                id: ex.id || `quiz-${idx}`,
                question_type: ex.question_type || (ex.options && ex.options.length > 0 ? "multiple_choice" : "essay"),
                options: ex.options || [],
                correct_option: ex.answer !== undefined ? ex.answer : -1,
              }))
            )
          : (content.exercises || []).map((ex: any, idx: number) => ({
              id: `quiz-${idx}`,
              question_type: ex.options && ex.options.length > 0 ? "multiple_choice" : "essay",
              options: ex.options || [],
              correct_option: ex.answer !== undefined ? ex.answer : -1,
            }));

        let score = scorePercent !== undefined ? scorePercent : 0;
        if (scorePercent === undefined && passedAnswers && normalizedQuestions.length > 0) {
          let correct = 0;
          let totalMC = 0;
          normalizedQuestions.forEach((q: any) => {
            if (q.question_type === "multiple_choice" || (q.options && q.options.length > 0)) {
              totalMC++;
              const studentAns = passedAnswers[q.id];
              if (studentAns !== undefined && parseInt(studentAns) === q.correct_option) {
                correct++;
              }
            }
          });
          score = totalMC > 0 ? Math.round((correct / totalMC) * 100) : 100;
        }

        // Wrap grade save in retry logic for network resilience
        await retryAsync(async () => {
          // Search for a matching template and the chapter title in parallel
          const [tplRes, chapterRes] = await Promise.all([
            supabase
              .from("assessment_chapter_templates")
              .select("id")
              .eq("chapter_id", materialData.chapter_id)
              .eq("is_active", true)
              .maybeSingle(),
            supabase
              .from("study_chapters")
              .select("title, level_id")
              .eq("id", materialData.chapter_id)
              .maybeSingle()
          ]);

          const tpl = tplRes.data;
          const chapter = chapterRes.data;

          if (tplRes.error) {
            console.error("[Quiz Grade] Template query error:", tplRes.error);
          }
          if (chapterRes.error) {
            console.error("[Quiz Grade] Chapter query error:", chapterRes.error);
          }

          if (chapter) {
            const columnLabel = isRemedialAccess
              ? `${chapter.title} ::: ${materialData.title} (Remedial)`
              : `${chapter.title} ::: ${materialData.title}`;

            let existingQuery = supabase
              .from("assessment_chapter_grades")
              .select("id")
              .eq("student_email", userEmail.trim().toLowerCase())
              .eq("column_label", columnLabel);

            if (tpl?.id) {
              existingQuery = existingQuery.eq("template_id", tpl.id);
            } else {
              existingQuery = existingQuery.is("template_id", null).eq("level_id", chapter.level_id);
            }

            const { data: existingRows } = await existingQuery;

            const gradePayload = {
              student_email: userEmail.trim().toLowerCase(),
              template_id: tpl?.id || null,
              level_id: chapter.level_id,
              column_label: columnLabel,
              value: String(score),
              updated_at: new Date().toISOString()
            };

            console.log("[Quiz Grade] Saving grade payload:", JSON.stringify(gradePayload));

            if (existingRows && existingRows.length > 0) {
              const { error: updateErr } = await supabase
                .from("assessment_chapter_grades")
                .update(gradePayload)
                .eq("id", existingRows[0].id);
              if (updateErr) {
                console.error("[Quiz Grade] Gagal update nilai:", updateErr);
                throw new Error("Gagal menyimpan nilai quiz: " + updateErr.message);
              }
              console.log("[Quiz Grade] ✅ Grade UPDATED successfully for:", columnLabel);
            } else {
              const { error: insertErr } = await supabase
                .from("assessment_chapter_grades")
                .insert(gradePayload);
              if (insertErr) {
                console.error("[Quiz Grade] Gagal insert nilai:", insertErr);
                throw new Error("Gagal menyimpan nilai quiz: " + insertErr.message);
              }
              console.log("[Quiz Grade] ✅ Grade INSERTED successfully for:", columnLabel);
            }

            if (!tpl?.id) {
              console.warn(
                `[Quiz Grade] Tidak ada template untuk chapter "${chapter.title}" — ` +
                `nilai tersimpan dengan template_id=null. Buka Kelola Penilaian ` +
                `dan buat template agar nilai muncul di laporan guru.`
              );
            }
          } else {
            console.error(
              `[Quiz Grade] ❌ Chapter tidak ditemukan untuk chapter_id: ${materialData.chapter_id}. ` +
              `Nilai TIDAK tersimpan! Pastikan study_chapters memiliki data yang valid.`
            );
            throw new Error("Gagal menyimpan nilai: data chapter tidak ditemukan.");
          }
        }).catch((finalErr) => {
          // All retries failed — save to localStorage pending queue as last resort
          console.error("[Quiz Grade] All retries failed. Queueing to localStorage for later.", finalErr);
          try {
            const PENDING_KEY = "lpk_pending_grade_saves";
            const existing = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
            existing.push({
              student_email: userEmail.trim().toLowerCase(),
              template_id: null, // Will be resolved on flush
              level_id: null,
              column_label: `PENDING:::${materialData.chapter_id}:::${materialData.title}${isRemedialAccess ? ' (Remedial)' : ''}`,
              value: String(score),
              material_id: materialData.id,
              chapter_id: materialData.chapter_id,
              is_remedial: isRemedialAccess,
              updated_at: new Date().toISOString()
            });
            localStorage.setItem(PENDING_KEY, JSON.stringify(existing));
            console.log("[Quiz Grade] Grade queued for retry on next page load.");
          } catch (lsErr) {
            console.error("[Quiz Grade] Failed to queue grade to localStorage:", lsErr);
          }
          // Don't rethrow — allow the rest of handleFinish (marking complete, XP) to proceed
        });
      }

      if (studentProfileId) {
        await supabase
          .from("quiz_access_controls")
          .update({ batch: "PROGRESS:SELESAI" })
          .eq("material_id", materialData.id)
          .eq("student_id", studentProfileId);
      }

      await markMaterialCompleted(userEmail, materialData.id);

      if (!alreadyDone) {
        // Award XP only for first-time completion
        const chapterMats = await getBasicStudyMaterials(materialData.chapter_id);
        const materialsOnly = chapterMats.filter(m => m.material_type !== 'quiz');
        const quizzesOnly = chapterMats.filter(m => m.material_type === 'quiz');

        const isQuiz = materialData.material_type === 'quiz';
        const distribution = calculateChapterXPDistribution(materialsOnly.length, quizzesOnly.length);

        let awardedXP = 0;
        if (isQuiz) {
          const idx = quizzesOnly.findIndex(m => m.id === materialData.id);
          awardedXP = (distribution.quizzes && distribution.quizzes[idx]) || 0;
        } else {
          const idx = materialsOnly.findIndex(m => m.id === materialData.id);
          awardedXP = (distribution.materials && distribution.materials[idx]) || 0;
        }

        const prof = await getProfileByEmail(userEmail);
        if (prof && awardedXP > 0) {
          const newExp = (prof.exp || 0) + awardedXP;
          const newLevel = Math.floor(newExp / 1000) + 1;
          await upsertProfile({ email: userEmail, exp: newExp, level: newLevel });
          const updatedProf = { ...prof, exp: newExp, level: newLevel,
            unlocked_materials: [...(prof.unlocked_materials || []), materialData.id]
          };
          localStorage.setItem('luma-user-profile', JSON.stringify(updatedProf));
        }

        setIsAlreadyCompleted(true);
        setAlertData({
          title: "Materi Selesai! 🎉",
          message: `Selamat, Anda berhasil menyelesaikan materi ini${awardedXP > 0 ? ` dan mendapatkan +${awardedXP} EXP` : ''}.`,
          type: "success"
        });
      }

      if (materialData.material_type !== 'quiz') {
        if (alreadyDone) {
          // If they click the button when it's already done (Selesai Belajar (Kembali))
          router.push('/learning');
          router.refresh();
        }
      }
    } catch(e: any) {
      console.error("[handleFinish] Error saving quiz result:", e);
      setAlertData({ 
        title: "Gagal Menyimpan Nilai", 
        message: e?.message || "Gagal menyimpan progres belajar. Silakan coba lagi atau hubungi admin.", 
        type: 'error' 
      });
      setIsFinishing(false);
    }
  };

  const fixUrl = (url?: string | null): string | undefined => typeof url === 'string' ? url.replace(/^undefined\//, "https://storage.sagaracloud.web.id/").replace("https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev", "https://storage.sagaracloud.web.id") : undefined;

  // Render standalone quiz using our brand-new ModernQuizPlayer
  if (materialData.material_type === 'quiz') {
    const normalizedQuestions: NormalizedQuestion[] = content.is_section_test
      ? (content.sections || []).flatMap((sec: any) => 
          (sec.questions || []).map((ex: any, idx: number) => ({
            id: ex.id || `quiz-${idx}`,
            question_text: ex.q,
            options: ex.options || [],
            correct_option: ex.answer !== undefined ? ex.answer : -1,
            explanation: ex.explanation || "Tidak ada pembahasan.",
            audio_url: fixUrl(ex.audio_url || ex.audioUrl || ex.audio),
            image_url: fixUrl(ex.image_url || ex.imageUrl || ex.image),
            video_url: fixUrl(ex.video_url || ex.videoUrl || ex.video),
            question_type: ex.question_type || (ex.options && ex.options.length > 0 ? "multiple_choice" : "essay"),
            section_title: sec.title,
            section_instructions: sec.instructions,
            section_audio_url: fixUrl(sec.media?.audio_url || sec.media?.audioUrl || sec.media?.audio),
            section_image_url: fixUrl(sec.media?.image_url || sec.media?.imageUrl || sec.media?.image),
            section_pdf_url: fixUrl(sec.media?.pdf_url || sec.media?.pdfUrl || sec.media?.pdf),
            section_ppt_url: fixUrl(sec.media?.ppt_url || sec.media?.pptUrl || sec.media?.ppt),
            section_video_url: fixUrl(sec.media?.video_url || sec.media?.videoUrl || sec.media?.video),
          }))
        )
      : (content.exercises || []).map((ex: any, idx: number) => ({
          id: `quiz-${idx}`,
          question_text: ex.q,
          options: ex.options || [],
          correct_option: ex.answer !== undefined ? ex.answer : -1,
          explanation: ex.explanation || "Tidak ada pembahasan.",
          audio_url: fixUrl(ex.audio_url || ex.audioUrl || ex.audio),
          image_url: fixUrl(ex.image_url || ex.imageUrl || ex.image),
          video_url: fixUrl(ex.video_url || ex.videoUrl || ex.video),
          question_type: ex.options && ex.options.length > 0 ? "multiple_choice" : "essay",
          section_title: "Evaluasi Utama",
          section_instructions: content.instructions || "Silakan jawab pertanyaan berikut dengan saksama.",
          section_audio_url: fixUrl(content.audio_url || content.audioUrl || content.audio || materialData.audio_url),
          section_image_url: fixUrl(content.image_url || content.imageUrl || content.image || materialData.image_url),
          section_video_url: fixUrl(content.video_url || content.videoUrl || content.video || materialData.video_url)
        }));

    const isStaff = typeof window !== 'undefined' && (() => {
      try {
        const raw = localStorage.getItem("luma-user-profile");
        if (raw) {
          const u = JSON.parse(raw);
          return u.is_admin || u.is_super_admin || u.is_teacher;
        }
      } catch (e) {}
      return false;
    })();

    // Jika akses remedial aktif → izinkan mengerjakan meskipun sudah selesai sebelumnya
    const isQuiz = materialData.material_type === 'quiz';
    const showCompletedScreen = isQuiz && !isStaff && isAlreadyCompleted && !isRemedialAccess;
    const showNoAccessScreen = isQuiz && !isStaff && !isAlreadyCompleted && !isAccessActive;

    if (checkingAccess) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 text-sm font-semibold">Memverifikasi akses...</p>
          </div>
        </div>
      );
    }

    if (isLevelLocked) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-6xl animate-bounce">🔒</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">Level Terkunci!</h1>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Anda tidak memiliki akses ke level ini. Silakan hubungi admin jika Anda memerlukan akses ke materi level ini.
              </p>
            </div>
            <button 
              onClick={() => router.back()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition shadow-lg active:scale-95"
            >
              Kembali ke Pembelajaran
            </button>
          </div>
        </div>
      );
    }

    if (isChapterLocked) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-6xl animate-bounce">🔒</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">Bab Masih Terkunci!</h1>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Anda harus menyelesaikan semua materi di bab sebelumnya terlebih dahulu sebelum dapat mengakses materi di bab ini.
              </p>
            </div>
            <button 
              onClick={() => router.back()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition shadow-lg active:scale-95"
            >
              Kembali ke Pembelajaran
            </button>
          </div>
        </div>
      );
    }

    if (showCompletedScreen) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-6xl animate-bounce">🔒</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">Kuis Sudah Selesai!</h1>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Anda telah menyelesaikan kuis <strong>"{materialData.title}"</strong> sebelumnya. Sesuai ketentuan, kuis yang telah dikerjakan tidak dapat dibuka kembali.
              </p>
            </div>
            <button 
              onClick={() => router.back()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition shadow-lg active:scale-95"
            >
              Kembali ke Pembelajaran
            </button>
          </div>
        </div>
      );
    }

    if (showNoAccessScreen) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-6xl animate-bounce">🔒</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">Akses Kuis Belum Dibuka!</h1>
              <p className="text-slate-500 text-sm font-semibold leading-relaxed">
                Akses ke kuis <strong>"{materialData.title}"</strong> belum dibuka oleh guru Anda, atau waktu pengerjaan kuis telah habis. Silakan hubungi guru Anda untuk mendapatkan akses.
              </p>
            </div>
            <button 
              onClick={() => router.back()}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition shadow-lg active:scale-95"
            >
              Kembali ke Pembelajaran
            </button>
          </div>
        </div>
      );
    }

    return (
      <KioskBarrier 
        title={`Kuis Evaluasi Bab: ${materialData.title}`}
        userName={userName}
        userEmail={userEmail}
        studentId={studentProfileId || undefined}
        testId={materialData.id}
        testTitle={materialData.title}
      >
        <ModernQuizPlayer
          title={materialData.title}
          questions={normalizedQuestions}
          mode="quiz"
          durationMinutes={content.duration_minutes || 60}
          localStorageKey={`material_quiz_${materialData.id}`}
          accessOpenedAt={accessOpenedAt || undefined}
          onFinish={async (answers, score) => {
            await handleFinish(answers, score);
          }}
          onClose={() => router.back()}
          onProgressUpdate={(answered, total) => {
            handleLiveProgressUpdate(answered, total);
          }}
        />
      </KioskBarrier>
    );
  }

  // Study Materials rendering logic (Moji-Goi, Bunpou, Dokkai, Choukai)
  const renderMojiGoi = () => (
    <div className="space-y-6">
      {content.items?.map((item: any, idx: number) => (
        <div key={idx} className="p-6 bg-white rounded-3xl shadow-sm ring-1 ring-black/[0.05] hover:ring-teal-500/20 transition-all flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-1">{item.jp}</h3>
            <p className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full inline-block">{item.id}</p>
            {item.example && <p className="text-sm text-slate-500 mt-4 italic">"{item.example}"</p>}
          </div>
          {(item.audioUrl || item.audio_url) && (
            <button 
              onClick={() => new Audio(fixUrl(item.audioUrl || item.audio_url)).play().catch(err => alert("Gagal memutar audio: " + err.message))}
              className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl hover:bg-slate-200 active:scale-95 transition-all"
            >
              🔊
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const renderBunpou = () => (
    <div className="space-y-8">
      {content.items?.map((item: any, idx: number) => (
        <div key={idx} className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white text-center">
            <h3 className="text-2xl font-black tracking-widest">{item.pattern}</h3>
          </div>
          <div className="p-8">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Penjelasan</h4>
            <p className="text-slate-700 font-medium leading-relaxed mb-6 whitespace-pre-wrap">{item.explanation}</p>
            
            <h4 className="text-xs font-black uppercase text-slate-400 mb-4 border-t border-slate-100 pt-6">Contoh Kalimat</h4>
            <ul className="space-y-4">
              {item.examples?.map((ex: any, i: number) => (
                <li key={i} className="flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl">
                   <span className="text-lg font-bold text-slate-800">{ex.jp}</span>
                   <span className="text-sm text-slate-500 italic">{ex.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDokkai = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-100 relative">
        <button 
          onClick={() => setShowTranslation(!showTranslation)}
          className="absolute top-6 right-6 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
        >
          {showTranslation ? 'Sembunyikan Arti' : 'Lihat Arti'}
        </button>
        <h3 className="text-sm font-black text-teal-600 uppercase tracking-widest mb-6">Teks Bacaan</h3>
        <p className="text-xl font-medium text-slate-800 leading-loose">{content.text_jp}</p>
        
        {showTranslation && (
          <div className="mt-8 p-6 bg-teal-50 rounded-2xl border border-teal-100">
             <p className="text-teal-900 font-medium italic">{content.text_id}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderChoukai = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2rem] p-10 shadow-sm ring-1 ring-slate-100 text-center flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-4xl mb-6 shadow-inner">
           🎧
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-6 tracking-wide">Audio Listening</h3>
        {(content?.audioUrl || content?.audio_url || materialData?.audio_url) ? (
          <audio controls className="w-full" src={fixUrl(content?.audioUrl || content?.audio_url || materialData?.audio_url)}>
            Browser Anda tidak mendukung tag audio.
          </audio>
        ) : (
          <p className="text-slate-400 text-sm font-medium">Audio tidak tersedia.</p>
        )}
      </div>
    </div>
  );

  return (
    <main className="flex flex-col bg-slate-50 min-h-screen pb-40 relative">
      {/* Header */}
      <header className="shrink-0 px-6 pt-12 pb-8 bg-white shadow-sm ring-1 ring-black/[0.03] z-30 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition">
              ←
            </button>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {(() => {
                if (content?.custom_type_name) return content.custom_type_name;
                if (categoryCustomTypeNames[materialData.material_type]) {
                  return categoryCustomTypeNames[materialData.material_type];
                }
                if (materialData.material_type === 'bunpou') return 'tata bahasa';
                if (materialData.material_type === 'dokkai') return 'reading';
                if (materialData.material_type === 'choukai') return 'listening';
                return materialData.material_type.replace('_', ' ');
              })()}
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
            {materialData.title}
          </h1>
        </div>
        {materialData.icon_url && (
          <img src={materialData.icon_url || undefined} alt="icon" className="w-16 h-16 object-contain rounded-2xl shadow-sm bg-slate-50 p-2" />
        )}
      </header>
      
      <div className="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto px-6 mt-8 pb-48">
            {/* Video banner if material has video */}
            {materialData.video_url && (
              <div className="mb-8 rounded-[2rem] overflow-hidden bg-black shadow-xl ring-1 ring-black/10">
                <video
                  controls
                  className="w-full max-h-80"
                  src={fixUrl(materialData.video_url)}
                  poster={fixUrl(materialData.image_url) || undefined}
                >
                  Browser tidak mendukung video.
                </video>
              </div>
            )}
            {/* Image banner if material has image */}
            {materialData.image_url && (
              <div className="mb-8 rounded-[2rem] overflow-hidden shadow-md ring-1 ring-black/5">
                <img
                  src={fixUrl(materialData.image_url)}
                  alt={materialData.title}
                  className="w-full max-h-64 object-cover"
                />
              </div>
            )}

            {/* Audio Player */}
            {((content?.audioUrl || content?.audio_url || materialData?.audio_url) && materialData.material_type !== 'choukai') && (
              <div className="mb-8 p-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 rounded-2xl shadow-lg text-white flex flex-col md:flex-row items-center gap-4 relative z-10">
                <div className="h-12 w-12 shrink-0 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">🎧</div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-xs font-black uppercase tracking-wider opacity-85">Audio Pendukung</p>
                  <p className="text-sm font-bold mt-0.5">Silakan dengarkan audio pendukung materi di bawah ini.</p>
                </div>
                <audio 
                  controls 
                  controlsList="nodownload"
                  className="w-full md:min-w-[300px] md:w-auto shrink-0 outline-none rounded-full" 
                  src={fixUrl(content?.audioUrl || content?.audio_url || materialData?.audio_url)}
                >
                  Browser Anda tidak mendukung elemen audio.
                </audio>
              </div>
            )}

            {/* PDF Viewer */}
            {(() => {
              let parsedContent = content || {};
              if (typeof parsedContent === 'string') {
                try { parsedContent = JSON.parse(parsedContent); } catch(e) {}
              }
              const activePdfUrl = parsedContent.pdf_url || parsedContent.document_url || parsedContent.sections?.[0]?.media?.pdf_url || parsedContent.sections?.[0]?.media?.pdfUrl || parsedContent.sections?.[0]?.media?.pdf;
              if (!activePdfUrl) return null;
              return (
              <div className="mb-8 rounded-[2rem] overflow-hidden bg-white border border-slate-100 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📕</span>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{content.pdf_name || "Dokumen PDF"}</h3>
                      <p className="text-xs font-bold text-slate-400">Silakan pelajari materi PDF di bawah ini langsung.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowPdf(!showPdf)}
                      className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl text-xs font-black transition-all"
                    >
                      {showPdf ? "Tutup PDF" : "Buka PDF"}
                    </button>
                    <a 
                      href={fixUrl(activePdfUrl)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-black transition-all"
                    >
                      Tab Baru ↗
                    </a>
                  </div>
                </div>
                {showPdf && (
                  <iframe 
                    src={`${fixUrl(activePdfUrl)}#toolbar=0`} 
                    className="w-full h-[600px] rounded-2xl border border-slate-100 shadow-inner mt-4 animate-in fade-in duration-500"
                  />
                )}
              </div>
              );
            })()}

            {/* PPT Slides iframe viewer */}
            {(() => {
              let parsedContent = content || {};
              if (typeof parsedContent === 'string') {
                try { parsedContent = JSON.parse(parsedContent); } catch(e) {}
              }
              const activePptUrl = parsedContent.ppt_url || parsedContent.sections?.[0]?.media?.ppt_url || parsedContent.sections?.[0]?.media?.pptUrl || parsedContent.sections?.[0]?.media?.ppt;
              if (!activePptUrl) return null;
              return (
              <div className="mb-8 rounded-[2rem] overflow-hidden bg-white border border-slate-100 shadow-lg p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">{content.ppt_name || "Slide PPT / Presentasi"}</h3>
                      <p className="text-xs font-bold text-slate-400">Silakan pelajari slide presentasi PPT di bawah ini langsung.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowPpt(!showPpt)}
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-xs font-black transition-all"
                    >
                      {showPpt ? "Tutup PPT" : "Buka PPT"}
                    </button>
                    <a 
                      href={fixUrl(activePptUrl)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 rounded-xl text-xs font-black transition-all"
                    >
                      Download ↗
                    </a>
                  </div>
                </div>
                {showPpt && (
                  <iframe 
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fixUrl(activePptUrl)!)}`} 
                    className="w-full h-[600px] rounded-2xl border border-slate-100 shadow-inner mt-4 animate-in fade-in duration-500"
                    title="PPT Viewer"
                  />
                )}
              </div>
              );
            })()}

            {/* Study Specific Content Render */}
            {materialData.material_type === 'moji_goi' && renderMojiGoi()}
            {materialData.material_type === 'bunpou' && renderBunpou()}
            {materialData.material_type === 'dokkai' && renderDokkai()}
            {materialData.material_type === 'choukai' && renderChoukai()}

            {/* Beautiful, High-end Practice Question Call-to-Action Card */}
            {content.exercises && content.exercises.length > 0 && (
              <div className="mt-12 p-8 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
                <div className="space-y-2 relative z-10 text-center md:text-left">
                  <span className="bg-teal-500/15 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Latihan Soal Interaktif</span>
                  <h3 className="text-2xl font-black italic tracking-tight">Siap Uji Pemahaman Anda?</h3>
                  <p className="text-slate-400 text-sm font-medium">Ada {content.exercises.length} pertanyaan kuis interaktif untuk mengukur pemahaman materi ini.</p>
                </div>
                <button 
                  onClick={() => setShowPracticeQuiz(true)}
                  className="px-6 py-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition relative z-10 active:scale-95 shadow-xl shadow-teal-500/20"
                >
                  ✍️ Mulai Latihan Soal
                </button>
                <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-teal-500/5 rounded-full blur-3xl" />
              </div>
            )}
        </div>
      </div>

      {/* Completion Footer */}
      <div className="fixed bottom-0 inset-x-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto">
          <button 
             onClick={() => handleFinish()} 
             disabled={isFinishing}
             className={`w-full py-5 text-white rounded-2xl font-black tracking-widest uppercase active:scale-95 transition-all shadow-xl disabled:opacity-50 ${
               isAlreadyCompleted 
                 ? 'bg-emerald-600 hover:bg-emerald-700' 
                 : 'bg-slate-900 hover:bg-slate-800'
             }`}
          >
             {isFinishing ? 'Menyimpan...' : isAlreadyCompleted ? 'Selesai Belajar (Kembali)' : '✓ Tandai Selesai & Lanjut'}
          </button>
        </div>
      </div>

      {/* Fullscreen Practice Quiz Overlay */}
      {showPracticeQuiz && (
        <div className="fixed inset-0 z-[100] bg-white animate-in fade-in duration-300">
          <ModernQuizPlayer
            title={`Latihan: ${materialData.title}`}
            questions={content.is_section_test
              ? (content.sections || []).flatMap((sec: any) => 
                  (sec.questions || []).map((ex: any, idx: number) => ({
                    id: ex.id || `practice-${idx}`,
                    question_text: ex.q,
                    options: ex.options || [],
                    correct_option: ex.answer !== undefined ? ex.answer : -1,
                    explanation: ex.explanation,
                    audio_url: fixUrl(ex.audio_url || ex.audioUrl || ex.audio),
                    image_url: fixUrl(ex.image_url || ex.imageUrl || ex.image),
                    video_url: fixUrl(ex.video_url || ex.videoUrl || ex.video),
                    question_type: ex.question_type || (ex.options && ex.options.length > 0 ? "multiple_choice" : "essay"),
                    section_title: sec.title,
                    section_instructions: sec.instructions,
                    section_audio_url: fixUrl(sec.media?.audio_url || sec.media?.audioUrl || sec.media?.audio),
                    section_image_url: fixUrl(sec.media?.image_url || sec.media?.imageUrl || sec.media?.image),
                    section_pdf_url: fixUrl(sec.media?.pdf_url || sec.media?.pdfUrl || sec.media?.pdf),
                    section_ppt_url: fixUrl(sec.media?.ppt_url || sec.media?.pptUrl || sec.media?.ppt),
                    section_video_url: fixUrl(sec.media?.video_url || sec.media?.videoUrl || sec.media?.video),
                  }))
                )
              : (content.exercises || []).map((ex: any, idx: number) => ({
                  id: `practice-${idx}`,
                  question_text: ex.q,
                  options: ex.options || [],
                  correct_option: ex.answer !== undefined ? ex.answer : -1,
                  explanation: ex.explanation,
                  audio_url: fixUrl(ex.audio_url || ex.audioUrl || ex.audio),
                  image_url: fixUrl(ex.image_url || ex.imageUrl || ex.image),
                  video_url: fixUrl(ex.video_url || ex.videoUrl || ex.video),
                  question_type: ex.options && ex.options.length > 0 ? "multiple_choice" : "essay",
                  section_title: "Evaluasi Utama",
                  section_instructions: content.instructions || "Silakan jawab pertanyaan berikut dengan saksama.",
                  section_audio_url: fixUrl(content.audio_url || content.audioUrl || content.audio || materialData.audio_url),
                  section_image_url: fixUrl(content.image_url || content.imageUrl || content.image || materialData.image_url),
                  section_video_url: fixUrl(content.video_url || content.videoUrl || content.video || materialData.video_url)
                }))}
            mode="latihan"
            localStorageKey={`practice_quiz_${materialData.id}`}
            onFinish={() => {
              setShowPracticeQuiz(false);
            }}
            onClose={() => setShowPracticeQuiz(false)}
          />
        </div>
      )}

      {/* Notifications */}
      {alertData && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-5xl mb-6 text-center">
              {alertData.type === 'error' ? '❌' : alertData.type === 'success' ? '✅' : '⚠️'}
            </div>
            <h3 className="text-2xl font-black text-slate-800 text-center mb-2 italic tracking-tight">{alertData.title}</h3>
            <p className="text-slate-500 font-medium text-center mb-10 leading-relaxed text-sm">{alertData.message}</p>
            <button 
              onClick={() => setAlertData(null)}
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 active:scale-95 transition-all shadow-xl"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
