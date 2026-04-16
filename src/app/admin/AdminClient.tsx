"use client";

import { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import BannerManager from "./components/BannerManager";
import StudyHierarchyManager from "./components/StudyHierarchyManager";
import ExamManager from "./components/ExamManager";
import ThemeManager from "./components/ThemeManager";
import SettingsPanel from "./components/SettingsPanel";
import UserManager from "./components/UserManager";
import IconManager from "./components/IconManager";
import ProposalManager from "./components/ProposalManager";
import ReportManager from "./components/ReportManager";
import BulkImporter from "./components/BulkImporter";
import AnnouncementManager from "./components/AnnouncementManager";
import MenuManager from "./components/MenuManager";
import { supabase } from "@/lib/supabase";
import { getAdminMenuConfig } from "@/lib/db";
import { Profile } from "@/lib/types";

type AdminTab = "dashboard" | "reports" | "announcements" | "bulk-import" | "theme" | "banners" | "icons" | "materials" | "exams" | "settings" | "users" | "proposals" | "menu-manager";

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [numDynamicTabs, setNumDynamicTabs] = useState<number>(-1); // -1 means not loaded
  const [dynamicTabs, setDynamicTabs] = useState<{ id: AdminTab; label: string; icon: string }[]>([]);

  const fetchMenuConfig = async () => {
    try {
      const config = await getAdminMenuConfig('admin');
      if (config) {
        const mapped = config.map(c => ({
          id: c.tab_id as AdminTab,
          label: c.label,
          icon: c.icon,
          is_active: c.is_active // Pass this along
        }));
        setDynamicTabs(mapped);
        setNumDynamicTabs(config.length);
      }
    } catch (err) {
      console.error("Failed to load menu config", err);
    }
  };

  useEffect(() => {
    fetchMenuConfig();
  }, []);

  useEffect(() => {
    const authStatus = localStorage.getItem("luma-auth");
    const rawProfile = localStorage.getItem("luma-user-profile");

    if (authStatus === "true" && rawProfile) {
      try {
        const profile = JSON.parse(rawProfile) as Profile;
        setUserProfile(profile);
        if (profile.is_admin) {
          // Correctly logged in as admin
          setIsAuthorized(true);
        } else if (profile.is_teacher) {
          // Wrong role - is a teacher, redirect to teacher dashboard
          window.location.href = "/teacher";
          return;
        } else {
          // Regular user trying to access admin, redirect home
          window.location.href = "/";
          return;
        }
      } catch {
        window.location.href = "/";
        return;
      }
    } else {
      // Not logged in at all, redirect home
      window.location.href = "/";
      return;
    }
    setIsCheckingAuth(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("luma-admin-auth");
    localStorage.removeItem("luma-auth");
    localStorage.removeItem("luma-user-profile");
    window.location.href = "/";
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium text-sm">Verifying Access...</div>;
  }

  if (!isAuthorized) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  // Fallback to hardcoded list ONLY if database is empty or hasn't loaded
  // Fallback to hardcoded list ONLY if database is empty or hasn't loaded
  const rawBaseTabs = numDynamicTabs > 0 ? dynamicTabs : [
    { id: "dashboard", label: "Dashboard", icon: "📊", is_active: true },
    { id: "reports", label: "Laporan", icon: "📈", is_active: true },
    { id: "announcements", label: "Pengumuman", icon: "📢", is_active: true },
    { id: "bulk-import", label: "Bulk Import", icon: "🚀", is_active: true },
    { id: "icons", label: "Icons Gallery", icon: "✨", is_active: true },
    { id: "theme", label: "Theme", icon: "🎨", is_active: true },
    { id: "banners", label: "Banners", icon: "🖼️", is_active: true },
    { id: "materials", label: "Materials", icon: "📚", is_active: true },
    { id: "exams", label: "Exams", icon: "🎯", is_active: true },
    { id: "users", label: "Users", icon: "👥", is_active: true },
    { id: "proposals", label: "Usulan Guru", icon: "📝", is_active: true },
    { id: "settings", label: "Settings", icon: "⚙️", is_active: true },
  ];

  // Filter out inactive tabs ONLY if NOT a super admin
  const baseTabs = userProfile?.is_super_admin 
    ? rawBaseTabs 
    : rawBaseTabs.filter(t => (t as any).is_active !== false);

  const tabs = [...baseTabs];
  
  // Add Menu Manager if Super Admin
  if (userProfile?.is_super_admin) {
    tabs.push({ id: "menu-manager", label: "Menu Manager", icon: "🔧" });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 text-sm">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
              LM
            </div>
            <div>
               <span className="font-bold text-sm text-slate-900 block leading-none">Admin Core</span>
               <span className="text-[10px] text-slate-500 font-medium">Workspace v1.0</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900 p-2">✕</button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="text-xs font-semibold text-slate-400 mb-4 px-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            Modules
          </p>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <span className={`w-6 text-center ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 bg-slate-50/50 border-t border-slate-200">
           <div className="flex items-center gap-3 mb-4 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                 SA
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-slate-900 truncate">
                   {userProfile?.is_super_admin ? "Super Admin" : "Sagara Staff"}
                 </p>
                 <p className="text-[10px] text-slate-500 truncate">{userProfile?.email}</p>
              </div>
           </div>
          <button onClick={logout} className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-rose-600 rounded-xl transition-all text-xs font-bold shadow-sm">
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen relative overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 px-6 lg:px-10 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 border border-slate-200 bg-white rounded-lg lg:hidden text-slate-600 hover:text-slate-900 transition active:scale-95 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2zm0 4h14a1 1 0 110 2H3a1 1 0 110-2z" clipRule="evenodd" /></svg>
            </button>
            <div className="hidden md:flex items-center text-xs font-medium text-slate-500">
               <span className="text-slate-400">Workspace</span> 
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-1 text-slate-300" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
               <span className="text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-bold text-emerald-700">Connected</span>
             </div>
            <button onClick={() => window.open('/', '_blank')} className="hidden md:block px-4 py-2 border border-slate-200 bg-white rounded-xl text-slate-700 hover:bg-slate-50 transition-all text-xs font-bold shadow-sm">
              View Site
            </button>
            <button onClick={logout} className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-bold shadow-sm">
              Log out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar block">
           <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                 {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-slate-500 mt-1 block">Manage and configure your application content.</p>
           </div>

           <section className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-sm relative text-slate-800">
               { activeTab === "dashboard" && <AdminDashboard /> }
               { activeTab === "reports" && <ReportManager /> }
               { activeTab === "announcements" && <AnnouncementManager /> }
               { activeTab === "bulk-import" && <BulkImporter /> }
               { activeTab === "icons" && <IconManager /> }
               { activeTab === "theme" && <ThemeManager /> }
               { activeTab === "banners" && <BannerManager /> }
               { activeTab === "materials" && <StudyHierarchyManager /> }
               { activeTab === "exams" && <ExamManager /> }
               { activeTab === "users" && <UserManager /> }
               {activeTab === "settings" && <SettingsPanel />}
               {activeTab === "proposals" && <ProposalManager />}
               {activeTab === "menu-manager" && <MenuManager onConfigChange={fetchMenuConfig} />}
           </section>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
