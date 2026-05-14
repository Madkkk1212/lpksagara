"use client";

import { useState, useEffect, useMemo } from "react";
import { getMaterialsWithImages, getStudyLevels } from "@/lib/db";
import { StudyMaterial, StudyLevel } from "@/lib/types";

export default function PhotoManager() {
  const [materials, setMaterials] = useState<Partial<StudyMaterial>[]>([]);
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [imageMats, allLevels] = await Promise.all([
        getMaterialsWithImages(),
        getStudyLevels()
      ]);
      
      setMaterials(imageMats as StudyMaterial[]);
      setLevels(allLevels);
    } catch (err) {
      console.error("Failed to load photo data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = useMemo(() => {
    return materials.filter(photo => {
      const hasPhoto = photo.image_url && photo.image_url.trim() !== "";
      const matchesSearch = (photo.title || "").toLowerCase().includes(searchTerm.toLowerCase());
      return hasPhoto && matchesSearch;
    });
  }, [materials, searchTerm]);

  const formatMB = (bytes?: number | null) => {
    if (!bytes) return "Unknown Size";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Syncing Photo Gallery...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-100/50">
         <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="w-full md:flex-1 relative group">
               <input 
                 type="text" 
                 placeholder="Search photos by title..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-inner"
               />
               <span className="absolute left-5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
            </div>
            <div className="flex items-center gap-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: {filteredPhotos.length} Photos</p>
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

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPhotos.map(photo => {
          const fixUrl = (url?: string | null) => typeof url === 'string' ? url.replace(/^undefined\//, "https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev/") : url;
          const fixedPhotoUrl = fixUrl(photo.image_url);
          const isCloudinary = fixedPhotoUrl?.includes("cloudinary.com");
          const isR2 = fixedPhotoUrl?.includes("r2.dev") || fixedPhotoUrl?.includes("r2.cloudflarestorage.com");
          
          return (
            <div key={photo.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-between">
              {/* Photo Preview */}
              <div 
                onClick={() => setZoomImage(fixedPhotoUrl || null)}
                className="aspect-video bg-slate-100 relative flex items-center justify-center overflow-hidden cursor-pointer"
                title="Klik untuk memperbesar"
              >
                <img src={fixedPhotoUrl!} alt={photo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider backdrop-blur-[2px]">
                  🔍 View Image
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border backdrop-blur-md uppercase tracking-widest ${
                    isCloudinary ? 'bg-indigo-500/20 text-indigo-900 border-indigo-400/30'
                    : isR2 ? 'bg-orange-500/20 text-orange-900 border-orange-400/30 font-bold'
                    : 'bg-slate-500/20 text-slate-900 border-slate-400/30'
                  }`}>
                    {isCloudinary ? '⚡ Cloudinary' : isR2 ? '☁️ R2' : '🔗 External'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-white flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">{photo.title}</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{photo.material_type}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                   <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Size</p>
                      <p className="text-xs font-bold text-slate-700 italic">{formatMB(photo.file_size)}</p>
                   </div>
                   <button 
                     onClick={() => window.open(fixedPhotoUrl!, '_blank')}
                     className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-teal-600 transition-all shadow-lg shadow-slate-200"
                   >
                     Download ↗
                   </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPhotos.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-[3rem] border-dashed">
             <span className="text-5xl mb-4 block opacity-20">🖼️</span>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No photos found matching your search.</p>
          </div>
        )}
      </div>

      {/* Zoom / Lightbox Modal */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in duration-300"
        >
          <div className="relative max-w-5xl max-h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl border border-white/20">
            <img src={zoomImage} alt="Zoomed View" className="w-full h-full object-contain max-h-[85vh]" />
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm backdrop-blur-sm transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
