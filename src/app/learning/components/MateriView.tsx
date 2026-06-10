"use client";

import { useEffect, useState, useMemo } from "react";
import { Profile, MaterialCategory, StudyLevel, StudyChapter, StudyMaterial, AppTheme } from "@/lib/types";
import { getMaterialCategories, getStudyLevels, getStudyChapters, getStudyMaterials, upsertProfile, getCompletedMaterials, markMaterialCompleted, getAllStudyChapters, getBasicStudyMaterials } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Lock, CheckCircle2, Trophy, Star } from "lucide-react";
import { calculateChapterXPDistribution } from "@/lib/GamificationUtils";
import { motion, AnimatePresence } from "framer-motion";
import { getFriendlyErrorMessage, reportClientError } from "@/lib/error-monitoring";

interface MateriViewProps {
  user: Profile;
  theme: AppTheme | null;
  onUpgrade?: (msg: string) => void;
  onRefreshUser?: () => void;
}

type StudyMapPayload = {
  categories: MaterialCategory[];
  levels: StudyLevel[];
  chapters: StudyChapter[];
  materials: StudyMaterial[];
  completedMaterialIds: string[];
  quizAccess: { material_id: string; is_active: boolean }[];
  dbMaterialsCount?: number;
};

async function fetchStudyMap(user: Profile): Promise<StudyMapPayload | null> {
  const params = new URLSearchParams();
  if (user.email) params.set("email", user.email);
  if (user.batch) params.set("batch", user.batch);
  params.set("_t", Date.now().toString()); // Cache bust

  const res = await fetch(`/api/lms/study-map?${params.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Study map API gagal (${res.status})`);
  }

  const json = await res.json();
  if (json?.error) {
    throw new Error(json.error);
  }

  if (Array.isArray(json?.errors) && json.errors.length > 0) {
    console.warn("[LMS] Study map loaded with partial errors:", json.errors);
  }

  return json?.data || null;
}

export default function MateriView({ user, theme, onUpgrade, onRefreshUser }: MateriViewProps) {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<StudyLevel | null>(null);
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [chapterMaterials, setChapterMaterials] = useState<Record<string, StudyMaterial[]>>({});
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [showPpt, setShowPpt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // New states for progression
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [allLevelMaterials, setAllLevelMaterials] = useState<StudyMaterial[]>([]);
  const [allChaps, setAllChaps] = useState<StudyChapter[]>([]);
  const [globalMats, setGlobalMats] = useState<Partial<StudyMaterial>[]>([]);
  const [completing, setCompleting] = useState(false);
  const [activeQuizzes, setActiveQuizzes] = useState<string[]>([]);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fetchingMaterialId, setFetchingMaterialId] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (user.is_admin || user.is_super_admin || user.is_teacher) return categories;
    if (user.category_id) {
      return categories.filter(c => c.id === user.category_id);
    }
    return categories;
  }, [categories, user.is_admin, user.is_super_admin, user.is_teacher, user.category_id]);

  const isLevelCompleted = (levelId: string) => {
     const levelChaps = allChaps.filter(c => c.level_id === levelId);
     const levelMats = globalMats.filter(m => levelChaps.some(c => c.id === m.chapter_id));
     if (levelMats.length === 0) return false;
     return levelMats.every(m => m.id && completedMaterials.includes(m.id));
  };

  const isLevelUnlocked = (lvlId: string) => {
    if (user.is_admin || user.is_super_admin || user.is_teacher || user.is_premium) return true;
    if ((user.unlocked_levels || []).includes(lvlId)) return true;
    
    const sameCatLevels = levels
      .filter(l => l.category_id === activeCategory)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const idx = sameCatLevels.findIndex(l => l.id === lvlId);
    if (idx <= 0) return true; // first level is always unlocked
    
    const prevLvl = sameCatLevels[idx - 1];
    return isLevelCompleted(prevLvl.id);
  };

  // Progression Logic
  const isChapterCompleted = (chapterId: string) => {
    const chapterMats = allLevelMaterials.filter(m => m.chapter_id === chapterId);
    if (chapterMats.length === 0) return false; 
    return chapterMats.every(m => completedMaterials.includes(m.id));
  };

  const isChapterUnlocked = (chapterId: string) => {
    if (user.is_admin || user.is_super_admin || user.is_teacher) return true;
    const idx = chapters.findIndex(c => c.id === chapterId);
    if (idx <= 0) return true; // first chapter is always unlocked
    const prevChap = chapters[idx - 1];
    return isChapterCompleted(prevChap.id);
  };

  const isMaterialCompleted = (materialId: string) => {
    return completedMaterials.includes(materialId);
  };

  const isMaterialUnlocked = (chapterId: string, materialId: string) => {
    if (!isChapterUnlocked(chapterId)) return false;

    const mats = chapterMaterials[chapterId];
    if (!mats) return false;
    
    const sortedMats = [...mats].sort((a, b) => a.sort_order - b.sort_order);
    const matIndex = sortedMats.findIndex(m => m.id === materialId);
    const mat = sortedMats[matIndex];
    
    // QUIZ LOCK
    if (mat?.material_type === 'quiz' && !activeQuizzes.includes(materialId)) {
        if (!(user.is_admin || user.is_super_admin || user.is_teacher)) {
            return false; // Quiz harus dibuka oleh guru
        }
    }

    // PREMIUM / ADMIN MANUAL LOCK
    if (mat?.is_locked && !(user.is_admin || user.is_super_admin || user.is_teacher || user.is_premium)) {
        return false; // Materi Premium / Terkunci
    }

    return true; // Semua materi & latihan bebas diakses
  };

  useEffect(() => {
    let active = true;
    let currentProgress = 0;

    // Start simulated loading progress from 0% to 90%
    const progressInterval = setInterval(() => {
      if (currentProgress < 90) {
        currentProgress += Math.floor(Math.random() * 8) + 4; // increment by 4 to 12
        if (currentProgress > 90) currentProgress = 90;
        setLoadingProgress(currentProgress);
      }
    }, 60);

    const finishLoading = () => {
      clearInterval(progressInterval);
      const finishInterval = setInterval(() => {
        if (currentProgress < 100) {
          currentProgress += 5;
          if (currentProgress > 100) currentProgress = 100;
          setLoadingProgress(currentProgress);
        } else {
          clearInterval(finishInterval);
          setLoading(false);
        }
      }, 15);
    };

    async function loadInitial(attempt = 0) {
      if (!active) return;
      setErrorMsg(null);

      try {
        const apiMap = await fetchStudyMap(user).catch((err) => {
          console.error("[LMS] Study map API failed:", err);
          return null;
        });

        if (apiMap) {
          const activeCats = apiMap.categories.filter((cat: any) => cat.is_active !== false);
          const allMaterials = apiMap.materials || [];
          const groupedMaterials = allMaterials.reduce<Record<string, StudyMaterial[]>>((acc, mat) => {
            if (!mat.chapter_id) return acc;
            if (!acc[mat.chapter_id]) acc[mat.chapter_id] = [];
            acc[mat.chapter_id].push(mat);
            return acc;
          }, {});

          Object.keys(groupedMaterials).forEach((chapterId) => {
            groupedMaterials[chapterId].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          });

          if (active) {
            setCategories(activeCats);
            setLevels(apiMap.levels || []);
            setCompletedMaterials(apiMap.completedMaterialIds || []);
            setAllChaps(apiMap.chapters || []);
            setGlobalMats(allMaterials);
            setChapterMaterials(groupedMaterials);
            setActiveQuizzes((apiMap.quizAccess || []).filter((item) => item.is_active).map((item) => item.material_id));

            if (activeCats.length > 0) {
              const userCat = activeCats.find((c: any) => c.id === user.category_id);
              
              // Restore state from localStorage if available
              try {
                const savedState = localStorage.getItem('lms_last_view');
                if (savedState) {
                  const parsed = JSON.parse(savedState);
                  setActiveCategory(parsed.activeCategory || (userCat ? userCat.id : activeCats[0].id));
                  
                  if (parsed.activeLevelId) {
                    const level = apiMap.levels.find(l => l.id === parsed.activeLevelId);
                    if (level) setActiveLevel(level);
                  }
                  
                  if (parsed.expandedChapter) {
                    setExpandedChapter(parsed.expandedChapter);
                  }
                  
                  if (parsed.selectedMaterialId) {
                    const material = allMaterials.find(m => m.id === parsed.selectedMaterialId);
                    if (material) setSelectedMaterial(material);
                  }
                  
                  // Clear the state so it only applies once (e.g. after returning from a material)
                  localStorage.removeItem('lms_last_view');
                } else {
                  setActiveCategory(userCat ? userCat.id : activeCats[0].id);
                }
              } catch (e) {
                setActiveCategory(userCat ? userCat.id : activeCats[0].id);
              }
            }
            finishLoading();
          }
          return;
        }

        // Fallback: direct database load
        const [cats, lvls, completed, chaps, mats] = await Promise.all([
          getMaterialCategories(),
          getStudyLevels(),
          user.email ? getCompletedMaterials(user.email) : Promise.resolve([]),
          getAllStudyChapters(),
          getBasicStudyMaterials()
        ]);

        const activeCats = cats.filter((cat: any) => cat.is_active !== false);
        const groupedMaterials = (mats as StudyMaterial[]).reduce<Record<string, StudyMaterial[]>>((acc, mat) => {
          if (!mat.chapter_id) return acc;
          if (!acc[mat.chapter_id]) acc[mat.chapter_id] = [];
          acc[mat.chapter_id].push(mat);
          return acc;
        }, {});

        Object.keys(groupedMaterials).forEach((chapterId) => {
          groupedMaterials[chapterId].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        });

        if (active) {
          setCategories(activeCats);
          setLevels(lvls);
          setCompletedMaterials(completed);
          setAllChaps(chaps);
          setGlobalMats(mats as StudyMaterial[]);
          setChapterMaterials(groupedMaterials);
          
          if (user.id) {
            try {
              let query = supabase.from('quiz_access_controls').select('material_id').eq('is_active', true);
              if (user.batch) {
                 query = query.or(`batch.eq.${user.batch},student_id.eq.${user.id}`);
              } else {
                 query = query.eq('student_id', user.id);
              }
              const { data: accessData, error: qErr } = await query;
              if (qErr) throw qErr;
              if (accessData) {
                  setActiveQuizzes(accessData.map((a: any) => a.material_id));
              }
            } catch (qError) {
              console.error("Error loading quiz access controls:", qError);
            }
          }

          if (activeCats.length > 0) {
            const userCat = activeCats.find((c: any) => c.id === user.category_id);
            
            // Restore state from localStorage if available
            try {
              const savedState = localStorage.getItem('lms_last_view');
              if (savedState) {
                const parsed = JSON.parse(savedState);
                setActiveCategory(parsed.activeCategory || (userCat ? userCat.id : activeCats[0].id));
                
                if (parsed.activeLevelId) {
                  const level = lvls.find((l: any) => l.id === parsed.activeLevelId);
                  if (level) setActiveLevel(level);
                }
                
                if (parsed.expandedChapter) {
                  setExpandedChapter(parsed.expandedChapter);
                }
                
                if (parsed.selectedMaterialId) {
                  const material = (mats as StudyMaterial[]).find((m: any) => m.id === parsed.selectedMaterialId);
                  if (material) setSelectedMaterial(material as StudyMaterial);
                }
                
                // Clear the state
                localStorage.removeItem('lms_last_view');
              } else {
                setActiveCategory(userCat ? userCat.id : activeCats[0].id);
              }
            } catch (e) {
              setActiveCategory(userCat ? userCat.id : activeCats[0].id);
            }
          }
          finishLoading();
        }
      } catch (err: any) {
        console.error(`[LMS] loadInitial attempt ${attempt} failed:`, err);
        
        // Log details to Super Admin monitoring
        reportClientError({
          source: "lms",
          error_type: "lms_material_load_failed",
          message: err?.message || "Failed to load initial learning data",
          stack_trace: err?.stack || null,
          severity: "high",
          page: "/learning",
          user_id: user.id || null,
          user_name: user.full_name,
          user_email: user.email,
          metadata: {
            attempt,
            student_batch: user.batch
          }
        });

        if (attempt < 3) {
          console.log(`[LMS] Auto-retrying loadInitial due to error, attempt ${attempt + 1}...`);
          setTimeout(() => {
            loadInitial(attempt + 1);
          }, 2000);
        } else {
          if (active) {
            clearInterval(progressInterval);
            setErrorMsg(getFriendlyErrorMessage());
            setLoading(false);
          }
        }
      }
    }

    loadInitial(0);
    return () => {
      active = false;
      clearInterval(progressInterval);
    };
  }, [user.email, user.id, user.batch, user.category_id]);

  useEffect(() => {
    if (activeCategory) {
       setActiveLevel(null);
       setExpandedChapter(null);
       setSelectedMaterial(null);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (activeLevel) {
      const snapshotChaps = allChaps
        .filter((chap) => chap.level_id === activeLevel.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      if (snapshotChaps.length > 0 && globalMats.length > 0) {
        const matsMap: Record<string, StudyMaterial[]> = {};
        const allMats: StudyMaterial[] = [];
        snapshotChaps.forEach((chap) => {
          const mats = (globalMats as StudyMaterial[])
            .filter((mat) => mat.chapter_id === chap.id)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          matsMap[chap.id] = mats;
          allMats.push(...mats);
        });

        setAllLevelMaterials(allMats);
        setChapterMaterials((prev) => ({ ...prev, ...matsMap }));
        setChapters(snapshotChaps);
        return;
      }

      getStudyChapters(activeLevel.id).then(async (chaps) => {
        const sortedChaps = [...chaps].sort((a, b) => a.sort_order - b.sort_order);
        
        // Fetch ALL materials for the entire level in parallel to minimize round-trip times
        try {
          const matsPromises = sortedChaps.map(chap => 
            getStudyMaterials(chap.id).catch((err) => {
              console.error(`[LMS] Failed to load materials for chapter ${chap.id}:`, err);
              return [];
            })
          );
          const allMatsResults = await Promise.all(matsPromises);
          
          const allMats: StudyMaterial[] = [];
          const matsMap: Record<string, StudyMaterial[]> = {};
          
          sortedChaps.forEach((chap, idx) => {
            const sortedMats = [...allMatsResults[idx]].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            allMats.push(...sortedMats);
            matsMap[chap.id] = sortedMats;
          });
          
          setAllLevelMaterials(allMats);
          setChapterMaterials(matsMap);
          setChapters(sortedChaps);
        } catch (matsErr) {
          console.error("[LMS] Failed to load materials in parallel:", matsErr);
          throw matsErr;
        }
      }).catch((err) => {
        console.error("[LMS] Failed to load active level chapters:", err);
        reportClientError({
          source: "lms",
          error_type: "lms_level_materials_failed",
          message: err instanceof Error ? err.message : "Failed to load level chapters/materials",
          stack_trace: err instanceof Error ? err.stack || null : null,
          severity: "high",
          page: "/learning",
          user_id: user.id || null,
          user_name: user.full_name,
          user_email: user.email,
          metadata: { level_id: activeLevel.id, level_title: activeLevel.title },
        });
        setErrorMsg("Mohon muat ulang halaman.");
      });
    } else {
      setChapters([]);
      setAllLevelMaterials([]);
      setChapterMaterials({});
    }
  }, [activeLevel, allChaps, globalMats]);

  const toggleChapter = async ( chapterId: string) => {
    if (!isChapterUnlocked(chapterId)) {
        return; // Prevent opening locked chapters
    }

    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
      if (!chapterMaterials[chapterId]) {
        const mats = await getStudyMaterials(chapterId);
        setChapterMaterials(prev => ({ ...prev, [chapterId]: mats }));
      }
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedMaterial || !user.email || completing) return;
    
    // Guard: skip XP if already completed
    if (isMaterialCompleted(selectedMaterial.id)) {
      setSelectedMaterial(null);
      return;
    }
    
    setCompleting(true);
    try {
        await markMaterialCompleted(user.email, selectedMaterial.id);
        
        // Dynamic XP Reward based on 1000 XP/Chapter rule
        const chapterMats = allLevelMaterials.filter(m => m.chapter_id === selectedMaterial.chapter_id);
        const materialsOnly = chapterMats.filter(m => m.material_type !== 'quiz');
        const quizzesOnly = chapterMats.filter(m => m.material_type === 'quiz');

        const isQuiz = selectedMaterial.material_type === 'quiz';
        const distribution = calculateChapterXPDistribution(materialsOnly.length, quizzesOnly.length);

        let awardedXP = 0;
        if (isQuiz) {
            const idx = quizzesOnly.findIndex(m => m.id === selectedMaterial.id);
            awardedXP = (distribution.quizzes && distribution.quizzes[idx]) || 0;
        } else {
            const idx = materialsOnly.findIndex(m => m.id === selectedMaterial.id);
            awardedXP = (distribution.materials && distribution.materials[idx]) || 0;
        }

        const newExp = (user.exp || 0) + awardedXP;
        const newLevel = Math.floor(newExp / 1000) + 1;

        await upsertProfile({ 
            email: user.email, 
            exp: newExp, 
            level: newLevel 
        });

        // Update local state
        setCompletedMaterials(prev => [...prev, selectedMaterial.id]);
        if (onRefreshUser) onRefreshUser();
        
        alert(`Selamat! Materi selesai. Anda mendapatkan +${awardedXP} EXP! 🏆`);
        // setSelectedMaterial(null); // REMOVED: let the user see the success state and close it themselves
    } catch (err: any) {
        console.error("Error saving progress:", err);
        reportClientError({
          source: "lms",
          error_type: "lms_progress_save_failed",
          message: err?.message || "Failed to save learning progress",
          stack_trace: err?.stack || null,
          severity: "high",
          page: "/learning",
          user_id: user.id || null,
          user_name: user.full_name,
          user_email: user.email,
          metadata: { material_id: selectedMaterial.id, material_title: selectedMaterial.title },
        });
        alert("Terjadi kendala, silakan coba beberapa saat lagi.");
    } finally {
        setCompleting(false);
    }
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-wider mb-2">Gagal Memuat Materi</h3>
        <p className="text-xs text-slate-400 font-medium mb-6 max-w-md">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
          Coba Lagi
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-[600px] flex flex-col items-center justify-center p-10 bg-white/40 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-white/80">
        <div className="relative h-24 w-24 mb-6 flex items-center justify-center">
           <svg className="h-full w-full -rotate-90">
             <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(20,184,166,0.1)" strokeWidth="4" />
             <motion.circle 
               cx="48" cy="48" r="42" fill="none" stroke="#14b8a6" strokeWidth="4"
               strokeDasharray={264}
               initial={{ strokeDashoffset: 264 }}
               animate={{ strokeDashoffset: 264 - (264 * loadingProgress) / 100 }}
               transition={{ duration: 0.1 }}
             />
           </svg>
           <div className="absolute inset-0 flex items-center justify-center text-teal-600 font-black italic text-sm">
              {loadingProgress}%
           </div>
        </div>
        <div className="text-center font-black text-teal-600/40 uppercase tracking-[0.5em] text-sm">Initializing Learning Maps...</div>
    </div>
  );

  const fixUrl = (url?: string | null): string | undefined => typeof url === 'string' ? url.replace(/^undefined\//, "https://storage.sagaracloud.web.id/").replace("https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev", "https://storage.sagaracloud.web.id") : undefined;

  return (
    <div className="space-y-4 sm:space-y-10">
      {/* Breadcrumbs / Back Navigation */}
      {(activeLevel || selectedMaterial) && (
        <button 
          onClick={() => {
            if (selectedMaterial) setSelectedMaterial(null);
            else setActiveLevel(null);
          }}
          className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white/60 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-400 hover:text-teal-600 border border-white/80 transition-all uppercase tracking-widest flex items-center gap-2 group shadow-sm"
        >
           <span className="group-hover:-translate-x-1 transition-transform">←</span> 
           {selectedMaterial ? 'Kembali ke Chapter' : 'Kembali ke Level'}
        </button>
      )}

      <div className="flex flex-col md:flex-row gap-4 sm:gap-10">
        {/* Left Toggle: Categories (Only show if not viewing material) */}
        {!selectedMaterial && (
          <aside className="w-full md:w-80 space-y-3 sm:space-y-6">
             <div className="px-2 sm:px-4">
               <h3 className="text-lg sm:text-xl font-black text-slate-800 italic uppercase tracking-wider">Materi Utama</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pilih kategori studi Anda</p>
             </div>
             
             {/* Mobile: horizontal scroll, Desktop: vertical list */}
             <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide snap-x snap-mandatory">
               {filteredCategories.map((cat, idx) => (
                 <button 
                   key={cat.id}
                   onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveLevel(null);
                   }}
                   className={`flex-shrink-0 snap-start flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5 rounded-[2rem] font-black transition-all duration-500 group md:w-full ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 md:translate-x-2' : 'bg-white/60 backdrop-blur-md text-slate-400 hover:text-slate-800 border border-white/80'}`}
                 >
                   <div className="flex items-center gap-3">
                      <span className={`text-xs ${activeCategory === cat.id ? 'text-teal-400' : 'text-slate-200'}`}>{idx + 1}.</span>
                      <span className="text-sm tracking-wide whitespace-nowrap">{cat.name}</span>
                   </div>
                   <span className={`ml-3 transition-transform duration-500 ${activeCategory === cat.id ? 'rotate-90 translate-x-1' : 'group-hover:translate-x-1'}`}>›</span>
                 </button>
               ))}
             </div>
          </aside>
        )}

        {/* Right Content Area */}
        <div className="flex-1 space-y-8">
           {selectedMaterial ? (
              /* VIEW 4: MATERIAL CONTENT */
              <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 md:p-10 shadow-xl border border-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                     <Star size={200} className="text-teal-500 rotate-12" />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-5 sm:mb-8 relative z-10">
                      <span className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {(() => {
                          const content = (typeof selectedMaterial.content === 'string' 
                              ? JSON.parse(selectedMaterial.content) 
                              : selectedMaterial.content) || {};
                          if (content.custom_type_name) return content.custom_type_name;
                          
                          // Category-level custom type name mapping
                          const cat = categories.find(c => c.id === activeCategory);
                          const catCustomNames = cat?.custom_type_names || {};
                          if (catCustomNames[selectedMaterial.material_type]) {
                            return catCustomNames[selectedMaterial.material_type];
                          }
                          
                          if (selectedMaterial.material_type === 'bunpou') return 'tata bahasa';
                          if (selectedMaterial.material_type === 'dokkai') return 'reading';
                          if (selectedMaterial.material_type === 'choukai') return 'listening';
                          return selectedMaterial.material_type.replace('_', ' ');
                        })()}
                      </span>
                     {isMaterialCompleted(selectedMaterial.id) && (
                        <span className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                           <CheckCircle2 size={12} /> SUDAH SELESAI
                        </span>
                     )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 italic mb-5 sm:mb-8 relative z-10">{selectedMaterial.title}</h2>
                  
                  {/* Media Banners */}
                  {selectedMaterial.video_url && (
                    <div className="mb-5 sm:mb-8 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-black shadow-xl ring-1 ring-black/10 relative z-10">
                      <video controls className="w-full max-h-56 sm:max-h-80" src={fixUrl(selectedMaterial.video_url)} poster={fixUrl(selectedMaterial.image_url) || undefined}>
                        Browser tidak mendukung video.
                      </video>
                    </div>
                  )}
                  {selectedMaterial.image_url && (
                    <div className="mb-5 sm:mb-8 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-md ring-1 ring-black/5 relative z-10">
                      <img src={fixUrl(selectedMaterial.image_url)} alt={selectedMaterial.title} className="w-full max-h-48 sm:max-h-64 object-cover" />
                    </div>
                  )}

                  {(() => {
                      const content = (typeof selectedMaterial.content === 'string' 
                          ? JSON.parse(selectedMaterial.content) 
                          : selectedMaterial.content) || {};
                      return (
                        <>
                          {/* Audio Player */}
                          {((content?.audioUrl || content?.audio_url || selectedMaterial?.audio_url) && selectedMaterial.material_type !== 'choukai') && (
                            <div className="mb-5 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 rounded-2xl shadow-lg text-white flex flex-col gap-3 relative z-10">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 bg-white/20 rounded-full flex items-center justify-center text-xl shadow-inner">🎧</div>
                                <div className="flex-1">
                                  <p className="text-xs font-black uppercase tracking-wider opacity-85">Audio Pendukung</p>
                                  <p className="text-xs sm:text-sm font-bold mt-0.5">Silakan dengarkan audio pendukung materi di bawah ini.</p>
                                </div>
                              </div>
                              <audio 
                                controls 
                                controlsList="nodownload"
                                className="w-full outline-none rounded-full" 
                                src={fixUrl(content?.audioUrl || content?.audio_url || selectedMaterial?.audio_url)}
                              >
                                Browser Anda tidak mendukung elemen audio.
                              </audio>
                            </div>
                          )}

                          {/* PDF Document Viewer */}
                          {(() => {
                            let parsedContent = content || {};
                            if (typeof parsedContent === 'string') {
                              try { parsedContent = JSON.parse(parsedContent); } catch(e) {}
                            }
                            const activePdfUrl = parsedContent.pdf_url || parsedContent.document_url || parsedContent.sections?.[0]?.media?.pdf_url || parsedContent.sections?.[0]?.media?.pdfUrl || parsedContent.sections?.[0]?.media?.pdf;
                            if (!activePdfUrl) return null;
                            return (
                            <div className="mb-5 sm:mb-8 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white border border-slate-100 shadow-lg p-4 sm:p-6 relative z-10">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">📕</span>
                                  <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-800">{content.pdf_name || "Dokumen PDF"}</h3>
                                    <p className="text-xs font-bold text-slate-400">Silakan pelajari materi PDF di bawah ini.</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setShowPdf(!showPdf)}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl text-xs font-black transition-all text-center"
                                  >
                                    {showPdf ? "Tutup PDF" : "Buka PDF"}
                                  </button>
                                  <a 
                                    href={fixUrl(activePdfUrl)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-black transition-all text-center"
                                  >
                                    Tab Baru ↗
                                  </a>
                                </div>
                              </div>
                              {showPdf && (
                                <iframe 
                                  src={`${fixUrl(activePdfUrl)}#toolbar=0`} 
                                  className="w-full h-[360px] sm:h-[500px] rounded-2xl border border-slate-100 shadow-inner mt-4 animate-in fade-in duration-500"
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
                            <div className="mb-5 sm:mb-8 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-white border border-slate-100 shadow-lg p-4 sm:p-6 relative z-10">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">📊</span>
                                  <div>
                                    <h3 className="text-base sm:text-lg font-black text-slate-800">{content.ppt_name || "Slide PPT / Presentasi"}</h3>
                                    <p className="text-xs font-bold text-slate-400">Silakan pelajari slide presentasi PPT di bawah ini.</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setShowPpt(!showPpt)}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-xs font-black transition-all text-center"
                                  >
                                    {showPpt ? "Tutup PPT" : "Buka PPT"}
                                  </button>
                                  <a 
                                    href={fixUrl(activePptUrl)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 rounded-xl text-xs font-black transition-all text-center"
                                  >
                                    Download PPT ↗
                                  </a>
                                </div>
                              </div>
                              {showPpt && (
                                <iframe 
                                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fixUrl(activePptUrl)!)}`} 
                                  className="w-full h-[360px] sm:h-[500px] rounded-2xl border border-slate-100 shadow-inner mt-4 animate-in fade-in duration-500"
                                  title="PPT Viewer"
                                />
                              )}
                            </div>
                            );
                          })()}
                        </>
                      );
                  })()}
                  {/* Dynamic Content Renderer */}
                  <div className="w-full relative z-10">
                        {(() => {
                          const content = (typeof selectedMaterial.content === 'string' 
                              ? JSON.parse(selectedMaterial.content) 
                              : selectedMaterial.content) || {};
                          const mType = selectedMaterial.material_type;
                          
                          // 1. MOJI & GOI
                          if (mType === 'moji_goi') {
                             return (
                               <div className="grid gap-4 md:grid-cols-2">
                                  {content?.items?.map((item: any, idx: number) => (
                                     <div key={idx} className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow group">
                                        <div>
                                          <h3 className="text-3xl font-black text-slate-800 mb-1">{item.jp}</h3>
                                          <p className="text-sm font-bold text-teal-600 uppercase tracking-widest">{item.id}</p>
                                          {item.example && <p className="text-xs text-slate-500 font-medium mt-2">Contoh: {item.example}</p>}
                                        </div>
                                     </div>
                                  ))}
                               </div>
                             );
                          }

                          // 2. BUNPOU
                          if (mType === 'bunpou') {
                             return (
                               <div className="space-y-6">
                                  {content?.items?.map((item: any, idx: number) => (
                                     <div key={idx} className="bg-indigo-50 border border-indigo-100/50 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
                                        <div className="relative z-10">
                                          <div className="inline-block bg-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.3)] text-white px-5 py-3 rounded-2xl text-xl font-black tracking-widest mb-6">
                                            {item.pattern}
                                          </div>
                                          <p className="text-slate-600 font-medium mb-8 leading-relaxed text-lg max-w-2xl whitespace-pre-wrap">{item.explanation}</p>
                                          
                                          <div className="space-y-4 bg-white/80 p-8 rounded-[2rem] shadow-sm border border-white">
                                             {item.examples?.map((ex: any, i: number) => (
                                                <div key={i} className="flex flex-col border-b border-indigo-50 pb-4 last:border-0 last:pb-0">
                                                   <span className="text-slate-800 font-black text-xl mb-1">{ex.jp}</span>
                                                   <span className="text-slate-500 text-sm font-medium">{ex.id}</span>
                                                </div>
                                             ))}
                                          </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                             );
                          }

                          // 3. DOKKAI
                          if (mType === 'dokkai') {
                             return (
                               <div className="space-y-10">
                                  <div className="bg-slate-50 p-10 md:p-14 rounded-[3rem] border border-slate-100 shadow-inner">
                                     <p className="text-2xl md:text-3xl font-medium leading-loose text-slate-800 mb-8">{content.text_jp}</p>
                                     <div className="h-px w-16 bg-slate-200 mb-8" />
                                     <p className="text-base font-medium text-slate-500 italic border-l-4 border-slate-200 pl-6 leading-relaxed">{content.text_id}</p>
                                  </div>
                               </div>
                             );
                          }

                          // 4. CHOUKAI
                          if (mType === 'choukai') {
                             return (
                               <div className="space-y-10">
                                  <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-400 p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(20,184,166,0.3)] text-center relative overflow-hidden">
                                     <div className="relative z-10">
                                       <div className="h-24 w-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner ring-4 ring-white/10">🎧</div>
                                       <h3 className="text-white font-black text-3xl italic tracking-tight mb-8">Dengarkan Audio Berikut</h3>
                                       {(content?.audioUrl || content?.audio_url || selectedMaterial?.audio_url) ? (
                                          <audio controls className="w-full" src={fixUrl(content?.audioUrl || content?.audio_url || selectedMaterial?.audio_url)}></audio>
                                       ) : (
                                          <div className="bg-black/20 text-white rounded-2xl px-6 py-3 inline-block font-bold text-sm tracking-widest uppercase">Audio tidak tersedia</div>
                                       )}
                                     </div>
                                  </div>
                               </div>
                             );
                          }
                          
                          return null;
                        })()}

                        {/* Completion Action */}
                        <div className="mt-8 sm:mt-16 pt-6 sm:pt-10 border-t border-slate-100 flex flex-col items-center">
                            {!isMaterialCompleted(selectedMaterial.id) ? (
                                <a 
                                    href={`/study/material/${selectedMaterial.id}`}
                                    onClick={() => {
                                      localStorage.setItem('lms_last_view', JSON.stringify({
                                        activeCategory,
                                        activeLevelId: activeLevel?.id,
                                        expandedChapter,
                                        selectedMaterialId: selectedMaterial.id
                                      }));
                                    }}
                                    className="group relative w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-slate-900 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black italic text-xs sm:text-sm uppercase tracking-widest shadow-2xl hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {selectedMaterial.material_type === 'quiz' ? 'MENUJU KE KUIS INI' : 'MENUJU KE MATERI INI'}
                                    <Trophy size={18} className="group-hover:rotate-12 transition-transform" />
                                </a>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-emerald-600 font-black italic uppercase tracking-widest text-xs">
                                    <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">🎉</div>
                                    Materi Berhasil Diselesaikan!
                                </div>
                            )}
                            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center px-4">
                               {!isMaterialCompleted(selectedMaterial.id) ? 'Kunjungi halaman materi untuk menyelesaikan dan membuka chapter selanjutnya' : 'Selesaikan materi untuk membuka Chapter selanjutnya'}
                            </p>
                        </div>
                      </div>
                </div>
              </div>
           ) : activeLevel ? (
             /* VIEW 3: CHAPTERS & MATERIALS */
             <div className="animate-in slide-in-from-right-8 duration-700 space-y-4 sm:space-y-8">
                <div className="p-6 sm:p-10 md:p-12 rounded-[2rem] sm:rounded-[3rem] md:rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-indigo-900 text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-[2000ms]">
                     <div className="h-64 w-64 border-[30px] border-white rounded-[4rem]" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">Study Path: Open Access</span>
                        <div className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                      </div>
                      <h4 className="text-3xl sm:text-4xl md:text-5xl font-black italic mb-3 sm:mb-4 leading-tight">{activeLevel.title}</h4>
                      <p className="text-white/60 font-medium max-w-xl text-xs sm:text-sm leading-relaxed">Semua materi dan latihan dapat diakses secara bebas tanpa harus berurutan. Akses ujian (Quiz) akan dibuka secara manual oleh pengajar Anda.</p>
                   </div>
                </div>

                <div className="space-y-4">
                   {chapters.map((chapter) => {
                     const unlocked = isChapterUnlocked(chapter.id);
                     const completed = isChapterCompleted(chapter.id);
                     
                     return (
                      <div key={chapter.id} className={`bg-white/60 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden transition-all duration-500 ${!unlocked ? 'opacity-60 saturate-50' : ''}`}>
                         <button 
                            onClick={() => {
                               if (!unlocked) {
                                  setLockedMessage("Selesaikan bab sebelumnya terlebih dahulu untuk membuka materi ini!");
                               } else {
                                  toggleChapter(chapter.id);
                               }
                            }}
                            className={`w-full p-5 sm:p-8 flex items-center justify-between border-b border-slate-100/50 ${!unlocked ? 'cursor-pointer' : 'cursor-pointer hover:bg-white/50'} transition-colors`}
                          >
                             <div className="flex items-center gap-3 sm:gap-6 text-left flex-1 min-w-0">
                                <div className={`h-12 w-12 sm:h-16 sm:w-16 shrink-0 rounded-[1rem] sm:rounded-[1.2rem] flex items-center justify-center p-3 sm:p-3.5 shadow-sm ring-1 ring-slate-100 ${!unlocked ? 'bg-slate-200' : completed ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' : 'bg-indigo-50'}`}>
                                   {!unlocked ? <Lock size={20} className="text-slate-400" /> : completed ? <CheckCircle2 size={20} /> : chapter.icon_url ? <img src={chapter.icon_url} className="w-full h-full object-contain" alt="icon"/> : '📖'}
                                </div>
                                <div className="min-w-0">
                                  <h5 className={`text-base sm:text-xl font-black italic uppercase tracking-tight truncate ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                                     {chapter.title}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1">
                                     <span className={`text-[10px] font-bold uppercase tracking-widest ${completed ? 'text-emerald-500' : unlocked ? 'text-indigo-400' : 'text-slate-400'}`}>
                                        {completed ? 'Chapter Selesai' : unlocked ? 'Sedang Dipelajari' : 'Masih Terkunci'}
                                     </span>
                                  </div>
                                </div>
                             </div>
                             {!unlocked && (
                                 <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center text-slate-300 shrink-0">🔒</div>
                             )}
                             {unlocked && (
                                 <div className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center text-slate-400 transition-transform duration-300 shrink-0 ${expandedChapter === chapter.id ? 'rotate-180' : ''}`}>▼</div>
                             )}
                          </button>

                         {expandedChapter === chapter.id && (
                           <div className="px-3 sm:px-8 pt-4 sm:pt-6 pb-4 sm:pb-8 space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                              {chapterMaterials[chapter.id]?.map((mat) => {
                                const matDone = isMaterialCompleted(mat.id);
                                const matUnlocked = isMaterialUnlocked(chapter.id, mat.id);
                                const isFetching = fetchingMaterialId === mat.id;
                                return (
                                  <button 
                                    key={mat.id}
                                    disabled={!matUnlocked || fetchingMaterialId !== null}
                                    onClick={async () => {
                                      if (!matUnlocked || fetchingMaterialId !== null) return;
                                      if (mat.id && (!mat.content || Object.keys(mat.content as any).length === 0)) {
                                        setFetchingMaterialId(mat.id);
                                        try {
                                          const { data, error } = await supabase
                                            .from("study_materials")
                                            .select("content")
                                            .eq("id", mat.id)
                                            .single();
                                          if (error) throw error;
                                          mat.content = data?.content || {};
                                        } catch (err) {
                                          console.error("Gagal memuat detail materi:", err);
                                          alert("Gagal memuat detail materi. Silakan coba lagi.");
                                          setFetchingMaterialId(null);
                                          return;
                                        }
                                        setFetchingMaterialId(null);
                                      }
                                      setSelectedMaterial(mat);
                                    }}
                                    className={`w-full p-4 sm:p-6 bg-white/40 hover:bg-white hover:shadow-xl rounded-2xl sm:rounded-3xl flex items-center justify-between group transition-all border ${matDone ? 'border-emerald-100' : 'border-transparent hover:border-white/80'} ${!matUnlocked ? 'opacity-40 cursor-not-allowed grayscale' : ''} ${isFetching ? 'cursor-wait bg-white shadow-md' : ''}`}
                                  >
                                    <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform overflow-hidden relative ${!matUnlocked ? 'bg-slate-200' : matDone ? 'bg-emerald-50 text-emerald-600' : 'bg-white border border-slate-50'}`}>
                                          {!matUnlocked ? (
                                            <Lock size={16} className="text-slate-400" />
                                          ) : matDone ? (
                                            <CheckCircle2 size={18} />
                                          ) : mat.video_url ? (
                                            <div className="w-full h-full flex items-center justify-center relative bg-slate-950 text-white text-[10px]">
                                              {mat.image_url ? (
                                                <img src={mat.image_url} alt="video" className="w-full h-full object-cover opacity-60" />
                                              ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-500 opacity-80" />
                                              )}
                                              <span className="relative z-10">▶</span>
                                            </div>
                                          ) : mat.image_url ? (
                                            <img src={mat.image_url} alt="image" className="w-full h-full object-cover" />
                                          ) : mat.icon_url ? (
                                            <img src={mat.icon_url} alt="icon" className="w-full h-full object-contain p-2" />
                                          ) : mat.material_type === 'quiz' ? (
                                            '🎯'
                                          ) : mat.material_type === 'choukai' ? (
                                            '🎧'
                                          ) : (
                                            '📄'
                                          )}
                                       </div>
                                       <span className={`text-xs sm:text-sm font-black transition-colors uppercase tracking-tight truncate ${!matUnlocked ? 'text-slate-400' : matDone ? 'text-emerald-600' : 'text-slate-600 group-hover:text-slate-900'}`}>{mat.title}</span>
                                    </div>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${isFetching ? 'bg-indigo-50 text-indigo-600' : !matUnlocked ? 'bg-slate-100 text-slate-300' : matDone ? 'bg-emerald-500 text-white' : 'bg-slate-50 group-hover:bg-indigo-500 group-hover:text-white'}`}>
                                       {isFetching ? (
                                         <div className="h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                       ) : (
                                         <span className="text-xs">{!matUnlocked ? '🔒' : matDone ? '✓' : '→'}</span>
                                       )}
                                    </div>
                                  </button>
                                );
                              })}
                              {!chapterMaterials[chapter.id] && <div className="p-10 text-center text-xs text-slate-300 italic font-black uppercase tracking-[0.3em]">Loading Materials...</div>}
                           </div>
                         )}
                      </div>
                     );
                   })}
                </div>
             </div>
           ) : activeCategory ? (
             /* VIEW 2: LEVEL SELECTION GRID */
             <div className="animate-in fade-in zoom-in-95 duration-700 space-y-5 sm:space-y-10">
                <div className="px-2 sm:px-4">
                   <h3 className="text-2xl sm:text-3xl font-black italic text-slate-800 uppercase tracking-tight">Pilih Target Level</h3>
                   <p className="text-xs sm:text-sm text-slate-400 font-medium italic mt-1">Hanya level yang sudah terbuka yang dapat Anda pelajari.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                   {levels.filter(l => l.category_id === activeCategory).map((level) => {
                     const unlocked = isLevelUnlocked(level.id);
                     return (
                        <div key={level.id} className="relative">
                          <button 
                            onClick={() => {
                               if (unlocked) {
                                  setActiveLevel(level);
                               } else {
                                  const sameCatLevels = levels.filter(l => l.category_id === activeCategory).sort((a, b) => a.sort_order - b.sort_order);
                                  const idx = sameCatLevels.findIndex(l => l.id === level.id);
                                  if (idx > 0) {
                                      const prevLvl = sameCatLevels[idx - 1];
                                      setLockedMessage(`Kamu belum menyelesaikan level ${prevLvl.title} terlebih dahulu!`);
                                  } else {
                                      setLockedMessage("Level ini masih terkunci.");
                                  }
                               }
                            }}
                            className={`w-full group p-6 sm:p-10 rounded-[2rem] sm:rounded-[3.5rem] border transition-all duration-700 text-left relative overflow-hidden ${unlocked ? 'bg-white border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:translate-y-[-10px]' : 'bg-slate-900/5 border-transparent grayscale opacity-50 cursor-pointer hover:opacity-70'}`}
                          >
                             <div className={`absolute -top-12 -right-12 h-40 w-40 rounded-full transition-all duration-1000 ${unlocked ? 'bg-slate-50 group-hover:bg-teal-50' : 'bg-slate-200/20'}`} />
                             <div className="relative z-10">
                                 <div className={`h-14 w-14 sm:h-20 sm:w-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-xl sm:text-2xl font-black italic mb-6 sm:mb-10 transition-all duration-700 shadow-xl ${unlocked ? 'bg-slate-900 text-white group-hover:scale-110 group-hover:rotate-6 group-hover:bg-teal-600' : 'bg-slate-300 text-slate-100'}`}>
                                   {level.level_code.toUpperCase()}
                                </div>
                                
                                <div className="flex items-end justify-between gap-4">
                                   <div>
                                       <h4 className={`text-xl sm:text-2xl font-black italic mb-2 tracking-tight transition-colors ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{level.title}</h4>
                                      <div className="flex items-center gap-2">
                                         <div className={`h-1.5 w-1.5 rounded-full ${unlocked ? 'bg-teal-500 animate-pulse' : 'bg-slate-400'}`} />
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                           {unlocked ? 'Ready to Learn' : 'Locked Access'}
                                         </p>
                                      </div>
                                   </div>
                                   {!unlocked && <div className="p-4 bg-slate-900/5 rounded-2xl"><span className="text-2xl">🔒</span></div>}
                                </div>
                             </div>
                          </button>
                        </div>
                     );
                   })}
                </div>
             </div>
           ) : (
             /* VIEW 1: PLACEHOLDER */
             <div className="h-[600px] flex items-center justify-center bg-white/40 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-white/80 animate-in zoom-in-95 duration-1000">
                <div className="text-center space-y-6">
                   <div className="text-8xl animate-bounce">🏺</div>
                   <div className="space-y-2">
                      <p className="text-slate-400 font-black uppercase tracking-[0.5em] text-xs">Path Finder</p>
                      <h4 className="text-2xl font-black text-slate-300 italic">Silakan pilih kategori materi <br/> di sidebar untuk memulai.</h4>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {lockedMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" onClick={() => setLockedMessage(null)} />
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-inner ring-4 ring-rose-50/50">🔒</div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">Akses Terkunci</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{lockedMessage}</p>
                <button onClick={() => setLockedMessage(null)} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-slate-900/20">Mengerti</button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
