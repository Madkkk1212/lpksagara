"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTheme, getProfileByEmail, upsertProfile } from "@/lib/db";
import { AppTheme, Profile } from "@/lib/types";
import LearningSystem from "./LearningSystem";

// --- ONBOARDING COMPONENT ---
function ProfileOnboarding({ user, onComplete }: { user: Profile; onComplete: (fresh: Profile) => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    birth_date: user.birth_date || "",
    address: user.address || "",
    institution: user.institution || "",
    certificate_url: user.certificate_url || "",
    avatar_url: user.avatar_url || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "certificate_url" | "avatar_url") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedProfile: Profile = {
        ...user,
        ...formData,
        profile_completed: true,
      };
      await upsertProfile(updatedProfile);
      onComplete(updatedProfile);
    } catch (err) {
      alert("Gagal menyimpan data profil. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-y-auto">
       <div className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 my-auto">
          <div className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 p-8 md:p-12">
             <div className="text-center mb-10">
                <div className="h-16 w-16 bg-teal-500 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-lg shadow-teal-500/20">
                   👋
                </div>
                <h1 className="text-3xl font-black italic text-slate-800 mb-2">Selamat Datang di Hub!</h1>
                <p className="text-slate-500 font-medium">Sebelum mulai belajar, harap lengkapi identitas Anda dengan data asli. Data ini <strong className="text-slate-700">permanen</strong> dan memerlukan persetujuan Admin jika ingin diubah kelak.</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">Tanggal Lahir</label>
                      <input type="date" required value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">Institusi (Sekolah/Kerja)</label>
                      <input type="text" required placeholder="Cth: LPK Sagara / PT XYZ" value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-500">Alamat Lengkap KTP</label>
                   <textarea required placeholder="Jalan Raya No 1..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium resize-none" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-center">
                      <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl mb-4">📷</div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Foto Wajah (Avatar)</h4>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4">Maks 2MB (JPG/PNG)</p>
                      <input type="file" accept="image/*" onChange={e => handleFileChange(e, "avatar_url")} id="avatar_upload" className="hidden" />
                      <label htmlFor="avatar_upload" className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-indigo-50 transition-colors">
                        {formData.avatar_url ? 'FOTO DIPILIH ✓' : 'PILIH FOTO'}
                      </label>
                   </div>
                   
                   <div className="p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center text-center">
                      <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl mb-4">📜</div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Sertifikat Bahasa</h4>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4">Maks 2MB (Opsional)</p>
                      <input type="file" accept="image/*" onChange={e => handleFileChange(e, "certificate_url")} id="cert_upload" className="hidden" />
                      <label htmlFor="cert_upload" className="px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-50 transition-colors">
                        {formData.certificate_url ? 'SERTIFIKAT DIPILIH ✓' : 'PILIH SERTIFIKAT'}
                      </label>
                   </div>
                </div>

                <div className="pt-6">
                   <button disabled={loading} type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold tracking-widest uppercase hover:bg-slate-800 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                     {loading ? 'MEMPROSES IDENTITAS...' : 'SIMPAN PERMANEN & MULAI BELAJAR'}
                   </button>
                </div>
             </form>
          </div>
       </div>
    </div>
  );
}
// ------------------------------

export default function LearningPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [theme, setTheme] = useState<AppTheme | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Check Auth
      const authed = localStorage.getItem("luma-auth") === "true";
      if (!authed) {
        router.push("/login?redirect=learning");
        return;
      }

      // 2. Load Profile & Theme
      try {
        const savedProfile = localStorage.getItem("luma-user-profile");
        const t = await getTheme();
        setTheme(t);

        if (savedProfile) {
          const localProfile = JSON.parse(savedProfile);
          const freshProfile = await getProfileByEmail(localProfile.email);
          if (freshProfile) {
            setUser(freshProfile);
            localStorage.setItem("luma-user-profile", JSON.stringify(freshProfile));
          } else {
            setUser(localProfile);
          }
        } else {
          // If no profile in storage but authed, might be a bug or cleared storage
          router.push("/login");
        }
      } catch (err) {
        console.error("Failed to load learning system context:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const refreshUser = async () => {
    if (user?.email) {
      const fresh = await getProfileByEmail(user.email);
      if (fresh) {
        setUser(fresh);
        localStorage.setItem("luma-user-profile", JSON.stringify(fresh));
      }
    }
  };

  const handleOnboardingComplete = (freshProfile: Profile) => {
     setUser(freshProfile);
     localStorage.setItem("luma-user-profile", JSON.stringify(freshProfile));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Menyiapkan Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Render Onboarding if profile is not completed
  if (!user.profile_completed) {
     return <ProfileOnboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  return (
    <LearningSystem 
      user={user} 
      onLogout={() => router.push("/")} 
      theme={theme} 
      onRefreshUser={refreshUser}
    />
  );
}
