"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Megaphone, Plus, Trash2, CheckCircle, Clock, Save, X } from "lucide-react";

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"info" | "warning" | "success">("info");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setAnnouncements(data || []);
    setIsLoading(false);
  };

  const addAnnouncement = async () => {
    if (!newTitle || !newContent) return;

    const { error } = await supabase.from("announcements").insert({
      title: newTitle,
      content: newContent,
      type: newType
    });

    if (!error) {
      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
      fetchAnnouncements();
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Hapus pengumuman ini?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) fetchAnnouncements();
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    if (!error) fetchAnnouncements();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 italic">
            <Megaphone className="w-6 h-6 text-amber-400" />
            Announcement Center
          </h3>
          <p className="text-xs text-slate-400 mt-1">Kelola pesan broadcast untuk seluruh siswa Sagara Nihongo.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Buat Baru
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm border-t-8 border-t-indigo-600 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
             <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pengumuman Baru</h4>
             <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-rose-500"><X /></button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Judul</label>
                <input 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Update Server Selesai"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tipe Pesan</label>
                <select 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-all appearance-none"
                >
                   <option value="info">ℹ️ Informasi (Biru)</option>
                   <option value="success">✅ Berita Bagus (Hijau)</option>
                   <option value="warning">⚠️ Perhatian (Kuning)</option>
                </select>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Konten</label>
             <textarea 
               value={newContent}
               onChange={(e) => setNewContent(e.target.value)}
               placeholder="Tulis detail pengumuman di sini..."
               rows={4}
               className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-medium text-sm outline-none focus:border-indigo-500 transition-all"
             />
          </div>

          <div className="flex justify-end gap-3">
             <button 
               onClick={() => setIsAdding(false)}
               className="px-6 py-3 bg-white text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
             >
               Batal
             </button>
             <button 
               onClick={addAnnouncement}
               className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
             >
               <Save className="w-4 h-4" />
               Simpan & Publish
             </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-20 text-center animate-pulse">
           <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto mb-4" />
           <p className="text-slate-400 text-sm font-medium">Memuat pengumuman...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {announcements.length > 0 ? announcements.map((ann) => (
            <div key={ann.id} className={`p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm relative group hover:shadow-xl transition-all duration-500 ${!ann.is_active && 'opacity-60 grayscale'}`}>
               <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    ann.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    ann.type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-indigo-50 text-indigo-600 border border-indigo-100'
                  }`}>
                    {ann.type}
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => toggleActive(ann.id, ann.is_active)}
                       className={`p-2 rounded-lg transition-all ${ann.is_active ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                       title={ann.is_active ? 'Matikan' : 'Aktifkan'}
                     >
                       {ann.is_active ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                     </button>
                     <button 
                       onClick={() => deleteAnnouncement(ann.id)}
                       className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
               </div>
               <h4 className="text-lg font-black text-slate-800 leading-tight mb-2 italic">"{ann.title}"</h4>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">{ann.content}</p>
               <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase">
                  <span>Dibuat pada {new Date(ann.created_at).toLocaleDateString('id-ID')}</span>
                  {ann.is_active ? (
                    <span className="text-emerald-500">🟢 Live</span>
                  ) : (
                    <span className="text-slate-300">⚪ Draft</span>
                  )}
               </div>
            </div>
          )) : (
            <div className="lg:col-span-2 py-32 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400">
               <Megaphone className="w-12 h-12 mb-4 opacity-10" />
               <p className="font-bold text-sm">Belum ada pengumuman</p>
               <p className="text-xs mt-1">Gunakan tombol "Buat Baru" untuk memulai.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
