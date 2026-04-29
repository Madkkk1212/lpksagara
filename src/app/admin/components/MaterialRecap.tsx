"use client";

import { useState, useEffect } from "react";
import { getStudyLevels, getStudyChapters, getStudyMaterials } from "@/lib/db";
import { StudyLevel, StudyChapter, StudyMaterial } from "@/lib/types";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function MaterialRecap() {
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [chapters, setChapters] = useState<Record<string, StudyChapter[]>>({});
  const [materials, setMaterials] = useState<Record<string, StudyMaterial[]>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"recap" | "inventory">("recap");
  const [calculatingSize, setCalculatingSize] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);

  const MAX_STORAGE_GB = 10;
  const stats = {
    levels: levels.length,
    chapters: Object.values(chapters).flat().length,
    materials: Object.values(materials).flat().length,
    videos: Object.values(materials).flat().filter(m => m.video_url?.includes('cloudinary')).length,
    localVideos: Object.values(materials).flat().filter(m => m.video_url && !m.video_url.includes('cloudinary')).length,
    gb: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
    percentUsed: Math.min(((totalSize / (1024 * 1024 * 1024)) / MAX_STORAGE_GB) * 100, 100).toFixed(1),
  };

  const chartData = levels.map(level => {
    const levelChapters = chapters[level.id] || [];
    const levelMaterials = levelChapters.reduce((acc, chap) => acc + (materials[chap.id]?.length || 0), 0);
    return {
      name: level.title,
      total: levelMaterials,
      chapters: levelChapters.length
    };
  });

  const mediaDistribution = [
    { name: 'Video', value: Object.values(materials).flat().filter(m => m.video_url).length, color: '#6366f1' },
    { name: 'Gambar', value: Object.values(materials).flat().filter(m => m.image_url).length, color: '#f59e0b' },
    { name: 'Quiz', value: Object.values(materials).flat().filter(m => m.material_type === 'quiz').length, color: '#ef4444' },
    { name: 'Teks Saja', value: Object.values(materials).flat().filter(m => !m.video_url && !m.image_url && m.material_type !== 'quiz').length, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const storageSource = [
    { name: 'Cloudinary', value: stats.videos, color: '#0ea5e9' },
    { name: 'Supabase', value: stats.localVideos, color: '#ef4444' },
  ].filter(d => d.value > 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const lvls = await getStudyLevels();
        setLevels(lvls);

        const chapterMap: Record<string, StudyChapter[]> = {};
        const materialMap: Record<string, StudyMaterial[]> = {};

        for (const level of lvls) {
          const chaps = await getStudyChapters(level.id);
          chapterMap[level.id] = chaps;
          
          for (const chap of chaps) {
            const mats = await getStudyMaterials(chap.id);
            materialMap[chap.id] = mats;
          }
        }

        setChapters(chapterMap);
        setMaterials(materialMap);
      } catch (err) {
        console.error("Failed to fetch material recap:", err);
      } finally {
        setLoading(true);
        setTimeout(() => setLoading(false), 500); // Visual delay for smooth feel
      }
    };
    fetchData();
  }, []);

  const calculateStorage = async () => {
    setCalculatingSize(true);
    let total = 0;
    const allMaterials = Object.values(materials).flat().filter(m => m.video_url);
    
    // We process in batches to avoid browser rate limiting
    const batchSize = 5;
    for (let i = 0; i < allMaterials.length; i += batchSize) {
      const batch = allMaterials.slice(i, i + batchSize);
      await Promise.all(batch.map(async (mat) => {
        if (!mat.video_url) return;
        try {
          const res = await fetch(mat.video_url, { method: 'HEAD' });
          const size = res.headers.get('content-length');
          if (size) total += parseInt(size);
        } catch (e) {
          console.warn("Could not get size for", mat.video_url);
        }
      }));
    }
    setTotalSize(total);
    setCalculatingSize(false);
  };

  const toggleLevel = (id: string) => {
    setExpandedLevels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="h-10 w-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Menyusun Rekapan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight flex items-center gap-3">
             <span className="p-2 bg-indigo-600 text-white rounded-lg not-italic text-sm">📊</span>
             Rekapan Materi & Media
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pantau seluruh konten video, gambar, dan struktur kurikulum Sagara</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setView("recap")}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'recap' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                Struktur
              </button>
              <button 
                onClick={() => setView("inventory")}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'inventory' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
              >
                Inventory Video
              </button>
           </div>

           <div className="hidden sm:flex gap-2">
              <div className="px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center min-w-[60px]">
                  <span className="text-xs font-black text-indigo-600">{stats.materials}</span>
                  <span className="text-[8px] font-bold text-indigo-400 uppercase">Items</span>
              </div>
              <div className="px-3 py-1.5 bg-sky-50 rounded-xl border border-sky-100 flex flex-col items-center min-w-[60px]">
                  <span className="text-xs font-black text-sky-600">{stats.videos}</span>
                  <span className="text-[8px] font-bold text-sky-400 uppercase">Video</span>
              </div>
           </div>

           <div className="flex flex-col gap-1">
              <button 
                  onClick={calculateStorage}
                  disabled={calculatingSize}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm transition-all flex flex-col items-center min-w-[120px] group relative overflow-hidden"
              >
                  <span className="text-xs font-black relative z-10">
                    {calculatingSize ? "Menghitung..." : `${stats.gb} / ${MAX_STORAGE_GB} GB`}
                  </span>
                  <span className="text-[7px] font-bold uppercase opacity-80 group-hover:opacity-100 leading-none relative z-10">
                    Maksimal Kuota Video
                  </span>
                  {!calculatingSize && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-indigo-400 transition-all duration-1000" 
                      style={{ width: `${stats.percentUsed}%` }}
                    />
                  )}
              </button>
              {totalSize > 0 && (
                <div className="flex justify-between px-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Usage: {stats.percentUsed}%</span>
                  {Number(stats.percentUsed) > 80 && <span className="text-[8px] font-bold text-rose-500 uppercase animate-pulse">Hampir Penuh!</span>}
                </div>
              )}
           </div>
        </div>
      </div>

      {view === "recap" ? (
        <>
      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Materials per Level */}
        <div className="lg:col-span-2 bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Distribusi Materi per Level</h4>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Pie Charts Side */}
        <div className="space-y-6">
           <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Komposisi Media</h4>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mediaDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mediaDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>

           {stats.localVideos > 0 && (
             <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6">
                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Storage Source (Video)</h4>
                <div className="h-[120px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={storageSource}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {storageSource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-center text-rose-500 font-bold mt-2 uppercase">Segera pindahkan {stats.localVideos} video ke Cloudinary!</p>
             </div>
           )}
        </div>
      </div>
      </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-500">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 uppercase italic tracking-tight">Daftar Inventaris Video</h4>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase">
                {stats.videos + stats.localVideos} Total Video Terdeteksi
              </span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50">
                    <tr>
                       <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Level</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Bab</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Materi</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Jenis</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest">Lokasi File</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Aksi</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {levels.map(level => (
                       Object.values(chapters[level.id] || []).map(chap => (
                          (materials[chap.id] || []).filter(m => m.video_url).map(mat => (
                             <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <span className="p-1 bg-white border border-slate-100 rounded text-[10px]">{level.level_code}</span>
                                      <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{level.title}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-[10px] font-medium text-slate-500 truncate max-w-[120px] block">{chap.title}</span>
                                </td>
                                <td className="px-6 py-4">
                                   <p className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{mat.title}</p>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-[8px] font-black px-2 py-1 bg-slate-100 rounded uppercase">{mat.material_type}</span>
                                </td>
                                <td className="px-6 py-4">
                                   {mat.video_url?.includes('cloudinary') ? (
                                      <div className="flex items-center gap-1.5">
                                         <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                         <span className="text-[10px] font-bold text-emerald-600 uppercase">Cloudinary</span>
                                      </div>
                                   ) : (
                                      <div className="flex items-center gap-1.5">
                                         <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                         <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter italic">Local/Supabase</span>
                                      </div>
                                   )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <button 
                                     onClick={() => window.open(mat.video_url!, '_blank')}
                                     className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                     title="Putar Video"
                                   >
                                      ▶️
                                   </button>
                                </td>
                             </tr>
                          ))
                       ))
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {view === "recap" && (
      <div className="space-y-4">
        {levels.map(level => (
          <div key={level.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md">
            <button 
              onClick={() => toggleLevel(level.id)}
              className="w-full flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                   {level.icon_url ? <img src={level.icon_url} className="h-6 w-6 object-contain" alt=""/> : "📖"}
                </div>
                <div className="text-left">
                  <h4 className="font-black text-slate-800 text-sm uppercase italic tracking-tight">{level.title}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{level.level_code} • {chapters[level.id]?.length || 0} Bab</p>
                </div>
              </div>
              <span className={`text-slate-300 transition-transform duration-300 ${expandedLevels.includes(level.id) ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {expandedLevels.includes(level.id) && (
              <div className="p-4 bg-white space-y-3 animate-in slide-in-from-top-2">
                {chapters[level.id]?.map(chap => (
                  <div key={chap.id} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button 
                      onClick={() => toggleChapter(chap.id)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50/30 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black text-slate-400 bg-white border border-slate-100 w-6 h-6 rounded-md flex items-center justify-center">{chap.sort_order}</span>
                         <h5 className="font-bold text-slate-700 text-xs uppercase">{chap.title}</h5>
                         <span className="text-[9px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 uppercase">{materials[chap.id]?.length || 0} Item</span>
                      </div>
                      <span className={`text-slate-300 transition-transform text-[10px] ${expandedChapters.includes(chap.id) ? 'rotate-180' : ''}`}>▼</span>
                    </button>

                    {expandedChapters.includes(chap.id) && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-t border-slate-100">
                          <thead className="bg-slate-50/50">
                            <tr>
                              <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">No</th>
                              <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest">Judul Materi</th>
                              <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Tipe</th>
                              <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Video</th>
                              <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Gambar</th>
                              <th className="px-6 py-3 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center">Isi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {materials[chap.id]?.map((mat, mIdx) => (
                              <tr key={mat.id} className="hover:bg-slate-50/30 transition-colors group">
                                <td className="px-6 py-4 text-xs font-black text-slate-300">{mIdx + 1}</td>
                                <td className="px-6 py-4">
                                   <p className="text-xs font-black text-slate-700 group-hover:text-indigo-600 transition-colors">{mat.title}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase border ${
                                      mat.material_type === 'quiz' ? 'bg-rose-50 text-rose-500 border-rose-100' : 
                                      mat.material_type === 'bunpou' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' :
                                      'bg-slate-50 text-slate-500 border-slate-100'
                                   }`}>
                                      {mat.material_type.replace('_', ' ')}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   {mat.video_url ? (
                                      <span className="text-emerald-500" title={mat.video_url}>✅</span>
                                   ) : (
                                      <span className="text-slate-200">❌</span>
                                   )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                   {mat.image_url ? (
                                      <div className="flex justify-center relative group/img">
                                         <span className="text-emerald-500">✅</span>
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/img:block z-50">
                                            <img src={mat.image_url} className="h-20 w-auto rounded-lg shadow-2xl border-4 border-white bg-white" alt=""/>
                                         </div>
                                      </div>
                                   ) : (
                                      <span className="text-slate-200">❌</span>
                                   )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                   {mat.content ? (
                                      <span className="text-indigo-400 text-[10px] font-bold">
                                         {JSON.stringify(mat.content).length > 2 ? 'JSON DATA' : 'EMPTY'}
                                      </span>
                                   ) : (
                                      <span className="text-slate-200">❌</span>
                                   )}
                                </td>
                              </tr>
                            ))}
                            {(!materials[chap.id] || materials[chap.id].length === 0) && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Belum ada materi di bab ini</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
                {(!chapters[level.id] || chapters[level.id].length === 0) && (
                   <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Tidak ada bab untuk level ini</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
