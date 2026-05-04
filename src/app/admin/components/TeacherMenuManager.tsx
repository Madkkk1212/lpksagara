"use client";

import { useState, useEffect } from "react";
import { getAdminMenuConfig, updateAdminMenuConfig } from "@/lib/db";
import { AdminMenuConfig } from "@/lib/types";
import { Settings, Save, CheckCircle, AlertCircle } from "lucide-react";

interface TeacherMenuManagerProps {
  onConfigChange?: () => void;
}

export default function TeacherMenuManager({ onConfigChange }: TeacherMenuManagerProps) {
  const [configs, setConfigs] = useState<AdminMenuConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const data = await getAdminMenuConfig();
      // Only show teacher scope
      setConfigs(data.filter(c => c.scope === 'teacher'));
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleToggle = async (tabId: string, currentState: boolean) => {
    setSaving(tabId);
    try {
      await updateAdminMenuConfig({ tab_id: tabId, is_active: !currentState, scope: 'teacher' });
      setConfigs(prev => prev.map(c => c.tab_id === tabId ? { ...c, is_active: !currentState } : c));
      if (onConfigChange) onConfigChange();
    } catch (err: any) {
      alert("Gagal memperbarui status: " + (err.message || "Error tidak diketahui"));
    } finally {
      setSaving(null);
    }
  };

  const handleRename = async (tabId: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    setSaving(tabId);
    try {
      await updateAdminMenuConfig({ tab_id: tabId, label: newLabel, scope: 'teacher' });
      setConfigs(prev => prev.map(c => c.tab_id === tabId ? { ...c, label: newLabel } : c));
      if (onConfigChange) onConfigChange();
    } catch (err: any) {
      alert("Gagal mengubah nama: " + (err.message || "Error tidak diketahui"));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat Konfigurasi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Manajemen Menu Guru</h2>
          <p className="text-sm text-slate-500 font-medium">Atur navigasi yang muncul pada dashboard pengajar (Teacher Hub).</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 flex items-center gap-2">
           <Settings size={14} /> Admin Access Granted
        </div>
      </div>

      <div className="grid gap-4">
        {configs.length === 0 ? (
          <div className="p-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
             <AlertCircle className="mx-auto h-10 w-10 text-slate-300 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Belum ada konfigurasi menu guru.</p>
          </div>
        ) : (
          configs.map((menu) => (
            <div 
              key={menu.id} 
              className={`p-6 bg-white border-2 rounded-[2rem] transition-all duration-500 flex flex-col md:flex-row md:items-center gap-8 ${menu.is_active ? 'border-slate-100 shadow-sm' : 'border-slate-50 bg-slate-50/30 opacity-60'}`}
            >
              <div className="flex items-center gap-6 flex-1">
                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all duration-500 ${menu.is_active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {menu.icon || '📌'}
                 </div>
                 <div className="flex-1">
                    <span className="text-[10px] font-black text-indigo-400 block mb-2 tracking-widest uppercase">ID: {menu.tab_id}</span>
                    <div className="relative group">
                      <input 
                        type="text" 
                        defaultValue={menu.label}
                        onBlur={(e) => {
                          if (e.target.value !== menu.label) {
                            handleRename(menu.tab_id, e.target.value);
                          }
                        }}
                        className="w-full bg-transparent border-none p-0 text-lg font-black text-slate-800 focus:ring-0 focus:outline-none placeholder-slate-300"
                        placeholder="Label Menu..."
                      />
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Save size={14} className="text-slate-300" />
                      </div>
                    </div>
                 </div>
              </div>

              <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${menu.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {menu.is_active ? 'Menu Aktif' : 'Nonaktif'}
                      </p>
                      <p className="text-[8px] text-slate-400 font-medium">Status Visibilitas</p>
                    </div>
                    <button 
                      onClick={() => handleToggle(menu.tab_id, menu.is_active)}
                      disabled={saving === menu.tab_id}
                      className={`relative w-14 h-8 rounded-full transition-all duration-500 p-1 ${menu.is_active ? 'bg-emerald-500' : 'bg-slate-300'} ${saving === menu.tab_id ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 shadow-lg'}`}
                    >
                      <div className={`h-6 w-6 bg-white rounded-full transition-all duration-500 shadow-md ${menu.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                 </div>
                 
                 {saving === menu.tab_id && (
                   <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden relative">
         <div className="relative z-10">
            <h4 className="text-sm font-black flex items-center gap-3 mb-3 italic">
               <CheckCircle size={18} className="text-emerald-400" /> INFORMASI AKSES
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
               Perubahan yang Anda buat pada menu ini akan langsung diterapkan pada dashboard seluruh pengajar. Pastikan label menu mudah dipahami oleh tim pengajar Anda.
            </p>
         </div>
         <div className="absolute -bottom-10 -right-10 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
