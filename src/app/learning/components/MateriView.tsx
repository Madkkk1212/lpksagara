"use client";

import { useEffect, useState } from "react";
import { Profile, MaterialCategory, StudyLevel, StudyChapter, StudyMaterial, AppTheme } from "@/lib/types";
import { getMaterialCategories, getStudyLevels, getStudyChapters, getStudyMaterials, upsertProfile } from "@/lib/db";

export default function MateriView({ user, theme, onUpgrade }: { user: Profile, theme: AppTheme | null, onUpgrade?: (msg: string) => void }) {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLevel, setActiveLevel] = useState<StudyLevel | null>(null);
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [chapterMaterials, setChapterMaterials] = useState<Record<string, StudyMaterial[]>>({});
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  const isLevelUnlocked = (lvlId: string) => {
    if (user.is_admin || user.is_premium) return true;
    const sameCatLevels = levels
      .filter(l => l.category_id === activeCategory)
      .sort((a, b) => a.sort_order - b.sort_order);
    
    const unlocked = user.unlocked_levels || [];
    
    // Default: First level is always unlocked
    if (sameCatLevels.length > 0 && lvlId === sameCatLevels[0].id) return true;
    
    return unlocked.includes(lvlId);
  };

  useEffect(() => {
    async function loadInitial() {
      const [cats, lvls] = await Promise.all([
        getMaterialCategories(),
        getStudyLevels()
      ]);
      setCategories(cats);
      setLevels(lvls);
      if (cats.length > 0) setActiveCategory(cats[0].id);
      setLoading(false);
    }
    loadInitial();
  }, []);

  useEffect(() => {
    if (activeCategory) {
       setActiveLevel(null);
       setExpandedChapter(null);
       setSelectedMaterial(null);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (activeLevel) {
      getStudyChapters(activeLevel.id).then(setChapters);
    } else {
      setChapters([]);
    }
  }, [activeLevel]);

  const toggleChapter = async ( chapterId: string) => {
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

  if (loading) return <div className="p-10 text-center font-black text-teal-600/40 animate-pulse uppercase tracking-[0.5em]">Initializing Learning Mats...</div>;

  return (
    <div className="space-y-10">
      {/* Breadcrumbs / Back Navigation */}
      {(activeLevel || selectedMaterial) && (
        <button 
          onClick={() => {
            if (selectedMaterial) setSelectedMaterial(null);
            else setActiveLevel(null);
          }}
          className="px-6 py-3 bg-white/60 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-400 hover:text-teal-600 border border-white/80 transition-all uppercase tracking-widest flex items-center gap-2 group shadow-sm"
        >
           <span className="group-hover:-translate-x-1 transition-transform">←</span> 
           {selectedMaterial ? 'Kembali ke Chapter' : 'Kembali ke Level'}
        </button>
      )}

      <div className="flex flex-col md:flex-row gap-10">
        {/* Left Toggle: Categories (Only show if not viewing material) */}
        {!selectedMaterial && (
          <aside className="w-full md:w-80 space-y-6">
             <div className="px-4">
               <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-wider">Materi Utama</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pilih kategori studi Anda</p>
             </div>
             
             <div className="space-y-3">
               {categories.map((cat, idx) => (
                 <button 
                   key={cat.id}
                   onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveLevel(null);
                   }}
                   className={`w-full flex items-center justify-between px-8 py-5 rounded-[2rem] font-black transition-all duration-500 group ${activeCategory === cat.id ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 translate-x-2' : 'bg-white/60 backdrop-blur-md text-slate-400 hover:text-slate-800 border border-white/80'}`}
                 >
                   <div className="flex items-center gap-4">
                      <span className={`text-xs ${activeCategory === cat.id ? 'text-teal-400' : 'text-slate-200'}`}>{idx + 1}.</span>
                      <span className="text-sm tracking-wide">{cat.name}</span>
                   </div>
                   <span className={`transition-transform duration-500 ${activeCategory === cat.id ? 'rotate-90 translate-x-1' : 'group-hover:translate-x-1'}`}>›</span>
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
                <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-50">
                  <div className="flex items-center gap-4 mb-8">
                     <span className="px-4 py-1.5 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                       {selectedMaterial.material_type.replace('_', ' ')}
                     </span>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 italic mb-8">{selectedMaterial.title}</h2>
                  
                  {/* Content would go here - handled by rich text or special components */}
                  <div className="prose prose-slate max-w-none prose-p:font-medium prose-headings:font-black italic">
                    <div dangerouslySetInnerHTML={{ __html: typeof selectedMaterial.content === 'string' ? selectedMaterial.content : JSON.stringify(selectedMaterial.content) }} />
                  </div>
                </div>
              </div>
           ) : activeLevel ? (
             /* VIEW 3: CHAPTERS & MATERIALS */
             <div className="animate-in slide-in-from-right-8 duration-700 space-y-8">
                <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-indigo-900 text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-[2000ms]">
                     <div className="h-64 w-64 border-[30px] border-white rounded-[4rem]" />
                   </div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">Study Path</span>
                        <div className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
                      </div>
                      <h4 className="text-5xl font-black italic mb-4 leading-tight">{activeLevel.title}</h4>
                      <p className="text-white/60 font-medium max-w-xl text-sm leading-relaxed">{activeLevel.description || 'Kuasai materi bahasa Jepang ini dengan kurikulum terukur dan latihan intensif.'}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   {chapters.map((chapter) => (
                     <div key={chapter.id} className="bg-white/60 backdrop-blur-md rounded-[2.5rem] border border-white/80 shadow-sm overflow-hidden transition-all duration-500">
                        <button 
                          onClick={() => toggleChapter(chapter.id)}
                          className={`w-full p-8 flex items-center justify-between hover:bg-white/80 transition-all ${expandedChapter === chapter.id ? 'bg-white/40' : ''}`}
                        >
                           <div className="flex items-center gap-6 text-left">
                              <div className="h-16 w-16 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center p-3.5 shadow-sm ring-1 ring-slate-100">
                                 {chapter.icon_url ? <img src={chapter.icon_url} className="w-full h-full object-contain" alt="icon"/> : '📖'}
                              </div>
                              <div>
                                <h5 className="text-xl font-black text-slate-800 italic uppercase tracking-tight">{chapter.title}</h5>
                                {chapter.description && <p className="text-xs text-slate-400 font-medium mt-1">{chapter.description}</p>}
                              </div>
                           </div>
                           <div className={`h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center transition-all duration-500 ${expandedChapter === chapter.id ? 'rotate-180 bg-slate-900 text-white' : 'bg-white text-slate-300'}`}>▼</div>
                        </button>

                        {expandedChapter === chapter.id && (
                          <div className="px-8 pb-8 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                             {chapterMaterials[chapter.id]?.map((mat) => (
                               <button 
                                 key={mat.id}
                                 onClick={() => setSelectedMaterial(mat)}
                                 className="w-full p-6 bg-white/40 hover:bg-white hover:shadow-xl rounded-3xl flex items-center justify-between group transition-all border border-transparent hover:border-white/80"
                               >
                                 <div className="flex items-center gap-5">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-50 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                                       {mat.material_type === 'quiz' ? '🎯' : mat.material_type === 'choukai' ? '🎧' : '📄'}
                                    </div>
                                    <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{mat.title}</span>
                                 </div>
                                 <div className="h-8 w-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-teal-500 group-hover:text-white transition-all">
                                    <span className="text-xs">→</span>
                                 </div>
                               </button>
                             ))}
                             {!chapterMaterials[chapter.id] && <div className="p-10 text-center text-xs text-slate-300 italic font-black uppercase tracking-[0.3em]">Loading Materials...</div>}
                          </div>
                        )}
                     </div>
                   ))}
                </div>
             </div>
           ) : activeCategory ? (
             /* VIEW 2: LEVEL SELECTION GRID */
             <div className="animate-in fade-in zoom-in-95 duration-700 space-y-10">
                <div className="px-4">
                   <h3 className="text-3xl font-black italic text-slate-800 uppercase tracking-tight">Pilih Target Level</h3>
                   <p className="text-sm text-slate-400 font-medium italic mt-1">Hanya level yang sudah terbuka yang dapat Anda pelajari.</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                   {levels.filter(l => l.category_id === activeCategory).map((level) => {
                     const unlocked = isLevelUnlocked(level.id);
                     return (
                        <div key={level.id} className="relative">
                          <button 
                            disabled={!unlocked}
                            onClick={() => unlocked && setActiveLevel(level)}
                            className={`w-full group p-10 rounded-[3.5rem] border transition-all duration-700 text-left relative overflow-hidden ${unlocked ? 'bg-white border-white/80 shadow-[0_20px_60px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:translate-y-[-10px]' : 'bg-slate-900/5 border-transparent grayscale opacity-50 cursor-not-allowed'}`}
                          >
                             <div className={`absolute -top-12 -right-12 h-40 w-40 rounded-full transition-all duration-1000 ${unlocked ? 'bg-slate-50 group-hover:bg-teal-50' : 'bg-slate-200/20'}`} />
                             <div className="relative z-10">
                                <div className={`h-20 w-20 rounded-[2rem] flex items-center justify-center text-2xl font-black italic mb-10 transition-all duration-700 shadow-xl ${unlocked ? 'bg-slate-900 text-white group-hover:scale-110 group-hover:rotate-6 group-hover:bg-teal-600' : 'bg-slate-300 text-slate-100'}`}>
                                   {level.level_code.toUpperCase()}
                                </div>
                                
                                <div className="flex items-end justify-between gap-4">
                                   <div>
                                      <h4 className={`text-2xl font-black italic mb-2 tracking-tight transition-colors ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>{level.title}</h4>
                                      <div className="flex items-center gap-2">
                                         <div className={`h-1.5 w-1.5 rounded-full ${unlocked ? 'bg-teal-500 animate-pulse' : 'bg-slate-300'}`} />
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                           {unlocked ? 'Ready to Learn' : 'Premium Access Required'}
                                         </p>
                                      </div>
                                   </div>
                                   {!unlocked && <div className="p-4 bg-slate-900/5 rounded-2xl"><span className="text-2xl">🔒</span></div>}
                                </div>
                             </div>
                          </button>
                          
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-900/5 backdrop-blur-[2px] rounded-[3.5rem] opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none group-hover:pointer-events-auto">
                              <button 
                                onClick={() => onUpgrade?.(`Halo Admin, saya ${user.full_name} ingin membuka akses ke ${level.title} di ${theme?.app_name || 'Reiwa LMS'}`)}
                                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-teal-600 transition-colors pointer-events-auto"
                              >
                                Buka Level Sekarang →
                              </button>
                            </div>
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
    </div>
  );
}
