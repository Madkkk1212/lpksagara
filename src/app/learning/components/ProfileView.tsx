import { useState, useEffect } from "react";
import { Profile, ProfileField, ProfileValue } from "@/lib/types";
import { upsertProfile, getProfileFields, getProfileValuesByUserId, upsertProfileValue } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileView({ user, onRefreshUser }: { user: Profile, onRefreshUser?: () => void }) {
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
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const [coreData, setCoreData] = useState({
    full_name: user.full_name || "",
    nickname: user.nickname || "",
    gender: user.gender || "Laki-laki",
    phone: user.phone || "",
    birth_date: user.birth_date || "",
    institution: user.institution || "",
    address: user.address || "",
    target_level: user.target_level || "",
  });

  useEffect(() => {
    setCoreData({
      full_name: user.full_name || "",
      nickname: user.nickname || "",
      gender: user.gender || "Laki-laki",
      phone: user.phone || "",
      birth_date: user.birth_date || "",
      institution: user.institution || "",
      address: user.address || "",
      target_level: user.target_level || "",
    });
  }, [user]);

  const handleCoreUpdate = async () => {
    setLoading(true);
    try {
      await upsertProfile({ 
        ...user, 
        ...coreData, 
        profile_completed: true 
      });
      alert("Profil berhasil diperbarui!");
      if (onRefreshUser) onRefreshUser();
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

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
                   ) : fields.filter(f => f.type === 'file').length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                         {fields.filter(f => f.type === 'file').sort((a,b) => (a.sort_order||0)-(b.sort_order||0)).map((field) => {
                            const val = values.find(v => v.field_id === field.id)?.value;
                             const isFilled = !!val;
                             const isUploading = uploadingFieldId === field.id;
                             const localVal = localValues[field.id] || "";

                             return (
                                <div key={field.id} className="space-y-4">
                                   <div className="flex items-center justify-between ml-2">
                                      <div>
                                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{field.name}</span>
                                         <span className="block mt-0.5 text-[8px] font-bold text-slate-400 uppercase">
                                            (Format: {field.allowed_file_types?.join(', ') || 'Bebas'})
                                         </span>
                                      </div>
                                      <div className="flex gap-2 items-start">
                                         <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${field.is_required ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                            {field.is_required ? 'Wajib' : 'Opsional'}
                                         </span>
                                      </div>
                                   </div>

                                   <div className={`relative border-2 rounded-[2rem] p-6 transition-all ${isFilled ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50 border-slate-100 border-dashed hover:border-indigo-200 shadow-inner'}`}>
                                      <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-5 overflow-hidden">
                                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl ${isFilled ? 'bg-white shadow-md' : 'bg-slate-100 opacity-40'}`}>
                                               {isFilled ? (val.startsWith('data:image') ? <img src={val} className="h-full w-full object-cover rounded-2xl" alt="preview"/> : '📄') : '📁'}
                                            </div>
                                            <div className="overflow-hidden">
                                               <h6 className={`text-sm font-black truncate ${isFilled ? 'text-emerald-700' : 'text-slate-400 opacity-60'}`}>
                                                  {isFilled ? 'File Terunggah' : 'Menunggu Berkas'}
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
                                                 className={`text-[9px] font-black uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors ${isFilled ? 'text-indigo-400' : 'text-slate-400 underline'}`}
                                               >
                                                  {isUploading ? 'PROSES...' : isFilled ? 'UBAH DATA' : 'KLIK UNTUK UNGGAH'}
                                               </label>
                                            </div>
                                         </div>
                                         {isFilled && !isUploading && (
                                            <div className="h-10 w-10 bg-emerald-500 text-white rounded-[1.25rem] shadow-lg flex items-center justify-center text-lg animate-in zoom-in-50">✓</div>
                                         )}
                                         {isUploading && (
                                            <div className="h-10 w-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
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
                      Pilih file sesuai format yang diminta (maksimal 2MB). Pastikan berkas terlihat jelas dan asli.
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
