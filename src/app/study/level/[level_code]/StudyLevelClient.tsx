"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudyLevel, StudyChapter, StudyMaterial, Profile } from "@/lib/types";
import { getStudyChapters, getCompletedMaterials } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function StudyLevelClient({ levelData }: { levelData: StudyLevel }) {
  const router = useRouter();
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [materialsByChapter, setMaterialsByChapter] = useState<Record<string, Partial<StudyMaterial>[]>>({});
  const [activeQuizzes, setActiveQuizzes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);

  useEffect(() => {
    const savedProfile = localStorage.getItem("luma-user-profile");
    const saved = savedProfile ? JSON.parse(savedProfile) : null;
    if (saved) {
      setUserProfile(saved);
    }

    const fetchHierarchy = async () => {
      const totalSteps = 4;
      let completedSteps = 0;
      const updateProgress = () => {
        completedSteps++;
        setLoadingProgress(Math.floor((completedSteps / totalSteps) * 100));
      };

      try {
        const chaps = await getStudyChapters(levelData.id);
        updateProgress();
        const sortedChaps = [...chaps].sort((a, b) => a.sort_order - b.sort_order);
        setChapters(sortedChaps);
        
        let completed: string[] = [];
        let quizAccessIds: string[] = [];
        
        if (saved?.email) {
          completed = await getCompletedMaterials(saved.email);
          setCompletedMaterials(completed);
          
          // Ambil data kontrol akses kuis untuk murid ini
          if (saved.id) {
             let query = supabase.from('quiz_access_controls').select('material_id').eq('is_active', true);
             
             if (saved.batch) {
               query = query.or(`batch.eq.${saved.batch},student_id.eq.${saved.id}`);
             } else {
               query = query.eq('student_id', saved.id);
             }
             
             const { data: accessData } = await query;
             if (accessData) {
               quizAccessIds = accessData.map(a => a.material_id);
               setActiveQuizzes(quizAccessIds);
             }
          }
        }
        updateProgress();

        const chapterIds = sortedChaps.map(c => c.id);
        if (chapterIds.length > 0) {
          const { data: mats } = await supabase
            .from('study_materials')
            .select('id, title, chapter_id, material_type, is_locked, sort_order, icon_url')
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
          updateProgress();

          const isPremium = saved?.is_premium;
          const isStaff = saved?.is_admin || saved?.is_super_admin;
          
          const firstExpanded = sortedChaps.find(c => {
            if (isStaff || isPremium) return true;
            const idx = sortedChaps.findIndex(inner => inner.id === c.id);
            if (idx === 0) return true;
            return false; 
          });
          
          setExpandedChapter(firstExpanded?.id || sortedChaps[0].id);
        }
        updateProgress();
      } catch (err) {
        console.error(err);
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

  // Semua chapter sekarang terbuka, tidak ada lock berurutan
  const isChapterUnlocked = (chapId: string) => {
    return true; 
  };

  const toggleChapter = (chap: StudyChapter) => {
    setExpandedChapter(prev => prev === chap.id ? null : chap.id);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'moji_goi': return '🔤';
      case 'bunpou': return '📜';
      case 'dokkai': return '📖';
      case 'choukai': return '🎧';
      case 'quiz': return '🎯';
      default: return '📄';
    }
  };

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
          
          return (
            <div key={chap.id} className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleChapter(chap)}
                className="w-full flex items-center justify-between p-6 text-left transition hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm overflow-hidden shadow-sm ring-1 ring-black/5 ${isCompleted ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {isCompleted ? '✓' : (chap.icon_url ? <img src={chap.icon_url || undefined} alt="chap" className="w-full h-full object-cover" /> : (idx + 1))}
                  </div>
                  <div>
                    <h3 className="text-lg font-black italic tracking-tight text-slate-800">{chap.title}</h3>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{mats.length} Materi</p>
                    </div>
                  </div>
                </div>
                <div className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>

              {isExpanded && (
                <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {mats.map(mat => {
                      if (!mat.id) return null;
                      const isComplete = completedMaterials.includes(mat.id!);
                      const isQuiz = mat.material_type === 'quiz';
                      
                      // Materi biasa tidak dikunci. Kuis dikunci KECUALI jika ada di activeQuizzes.
                      const isQuizLocked = isQuiz && !activeQuizzes.includes(mat.id!);
                      const disableClick = isQuizLocked;

                      return (
                        <Link 
                          key={mat.id!}
                          href={disableClick ? '#' : `/study/material/${mat.id!}`}
                          onClick={(e) => {
                            if (disableClick) {
                              e.preventDefault();
                              alert("Quiz ini belum dibuka oleh Guru Anda. Harap tunggu sesi ujian dimulai 🎯.");
                            }
                          }}
                          className={`group flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[1.5rem] active:scale-95 transition-all relative overflow-hidden ${disableClick ? 'opacity-60 grayscale border border-slate-200 bg-slate-50/50' : 'hover:bg-white hover:shadow-xl hover:ring-1 ring-teal-500/20 shadow-sm'}`}
                        >
                          {isComplete && <div className="absolute top-3 right-3 flex items-center justify-center p-1 bg-teal-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg">✓</div>}
                          {isQuizLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-rose-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg" title="Menunggu Guru Membuka Akses">🔒</div>}
                          {isQuiz && !isQuizLocked && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-emerald-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg animate-pulse" title="Quiz Live!">⚡</div>}
                          
                          <div className={`text-3xl mb-3 transition-transform duration-500 ${!disableClick ? 'group-hover:scale-110' : ''}`}>
                            {mat.icon_url ? <img src={mat.icon_url || undefined} alt="icon" className="w-8 h-8 object-contain" /> : getIconForType(mat.material_type || "")}
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest text-center ${isQuiz ? 'text-rose-500' : 'text-slate-800'}`}>
                            {(mat.material_type || "").replace('_', ' ')}
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
