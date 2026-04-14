"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StudyLevel, StudyChapter, StudyMaterial, Profile } from "@/lib/types";
import { getStudyChapters, getCompletedMaterials } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function StudyLevelClient({ levelData }: { levelData: StudyLevel }) {
  const router = useRouter();
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [materialsByChapter, setMaterialsByChapter] = useState<Record<string, StudyMaterial[]>>({});
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("luma-user-profile");
    const saved = savedProfile ? JSON.parse(savedProfile) : null;
    if (saved) {
      setUserProfile(saved);
    }

    const fetchHierarchy = async () => {
      const chaps = await getStudyChapters(levelData.id);
      setChapters(chaps);
      
      let completed: string[] = [];
      if (saved?.email) {
        completed = await getCompletedMaterials(saved.email);
        setCompletedMaterials(completed);
      }

      if (chaps.length > 0) {
        const isPremium = saved?.is_premium;
        const firstAllowedId = chaps.find(c => !c.is_locked || isPremium)?.id || chaps[0].id;
        setExpandedChapter(firstAllowedId);
        
        const chapterIds = chaps.map(c => c.id);
        const { data: mats } = await supabase
          .from('study_materials')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('sort_order', { ascending: true });
        
        if (mats) {
          const grouped: Record<string, StudyMaterial[]> = {};
          mats.forEach(m => {
            if (!grouped[m.chapter_id]) grouped[m.chapter_id] = [];
            grouped[m.chapter_id].push(m);
          });
          setMaterialsByChapter(grouped);
        }
      }
      setLoading(false);
    };
    
    fetchHierarchy();
  }, [levelData.id]);

  const toggleChapter = (chap: StudyChapter) => {
    if (chap.is_locked && !userProfile?.is_premium) {
      alert("Bab ini terkunci! Silakan hubungi admin untuk akses Premium.");
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
      default: return '📄';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Loading chapters...</div>;
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
          const isLockedForUser = chap.is_locked && !userProfile?.is_premium;
          
          return (
            <div key={chap.id} className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => toggleChapter(chap)}
                className={`w-full flex items-center justify-between p-6 text-left transition ${isLockedForUser ? 'hover:bg-rose-50/50' : 'hover:bg-slate-50/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden ${isLockedForUser ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>
                    {isLockedForUser ? '🔒' : (chap.icon_url ? <img src={chap.icon_url || undefined} alt="chap" className="w-full h-full object-cover" /> : (idx + 1))}
                  </div>
                  <div>
                    <h3 className={`text-lg font-black ${isLockedForUser ? 'text-slate-400' : 'text-slate-800'}`}>{chap.title}</h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{mats.length} Materi {isLockedForUser && ' (Premium)'}</p>
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
                      const isComplete = completedMaterials.includes(mat.id);
                      const isMatLocked = mat.is_locked && !userProfile?.is_premium;
                      const isQuiz = mat.material_type === 'quiz';
                      // If quiz, verify all other non-quiz mats in this chapter are complete.
                      const otherMats = mats.filter(m => m.material_type !== 'quiz');
                      const othersCompleted = otherMats.every(m => completedMaterials.includes(m.id));
                      const isQuizLocked = isQuiz && !othersCompleted;

                      const disableClick = isMatLocked || isQuizLocked;

                      return (
                        <Link 
                          key={mat.id}
                          href={disableClick ? '#' : `/study/material/${mat.id}`}
                          onClick={(e) => {
                            if (disableClick) {
                              e.preventDefault();
                              if (isMatLocked) alert("Materi Premium! Silakan berlangganan untuk mengakses.");
                              else if (isQuizLocked) alert("Belum Dikuasai! Harap pelajari semua materi di bab ini terlebih dahulu sebelum mengikuti Quiz🎯.");
                            }
                          }}
                          className={`group flex flex-col items-center justify-center p-6 bg-slate-50 rounded-[1.5rem] active:scale-95 transition-all relative overflow-hidden ${disableClick ? 'opacity-60 grayscale border border-slate-200 bg-slate-50/50' : 'hover:bg-white hover:shadow-xl hover:ring-1 ring-teal-500/20 shadow-sm'}`}
                        >
                          {isComplete && <div className="absolute top-3 right-3 flex items-center justify-center p-1 bg-teal-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg">✓</div>}
                          {(isMatLocked || isQuizLocked) && <div className="absolute top-3 left-3 flex items-center justify-center p-1 bg-rose-500 text-white rounded-full text-[10px] w-6 h-6 z-10 shadow-lg" title={isQuizLocked ? "Quiz Terkunci" : "Premium Locked"}>🔒</div>}
                          
                          <div className={`text-3xl mb-3 transition-transform duration-500 ${!disableClick ? 'group-hover:scale-110' : ''}`}>
                            {mat.icon_url ? <img src={mat.icon_url || undefined} alt="icon" className="w-8 h-8 object-contain" /> : getIconForType(mat.material_type)}
                          </div>
                          <span className={`text-xs font-black uppercase tracking-widest text-center ${isQuiz ? 'text-rose-500' : 'text-slate-800'}`}>
                            {mat.material_type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1 line-clamp-1 text-center">{mat.title}</span>
                          
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
