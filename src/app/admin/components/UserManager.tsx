"use client";

import { useState, useEffect } from "react";
import { getProfiles, upsertProfile, deleteProfile, getMaterials, getExamLevels } from "@/lib/db";
import { Profile, Material, ExamLevel } from "@/lib/types";

export default function UserManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [levels, setLevels] = useState<ExamLevel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pData, mData, lData] = await Promise.all([
      getProfiles(),
      getMaterials(),
      getExamLevels()
    ]);
    setProfiles(pData);
    setMaterials(mData);
    setLevels(lData);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    
    try {
      await upsertProfile(editingProfile);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan profile");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus user ini?")) {
      await deleteProfile(id);
      fetchData();
    }
  };

  const toggleMaterial = (id: string) => {
    if (!editingProfile) return;
    const current = editingProfile.unlocked_materials || [];
    const updated = current.includes(id) 
      ? current.filter(mId => mId !== id) 
      : [...current, id];
    setEditingProfile({ ...editingProfile, unlocked_materials: updated });
  };

  const toggleLevel = (id: string) => {
    if (!editingProfile) return;
    const current = editingProfile.unlocked_levels || [];
    const updated = current.includes(id) 
      ? current.filter(lId => lId !== id) 
      : [...current, id];
    setEditingProfile({ ...editingProfile, unlocked_levels: updated });
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse italic">Loading database...</div>;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 border border-slate-200 rounded-2xl shadow-sm gap-4">
        <div>
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">User Registry</h3>
           <p className="text-slate-500 text-xs font-semibold mt-1">Total {profiles.length} Active System Users</p>
        </div>
        <button 
          onClick={() => {
            setEditingProfile({
              email: "",
              full_name: "",
              gender: "Laki-laki",
              phone: "",
              is_admin: false,
              is_teacher: false,
              is_premium: false,
              staff_password: "",
              unlocked_materials: [],
              unlocked_levels: [],
              birth_date: "",
              address: "",
              institution: "",
              certificate_url: "",
              avatar_url: "",
              profile_completed: false,
            } as any);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-600 hover:text-white rounded-xl shadow-sm hover:shadow transition-all"
        >
          + Provision User
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">ID / Identity</th>
                <th className="px-6 py-4">Clearance</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map(profile => (
                <tr key={profile.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          profile.full_name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{profile.full_name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 font-mono">{profile.id?.split('-')[0]}...</p>
                          {profile.profile_completed && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 font-bold uppercase rounded">Verified</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {profile.is_admin ? <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase">Admin</span> : null}
                      {profile.is_teacher ? <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase">Teacher</span> : null}
                      {profile.is_premium ? <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase">Premium</span> : <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase">Standard</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm text-slate-700 font-medium">{profile.email}</p>
                     <p className="text-xs text-slate-500 font-mono mt-1">{profile.phone || 'NO_PHONE_RECORDED'}</p>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                     <button 
                       onClick={() => setViewingProfile(profile)}
                       className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg shadow-sm transition-all text-xs font-bold"
                     >
                       Info
                     </button>
                     <button 
                       onClick={() => { setEditingProfile(profile); setIsModalOpen(true); }}
                       className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg shadow-sm transition-all text-xs font-bold"
                     >
                       Edit
                     </button>
                     <button 
                       onClick={() => profile.id && handleDelete(profile.id)}
                       className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg shadow-sm transition-all text-xs font-bold"
                     >
                       Delete
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <h3 className="text-2xl font-black text-slate-800">Edit Akses Pengguna</h3>
               <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition text-xl">✕</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                     <label className="text-xs font-black uppercase tracking-widest text-slate-400">Basic Info</label>
                     <input 
                       className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                       placeholder="Nama Lengkap"
                       value={editingProfile.full_name}
                       onChange={e => setEditingProfile({...editingProfile, full_name: e.target.value})}
                       required
                     />
                     <input 
                       className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                       placeholder="Email"
                       value={editingProfile.email}
                       onChange={e => setEditingProfile({...editingProfile, email: e.target.value})}
                       required
                       type="email"
                     />
                     <input 
                       className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                       placeholder="No HP"
                       value={editingProfile.phone}
                       onChange={e => setEditingProfile({...editingProfile, phone: e.target.value})}
                       required
                     />
                     
                     {(editingProfile.is_admin || editingProfile.is_teacher) && (
                       <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
                         <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-2">Staff Portal Password</label>
                         <input 
                           className="w-full px-4 py-3 rounded-xl bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition font-mono text-sm tracking-widest placeholder:text-emerald-300/50"
                           placeholder="••••••••"
                           type="password"
                           value={editingProfile.staff_password || ""}
                           onChange={e => setEditingProfile({...editingProfile, staff_password: e.target.value})}
                           required
                         />
                         <p className="text-[9px] text-emerald-600/70 font-bold uppercase mt-2">Required for /manajemen-sagara access</p>
                       </div>
                     )}
                     <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl flex-wrap">
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({...editingProfile, is_admin: !editingProfile.is_admin})}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition min-w-[120px] ${editingProfile.is_admin ? 'bg-slate-900 text-white' : 'text-slate-400 bg-white border border-slate-100'}`}
                        >
                           ADMIN STATUS
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newIsTeacher = !editingProfile.is_teacher;
                            setEditingProfile({
                              ...editingProfile, 
                              is_teacher: newIsTeacher,
                              is_premium: newIsTeacher ? true : editingProfile.is_premium // Ensure teachers are premium
                            });
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition min-w-[120px] ${editingProfile.is_teacher ? 'bg-emerald-500 text-white' : 'text-slate-400 bg-white border border-slate-100'}`}
                        >
                           TEACHER STATUS
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({...editingProfile, is_premium: !editingProfile.is_premium})}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition min-w-[120px] ${editingProfile.is_premium ? 'bg-amber-500 text-white' : 'text-slate-400 bg-white border border-slate-100'}`}
                        >
                           PREMIUM ACCESS
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({...editingProfile, profile_completed: !editingProfile.profile_completed})}
                          className={`flex-1 py-3 px-4 rounded-xl font-black text-xs transition min-w-[120px] ${editingProfile.profile_completed ? 'bg-teal-500 text-white' : 'text-slate-400 bg-white border border-slate-100'}`}
                        >
                           DATA VERIFIED
                        </button>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Onboarding Data</label>
                        <div className="grid grid-cols-2 gap-4">
                          <input type="date" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-800 outline-none transition font-bold text-sm" value={editingProfile.birth_date || ""} onChange={e => setEditingProfile({...editingProfile, birth_date: e.target.value})} />
                          <input placeholder="Institusi (Sekolah/Kerja)" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-800 outline-none transition font-bold text-sm" value={editingProfile.institution || ""} onChange={e => setEditingProfile({...editingProfile, institution: e.target.value})} />
                        </div>
                        <textarea placeholder="Alamat Lengkap" rows={2} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-slate-800 outline-none transition font-bold text-sm resize-none" value={editingProfile.address || ""} onChange={e => setEditingProfile({...editingProfile, address: e.target.value})} />
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div>
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Manual Material Unlock</label>
                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 bg-slate-50 rounded-2xl">
                           {materials.map(mat => (
                              <button 
                                key={mat.id}
                                type="button"
                                onClick={() => mat.id && toggleMaterial(mat.id)}
                                className={`p-3 rounded-xl text-left text-xs font-bold transition ${(editingProfile.unlocked_materials || []).includes(mat.id) ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 border border-slate-100'}`}
                              >
                                {mat.title}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Manual Level Unlock</label>
                        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-2xl">
                           {levels.map(lvl => (
                              <button 
                                key={lvl.id}
                                type="button"
                                onClick={() => lvl.id && toggleLevel(lvl.id)}
                                className={`p-3 rounded-xl text-center text-xs font-black transition ${(editingProfile.unlocked_levels || []).includes(lvl.id) ? 'bg-indigo-500 text-white' : 'bg-white text-slate-600 border border-slate-100'}`}
                              >
                                {lvl.level_code.toUpperCase()}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition text-lg mt-10">SIMPAN PERUBAHAN PROFILE</button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL (INFO) */}
      {viewingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingProfile(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-800">User Identity Record</h3>
               <button onClick={() => setViewingProfile(null)} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition font-bold">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-6">
                  <div className="h-24 w-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                     {viewingProfile.avatar_url ? (
                        <img src={viewingProfile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                     ) : (
                        <span className="text-3xl font-bold text-slate-400">{viewingProfile.full_name.charAt(0)}</span>
                     )}
                  </div>
                  <div>
                     <h4 className="text-2xl font-black text-slate-900">{viewingProfile.full_name}</h4>
                     <p className="text-slate-500 text-sm font-medium mb-3">{viewingProfile.email}</p>
                     <div className="flex gap-2">
                        {viewingProfile.profile_completed ? (
                           <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-1 rounded font-bold uppercase border border-teal-100">Profile Verified</span>
                        ) : (
                           <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-1 rounded font-bold uppercase border border-rose-100">Incomplete</span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold uppercase">{viewingProfile.phone || 'NO PHONE'}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Tanggal Lahir</p>
                        <p className="text-sm font-bold text-slate-800">{viewingProfile.birth_date || '—'}</p>
                     </div>
                     <div className="bg-white p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Inst./Sekolah</p>
                        <p className="text-sm font-bold text-slate-800">{viewingProfile.institution || '—'}</p>
                     </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Alamat Lengkap</p>
                     <p className="text-sm font-bold text-slate-800">{viewingProfile.address || '—'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                     <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Sertifikat Kelulusan</p>
                     {viewingProfile.certificate_url ? (
                        <div className="rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-100">
                           <img src={viewingProfile.certificate_url} className="w-full object-contain" alt="certificate" />
                        </div>
                     ) : (
                        <p className="text-sm font-bold text-slate-400 italic">Tidak ada sertifikat terlampir.</p>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
