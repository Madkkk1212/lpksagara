"use client";

import { useEffect, useState } from "react";
import { MaterialCategory, Material, IconCategory, IconLibraryItem } from "@/lib/types";
import { 
  getMaterialCategories, getMaterials, upsertMaterialCategory, deleteMaterialCategory, 
  upsertMaterial, deleteMaterial,
  getIconCategories, getIconLibrary
} from "@/lib/db";

export default function MaterialManager() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catForm, setCatForm] = useState<Partial<MaterialCategory>>({});
  
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [matForm, setMatForm] = useState<Partial<Material>>({});

  // Icon Picker states
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'category'|'material'|null>(null);
  const [iconCategories, setIconCategories] = useState<IconCategory[]>([]);
  const [activeIconCategory, setActiveIconCategory] = useState<IconCategory | null>(null);
  const [iconLibrary, setIconLibrary] = useState<IconLibraryItem[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [cats, mats] = await Promise.all([
      getMaterialCategories(),
      getMaterials()
    ]);
    setCategories(cats);
    setMaterials(mats);
    setLoading(false);
  }

  // Categories
  const handleEditCat = (cat: MaterialCategory) => {
    setEditingCatId(cat.id);
    setCatForm(cat);
  };

  const handleAddCat = () => {
    setEditingCatId("new");
    setCatForm({ name: "New Category", description: "", badge_color: "#14b8a6", sort_order: categories.length + 1 });
  };

  const handleSaveCat = async () => {
    try {
      await upsertMaterialCategory(catForm);
      setEditingCatId(null);
      fetchData();
    } catch (e) { alert("Error saving category"); }
  };

  // Icon Picker Logic
  const openIconPicker = async (target: 'category' | 'material') => {
    setPickerTarget(target);
    setPickerOpen(true);
    const cats = await getIconCategories();
    setIconCategories(cats);
    if (cats.length > 0) {
      setActiveIconCategory(cats[0]);
      const lib = await getIconLibrary(cats[0].id);
      setIconLibrary(lib);
    }
  };

  const handleSelectIconCategory = async (cat: IconCategory) => {
    setActiveIconCategory(cat);
    const lib = await getIconLibrary(cat.id);
    setIconLibrary(lib);
  };

  const pickIcon = (url: string) => {
    if (pickerTarget === 'category') {
      setCatForm({...catForm, icon_url: url});
    } else if (pickerTarget === 'material') {
      setMatForm({...matForm, icon_url: url});
    }
    setPickerOpen(false);
    setPickerTarget(null);
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("Delete category and ALL materials inside it?")) return;
    try {
      await deleteMaterialCategory(id);
      fetchData();
    } catch (e) { alert("Error deleting category"); }
  };

  // Materials
  const handleEditMat = (mat: Material) => {
    setEditingMatId(mat.id);
    setMatForm(mat);
  };

  const handleAddMat = (catId: string) => {
    setEditingMatId("new");
    setMatForm({ 
      category_id: catId, 
      title: "New Material", 
      slug: `new-material-${Date.now()}`,
      subtitle: "", 
      japanese_text: "", 
      indonesian_text: "", 
      example_sentence: "", 
      is_locked: false, 
      card_accent_color: "#14b8a6",
      tag_color: "#10b981",
      sort_order: (materials.filter(m => m.category_id === catId).length + 1)
    });
  };

  const handleSaveMat = async () => {
    try {
      await upsertMaterial(matForm);
      setEditingMatId(null);
      fetchData();
    } catch (e) { 
      console.error(e);
      alert("Error saving material. Possibly duplicate slug?"); 
    }
  };

  const handleDeleteMat = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    try {
      await deleteMaterial(id);
      fetchData();
    } catch (e) { alert("Error deleting material"); }
  };

  if (loading) return <div className="text-center p-10 font-bold text-slate-400">Loading materials...</div>;

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
        <div>
          <h3 className="text-2xl font-black italic">Material Hub</h3>
          <p className="opacity-70 font-medium">Manage categories and their teaching content.</p>
        </div>
        <button onClick={handleAddCat} className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition tracking-widest uppercase">Add Category</button>
      </div>

      <div className="space-y-10">
        {categories.map(cat => (
          <div key={cat.id} className="p-8 rounded-[2.5rem] bg-slate-50 ring-1 ring-inset ring-slate-200">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-4 h-16 rounded-full" style={{ backgroundColor: cat.badge_color || '#000' }} />
                  {cat.icon_url && (
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 ring-1 ring-slate-100">
                      <img src={cat.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
                <div className={cat.icon_url ? "ml-6" : ""}>
                  <h4 className="text-2xl font-black text-slate-800 italic underline decoration-slate-200 underline-offset-8 decoration-4">{cat.name}</h4>
                  <p className="mt-2 text-sm text-slate-400 font-medium">{cat.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEditCat(cat)} className="px-4 py-2 bg-white rounded-xl text-[10px] font-black border border-slate-200 hover:bg-slate-100 transition tracking-widest uppercase">Edit Cat</button>
                <button onClick={() => handleDeleteCat(cat.id)} className="px-4 py-2 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black hover:bg-rose-500 hover:text-white transition tracking-widest uppercase">Del Cat</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {materials.filter(m => m.category_id === cat.id).map(mat => (
                <div key={mat.id} className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-100 relative group overflow-hidden">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
                   <div className="relative z-10">
                     <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                           {mat.icon_url && (
                             <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                               <img src={mat.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                             </div>
                           )}
                           <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${mat.is_locked ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                             {mat.is_locked ? 'Premium' : 'Free'}
                           </span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                           <button onClick={() => handleEditMat(mat)} className="p-2 bg-slate-900 text-white rounded-lg">✎</button>
                           <button onClick={() => handleDeleteMat(mat.id)} className="p-2 bg-rose-500 text-white rounded-lg">✕</button>
                        </div>
                     </div>
                     <h5 className="text-lg font-black text-slate-800 italic leading-tight underline decoration-slate-100 group-hover:decoration-teal-200 transition-all">{mat.title}</h5>
                     <p className="text-xs text-slate-400 mt-1 font-medium">{mat.subtitle}</p>
                     
                     <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Preview JP</p>
                        <p className="text-sm font-bold text-slate-700 truncate">{mat.japanese_text}</p>
                     </div>
                   </div>
                </div>
              ))}
              <button onClick={() => handleAddMat(cat.id)} className="h-full min-h-[160px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-300 hover:border-slate-400 hover:text-slate-400 transition-all gap-2">
                 <span className="text-4xl text-slate-200">+</span>
                 <span className="text-[10px] font-black uppercase tracking-widest">Add Material</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Category Editor Modal */}
      {editingCatId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6 font-black tracking-widest text-[10px] uppercase">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-8 lowercase tracking-normal italic">{editingCatId === "new" ? "New Category" : "Edit Category"}</h3>
            <div className="space-y-6 text-slate-400">
               <div>
                  <label className="block mb-2">Category Name</label>
                  <input value={catForm.name || ""} onChange={e => setCatForm({...catForm, name: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
               </div>
               <div>
                  <label className="block mb-2">Description</label>
                  <input value={catForm.description || ""} onChange={e => setCatForm({...catForm, description: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
               </div>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2">Badge Color</label>
                    <input type="color" value={catForm.badge_color || "#000000"} onChange={e => setCatForm({...catForm, badge_color: e.target.value})} className="w-full h-12 p-0 border-none bg-transparent cursor-pointer rounded-2xl overflow-hidden" />
                  </div>
                  <div>
                    <label className="block mb-2">Sort Order</label>
                    <input type="number" value={catForm.sort_order || 0} onChange={e => setCatForm({...catForm, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
                  </div>
               </div>
               <div>
                  <label className="block mb-2 text-teal-600">Category Icon</label>
                  <div className="flex items-center gap-4">
                     {catForm.icon_url && <img src={catForm.icon_url} alt="icon" className="w-12 h-12 rounded-xl bg-slate-100 object-contain shadow-sm" />}
                     <button 
                       onClick={() => openIconPicker('category')} 
                       className="flex-1 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                     >
                       Pick from Gallery 🖼️
                     </button>
                  </div>
                  <input 
                    value={catForm.icon_url || ""} 
                    onChange={e => setCatForm({...catForm, icon_url: e.target.value})} 
                    placeholder="Or paste URL here..." 
                    className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold mt-3 text-xs lowercase" 
                  />
               </div>
            </div>
            <div className="flex justify-end gap-4 mt-10">
               <button onClick={() => setEditingCatId(null)} className="text-slate-400 hover:text-slate-600 transition">Cancel</button>
               <button onClick={handleSaveCat} className="px-10 py-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition">Save Category</button>
            </div>
          </div>
        </div>
      )}

      {/* Material Editor Modal */}
      {editingMatId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-12 shadow-2xl">
            <h3 className="text-3xl font-black text-slate-800 mb-10 italic">{editingMatId === "new" ? "Add Content" : "Edit Content"}</h3>
            <div className="grid grid-cols-2 gap-8">
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Slug (must be unique)</label>
                  <input value={matForm.slug || ""} onChange={e => setMatForm({...matForm, slug: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
               </div>
               <div className="col-span-2 grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Title</label>
                    <input value={matForm.title || ""} onChange={e => setMatForm({...matForm, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Subtitle</label>
                    <input value={matForm.subtitle || ""} onChange={e => setMatForm({...matForm, subtitle: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">JP Text</label>
                  <input value={matForm.japanese_text || ""} onChange={e => setMatForm({...matForm, japanese_text: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
               </div>
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">ID Translation</label>
                  <input value={matForm.indonesian_text || ""} onChange={e => setMatForm({...matForm, indonesian_text: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
               </div>
                <div className="col-span-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2 text-teal-600">Material Icon</label>
                   <div className="flex items-center gap-4">
                      {matForm.icon_url && <img src={matForm.icon_url || undefined} alt="icon" className="w-12 h-12 rounded-xl bg-slate-100 object-contain shadow-sm" />}
                      <button 
                        onClick={() => openIconPicker('material')} 
                        className="flex-1 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                      >
                        Pick from Gallery 🖼️
                      </button>
                   </div>
                   <input 
                     value={matForm.icon_url || ""} 
                     onChange={e => setMatForm({...matForm, icon_url: e.target.value})} 
                     placeholder="Or paste URL here..." 
                     className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold mt-3 text-xs lowercase" 
                   />
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-8">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Card Accent</label>
                    <input type="color" value={matForm.card_accent_color || "#14b8a6"} onChange={e => setMatForm({...matForm, card_accent_color: e.target.value})} className="w-full h-12 p-0 border-none bg-transparent cursor-pointer rounded-2xl overflow-hidden" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Sort</label>
                    <input type="number" value={matForm.sort_order || 0} onChange={e => setMatForm({...matForm, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <input type="checkbox" checked={matForm.is_locked} onChange={e => setMatForm({...matForm, is_locked: e.target.checked})} className="h-6 w-6 rounded-lg text-amber-500" />
                      <span className="text-sm font-black uppercase tracking-widest text-slate-700">Premium Content</span>
                    </label>
                  </div>
               </div>
               <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Detail Content (JSON - Grammar, Tips, Examples)</label>
                  <textarea 
                    value={typeof matForm.detail_content === 'string' ? matForm.detail_content : JSON.stringify(matForm.detail_content, null, 2) || ""} 
                    onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setMatForm({...matForm, detail_content: parsed});
                      } catch (err) {
                        // Allow typing invalid JSON temporarily
                        setMatForm({...matForm, detail_content: e.target.value as any});
                      }
                    }} 
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-mono text-xs h-64"
                    placeholder='{ "grammar": [...], "senseiTips": [...], "examples": [...] }'
                  />
                  {typeof matForm.detail_content === 'string' && <p className="text-rose-500 text-[8px] font-black uppercase mt-1">Invalid JSON format</p>}
               </div>
            </div>
            <div className="flex justify-end gap-6 mt-12 pt-8 border-t">
               <button onClick={() => setEditingMatId(null)} className="text-slate-400 hover:text-slate-600 transition font-black tracking-widest uppercase text-xs">Discard</button>
               <button onClick={handleSaveMat} className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl active:scale-95 transition font-black tracking-widest uppercase text-xs">Save Content</button>
            </div>
          </div>
        </div>
      )}

      {/* ICON PICKER MODAL */}
      {pickerOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl p-8 shadow-2xl flex flex-col h-[85vh]">
               <div className="flex justify-between items-center mb-6 shrink-0 border-b pb-4">
                  <h3 className="text-2xl font-black italic">Pick an Icon</h3>
                  <button onClick={() => setPickerOpen(false)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200">✕</button>
               </div>
               <div className="flex flex-1 overflow-hidden gap-6">
                  {/* Category Sidebar */}
                  <div className="w-1/4 border-r pr-6 overflow-y-auto space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Categories</p>
                     {iconCategories.map(cat => (
                       <button 
                         key={cat.id} 
                         onClick={() => handleSelectIconCategory(cat)}
                         className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest ${activeIconCategory?.id === cat.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-slate-50 hover:bg-slate-100'}`}
                       >
                         {cat.name}
                       </button>
                     ))}
                  </div>
                  {/* Icon Grid Viewer */}
                  <div className="w-3/4 overflow-y-auto pl-2">
                     {activeIconCategory ? (
                        <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
                          {iconLibrary.map(item => (
                             <button 
                               key={item.id} 
                               onClick={() => pickIcon(item.url)}
                               className="aspect-square bg-slate-50 rounded-2xl p-4 flex items-center justify-center ring-1 ring-slate-100 hover:ring-teal-500 hover:shadow-lg transition-all"
                             >
                                <img src={item.url} alt="icon" className="w-full h-full object-contain pointer-events-none" />
                             </button>
                          ))}
                        </div>
                     ) : (
                        <p className="text-sm font-medium text-slate-400">Pilih kategori dari sebelah kiri.</p>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
