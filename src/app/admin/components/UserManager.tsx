"use client";

import { useState, useEffect } from "react";
import { getProfiles, upsertProfile, deleteProfile, getMaterials, getExamLevels, getTheme, updateTheme, getProfileById, getProfileFields, getProfileValuesByUserId, upsertProfileValue } from "@/lib/db";
import { Profile, Material, ExamLevel, AppTheme, ProfileField } from "@/lib/types";

export default function UserManager({ userProfile }: { userProfile: Profile | null }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [levels, setLevels] = useState<ExamLevel[]>([]);
  const [theme, setTheme] = useState<AppTheme | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [dynamicFields, setDynamicFields] = useState<ProfileField[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [nipPrefix, setNipPrefix] = useState<string>("R");
  const [isUpdatingPrefix, setIsUpdatingPrefix] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pData, mData, lData, tData] = await Promise.all([
      getProfiles(), 
      getMaterials(),
      getExamLevels(),
      getTheme()
    ]);
    setProfiles(pData);
    setMaterials(mData);
    setLevels(lData);
    setTheme(tData);
    if (tData?.nip_prefix) {
      setNipPrefix(tData.nip_prefix);
    }
    setLoading(false);
  };

  const loadFullProfile = async (id: string, mode: 'edit' | 'view') => {
    setIsDetailLoading(true);
    try {
      const [full, fields, values] = await Promise.all([
        getProfileById(id),
        getProfileFields(),
        getProfileValuesByUserId(id)
      ]);

      if (full) {
        // Map values to a record
        const valMap: Record<string, string> = {};
        values.forEach(v => { valMap[v.field_id] = v.value; });
        
        setDynamicFields(fields);
        setDynamicValues(valMap);

        if (mode === 'edit') {
          setEditingProfile(full);
          setIsModalOpen(true);
        } else {
          setViewingProfile(full);
        }
      }
    } catch (err) {
      alert("Gagal memuat detail profil.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const generateNIP = () => {
    const now = new Date();
    const dateStr = now.getFullYear().toString() + 
                    (now.getMonth() + 1).toString().padStart(2, '0') + 
                    now.getDate().toString().padStart(2, '0');
    
    const countToday = profiles.filter(p => {
       if (!p.created_at) return false;
       const d = new Date(p.created_at);
       return d.toDateString() === now.toDateString();
    }).length;

    const sequence = (countToday + 1).toString().padStart(3, '0');
    return `${nipPrefix}-${dateStr}-${sequence}`;
  };

  const updateGlobalPrefix = async () => {
    if (!theme) return;
    setIsUpdatingPrefix(true);
    try {
      await updateTheme({ id: theme.id, nip_prefix: nipPrefix });
      alert("NIP Prefix Updated Successfully!");
    } catch (err) {
      alert("Failed to update prefix");
    } finally {
      setIsUpdatingPrefix(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (!userProfile?.is_super_admin && p.is_admin) return false;
    if (roleFilter === "all") return true;
    if (roleFilter === "admin") return p.is_admin;
    if (roleFilter === "teacher") return p.is_teacher && !p.is_admin;
    if (roleFilter === "student") return p.is_student && !p.is_teacher && !p.is_admin;
    if (roleFilter === "alumni") return p.is_alumni && !p.is_teacher && !p.is_admin;
    if (roleFilter === "premium") return p.is_premium && !p.is_admin && !p.is_teacher;
    if (roleFilter === "standard") return !p.is_admin && !p.is_teacher && !p.is_premium && !p.is_student && !p.is_alumni;
    return true;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    
    try {
      const sanitized = { 
        ...editingProfile,
        birth_date: editingProfile.birth_date === "" ? null : editingProfile.birth_date,
      };
      
      await upsertProfile(sanitized);

      if (editingProfile.id) {
        for (const [fieldId, value] of Object.entries(dynamicValues)) {
          if (value) {
            await upsertProfileValue({
              user_id: editingProfile.id,
              field_id: fieldId,
              value: value
            });
          }
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Gagal menyimpan profile: " + (err.message || "Terjadi kesalahan tidak dikenal"));
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

  const getCount = (role: string) => {
    return profiles.filter(p => {
      if (!userProfile?.is_super_admin && p.is_admin) return false;
      if (role === "admin") return p.is_admin;
      if (role === "teacher") return p.is_teacher && !p.is_admin;
      if (role === "student") return p.is_student && !p.is_teacher && !p.is_admin;
      if (role === "alumni") return p.is_alumni && !p.is_teacher && !p.is_admin;
      if (role === "premium") return p.is_premium && !p.is_admin && !p.is_teacher;
      if (role === "standard") return !p.is_admin && !p.is_teacher && !p.is_premium && !p.is_student && !p.is_alumni;
      return true;
    }).length;
  };

  const tabs = [
    { id: "all", label: "Semua", count: userProfile?.is_super_admin ? profiles.length : profiles.filter(p => !p.is_admin).length },
    ...(userProfile?.is_super_admin ? [{ id: "admin", label: "Admin", count: getCount("admin") }] : []),
    { id: "teacher", label: "Guru", count: getCount("teacher") },
    { id: "student", label: "Murid", count: getCount("student") },
    { id: "alumni", label: "Alumni", count: getCount("alumni") },
    { id: "premium", label: "Premium", count: getCount("premium") },
    { id: "standard", label: "Umum", count: getCount("standard") },
  ];

  if (loading) return (
     <div className="p-20 text-center flex flex-col items-center gap-6">
        <div className="h-12 w-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="font-black text-slate-400 text-sm tracking-widest uppercase italic animate-pulse">Menghubungkan Sagara Database...</p>
     </div>
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-100">
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Registry Pengguna</h3>
            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider opacity-60">Pusat Manajemen Akses Sagara</p>
            
            {userProfile?.is_super_admin && (
              <div className="mt-4 flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 max-w-fit">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 md:ml-2">NIP Prefix:</span>
                 <input 
                   disabled={isUpdatingPrefix}
                   value={nipPrefix}
                   onChange={e => setNipPrefix(e.target.value.toUpperCase())}
                   className="w-12 md:w-16 px-2 py-1.5 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-xs font-bold text-center bg-white"
                 />
                 <button 
                   onClick={updateGlobalPrefix}
                   disabled={isUpdatingPrefix}
                   className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-slate-900 transition disabled:opacity-50"
                 >
                   {isUpdatingPrefix ? '...' : 'SAVE'}
                 </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchData}
              className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition active:scale-95 border border-slate-100 font-bold"
            >
              🔄
            </button>
            <button 
              onClick={() => {
                setEditingProfile({
                  email: "",
                  full_name: "",
                  gender: "Laki-laki",
                  phone: "",
                  nip: generateNIP(),
                  batch: "",
                  is_admin: false,
                  is_teacher: false,
                  is_premium: false,
                  is_student: true,
                  is_alumni: false,
                  password: "",
                  unlocked_materials: [],
                  unlocked_levels: [],
                  birth_date: null,
                  address: "",
                  institution: "",
                  certificate_url: "",
                  avatar_url: "",
                  profile_completed: false,
                } as any);
                setIsModalOpen(true);
              }}
              className="px-6 py-4 bg-slate-900 text-white font-black text-xs hover:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200 transition-all whitespace-nowrap active:scale-95 uppercase italic tracking-widest"
            >
              + Provision Account
            </button>
          </div>
        </div>

        <div className="px-6 md:px-8 py-2 overflow-x-auto bg-slate-50/50 flex items-center no-scrollbar">
          <div className="flex gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                  roleFilter === tab.id 
                    ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] ${
                  roleFilter === tab.id ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200/50 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
        {isDetailLoading && (
           <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500 overflow-hidden z-20">
              <div className="w-full h-full bg-indigo-200 animate-[shimmer_1.5s_infinite]" />
           </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">Identity / NIP</th>
                <th className="px-6 py-5">Kategori & Batch</th>
                <th className="px-6 py-5">Contact</th>
                <th className="px-6 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProfiles.map(profile => (
                <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">{profile.full_name}</h4>
                        <p className="text-[10px] text-slate-400 font-black tracking-widest mt-0.5 uppercase">
                          {profile.nip || 'NO_NIP_ASSIGNED'}
                        </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap items-center">
                       {profile.is_admin ? (
                         <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm">Admin</span>
                       ) : profile.is_teacher ? (
                         <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm">Staff</span>
                       ) : profile.is_alumni ? (
                         <span className="bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm">Alumni</span>
                       ) : profile.is_student ? (
                         <span className="bg-teal-50 text-teal-700 border border-teal-100 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm">Murid</span>
                       ) : profile.is_premium ? (
                         <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm">Premium</span>
                       ) : (
                         <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-tighter shadow-sm">Umum</span>
                       )}
                       {profile.batch && (
                         <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest">
                            {profile.batch}
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-slate-700 font-bold">{profile.email}</p>
                     <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">{profile.phone || '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                     <button 
                       disabled={isDetailLoading}
                       onClick={() => profile.id && loadFullProfile(profile.id, 'view')}
                       className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-xl shadow-sm transition-all text-[10px] font-black uppercase disabled:opacity-50"
                     >
                       Info
                     </button>
                     <button 
                       disabled={isDetailLoading}
                       onClick={() => profile.id && loadFullProfile(profile.id, 'edit')}
                       className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition-all text-[10px] font-black uppercase disabled:opacity-50"
                     >
                       Edit
                     </button>
                     <button 
                       disabled={isDetailLoading}
                       onClick={() => profile.id && handleDelete(profile.id)}
                       className="px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-xl shadow-sm transition-all text-[10px] font-black uppercase disabled:opacity-50"
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
      {isModalOpen && editingProfile && !isDetailLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/20">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl">👤</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase italic">Manajemen Profil & Akses</h3>
                    <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">ID: {editingProfile.id || 'NEW_RECORD'}</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-white transition text-xl shadow-sm border border-slate-100">✕</button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar max-w-2xl mx-auto w-full">
               <div className="space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Identity Verification</label>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase text-indigo-600 ml-4 tracking-tighter">NIP (Dynamic Generation)</p>
                           <input 
                              readOnly={!userProfile?.is_super_admin}
                              className={`w-full px-6 py-4 rounded-2xl border-2 border-transparent outline-none transition font-black shadow-sm ${!userProfile?.is_super_admin ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:border-indigo-600 text-slate-900'}`}
                              placeholder="NIP"
                              value={editingProfile.nip || ""}
                              onChange={e => setEditingProfile({...editingProfile, nip: e.target.value.toUpperCase()})}
                           />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-tighter">Batch / Angkatan</p>
                           <input 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none transition font-bold shadow-sm"
                              placeholder="Contoh: Batch 12"
                              value={editingProfile.batch || ""}
                              onChange={e => setEditingProfile({...editingProfile, batch: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Personal Details</label>
                     <div className="grid grid-cols-2 gap-6">
                        <input 
                           className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                           placeholder="Nama Lengkap"
                           value={editingProfile.full_name}
                           onChange={e => setEditingProfile({...editingProfile, full_name: e.target.value})}
                           required
                        />
                        <input 
                           className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                           placeholder="Email Address"
                           value={editingProfile.email}
                           onChange={e => setEditingProfile({...editingProfile, email: e.target.value})}
                           required
                           type="email"
                        />
                     </div>
                     <input 
                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                        placeholder="Nomor Telepon / WhatsApp"
                        value={editingProfile.phone}
                        onChange={e => setEditingProfile({...editingProfile, phone: e.target.value})}
                        required
                     />
                  </div>

                  <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl group">
                     <label className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 block mb-3 italic">Set Access Password</label>
                     <div className="relative">
                       <input 
                         className="w-full px-6 py-4 rounded-2xl bg-white border border-indigo-200 focus:border-indigo-600 outline-none transition font-mono text-xl tracking-[0.3em] font-black shadow-sm"
                         placeholder="••••••••"
                         type={showPassword ? "text" : "password"}
                         value={editingProfile.password || ""}
                         onChange={e => setEditingProfile({...editingProfile, password: e.target.value})}
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-indigo-600 transition-colors"
                       >
                         {showPassword ? "👁️" : "👁️‍🗨️"}
                       </button>
                     </div>
                     <p className="text-[10px] text-indigo-600/70 font-bold uppercase mt-3 italic tracking-tight">Digunakan oleh user untuk masuk ke sistem Sagara.</p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Kategori Peran (Exclusive)</label>
                     <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {userProfile?.is_super_admin && (
                          <button 
                            type="button" 
                            onClick={() => setEditingProfile({
                              ...editingProfile, 
                              is_admin: !editingProfile.is_admin,
                              is_teacher: false, is_student: false, is_alumni: false
                            })}
                            className={`py-3 px-2 rounded-xl font-black text-[9px] transition uppercase tracking-widest ${editingProfile.is_admin ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 bg-white border border-slate-100 hover:bg-slate-50'}`}
                          >
                             ADMIN
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({
                            ...editingProfile, 
                            is_teacher: !editingProfile.is_teacher,
                            is_admin: false, is_student: false, is_alumni: false
                          })}
                          className={`py-3 px-2 rounded-xl font-black text-[9px] transition uppercase tracking-widest ${editingProfile.is_teacher ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 bg-white border border-slate-100 hover:bg-slate-50'}`}
                        >
                           GURU
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingProfile({...editingProfile, is_premium: !editingProfile.is_premium})}
                          className={`py-3 px-2 rounded-xl font-black text-[9px] transition uppercase tracking-widest ${editingProfile.is_premium ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 bg-white border border-slate-100 hover:bg-slate-50'}`}
                        >
                           PREMIUM
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newState = !editingProfile.is_student;
                            let updatedLevels = editingProfile.unlocked_levels || [];
                            
                            if (newState) {
                              // Auto-unlock N5 and N4
                              const n5n4 = levels.filter(l => 
                                l.level_code.toUpperCase() === "N5" || 
                                l.level_code.toUpperCase() === "N4"
                              ).map(l => l.id);
                              
                              // Add unique IDs
                              updatedLevels = Array.from(new Set([...updatedLevels, ...n5n4]));
                            }

                            setEditingProfile({ 
                              ...editingProfile, 
                              is_student: newState, 
                              unlocked_levels: updatedLevels,
                              is_alumni: false, is_teacher: false, is_admin: false
                            });
                          }}
                          className={`py-3 px-2 rounded-xl font-black text-[9px] transition uppercase tracking-widest ${editingProfile.is_student ? 'bg-teal-500 text-white shadow-lg' : 'text-slate-400 bg-white border border-slate-100 hover:bg-slate-50'}`}
                        >
                           MURID
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingProfile({ 
                              ...editingProfile, 
                              is_alumni: !editingProfile.is_alumni, 
                              is_student: false, is_teacher: false, is_admin: false
                            });
                          }}
                          className={`py-3 px-2 rounded-xl font-black text-[9px] transition uppercase tracking-widest ${editingProfile.is_alumni ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 bg-white border border-slate-100 hover:bg-slate-50'}`}
                        >
                           ALUMNI
                        </button>
                     </div>
                  </div>
               </div>

               <div className="pt-10 flex gap-4 sticky bottom-0 bg-white/80 backdrop-blur-md pb-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition text-[11px] uppercase tracking-widest">CANCEL</button>
                  <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition text-[11px] tracking-[0.3em] uppercase italic">Update Identity Access</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL (INFO) */}
      {viewingProfile && !isDetailLoading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setViewingProfile(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col scale-in-center overflow-y-auto custom-scrollbar">
            <div className="p-10 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative">
               <button onClick={() => setViewingProfile(null)} className="absolute top-8 right-8 h-12 w-12 border border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/10 transition">✕</button>
               
               <div className="flex flex-col items-center text-center">
                  <div className="h-28 w-28 bg-white/10 rounded-[2.5rem] p-1 border border-white/20 mb-6 group overflow-hidden">
                     {viewingProfile.avatar_url ? (
                        <img src={viewingProfile.avatar_url} className="w-full h-full object-cover rounded-[2rem]" alt="avatar" />
                     ) : (
                        <div className="w-full h-full bg-indigo-500 rounded-[2rem] flex items-center justify-center text-3xl font-black">{viewingProfile.full_name.charAt(0)}</div>
                     )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">{viewingProfile.nip || 'NO_NIP'}</p>
                  <h3 className="text-3xl font-black tracking-tight">{viewingProfile.full_name}</h3>
                  <div className="flex gap-3 mt-4">
                     <span className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider">{viewingProfile.batch || 'Tanpa Angkatan'}</span>
                  </div>
               </div>
            </div>
            
            <div className="p-10 space-y-8 bg-white">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Phone / WA</p>
                     <p className="text-sm font-bold text-slate-800">{viewingProfile.phone || '—'}</p>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Institution</p>
                     <p className="text-sm font-bold text-slate-800">{viewingProfile.institution || '—'}</p>
                  </div>
               </div>
               
               {viewingProfile.address && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Full Address</p>
                     <p className="text-sm font-bold text-slate-800 leading-relaxed italic">"{viewingProfile.address}"</p>
                  </div>
               )}

               {viewingProfile.certificate_url && (
                  <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Global Certificate</p>
                     <div className="relative group rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-sm aspect-video bg-slate-900/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                        <img src={viewingProfile.certificate_url} alt="cert" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                           <a href={viewingProfile.certificate_url} download={`sertifikat-${viewingProfile.full_name}.jpg`} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-2xl">Download / View Full</a>
                        </div>
                     </div>
                  </div>
               )}

               {/* Dynamic Supporting Data Sections */}
               {(() => {
                  const role = viewingProfile.is_admin ? 'admin' : 
                               viewingProfile.is_teacher ? 'teacher' : 
                               viewingProfile.is_alumni ? 'alumni' : 
                               viewingProfile.is_student ? 'student' : 
                               viewingProfile.is_premium ? 'premium' : 'standard';

                  const roleFields = dynamicFields.filter(f => f.target_role === 'all' || f.target_role === role);

                  if (roleFields.length === 0) return null;

                  return (
                     <div className="space-y-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between px-2">
                           <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Data Penunjang (Dynamic)</p>
                           <span className="text-[9px] font-bold text-slate-300 uppercase italic">Role: {role}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {roleFields.map(field => {
                              const value = dynamicValues[field.id];
                              return (
                                 <div key={field.id} className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.name}</label>
                                    
                                    {value ? (
                                       field.type === 'file' ? (
                                          <div className="relative group rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video shadow-sm">
                                             {value.startsWith('data:image') ? (
                                                <img src={value} alt={field.name} className="w-full h-full object-contain" />
                                             ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-400">
                                                   <span className="text-3xl mb-2">📄</span>
                                                   <span className="text-[9px] font-black uppercase">Document File</span>
                                                </div>
                                             )}
                                             <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-4">
                                                <a href={value} download={`${field.name}-${viewingProfile.full_name}.jpg`} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase shadow-xl whitespace-nowrap">Download / View</a>
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                                             <p className="text-sm font-bold text-slate-800">{value}</p>
                                          </div>
                                       )
                                    ) : (
                                       <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center opacity-60">
                                          <span className="text-xl mb-1 grayscale opacity-30">⏳</span>
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Belum diisi oleh siswa</p>
                                          {field.is_required && <p className="text-[8px] text-rose-300 font-bold uppercase mt-1">(Wajib)</p>}
                                       </div>
                                    )}
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  );
               })()}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
