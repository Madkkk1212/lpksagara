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
import { supabase } from "@/lib/supabase";

type AdminTab = "dashboard" | "theme" | "banners" | "icons" | "materials" | "exams" | "settings" | "users";

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123")) {
      setIsAuthorized(true);
      localStorage.setItem("luma-admin-auth", "true");
    } else {
      setError("Password salah!");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("luma-admin-auth") === "true") {
      setIsAuthorized(true);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("luma-admin-auth");
    setIsAuthorized(false);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white text-2xl font-black mx-auto mb-8">L</div>
          <h1 className="text-2xl font-black text-center text-slate-800 mb-2">Admin Panel Login</h1>
          <p className="text-slate-500 text-center mb-8 font-medium">Silakan masukkan password admin.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition"
              />
            </div>
            {error && <p className="text-rose-500 text-sm font-bold text-center">{error}</p>}
            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl active:scale-95 transition">LOGIN ADMIN</button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "icons", label: "Icons Gallery", icon: "✨" },
    { id: "theme", label: "Theme", icon: "🎨" },
    { id: "banners", label: "Banners", icon: "🖼️" },
    { id: "materials", label: "Materials", icon: "📚" },
    { id: "exams", label: "Exams", icon: "🎯" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 shadow-2xl z-50 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-white text-slate-900 rounded-xl flex items-center justify-center font-black text-lg">L</div>
            <span className="font-black text-lg tracking-tight">Admin Luma</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white p-2 text-xl font-bold">✕</button>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition ${activeTab === tab.id ? 'bg-white/10 text-white shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={logout} className="w-full py-3 bg-rose-500/10 text-rose-500 rounded-xl font-black text-sm hover:bg-rose-500 hover:text-white transition">KELUAR</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-6 md:p-10 min-h-screen">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-slate-100 lg:hidden text-slate-600 hover:text-slate-900 transition active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800">{tabs.find(t => t.id === activeTab)?.label}</h2>
              <p className="text-slate-500 font-medium text-sm md:text-base">Manage your {activeTab} content</p>
            </div>
          </div>
          <button onClick={() => window.open('/', '_blank')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-slate-900/20 active:scale-95 transition text-center">PREVIEW WEB</button>
        </header>

        <section className="bg-white rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 shadow-sm ring-1 ring-slate-100">
          { activeTab === "dashboard" && <AdminDashboard /> }
          { activeTab === "icons" && <IconManager /> }
          { activeTab === "theme" && <ThemeManager /> }
          { activeTab === "banners" && <BannerManager /> }
          { activeTab === "materials" && <StudyHierarchyManager /> }
          { activeTab === "exams" && <ExamManager /> }
          { activeTab === "users" && <UserManager /> }
          {activeTab === "settings" && <SettingsPanel />}
        </section>
      </main>
    </div>
  );
}
