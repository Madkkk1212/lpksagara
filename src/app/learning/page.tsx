"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTheme, getProfileByEmail, upsertProfile, getProfileFields, upsertProfileValue } from "@/lib/db";
import { AppTheme, Profile, ProfileField } from "@/lib/types";
import LearningSystem from "./LearningSystem";

import { motion, AnimatePresence } from "framer-motion";

// --- ONBOARDING COMPONENT ---
function ProfileOnboarding({ user, onComplete }: { user: Profile; onComplete: (fresh: Profile) => void }) {
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [formData, setFormData] = useState({
    birth_date: user.birth_date || "",
    address: user.address || "",
    institution: user.institution || "",
  });
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Determine primary role for field filtering
    let userRole = 'standard';
    if (user.is_admin) userRole = 'admin';
    else if (user.is_teacher) userRole = 'teacher';
    else if (user.is_alumni) userRole = 'alumni';
    else if (user.is_student) userRole = 'student';
    else if (user.is_premium) userRole = 'premium';
    
    getProfileFields(userRole).then(setFields);
  }, [user.is_admin, user.is_teacher, user.is_premium, user.is_alumni, user.is_student]);

  const handleDynamicFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: ProfileField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Type Validation
    if (field.allowed_file_types && field.allowed_file_types.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !field.allowed_file_types.includes(ext)) {
        alert(`Tipe file tidak valid. Diperbolehkan: ${field.allowed_file_types.join(', ')}`);
        e.target.value = "";
        return;
      }
    }

    // Size Validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar. Maksimal 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDynamicValues(prev => ({ ...prev, [field.id]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Save Core Profile
      const updatedProfile: Profile = {
        ...user,
        ...formData,
        profile_completed: true,
      };
      await upsertProfile(updatedProfile);

      // 2. Save Dynamic Values
      for (const [fieldId, value] of Object.entries(dynamicValues)) {
        if (value) {
          await upsertProfileValue({
            user_id: user.id,
            field_id: fieldId,
            value: value
          });
        }
      }

      onComplete(updatedProfile);
    } catch (err) {
      alert("Gagal menyimpan data profil. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
       {/* Background Animated Blobs */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
       </div>

       <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.8, ease: "easeOut" }}
         className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 z-10"
       >
          <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl ring-1 ring-white/50 p-8 md:p-16 border border-slate-100">
             <div className="text-center mb-12">
                <motion.div 
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="h-20 w-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-3xl flex items-center justify-center text-white text-4xl mx-auto mb-8 shadow-xl shadow-teal-500/30"
                >
                   ✨
                </motion.div>
                <h1 className="text-4xl font-black italic text-slate-900 mb-3 tracking-tight uppercase">Lengkapi Profil</h1>
                <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-md mx-auto italic">
                   Selamat datang, <span className="text-teal-600 font-bold">{user.full_name}</span>! Mohon lengkapi data wajib berikut untuk mulai menjelajahi Dashboard Sagara.
                </p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-2 group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-teal-600 transition-colors">Tanggal Lahir</label>
                      <input 
                        type="date" 
                        required 
                        value={formData.birth_date} 
                        onChange={e => setFormData({...formData, birth_date: e.target.value})} 
                        className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 outline-none transition-all font-bold text-sm" 
                      />
                   </div>
                   <div className="space-y-2 group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-teal-600 transition-colors">Institusi</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Cth: LPK Sagara" 
                        value={formData.institution} 
                        onChange={e => setFormData({...formData, institution: e.target.value})} 
                        className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 outline-none transition-all font-bold text-sm" 
                      />
                   </div>
                </div>

                <div className="space-y-2 group">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-teal-600 transition-colors">Alamat KTP Lengkap</label>
                   <textarea 
                     required 
                     placeholder="Domisili saat ini..." 
                     value={formData.address} 
                     onChange={e => setFormData({...formData, address: e.target.value})} 
                     rows={3} 
                     className="w-full bg-slate-100/50 border border-slate-200 rounded-3xl px-6 py-4 text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 outline-none transition-all font-bold text-sm resize-none" 
                   />
                </div>

                {/* Dynamic Fields Section */}
                <AnimatePresence>
                {fields.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, height: 0 }}
                     animate={{ opacity: 1, height: 'auto' }}
                     className="space-y-8 pt-8 border-t-2 border-dashed border-slate-100"
                   >
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">Required Info</span>
                         <div className="h-px bg-slate-100 flex-1" />
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                         {[...fields]
                            .sort((a, b) => {
                               if (a.type !== 'file' && b.type === 'file') return -1;
                               if (a.type === 'file' && b.type !== 'file') return 1;
                               return a.sort_order - b.sort_order;
                            })
                            .map((field, idx) => (
                            <motion.div 
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.1 * idx }}
                               key={field.id} 
                               className="space-y-2 group"
                            >
                               <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-emerald-600 transition-colors flex items-center gap-2">
                                  {field.name}
                                  {field.is_required && <span className="text-rose-400">*</span>}
                               </label>
                               
                               {field.type === 'file' ? (
                                  <div className={`group relative p-8 bg-slate-50/50 border-2 border-slate-200 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center transition-all hover:bg-white hover:border-emerald-500/50 ${dynamicValues[field.id] ? 'bg-emerald-50 border-emerald-500/20' : ''}`}>
                                     <input 
                                       type="file" 
                                       id={`file-${field.id}`}
                                       className="hidden"
                                       onChange={e => handleDynamicFileChange(e, field)}
                                       required={field.is_required && !dynamicValues[field.id]}
                                     />
                                     <label htmlFor={`file-${field.id}`} className="cursor-pointer flex flex-col items-center">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110 shadow-sm ${dynamicValues[field.id] ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white text-slate-400'}`}>
                                           {dynamicValues[field.id] ? '✓' : '📁'}
                                        </div>
                                        <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                                          {dynamicValues[field.id] ? 'Upload Berhasil' : field.name}
                                        </p>
                                        <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
                                          {field.allowed_file_types?.join(', ') || 'All Formats'} • 2MB Max
                                        </p>
                                     </label>
                                  </div>
                               ) : (
                                  <input 
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    required={field.is_required}
                                    placeholder={`Masukkan ${field.name}...`}
                                    className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold text-sm"
                                    value={dynamicValues[field.id] || ""}
                                    onChange={e => setDynamicValues({...dynamicValues, [field.id]: e.target.value})}
                                  />
                               )}
                            </motion.div>
                         ))}
                      </div>
                   </motion.div>
                )}
                </AnimatePresence>

                <div className="pt-10">
                   <button 
                     disabled={loading} 
                     type="submit" 
                     className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black tracking-[0.2em] text-[11px] uppercase hover:bg-slate-800 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] disabled:opacity-50 relative overflow-hidden group"
                   >
                     {loading ? (
                       <span className="flex items-center justify-center gap-3">
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          MEMPROSES...
                       </span>
                     ) : (
                       <>
                         <span className="relative z-10 italic">Simpan & Mulai Belajar</span>
                         <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                       </>
                     )}
                   </button>
                   <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6 italic opacity-60">Data Anda dilindungi enkripsi standard industri.</p>
                </div>
             </form>
          </div>
       </motion.div>

       <footer className="py-10 text-center relative z-10">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Migii JLPT Hub &copy; 2026</p>
       </footer>
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
