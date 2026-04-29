"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getProfileByIdentifier, getTheme } from "@/lib/db";
import { AppTheme } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "soal";

  const [identifier, setIdentifier] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<AppTheme | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    getTheme().then(setTheme);

    const checkSession = () => {
      const isAuthed = localStorage.getItem("luma-auth") === "true";
      if (isAuthed) {
        const profileRaw = localStorage.getItem("luma-user-profile");
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          if (profile.is_admin) router.push("/admin");
          else if (profile.is_teacher) router.push("/teacher");
          else router.push("/");
        }
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !passwordInput) return;
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      // Dual login support: checks both Email and NIP
      const profile = await getProfileByIdentifier(identifier);
      
      if (profile) {
        if (profile.is_admin || profile.is_teacher) {
           setErrorMsg("Staff & Admin access restricted here. Please use management portal.");
           setLoading(false);
           return;
        }

        if (profile.password !== passwordInput) {
           setErrorMsg("Password Invalid. Please double check.");
           setLoading(false);
           return;
        }

        window.localStorage.setItem("luma-auth", "true");
        window.localStorage.setItem("luma-user-profile", JSON.stringify(profile));
        
        // 🔒 Routing Logic:
        // Students & Alumni → ALWAYS go to /learning (gatekeeper)
        // /learning will show onboarding form if profile not completed, or dashboard if completed
        if (profile.is_student || profile.is_alumni) {
          router.push("/learning");
        } else if (!profile.profile_completed) {
          // Any other unverified user → also send to /learning
          router.push("/learning");
        } else {
          router.push(`/?tab=${redirect}`);
        }
      } else {
        setErrorMsg("Identity not recognized. Enter valid Email or NIP.");
      }
    } catch (err) {
      setErrorMsg("Connection error. Check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-slate-100">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/images/bg_login.png" 
          alt="background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-white/30" />
      </div>

      <div className="relative z-10 w-full max-w-[500px]">
        <motion.header 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-14 text-center"
        >
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[3rem] bg-white shadow-2xl shadow-teal-900/10 ring-8 ring-white/50 mb-10 overflow-hidden group transition-all duration-700 hover:rotate-[10deg]">
               {theme?.header_use_logo_image && theme?.header_logo_url ? (
                 <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-5 transition-transform duration-700 group-hover:scale-110" />
               ) : (
                 <span className="text-6xl font-black text-slate-800 italic tracking-tighter">{theme?.logo_text?.charAt(0) || 'S'}</span>
=======
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#0a0c10]">
      {/* Premium Background Decor */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -60, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-emerald-600/10 blur-[180px] rounded-full" 
        />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 mb-8 overflow-hidden group">
               {theme?.header_use_logo_image && theme?.header_logo_url ? (
                 <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
               ) : (
                 <span className="text-5xl font-black text-white italic tracking-tighter">{theme?.logo_text?.charAt(0) || 'S'}</span>
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
               )}
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
<<<<<<< HEAD
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[10px] font-black uppercase tracking-[0.8em] text-teal-600 mb-4"
            >
               {theme?.app_name || 'SAGARA'} ECOSYSTEM
            </motion.p>
            <h1 className="text-6xl font-black tracking-tighter text-slate-900 mb-4 italic leading-none">
               Masuk Akun
            </h1>
            <p className="text-base text-slate-500 font-semibold leading-relaxed max-w-[320px] mx-auto opacity-70">
               Silakan masuk untuk melanjutkan belajar.
=======
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.5 }}
              className="text-[11px] font-black uppercase tracking-[0.6em] text-indigo-400 mb-3"
            >
               {theme?.app_name || 'SAGARA'} ECOSYSTEM
            </motion.p>
            <h1 className="text-5xl font-black tracking-tight text-white mb-3 italic uppercase leading-none">
               Hub Portal
            </h1>
            <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-[300px] mx-auto italic opacity-80">
               Enter your credentials to access your premium learning space.
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
            </p>
        </motion.header>

        <motion.section 
<<<<<<< HEAD
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="rounded-[4rem] bg-white p-12 md:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] border border-white relative overflow-hidden"
        >
          {/* Internal Accent Glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <form onSubmit={handleLogin} className="space-y-10 relative z-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block ml-6">Email atau NIP</label>
              <div className="relative group">
=======
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-[3.5rem] bg-white/5 backdrop-blur-[40px] p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-white/10 relative overflow-hidden"
        >
          {/* Internal Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <form onSubmit={handleLogin} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block ml-4">Identity (Email or NIP)</label>
              <div className="relative">
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
<<<<<<< HEAD
                  placeholder="Masukkan Email/NIP..."
                  className="w-full h-18 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-800 outline-none focus:ring-8 focus:ring-teal-500/5 focus:bg-white focus:border-teal-500/30 transition-all placeholder:text-slate-300 shadow-inner"
                  required
                />
                <div className="absolute right-7 top-1/2 -translate-y-1/2 text-2xl filter grayscale group-focus-within:grayscale-0 transition-all opacity-40 group-focus-within:opacity-100">
=======
                  placeholder="ID / Email..."
                  className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white/[0.08] focus:border-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                  required
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700 pointer-events-none">
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                   🆔
                </div>
              </div>
            </div>
            
<<<<<<< HEAD
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block ml-6">Kata Sandi</label>
              <div className="relative group">
=======
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 block ml-4">Access Password</label>
              <div className="relative">
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
<<<<<<< HEAD
                  className="w-full h-18 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-800 outline-none focus:ring-8 focus:ring-teal-500/5 focus:bg-white focus:border-teal-500/30 transition-all placeholder:text-slate-300 tracking-[0.5em] shadow-inner"
=======
                  className="w-full h-16 bg-white/[0.03] border border-white/10 rounded-2xl px-6 font-bold text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:bg-white/[0.08] focus:border-indigo-500/50 transition-all placeholder:text-slate-600 tracking-[0.4em] shadow-inner"
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                  required
                />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
<<<<<<< HEAD
                   className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors text-xl"
                 >
                   {showPassword ? "🔓" : "🔒"}
=======
                   className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                 >
                   {showPassword ? "👁️" : "👁️‍🗨️"}
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
                 </button>
              </div>
            </div>

            <AnimatePresence>
            {errorMsg && (
              <motion.div 
<<<<<<< HEAD
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black italic tracking-tight flex items-center gap-3"
              >
                <span className="text-lg">⚠️</span> 
                <span>ERROR: {errorMsg.toUpperCase()}</span>
=======
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-black italic tracking-tight"
              >
                ⚠️ ERROR: {errorMsg.toUpperCase()}
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
              </motion.div>
            )}
            </AnimatePresence>

            <motion.button
<<<<<<< HEAD
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black tracking-[0.4em] uppercase text-xs shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              <span className="relative z-10 italic flex items-center justify-center gap-4">
                {loading ? (
                   <>
                     <span className="h-5 w-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                     MEMVERIFIKASI...
                   </>
                ) : (
                  <>MASUK SEKARANG <span className="text-lg">→</span></>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-teal-400/20 to-teal-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
=======
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-18 rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black tracking-[0.3em] uppercase text-xs shadow-[0_20px_40px_rgba(79,70,229,0.3)] hover:from-indigo-500 hover:to-indigo-600 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              <span className="relative z-10 italic flex items-center justify-center gap-3">
                {loading ? (
                   <>
                     <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     VERIFYING...
                   </>
                ) : (
                  "Initiate Access →"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
            </motion.button>
          </form>
        </motion.section>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
<<<<<<< HEAD
          transition={{ delay: 1.2 }}
          className="mt-14 text-center"
        >
            <Link
              href="/"
              className="px-10 py-4 rounded-full bg-white/50 text-[10px] font-black uppercase tracking-[.6em] text-slate-400 hover:text-teal-600 hover:bg-white shadow-sm transition-all inline-block italic"
            >
              ← Kembali ke Beranda
=======
          transition={{ delay: 1 }}
          className="mt-12 text-center"
        >
            <Link
              href="/"
              className="px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] text-[10px] font-black uppercase tracking-[.4em] text-slate-500 hover:text-indigo-400 hover:bg-white/[0.05] transition-all inline-block italic"
            >
              ← Terminate Session
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
            </Link>
        </motion.footer>
      </div>
    </main>
  );
}
