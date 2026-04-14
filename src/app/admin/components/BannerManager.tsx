"use client";

import { useEffect, useState } from "react";
import { BannerSlide } from "@/lib/types";
import { getAllBanners, upsertBanner, deleteBanner } from "@/lib/db";
import { supabase } from "@/lib/supabase";

export default function BannerManager() {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BannerSlide>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);
    const data = await getAllBanners();
    setBanners(data);
    setLoading(false);
  }

  const handleEdit = (banner: BannerSlide) => {
    setEditingId(banner.id);
    setEditForm(banner);
  };

  const handleAddNew = () => {
    setEditingId("new");
    setEditForm({
      title: "New Banner",
      subtitle: "",
      image_url: "",
      cta_text: "Mulai Belajar",
      badge_text: "New",
      badge_color: "#14b8a6",
      title_color: "#ffffff",
      overlay_color: "#000000",
      overlay_opacity: 0.4,
      is_active: true,
      sort_order: banners.length + 1
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setEditForm(prev => ({ ...prev, image_url: base64 }));
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Gagal membaca file gambar.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error handling file:', error);
      alert('Error handling file: ' + error.message);
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await upsertBanner(editForm);
      setEditingId(null);
      fetchBanners();
    } catch (error) {
      console.error(error);
      alert("Failed to save banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteBanner(id);
      fetchBanners();
    } catch (error) {
      console.error(error);
      alert("Failed to delete banner");
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : 
                type === "number" ? parseFloat(value) : value;
    setEditForm(prev => ({ ...prev, [name]: val }));
  };

  if (loading) return <div className="text-center p-10 font-bold text-slate-400">Loading banners...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800">Carousel Slides</h3>
        <button onClick={handleAddNew} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition">+ ADD SLIDE</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="flex gap-6 p-6 bg-slate-50 rounded-[2rem] ring-1 ring-inset ring-slate-200">
            <div className="w-48 h-32 rounded-2xl overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
               {banner.image_url ? (
                 <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No Image</span>
               )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${banner.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                  {banner.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs font-bold text-slate-400">Order: {banner.sort_order}</span>
              </div>
              <h4 className="text-lg font-black text-slate-800">{banner.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-1">{banner.subtitle}</p>
              <div className="mt-4 flex gap-3">
                <button onClick={() => handleEdit(banner)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition">EDIT</button>
                <button onClick={() => handleDelete(banner.id)} className="px-4 py-2 bg-rose-50 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-500 hover:text-white transition">DELETE</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-8">{editingId === "new" ? "Add New Slide" : "Edit Slide"}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Banner Image</label>
                {editForm.image_url && (
                  <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group">
                    <img 
                      src={editForm.image_url} 
                      alt="Preview" 
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/1200x514/f1f5f9/94a3b8?text=Image+Not+Found";
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-[10px] text-white/90 font-medium truncate">{editForm.image_url}</p>
                    </div>
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  <label className="flex-1 cursor-pointer">
                    <div className={`h-full min-h-[50px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed font-black text-xs uppercase tracking-widest transition-all ${uploading ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-slate-50 border-slate-300 text-slate-500 hover:border-slate-900 hover:bg-white active:scale-95'}`}>
                      {uploading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Upload File</span>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                  <div className="flex-[2]">
                    <input 
                      name="image_url" 
                      value={editForm.image_url || ""} 
                      onChange={handleFormChange} 
                      placeholder="Or paste external image URL here..." 
                      className="w-full h-full px-6 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none text-sm font-medium" 
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Title</label>
                <input name="title" value={editForm.title || ""} onChange={handleFormChange} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Subtitle</label>
                <input name="subtitle" value={editForm.subtitle || ""} onChange={handleFormChange} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">CTA Text</label>
                <input name="cta_text" value={editForm.cta_text || ""} onChange={handleFormChange} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Badge Text</label>
                <input name="badge_text" value={editForm.badge_text || ""} onChange={handleFormChange} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Sort Order</label>
                <input type="number" name="sort_order" value={editForm.sort_order || 0} onChange={handleFormChange} className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 outline-none" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="is_active" checked={editForm.is_active || false} onChange={handleFormChange} id="is_active" className="h-5 w-5 rounded-md border-slate-300" />
                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Active Slide</label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-10 pt-6 border-t font-black">
              <button onClick={() => setEditingId(null)} className="px-6 py-3 text-slate-400 hover:text-slate-600 transition tracking-widest text-xs uppercase">Cancel</button>
              <button onClick={handleSave} className="px-10 py-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition tracking-widest text-xs uppercase">Save Slide</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
