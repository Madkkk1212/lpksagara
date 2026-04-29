"use client";

import { useState, useEffect } from "react";
import { getAdminMenuConfig, updateAdminMenuConfig } from "@/lib/db";
import { AdminMenuConfig } from "@/lib/types";

interface MenuManagerProps {
  onConfigChange?: () => void;
}

export default function MenuManager({ onConfigChange }: MenuManagerProps) {
  const [configs, setConfigs] = useState<AdminMenuConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const data = await getAdminMenuConfig();
      setConfigs(data);
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleToggle = async (tabId: string, currentState: boolean) => {
    const config = configs.find(c => c.tab_id === tabId);
    if (!config) return;

    setSaving(tabId);
    try {
      await updateAdminMenuConfig({ ...config, is_active: !currentState });
      setConfigs(prev => prev.map(c => c.tab_id === tabId ? { ...c, is_active: !currentState } : c));
      if (onConfigChange) onConfigChange();
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || "Unknown error"));
    } finally {
      setSaving(null);
    }
  };

  const handleRename = async (tabId: string, newLabel: string) => {
    if (!newLabel.trim()) return;
    const config = configs.find(c => c.tab_id === tabId);
    if (!config) return;

    setSaving(tabId);
    try {
      await updateAdminMenuConfig({ ...config, label: newLabel });
      setConfigs(prev => prev.map(c => c.tab_id === tabId ? { ...c, label: newLabel } : c));
      if (onConfigChange) onConfigChange();
    } catch (err: any) {
      alert("Failed to rename label: " + (err.message || "Unknown error"));
    } finally {
      setSaving(null);
    }
  };

  const adminMenus = configs.filter(c => c.scope === 'admin' || !c.scope);
  const teacherMenus = configs.filter(c => c.scope === 'teacher');

  const coreTabIds = [
    { id: "dashboard", label: "Dashboard", icon: "🚀" },
    { id: "reports", label: "Statistik", icon: "📊" },
    { id: "weekly-reports", label: "Laporan Mingguan", icon: "📋" },
    { id: "materials", label: "Materials", icon: "📚" },
    { id: "material-recap", label: "Rekapan Materi", icon: "📋" },
    { id: "exams", label: "Exams", icon: "📝" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "teachers", label: "Kelola Guru", icon: "👨‍🏫" },
    { id: "batches", label: "Batches", icon: "📦" },
    { id: "banners", label: "Banners", icon: "🖼️" },
    { id: "theme", label: "Theme", icon: "🎨" },
    { id: "icons", label: "Icons", icon: "✨" },
    { id: "announcements", label: "Pengumuman", icon: "📢" },
    { id: "bulk-import", label: "Bulk Import", icon: "📥" },
    { id: "proposals", label: "Usulan Guru", icon: "💡" },
    { id: "assessment-templates", label: "Template Penilaian", icon: "📝" },
    { id: "all-students-assessment", label: "Nilai Seluruh Siswa", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  const missingCoreTabs = coreTabIds.filter(ct => !configs.some(c => c.tab_id === ct.id));

  const handleCreate = async (tabId: string, label: string, icon: string, scope: 'admin' | 'teacher' = 'admin') => {
    setSaving(tabId);
    try {
      await updateAdminMenuConfig({ 
        tab_id: tabId, 
        label: label, 
        icon: icon, 
        is_active: true,
        scope: scope,
        sort_order: configs.length + 1
      });
      const newData = await getAdminMenuConfig();
      setConfigs(newData);
      if (onConfigChange) onConfigChange();
    } catch (err: any) {
      alert("Failed to create menu: " + (err.message || "Unknown error"));
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12 text-slate-400 font-medium">Loading Menu Configuration...</div>;
  }

  const MenuList = ({ title, items, description }: { title: string, items: AdminMenuConfig[], description: string }) => (
    <div className="mb-12">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4">
        {items.map((menu) => (
          <div 
            key={menu.id} 
            className={`p-5 bg-white border rounded-2xl transition-all flex flex-col md:flex-row md:items-center gap-6 ${menu.is_active ? 'border-slate-200' : 'border-slate-100 bg-slate-50/50 opacity-70'}`}
          >
            <div className="flex items-center gap-4 flex-1">
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl shadow-inner">
                  {menu.icon || '📌'}
               </div>
               <div className="flex-1">
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">ID: {menu.tab_id}</span>
                  <input 
                    type="text" 
                    defaultValue={menu.label}
                    onBlur={(e) => {
                      if (e.target.value !== menu.label) {
                        handleRename(menu.tab_id, e.target.value);
                      }
                    }}
                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 focus:outline-none"
                    placeholder="Menu Label"
                  />
               </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 mr-4">
                  <span className={`text-[10px] font-bold ${menu.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {menu.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <button 
                    onClick={() => handleToggle(menu.tab_id, menu.is_active)}
                    disabled={saving === menu.tab_id}
                    className={`relative w-11 h-6 rounded-full transition-colors ${menu.is_active ? 'bg-indigo-600' : 'bg-slate-300'} ${saving === menu.tab_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${menu.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>
               
               {saving === menu.tab_id && (
                 <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Global Workspace Navigation</h2>
          <p className="text-sm text-slate-500">Configure menus for all staff dashboards.</p>
        </div>
        <div className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-100">
           Super Admin Access Only
        </div>
      </div>

      {missingCoreTabs.length > 0 && (
        <div className="mb-12 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-8">
           <div className="mb-6">
              <h3 className="text-lg font-bold text-indigo-900">Modul Tersedia (Belum Terdaftar)</h3>
              <p className="text-xs text-indigo-600 font-medium">Klik daftar untuk mengaktifkan pengaturan menu pada modul ini.</p>
           </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {missingCoreTabs.map(tab => (
                 <button 
                   key={tab.id}
                   disabled={saving === tab.id}
                   onClick={() => handleCreate(tab.id, tab.label, tab.icon)}
                   className="flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-xl hover:shadow-lg transition-all group"
                 >
                    <div className="flex items-center gap-3">
                       <span className="text-xl group-hover:scale-125 transition-transform">{tab.icon}</span>
                       <span className="text-xs font-bold text-slate-700">{tab.label}</span>
                    </div>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">DAFTARKAN</span>
                 </button>
              ))}
           </div>
        </div>
      )}

      <MenuList 
        title="Admin Workspace" 
        items={adminMenus} 
        description="Navigation items for the core administrative panel."
      />

      <div className="h-px bg-slate-100 my-12" />

      <MenuList 
        title="Teacher Hub (Guru)" 
        items={teacherMenus} 
        description="Navigation items for academic personnel dashboard."
      />

      <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white">
         <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
            <span className="text-amber-400">⚠️</span> SAFETY NOTICE
         </h4>
         <p className="text-xs text-slate-400 leading-relaxed">
            Changes made here are applied immediately to all staff. Disabling a menu item only hides it from the UI; it does not block backend access.
         </p>
      </div>
    </div>
  );
}
