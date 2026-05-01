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
      const profile = await getProfileByIdentifier(identifier);
      
      if (profile) {
        if (profile.password !== passwordInput) {
           setErrorMsg("Password Invalid. Please double check.");
           setLoading(false);
           return;
        }

        window.localStorage.setItem("luma-auth", "true");
        window.localStorage.setItem("luma-user-profile", JSON.stringify(profile));
        
        if (profile.is_admin) {
          router.push("/admin");
        } else if (profile.is_teacher) {
          router.push("/teacher");
        } else if (profile.is_student || profile.is_alumni) {
          router.push("/learning");
        } else if (!profile.profile_completed) {
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
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-white">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/bg_login.png')" }}
      >
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
      </div>

      {/* Floating Shapes Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 30, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-400 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-emerald-400 blur-[150px] rounded-full" 
        />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10 text-center"
        >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/80 backdrop-blur-xl shadow-2xl ring-1 ring-slate-200 mb-8 overflow-hidden group">
               {theme?.header_use_logo_image && theme?.header_logo_url ? (
                 <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
               ) : (
                 <span className="text-5xl font-black text-slate-800 italic tracking-tighter">{theme?.logo_text?.charAt(0) || 'S'}</span>
               )}
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.5 }}
              className="text-[11px] font-black uppercase tracking-[0.6em] text-indigo-600 mb-3"
            >
               {theme?.app_name || 'SAGARA'} ECOSYSTEM
            </motion.p>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2 italic uppercase leading-none">
               Portal Masuk
            </h1>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[300px] mx-auto italic opacity-80">
               Silakan masuk untuk mengakses area belajar premium Anda.
            </p>
        </motion.header>

        <motion.section 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-[3.5rem] bg-white/80 backdrop-blur-[40px] p-10 md:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/50 relative overflow-hidden"
        >
          {/* Internal Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block ml-4">Identitas (Email / NIP)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ID Pengguna..."
                  className="w-full h-16 bg-slate-50/50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500/30 transition-all placeholder:text-slate-300 shadow-sm"
                  required
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                   🆔
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block ml-4">Kata Sandi</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-16 bg-slate-50/50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500/30 transition-all placeholder:text-slate-300 tracking-[0.4em] shadow-sm"
                  required
                />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                 >
                   {showPassword ? "👁️" : "👁️‍🗨️"}
                 </button>
              </div>
            </div>

            <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black italic tracking-tight"
              >
                ⚠️ ERROR: {errorMsg.toUpperCase()}
              </motion.div>
            )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full h-18 py-5 rounded-[2rem] bg-slate-900 text-white font-black tracking-[0.3em] uppercase text-xs shadow-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 relative overflow-hidden group"
            >
              <span className="relative z-10 italic flex items-center justify-center gap-3">
                {loading ? (
                   <>
                     <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     VERIFYING...
                   </>
                ) : (
                  "Masuk Sekarang →"
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </motion.button>
          </form>
        </motion.section>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 text-center"
        >
            <Link
              href="/register"
              className="px-8 py-3 rounded-full border border-slate-200 bg-white/50 backdrop-blur-sm text-[10px] font-black uppercase tracking-[.4em] text-slate-500 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 transition-all inline-block italic shadow-sm"
            >
              Daftar Akun Baru
            </Link>
        </motion.footer>
      </div>
    </main>
  );
}
