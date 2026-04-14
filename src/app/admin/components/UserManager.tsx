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
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
        <div>
           <h3 className="text-xl font-black text-slate-800">Daftar Pengguna</h3>
           <p className="text-slate-500 text-sm font-medium">Total {profiles.length} user terdaftar.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProfile({
              email: "",
              full_name: "",
              gender: "Laki-laki",
              phone: "",
              is_admin: false,
              is_premium: false,
              unlocked_materials: [],
              unlocked_levels: [],
            } as any);
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm shadow-xl active:scale-95 transition"
        >
          TAMBAH USER
        </button>
      </div>

      <div className="grid gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition group">
            <div className="flex items-center gap-6">
               <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg ${profile.is_admin ? 'bg-slate-900' : 'bg-teal-500'}`}>
                 {profile.full_name.charAt(0)}
               </div>
               <div>
                 <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800">{profile.full_name}</h4>
                    {profile.is_admin && <span className="bg-slate-900 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Admin</span>}
                    {profile.is_premium && <span className="bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Premium</span>}
                 </div>
                 <p className="text-xs text-slate-400 font-medium">{profile.email} • {profile.phone}</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => { setEditingProfile(profile); setIsModalOpen(true); }}
                 className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-teal-50 hover:text-teal-600 transition"
               >
                 ✏️
               </button>
               <button 
                 onClick={() => profile.id && handleDelete(profile.id)}
                 className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition"
               >
                 🗑️
               </button>
            </div>
          </div>
        ))}
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
                     <div className="flex gap-4 p-2 bg-slate-50 rounded-2xl">
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({...editingProfile, is_admin: !editingProfile.is_admin})}
                          className={`flex-1 py-3 rounded-xl font-black text-xs transition ${editingProfile.is_admin ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                        >
                           ADMIN STATUS
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({...editingProfile, is_premium: !editingProfile.is_premium})}
                          className={`flex-1 py-3 rounded-xl font-black text-xs transition ${editingProfile.is_premium ? 'bg-amber-500 text-white' : 'text-slate-400'}`}
                        >
                           PREMIUM ACCESS
                        </button>
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
    </div>
  );
}
