"use client";

import { useState, useEffect } from "react";
import AdminDashboard from "./components/AdminDashboard";
import BannerManager from "./components/BannerManager";
import StudyHierarchyManager from "./components/StudyHierarchyManager";
import ExamManager from "./components/ExamManager";
import ThemeManager from "./components/ThemeManager";
import SettingsPanel from "./components/SettingsPanel";
import UserManager from "./components/UserManager";
import TeacherAssignmentManager from "./components/TeacherAssignmentManager";
import IconManager from "./components/IconManager";
import ProposalManager from "./components/ProposalManager";
import ReportManager from "./components/ReportManager";
import BulkImporter from "./components/BulkImporter";
import AnnouncementManager from "./components/AnnouncementManager";
import WeeklyReportAdmin from "./components/WeeklyReportAdmin";
import MenuManager from "./components/MenuManager";
import ProfileFieldManager from "./components/ProfileFieldManager";
import BatchManager from "./components/BatchManager";
import AssessmentTemplateManager from "./components/AssessmentTemplateManager";
import AllStudentsAssessment from "./components/AllStudentsAssessment";
import MaterialRecap from "./components/MaterialRecap";
import VideoManager from "./components/VideoManager";
import { supabase } from "@/lib/supabase";
import { getAdminMenuConfig, getProfiles, getStudyLevels } from "@/lib/db";
import { Profile, StudyLevel } from "@/lib/types";

type AdminTab = "dashboard" | "reports" | "weekly-reports" | "announcements" | "bulk-import" | "theme" | "banners" | "icons" | "materials" | "exams" | "settings" | "users" | "proposals" | "menu-manager" | "profile-config" | "batches" | "teachers" | "assessment-templates" | "all-students-assessment" | "material-recap" | "video-manager";

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [numDynamicTabs, setNumDynamicTabs] = useState<number>(-1); // -1 means not loaded
  const [dynamicTabs, setDynamicTabs] = useState<{ id: AdminTab; label: string; icon: string }[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

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
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsDataLoading(true);
    try {
      const [allProfiles, allLevels] = await Promise.all([
        getProfiles(),
        getStudyLevels()
      ]);
      setStudents(allProfiles.filter(p => !p.is_admin && !p.is_teacher));
      setStudyLevels(allLevels);
    } catch (err) {
      console.error("Failed to fetch admin dashboard data", err);
    } finally {
      setIsDataLoading(false);
    }
  };

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
    window.location.href = "/?logout=1";
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
  const rawBaseTabs = numDynamicTabs > 0 ? dynamicTabs : [
    { id: "dashboard", label: "Dashboard", icon: "D", is_active: true },
    { id: "reports", label: "Statistik & Analisa", icon: "📊", is_active: true },
    { id: "weekly-reports", label: "Laporan Mingguan", icon: "📋", is_active: true },
    { id: "announcements", label: "Pengumuman", icon: "A", is_active: true },
    { id: "bulk-import", label: "Bulk Import", icon: "I", is_active: true },
    { id: "icons", label: "Icons Gallery", icon: "S", is_active: true },
    { id: "theme", label: "Theme", icon: "T", is_active: true },
    { id: "banners", label: "Banners", icon: "V", is_active: true },
    { id: "materials", label: "Materials", icon: "M", is_active: true },
    { id: "material-recap", label: "Rekapan Materi", icon: "📋", is_active: true },
    { id: "exams", label: "Exams", icon: "E", is_active: true },
    { id: "users", label: "Users", icon: "U", is_active: true },
    { id: "batches", label: "Batches", icon: "B", is_active: true },
    { id: "teachers", label: "Kelola Guru", icon: "G", is_active: true },
    { id: "proposals", label: "Usulan Guru", icon: "P", is_active: true },
    { id: "assessment-templates", label: "Template Penilaian", icon: "📝", is_active: false },
    { id: "settings", label: "Settings", icon: "⚙️", is_active: true },
  ];

  // Filter out inactive tabs ONLY if NOT a super admin
  const baseTabs = userProfile?.is_super_admin 
    ? [...rawBaseTabs] 
    : rawBaseTabs.filter(t => (t as any).is_active !== false);

  // Profile Config is always manually added if Super Admin and not already present
  if (userProfile?.is_super_admin && !baseTabs.some(t => t.id === "profile-config")) {
    const usersIdx = baseTabs.findIndex(t => t.id === "users");
    const insertIdx = usersIdx !== -1 ? usersIdx + 1 : baseTabs.length;
    baseTabs.splice(insertIdx, 0, { id: "profile-config", label: "Profile Config", icon: "⚙️", is_active: true } as any);
  }

  // Final safety check: ensure all tab IDs are unique to prevent React key errors
  const uniqueTabs = Array.from(new Map([...baseTabs].map(t => [t.id, t])).values());

  // Add Menu Manager if Super Admin and not already present
  if (userProfile?.is_super_admin && !uniqueTabs.some(t => t.id === "menu-manager")) {
    uniqueTabs.push({ id: "menu-manager", label: "Menu Manager", icon: "🔧" });
  }

  // 'assessment-templates' is SUPER ADMIN ONLY — ensure it appears for super admin
  if (userProfile?.is_super_admin && !uniqueTabs.some(t => t.id === "assessment-templates")) {
    const proposalsIdx = uniqueTabs.findIndex(t => t.id === "proposals");
    const insertAt = proposalsIdx !== -1 ? proposalsIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "assessment-templates", label: "Template Penilaian", icon: "📝", is_active: true } as any);
  }

  // 'all-students-assessment' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "all-students-assessment")) {
    const targetIdx = uniqueTabs.findIndex(t => t.id === "assessment-templates");
    const insertAt = targetIdx !== -1 ? targetIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "all-students-assessment", label: "Nilai Seluruh Siswa", icon: "📊", is_active: true } as any);
  }

  // 'weekly-reports' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "weekly-reports")) {
    const reportsIdx = uniqueTabs.findIndex(t => t.id === "reports");
    const insertAt = reportsIdx !== -1 ? reportsIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "weekly-reports", label: "Laporan Mingguan", icon: "📋", is_active: true } as any);
  }

  // 'material-recap' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "material-recap")) {
    const materialsIdx = uniqueTabs.findIndex(t => t.id === "materials");
    const insertAt = materialsIdx !== -1 ? materialsIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "material-recap", label: "Rekapan Materi", icon: "📋", is_active: true } as any);
  }

  // 'video-manager' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "video-manager")) {
    const targetIdx = uniqueTabs.findIndex(t => t.id === "material-recap");
    const insertAt = targetIdx !== -1 ? targetIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "video-manager", label: "Video Manager", icon: "🎞️", is_active: true } as any);
  }

  const tabs = uniqueTabs;

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
                setActiveTab(tab.id as AdminTab);
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
               { activeTab === "weekly-reports" && <WeeklyReportAdmin /> }
               { activeTab === "announcements" && <AnnouncementManager /> }
               { activeTab === "bulk-import" && <BulkImporter /> }
               { activeTab === "icons" && <IconManager /> }
               { activeTab === "theme" && <ThemeManager /> }
               { activeTab === "banners" && <BannerManager /> }
               { activeTab === "materials" && <StudyHierarchyManager /> }
               { activeTab === "exams" && <ExamManager /> }
               { activeTab === "users" && <UserManager user={userProfile!} /> }
               { activeTab === "batches" && <BatchManager user={userProfile!} /> }
               { activeTab === "teachers" && <TeacherAssignmentManager user={userProfile!} /> }
               {activeTab === "settings" && <SettingsPanel />}
               {activeTab === "proposals" && <ProposalManager />}
               {activeTab === "profile-config" && <ProfileFieldManager />}
               {activeTab === "menu-manager" && <MenuManager onConfigChange={fetchMenuConfig} />}
               {activeTab === "assessment-templates" && <AssessmentTemplateManager />}
               {activeTab === "all-students-assessment" && <AllStudentsAssessment students={students} levels={studyLevels} />}
               {activeTab === "material-recap" && <MaterialRecap />}
               {activeTab === "video-manager" && <VideoManager />}
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
