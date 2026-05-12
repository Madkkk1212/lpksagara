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
import QuizAccessManager from "../teacher/components/QuizAccessManager";
import ExamAccessManager from "../teacher/components/ExamAccessManager";
import TeacherMenuManager from "./components/TeacherMenuManager";
import { supabase } from "@/lib/supabase";
import { getAdminMenuConfig, getProfiles, getStudyLevels } from "@/lib/db";
import { Profile, StudyLevel } from "@/lib/types";

type AdminTab = "dashboard" | "reports" | "weekly-reports" | "announcements" | "bulk-import" | "theme" | "banners" | "icons" | "materials" | "exams" | "settings" | "users" | "proposals" | "menu-manager" | "profile-config" | "batches" | "teachers" | "assessment-templates" | "all-students-assessment" | "material-recap" | "video-manager" | "quiz-access" | "exam-access" | "teacher-menu";

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
    { id: "quiz-access", label: "Akses Quiz", icon: "⚡", is_active: true },
    { id: "exam-access", label: "Akses Exam", icon: "🏆", is_active: true },
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
  if (userProfile?.is_super_admin && !rawBaseTabs.some(t => t.id === "profile-config")) {
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
  if (userProfile?.is_super_admin && !uniqueTabs.some(t => t.id === "assessment-templates") && !rawBaseTabs.some(t => t.id === "assessment-templates")) {
    const proposalsIdx = uniqueTabs.findIndex(t => t.id === "proposals");
    const insertAt = proposalsIdx !== -1 ? proposalsIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "assessment-templates", label: "Template Penilaian", icon: "📝", is_active: true } as any);
  }

  // 'all-students-assessment' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "all-students-assessment") && !rawBaseTabs.some(t => t.id === "all-students-assessment")) {
    const targetIdx = uniqueTabs.findIndex(t => t.id === "assessment-templates");
    const insertAt = targetIdx !== -1 ? targetIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "all-students-assessment", label: "Nilai Seluruh Siswa", icon: "📊", is_active: true } as any);
  }

  // Ensure Quiz and Exam access appear
  if (!uniqueTabs.some(t => t.id === "quiz-access") && !rawBaseTabs.some(t => t.id === "quiz-access")) {
    const usersIdx = uniqueTabs.findIndex(t => t.id === "users");
    const insertAt = usersIdx !== -1 ? usersIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "quiz-access", label: "Akses Quiz", icon: "⚡", is_active: true } as any);
  }
  if (!uniqueTabs.some(t => t.id === "exam-access") && !rawBaseTabs.some(t => t.id === "exam-access")) {
    const quizIdx = uniqueTabs.findIndex(t => t.id === "quiz-access");
    const insertAt = quizIdx !== -1 ? quizIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "exam-access", label: "Akses Exam", icon: "🏆", is_active: true } as any);
  }

  // 'weekly-reports' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "weekly-reports") && !rawBaseTabs.some(t => t.id === "weekly-reports")) {
    const reportsIdx = uniqueTabs.findIndex(t => t.id === "reports");
    const insertAt = reportsIdx !== -1 ? reportsIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "weekly-reports", label: "Laporan Mingguan", icon: "📋", is_active: true } as any);
  }

  // 'material-recap' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "material-recap") && !rawBaseTabs.some(t => t.id === "material-recap")) {
    const materialsIdx = uniqueTabs.findIndex(t => t.id === "materials");
    const insertAt = materialsIdx !== -1 ? materialsIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "material-recap", label: "Rekapan Materi", icon: "📋", is_active: true } as any);
  }

  // 'video-manager' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "video-manager") && !rawBaseTabs.some(t => t.id === "video-manager")) {
    const targetIdx = uniqueTabs.findIndex(t => t.id === "material-recap");
    const insertAt = targetIdx !== -1 ? targetIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "video-manager", label: "Video Manager", icon: "🎞️", is_active: true } as any);
  }

  // 'teacher-menu' — ensure it appears in the menu
  if (!uniqueTabs.some(t => t.id === "teacher-menu") && !rawBaseTabs.some(t => t.id === "teacher-menu")) {
    const targetIdx = uniqueTabs.findIndex(t => t.id === "batches");
    const insertAt = targetIdx !== -1 ? targetIdx + 1 : uniqueTabs.length;
    uniqueTabs.splice(insertAt, 0, { id: "teacher-menu", label: "Menu Guru", icon: "👨‍🏫", is_active: true } as any);
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
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
          {[
            {
              title: "Utama",
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>,
              items: ["dashboard", "reports", "weekly-reports", "announcements"]
            },
            {
              title: "Konten Belajar",
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.993 7.993 0 002.151 8c.196 1.132.545 2.222 1.036 3.235a1 1 0 01.196.505V15a1 1 0 001 1h2a1 1 0 001-1v-2.31c.214.073.435.132.661.176l.16.03a1 1 0 01.794.794l.03.16c.044.226.103.447.176.661H13v2.31a1 1 0 001 1h2a1 1 0 001-1v-3.26a1 1 0 01.196-.505A7.993 7.993 0 0017.849 8a7.993 7.993 0 00-6.849-3.196V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v.196z" /></svg>,
              items: ["materials", "exams", "video-manager", "material-recap", "bulk-import"]
            },
            {
              title: "Manajemen User",
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z" /></svg>,
              items: ["users", "batches", "teachers", "quiz-access", "exam-access", "proposals", "all-students-assessment", "assessment-templates"]
            },
            {
              title: "Konfigurasi",
              icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
              items: ["theme", "banners", "icons", "menu-manager", "teacher-menu", "profile-config", "settings"]
            }
          ].map((cat) => {
            const catTabs = tabs.filter(t => cat.items.includes(t.id));
            if (catTabs.length === 0) return null;
            
            return (
              <div key={cat.title} className="space-y-1">
                <div className="px-3 mb-2 flex items-center gap-2">
                  <span className="text-slate-300">{cat.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{cat.title}</span>
                </div>
                {catTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as AdminTab);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold transition-all text-xs ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    <span className={`w-5 text-center ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            );
          })}
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
               {activeTab === "quiz-access" && <QuizAccessManager teacher={userProfile!} isSuperAdmin={true} />}
               {activeTab === "exam-access" && <ExamAccessManager teacher={userProfile!} isSuperAdmin={true} />}
               {activeTab === "teacher-menu" && <TeacherMenuManager onConfigChange={fetchMenuConfig} />}
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
