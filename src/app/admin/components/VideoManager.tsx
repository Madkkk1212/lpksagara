"use client";

import { useState, useEffect, useMemo } from "react";
import { getAllStudyMaterials, getStudyLevels, getStudyChapters } from "@/lib/db";
import { StudyMaterial, StudyLevel, StudyChapter } from "@/lib/types";

export default function VideoManager() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMats, allLevels] = await Promise.all([
        getAllStudyMaterials(),
        getStudyLevels()
      ]);
      
      // Filter only materials with videos
      const videoMats = allMats.filter(m => m.video_url);
      setMaterials(videoMats);
      setLevels(allLevels);

      // Optionally load chapters if needed for filtering
      // For now we filter by level (via chapter -> level mapping)
    } catch (err) {
      console.error("Failed to load video data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = useMemo(() => {
    return materials.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [materials, searchTerm]);

  const formatMB = (bytes?: number | null) => {
    if (!bytes) return "Unknown MB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Video Library...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
         <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="w-full md:flex-1 relative group">
               <input 
                 type="text" 
                 placeholder="Search videos by title..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
               />
               <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
            </div>
            <div className="flex items-center gap-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {filteredVideos.length} Videos</p>
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

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map(video => {
          const isCloudinary = video.video_url?.includes("cloudinary.com");
          const isR2 = video.video_url?.includes("r2.dev") || video.video_url?.includes("r2.cloudflarestorage.com");
          
          return (
            <div key={video.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
              {/* Video Preview / Placeholder */}
              <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                {video.image_url ? (
                  <img src={video.image_url} alt={video.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="text-4xl opacity-20">🎬</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg border backdrop-blur-md uppercase tracking-widest ${
                    isCloudinary ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : isR2 ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }`}>
                    {isCloudinary ? '⚡ Cloudinary' : isR2 ? '☁️ Cloudflare R2' : '🔗 External'}
                  </span>
                </div>
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                   <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/30">
                      <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                   </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h4 className="font-black text-slate-900 text-sm leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{video.title}</h4>
                <div className="flex items-center justify-between mt-4">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Video Size</p>
                      <p className="text-xs font-bold text-slate-700 italic">{formatMB(video.file_size)}</p>
                   </div>
                   <button 
                     onClick={() => window.open(video.video_url!, '_blank')}
                     className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
                   >
                     Preview →
                   </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVideos.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[3rem] border-dashed">
             <span className="text-5xl mb-4 block opacity-20">🎞️</span>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No videos found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
