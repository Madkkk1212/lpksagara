"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getStudyLevels, getStudyChapters, getStudyMaterials, getMaterialCategories } from "@/lib/db";
import { StudyLevel, StudyChapter, StudyMaterial, MaterialCategory } from "@/lib/types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function MaterialRecap() {
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [chapters, setChapters] = useState<Record<string, StudyChapter[]>>({});
  const [materials, setMaterials] = useState<Record<string, StudyMaterial[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"recap" | "inventory">("recap");
  const [calculatingSize, setCalculatingSize] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: allMaterials, error: matErr } = await supabase.from('study_materials').select('*');
      const { data: allChapters, error: chapErr } = await supabase.from('study_chapters').select('*');
      const { data: allLevels, error: lvlErr } = await supabase.from('study_levels').select('*');
      const { data: allCats, error: catErr } = await supabase.from('material_categories').select('*');

      if (matErr || chapErr || lvlErr || catErr) throw new Error("Gagal mengambil data rekap");

      setLevels(allLevels as StudyLevel[]);
      setCategories(allCats as MaterialCategory[]);

      const chapterMap: Record<string, StudyChapter[]> = {};
      const materialMap: Record<string, StudyMaterial[]> = {};

      allLevels.forEach(lvl => {
        chapterMap[lvl.id] = (allChapters as StudyChapter[]).filter(c => c.level_id === lvl.id);
      });

      allChapters.forEach(chap => {
        materialMap[chap.id] = (allMaterials as StudyMaterial[]).filter(m => m.chapter_id === chap.id);
      });

      setChapters(chapterMap);
      setMaterials(materialMap);
    } catch (err) {
      console.error("Failed to load recap data", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const statsByLevel = levels.map(level => {
      const levelChapters = chapters[level.id] || [];
      const levelMaterials = levelChapters.flatMap(c => materials[c.id] || []);
      
      return {
        name: level.level_code,
        chapters: levelChapters.length,
        materials: levelMaterials.length,
        videos: levelMaterials.filter(m => m.video_url).length,
        audios: levelMaterials.filter(m => m.audio_url).length,
        quizzes: levelMaterials.filter(m => m.material_type === 'quiz').length,
      };
    });

    const totalMaterials = statsByLevel.reduce((acc, s) => acc + s.materials, 0);
    const totalVideos = statsByLevel.reduce((acc, s) => acc + s.videos, 0);
    const totalAudios = statsByLevel.reduce((acc, s) => acc + s.audios, 0);
    const totalQuizzes = statsByLevel.reduce((acc, s) => acc + s.quizzes, 0);

    return { statsByLevel, totalMaterials, totalVideos, totalAudios, totalQuizzes };
  };

  const { statsByLevel, totalMaterials, totalVideos, totalAudios, totalQuizzes } = calculateStats();

  const pieData = [
    { name: 'Videos', value: totalVideos, color: '#6366f1' },
    { name: 'Audios', value: totalAudios, color: '#10b981' },
    { name: 'Quizzes', value: totalQuizzes, color: '#f59e0b' },
    { name: 'Reading/Vocab', value: totalMaterials - totalVideos - totalAudios - totalQuizzes, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const toggleLevel = (id: string) => {
    setExpandedLevels(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // 10GB = 10 * 1024 * 1024 * 1024 bytes
  const MAX_STORAGE = 10 * 1024 * 1024 * 1024; 
  
  const estimateStorage = () => {
    // Very rough estimate based on average file sizes if real size isn't available
    // In a real app, you'd store file_size in DB or fetch from Cloudinary
    return totalVideos * 25 * 1024 * 1024 + totalAudios * 2 * 1024 * 1024;
  };

  const storageUsage = estimateStorage();
  const percentUsed = (storageUsage / MAX_STORAGE) * 100;

  if (loading) return <div className="p-10 text-center animate-pulse text-slate-500 font-bold uppercase tracking-widest text-xs">Menghitung Data Materi...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Tabs */}
      <div className="flex gap-4 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setView("recap")}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "recap" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
        >
          📊 Ringkasan Analitik
        </button>
        <button 
          onClick={() => setView("inventory")}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === "inventory" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
        >
          📦 Inventaris Konten
        </button>
      </div>

      {view === "recap" ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SummaryCard label="Total Materi" value={totalMaterials} icon="📚" color="bg-indigo-600" />
            <SummaryCard label="Total Video" value={totalVideos} icon="🎬" color="bg-rose-600" />
            <SummaryCard label="Total Audio" value={totalAudios} icon="🔊" color="bg-emerald-600" />
            <SummaryCard label="Total Quiz" value={totalQuizzes} icon="📝" color="bg-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart: Distribution by Level */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-600 rounded-full" />
                Distribusi Materi per Level
              </h3>
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={statsByLevel}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 10}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}} />
                    <Bar dataKey="materials" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart: Content Type Breakdown */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full" />
                Komposisi Media
              </h3>
              <div className="h-72 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Storage Monitor */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Video Storage Usage (Est.)</p>
                   <h3 className="text-3xl font-black text-white italic tracking-tighter">
                     {(storageUsage / (1024 * 1024 * 1024)).toFixed(2)} GB <span className="text-slate-500 text-sm">/ 10 GB</span>
                   </h3>
                   <p className="text-xs text-slate-400 font-medium italic">Estimasi penggunaan penyimpanan Cloudinary berdasarkan jumlah aset video.</p>
                </div>
                <div className="flex-1 max-w-md">
                   <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black text-white uppercase">{percentUsed.toFixed(1)}% Used</span>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Limit: 10GB</span>
                   </div>
                   <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className={`h-full transition-all duration-1000 ${percentUsed > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(100, percentUsed)}%` }}
                      />
                   </div>
                </div>
             </div>
             {/* Decorative background element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -mr-32 -mt-32" />
          </div>
        </>
      ) : (
        /* Inventory View (Detailed Tree) */
        <div className="space-y-4">
           {levels.map(level => (
             <div key={level.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <button 
                  onClick={() => toggleLevel(level.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                        {level.level_code}
                      </div>
                      <div className="text-left">
                         <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{level.name}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">{chapters[level.id]?.length || 0} Chapters</p>
                      </div>
                   </div>
                   <span className="text-slate-300">{expandedLevels.includes(level.id) ? '▲' : '▼'}</span>
                </button>
                
                {expandedLevels.includes(level.id) && (
                  <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                     {chapters[level.id]?.map(chap => (
                        <div key={chap.id} className="border border-slate-50 rounded-2xl overflow-hidden bg-slate-50/50">
                           <button 
                             onClick={() => toggleChapter(chap.id)}
                             className="w-full flex items-center justify-between p-4 hover:bg-slate-100 transition-colors"
                           >
                              <div className="flex items-center gap-3">
                                 <span className="text-xs">📂</span>
                                 <h5 className="text-xs font-bold text-slate-700">{chap.title}</h5>
                                 <span className="text-[9px] px-2 py-0.5 bg-white rounded-full border border-slate-200 text-slate-400 font-black">
                                   {materials[chap.id]?.length || 0} ITEMS
                                 </span>
                              </div>
                              <span className="text-slate-300 text-[10px]">{expandedChapters.includes(chap.id) ? '▲' : '▼'}</span>
                           </button>

                               {expandedChapters.includes(chap.id) && (
                             <div className="p-4 pt-0 space-y-2">
                                {materials[chap.id]?.map(mat => {
                                  const isCloudinary = mat.video_url?.includes("cloudinary.com");
                                  const isR2 = mat.video_url?.includes("r2.dev") || mat.video_url?.includes("r2.cloudflarestorage.com");
                                  const level = levels.find(l => l.id === chap.level_id);
                                  const category = categories.find(c => c.id === level?.category_id);
                                  
                                  return (
                                    <div key={mat.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-indigo-200 transition-all group">
                                       <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                             {mat.material_type === 'quiz' ? '📝' : mat.video_url ? '🎬' : mat.audio_url ? '🔊' : '📄'}
                                          </div>
                                          <div>
                                             <div className="flex items-center gap-2">
                                                <p className="text-xs font-bold text-slate-800">{mat.title}</p>
                                                {category && (
                                                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-widest">
                                                     {category.name}
                                                  </span>
                                                )}
                                             </div>
                                             <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{mat.material_type}</p>
                                                <span className="text-[8px] text-slate-300">•</span>
                                                <p className="text-[9px] font-bold text-slate-400">
                                                   {mat.video_url ? (isCloudinary ? "Cloudinary CDN" : isR2 ? "Cloudflare R2" : "External Link") : "No Video"}
                                                </p>
                                             </div>
                                          </div>
                                       </div>
                                       <div className="flex items-center gap-3">
                                          {mat.video_url && (
                                            <div className="text-right mr-4">
                                               <p className="text-[10px] font-black text-slate-900 leading-none">
                                                  {mat.file_size ? (mat.file_size / (1024 * 1024)).toFixed(1) + " MB" : "Unknown MB"}
                                               </p>
                                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">File Size</p>
                                            </div>
                                          )}
                                          <div className="flex gap-2">
                                             {mat.video_url && (
                                               <span className={`text-[8px] font-black px-2 py-1 rounded-lg border ${isCloudinary ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : isR2 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                  {isCloudinary ? '☁️ CLOUDINARY' : '📦 SUPABASE'}
                                               </span>
                                             )}
                                             {mat.audio_url && <span className="text-[8px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">🔊 AUDIO</span>}
                                          </div>
                                       </div>
                                    </div>
                                  );
                                })}
                             </div>
                           )}
                        </div>
                     ))}
                  </div>
                )}
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string, value: number, icon: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`} />
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{icon}</span>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${color} text-white`}>TOTAL</span>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">{value.toLocaleString()}</h3>
    </div>
  );
}
