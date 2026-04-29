"use client";

import { useState, useEffect } from "react";
import { 
  getProfiles, 
  deleteProfile, 
  upsertProfile, 
  getProfileFields, 
  getProfileValuesByUserId, 
  upsertProfileValue,
  getStudyLevels,
  getStudentBatches,
  getTeacherStudents,
  assignStudentToTeacher,
  removeStudentFromTeacher
} from "@/lib/db";
import { Profile, ProfileField, StudyLevel, StudentBatch } from "@/lib/types";
import { exportToExcel, exportToPDF } from "@/lib/ExportUtils";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText } from "lucide-react";

export default function UserManager({ user: userProfile, initialRole = "all" }: { user: Profile, initialRole?: "all" | "admin" | "teacher" | "student" | "alumni" }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "admin" | "teacher" | "student" | "alumni">(initialRole);
  
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<ProfileField[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [batches, setBatches] = useState<StudentBatch[]>([]);
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  const [managingTeacherStudents, setManagingTeacherStudents] = useState<Profile | null>(null);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    fetchProfiles();
    getProfileFields('all').then(setDynamicFields);
    getStudyLevels().then(setLevels);
    getStudentBatches().then(setBatches);
  const filtered = profiles.filter(p => {
    if (!userProfile.is_super_admin && (p.is_admin || p.is_super_admin)) {
      if (p.email !== userProfile.email) return false;
    }

    const matchesSearch = 
      p.full_name.toLowerCase().includes(search.toLowerCase()) || 
      p.email.toLowerCase().includes(search.toLowerCase()) || 
      p.nip?.toLowerCase().includes(search.toLowerCase());
    
    const matchesBatch = filterBatch === "all" || p.batch === filterBatch;
    const matchesLevel = filterLevel === "all" || p.target_level === filterLevel;
    
    if (filterRole === "all") return matchesSearch && matchesBatch && matchesLevel;
    if (filterRole === "admin") return matchesSearch && p.is_admin && matchesBatch && matchesLevel;
    if (filterRole === "teacher") return matchesSearch && p.is_teacher && matchesBatch && matchesLevel;
    if (filterRole === "alumni") return matchesSearch && p.is_alumni && matchesBatch && matchesLevel;
    if (filterRole === "student") return matchesSearch && p.is_student && matchesBatch && matchesLevel;
    return matchesSearch && matchesBatch && matchesLevel;
  });

  const handleExportExcel = () => {
    const data = filtered.map(p => ({
      'NIP': p.nip || '-',
      'Nama Lengkap': p.full_name,
      'Email': p.email,
      'Telepon': p.phone || '-',
      'Batch': p.batch || '-',
      'Target Level': p.target_level || '-',
      'Admin': p.is_admin ? 'Ya' : 'Tidak',
      'Guru': p.is_teacher ? 'Ya' : 'Tidak',
      'Murid': p.is_student ? 'Ya' : 'Tidak',
      'Alumni': p.is_alumni ? 'Ya' : 'Tidak',
      'Premium': p.is_premium ? 'Ya' : 'Tidak'
    }));
    exportToExcel(data, `Data_User_${new Date().toISOString().split('T')[0]}`, 'User Data');
  };

  const handleExportPDF = () => {
    const columns = ['NIP', 'Nama Lengkap', 'Email', 'Telepon', 'Batch'];
    const rows = filtered.map(p => [
      p.nip || '-',
      p.full_name,
      p.email,
      p.phone || '-',
      p.batch || '-'
    ]);
    exportToPDF('Data User LPK Sagara', columns, rows, `Data_User_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">User Database</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Total Active Users: {profiles.length}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="bg-white p-1 rounded-2xl border border-slate-100 flex gap-1 shadow-sm overflow-hidden">
              {(userProfile.is_super_admin ? ["all", "admin", "teacher", "student", "alumni"] : ["all", "teacher", "student", "alumni"]).map((r) => (
                 <button 
                  key={r}
                  onClick={() => setFilterRole(r as "all" | "admin" | "teacher" | "student" | "alumni")}
                  className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${filterRole === r ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                    {r}
                 </button>
              ))}
           </div>

           <div className="relative group">
              <input 
                type="text" 
                placeholder="Cari Nama, Email, NIP..." 
                className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold w-full md:w-80 shadow-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
           </div>

           <select 
             value={filterBatch}
             onChange={e => setFilterBatch(e.target.value)}
             className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-500 outline-none transition-all"
           >
              <option value="all">Semua Batch</option>
              {Array.from(new Set([...batches.map(b => b.name), ...profiles.map(p => p.batch).filter(Boolean) as string[]])).sort().map(name => (
                 <option key={name} value={name}>{name}</option>
              ))}
           </select>

           <select 
             value={filterLevel}
             onChange={e => setFilterLevel(e.target.value)}
             className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm focus:border-indigo-500 outline-none transition-all"
           >
              <option value="all">Semua Level</option>
              {levels.map(l => (
                 <option key={l.id} value={l.level_code}>{l.level_code}</option>
              ))}
           </select>
           
           <button 
             onClick={() => {
               const d = new Date();
               const dateStr = `${d.getDate().toString().padStart(2, '0')}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getFullYear().toString().slice(-2)}`;
               const seq = (profiles.length + 1).toString().padStart(3, '0');
               const generatedNip = `R-${dateStr}-${seq}`;

               setEditingProfile({
                 nip: generatedNip,
                 email: "",
                 full_name: "",
                 password: "",
                 gender: "Laki-laki",
                 phone: "",
                 is_admin: false,
                 is_teacher: false,
                 is_student: true,
                 is_alumni: false,
                 is_premium: false,
                 unlocked_levels: [],
                 unlocked_materials: [],
                 exp: 0,
                 level: 1,
                 target_level: null,
                 avatar_url: null,
                 profile_completed: false, // NEW: must complete onboarding first
               } as any);
               setDynamicValues({});
               setIsModalOpen(true);
             }}
             className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-indigo-600"
           >
              + Tambah User
           </button>
            
            <div className="flex gap-2">
               <button onClick={handleExportExcel} className="px-4 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Export Excel">
                  <Download className="w-4 h-4" />
               </button>
               <button onClick={handleExportPDF} className="px-4 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Export PDF">
                  <FileText className="w-4 h-4" />
               </button>
            </div>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
             <div className="py-20 text-center">
                <p className="text-sm font-black text-slate-300 uppercase italic tracking-widest">Tidak ada murid yang ditemukan.</p>
             </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && editingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
           <div className="relative w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col scale-in-center">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-5">
                    <div className="h-16 w-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-3xl shadow-sm">🛡️</div>
                    <div className="space-y-0.5">
                       <h3 className="text-xl font-black text-slate-900 italic uppercase leading-none">{editingProfile.id ? "Edit User Profile" : "Tambah User"}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingProfile.id ? "Update data identitas & hak akses" : "Buat akun pengguna baru"}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-white transition shadow-sm">✕</button>
              </div>

              <form onSubmit={handleAdminUpdate} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                  {editingProfile.id && (
                    <div className="flex items-center gap-10 bg-slate-50 p-8 rounded-[3rem]">
                       <div className="relative group">
                          <div className="h-32 w-32 rounded-[2.5rem] bg-white border-4 border-white shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-slate-100">
                             {editingProfile.avatar_url ? (
                                <img src={editingProfile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                             ) : (
                                <span className="text-sm">{editingProfile.full_name?.charAt(0) || "U"}</span>
                             )}
                          </div>
                          <input type="file" id="admin-pfp" className="hidden" accept="image/*" onChange={handleAdminAvatarChange} />
                          <label htmlFor="admin-pfp" className="absolute -bottom-2 -right-2 h-10 w-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition">📷</label>
                       </div>
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Profile Photo</p>
                       </div>
                    </div>
                  )}

                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Identity Verification</label>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase text-indigo-600 ml-4 tracking-tighter">NIP (Dynamic Generation)</p>
                           <input 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none transition font-black shadow-sm text-slate-900"
                              placeholder="NIP"
                              value={editingProfile.nip || ""}
                              onChange={e => setEditingProfile({...editingProfile, nip: e.target.value.toUpperCase()})}
                           />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-tighter">Batch / Angkatan</p>
                           <select 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none transition font-bold shadow-sm"
                              value={editingProfile.batch || ""}
                              onChange={e => setEditingProfile({...editingProfile, batch: e.target.value})}
                           >
                              <option value="">Pilih Batch</option>
                              {Array.from(new Set([...batches.map(b => b.name), ...profiles.map(p => p.batch).filter(Boolean) as string[]])).sort().map(name => (
                                 <option key={name} value={name}>{name}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
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
                        <div className="grid grid-cols-2 gap-6">
                           <input 
                              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                              placeholder="Nomor Telepon / WhatsApp"
                              value={editingProfile.phone}
                              onChange={e => setEditingProfile({...editingProfile, phone: e.target.value})}
                              required
                           />
                        </div>
                        
                        {editingProfile.id && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative group">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Tanggal Lahir</label>
                               <input 
                                  type="date"
                                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                                  value={editingProfile.birth_date || ""}
                                  onChange={e => setEditingProfile({...editingProfile, birth_date: e.target.value})}
                               />
                            </div>
                            <div className="relative group">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Institusi Asal</label>
                               <input 
                                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold"
                                  placeholder="Institusi Asal"
                                  value={editingProfile.institution || ""}
                                  onChange={e => setEditingProfile({...editingProfile, institution: e.target.value})}
                               />
                            </div>
                            <div className="relative group md:col-span-2">
                               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 mb-2 block">Alamat Lengkap</label>
                               <textarea 
                                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-slate-800 outline-none transition font-bold min-h-[100px]"
                                  placeholder="Alamat Lengkap"
                                  value={editingProfile.address || ""}
                                  onChange={e => setEditingProfile({...editingProfile, address: e.target.value})}
                               />
                            </div>

                            {/* DATA TAMBAHAN (TEXT/NUMBER) */}
                            {(() => {
                               const role = editingProfile.is_admin ? 'admin' : 
                                            editingProfile.is_teacher ? 'teacher' : 
                                            editingProfile.is_alumni ? 'alumni' : 
                                            editingProfile.is_student ? 'student' : 
                                            editingProfile.is_premium ? 'premium' : 'all';

                               const textFields = dynamicFields.filter(f => (f.target_role === 'all' || f.target_role === role) && f.type !== 'file');
                               return textFields.map(field => (
                                  <div key={field.id} className="relative group">
                                     <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-4 mb-2 block">{field.name}</label>
                                     <input 
                                        className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-600 outline-none transition font-bold shadow-sm"
                                        value={dynamicValues[field.id] || ""}
                                        onChange={e => setDynamicValues({...dynamicValues, [field.id]: e.target.value})}
                                        placeholder={`Masukkan ${field.name}`}
                                     />
                                  </div>
                               ));
                            })()}
                          </div>
                        )}
                     </div>
                  </div>
                  
                  {/* BERKAS PENDUKUNG (UPLOAD) */}
                  {editingProfile.id && (() => {
                     const role = editingProfile.is_admin ? 'admin' : 
                                  editingProfile.is_teacher ? 'teacher' : 
                                  editingProfile.is_alumni ? 'alumni' : 
                                  editingProfile.is_student ? 'student' : 
                                  editingProfile.is_premium ? 'premium' : 'all';

                     const fileFields = dynamicFields.filter(f => (f.target_role === 'all' || f.target_role === role) && f.type === 'file');
                     if (fileFields.length === 0) return null;

                     return (
                        <div className="space-y-6 pt-10 border-t border-slate-100">
                           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 ml-4">Dokumen Pendukung (Lampiran)</label>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {fileFields.map(field => {
                                 const value = dynamicValues[field.id];
                                 return (
                                    <div key={field.id} className="space-y-3">
                                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                          {field.name} {field.is_required && <span className="text-rose-500">*</span>}
                                       </label>
                                       
                                       <div className="space-y-4">
                                          {value ? (
                                             <div className="relative group rounded-3xl overflow-hidden border border-slate-100 bg-white aspect-video shadow-sm">
                                                {value.startsWith('data:image') ? (
                                                   <img src={value} alt={field.name} className="w-full h-full object-contain" />
                                                ) : (
                                                   <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-400">
                                                      <span className="text-4xl mb-2">📄</span>
                                                      <span className="text-[9px] font-black uppercase">Document Uploaded</span>
                                                   </div>
                                                )}
                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center flex-col gap-2 p-4">
                                                   <label htmlFor={`admin-file-${field.id}`} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase shadow-xl cursor-pointer hover:bg-slate-50">Ganti Dokumen</label>
                                                   <a href={value} download={field.name.replace(/\s+/g, '-')} className="text-white text-[9px] font-bold uppercase underline">Pratinjau Full</a>
                                                </div>
                                             </div>
                                          ) : (
                                             <label htmlFor={`admin-file-${field.id}`} className="h-32 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white transition-all group">
                                                <span className="text-2xl group-hover:scale-125 transition">➕</span>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unggah {field.name}</p>
                                             </label>
                                          )}
                                          <input 
                                             type="file"
                                             id={`admin-file-${field.id}`}
                                             className="hidden"
                                             onChange={e => handleDynamicFileChange(e, field.id)}
                                             accept={field.allowed_file_types?.map(t => `.${t}`).join(',')}
                                          />
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     );
                  })()}

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
                              const n5n4 = levels.filter(l => 
                                l.level_code.toUpperCase() === "N5" || 
                                l.level_code.toUpperCase() === "N4"
                              ).map(l => l.id);
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

                  {/* Profile Completion Toggle */}
                  <div className="pt-6 border-t border-slate-100">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 mb-4 block italic">Status Onboarding Profil</label>
                    <button
                      type="button"
                      onClick={() => setEditingProfile({...editingProfile, profile_completed: !(editingProfile as any).profile_completed})}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${(editingProfile as any).profile_completed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                    >
                      {(editingProfile as any).profile_completed
                        ? '✅  Profil Sudah Lengkap — Klik untuk Reset ke Onboarding'
                        : '⏳  Profil Belum Lengkap — User akan diarahkan ke form Onboarding saat Login'}
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold mt-2 ml-4 italic uppercase tracking-wider">
                      {(editingProfile as any).profile_completed
                        ? 'User bisa langsung masuk ke Learning System'
                        : 'User WAJIB isi data diri lengkap sebelum bisa belajar'}
                    </p>
                  </div>

                  <div className="pt-4 flex gap-4 sticky bottom-0 bg-white/80 backdrop-blur-md pb-4">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition text-[11px] uppercase tracking-widest">CANCEL</button>
                     <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-2xl active:scale-95 transition text-[11px] tracking-[0.3em] uppercase italic">{editingProfile.id ? "Update Identity Access" : "Provision New User"}</button>
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

               <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 shadow-inner group relative">
                  <p className="text-[9px] font-black uppercase text-indigo-400 mb-1 tracking-[0.2em] italic">Access Password</p>
                  <p className="text-xl font-mono tracking-[0.2em] font-black pointer-events-none filter blur-sm group-hover:filter-none transition-all duration-300 select-all">
                     {viewingProfile.password || 'TIDAK_ADA_PASSWORD'}
                  </p>
                  <span className="absolute top-6 right-6 text-[8px] font-black uppercase tracking-widest text-indigo-300 opacity-100 group-hover:opacity-0 transition">Hover to reveal</span>
               </div>
               
               {viewingProfile.address && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1 tracking-widest">Full Address</p>
                     <p className="text-sm font-bold text-slate-800 leading-relaxed italic">\"{viewingProfile.address}\"</p>
                  </div>
               )}

               {viewingProfile.certificate_url && (
                  <div className="space-y-3">
                     <p className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Global Certificate</p>
                     <div className="relative group rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-sm aspect-video bg-slate-900/5 hover:border-indigo-500/30 transition-all cursor-pointer">
                        <img src={viewingProfile.certificate_url} alt="cert" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                           <a href={viewingProfile.certificate_url} download={`sertifikat-${viewingProfile.full_name.replace(/\s+/g, '-')}`} className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-2xl">Download / View Full</a>
                        </div>
                     </div>
                  </div>
               )}

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
                                                <a href={value} download={`\${field.name.replace(/\\s+/g, '-')}-\${viewingProfile.full_name.replace(/\\s+/g, '-')}`} className="px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-[9px] uppercase shadow-xl whitespace-nowrap">Download / View</a>
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

      {/* TEACHER-STUDENT RELATIONSHIP MODAL */}
      {managingTeacherStudents && (
         <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setManagingTeacherStudents(null)} />
            <div className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-5">
                     <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">T</div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 italic uppercase">Kelola Murid: {managingTeacherStudents.full_name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tentukan murid mana saja yang boleh diajar oleh guru ini</p>
                     </div>
                  </div>
                  <button onClick={() => setManagingTeacherStudents(null)} className="h-10 w-10 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-white transition shadow-sm font-bold">X</button>
               </div>
               
               <div className="p-8 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">🔍</span>
                     <input 
                        type="text" 
                        placeholder="Cari Murid..." 
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                        onChange={(e) => {
                           const val = e.target.value.toLowerCase();
                           const items = document.querySelectorAll('.student-item');
                           items.forEach((item: any) => {
                              const text = item.innerText.toLowerCase();
                              item.style.display = text.includes(val) ? 'flex' : 'none';
                           });
                        }}
                     />
                  </div>
                  <select 
                     className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none"
                     onChange={(e) => {
                        const val = e.target.value;
                        const items = document.querySelectorAll('.student-item');
                        items.forEach((item: any) => {
                           const batch = item.getAttribute('data-batch');
                           if (val === 'all') {
                              item.style.display = 'flex';
                           } else {
                              item.style.display = batch === val ? 'flex' : 'none';
                           }
                        });
                     }}
                  >
                     <option value="all">Semua Batch</option>
                     {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
               </div>
               
               <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {profiles.filter(p => p.is_student).map(student => {
                        const isAssigned = assignedStudentIds.includes(student.id!);
                        return (
                           <div 
                              key={student.id} 
                              onClick={() => toggleStudentAssignment(student.id!)}
                              data-batch={student.batch || ""}
                              className={`student-item p-5 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-4 group ${isAssigned ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-50 hover:border-slate-200'}`}
                           >
                              <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                                 {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : <span className="font-black text-slate-300">{student.full_name.charAt(0)}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className={`font-black text-[11px] uppercase italic truncate ${isAssigned ? 'text-indigo-900' : 'text-slate-600'}`}>{student.full_name}</p>
                                 <p className="text-[9px] text-slate-400 font-mono truncate">{student.email}</p>
                                 {student.batch && <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">{student.batch}</p>}
                              </div>
                              <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-200 group-hover:bg-slate-100'}`}>
                                 {isAssigned ? 'OK' : '+'}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
               <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                  <button onClick={() => setManagingTeacherStudents(null)} className="px-10 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-600 transition-all italic">Selesai Konfigurasi</button>
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
