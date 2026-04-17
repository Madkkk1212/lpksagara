"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, ArrowLeft, Search, AlertCircle, Timer } from "lucide-react";
import { AppTheme } from "@/lib/types";

interface NotFoundContentProps {
  theme: AppTheme | null;
}

export default function NotFoundContent({ theme }: NotFoundContentProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setMounted(true);
    
    // Auto-redirect timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  if (!mounted) return null;

  return (
    <main 
      className="flex min-h-svh flex-col items-center justify-center px-6 py-12 overflow-x-hidden relative font-sans"
      style={{ 
        background: `radial-gradient(circle at center, ${theme?.bg_gradient_from || '#edf2ff'}, ${theme?.bg_gradient_to || '#c7d2fe'})` 
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20 bg-white"
            initial={{ 
              width: Math.random() * 300 + 100, 
              height: Math.random() * 300 + 100,
              x: Math.random() * 100 - 50 + "%",
              y: Math.random() * 100 - 50 + "%",
            }}
            animate={{ 
              x: [
                Math.random() * 100 - 50 + "%", 
                Math.random() * 100 - 50 + "%", 
                Math.random() * 100 - 50 + "%"
              ],
              y: [
                Math.random() * 100 - 50 + "%", 
                Math.random() * 100 - 50 + "%", 
                Math.random() * 100 - 50 + "%"
              ],
            }}
            transition={{ 
              duration: Math.random() * 20 + 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ filter: "blur(80px)" }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center">
        {/* Branding Area */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 md:mb-12 flex flex-col items-center"
        >
          <Link href="/" className="group flex flex-col items-center">
            <div className={`relative h-16 w-16 md:h-20 md:w-20 flex items-center justify-center rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${theme?.header_use_logo_image ? 'bg-white' : 'bg-slate-900 text-white font-black italic text-2xl md:text-3xl'}`}>
              {theme?.header_use_logo_image && theme?.header_logo_url ? (
                <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <span>{theme?.logo_text || 'R'}</span>
              )}
            </div>
            <h1 className="mt-4 text-xl md:text-2xl font-black italic tracking-tighter text-slate-900 group-hover:text-primary transition-colors">
              {theme?.app_name || 'reiwa lms'}
            </h1>
          </Link>
        </motion.div>

        {/* 404 Visual Container */}
        <div className="relative w-full flex flex-col items-center justify-center my-4 md:my-8">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.2
            }}
            className="text-[10rem] md:text-[18rem] font-black text-slate-900/[0.08] leading-none select-none"
          >
            404
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute inset-x-0 bottom-0 md:inset-0 flex flex-col items-center justify-center translate-y-4 md:translate-y-0"
          >
            <div className="bg-white/60 backdrop-blur-2xl border border-white/80 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-w-[95%] md:max-w-lg">
              <div className="mb-4 md:mb-6 inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-2xl md:text-4xl font-black italic text-slate-900 mb-3 md:mb-4 tracking-tight">Halaman Tidak Ditemukan</h3>
              <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-lg mb-6">
                Sepertinya Anda tersesat. Halaman yang Anda cari tidak ada atau telah dipindahkan.
              </p>
              
              <div className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-50 rounded-full w-fit mx-auto border border-slate-100">
                <Timer size={14} className="text-slate-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Dialihkan otomatis dalam <span className="text-slate-800">{countdown}</span> detik
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8 md:mt-16 w-full max-w-md md:max-w-none px-4"
        >
          <Link 
            href="/"
            className="group w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-slate-900 text-white rounded-full font-black text-xs md:text-sm tracking-widest shadow-2xl shadow-slate-900/30 hover:scale-105 active:scale-95 transition-all"
          >
            <Home size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            KEMBALI KE BERANDA
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-white text-slate-600 rounded-full font-black text-xs md:text-sm tracking-widest border border-slate-200 shadow-xl shadow-black/5 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
            KEMBALI
          </button>
        </motion.div>

        {/* Footer info */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 }}
          className="mt-12 md:mt-24 text-[8px] md:text-[10px] uppercase font-black tracking-[0.6em] text-slate-800"
        >
          {theme?.tagline || 'Think, and Grow.'}
        </motion.p>
      </div>

      <style jsx global>{`
        @keyframes drift {
          from { transform: translate(0, 0); }
          to { transform: translate(100px, 100px); }
        }
      `}</style>
    </main>
  );
}
