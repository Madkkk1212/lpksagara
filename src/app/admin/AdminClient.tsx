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

  // Ensure 'teachers' is always present


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
