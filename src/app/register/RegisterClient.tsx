"use client";

<<<<<<< HEAD
import { useState, useEffect } from "react";
=======
import { useState } from "react";
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { upsertProfile, getProfileByEmail, getTheme } from "@/lib/db";
import { AppTheme } from "@/lib/types";
<<<<<<< HEAD
=======
import { useEffect } from "react";
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "soal";

  const [formData, setFormData] = useState({
    full_name: "",
<<<<<<< HEAD
    nickname: "",
=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
    email: "",
    gender: "Laki-laki" as "Laki-laki" | "Perempuan",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [theme, setTheme] = useState<AppTheme | null>(null);

  useEffect(() => {
    getTheme().then(setTheme);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // Check if email already exists
      const existing = await getProfileByEmail(formData.email);
      if (existing) {
        setErrorMsg("Email sudah terdaftar. Silakan login.");
        setLoading(false);
        return;
      }

      const newProfile = await upsertProfile({
        ...formData,
        is_admin: false,
        is_premium: false,
        unlocked_materials: [],
        unlocked_levels: [],
      });

      if (newProfile) {
        window.localStorage.setItem("luma-auth", "true");
        window.localStorage.setItem("luma-user-profile", JSON.stringify(newProfile[0]));
        router.push(`/?tab=${redirect}`);
      }
    } catch (err) {
      setErrorMsg("Gagal mendaftar. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0fdfa,_#f8fbff_42%,_#ffffff_100%)] px-4 py-8 md:px-12 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-[3rem] p-8 md:p-12 shadow-[0_40px_100px_rgba(15,23,42,0.1)] ring-1 ring-slate-100">
        <div className="text-center mb-10">
          <div className="h-16 w-16 bg-teal-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-xl shadow-teal-500/20 overflow-hidden">
             {theme?.header_use_logo_image && theme?.header_logo_url ? (
               <img src={theme.header_logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
             ) : (
               theme?.logo_text || 'L'
             )}
          </div>
          <h1 className="text-3xl font-black text-slate-800">Daftar Akun Baru</h1>
          <p className="text-slate-500 font-medium mt-2">Mulai perjalanan belajar JLPT Anda hari ini.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Nama Lengkap</p>
              <input 
                type="text" 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300"
                required
              />
            </div>
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
<<<<<<< HEAD
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Nama Panggilan</p>
              <input 
                type="text" 
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                placeholder="John"
                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Alamat Email</p>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@mail.com"
                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300"
                required
              />
            </div>
<<<<<<< HEAD
=======
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Jenis Kelamin</p>
              <select 
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                className="w-full bg-transparent font-bold text-slate-800 outline-none appearance-none cursor-pointer"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
            <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Nomor HP / WhatsApp</p>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="0812..."
                className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-300"
                required
              />
            </div>
          </div>

<<<<<<< HEAD
          <div className="rounded-2xl bg-slate-50 px-5 py-4 ring-1 ring-slate-100 focus-within:ring-teal-500 transition-all">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Jenis Kelamin</p>
            <select 
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
              className="w-full bg-transparent font-bold text-slate-800 outline-none appearance-none cursor-pointer"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold ring-1 ring-rose-100 italic">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? "Mendaftarkan..." : "BUAT AKUN SEKARANG"}
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-slate-50">
          <p className="text-sm text-slate-400 font-medium">Sudah punya akun?</p>
          <Link href="/login" className="mt-2 inline-block text-teal-600 font-black text-xs uppercase tracking-widest hover:underline">
            Masuk ke Akun Anda →
          </Link>
        </div>
      </div>
    </main>
  );
}
