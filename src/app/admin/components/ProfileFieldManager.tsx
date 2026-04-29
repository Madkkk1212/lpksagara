"use client";

import { useState, useEffect } from "react";
import { getProfileFields, upsertProfileField, deleteProfileField } from "@/lib/db";
import { ProfileField } from "@/lib/types";

export default function ProfileFieldManager() {
  const [fields, setFields] = useState<ProfileField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<Partial<ProfileField> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setLoading(true);
    const fData = await getProfileFields();
    setFields(fData);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    try {
      await upsertProfileField(editingField);
      setIsModalOpen(false);
      setEditingField(null);
      fetchFields();
    } catch (err) {
      alert("Gagal menyimpan field konfigurasi.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus konfigurasi field ini? Data user yang berhubungan mungkin akan tersembunyi.")) {
      try {
        await deleteProfileField(id);
        fetchFields();
      } catch (err) {
        alert("Gagal menghapus field.");
      }
    }
  };

  const addAllowedType = (type: string) => {
    if (!editingField) return;
    const current = editingField.allowed_file_types || [];
    if (!current.includes(type)) {
      setEditingField({ ...editingField, allowed_file_types: [...current, type] });
    }
  };

  const removeAllowedType = (type: string) => {
    if (!editingField) return;
    const current = editingField.allowed_file_types || [];
    setEditingField({ ...editingField, allowed_file_types: current.filter(t => t !== type) });
  };

  if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse italic">Loading configurations...</div>;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 border border-slate-200 rounded-2xl shadow-sm gap-4">
        <div>
           <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Onboarding Data Fields</h3>
           <p className="text-slate-500 text-xs font-semibold mt-1">Kelola data wajib yang harus diisi siswa saat pertama kali login.</p>
        </div>
        <button 
          onClick={() => {
            setEditingField({
              name: "",
              type: "text",
              is_required: true,
              allowed_file_types: [],
              target_role: 'all',
              sort_order: fields.length + 1
            });
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 rounded-xl shadow-sm transition-all"
        >
          + Tambah Field Dinamis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fields.map(field => (
          <div key={field.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${field.type === 'file' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {field.type === 'file' ? '📁' : field.type === 'number' ? '🔢' : '📝'}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingField(field); setIsModalOpen(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">✏️</button>
                <button onClick={() => handleDelete(field.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors">🗑️</button>
              </div>
            </div>
            
            <h4 className="font-black text-slate-800 text-lg mb-1">{field.name}</h4>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 tracking-widest">{field.type}</span>
              {field.is_required && <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-50 text-rose-500 rounded border border-rose-100 tracking-widest">Wajib</span>}
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-widest ${
                field.target_role === 'teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                field.target_role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                field.target_role === 'premium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                field.target_role === 'student' ? 'bg-teal-50 text-teal-700 border-teal-100' :
                field.target_role === 'alumni' ? 'bg-slate-900 text-white border-transparent shadow-sm' :
                field.target_role === 'standard' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                'bg-emerald-50 text-emerald-700 border-emerald-100'
              }`}>
                {field.target_role === 'all' ? 'Semua Role' : 
                 field.target_role === 'teacher' ? 'Guru' : 
                 field.target_role === 'alumni' ? 'Alumni' :
                 field.target_role === 'student' ? 'Murid' :
                 field.target_role === 'premium' ? 'Premium' :
                 field.target_role === 'standard' ? 'Biasa' : 'Admin'}
              </span>
            </div>

            {field.type === 'file' && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Allowed Formats:</p>
                <div className="flex flex-wrap gap-1">
                  {field.allowed_file_types?.map(ext => (
                    <span key={ext} className="text-[9px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase border border-amber-100">{ext}</span>
                  ))}
                  {(!field.allowed_file_types || field.allowed_file_types.length === 0) && <span className="text-[9px] italic text-slate-400">Semua file diperbolehkan</span>}
                </div>
              </div>
            )}
          </div>
        ))}

        {fields.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <span className="text-4xl mb-4 block">📋</span>
             <p className="text-slate-400 font-bold italic">Belum ada field dinamis. Klik tombol di atas untuk membuat.</p>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && editingField && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 mb-8 italic uppercase tracking-tight">Konfigurasi Field Data</h3>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nama Field</label>
                <input 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-800 outline-none transition font-bold text-slate-800"
                  placeholder="Contoh: Foto KTP / No HP"
                  value={editingField.name || ""}
                  onChange={e => setEditingField({...editingField, name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Target Kategori User (Role)</label>
                <select 
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white outline-none transition font-bold text-slate-800 appearance-none"
                  value={editingField.target_role || "all"}
                  onChange={e => setEditingField({...editingField, target_role: e.target.value as any})}
                >
                  <option value="all">Berlaku Semua User</option>
                  <option value="admin">Khusus Admin</option>
                  <option value="teacher">Khusus Guru / Staff</option>
                  <option value="student">Khusus Murid (Aktif)</option>
                  <option value="alumni">Khusus Alumni</option>
                  <option value="premium">Khusus User Premium</option>
                  <option value="standard">Khusus User Biasa</option>
                </select>
                <p className="px-2 text-[9px] text-slate-400 font-bold italic">Field ini hanya akan muncul untuk kategori user yang dipilih.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tipe Input</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white outline-none transition font-bold text-slate-800 appearance-none"
                    value={editingField.type}
                    onChange={e => setEditingField({...editingField, type: e.target.value as any})}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="file">File Upload</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Wajib Diisi?</label>
                  <button 
                    type="button"
                    onClick={() => setEditingField({...editingField, is_required: !editingField.is_required})}
                    className={`w-full py-4 rounded-2xl border font-black active:scale-95 transition text-sm ${editingField.is_required ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                  >
                    {editingField.is_required ? 'YA, WAJIB' : 'OPSIONAL'}
                  </button>
                </div>
              </div>

              {editingField.type === 'file' && (
                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-600">Allowed File Extensions</label>
                  <div className="flex flex-wrap gap-2">
                    {['pdf', 'jpg', 'png', 'jpeg', 'zip', 'docx'].map(ext => {
                      const isActive = editingField.allowed_file_types?.includes(ext);
                      return (
                        <button 
                          key={ext}
                          type="button"
                          onClick={() => isActive ? removeAllowedType(ext) : addAllowedType(ext)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isActive ? 'bg-amber-500 text-white border-transparent shadow-lg' : 'bg-white text-amber-400 border-amber-200 hover:bg-white'}`}
                        >
                          .{ext}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-amber-600/60 font-medium italic">Klik untuk menambah/hapus tipe file yang divalidasi sistem.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                 <button 
                   type="button" 
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                 >
                   BATAL
                 </button>
                 <button 
                   type="submit" 
                   className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all"
                 >
                   SIMPAN KONFIGURASI
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
