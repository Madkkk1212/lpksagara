"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getTheme, getBanners, getMaterialCategories, getMaterials, getExamLevels, getProfileByEmail, upsertProfile, getStudyLevels, getCompletedMaterials, getTotalStudyMaterialsCount, getUserLastProgressDetails } from "@/lib/db";
import { AppTheme, BannerSlide, MaterialCategory, Material, ExamLevel, Profile, StudyLevel } from "@/lib/types";
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

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchData = useCallback(async () => {
    const [t, b, c, m, l] = await Promise.all([
      getTheme(),
      getBanners(),
      getMaterialCategories(),
      getMaterials(),
      getExamLevels()
    ]);
    setTheme(t);
    setBanners(b);
    setCategories(c);
    setMaterials(m);
    setLevels(l);
  }, []);

  useEffect(() => {
    const init = async () => {
      // 1. Initial Data Fetching
      const [t, b, c, m, l, sl, totalMatsCount] = await Promise.all([
        getTheme(),
        getBanners(),
        getMaterialCategories(),
        getMaterials(),
        getExamLevels(),
        getStudyLevels(),
        getTotalStudyMaterialsCount()
      ]);
      setTheme(t);
      setBanners(b);
      setCategories(c);
      setMaterials(m);
      setLevels(l);
      setStudyLevels(sl);

      // 2. Auth & Profile Sync
      const authed = isAuthed();
      setLoggedIn(authed);
      
      let emailForMetrics = "";

      if (authed) {
        const saved = localStorage.getItem("luma-user-profile");
        if (saved) {
          const localProfile = JSON.parse(saved);
          emailForMetrics = localProfile.email;
          try {
            const freshProfile = await getProfileByEmail(localProfile.email);
            if (freshProfile) {
              setUserProfile(freshProfile);
              localStorage.setItem("luma-user-profile", JSON.stringify(freshProfile));
            } else {
              setUserProfile(localProfile);
            }
          } catch (err) {
            setUserProfile(localProfile);
          }
        }
      }

      // Fetch Realtime Dashboard Metrics
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

      // 3. App State
      setExamProgress(getExamProgress());
      
      const nextTab = new URLSearchParams(window.location.search).get("tab") as TabId | null;
      if (nextTab && tabs.some((tab) => tab.id === nextTab)) setActiveTab(nextTab);
      
      window.setTimeout(() => setShowSplash(false), 1200);
    };

    init();
  }, []); // Run ONLY once on mount

  // Auto-slide carousel
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

  const handleLevelClick = (levelId: string, levelCode: string, globalLocked: boolean) => {
    if (!loggedIn || !userProfile) { router.push(`/login?redirect=soal`); return; }
    
    const hasAccess = !globalLocked || userProfile.is_premium || (userProfile.unlocked_levels || []).includes(levelId);
    
    if (!hasAccess) { alert('Level ini premium! Silakan hubungi admin untuk akses.'); return; }
    router.push(`/exam/${levelCode.toLowerCase()}`);
  };

  if (showSplash) {
    return (
      <main 
        className="flex min-h-screen items-center justify-center px-6 overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${theme?.splash_gradient_from || '#0f172a'}, ${theme?.splash_gradient_to || '#1e293b'})` }}
      >
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
              <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="transparent" />
                <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <line x1="-10%" y1="30%" x2="120%" y2="40%" stroke="url(#line-grad)" strokeWidth="1" className="animate-[pulse_4s_infinite]" />
            <line x1="-10%" y1="50%" x2="120%" y2="60%" stroke="url(#line-grad)" strokeWidth="1" className="animate-[pulse_6s_infinite]" />
            <line x1="-10%" y1="70%" x2="120%" y2="80%" stroke="url(#line-grad)" strokeWidth="1" className="animate-[pulse_5s_infinite]" />
          </svg>
        </div>

        <div className="relative z-10 text-center scale-up-center">
          <div 
             className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-[3rem] overflow-hidden group shadow-[0_0_80px_rgba(255,255,255,0.15)]"
             style={{ background: theme?.header_use_logo_image ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))` }}
          >
            {/* Spinning inner glow */}
            <div className="absolute inset-0 animate-spin-slow opacity-30 bg-[conic-gradient(from_0deg,_transparent,_rgba(255,255,255,0.8),_transparent)]" />
            
            <div className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-[2.5rem] ${theme?.header_use_logo_image ? 'bg-white' : 'bg-white/10 backdrop-blur-md'} shadow-2xl`}>
              {theme?.header_use_logo_image && theme?.header_logo_url ? (
                <img src={theme.header_logo_url || undefined} alt="Logo" className="w-full h-full object-contain p-4" />
              ) : (
                <span className="text-6xl font-black text-white italic drop-shadow-lg">{theme?.logo_text || 'L'}</span>
              )}
            </div>
          </div>

          <div className="mt-12 space-y-6">
            <p className="text-xs font-black uppercase tracking-[1.2em] text-white/40 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-1000">
              {theme?.app_name || 'reiwa lms'}
            </p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)] animate-in fade-in duration-1000 delay-300">
              {theme?.tagline || 'Think, and Grow.'}
            </h1>
          </div>

          {/* Luxury Loading Bar */}
          <div className="mt-20 mx-auto w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-white animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
          </div>
        </div>

        <style jsx>{`
          .scale-up-center {
            animation: scale-up-center 1s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
          }
          @keyframes scale-up-center {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .animate-spin-slow {
             animation: spin 8s linear infinite;
          }
          @keyframes spin {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen transition-colors duration-1000 px-4 py-4 md:px-8 md:py-8 lg:px-12" style={{ background: `radial-gradient(circle at top, ${theme?.bg_gradient_from || '#dff8f6'}, ${theme?.bg_gradient_to || '#eff4f8'} 100%)` }}>
       <style jsx global>{`
          :root {
            --primary: ${theme?.primary_color || '#14b8a6'};
            --accent: ${theme?.accent_color || '#f59e0b'};
            --nav-bg: ${theme?.nav_bg || '#0f172a'};
            --nav-active: ${theme?.nav_active_color || '#2dd4bf'};
            --text-main: ${theme?.text_primary || '#0f172a'};
          }
       `}</style>

      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-screen-2xl flex-col pb-40 md:pb-12">
        {/* Desktop Header */}
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
                    <h2 className="font-black italic text-3xl text-slate-800 tracking-tighter leading-none">{theme?.app_name || 'reiwa lms'}</h2>
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
                 <p className="text-xs font-black uppercase text-teal-500">09:44 AM</p>
                 <div className="h-10 w-10 rounded-full bg-slate-900"></div>
              </div>
           </div>
        </header>

        <div className="grid flex-1 gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {activeTab === "dashboard" && (
              <>
                {/* Carousel Hero */}
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
                           <h1 className="text-3xl md:text-6xl font-black italic italic leading-[1.1] mb-6 drop-shadow-2xl" style={{ color: banner.title_color || '#fff' }}>
                              "{banner.title}"
                           </h1>
                           <p className="text-sm md:text-xl opacity-80 font-medium max-w-xl line-clamp-2">{banner.subtitle}</p>
                           <button 
                             onClick={() => goProtected("soal")}
                             className="mt-8 px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-sm tracking-widest shadow-2xl shadow-black/30 active:scale-95 transition-all hover:px-12"
                           >
                             {banner.cta_text?.toUpperCase() || 'MULAI BELAJAR'}
                           </button>
                        </div>
                      </div>
                    ))}
                    {/* Carousel Dots */}
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
                    { label: "Last Read", value: dashboardMetrics.lastRead ? dashboardMetrics.lastRead.study_materials.title : "-", note: dashboardMetrics.lastRead ? new Date(dashboardMetrics.lastRead.completed_at).toLocaleDateString() : 'Belum Mulai' },
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
                     <p className="text-slate-500 font-medium">
                       {!selectedStudyCategory 
                         ? 'Pilih jalur sertifikasi tujuan Anda.' 
                         : 'Pilih level untuk melihat daftar materi lengkap.'}
                     </p>
                   </div>
                   {selectedStudyCategory && (
                     <button 
                       onClick={() => setSelectedStudyCategory(null)}
                       className="px-6 py-3 rounded-2xl bg-white ring-1 ring-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-2"
                     >
                        ← KEMBALI
                     </button>
                   )}
                </header>

                {!selectedStudyCategory ? (
                  /* CATEGORY SELECTION VIEW */
                  <div className="grid md:grid-cols-2 gap-6">
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => {
                          if (!loggedIn) {
                            router.push(`/login?redirect=materi`);
                            return;
                          }
                          setSelectedStudyCategory(cat.id);
                        }}
                        className="group relative bg-white rounded-[3rem] p-10 text-left shadow-sm ring-1 ring-slate-100 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-500 overflow-hidden"
                      >
                         <div className="flex items-center gap-6 mb-6 relative z-10">
                            <div 
                              className="h-20 w-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                              style={{ backgroundColor: cat.badge_color || '#14b8a6', color: '#fff' }}
                            >
                               {cat.icon_url ? (
                                 <img src={cat.icon_url || undefined} alt={cat.name} className="w-full h-full object-contain" />
                               ) : (
                                 cat.name === 'JLPT' ? '🇯🇵' : '👷‍♂️'
                                )}
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Study Path</p>
                               <h3 className="text-3xl font-black text-slate-800 italic">{cat.name}</h3>
                            </div>
                         </div>
                         <p className="text-slate-500 relative z-10">{cat.description}</p>
                         
                         {/* Subtle Background Glow */}
                         <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: cat.badge_color || '#14b8a6' }} />
                      </button>
                    ))}
                    {categories.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 italic font-bold">Kategori belum tersedia.</div>}
                  </div>
                ) : (
                  /* STUDY LEVELS VIEW (Filtered by selected category) */
                  <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                    {/* Category Header */}
                    <div className="flex items-center gap-6 mb-10 pb-6 border-b border-slate-100">
                       <button 
                         onClick={() => setSelectedStudyCategory(null)}
                         className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
                       >
                         ←
                       </button>
                       {categories.find(c => c.id === selectedStudyCategory)?.icon_url && (
                         <img 
                           src={categories.find(c => c.id === selectedStudyCategory)?.icon_url || undefined} 
                           alt="cat icon" 
                           className="w-16 h-16 object-contain p-2 bg-white rounded-[1.5rem] shadow-xl ring-1 ring-slate-100" 
                         />
                       )}
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Jalur Belajar</p>
                          <h3 className="text-3xl font-black text-slate-800 italic">{categories.find(c => c.id === selectedStudyCategory)?.name}</h3>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {studyLevels.filter(sl => sl.category_id === selectedStudyCategory).length > 0 ? studyLevels.filter(sl => sl.category_id === selectedStudyCategory).map(sl => (
                      <Link 
                        key={sl.id} 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!loggedIn) {
                            router.push(`/login?redirect=materi`);
                            return;
                          }
                          router.push(`/study/level/${sl.level_code}`);
                        }}
                        className="group relative bg-white rounded-[2.5rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-2xl hover:-translate-y-2 active:scale-95 transition-all duration-500 overflow-hidden flex flex-col"
                      >
                         <div className="flex items-start justify-between mb-8">
                            <div 
                              className="h-16 w-16 rounded-3xl flex items-center justify-center text-2xl font-black text-white shadow-lg overflow-hidden group-hover:scale-110 transition-transform duration-500"
                              style={{ backgroundColor: sl.icon_url ? 'transparent' : (sl.badge_color || '#14b8a6') }}
                            >
                                {sl.icon_url ? (
                                  <img src={sl.icon_url || undefined} alt={sl.level_code} className="w-full h-full object-cover" />
                                ) : (
                                  sl.level_code.toUpperCase()
                                )}
                            </div>
                         </div>
                         
                         <h4 className="text-2xl font-black text-slate-800 italic leading-tight mb-3 group-hover:text-teal-600 transition-colors">{sl.title}</h4>
                         <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 flex-1">{sl.description || 'Pelajari materi lengkap untuk level ini.'}</p>
                         
                         <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                               Pilih Level
                            </span>
                            <span className="text-teal-500 font-bold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all">→</span>
                          </div>

                         {/* Subtle decorative elements */}
                         <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: sl.badge_color || '#14b8a6' }} />
                      </Link>
                    )) : (
                       <div className="col-span-full py-10 text-center font-bold text-slate-400 italic">Level materi untuk kategori ini belum tersedia.</div>
                    )}
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
                    {levels.map(lvl => {
                      const hasAccess = !lvl.is_locked || userProfile?.is_premium || (userProfile?.unlocked_levels || []).includes(lvl.id);
                      
                      return (
                        <button 
                          key={lvl.id}
                          onClick={() => handleLevelClick(lvl.id, lvl.level_code, lvl.is_locked)}
                          className={`group relative flex items-center gap-6 p-6 rounded-[2.5rem] text-left transition-all duration-500 ${!hasAccess ? 'bg-slate-50/50 grayscale opacity-60 border border-slate-100' : 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] ring-1 ring-slate-100 hover:shadow-2xl hover:-translate-y-2 hover:ring-teal-500/20'}`}
                        >
                           <div 
                            className="h-20 w-20 shrink-0 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden"
                            style={{ background: lvl.icon_url ? 'transparent' : `linear-gradient(135deg, ${lvl.gradient_from || '#0d9488'}, ${lvl.gradient_to || '#0f172a'})` }}
                           >
                              {lvl.icon_url ? (
                                <img src={lvl.icon_url || undefined} alt={lvl.level_code} className="w-full h-full object-cover" />
                              ) : (
                                lvl.level_code.toUpperCase()
                              )}
                           </div>
                           
                           <div className="flex-1">
                              <h4 className="text-xl font-black text-slate-800 italic group-hover:text-teal-600 transition-colors">{lvl.title}</h4>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{lvl.description}</p>
                           </div>

                           {!hasAccess ? (
                              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400">🔒</div>
                           ) : (
                             <div className="h-10 w-10 flex items-center justify-center rounded-full bg-teal-50 text-teal-500 opacity-0 group-hover:opacity-100 transition-all">
                                <span className="font-black text-xl">→</span>
                             </div>
                           )}

                           {hasAccess && (
                             <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                           )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {activeTab === "profile" && loggedIn && (
              <div className="grid md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-1000">
                 <div className="rounded-[3rem] bg-slate-900 p-12 text-center text-white shadow-2xl">
                    <div className="mx-auto h-32 w-32 rounded-[2.8rem] bg-white/10 flex items-center justify-center text-5xl font-black mb-8 ring-4 ring-white/5">
                      {userProfile?.full_name.charAt(0)}
                    </div>
                    <h3 className="text-3xl font-black italic mb-2">{userProfile?.full_name}</h3>
                    <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10">
                      {userProfile?.is_premium ? 'Premium Access' : 'Member Access'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-6 bg-white/5 rounded-[2rem] ring-1 ring-white/10">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">XP Points</p>
                          <p className="text-3xl font-black italic">12.4K</p>
                       </div>
                       <div className="p-6 bg-white/5 rounded-[2rem] ring-1 ring-white/10">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Badges</p>
                          <p className="text-3xl font-black italic text-amber-400">18</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="rounded-[3rem] bg-white p-12 shadow-sm ring-1 ring-black/[0.05]">
                    <h3 className="text-2xl font-black text-slate-800 italic underline decoration-slate-100 decoration-8 underline-offset-4 mb-10">Pengaturan Akun</h3>
                    <div className="space-y-4">
                       <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 mb-4 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Status Keanggotaan</p>
                             <span className={`text-base font-black ${userProfile?.is_premium ? 'text-amber-500' : 'text-slate-400'}`}>
                                {userProfile?.is_premium ? 'PREMIUM ACCESS' : 'FREE MEMBER'}
                             </span>
                          </div>
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${userProfile?.is_premium ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-400'}`}>
                             {userProfile?.is_premium ? '👑' : '👤'}
                          </div>
                       </div>
                       
                       <div className="grid gap-4 font-black tracking-widest text-[10px] uppercase">
                          <button onClick={() => setActiveTab("soal")} className="w-full py-5 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition">Lanjut Belajar</button>
                          <button onClick={() => { localStorage.removeItem("luma-auth"); window.location.reload(); }} className="w-full py-5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 active:scale-95 transition">Keluar Akun</button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </section>

          <aside className="hidden lg:block space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
             <div className="rounded-[3rem] bg-white shadow-xl overflow-hidden group">
                <div className="h-72 relative overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-110 group-hover:grayscale-0" alt="Sidebar" />
                   <div className="absolute inset-0 bg-slate-900/10" />
                </div>
                <div className="p-10">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mb-4 italic">Study Insights</p>
                   <h3 className="text-3xl font-black italic text-slate-800 leading-tight mb-6">Master Japanese with Style.</h3>
                   <p className="text-slate-400 font-medium leading-relaxed leading-7">Desain premium yang berfokus pada ketenangan belajar. Kurikulum kami dirancang untuk membantu Anda menguasai Nihongo dengan cepat dan tepat.</p>
                </div>
             </div>

             <JapanNews />
             
             <div className="rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl">
                <h4 className="text-xl font-black italic mb-6">Target Minggu Ini</h4>
                <div className="space-y-6">
                   {[
                     { label: "Vocabulary N5", progress: 85 },
                     { label: "Reading Test #3", progress: 40 },
                   ].map(task => (
                     <div key={task.label}>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                           <span>{task.label}</span>
                           <span className="text-teal-400">{task.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-teal-400 transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </aside>
        </div>

        {/* Mobile Navigation */}
        <nav className="fixed inset-x-0 bottom-[calc(1.2rem+env(safe-area-inset-bottom))] z-50 px-8 md:hidden">
          <div 
            className="mx-auto max-w-[340px] rounded-full p-1.5 flex items-center justify-around shadow-2xl ring-1 ring-white/10 outline outline-4 outline-black/5"
            style={{ backgroundColor: theme?.nav_bg || '#0f172a' }}
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changeTab(tab.id)}
                  style={{ 
                    color: active ? (theme?.nav_active_color || '#2dd4bf') : undefined,
                    backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }}
                  className={`relative flex h-14 w-14 flex-col items-center justify-center rounded-full transition-all duration-500`}
                >
                  <span className={`transition-all duration-500 ${active ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                    <tab.icon />
                  </span>
                  <span className={`text-[7px] font-black uppercase tracking-widest mt-1 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0 scale-50'}`}>
                    {tab.label}
                  </span>
                  {active && <div className="absolute top-1 right-2 h-1.5 w-1.5 rounded-full bg-teal-400" />}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}
