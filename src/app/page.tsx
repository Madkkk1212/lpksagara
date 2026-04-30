"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getTheme, getBanners, getMaterialCategories, getMaterials, getExamLevels, getProfileByEmail, upsertProfile, getStudyLevels, getCompletedMaterials, getTotalStudyMaterialsCount, getUserLastProgressDetails, getStudyChapters, getStudentWeeklyTargets, getAllStudyMaterials } from "@/lib/db";
import { AppTheme, BannerSlide, MaterialCategory, Material, ExamLevel, Profile, StudyLevel, StudyChapter, WeeklyTarget, StudyMaterial } from "@/lib/types";
import JapanNews from "./components/JapanNews";

// --- ART ICON COMPONENTS ---
const ArtNavIcon = {
  Home: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <path d="M12 2L4 10V22H20V10L12 2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 22V12H15V22" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Study: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <path d="M4 19.5C4 18.1193 5.11929 17 6.5 17H20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 2H20V22H6.5C5.11929 22 4 20.8807 4 19.5V4.5C4 3.11929 5.11929 2 6.5 2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Exam: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 10V17C22 17 19 20 12 20C5 20 2 17 2 17V10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Profile: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <circle cx="12" cy="7" r="4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

type TabId = "dashboard" | "materi" | "soal" | "profile";
const EXAM_PROGRESS_KEY = "luma-exam-progress";

const tabs = [
  { id: "dashboard" as const, label: "Home", icon: ArtNavIcon.Home },
  { id: "materi" as const, label: "Materi", icon: ArtNavIcon.Study },
  { id: "soal" as const, label: "Latih", icon: ArtNavIcon.Exam },
  { id: "profile" as const, label: "Profil", icon: ArtNavIcon.Profile },
];

function isAuthed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("luma-auth") === "true";
}

function getExamProgress() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EXAM_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [examProgress, setExamProgress] = useState<any>({});
  const [selectedStudyCategory, setSelectedStudyCategory] = useState<string | null>(null);
  
  // Supabase Data
  const [theme, setTheme] = useState<AppTheme | null>(null);
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [levels, setLevels] = useState<ExamLevel[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState({ totalMaterials: 0, completed: 0, lastRead: null as any });
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>([]);
  const [publicMaterials, setPublicMaterials] = useState<StudyMaterial[]>([]);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  // Time State
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
       const now = new Date();
       setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    // 🛡️ EMERGENCY FALLBACK: Force dismiss splash after 5 seconds no matter what
    const emergencyTimer = window.setTimeout(() => { setShowSplash(false); setIsFetching(false); }, 5000);

    // Splash timer: fade out the overlay after 800ms
    const isPostLogout = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("logout") === "1" : false;
    const splashTimer = window.setTimeout(() => setShowSplash(false), isPostLogout ? 0 : 800);

    const init = async () => {
      try {
        const [t, b, c, m, l, sl, totalMatsCount] = await Promise.all([
          getTheme().catch(() => null),
          getBanners().catch(() => []),
          getMaterialCategories().catch(() => []),
          getMaterials().catch(() => []),
          getExamLevels().catch(() => []),
          getStudyLevels().catch(() => []),
          getTotalStudyMaterialsCount().catch(() => 0)
        ]);

        setTheme(t);
        setBanners(b || []);
        setCategories(c || []);
        setMaterials(m || []);
        setLevels(l || []);
        setStudyLevels(sl || []);

        const authed = isAuthed();
        setLoggedIn(authed);

        let emailForMetrics = "";

        if (authed) {
          const saved = localStorage.getItem("luma-user-profile");
          if (saved) {
            try {
              const localProfile = JSON.parse(saved);
              emailForMetrics = localProfile.email;
              
              const freshProfile = await getProfileByEmail(localProfile.email);
              if (freshProfile) {
                setUserProfile(freshProfile);
                localStorage.setItem("luma-user-profile", JSON.stringify(freshProfile));

                // 🔒 Students/Alumni who haven't completed onboarding → redirect to /learning
                const needsOnboarding = freshProfile.profile_completed === false;
                const isStudentOrAlumni = freshProfile.is_student || freshProfile.is_alumni;
                if (needsOnboarding && isStudentOrAlumni) {
                  router.push("/learning");
                  return; // Stop further processing
                }

                // Other users with incomplete profile → just show profile tab
                if (freshProfile.profile_completed === false) setActiveTab("profile");
              } else {
                setUserProfile(localProfile);
              }
            } catch (innerErr) {
              console.error("Local profile parse/fetch error:", innerErr);
              // Only nuke auth if the JSON parser itself completely failed (data is unrecoverably corrupt).
              // If it's just a Supabase network error, DO NOT log the user out!
              if (innerErr instanceof SyntaxError) {
                localStorage.removeItem("luma-auth");
                localStorage.removeItem("luma-user-profile");
                setLoggedIn(false);
              } else {
                 // It's a network error from `getProfileByEmail`, so fallback to the cached profile
                 try {
                   const localProfile = JSON.parse(saved);
                   setUserProfile(localProfile);
                 } catch(e) {}
              }
            }
          }
        }

        if (emailForMetrics) {
          const completedMats = await getCompletedMaterials(emailForMetrics);
          const lastReadArr = await getUserLastProgressDetails(emailForMetrics);
          setDashboardMetrics({
            totalMaterials: totalMatsCount,
            completed: completedMats.length,
            lastRead: lastReadArr.length > 0 ? lastReadArr[0] : null
          });
        } else {
          setDashboardMetrics({ totalMaterials: totalMatsCount, completed: 0, lastRead: null });
        }

        // Fetch all materials for displaying weekly target details
        const allMats = await getAllStudyMaterials().catch(() => []);
        setPublicMaterials(allMats);

        // If logged in as student, fetch weekly targets
        if (authed) {
          const saved = localStorage.getItem("luma-user-profile");
          if (saved) {
            try {
              const p = JSON.parse(saved);
              if (!p.is_admin && !p.is_teacher) {
                const wt = await getStudentWeeklyTargets(p.email, p.batch).catch(() => []);
                setWeeklyTargets(wt);
              }
            } catch {}
          }
        }

        setExamProgress(getExamProgress());
        const params = new URLSearchParams(window.location.search);
        const nextTab = params.get("tab") as TabId | null;
        if (nextTab && tabs.some((tab) => tab.id === nextTab)) setActiveTab(nextTab);

      } catch (err) {
        console.error("Landing Page Init Error:", err);
      } finally {
        setIsFetching(false);
      }
    };

    init();
    return () => {
      clearTimeout(splashTimer);
      clearTimeout(emergencyTimer);
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const goProtected = (tab: TabId) => {
    if (loggedIn) {
      setActiveTab(tab);
      return;
    }
    router.push(`/login?redirect=${tab}`);
  };

  const changeTab = (tab: TabId) => {
    if (tab === "profile" && !loggedIn) {
      router.push(`/login?redirect=${tab}`);
      return;
    }
    setActiveTab(tab);
  };

  const handleLevelClick = (levelId: string, levelCode: string, globalLocked: boolean, index: number) => {
    if (!loggedIn || !userProfile) { router.push(`/login?redirect=soal`); return; }
    
    if (index > 0) {
        const prevLevel = levels[index - 1];
        const isPrevUnlocked = userProfile.is_premium || (userProfile.unlocked_levels || []).includes(prevLevel.id);
        if (!isPrevUnlocked) { alert('Selesaikan level sebelumnya terlebih dahulu!'); return; }
    }

    const hasAccess = !globalLocked || userProfile.is_premium || (userProfile.unlocked_levels || []).includes(levelId);
    
    if (!hasAccess) { alert('Level ini premium! Silakan hubungi admin untuk akses.'); return; }
    router.push(`/exam/${levelCode.toLowerCase()}`);
  };



  return (
    <main 
      className="min-h-screen transition-colors duration-1000 px-4 py-4 md:px-8 md:py-8 lg:px-12 relative" 
      style={{ background: `radial-gradient(circle at top, ${theme?.bg_gradient_from || '#dff8f6'}, ${theme?.bg_gradient_to || '#eff4f8'} 100%)` }}
    >
        {/* The Beautiful Splash Screen Overlay */}
        {showSplash && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
            style={{ 
              background: `linear-gradient(135deg, ${theme?.splash_gradient_from || '#0f172a'} 0%, ${theme?.splash_gradient_to || '#1e293b'} 100%)`,
              animation: 'splashFadeOut 0.8s ease-out 0.8s forwards'
            }}
          >
            {/* High-performance animated background blobs (no expensive CSS blur) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${theme?.primary_color || '#14b8a6'} 0%, transparent 70%)` }} />
              <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle, ${theme?.accent_color || '#6366f1'} 0%, transparent 70%)` }} />
            </div>

            <div className="text-center z-10 scale-up-center pointer-events-auto cursor-pointer" onClick={() => setShowSplash(false)}>
              {/* Logo */}
              <div className="mx-auto mb-8 h-24 w-24 rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white/10 flex items-center justify-center"
                style={{ backgroundColor: theme?.header_use_logo_image ? 'white' : (theme?.primary_color || '#0d9488') }}
              >
                {theme?.header_use_logo_image && theme?.header_logo_url ? (
                  <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-4xl font-black italic text-white">{theme?.logo_text || 'R'}</span>
                )}
              </div>

              {/* App Name */}
              <h1 className="text-5xl font-black italic text-white tracking-tighter mb-3 drop-shadow-2xl">
                {theme?.app_name || 'SAGARA'}
              </h1>
              <p className="text-white/40 text-xs font-black uppercase tracking-[0.5em] mb-12">
                Premium Learning Platform
              </p>

              {/* Loading bar (hardware accelerated) */}
              <div className="w-48 mx-auto h-1 bg-white/10 rounded-full overflow-hidden relative">
                <div 
                  className="absolute inset-y-0 left-0 w-full rounded-full origin-left"
                  style={{ 
                    backgroundColor: theme?.primary_color || '#2dd4bf',
                    animation: 'splashBar 0.8s ease-in-out forwards'
                  }}
                />
              </div>
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mt-6">Tap to skip</p>
            </div>
          </div>
        )}

        <style jsx global>{`
          :root {
            --primary: ${theme?.primary_color || '#14b8a6'};
            --accent: ${theme?.accent_color || '#f59e0b'};
            --nav-bg: ${theme?.nav_bg || '#0f172a'};
            --nav-active: ${theme?.nav_active_color || '#2dd4bf'};
            --text-main: ${theme?.text_primary || '#0f172a'};
          }
          .scale-up-center { animation: scale-up-center 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; will-change: transform, opacity; }
          @keyframes scale-up-center { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes splashFadeOut { 0% { opacity: 1; pointer-events: all; } 100% { opacity: 0; pointer-events: none; visibility: hidden; } }
          @keyframes splashBar { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        `}</style>

      {isFetching ? (
         <div className="flex-1 flex justify-center items-center opacity-0">...</div>
      ) : (
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-screen-2xl flex-col pb-40 md:pb-12 animate-in fade-in duration-1000">
          <header 
          className="mb-8 hidden rounded-[2.5rem] p-4 shadow-xl ring-1 ring-white/50 backdrop-blur-xl md:block px-8"
          style={{ backgroundColor: `${theme?.nav_bg}CC` || '#0f172aCC' }}
        >
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className={`h-14 w-14 flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/10 ${theme?.header_use_logo_image ? 'bg-white/5' : 'bg-slate-900 text-white font-black'}`}>
                     {theme?.header_use_logo_image && theme?.header_logo_url ? (
                        <img src={theme.header_logo_url || undefined} alt="Logo" className="w-full h-full object-contain p-1.5" />
                     ) : (
                        <span className="text-2xl font-black italic">{theme?.logo_text || 'R'}</span>
                     )}
                  </div>
                  <div>
                    <h2 className="font-black italic text-3xl text-slate-800 tracking-tighter leading-none">{theme?.app_name || 'sagara'}</h2>
                    <p className="text-[7px] font-black uppercase tracking-[0.5em] text-teal-600/50 mt-1">Premium Platform</p>
                  </div>
               </div>
              <div className="flex bg-slate-100/50 p-1 rounded-full ring-1 ring-black/5">
                 {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => changeTab(tab.id)}
                      style={{ 
                        backgroundColor: activeTab === tab.id ? (theme?.nav_active_color || '#2dd4bf') : 'transparent',
                        color: activeTab === tab.id ? '#ffffff' : undefined
                      }}
                      className={`px-8 py-3 rounded-full text-sm font-black tracking-wider transition-all ${activeTab === tab.id ? 'shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {tab.label.toUpperCase()}
                    </button>
                 ))}
              </div>
              <div className="flex items-center gap-4">
                 <p className="text-xs font-black uppercase text-teal-500">{currentTime || "..."}</p>
                 {loggedIn ? (
                    <div 
                      className="h-10 w-10 rounded-full bg-slate-900 border-2 border-slate-200 overflow-hidden shadow-sm flex items-center justify-center text-white font-bold cursor-pointer hover:ring-2 hover:ring-teal-500 transition-all"
                      onClick={() => changeTab("profile")}
                    >
                      {userProfile?.avatar_url ? (
                         <img src={userProfile.avatar_url} alt="profile" className="w-full h-full object-cover" />
                      ) : (
                         userProfile?.full_name?.charAt(0) || "U"
                      )}
                    </div>
                 ) : (
                    <button 
                      onClick={() => router.push("/login")}
                      className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-slate-800 active:scale-95 transition-all"
                    > Login </button>
                 )}
              </div>
           </div>
        </header>

        <div className="grid flex-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {activeTab === "dashboard" && (
              <>
                <section className="overflow-hidden rounded-3xl md:rounded-[3rem] bg-white shadow-2xl ring-1 ring-black/[0.03] transition-all">
                  <div className="relative h-[440px] md:h-[500px]">
                    {banners.map((banner, idx) => (
                      <div 
                        key={banner.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${currentSlide === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                      >
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${banner.overlay_color || '#111827'}99 100%)` }} />
                        <div className="absolute bottom-12 left-8 right-8 md:left-12 md:right-12 text-white">
                           <span className="px-4 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-black tracking-[0.4em] mb-6 inline-block uppercase ring-1 ring-white/30" style={{ borderColor: banner.badge_color || '#14b8a6' }}>
                              {banner.badge_text || 'Study Hub'}
                           </span>
                           <h1 className="text-3xl md:text-6xl font-black italic mb-6 drop-shadow-2xl" style={{ color: banner.title_color || '#fff' }}> "{banner.title}" </h1>
                           <p className="text-sm md:text-xl opacity-80 font-medium max-w-xl line-clamp-2">{banner.subtitle}</p>
                           <button onClick={() => goProtected("soal")} className="mt-8 px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm tracking-widest shadow-2xl shadow-black/30 active:scale-95 transition-all hover:px-12"> {banner.cta_text?.toUpperCase() || 'MULAI BELAJAR'} </button>
                        </div>
                      </div>
                    ))}
                    <div className="absolute bottom-6 right-12 z-20 flex gap-2">
                       {banners.map((_, i) => (
                          <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 transition-all rounded-full ${currentSlide === i ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
                       ))}
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Progress User", value: dashboardMetrics.totalMaterials > 0 ? `${Math.round((dashboardMetrics.completed / dashboardMetrics.totalMaterials) * 100)}%` : '0%', note: `${dashboardMetrics.completed} dari ${dashboardMetrics.totalMaterials} Bab` },
                    { label: "Last Read", value: dashboardMetrics.lastRead ? dashboardMetrics.lastRead.title : "-", note: dashboardMetrics.lastRead ? new Date(dashboardMetrics.lastRead.completed_at).toLocaleDateString() : 'Belum Mulai' },
                    { label: "Last Soal", value: "Akan Datang", note: "Belum Ujian" },
                    { label: "Level Saat Ini", value: userProfile?.is_premium ? "Premium N2" : "Basic N5", note: "Terus Berlatih!" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-3xl bg-white p-4 md:p-6 shadow-sm ring-1 ring-black/[0.03]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.label}</p>
                      <p className="text-xl md:text-2xl font-black text-slate-800 italic line-clamp-1">{item.value}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">{item.note}</p>
                    </div>
                  ))}
                </section>

                <section className="rounded-[2.5rem] md:rounded-[3rem] bg-white p-6 md:p-10 shadow-sm ring-1 ring-black/[0.05]">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-2xl md:text-3xl font-black italic text-slate-800 underline decoration-teal-500/20 underline-offset-8">Rekomendasi soal</h3>
                      <button className="text-xs md:text-sm font-black uppercase tracking-widest text-teal-600 hover:underline">Lihat Semua →</button>
                   </div>
                   <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { title: "Vocabulary Sprint", subtitle: "20 soal pilihan ganda", image: "https://images.unsplash.com/photo-1516979187457-637abb4f9353" },
                        { title: "Grammar Booster", subtitle: "Partikel wa, o, ni, de", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f" },
                        { title: "Reading Flow", subtitle: "Bacaan pendek level N5", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3" },
                      ].map(item => (
                        <button key={item.title} onClick={() => goProtected("soal")} className="group text-left">
                           <div className="rounded-[2rem] overflow-hidden aspect-[4/3] mb-4 shadow-lg group-hover:scale-105 transition-all duration-700">
                              <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.title} />
                           </div>
                           <h4 className="text-xl font-black italic text-slate-800">{item.title}</h4>
                           <p className="text-sm text-slate-400 font-medium">{item.subtitle}</p>
                        </button>
                      ))}
                   </div>
                </section>
              </>
            )}

            {activeTab === "materi" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <header className="flex items-start justify-between">
                   <div>
                     <h2 className="text-4xl font-black text-slate-900 tracking-tight italic mb-3">Materi Belajar</h2>
                     <p className="text-slate-500 font-medium"> {!selectedStudyCategory ? 'Pilih jalur sertifikasi tujuan Anda.' : 'Pilih level untuk melihat daftar materi lengkap.'} </p>
                   </div>
                   {selectedStudyCategory && (
                     <button onClick={() => setSelectedStudyCategory(null)} className="px-6 py-3 rounded-2xl bg-white ring-1 ring-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-2"> ← KEMBALI </button>
                   )}
                </header>
                {!selectedStudyCategory ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => { if (!loggedIn) { router.push(`/login?redirect=materi`); return; } setSelectedStudyCategory(cat.id); }} className="group relative bg-white rounded-[3rem] p-10 text-left shadow-sm ring-1 ring-slate-100 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-500 overflow-hidden" >
                         <div className="flex items-center gap-6 mb-6 relative z-10">
                            <div className="h-20 w-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" style={{ backgroundColor: cat.badge_color || '#14b8a6', color: '#fff' }} >
                               {cat.icon_url ? ( <img src={cat.icon_url || undefined} alt={cat.name} className="w-full h-full object-contain" /> ) : ( cat.name === 'JLPT' ? '🇯🇵' : '👷‍♂️' )}
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Study Path</p>
                               <h3 className="text-3xl font-black text-slate-800 italic">{cat.name}</h3>
                            </div>
                         </div>
                         <p className="text-slate-500 relative z-10">{cat.description}</p>
                         <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle, ${cat.badge_color || '#14b8a6'} 0%, transparent 70%)` }} />
                      </button>
                    ))}
                    {categories.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 italic font-bold">Kategori belum tersedia.</div>}
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-100">
                       <button onClick={() => setSelectedStudyCategory(null)} className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg hover:scale-105 active:scale-95 transition-all"> ← </button>
                       {categories.find(c => c.id === selectedStudyCategory)?.icon_url && ( <img src={categories.find(c => c.id === selectedStudyCategory)?.icon_url || undefined} alt="cat icon" className="w-16 h-16 object-contain p-2 bg-white rounded-[1.5rem] shadow-xl ring-1 ring-slate-100" /> )}
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Jalur Belajar</p>
                          <h3 className="text-3xl font-black text-slate-800 italic">{categories.find(c => c.id === selectedStudyCategory)?.name}</h3>
                       </div>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyLevels.filter(sl => sl.category_id === selectedStudyCategory).length > 0 ? studyLevels.filter(sl => sl.category_id === selectedStudyCategory).map(sl => (
                      <Link key={sl.id} href="#" onClick={(e) => { e.preventDefault(); if (!loggedIn) { router.push(`/login?redirect=materi`); return; }
                          const isUnlocked = userProfile?.is_admin || userProfile?.is_premium || (userProfile?.unlocked_levels || []).includes(sl.id) || sl.sort_order === 1;
                          if (!isUnlocked) { const msg = `Halo Admin, saya ${userProfile?.full_name} ingin membuka akses ke ${sl.title} di ${theme?.app_name || 'Sagara'}`; window.open(`https://wa.me/6281273010793?text=${encodeURIComponent(msg)}`, '_blank'); return; }
                          router.push(`/study/level/${sl.level_code}`); }}
                        className={`group relative bg-white rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-500 overflow-hidden flex flex-col ${!(userProfile?.is_admin || userProfile?.is_premium || (userProfile?.unlocked_levels || []).includes(sl.id) || sl.sort_order === 1) ? 'opacity-70 grayscale' : ''}`} >
                         <div className="flex items-start justify-between mb-8">
                            <div className="h-16 w-16 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: sl.icon_url ? 'transparent' : (sl.badge_color || '#14b8a6') }} >
                                {sl.icon_url ? ( <img src={sl.icon_url || undefined} alt={sl.level_code} className="w-full h-full object-cover" /> ) : ( sl.level_code.toUpperCase() )}
                            </div>
                            {!(userProfile?.is_admin || userProfile?.is_premium || (userProfile?.unlocked_levels || []).includes(sl.id) || sl.sort_order === 1) && ( <div className="h-10 w-10 bg-slate-900/5 rounded-xl flex items-center justify-center text-xl">🔒</div> )}
                         </div>
                         <h4 className="text-2xl font-black text-slate-800 italic leading-tight mb-3 group-hover:text-teal-600 transition-colors">{sl.title}</h4>
                         <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 flex-1">{sl.description || 'Pelajari materi lengkap untuk level ini.'}</p>
                         <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400"> Pilih Level </span>
                            <span className="text-teal-500 font-bold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">→</span>
                         </div>
                         <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ background: `radial-gradient(circle, ${sl.badge_color || '#14b8a6'} 0%, transparent 70%)` }} />
                      </Link>
                    )) : ( <div className="col-span-full py-10 text-center font-bold text-slate-400 italic">Level materi untuk kategori ini belum tersedia.</div> )}
                  </div>
                </div>
                )}
              </div>
            )}

            {activeTab === "soal" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <header>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight italic mb-3">Latihan Ujian</h2>
                   <p className="text-slate-500 font-medium">Uji kemampuan Anda dengan simulasi ujian JLPT standar.</p>
                </header>
                <section>
                  <div className="flex items-center gap-2 mb-8">
                     <span className="h-px flex-1 bg-slate-100" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mx-4">Pilih Level</span>
                     <span className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {levels.map((lvl, index) => {
                      const hasAccess = !lvl.is_locked || userProfile?.is_premium || (userProfile?.unlocked_levels || []).includes(lvl.id);
                      return (
                        <button key={lvl.id} onClick={() => handleLevelClick(lvl.id, lvl.level_code, lvl.is_locked, index)} className={`group relative flex items-center gap-6 p-6 rounded-[2.5rem] text-left transition-all duration-500 ${!hasAccess ? 'bg-slate-50/50 grayscale opacity-60 border border-slate-100' : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-2xl hover:-translate-y-2 hover:ring-teal-500/20'}`} >
                           <div className="h-20 w-20 shrink-0 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden" style={{ background: lvl.icon_url ? 'transparent' : `linear-gradient(135deg, ${lvl.gradient_from || '#0d9488'}, ${lvl.gradient_to || '#0f172a'})` }} >
                              {lvl.icon_url ? ( <img src={lvl.icon_url || undefined} alt={lvl.level_code} className="w-full h-full object-cover" /> ) : ( lvl.level_code.toUpperCase() )}
                           </div>
                           <div className="flex-1">
                              <h4 className="text-xl font-black text-slate-800 italic group-hover:text-teal-600 transition-colors">{lvl.title}</h4>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{lvl.description}</p>
                           </div>
                           {!hasAccess ? ( <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400">🔒</div> ) : ( <div className="h-10 w-10 flex items-center justify-center rounded-full bg-teal-50 text-teal-500 opacity-0 group-hover:opacity-100 transition-all"> <span className="font-black text-xl">→</span> </div> )}
                           {hasAccess && ( <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-teal-500 animate-pulse" /> )}
                        </button>
                      );
                    })}
                    {levels.length === 0 && ( <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-100"> <span className="text-4xl mb-4 block grayscale opacity-30">📚</span> <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Materi Latihan belum tersedia.</p> </div> )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "profile" && loggedIn && (
              <div className="grid md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-1000">
                 <div className="rounded-[3rem] bg-slate-900 p-12 text-center text-white shadow-2xl">
                    <div className="mx-auto h-32 w-32 rounded-[2.8rem] bg-white/10 flex items-center justify-center text-5xl font-black mb-8 ring-4 ring-white/5"> {userProfile?.full_name?.charAt(0)} </div>
                    <h3 className="text-3xl font-black italic mb-2">{userProfile?.full_name}</h3>
                    <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10"> {userProfile?.is_premium ? 'Premium Access' : 'Member Access'} </p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-white/5 rounded-[2rem] ring-1 ring-white/10"> <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">XP Points</p> <p className="text-3xl font-black italic">12.4K</p> </div>
                       <div className="p-6 bg-white/5 rounded-[2rem] ring-1 ring-white/10"> <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Badges</p> <p className="text-3xl font-black italic text-amber-400">18</p> </div>
                    </div>
                 </div>
                 <div className="rounded-[3rem] bg-white p-12 shadow-sm ring-1 ring-black/[0.05]">
                    <h3 className="text-2xl font-black text-slate-800 italic underline decoration-slate-100 decoration-8 underline-offset-4 mb-10">Pengaturan Akun</h3>
                    <div className="space-y-4">
                       <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Status Keanggotaan</p>
                             <span className={`text-base font-black ${userProfile?.is_premium ? 'text-amber-500' : 'text-slate-400'}`}> {userProfile?.is_premium ? 'PREMIUM ACCESS' : 'FREE MEMBER'} </span>
                          </div>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${userProfile?.is_premium ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}> {userProfile?.is_premium ? '👑' : '👤'} </div>
                       </div>
                       <div className="grid gap-4 font-black tracking-widest text-[10px] uppercase">
                          {userProfile?.is_admin ? ( <button onClick={() => router.push('/admin')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-3"> <span className="text-lg">⚙️</span> ADMIN DASHBOARD </button>
                          ) : userProfile?.is_teacher ? ( <button onClick={() => router.push('/teacher')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-3"> <span className="text-lg">👩‍🏫</span> TEACHER DASHBOARD </button>
                          ) : ( <button onClick={() => router.push('/learning')} className="w-full py-5 bg-teal-500 text-white rounded-2xl shadow-xl shadow-teal-500/20 active:scale-95 transition flex items-center justify-center gap-3"> <span className="text-lg">📊</span> LEARNING SYSTEM (RIWAYAT) </button> )}
                          <button onClick={() => setActiveTab("soal")} className="w-full py-5 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition">Lanjut Belajar</button>
                          <div className="pt-2 pb-6 border-t border-slate-50 relative mt-auto">
                            <button onClick={() => { localStorage.removeItem("luma-auth"); localStorage.removeItem("luma-admin-auth"); window.location.href = "/?logout=1"; }} className="w-full py-5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 active:scale-95 transition">Keluar Akun</button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </section>

          <aside className="hidden lg:block space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
             <div className="rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <span className="text-9xl">🎯</span>
               </div>
               <h4 className="text-xl font-black italic mb-6 relative z-10">Target Minggu Ini</h4>

               {!loggedIn ? (
                 <div className="space-y-4 relative z-10">
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                     Login untuk melihat misi mingguan dari guru Anda.
                   </p>
                   <button
                     onClick={() => router.push('/login')}
                     className="w-full py-3 bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-500 hover:text-white transition-all"
                   >
                     Masuk Sekarang
                   </button>
                 </div>
               ) : weeklyTargets.length === 0 ? (
                 <div className="relative z-10">
                   <p className="text-white/30 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                     Belum ada misi yang ditetapkan untuk minggu ini.
                   </p>
                 </div>
               ) : (
                 <div className="space-y-6 relative z-10">
                   {weeklyTargets.slice(0, 2).map(target => {
                     const matIds = target.material_ids || [];
                     return (
                       <div key={target.id}>
                         <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2 line-clamp-1">{target.title}</p>
                         <div className="space-y-1.5 mb-3">
                           {matIds.slice(0, 4).map(mid => {
                             const mat = publicMaterials.find(m => m.id === mid);
                             return (
                               <div key={mid} className="flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 rounded-full bg-teal-400/50 shrink-0" />
                                 <span className="text-[10px] text-white/50 font-medium truncate">{mat?.title || 'Materi'}</span>
                               </div>
                             );
                           })}
                           {matIds.length > 4 && (
                             <p className="text-[9px] text-white/30 font-black pl-3.5">+{matIds.length - 4} materi lainnya</p>
                           )}
                         </div>
                         <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-teal-400/40 w-0 transition-all duration-1000" />
                         </div>
                       </div>
                     );
                   })}
                   {weeklyTargets.length > 2 && (
                     <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">+{weeklyTargets.length - 2} misi lainnya</p>
                   )}
                 </div>
               )}
             </div>
             <JapanNews />

          </aside>
        </div>

        <nav className="fixed inset-x-0 bottom-[calc(1.2rem+env(safe-area-inset-bottom))] z-50 px-8 md:hidden">
          <div className="mx-auto max-w-[340px] rounded-full p-1.5 flex items-center justify-around shadow-2xl ring-1 ring-white/10 outline outline-4 outline-black/5" style={{ backgroundColor: theme?.nav_bg || '#0f172a' }} >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => changeTab(tab.id)} style={{ color: active ? (theme?.nav_active_color || '#2dd4bf') : undefined, backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent' }} className={`relative flex h-14 w-14 flex-col items-center justify-center rounded-full transition-all duration-500`} >
                  <span className={`transition-all duration-500 ${active ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}> <tab.icon /> </span>
                  <span className={`text-[7px] font-black uppercase tracking-widest mt-1 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0 scale-50'}`}> {tab.label} </span>
                  {active && <div className="absolute top-1 right-2 h-1.5 w-1.5 rounded-full bg-teal-400" />}
                </button>
              );
            })}
          </div>
        </nav>
        </div>
      )}
    </main>
  );
}
