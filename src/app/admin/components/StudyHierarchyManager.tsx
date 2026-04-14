"use client";

import { useState, useEffect } from "react";
import { 
  getStudyLevels, getStudyChapters, getStudyMaterials, 
  upsertStudyLevel, deleteStudyLevel, 
  upsertStudyChapter, deleteStudyChapter, 
  upsertStudyMaterial, deleteStudyMaterial,
  getIconCategories, getIconLibrary,
  getMaterialCategories
} from "@/lib/db";
import { StudyLevel, StudyChapter, StudyMaterial, IconCategory, IconLibraryItem, MaterialCategory } from "@/lib/types";

export default function StudyHierarchyManager() {
  const [levels, setLevels] = useState<StudyLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<StudyLevel | null>(null);
  
  const [chapters, setChapters] = useState<StudyChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<StudyChapter | null>(null);

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [editingLevel, setEditingLevel] = useState<Partial<StudyLevel> | null>(null);
  const [editingChapter, setEditingChapter] = useState<Partial<StudyChapter> | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Partial<StudyMaterial> | null>(null);
  const [editingAppCategory, setEditingAppCategory] = useState<MaterialCategory | null>(null);
  
  // Dynamic Editor Content state
  const [formContent, setFormContent] = useState<any>({});

  // Icon Picker states
  const [pickerTarget, setPickerTarget] = useState<'category'|'level'|'chapter'|'material'|null>(null);
  const [categories, setCategories] = useState<IconCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<IconCategory | null>(null);
  const [iconLibrary, setIconLibrary] = useState<IconLibraryItem[]>([]);

  // Hierarchy Categories
  const [appCategories, setAppCategories] = useState<MaterialCategory[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const loadLevels = async () => {
    setLoading(true);
    const [cats, data] = await Promise.all([
      getMaterialCategories(),
      getStudyLevels()
    ]);
    setAppCategories(cats);
    setLevels(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const loadChapters = async (levelId: string) => {
    const data = await getStudyChapters(levelId);
    setChapters(data);
    setSelectedChapter(null);
    setMaterials([]);
  };

  const loadMaterials = async (chapterId: string) => {
    const data = await getStudyMaterials(chapterId);
    setMaterials(data);
  };

  const handleSelectLevel = (lvl: StudyLevel) => {
    setSelectedLevel(lvl);
    loadChapters(lvl.id);
  };

  const handleSelectChapter = (chap: StudyChapter) => {
    setSelectedChapter(chap);
    loadMaterials(chap.id);
  };

  // --- CRUD ACTIONS ---
  
  const handleSaveLevel = async () => {
    if (!editingLevel) return;
    try {
      await upsertStudyLevel(editingLevel);
      setEditingLevel(null);
      loadLevels();
    } catch (e) { alert("Error saving level"); }
  };
  const handleDeleteLevel = async (id: string) => {
    if (!confirm("Are you sure? This deletes ALL chapters and materials inside this level.")) return;
    try {
      await deleteStudyLevel(id);
      loadLevels();
      if (selectedLevel?.id === id) setSelectedLevel(null);
    } catch (e) { alert("Error deleting level"); }
  };

  const handleSaveChapter = async () => {
    if (!editingChapter || !selectedLevel) return;
    try {
      await upsertStudyChapter({ ...editingChapter, level_id: selectedLevel.id });
      setEditingChapter(null);
      loadChapters(selectedLevel.id);
    } catch (e) { alert("Error saving chapter"); }
  };
  const handleDeleteChapter = async (id: string) => {
    if (!confirm("Delete this chapter and all its materials?")) return;
    try {
      await deleteStudyChapter(id);
      loadChapters(selectedLevel!.id);
      if (selectedChapter?.id === id) setSelectedChapter(null);
    } catch (e) { alert("Error deleting chapter"); }
  };

  const handleSaveMaterial = async () => {
    if (!editingMaterial || !selectedChapter) return;
    try {
      await upsertStudyMaterial({ ...editingMaterial, chapter_id: selectedChapter.id, content: formContent });
      alert("Material saved!");
      setEditingMaterial(null);
      loadMaterials(selectedChapter.id);
    } catch (e: any) {
      alert("Error saving material: " + e.message);
    }
  };
  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Delete material?")) return;
    try {
      await deleteStudyMaterial(id);
      loadMaterials(selectedChapter!.id);
    } catch (e) { alert("Error deleting material"); }
  };

  const openMaterialModal = (mat: Partial<StudyMaterial>) => {
    setEditingMaterial(mat);
    const c = (mat.content || {}) as any;
    if (mat.material_type === 'moji_goi' || mat.material_type === 'bunpou') {
      setFormContent({ items: c.items || [] });
    } else if (mat.material_type === 'dokkai') {
      setFormContent({ text_jp: c.text_jp || '', text_id: c.text_id || '', exercises: c.exercises || [] });
    } else if (mat.material_type === 'choukai') {
      setFormContent({ audioUrl: c.audioUrl || '', exercises: c.exercises || [] });
    } else if (mat.material_type === 'quiz') {
      setFormContent({ exercises: c.exercises || [] });
    } else {
      setFormContent(c);
    }
  };

  // --- ICON PICKER LOGIC ---
  const openIconPicker = async (target: 'category'|'level'|'chapter'|'material', extra?: any) => {
    setPickerTarget(target);
    if (target === 'category') setEditingAppCategory(extra);
    const cats = await getIconCategories();
    setCategories(cats);
    if (cats.length > 0) {
      setActiveCategory(cats[0]);
      const lib = await getIconLibrary(cats[0].id);
      setIconLibrary(lib);
    }
  };

  const handleSelectIconCategory = async (cat: IconCategory) => {
    setActiveCategory(cat);
    const lib = await getIconLibrary(cat.id);
    setIconLibrary(lib);
  };

  const pickIcon = async (url: string) => {
    if (pickerTarget === 'category' && editingAppCategory) {
      try {
        const updatedCat = { ...editingAppCategory, icon_url: url };
        // Use the existing upsert function - assuming it's imported or defined
        const { upsertMaterialCategory } = await import("@/lib/db");
        await upsertMaterialCategory(updatedCat);
        setEditingAppCategory(null);
        loadLevels(); // Refresh all data
      } catch (err) { alert("Error saving category icon"); }
    }
    else if (pickerTarget === 'level' && editingLevel) setEditingLevel({...editingLevel, icon_url: url});
    else if (pickerTarget === 'chapter' && editingChapter) setEditingChapter({...editingChapter, icon_url: url});
    else if (pickerTarget === 'material' && editingMaterial) setEditingMaterial({...editingMaterial, icon_url: url});
    setPickerTarget(null);
  };


  // --- DYNAMIC FORM RENDERERS ---

  const renderExercisesEditor = () => (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-4">Exercises / Soal Latihan</h4>
      {formContent.exercises?.map((ex: any, i: number) => (
        <div key={i} className="mb-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl relative">
          <button onClick={() => setFormContent({...formContent, exercises: formContent.exercises.filter((_:any, idx:number) => idx !== i)})} className="absolute top-4 right-4 text-rose-500 font-bold text-xs p-2 bg-rose-50 rounded-lg">✕</button>
          
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Pertanyaan</label>
          <input value={ex.q} onChange={e => {
            const newEx = [...formContent.exercises];
            newEx[i].q = e.target.value;
            setFormContent({...formContent, exercises: newEx});
          }} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold mb-4" />

          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Opsi Jawaban (Pisahkan dengan koma)</label>
          <input value={ex.options.join(', ')} onChange={e => {
            const newEx = [...formContent.exercises];
            newEx[i].options = e.target.value.split(',').map(s=>s.trim());
            setFormContent({...formContent, exercises: newEx});
          }} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold mb-4" />

          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Index Jawaban Benar (0, 1, 2, ...)</label>
          <input type="number" value={ex.answer} onChange={e => {
            const newEx = [...formContent.exercises];
            newEx[i].answer = parseInt(e.target.value);
            setFormContent({...formContent, exercises: newEx});
          }} className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-bold mb-4" />
        </div>
      ))}
      <button onClick={() => setFormContent({...formContent, exercises: [...(formContent.exercises || []), { q: 'Soal Baru', options: ['A','B'], answer: 0 }]})} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs">
        + Tambah Soal
      </button>
    </div>
  );

  const renderDynamicFields = () => {
    if (!editingMaterial) return null;
    const type = editingMaterial.material_type;

    if (type === 'moji_goi') {
      return (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-4 border-b pb-2">Vocabulary List</h4>
          {formContent.items?.map((item: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl relative">
               <button onClick={() => setFormContent({...formContent, items: formContent.items.filter((_:any, idx:number) => idx !== i)})} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-2">✕</button>
               <input placeholder="Jepang (ex: 食べる)" value={item.jp || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].jp = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full px-4 py-2 rounded-lg border mb-2 font-bold" />
               <input placeholder="Arti (ex: Makan)" value={item.id || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].id = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full px-4 py-2 rounded-lg border mb-2" />
               <input placeholder="Contoh Kalimat" value={item.example || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].example = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full px-4 py-2 rounded-lg border mb-2 text-sm italic" />
            </div>
          ))}
          <button onClick={() => setFormContent({...formContent, items: [...(formContent.items || []), { jp: '', id: '', example: '', audioUrl: '' }]})} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs block w-full text-center">+ Add Word</button>
        </div>
      );
    }
    
    if (type === 'bunpou') {
      return (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-4 border-b pb-2">Grammar Patterns</h4>
          {formContent.items?.map((item: any, i: number) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl relative mb-4">
               <button onClick={() => setFormContent({...formContent, items: formContent.items.filter((_:any, idx:number) => idx !== i)})} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-2">✕</button>
               <label className="text-[10px] font-bold text-slate-400">Pattern</label>
               <input placeholder="N は N です" value={item.pattern || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].pattern = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full px-4 py-2 rounded-lg border mb-2 font-bold" />
               <label className="text-[10px] font-bold text-slate-400">Explanation</label>
               <textarea placeholder="Penjelasan..." value={item.explanation || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].explanation = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full px-4 py-2 rounded-lg border mb-2 text-sm" />
               {/* Simplified Example Input for Bunpou */}
               <label className="text-[10px] font-bold text-slate-400 block mt-2">Example (JSON array)</label>
               <textarea value={JSON.stringify(item.examples || [])} onChange={e => { try { const newItems = [...formContent.items]; newItems[i].examples = JSON.parse(e.target.value); setFormContent({...formContent, items: newItems}); } catch(e){} }} className="w-full px-4 py-2 rounded-lg border mb-2 font-mono text-xs" />
            </div>
          ))}
          <button onClick={() => setFormContent({...formContent, items: [...(formContent.items || []), { pattern: '', explanation: '', examples: [] }]})} className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-xs block w-full text-center">+ Add Pattern</button>
        </div>
      );
    }

    if (type === 'dokkai') {
      return (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 block">Teks Bacaan (Jepang)</label>
          <textarea value={formContent.text_jp || ''} onChange={e => setFormContent({...formContent, text_jp: e.target.value})} className="w-full h-32 px-4 py-3 rounded-xl border font-bold" />
          
          <label className="text-[10px] font-black uppercase text-slate-400 block">Terjemahan Teks</label>
          <textarea value={formContent.text_id || ''} onChange={e => setFormContent({...formContent, text_id: e.target.value})} className="w-full h-24 px-4 py-3 rounded-xl border italic" />
          
          {renderExercisesEditor()}
        </div>
      );
    }

    if (type === 'choukai') {
      return (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-400 block">URL Audio Mp3/Wav</label>
          <input value={formContent.audioUrl || ''} onChange={e => setFormContent({...formContent, audioUrl: e.target.value})} className="w-full px-4 py-3 rounded-xl border font-bold" />
          {renderExercisesEditor()}
        </div>
      );
    }

    if (type === 'quiz') {
      return renderExercisesEditor();
    }

    return null;
  };

  if (loading) return <div className="p-10 font-bold text-slate-400">Loading data...</div>;

  return (
    <div className="space-y-12">
      {/* 0. CATEGORIES */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
         <div className="mb-6">
            <h3 className="text-xl font-black italic">0. Select Category First</h3>
            <p className="text-slate-400 text-sm font-medium">Pilih jalur sertifikasi untuk melihat level studinya.</p>
         </div>
         <div className="flex flex-wrap gap-4">
            {appCategories.map(cat => (
               <div key={cat.id} className="relative group">
                 <button 
                    onClick={() => { setSelectedCategoryFilter(cat.id); setSelectedLevel(null); setChapters([]); setMaterials([]); }}
                    className={`px-8 py-4 rounded-2xl font-black flex items-center gap-4 cursor-pointer shadow-lg transition-all border border-white/10 ${selectedCategoryFilter === cat.id ? 'bg-teal-500 scale-105 ring-4 ring-teal-500/20' : 'bg-white/5 hover:bg-white/10'}`}
                 >
                    {cat.icon_url ? (
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                        <img src={cat.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-xl">🌟</span>
                    )}
                    {cat.name}
                 </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); openIconPicker('category', cat); }}
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white text-slate-900 border shadow-xl flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                  title="Edit Icon"
                 >
                   ✎
                 </button>
               </div>
            ))}
         </div>
      </section>

      {/* 1. LEVELS */}
      {selectedCategoryFilter && (
        <section className="animate-in fade-in slide-in-from-top-4">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">1. Select Level in Category</h3>
              <button onClick={() => setEditingLevel({ level_code: "nX", title: "New Level", badge_color: "#14b8a6", sort_order: levels.length + 1, category_id: selectedCategoryFilter })} className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-xl">Add Level</button>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4">
              {levels.filter(l => l.category_id === selectedCategoryFilter).map(lvl => (
                 <div key={lvl.id} className="relative group">
                   <button 
                      onClick={() => handleSelectLevel(lvl)}
                      className={`px-8 py-4 flex flex-col items-center gap-2 rounded-2xl font-black transition-all ${selectedLevel?.id === lvl.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                   >
                      {lvl.icon_url && (
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                          <img src={lvl.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <span className="text-sm">{lvl.level_code.toUpperCase()}</span>
                      <span className="text-[10px] font-medium opacity-50">{lvl.title}</span>
                   </button>
                   <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                      <button onClick={() => setEditingLevel(lvl)} className="p-1.5 bg-slate-100 rounded-lg text-[10px] shadow-sm hover:scale-110 transition">✎</button>
                      <button onClick={() => handleDeleteLevel(lvl.id)} className="p-1.5 bg-rose-500 text-white rounded-lg text-[10px] shadow-sm hover:scale-110 transition">✕</button>
                   </div>
                 </div>
              ))}
              {levels.filter(l => l.category_id === selectedCategoryFilter).length === 0 && (
                <div className="text-slate-400 font-bold italic py-4">Belum ada Level di kategori ini.</div>
              )}
           </div>
        </section>
      )}

      {/* CHAPTERS */}
      {selectedLevel && (
        <section className="animate-in fade-in slide-in-from-top-4 border-t pt-8">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-black text-slate-800">2. Chapters in {selectedLevel.level_code.toUpperCase()}</h3>
             <button onClick={() => setEditingChapter({ title: "New Bab", is_locked: false, sort_order: chapters.length + 1 })} className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-xl">Add Chapter</button>
           </div>
           <div className="flex flex-wrap gap-3">
              {chapters.map(chap => (
                 <div key={chap.id} className="relative group">
                   <button 
                      onClick={() => handleSelectChapter(chap)}
                      className={`px-5 py-3 flex items-center gap-3 rounded-xl text-sm font-bold transition-all ${selectedChapter?.id === chap.id ? 'bg-teal-500 text-white shadow-lg' : 'bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-teal-500'}`}
                   >
                      {chap.icon_url && (
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                          <img src={chap.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {chap.is_locked && <span className="text-xs">🔒</span>}
                      {chap.title}
                   </button>
                   <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                      <button onClick={() => setEditingChapter(chap)} className="p-1.5 bg-slate-100 shadow-sm ring-1 ring-black/5 rounded-lg text-[10px]">✎</button>
                      <button onClick={() => handleDeleteChapter(chap.id)} className="p-1.5 bg-rose-500 shadow-sm text-white rounded-lg text-[10px]">✕</button>
                   </div>
                 </div>
              ))}
              {chapters.length === 0 && <p className="text-slate-400 font-medium text-sm">No chapters found.</p>}
           </div>
        </section>
      )}

      {/* MATERIALS */}
      {selectedChapter && (
        <section className="animate-in fade-in slide-in-from-top-4 border-t pt-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">3. Manage Materials</h3>
              <button 
                 onClick={() => openMaterialModal({ title: "New Material", material_type: "moji_goi", sort_order: materials.length + 1 })} 
                 className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-xl"
              >
                 Add Material
              </button>
           </div>
           <div className="grid md:grid-cols-2 gap-4">
              {materials.map(mat => (
                <div key={mat.id} className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 relative group flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      {mat.icon_url && (
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                          <img src={mat.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${mat.material_type === 'quiz' ? 'text-rose-500' : 'text-teal-600'}`}>{mat.material_type}</p>
                        <h4 className="font-bold text-slate-800 mt-1">{mat.title}</h4>
                      </div>
                   </div>
                   <div className="flex gap-2">
                       <button onClick={() => openMaterialModal(mat)} className="px-4 py-2 bg-slate-90 rounded-lg text-xs font-bold ring-1 ring-slate-200 hover:bg-slate-50">
                          EDIT
                       </button>
                       <button onClick={() => handleDeleteMaterial(mat.id)} className="px-3 py-2 bg-rose-50 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-100">✕</button>
                   </div>
                </div>
              ))}
              {materials.length === 0 && <p className="text-slate-400 text-sm font-medium">No materials in this chapter.</p>}
           </div>
        </section>
      )}

      {/* --- MODALS --- */}

      {/* Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingLevel.id ? 'Edit Level' : 'New Level'}</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Level Category</label>
                    <select 
                       value={editingLevel.category_id || ""} 
                       onChange={e => setEditingLevel({...editingLevel, category_id: e.target.value})} 
                       className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold border-none"
                    >
                       <option value="">-- Pilih Kategori --</option>
                       {appCategories.map(cat => (
                         <option key={cat.id} value={cat.id}>{cat.name}</option>
                       ))}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Level Code</label>
                    <input value={editingLevel.level_code || ""} onChange={e => setEditingLevel({...editingLevel, level_code: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Title</label>
                    <input value={editingLevel.title || ""} onChange={e => setEditingLevel({...editingLevel, title: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Badge Color</label>
                    <input type="color" value={editingLevel.badge_color || "#14b8a6"} onChange={e => setEditingLevel({...editingLevel, badge_color: e.target.value})} className="w-full h-12 p-0 rounded-2xl overflow-hidden cursor-pointer" />
                 </div>
                 <div className="pt-4 border-t">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Level Icon</label>
                     <div className="flex items-center gap-4">
                       {editingLevel.icon_url && (
                         <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm ring-1 ring-slate-100">
                           <img src={editingLevel.icon_url || undefined} className="w-full h-full object-contain" alt="icon"/>
                         </div>
                       )}
                       <button onClick={() => openIconPicker('level')} className="flex-1 py-4 bg-slate-100 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">🖼️ Pilih dari Galeri</button>
                     </div>
                 </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                 <button onClick={() => setEditingLevel(null)} className="text-xs font-bold text-slate-400">Cancel</button>
                 <button onClick={handleSaveLevel} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Save</button>
              </div>
           </div>
        </div>
      )}

      {/* Chapter Modal */}
      {editingChapter && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingChapter.id ? 'Edit Bab' : 'New Bab'}</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Title</label>
                    <input value={editingChapter.title || ""} onChange={e => setEditingChapter({...editingChapter, title: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Sort Order</label>
                    <input type="number" value={editingChapter.sort_order || 0} onChange={e => setEditingChapter({...editingChapter, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div className="pt-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Chapter Icon</label>
                     <div className="flex items-center gap-4">
                       {editingChapter.icon_url && (
                         <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm ring-1 ring-slate-100">
                           <img src={editingChapter.icon_url || undefined} className="w-full h-full object-contain" alt="icon"/>
                         </div>
                       )}
                       <button onClick={() => openIconPicker('chapter')} className="flex-1 py-4 bg-slate-100 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">🖼️ Pilih dari Galeri</button>
                     </div>
                 </div>
                 <div className="pt-4 border-t">
                    <label className="flex items-center gap-3 cursor-pointer">
                       <input type="checkbox" checked={editingChapter.is_locked || false} onChange={e => setEditingChapter({...editingChapter, is_locked: e.target.checked})} className="w-5 h-5 accent-rose-500" />
                       <span className="text-sm font-bold text-rose-600 flex items-center gap-2">Premium Locked 🔒</span>
                    </label>
                 </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                 <button onClick={() => setEditingChapter(null)} className="text-xs font-bold text-slate-400">Cancel</button>
                 <button onClick={handleSaveChapter} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Save</button>
              </div>
           </div>
        </div>
      )}

      {/* Material Modal */}
      {editingMaterial && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl flex flex-col h-[90vh]">
               <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-2xl font-black italic">{editingMaterial.id ? 'Edit Material' : 'New Material'}</h3>
                  <button onClick={() => setEditingMaterial(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200">✕</button>
               </div>
               
               <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Material Type</label>
                      <select 
                         value={editingMaterial.material_type} 
                         onChange={e => {
                           const newType = e.target.value as any;
                           setEditingMaterial({...editingMaterial, material_type: newType});
                           if (newType === 'moji_goi' || newType === 'bunpou') setFormContent({ items: [] });
                           else if (newType === 'dokkai') setFormContent({ text_jp: '', text_id: '', exercises: [] });
                           else if (newType === 'choukai') setFormContent({ audioUrl: '', exercises: [] });
                           else setFormContent({ exercises: [] });
                         }}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 font-bold appearance-none outline-none border focus:border-teal-500"
                      >
                         <option value="moji_goi">Moji / Goi</option>
                         <option value="bunpou">Bunpou</option>
                         <option value="dokkai">Dokkai</option>
                         <option value="choukai">Choukai</option>
                         <option value="quiz">Quiz 🎯</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Title</label>
                      <input value={editingMaterial.title || ""} onChange={e => setEditingMaterial({...editingMaterial, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border font-bold" />
                    </div>
                    <div className="col-span-2 mt-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Material Custom Icon</label>
                       <div className="flex items-center gap-4">
                         {editingMaterial.icon_url && <img src={editingMaterial.icon_url || undefined} className="w-12 h-12 rounded bg-slate-100 object-cover" alt="icon"/>}
                         <button onClick={() => openIconPicker('material')} className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-lg hover:bg-slate-200">🖼️ Pilih dari Galeri</button>
                       </div>
                    </div>
                    <div className="col-span-2 pt-4 border-t mt-2">
                       <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={editingMaterial.is_locked || false} onChange={e => setEditingMaterial({...editingMaterial, is_locked: e.target.checked})} className="w-5 h-5 accent-rose-500" />
                          <span className="text-sm font-bold text-rose-600 flex items-center gap-2">Premium Locked 🔒</span>
                       </label>
                    </div>
                 </div>

                 <div className="pt-6 border-t mt-6">
                   {renderDynamicFields()}
                 </div>
               </div>

               <div className="mt-6 shrink-0 pt-4 border-t">
                  <button onClick={handleSaveMaterial} className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-xl shadow-xl active:scale-95 transition">SAVE MATERIAL</button>
               </div>
            </div>
         </div>
      )}

      {/* ICON PICKER MODAL */}
      {pickerTarget && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl p-8 shadow-2xl flex flex-col h-[85vh]">
               <div className="flex justify-between items-center mb-6 shrink-0 border-b pb-4">
                  <h3 className="text-2xl font-black italic">Pick an Icon</h3>
                  <button onClick={() => setPickerTarget(null)} className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200">✕</button>
               </div>

               <div className="flex flex-1 overflow-hidden gap-6">
                  {/* Category Sidebar */}
                  <div className="w-1/4 border-r pr-6 overflow-y-auto space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Categories</p>
                     {categories.map(cat => (
                       <button 
                         key={cat.id} 
                         onClick={() => handleSelectIconCategory(cat)}
                         className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeCategory?.id === cat.id ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100'}`}
                       >
                         {cat.name}
                       </button>
                     ))}
                     {categories.length === 0 && <p className="text-sm font-medium text-slate-400">Belum ada kategori galeri.</p>}
                  </div>

                  {/* Icon Grid Viewer */}
                  <div className="w-3/4 overflow-y-auto pl-2">
                     {activeCategory ? (
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
                     {activeCategory && iconLibrary.length === 0 && (
                        <div className="p-10 text-center bg-slate-50 rounded-2xl">
                           <p className="font-bold text-slate-400">Kategori ini kosong.</p>
                           <p className="text-sm text-slate-400">Buka tab "Icons Gallery" untuk melakukan mass upload.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}


