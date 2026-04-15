"use client";

import { useState, useEffect } from "react";
import { Profile } from "@/lib/types";
import DashboardView from "./components/DashboardView";
import MateriView from "./components/MateriView";
import LatihanView from "./components/LatihanView";
import ProfileView from "./components/ProfileView";

interface LearningSystemProps {
  user: Profile;
  onLogout: () => void;
  theme: any;
}

export type LearningTab = "dashboard" | "materi" | "latihan" | "profile";

export default function LearningSystem({ user, onLogout, theme }: LearningSystemProps) {
  const [activeTab, setActiveTab] = useState<LearningTab>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "🚀" },
    { id: "materi", label: "Materi", icon: "📚" },
    { id: "latihan", label: "Latihan", icon: "🎯" },
    { id: "profile", label: "Profile", icon: "👤" },
  ] as const;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-slate-50 to-teal-50/50 flex relative overflow-hidden font-sans selection:bg-teal-100">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full pointer-events-none animate-pulse " style={{ animationDelay: '2s' }} />

      {/* Sidebar Desktop - FLOATING GLASS STYLE */}
      <aside className="hidden lg:flex w-80 flex-col fixed inset-y-6 left-6 z-50">
        <div className="flex-1 bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[3rem] flex flex-col overflow-hidden">
          <div className="p-10">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => (window.location.href = "/")}>
              <div className="h-12 w-12 bg-slate-900 border border-white/20 text-white rounded-[1.2rem] flex items-center justify-center font-black text-2xl shadow-lg group-hover:rotate-6 transition-all duration-500 overflow-hidden">
                {theme?.header_use_logo_image && theme.header_logo_url ? (
                  <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <span>{theme?.logo_text?.charAt(0) || 'S'}</span>
                )}
              </div>
              <div>
                <span className="font-black text-xl block leading-tight tracking-tight text-slate-800 uppercase italic">
                  {theme?.app_name || 'Sagara'}
                </span>
                <span className="text-[10px] font-black text-teal-600/60 uppercase tracking-[0.3em]">Learning Hub</span>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] font-black transition-all duration-500 relative group overflow-hidden ${activeTab === item.id ? 'text-white' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}
              >
                {activeTab === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-indigo-600 z-0 animate-in fade-in zoom-in-95 duration-500" />
                )}
                <span className={`text-xl relative z-10 ${activeTab === item.id ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
                <span className="tracking-wide text-sm relative z-10">{item.label}</span>
                {activeTab === item.id && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white relative z-10" />}
              </button>
            ))}
          </nav>

          <div className="p-8 space-y-3">
            <button 
              onClick={onLogout}
              className="w-full py-4 bg-white/80 text-teal-600 border border-teal-100 rounded-2xl font-black text-[10px] hover:bg-teal-500 hover:text-white transition-all duration-500 uppercase tracking-widest shadow-sm flex items-center justify-center gap-2"
            >
              ← MAIN PORTAL
            </button>
            
            <button 
              onClick={() => {
                localStorage.removeItem("luma-auth");
                localStorage.removeItem("luma-user-profile");
                window.location.href = "/";
              }}
              className="w-full py-4 bg-rose-50/50 text-rose-500 rounded-2xl font-black text-[10px] hover:bg-rose-500 hover:text-white transition-all duration-500 uppercase tracking-widest"
            >
              LOG OUT
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60] lg:hidden animate-in fade-in duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-4 left-4 w-72 z-[70] transition-transform duration-700 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full bg-white/90 backdrop-blur-3xl border border-white/60 shadow-3xl rounded-[2.5rem] flex flex-col">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                  {theme?.header_use_logo_image && theme.header_logo_url ? (
                    <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span>{theme?.logo_text?.charAt(0) || 'S'}</span>
                  )}
                </div>
                <span className="font-black text-sm tracking-tight text-slate-800 uppercase italic">{theme?.app_name || 'Sagara'}</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors">✕</button>
          </div>
          <nav className="p-6 space-y-2 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${activeTab === item.id ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
            
            <div className="pt-6 mt-6 border-t border-slate-100 space-y-3">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-teal-600 bg-teal-50"
              >
                <span>⬅️</span>
                <span className="text-sm">Main Hub</span>
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem("luma-auth");
                  window.location.href = "/";
                }}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-rose-500 bg-rose-50"
              >
                <span>🏠</span>
                <span className="text-sm">Log Out</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-[22rem] min-h-screen flex flex-col p-6 lg:p-10 relative z-10 transition-all duration-500">
        {/* Top Header - THEMED */}
        <header className="h-20 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[1.5rem] lg:rounded-[2.5rem] flex items-center justify-between px-8 mb-10 shadow-[0_10px_40px_rgba(0,0,0,0.02)] sticky top-6 z-40">
           <div className="flex items-center gap-4 lg:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="h-10 w-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-xl">☰</button>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse hidden md:block" />
              <h1 className="font-black text-slate-800 tracking-tight text-lg italic uppercase tracking-widest">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
           </div>

           <div className="hidden lg:block relative group">
              <input type="text" placeholder="Explore your path..." className="w-80 px-12 py-3 rounded-[1.2rem] bg-white/50 border border-white/60 focus:bg-white focus:ring-8 focus:ring-teal-500/5 transition-all font-bold text-xs outline-none shadow-inner" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
           </div>

           <div className="flex items-center gap-5">
              <div className="hidden md:flex flex-col items-end">
                <span className={`text-[10px] font-black uppercase tracking-widest mb-0.5 px-2 py-0.5 rounded-md ${user.is_premium ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-500'}`}>
                  {user.is_premium ? '👑 PREMIUM' : 'FREE LEARNER'}
                </span>
                <span className="text-sm font-black text-slate-800 leading-tight">{user.full_name}</span>
              </div>
              <div className="h-12 w-12 rounded-[1.2rem] bg-white border-2 border-white shadow-xl flex items-center justify-center font-black text-slate-300 overflow-hidden ring-4 ring-slate-100/50">
                 {user.avatar_url ? (
                   <img src={user.avatar_url} className="h-full w-full object-cover" alt="pfp" />
                 ) : (
                   <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">
                     {user.full_name.charAt(0)}
                   </div>
                 )}
              </div>
           </div>
        </header>

        {/* Dynamic View Rendering */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 flex-1">
           <div className="max-w-[1400px] mx-auto pb-10">
             {activeTab === "dashboard" && <DashboardView user={user} theme={theme} onUpgrade={setUpgradeMessage} />}
             {activeTab === "materi" && <MateriView user={user} theme={theme} onUpgrade={setUpgradeMessage} />}
             {activeTab === "latihan" && <LatihanView user={user} theme={theme} onUpgrade={setUpgradeMessage} />}
             {activeTab === "profile" && <ProfileView user={user} onLogout={onLogout} />}
           </div>
        </div>
      </main>

      {/* Global Upgrade Modal Overlay */}
      {upgradeMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setUpgradeMessage(null)} />
           <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 text-center animate-in zoom-in-95 duration-500 overflow-hidden">
               <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-400/20 blur-[60px] rounded-full pointer-events-none" />
               <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-400/20 blur-[60px] rounded-full pointer-events-none" />
               <div className="relative z-10 flex flex-col items-center">
                  <div className="h-24 w-24 bg-gradient-to-br from-amber-200 to-orange-100 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-inner ring-4 ring-white rotate-3">👑</div>
                  <h3 className="text-3xl font-black text-slate-800 italic uppercase tracking-tight mb-3">Premium Only</h3>
                  <p className="text-slate-500 font-medium mb-8">Anda membutuhkan akses <strong className="text-amber-500">Premium</strong> untuk menggunakan fitur atau level ini. Upgrade akun Anda sekarang dan raih sertifikasi dengan lebih cepat!</p>
                  <div className="flex flex-col w-full gap-3">
                    <a 
                      href={`https://wa.me/6281273010793?text=${encodeURIComponent(upgradeMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUpgradeMessage(null)}
                      className="w-full py-5 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                    >
                      Buka via WhatsApp →
                    </a>
                    <button onClick={() => setUpgradeMessage(null)} className="w-full py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:text-slate-600 transition-colors">
                      Nanti Saja
                    </button>
                  </div>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}
