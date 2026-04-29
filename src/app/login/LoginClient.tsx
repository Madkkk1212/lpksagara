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
               )}
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
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
            </p>
        </motion.header>

        <motion.section 
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
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan Email/NIP..."
                  className="w-full h-18 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-800 outline-none focus:ring-8 focus:ring-teal-500/5 focus:bg-white focus:border-teal-500/30 transition-all placeholder:text-slate-300 shadow-inner"
                  required
                />
                <div className="absolute right-7 top-1/2 -translate-y-1/2 text-2xl filter grayscale group-focus-within:grayscale-0 transition-all opacity-40 group-focus-within:opacity-100">
                   🆔
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block ml-6">Kata Sandi</label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-18 bg-slate-50 border border-slate-100 rounded-3xl px-8 font-bold text-slate-800 outline-none focus:ring-8 focus:ring-teal-500/5 focus:bg-white focus:border-teal-500/30 transition-all placeholder:text-slate-300 tracking-[0.5em] shadow-inner"
                  required
                />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors text-xl"
                 >
                   {showPassword ? "🔓" : "🔒"}
                 </button>
              </div>
            </div>

            <AnimatePresence>
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-3xl bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-black italic tracking-tight flex items-center gap-3"
              >
                <span className="text-lg">⚠️</span> 
                <span>ERROR: {errorMsg.toUpperCase()}</span>
              </motion.div>
            )}
            </AnimatePresence>

            <motion.button
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
            </motion.button>
          </form>
        </motion.section>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-14 text-center"
        >
            <Link
              href="/"
              className="px-10 py-4 rounded-full bg-white/50 text-[10px] font-black uppercase tracking-[.6em] text-slate-400 hover:text-teal-600 hover:bg-white shadow-sm transition-all inline-block italic"
            >
              ← Kembali ke Beranda
            </Link>
        </motion.footer>
      </div>
    </main>
  );
}
