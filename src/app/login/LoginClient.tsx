"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getProfileByEmail } from "@/lib/db";

const redirectLabels: Record<string, string> = {
  dashboard: "Dashboard",
  materi: "Materi",
  soal: "Soal",
  profile: "Profile",
};

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "soal";

  const [emailInput, setEmailInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      const profile = await getProfileByEmail(emailInput);
      if (profile) {
        window.localStorage.setItem("luma-auth", "true");
        window.localStorage.setItem("luma-user-profile", JSON.stringify(profile));
        router.push(`/?tab=${redirect}`);
      } else {
        setErrorMsg("Email tidak terdaftar. Silakan registrasi terlebih dahulu.");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan saat mengecek akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#f0f9ff]">
      {/* Bright & Airy Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 blur-[150px] rounded-full" />
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1920&q=80"
          alt="Bright Study"
          className="h-full w-full object-cover opacity-10 mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 w-full max-w-[450px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl ring-1 ring-slate-100 mb-6">
               <span className="text-4xl font-black text-teal-600 italic">L</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-600/60 mb-1">
               Reiwa LMS Hub
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-800 mb-2 italic">
               Welcome Back
            </h1>
            <p className="text-sm text-slate-400 font-medium">
               Akses materi premium dan simpan progres belajar Anda.
            </p>
        </header>

        <section className="rounded-[3rem] bg-white/70 backdrop-blur-2xl p-10 shadow-[0_32px_120px_rgba(20,184,166,0.12)] ring-1 ring-white">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-2">Email Address</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-6 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all placeholder:text-slate-300"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 text-[10px] font-bold ring-1 ring-rose-100 italic animate-in fade-in slide-in-from-top-2">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black tracking-widest uppercase text-sm shadow-xl hover:bg-slate-800 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign In Account →"}
            </button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-slate-100">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Don't have an account?</p>
             <Link 
               href={`/register?redirect=${redirect}`} 
               className="inline-block px-10 py-3 rounded-full text-xs font-black uppercase tracking-widest text-teal-600 ring-2 ring-teal-600/10 hover:bg-teal-600 hover:text-white transition-all"
             >
               Register Now
             </Link>
          </div>
        </section>

        <footer className="mt-10 text-center">
            <Link
              href="/"
              className="text-[10px] font-black uppercase tracking-[.3em] text-slate-400 hover:text-teal-600 transition-colors"
            >
              ← Back to Homepage
            </Link>
        </footer>
      </div>
    </main>
  );
}
