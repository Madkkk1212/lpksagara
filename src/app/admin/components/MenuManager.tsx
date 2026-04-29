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
