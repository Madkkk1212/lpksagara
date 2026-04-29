"use client";

import { useState, useEffect } from "react";
import { IconCategory, IconLibraryItem } from "@/lib/types";
import { getIconCategories, upsertIconCategory, deleteIconCategory, getIconLibrary, addIconsToLibrary, deleteIconFromLibrary } from "@/lib/db";

export default function IconManager() {
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | null>(null);
  const [library, setLibrary] = useState<IconLibraryItem[]>([]);
  
  const [newCatName, setNewCatName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    const data = await getIconCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadLibrary = async (catId: string) => {
    const data = await getIconLibrary(catId);
    setLibrary(data);
  };

  const handleSelectCategory = (cat: IconCategory) => {
    setSelectedCategory(cat);
    loadLibrary(cat.id);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await upsertIconCategory(newCatName.trim());
      setNewCatName("");
      loadCategories();
    } catch (err: any) {
      alert("Error adding category: " + err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure? This deletes the category AND all icons inside it!")) return;
    try {
      await deleteIconCategory(id);
      loadCategories();
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
        setLibrary([]);
      }
    } catch (err: any) {
      alert("Error deleting category: " + err.message);
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCategory) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const base64Promises: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        base64Promises.push(new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        }));
      }
    }

    if (base64Promises.length === 0) {
      alert("No valid images selected (PNG/JPG only).");
      setUploading(false);
      return;
    }

    const base64results = await Promise.all(base64Promises);
    
    try {
      await addIconsToLibrary(selectedCategory.id, base64results);
      loadLibrary(selectedCategory.id);
    } catch (err: any) {
      alert("Error uploading icons: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const handleDeleteIcon = async (id: string) => {
    if (!confirm("Delete this icon?")) return;
    try {
      await deleteIconFromLibrary(id);
      loadLibrary(selectedCategory!.id);
    } catch(err: any) {
      alert("Error deleting icon: " + err.message);
    }
  }

  if (loading) return <div className="p-10 font-bold text-slate-400">Loading categories...</div>;

  return (
    <div className="space-y-12">
      <section>
         <h3 className="text-xl font-black text-slate-800 mb-6">1. Kategori Ikon</h3>
         
         <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
            <input 
              value={newCatName} 
              onChange={e => setNewCatName(e.target.value)} 
              placeholder="Nama Kategori (contoh: One Piece, Basic, UI...)" 
              className="flex-1 px-6 py-3 rounded-2xl bg-slate-50 border font-bold text-sm"
            />
            <button type="submit" className="px-8 py-3 bg-slate-900 text-white font-black tracking-widest text-[10px] uppercase rounded-2xl">Create Category</button>
         </form>

         <div className="flex gap-4 overflow-x-auto pb-4">
            {categories.map(cat => (
               <div key={cat.id} className="relative group flex-shrink-0">
                 <button 
                    onClick={() => handleSelectCategory(cat)}
                    className={`px-8 py-4 rounded-2xl font-black transition-all ${selectedCategory?.id === cat.id ? 'bg-teal-500 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                 >
                    {cat.name}
                 </button>
                 <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition z-10">
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 bg-rose-500 text-white rounded-lg text-[10px]">✕</button>
                 </div>
               </div>
            ))}
            {categories.length === 0 && <p className="text-sm font-medium text-slate-400">Belum ada kategori yang dibuat.</p>}
         </div>
      </section>

      {selectedCategory && (
        <section className="animate-in fade-in slide-in-from-top-4 border-t pt-8 mt-8">
           <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-xl font-black text-slate-800">2. Gallery: {selectedCategory.name}</h3>
               <p className="text-sm text-slate-500 mt-1 font-medium">{library.length} Ikon tersedia</p>
             </div>
             
             <label className="cursor-pointer">
                <div className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${uploading ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-xl hover:scale-105 active:scale-95'}`}>
                   {uploading ? 'Uploading...' : '+ Bulk Upload Images'}
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                  disabled={uploading}
                  onChange={handleBulkUpload} 
                />
             </label>
           </div>
           
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {library.map(item => (
                 <div key={item.id} className="relative group aspect-square bg-slate-50 rounded-2xl p-4 flex items-center justify-center ring-1 ring-slate-100 hover:shadow-lg transition-all">
                    <img src={item.url} alt="icon" className="w-full h-full object-contain" />
                    <button 
                       onClick={() => handleDeleteIcon(item.id)}
                       className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                       ✕
                    </button>
                 </div>
              ))}
           </div>
           {library.length === 0 && <p className="text-sm font-medium text-slate-400 text-center p-10 bg-slate-50 rounded-[2rem]">Belum ada gambar di kategori ini. Silakan mass upload!</p>}
        </section>
      )}
    </div>
  );
}
