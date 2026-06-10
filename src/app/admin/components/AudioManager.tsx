"use client";

import { useState, useEffect, useMemo } from "react";
import { getMaterialsWithAudio, getStudyLevels, getStudyChapters } from "@/lib/db";
import { StudyMaterial, StudyLevel, StudyChapter } from "@/lib/types";

export default function AudioManager() {
  const [materials, setMaterials] = useState<Partial<StudyMaterial>[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [audioMats, allLevels] = await Promise.all([
        getMaterialsWithAudio(),
        getStudyLevels()
      ]);
      
      setMaterials(audioMats as StudyMaterial[]);
      setLevels(allLevels);
    } catch (err) {
      console.error("Failed to load audio data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAudios = useMemo(() => {
    return materials.filter(audio => {
      const hasAudio = audio.audio_url && audio.audio_url.trim() !== "";
      const matchesSearch = (audio.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      return hasAudio && matchesSearch;
    });
  }, [materials, searchTerm]);

  const formatMB = (bytes?: number | null) => {
    if (!bytes) return "Unknown MB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Audio Library...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
         <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="w-full md:flex-1 relative group">
               <input 
                 type="text" 
                 placeholder="Search audio by title..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
               />
               <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
            </div>
            <div className="flex items-center gap-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {filteredAudios.length} Audio</p>
               <button 
                 onClick={loadData}
                 className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                 title="Refresh Data"
               >
                 🔄
               </button>
            </div>
         </div>
      </div>

      {/* Audio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAudios.map(audio => {
          const fixUrl = (url?: string | null): string | undefined => typeof url === 'string' ? url.replace(/^undefined\//, "https://storage.sagaracloud.web.id/").replace("https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev", "https://storage.sagaracloud.web.id") : undefined;
          const fixedAudioUrl = fixUrl(audio.audio_url);
          const isCloudinary = fixedAudioUrl?.includes("cloudinary.com");
          const isR2 = fixedAudioUrl?.includes("r2.dev") || fixedAudioUrl?.includes("r2.cloudflarestorage.com");
          
          return (
            <div key={audio.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between">
              {/* Audio Header */}
              <div className="p-6 bg-gradient-to-br from-teal-500 to-emerald-600 text-white relative overflow-hidden flex flex-col justify-between min-h-[140px]">
                <div className="absolute -right-6 -top-6 text-8xl opacity-10 pointer-events-none">🎧</div>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl shadow-inner">
                    🎧
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border backdrop-blur-md uppercase tracking-widest ${
                    isCloudinary ? 'bg-indigo-500/20 text-indigo-100 border-indigo-400/30'
                    : isR2 ? 'bg-white/20 text-white border-white/30 font-bold'
                    : 'bg-slate-500/20 text-slate-100 border-slate-400/30'
                  }`}>
                    {isCloudinary ? '⚡ Cloudinary' : isR2 ? '☁️ Cloudflare R2' : '🔗 External'}
                  </span>
                </div>
                <div className="mt-4">
                  <h4 className="font-black text-white text-base leading-tight line-clamp-2">{audio.title}</h4>
                  <p className="text-[10px] text-teal-100 uppercase tracking-widest font-black mt-1">{audio.material_type}</p>
                </div>
              </div>

              {/* Controls & Action */}
              <div className="p-6 space-y-4 bg-white">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <audio controls className="w-full h-8" src={fixedAudioUrl!} />
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audio Size</p>
                      <p className="text-xs font-bold text-slate-700 italic">{formatMB(audio.file_size)}</p>
                   </div>
                   <button 
                     onClick={() => window.open(fixedAudioUrl!, '_blank')}
                     className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
                   >
                     Buka di Tab Baru ↗
                   </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAudios.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[3rem] border-dashed">
             <span className="text-5xl mb-4 block opacity-20">🎧</span>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No audio files found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
