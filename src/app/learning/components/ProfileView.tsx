import { useState, useEffect } from "react";
import { Profile, ProfileField, ProfileValue } from "@/lib/types";
import { upsertProfile, getProfileFields, getProfileValuesByUserId, upsertProfileValue } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileView({ user }: { user: Profile }) {
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [values, setValues] = useState<ProfileValue[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingFieldId, setUploadingFieldId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!user.id) return;
      const role = user.is_student ? 'student' : user.is_alumni ? 'alumni' : 'all';
      const [f, v] = await Promise.all([
        getProfileFields(role),
        getProfileValuesByUserId(user.id!)
      ]);
      setFields(f);
      setValues(v);
    } catch (err) {
      console.error("ProfileView: Fetch Error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert("Hanya file gambar yang diperbolehkan.");
       return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File foto profil maksimal 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
       try {
          const base64 = reader.result as string;
          await upsertProfile({ ...user, avatar_url: base64 });
          alert("Foto profil berhasil diperbarui!");
          window.location.reload(); // Refresh to update all UI parts
       } catch (err) {
          console.error("Avatar Upload Error:", err);
          alert("Gagal memperbarui foto profil.");
       } finally {
          setUploadingAvatar(false);
       }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: ProfileField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (field.allowed_file_types && field.allowed_file_types.length > 0) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !field.allowed_file_types.includes(ext)) {
        alert(`Tipe file tidak valid. Diperbolehkan: ${field.allowed_file_types.join(', ')}`);
        return;
      }
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File terlalu besar. Maksimal 2MB.");
      return;
    }

    setUploadingFieldId(field.id);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        await upsertProfileValue({
          user_id: user.id!,
          field_id: field.id,
          value: base64
        });
        alert(`${field.name} berhasil diunggah!`);
        await fetchData(); // Refresh data
      } catch (err) {
        console.error("Upload Error:", err);
        alert("Gagal mengunggah berkas.");
      } finally {
        setUploadingFieldId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword.length < 4) {
      alert("Password minimal 4 karakter.");
      return;
    }

    setLoading(true);
    try {
      await upsertProfile({ ...user, password: newPassword });
      alert("Password berhasil diubah!");
      setIsChangingPass(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert("Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  };

  const [activeSubView, setActiveSubView] = useState<"menu" | "identitas" | "berkas">("menu");

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {activeSubView === "menu" ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            <h3 className="text-2xl font-black italic text-slate-800 text-center uppercase tracking-tighter">Pengelolaan Akun</h3>

            {/* Profile Header Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 -mr-16 -mt-16 rounded-full opacity-50 blur-2xl" />
              <div className="relative">
                <div className={`h-32 w-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center font-black text-4xl text-slate-300 overflow-hidden ring-4 ring-slate-50 transition-all ${uploadingAvatar ? 'opacity-50 grayscale' : ''}`}>
                   {user.avatar_url ? (
                      <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
                   ) : (
                      user.full_name.charAt(0)
                   )}
                   {uploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                   )}
                </div>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload}
                />
                <label 
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 h-10 w-10 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-center text-sm border-2 border-white hover:scale-110 cursor-pointer transition active:scale-95"
                >
                   📷
                </label>
              </div>

              <div className="text-center">
                  <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight">{user.full_name}</h4>
                  <div className="flex items-center gap-2 justify-center mt-1">
                     <span className="h-2 w-2 rounded-full bg-emerald-500" />
                     <p className="text-sm font-bold text-slate-400 font-mono tracking-tighter">{user.email}</p>
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Menu items as buttons */}
              {[
                { id: "identitas", label: "Identitas Diri", desc: "Data kependudukan & Institusi", icon: "🆔", color: "bg-indigo-50", text: "text-indigo-600" },
                { id: "berkas", label: "Berkas Pendukung", desc: "KTP, Foto, & Dokumen lainnya", icon: "📂", color: "bg-emerald-50", text: "text-emerald-600" },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveSubView(item.id as any)}
                  className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all flex items-center justify-between group overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-indigo-500 transition-colors" />
                  <div className="flex items-center gap-6">
                    <div className={`h-14 w-14 rounded-2xl ${item.color} flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <h5 className="font-black text-slate-800 text-sm tracking-tight italic uppercase">{item.label}</h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-slate-200 text-2xl font-bold group-hover:text-slate-500 transition-colors">→</span>
                </button>
              ))}

              <button 
                onClick={() => setIsChangingPass(true)}
                className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all flex items-center justify-between group overflow-hidden relative"
              >
                 <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-rose-500 transition-colors" />
                 <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform text-slate-400">🔑</div>
                    <div className="text-left">
                       <h5 className="font-black text-slate-800 text-sm tracking-tight italic uppercase">Keamanan Password</h5>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ubah kata sandi akun Anda secara berkala</p>
                    </div>
                 </div>
                 <span className="text-slate-200 text-2xl font-bold group-hover:text-slate-500 transition-colors">→</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <button 
              onClick={() => setActiveSubView("menu")}
              className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-slate-800 transition-colors ml-4"
            >
              ← KEMBALI KE MENU PROFIL
            </button>

            {activeSubView === "identitas" && (
              <section className="space-y-6">
                <div className="text-center mb-8 pt-4">
                  <div className="h-16 w-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-indigo-100">🆔</div>
                  <h4 className="text-2xl font-black text-slate-800 italic uppercase">Identitas Diri</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status data kependudukan terverifikasi</p>
                </div>
                
                <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[
                        { label: "Tanggal Lahir", value: user.birth_date, icon: "📅" },
                        { label: "Institusi", value: user.institution, icon: "🏢" },
                        { label: "Alamat KTP", value: user.address, icon: "📍" },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-2">{item.label}</label>
                           <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 flex items-center gap-4">
                              <span className="text-2xl">{item.icon}</span>
                              <span className="text-sm font-bold text-slate-700 truncate">{item.value || 'Belum diisi'}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </section>
            )}

            {activeSubView === "berkas" && (
              <section className="space-y-6">
                <div className="text-center mb-8 pt-4">
                  <div className="h-16 w-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl shadow-emerald-100">📂</div>
                  <h4 className="text-2xl font-black text-slate-800 italic uppercase">Berkas Pendukung</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lampiran dokumen fisik di Database Sagara</p>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
                   {loadingData ? (
                      <div className="flex items-center justify-center p-20">
                         <div className="h-10 w-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                      </div>
                   ) : fields.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {fields.map((field) => {
                            const val = values.find(v => v.field_id === field.id)?.value;
                            const isFilled = !!val;
                            const isUploading = uploadingFieldId === field.id;

                            return (
                               <div key={field.id} className="space-y-2">
                                  <div className="flex items-center justify-between ml-2">
                                     <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{field.name}</span>
                                     <div className="flex gap-2">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${field.is_required ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                           {field.is_required ? 'Wajib' : 'Opsional'}
                                        </span>
                                     </div>
                                  </div>

                                  <div className={`relative border rounded-[1.5rem] p-5 transition-all ${isFilled ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-4 overflow-hidden">
                                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-2xl ${isFilled ? 'bg-white shadow-sm' : 'bg-slate-100 opacity-40'}`}>
                                             {isFilled ? (val.startsWith('data:image') ? <img src={val} className="h-full w-full object-cover rounded-xl" alt="preview"/> : '📄') : '📁'}
                                          </div>
                                          <div className="overflow-hidden">
                                             <h6 className={`text-sm font-black truncate ${isFilled ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                {isFilled ? 'File Terverifikasi' : 'Berkas Belum Ada'}
                                             </h6>
                                             <input 
                                               type="file" 
                                               id={`upload-${field.id}`}
                                               className="hidden"
                                               onChange={e => handleFileUpload(e, field)}
                                               accept={field.allowed_file_types?.map(t => `.${t}`).join(',')}
                                             />
                                             <label 
                                               htmlFor={`upload-${field.id}`}
                                               className={`text-[9px] font-black uppercase tracking-widest cursor-pointer hover:underline ${isFilled ? 'text-indigo-500' : 'text-slate-500'}`}
                                             >
                                                {isUploading ? 'SEDANG MENGUNGGAH...' : isFilled ? 'GANTI BERKAS' : 'UNGGAH SEKARANG'}
                                             </label>
                                          </div>
                                       </div>
                                       {isFilled && !isUploading && (
                                          <div className="h-8 w-8 bg-emerald-500 text-white rounded-xl shadow-lg flex items-center justify-center text-xs">✓</div>
                                       )}
                                       {isUploading && (
                                          <div className="h-8 w-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                       )}
                                    </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   ) : (
                      <p className="text-center text-xs font-bold text-slate-400 uppercase italic py-10">Tidak ada berkas tambahan yang diperlukan.</p>
                   )}
                </div>
                <div className="p-8 bg-indigo-50/30 rounded-[2rem] border border-indigo-50/50 text-center">
                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-relaxed">
                     Pilih file (JPG/PDF) maksimal 2MB. Pastikan berkas terlihat jelas dan asli.
                   </p>
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsChangingPass(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
             <h3 className="text-2xl font-black text-slate-800 mb-2 italic">Ubah Password</h3>
             <p className="text-slate-400 text-xs font-medium mb-8 uppercase tracking-widest">Masukkan password baru Anda di bawah ini.</p>
             
             <form onSubmit={handlePasswordChange} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Password Baru</label>
                    <div className="relative">
                       <input 
                         type={showPassword ? "text" : "password"}
                         required
                         className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition font-bold"
                         value={newPassword}
                         onChange={e => setNewPassword(e.target.value)}
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                       >
                         {showPassword ? "👁️" : "👁️‍🗨️"}
                       </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Konfirmasi Password</label>
                    <div className="relative">
                       <input 
                         type={showPassword ? "text" : "password"}
                         required
                         className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition font-bold"
                         value={confirmPassword}
                         onChange={e => setConfirmPassword(e.target.value)}
                       />
                    </div>
                 </div>
                
                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => setIsChangingPass(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs transition-all">BATAL</button>
                   <button type="submit" disabled={loading} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all">
                      {loading ? 'MENYIMPAN...' : 'SIMPAN PASSWORD'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
