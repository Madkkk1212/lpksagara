"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudyLevel, StudyChapter, StudyMaterial, Profile } from "@/lib/types";
import { getStudyChapters, getCompletedMaterials, getStudyLevels } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function StudyLevelClient({ levelData }: { levelData: StudyLevel }) {
  const router = useRouter();
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [materialsByChapter, setMaterialsByChapter] = useState<Record<string, Partial<StudyMaterial>[]>>({});
  const [activeQuizzes, setActiveQuizzes] = useState<string[]>([]);
  const [accessControls, setAccessControls] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const [expiredQuizzes, setExpiredQuizzes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [categoryCustomTypeNames, setCategoryCustomTypeNames] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("luma-user-profile");
    const saved = savedProfile ? JSON.parse(savedProfile) : null;
    if (saved) {
      setUserProfile(saved);
    }

    const fetchHierarchy = async () => {
      try {
        // Batch 1: Fetch chapters, category info, and all study levels in parallel
        const [chaps, catResult, allLevels] = await Promise.all([
          getStudyChapters(levelData.id).catch(e => { console.error("Error loading chapters:", e); return []; }),
          levelData.category_id
            ? Promise.resolve(
                supabase
                  .from('material_categories')
                  .select('custom_type_names')
                  .eq('id', levelData.category_id)
                  .single()
              ).catch((e: any) => { console.error("Error loading category custom names:", e); return { data: null }; })
            : Promise.resolve({ data: null }),
          getStudyLevels().catch(e => { console.error("Error loading study levels:", e); return []; })
        ]);

        const sameCatLevels = allLevels
          .filter((l: any) => l.category_id === levelData.category_id)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
        const slIdx = sameCatLevels.findIndex((l: any) => l.id === levelData.id);
        const isFirstLevel = slIdx === 0;

        const isPremium = saved?.is_premium;
        const isStaff = saved?.is_admin || saved?.is_super_admin || saved?.is_teacher;
        const hasAccess = isStaff || isFirstLevel || isPremium || (saved?.unlocked_levels || []).includes(levelData.id);

        if (!hasAccess) {
           console.warn(`[Security Alert] User ${saved?.email || 'unauthenticated'} tried to access locked study level: ${levelData.title}`);
           alert("Anda tidak memiliki akses ke level ini!");
           router.push('/?tab=materi');
           return;
        }
        
        setLoadingProgress(30);
        const sortedChaps = [...chaps].sort((a, b) => a.sort_order - b.sort_order);
        setChapters(sortedChaps);

        if ((catResult as any).data?.custom_type_names) {
          setCategoryCustomTypeNames((catResult as any).data.custom_type_names);
        }

        // Batch 2: Fetch completed materials and quiz access in parallel (if user logged in)
        let completed: string[] = [];
        if (saved?.email) {
          const accessQueryBase = saved?.id
            ? (saved.batch
                ? supabase.from('quiz_access_controls').select('material_id, updated_at, is_active').or(`batch.eq.${saved.batch},student_id.eq.${saved.id}`)
                : supabase.from('quiz_access_controls').select('material_id, updated_at, is_active').eq('student_id', saved.id))
            : null;

          const [completedIds, accessData] = await Promise.all([
            getCompletedMaterials(saved.email),
            accessQueryBase ? accessQueryBase : Promise.resolve({ data: null })
          ]);

          completed = completedIds;
          setCompletedMaterials(completedIds);

          const accessRows = (accessData as any).data;
          if (accessRows) {
            setAccessControls(accessRows);
            setActiveQuizzes(accessRows.filter((a: any) => a.is_active).map((a: any) => a.material_id));
          }
        }
        setLoadingProgress(65);

        // Batch 3: Fetch all materials for all chapters in one query
        const chapterIds = sortedChaps.map(c => c.id);
        if (chapterIds.length > 0) {
          const { data: mats } = await supabase
            .from('study_materials')
            .select('id, title, chapter_id, material_type, is_locked, sort_order, icon_url, video_url, image_url, content')
            .in('chapter_id', chapterIds)
            .order('sort_order', { ascending: true });
          
          if (mats) {
            const grouped: Record<string, Partial<StudyMaterial>[]> = {};
            mats.forEach(m => {
              if (m.chapter_id) {
                if (!grouped[m.chapter_id]) grouped[m.chapter_id] = [];
                grouped[m.chapter_id].push(m);
              }
            });
            setMaterialsByChapter(grouped);
          }
        }
        setLoadingProgress(100);


        
        const firstExpanded = sortedChaps.find(c => {
          if (isStaff || isPremium) return true;
          const idx = sortedChaps.findIndex(inner => inner.id === c.id);
          if (idx === 0) return true;
          return false; 
        });
        
        setExpandedChapter(firstExpanded?.id || sortedChaps[0]?.id || null);
      } catch (err: any) {
        console.error("Failed to load study level details:", err);
        setErrorMsg(err?.message || "Gagal memuat materi level.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHierarchy();
  }, [levelData.id]);

  const isChapterCompleted = (chapterId: string) => {
    const mats = materialsByChapter[chapterId] || [];
    if (mats.length === 0) return false;
    return mats.every(m => m.id ? completedMaterials.includes(m.id) : false);
  };

  const isChapterUnlocked = (chapId: string) => {
    const isStaff = userProfile?.is_admin || userProfile?.is_super_admin || userProfile?.is_teacher;
    if (isStaff) return true;
    
    const idx = chapters.findIndex(c => c.id === chapId);
    if (idx <= 0) return true; // first chapter is always unlocked
    
    const prevChap = chapters[idx - 1];
    return isChapterCompleted(prevChap.id);
  };

  const toggleChapter = (chap: StudyChapter) => {
    if (!isChapterUnlocked(chap.id)) {
      alert("Selesaikan bab sebelumnya terlebih dahulu! 🔒");
      return;
    }
    setExpandedChapter(prev => prev === chap.id ? null : chap.id);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'moji_goi': return '🔤';
      case 'bunpou': return '📜';
      case 'dokkai': return '📖';
      case 'choukai': return '🎧';
      case 'quiz': return '🎯';
      case 'latihan': return '📝';
      default: return '📄';
    }
  };

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-black text-slate-800 italic uppercase tracking-wider mb-2">Gagal Memuat Level</h3>
        <p className="text-xs text-slate-400 font-medium mb-6 max-w-md">{errorMsg}</p>
        <button onClick={() => router.push('/?tab=materi')} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg">
          Kembali ke Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative h-20 w-20 mb-4">
          <svg className="h-full w-full -rotate-90">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <motion.circle 
              cx="40" cy="40" r="36" fill="none" stroke="#14b8a6" strokeWidth="4"
              strokeDasharray={226}
              initial={{ strokeDashoffset: 226 }}
              animate={{ strokeDashoffset: 226 - (226 * loadingProgress) / 100 }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-teal-600 font-black italic text-sm">
             {loadingProgress}%
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Loading Materi...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-40" style={{ backgroundColor: '#f8fafc' }}>
      <header className="px-6 pt-12 pb-8 bg-white shadow-sm ring-1 ring-black/[0.03] sticky top-0 z-30 flex gap-6 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.push('/?tab=materi')} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition">
              ←
            </button>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Materi JLPT</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic" style={{ color: levelData.badge_color || '#14b8a6' }}>
            {levelData.title}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2">{levelData.description}</p>
        </div>
        {levelData.icon_url && (
          <img src={levelData.icon_url || undefined} alt="level icon" className="w-16 h-16 object-contain rounded-2xl shadow-sm bg-slate-50 p-2" />
        )}
      </header>

      <div className="max-w-3xl mx-auto px-6 mt-8 space-y-4">
        {chapters.map((chap, idx) => {
          const isExpanded = expandedChapter === chap.id;
          const mats = materialsByChapter[chap.id] || [];
          const isCompleted = isChapterCompleted(chap.id);
          
          // Logic Latihan: Terbuka jika semua materi (bukan quiz/latihan) sudah selesai
          const studyMaterials = mats.filter(m => m.material_type !== 'quiz' && m.material_type !== 'latihan');
          const allStudyCompleted = studyMaterials.length > 0 && studyMaterials.every(m => m.id ? completedMaterials.includes(m.id) : false);
          
          const unlocked = isChapterUnlocked(chap.id);
          
          return (
            <div key={chap.id} className={`bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden transition-all duration-300 ${!unlocked ? 'opacity-60 saturate-50' : ''}`}>
              <button 
                onClick={() => toggleChapter(chap)}
                className={`w-full flex items-center justify-between p-6 text-left transition hover:bg-slate-50/50 ${!unlocked ? 'cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm overflow-hidden shadow-sm ring-1 ring-black/5 ${!unlocked ? 'bg-slate-200 text-slate-400' : isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {!unlocked ? '🔒' : isCompleted ? '✓' : (chap.icon_url ? <img src={chap.icon_url || undefined} alt="chap" className="w-full h-full object-cover" /> : (idx + 1))}
                  </div>
                  <div>
                    <h3 className={`text-lg font-black italic tracking-tight ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{chap.title}</h3>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                         {!unlocked ? 'Masih Terkunci' : isCompleted ? 'Selesai' : `${mats.length} Materi`}
                       </p>
                    </div>
                  </div>
                </div>
                <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  {unlocked ? '▼' : '🔒'}
                </div>
              </button>

              {isExpanded && (
                <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {mats.map(mat => {
                      if (!mat.id) return null;
                      const isComplete = completedMaterials.includes(mat.id!);
                      const isQuiz = mat.material_type === 'quiz';
                      const isLatihan = mat.material_type === 'latihan';
                      
                      // Materi dan Latihan sekarang bebas diakses, tidak dikunci berurutan.
                      // Kuis dikunci KECUALI jika ada di activeQuizzes (dibuka guru).
                      const isLatihanLocked = false; 
                      const isChapLocked = !unlocked;
                      const isStaff = userProfile?.is_admin || userProfile?.is_super_admin || userProfile?.is_teacher;
                      const isExpired = expiredQuizzes.includes(mat.id!);
                      const isQuizLocked = isQuiz && !activeQuizzes.includes(mat.id!) && !isStaff;
                      const disableClick = (isQuizLocked || isLatihanLocked || isChapLocked) && !isStaff;

                      return (
                        <Link 
                          key={mat.id!}
                          href={disableClick ? '#' : `/study/material/${mat.id!}`}
                          onClick={(e) => {
                            if (disableClick) {
                              e.preventDefault();
                              if (isChapLocked) {
                                alert("Selesaikan bab sebelumnya terlebih dahulu! 🔒");
                              } else if (isExpired) {
                                alert("Waktu akses kuis ini telah habis ⏰. Harap hubungi guru Anda jika memerlukan akses tambahan.");
                              } else if (isQuizLocked) {
                                alert("Quiz ini belum dibuka oleh Guru Anda. Harap tunggu sesi ujian dimulai 🎯.");
                              } else if (isLatihanLocked) {
                                alert("Selesaikan semua materi di bab ini terlebih dahulu untuk membuka Latihan! 📖");
                              }
                            }
                          }}
                          className={`group flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[1.5rem] active:scale-95 transition-all relative overflow-hidden ${disableClick ? 'opacity-60 grayscale border border-slate-200 bg-slate-50/50' : 'hover:bg-white hover:shadow-xl hover:ring-1 ring-teal-500/20 shadow-sm'}`}
                        >
                          {isComplete && <div className="absolute top-3 right-3 flex items-center justify-center p-1 bg-teal-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg">✓</div>}
                          {isChapLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-slate-400 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg" title="Selesaikan bab sebelumnya untuk membuka">🔒</div>}
                          {isQuizLocked && !isChapLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-rose-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg" title={isExpired ? "Akses Kuis Ditutup" : "Menunggu Guru Membuka Akses"}>{isExpired ? "⏰" : "🔒"}</div>}
                          {isLatihanLocked && !isChapLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-amber-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg" title="Selesaikan materi untuk membuka">🔒</div>}
                          {isQuiz && !isQuizLocked && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500 text-white px-2 py-1 rounded-full text-[9px] font-black tracking-tight shadow-md animate-pulse z-10">
                              <span>⏳</span>
                              <span>{timeRemaining[mat.id!] || "--:--"}</span>
                            </div>
                          )}
                          {isQuiz && !isQuizLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-emerald-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg animate-pulse" title="Quiz Live!">⚡</div>}
                          {isLatihan && !isLatihanLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-sky-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg" title="Latihan Siap!">📝</div>}
                          
                          {mat.video_url ? (
                            <div className="w-full h-24 mb-3 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center relative shadow-inner">
                              {mat.image_url ? (
                                <img src={mat.image_url} alt={mat.title || ""} className="w-full h-full object-cover opacity-60" />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                              )}
                              <div className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg text-indigo-600 transition-transform duration-300 group-hover:scale-110 relative z-10 font-bold text-xs">
                                ▶
                              </div>
                            </div>
                          ) : mat.image_url ? (
                            <div className="w-full h-24 mb-3 rounded-2xl overflow-hidden shadow-sm relative border border-slate-100">
                              <img src={mat.image_url} alt={mat.title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          ) : (
                            <div className={`text-3xl mb-3 transition-transform duration-500 ${!disableClick ? 'group-hover:scale-110' : ''}`}>
                              {mat.icon_url ? <img src={mat.icon_url || undefined} alt="icon" className="w-8 h-8 object-contain mx-auto" /> : getIconForType(mat.material_type || "")}
                            </div>
                          )}
                          <span className={`text-xs font-black uppercase tracking-widest text-center ${isQuiz ? 'text-rose-500' : isLatihan ? 'text-amber-500' : 'text-slate-800'}`}>
                            {(() => {
                              const c = (typeof mat.content === 'string' ? JSON.parse(mat.content) : mat.content) || {};
                              if (c.custom_type_name) return c.custom_type_name;
                              if (categoryCustomTypeNames[mat.material_type || ""]) {
                                return categoryCustomTypeNames[mat.material_type || ""];
                              }
                              if (mat.material_type === 'bunpou') return 'tata bahasa';
                              if (mat.material_type === 'dokkai') return 'reading';
                              if (mat.material_type === 'choukai') return 'listening';
                              return (mat.material_type || "").replace('_', ' ');
                            })()}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 line-clamp-1 text-center">{mat.title || ''}</span>
                          
                          {/* Progress visual */}
                          {isComplete && <div className="absolute bottom-0 inset-x-0 h-1.5 bg-teal-500" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
