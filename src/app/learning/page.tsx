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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url || null);

  useEffect(() => {
    console.log("Onboarding: Loading fields for user...", user.email);
    let userRole = 'standard';
    if (user.is_admin) userRole = 'admin';
    else if (user.is_teacher) userRole = 'teacher';
    else if (user.is_alumni) userRole = 'alumni';
    else if (user.is_student) userRole = 'student';
    else if (user.is_premium) userRole = 'premium';
    
    console.log("Onboarding: Detected Role ->", userRole);
    
    getProfileFields(userRole).then(data => {
      console.log("Onboarding: Fields fetched ->", data.length);
      setFields(data || []);
    }).catch(err => {
      console.error("Onboarding: Failed to fetch fields:", err);
    });
  }, [user.is_admin, user.is_teacher, user.is_premium, user.is_alumni, user.is_student, user.email]);

  const handleDynamicFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: ProfileField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field.allowed_file_types && field.allowed_file_types.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !field.allowed_file_types.includes(ext)) {
        alert(`Tipe file tidak valid. Diperbolehkan: ${field.allowed_file_types.join(', ')}`);
        e.target.value = "";
        return;
      }
    }

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert("Mohon pilih file gambar.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!avatarPreview) {
      alert("Foto profil wajib diunggah.");
      setLoading(false);
      return;
    }

    try {
      const updatedProfile: Profile = {
        ...user,
        ...formData,
        avatar_url: avatarPreview,
        profile_completed: true,
      };
      await upsertProfile(updatedProfile);

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
      console.error("Onboarding: Submit Error:", err);
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
          className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-12 z-10"
        >
           <div className="bg-white/90 backdrop-blur-2xl rounded-[3.5rem] shadow-2xl ring-1 ring-slate-200/50 p-8 md:p-16 border border-white overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-400 via-indigo-500 to-emerald-400" />
              
              <div className="text-center mb-16">
                 <motion.div 
                   initial={{ scale: 0.5, rotate: -10 }}
                   animate={{ scale: 1, rotate: 0 }}
                   transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                   className="h-24 w-24 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] flex items-center justify-center text-white text-4xl mx-auto mb-8 shadow-2xl shadow-indigo-500/20 ring-4 ring-white"
                 >
                    🛡️
                 </motion.div>
                 <h1 className="text-4xl font-black italic text-slate-900 mb-4 tracking-tight uppercase">Identity Onboarding</h1>
                 <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-xl mx-auto italic">
                    Selamat datang, <span className="text-indigo-600 font-black">{user.full_name || 'User'}</span>! Untuk menjaga validitas data di Sagara, mohon lengkapi detil identitas dan berkas penunjang di bawah ini.
                 </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-12">
                 {/* Section 0: Foto Profil (Mandatory) */}
                 <div className="space-y-8 flex flex-col items-center border-b border-slate-100 pb-12">
                    <div className="flex items-center gap-4 w-full">
                       <span className="h-2 w-2 bg-rose-500 rounded-full" />
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">00. Pas Foto Terbaru (Wajib)</h3>
                    </div>
                    
                    <div className="relative group">
                       <div className="h-40 w-40 rounded-[3rem] bg-slate-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden ring-8 ring-slate-100 transition-all group-hover:ring-indigo-100">
                          {avatarPreview ? (
                             <img src={avatarPreview} className="w-full h-full object-cover" alt="pfp" />
                          ) : (
                             <span className="text-5xl opacity-30 grayscale">👤</span>
                          )}
                       </div>
                       <input 
                         type="file" 
                         id="pfp-input" 
                         className="hidden" 
                         accept="image/*"
                         onChange={handleAvatarChange}
                       />
                       <label 
                         htmlFor="pfp-input"
                         className="absolute -bottom-2 -right-2 h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl shadow-xl border-4 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                       >
                          📷
                       </label>
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Klik ikon kamera untuk unggah foto</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Wajib diisi sebagai syarat identitas resmi Sagara</p>
                    </div>
                 </div>
                 {/* Section 1: Data Identitas Dasar & Data Utama */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 ml-2">
                       <span className="h-2 w-2 bg-indigo-500 rounded-full" />
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">01. Informasi Identitas & Data Utama</h3>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                       <div className="space-y-2 group">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-indigo-600 transition-colors">Tanggal Lahir <span className="text-rose-500">(Wajib)</span></label>
                          <input 
                            type="date" 
                            required 
                            value={formData.birth_date} 
                            onChange={e => setFormData({...formData, birth_date: e.target.value})} 
                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" 
                          />
                       </div>
                       <div className="space-y-2 group">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-indigo-600 transition-colors">Institusi Asal <span className="text-rose-500">(Wajib)</span></label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Cth: LPK Sagara" 
                            value={formData.institution} 
                            onChange={e => setFormData({...formData, institution: e.target.value})} 
                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" 
                          />
                       </div>
                       <div className="space-y-2 group">
                          <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-indigo-600 transition-colors">Alamat Lengkap (KTP) <span className="text-rose-500">(Wajib)</span></label>
                          <input 
                            placeholder="Alamat domisili..." 
                            required
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" 
                          />
                       </div>

                       {/* Inject Dynamic Text/Number fields into Identity section */}
                       {fields.filter(f => f.type !== 'file').sort((a,b) => (a.sort_order||0)-(b.sort_order||0)).map((field) => (
                          <div key={field.id} className="space-y-2 group">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 group-focus-within:text-indigo-600 transition-colors">
                              {field.name} {field.is_required && <span className="text-rose-500">(Wajib)</span>}
                            </label>
                            <input 
                              type={field.type === 'number' ? 'number' : 'text'}
                              required={field.is_required}
                              placeholder={`Isi ${field.name}...`}
                              value={dynamicValues[field.id] || ""}
                              onChange={e => setDynamicValues({...dynamicValues, [field.id]: e.target.value})}
                              className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-800 focus:border-indigo-500 outline-none transition-all font-bold text-sm shadow-sm" 
                            />
                          </div>
                        ))}
                    </div>
                 </div>

                 {/* Section 2: Berkas Lampiran */}
                 <div className="space-y-8">
                    <div className="flex items-center gap-4 ml-2">
                       <span className="h-2 w-2 bg-emerald-500 rounded-full" />
                       <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">02. Berkas Lampiran (Upload Dokumen)</h3>
                    </div>

                    {fields.filter(f => f.type === 'file').length === 0 ? (
                       <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Tidak ada lampiran dokumen tambahan.</p>
                       </div>
                    ) : (
                       <div className="grid md:grid-cols-2 gap-8">
                          {fields
                             .filter(f => f.type === 'file')
                             .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                             .map((field, idx) => (
                                <motion.div 
                                   initial={{ opacity: 0, scale: 0.95 }}
                                   animate={{ opacity: 1, scale: 1 }}
                                   transition={{ delay: 0.1 * idx }}
                                   key={field.id}
                                   className={`relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col gap-6 ${
                                      dynamicValues[field.id] 
                                         ? 'bg-emerald-50/50 border-emerald-200 ring-4 ring-emerald-500/5' 
                                         : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                                   } group`}
                                >
                                   <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                         <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">
                                            {field.name} 
                                            <span className={`ml-2 text-[9px] px-2 py-0.5 rounded-full border ${field.is_required ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                               {field.is_required ? 'WAJIB' : 'OPSIONAL'}
                                            </span>
                                         </h4>
                                         <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest leading-relaxed">Format: PDF/JPG • Max 2MB</p>
                                      </div>
                                      {dynamicValues[field.id] ? (
                                         <div className="h-10 w-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-sm shadow-lg shadow-emerald-500/20">✓</div>
                                      ) : (
                                         <div className="h-10 w-10 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center text-sm border border-slate-100">📁</div>
                                      )}
                                   </div>

                                   <div className="relative">
                                      {dynamicValues[field.id] ? (
                                         <div className="w-full bg-white rounded-2xl p-4 border border-emerald-100 flex items-center gap-4">
                                            {dynamicValues[field.id]?.startsWith('data:image') ? (
                                               <div className="h-14 w-14 rounded-xl overflow-hidden border border-emerald-50 bg-slate-50">
                                                  <img src={dynamicValues[field.id]} className="w-full h-full object-cover" alt="preview" />
                                               </div>
                                            ) : (
                                               <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">📄</div>
                                            )}
                                            <div className="flex-1 overflow-hidden">
                                               <p className="text-[10px] font-black text-emerald-600 uppercase truncate">File Siap Disimpan</p>
                                               <label htmlFor={`change-${field.id}`} className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 cursor-pointer uppercase underline">Ganti Berkas</label>
                                            </div>
                                         </div>
                                      ) : (
                                         <label 
                                           htmlFor={`file-${field.id}`} 
                                           className="h-32 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors group"
                                         >
                                            <span className="text-2xl opacity-40 group-hover:scale-125 transition-transform">➕</span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Dokumen</p>
                                         </label>
                                      )}
                                      <input 
                                        type="file" 
                                        id={dynamicValues[field.id] ? `change-${field.id}` : `file-${field.id}`}
                                        className="hidden"
                                        onChange={e => handleDynamicFileChange(e, field)}
                                        required={field.is_required && !dynamicValues[field.id]}
                                      />
                                   </div>
                                </motion.div>
                             ))}
                       </div>
                    )}
                 </div>

                 <div className="pt-10 flex flex-col items-center gap-6 border-t border-slate-100">
                    <button 
                      disabled={loading} 
                      type="submit" 
                      className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black tracking-[0.3em] text-[11px] uppercase hover:bg-slate-800 active:scale-[0.98] transition-all shadow-2xl shadow-indigo-500/10 disabled:opacity-50 relative overflow-hidden group"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-3">
                           <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           MENYIMPAN DATA...
                        </span>
                      ) : (
                        <span className="relative z-10 italic">Simpan & Buka Dashboard</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </button>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic opacity-40">Seluruh data yang Anda masukkan dilindungi oleh enkripsi Sagara System.</p>
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
      console.log("LearningPage: Initializing...");
      // 1. Check Auth
      const authed = localStorage.getItem("luma-auth") === "true";
      if (!authed) {
        console.log("LearningPage: Not authed, redirecting to login");
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
          console.log("LearningPage: Found local profile ->", localProfile.email);
          
          const freshProfile = await getProfileByEmail(localProfile.email);
          if (freshProfile) {
            console.log("LearningPage: Fresh profile loaded. Completed?", freshProfile.profile_completed);
            setUser(freshProfile);
            localStorage.setItem("luma-user-profile", JSON.stringify(freshProfile));
          } else {
            console.warn("LearningPage: Could not find fresh profile in DB, using local.");
            setUser(localProfile);
          }
        } else {
          console.warn("LearningPage: No profile in localStorage, redirecting.");
          router.push("/login");
        }
      } catch (err) {
        console.error("LearningPage: Init Error:", err);
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
     console.log("LearningPage: Onboarding complete! Redirecting to System...");
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

  if (!user) {
    console.warn("LearningPage: Render check failed, user is null");
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Gagal memuat sesi. Mohon <button onClick={() => router.push('/login')} className="underline">Login Ulang</button>.</p>
      </div>
    );
  }

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
