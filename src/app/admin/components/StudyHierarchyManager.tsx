"use client";

import { useState, useEffect } from "react";
import { 
  getStudyLevels, getStudyChapters, getStudyMaterials, 
  upsertStudyLevel, deleteStudyLevel, 
  upsertStudyChapter, deleteStudyChapter, 
  upsertStudyMaterial, deleteStudyMaterial,
  getIconCategories, getIconLibrary,
  getMaterialCategories, upsertMaterialCategory, deleteMaterialCategory,
  bulkUpdateMaterialCategories, bulkUpdateStudyLevels, bulkUpdateStudyChapters, bulkUpdateStudyMaterials,
  getStudyMaterialById
} from "@/lib/db";
import { StudyLevel, StudyChapter, StudyMaterial, IconCategory, IconLibraryItem, MaterialCategory } from "@/lib/types";
import MediaUploader from "@/app/components/MediaUploader";
import { motion } from "framer-motion";
import QuizCreatorDashboard from "./QuizCreatorDashboard";

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
  const [editingCategory, setEditingCategory] = useState<Partial<MaterialCategory> | null>(null);
  const [editingAppCategory, setEditingAppCategory] = useState<MaterialCategory | null>(null);
  
  // Dynamic Editor Content state
  const [formContent, setFormContent] = useState<any>({});
  const [useCustomTypeName, setUseCustomTypeName] = useState(false);

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

  const moveCategory = async (idx: number, direction: 'up' | 'down') => {
    let list = [...appCategories].sort((a,b) => {
      if ((a.sort_order||0) !== (b.sort_order||0)) return (a.sort_order||0) - (b.sort_order||0);
      return a.id.localeCompare(b.id);
    });

    // Normalize
    list = list.map((c, i) => ({ ...c, sort_order: i + 1 }));

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx].sort_order;
    list[idx].sort_order = list[targetIdx].sort_order;
    list[targetIdx].sort_order = temp;

    const finalOrder = [...list].sort((a,b) => (a.sort_order||0) - (b.sort_order||0));
    setAppCategories(finalOrder);

    try {
      const updates = finalOrder.map(c => ({ id: c.id, sort_order: c.sort_order }));
      await bulkUpdateMaterialCategories(updates);
    } catch (e) {
      console.error("Move Category Error:", e);
      loadLevels();
    }
  };

  const moveMaterial = async (idx: number, direction: 'up' | 'down') => {
    if (!selectedChapter) return;
    
    // 1. Get current list and sort them
    let list = [...materials].sort((a,b) => {
      if ((a.sort_order||0) !== (b.sort_order||0)) return (a.sort_order||0) - (b.sort_order||0);
      return a.id.localeCompare(b.id); // Tie-breaker
    });

    // 2. Normalize orders to 1, 2, 3... to fix any duplicates/gaps
    list = list.map((m, i) => ({ ...m, sort_order: i + 1 }));

    // 3. Swap with neighbor
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx].sort_order;
    list[idx].sort_order = list[targetIdx].sort_order;
    list[targetIdx].sort_order = temp;

    // 4. Sort again after swap to maintain visual consistency in state
    const finalOrder = [...list].sort((a,b) => (a.sort_order||0) - (b.sort_order||0));
    setMaterials(finalOrder);

    // 5. Update ALL in DB to ensure total consistency
    try {
      const updates = finalOrder.map(m => ({ id: m.id, sort_order: m.sort_order }));
      await bulkUpdateStudyMaterials(updates as any);
    } catch (e) {
      console.error("Move Material Sync Error:", e);
      loadMaterials(selectedChapter.id);
    }
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
      const finalContent = { ...formContent };
      if (!useCustomTypeName) {
        finalContent.custom_type_name = null;
      }
      await upsertStudyMaterial({ ...editingMaterial, chapter_id: selectedChapter.id, content: finalContent });
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

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    try {
      await upsertMaterialCategory(editingCategory);
      setEditingCategory(null);
      loadLevels();
    } catch (e) { alert("Error saving category"); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? This will hide all levels inside it from the Materi tab.")) return;
    try {
      await deleteMaterialCategory(id);
      setSelectedCategoryFilter(null);
      loadLevels();
    } catch (e) { alert("Error deleting category"); }
  };

  const openMaterialModal = async (mat: Partial<StudyMaterial>) => {
    let fullMat = mat;
    
    // Jika content tidak ada (karena fetch selective), ambil detail lengkapnya
    if (mat.id && !mat.content) {
      const detail = await getStudyMaterialById(mat.id);
      if (detail) fullMat = detail;
    }

    setEditingMaterial(fullMat);
    const c = (fullMat.content || {}) as any;
    setUseCustomTypeName(!!c.custom_type_name);
    const mediaFields = {
      pdf_url: c.pdf_url || null,
      document_url: c.document_url || null,
      ppt_url: c.ppt_url || null,
      pdf_name: c.pdf_name || null,
      ppt_name: c.ppt_name || null,
      custom_type_name: c.custom_type_name || null,
      audioUrl: c.audioUrl || null,
    };

    if (fullMat.material_type === 'moji_goi' || fullMat.material_type === 'bunpou') {
      setFormContent({ items: c.items || [], ...mediaFields });
    } else if (fullMat.material_type === 'dokkai') {
      setFormContent({ text_jp: c.text_jp || '', text_id: c.text_id || '', exercises: c.exercises || [], ...mediaFields });
    } else if (fullMat.material_type === 'choukai') {
      setFormContent({ exercises: c.exercises || [], ...mediaFields });
    } else if (fullMat.material_type === 'quiz' || fullMat.material_type === 'latihan') {
      setFormContent({ 
        exercises: c.exercises || [], 
        is_section_test: c.is_section_test || false,
        sections: c.sections || [],
        duration_minutes: c.duration_minutes || 60,
        pass_point: c.pass_point || 60,
        shuffle_questions: c.shuffle_questions || false,
        shuffle_answers: c.shuffle_answers || false,
        fullscreen_mode: c.fullscreen_mode || false,
        limit_attempts: c.limit_attempts || 1,
        anti_back: c.anti_back || false,
        auto_submit: c.auto_submit || true,
        ...mediaFields 
      });
    } else {
      setFormContent({ ...c, ...mediaFields });
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
        await upsertMaterialCategory(updatedCat);
        setEditingAppCategory(null);
        loadLevels(); // Refresh all data
      } catch (err) { alert("Error saving category icon"); }
    }
    else if (pickerTarget === 'category' && editingCategory) setEditingCategory({...editingCategory, icon_url: url});
    else if (pickerTarget === 'level' && editingLevel) setEditingLevel({...editingLevel, icon_url: url});
    else if (pickerTarget === 'chapter' && editingChapter) setEditingChapter({...editingChapter, icon_url: url});
    else if (pickerTarget === 'material' && editingMaterial) setEditingMaterial({...editingMaterial, icon_url: url});
    setPickerTarget(null);
  };


  // --- DYNAMIC FORM RENDERERS ---

  const renderExercisesEditor = () => {
    return (
      <div className="mt-6">
        <QuizCreatorDashboard
          initialData={formContent}
          onChange={(newData) => {
            setFormContent({ ...formContent, ...newData });
          }}
          materialType={
            editingMaterial?.material_type === "quiz"
              ? "quiz"
              : editingMaterial?.material_type === "latihan"
              ? "latihan"
              : "quiz"
          }
        />
      </div>
    );
  };

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
            <div key={i} className="p-4 bg-slate-50 rounded-2xl relative mb-4 border border-slate-200">
               <button onClick={() => setFormContent({...formContent, items: formContent.items.filter((_:any, idx:number) => idx !== i)})} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 p-2">✕</button>
               <label className="text-[10px] font-bold text-slate-400">Pattern</label>
               <input placeholder="N は N です" value={item.pattern || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].pattern = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full px-4 py-2 rounded-lg border mb-2 font-bold focus:border-teal-500 focus:outline-none" />
               <label className="text-[10px] font-bold text-slate-400">Explanation</label>
               <textarea placeholder="Penjelasan..." value={item.explanation || ''} onChange={e => { const newItems = [...formContent.items]; newItems[i].explanation = e.target.value; setFormContent({...formContent, items: newItems}); }} className="w-full h-32 px-4 py-2 rounded-lg border mb-2 text-sm focus:border-teal-500 focus:outline-none" />
               
               {/* Beautiful multiple example sentence form editor */}
               <label className="text-[10px] font-black uppercase text-teal-600 tracking-wider block mt-4 mb-2">Daftar Contoh Kalimat (Examples)</label>
               <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                 {(item.examples || []).map((ex: any, exIdx: number) => (
                   <div key={exIdx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg relative border border-slate-100">
                     <div className="flex-1 space-y-2">
                       <input 
                         placeholder="Contoh Jepang (ex: これは何ですか。)" 
                         value={ex.jp || ''} 
                         onChange={e => {
                           const newItems = [...formContent.items];
                           if (!newItems[i].examples) newItems[i].examples = [];
                           newItems[i].examples[exIdx] = { ...newItems[i].examples[exIdx], jp: e.target.value };
                           setFormContent({...formContent, items: newItems});
                         }} 
                         className="w-full px-3 py-1.5 rounded bg-white border text-sm font-bold focus:border-teal-500 focus:outline-none" 
                       />
                       <input 
                         placeholder="Terjemahan Arti (ex: Ini apa?)" 
                         value={ex.id || ''} 
                         onChange={e => {
                           const newItems = [...formContent.items];
                           if (!newItems[i].examples) newItems[i].examples = [];
                           newItems[i].examples[exIdx] = { ...newItems[i].examples[exIdx], id: e.target.value };
                           setFormContent({...formContent, items: newItems});
                         }} 
                         className="w-full px-3 py-1.5 rounded bg-white border text-xs focus:border-teal-500 focus:outline-none" 
                       />
                     </div>
                     <button 
                       onClick={() => {
                         const newItems = [...formContent.items];
                         newItems[i].examples = newItems[i].examples.filter((_: any, idx: number) => idx !== exIdx);
                         setFormContent({...formContent, items: newItems});
                       }} 
                       className="text-slate-400 hover:text-rose-500 p-2 shrink-0 font-bold self-start mt-1"
                       title="Hapus Contoh"
                     >
                       ✕
                     </button>
                   </div>
                 ))}
                 <button 
                   onClick={() => {
                     const newItems = [...formContent.items];
                     if (!newItems[i].examples) newItems[i].examples = [];
                     newItems[i].examples.push({ jp: '', id: '' });
                     setFormContent({...formContent, items: newItems});
                   }} 
                   className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg font-black text-[10px] tracking-wider uppercase hover:bg-teal-100 transition"
                 >
                   + Tambah Contoh Kalimat
                 </button>
               </div>
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
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <MediaUploader
              label="File Audio Materi Choukai (MP3/OGG)"
              mediaType="audio"
              value={formContent.audioUrl}
              onChange={(url) => setFormContent({...formContent, audioUrl: url})}
            />
          </div>
          {renderExercisesEditor()}
        </div>
      );
    }

    if (type === 'quiz' || type === 'latihan') {
      return renderExercisesEditor();
    }

    return null;
  };

  if (loading) return <div className="p-10 font-bold text-slate-400">Loading data...</div>;

  return (
    <div className="space-y-12">
      {/* 0. CATEGORIES */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
          <div className="mb-6 flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black italic">0. Select Category First</h3>
                <p className="text-slate-400 text-sm font-medium">Pilih jalur sertifikasi untuk melihat level studinya.</p>
             </div>
             <button 
                onClick={() => setEditingCategory({ name: "Kategori Baru", description: "", badge_color: "#14b8a6", sort_order: appCategories.length + 1 })}
                className="px-6 py-2 bg-white text-slate-900 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg hover:scale-105 transition active:scale-95"
             >
                + Add Category
             </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {[...appCategories].sort((a,b) => (a.sort_order||0) - (b.sort_order||0)).map((cat, idx, arr) => (
               <div 
                 key={cat.id} 
                 className="relative group"
               >
                 <div className="flex flex-col gap-2">
                    <button 
                       onClick={() => { setSelectedCategoryFilter(cat.id); setSelectedLevel(null); setChapters([]); setMaterials([]); }}
                       className={`px-8 py-4 rounded-2xl font-black flex items-center gap-4 cursor-pointer shadow-lg transition-all border border-white/10 ${selectedCategoryFilter === cat.id ? 'bg-teal-500 scale-105 ring-4 ring-teal-500/20' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                       <div className="h-8 w-8 shrink-0 bg-white/20 rounded-lg flex items-center justify-center text-[10px] text-white">
                          {idx + 1}
                       </div>
                       {cat.icon_url ? (
                         <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                           <img src={cat.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                         </div>
                       ) : (
                         <span className="text-xl">🌟</span>
                       )}
                       <span className="flex flex-col items-start">
                         <span className="text-[8px] opacity-40 font-bold">Order: {cat.sort_order}</span>
                         {cat.name}
                       </span>
                    </button>
                    
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                         disabled={idx === 0}
                         onClick={() => moveCategory(idx, 'up')}
                         className="h-6 w-10 bg-white/10 hover:bg-teal-500 rounded-lg text-[10px] text-white flex items-center justify-center disabled:opacity-20"
                       >
                         ▲
                       </button>
                       <button 
                         disabled={idx === arr.length - 1}
                         onClick={() => moveCategory(idx, 'down')}
                         className="h-6 w-10 bg-white/10 hover:bg-teal-500 rounded-lg text-[10px] text-white flex items-center justify-center disabled:opacity-20"
                       >
                         ▼
                       </button>
                    </div>
                 </div>
                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openIconPicker('category', cat); }}
                      className="h-8 w-8 rounded-xl bg-white text-slate-900 border shadow-xl flex items-center justify-center text-xs hover:scale-110 active:scale-95"
                      title="Edit Icon"
                    >
                      ✨
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                      className="h-8 w-8 rounded-xl bg-slate-900 text-white shadow-xl flex items-center justify-center text-xs hover:scale-110 active:scale-95"
                      title="Edit Details"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className="h-8 w-8 rounded-xl bg-rose-500 text-white shadow-xl flex items-center justify-center text-xs hover:scale-110 active:scale-95"
                      title="Delete Category"
                    >
                      ✕
                    </button>
                  </div>
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
              {levels.filter(l => l.category_id === selectedCategoryFilter).sort((a,b) => a.sort_order - b.sort_order).map(lvl => (
                 <div 
                    key={lvl.id} 
                    className="relative group"
                 >
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
              {chapters.sort((a,b) => a.sort_order - b.sort_order).map(chap => (
                 <div 
                    key={chap.id} 
                    className="relative group"
                 >
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
                       <span className="flex flex-col items-start">
                         {chap.title}
                       </span>
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
              {[...materials].sort((a,b) => (a.sort_order||0) - (b.sort_order||0)).map((mat, idx, arr) => (
                <div 
                  key={mat.id} 
                  className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 relative group flex items-center justify-between"
                >
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 shrink-0 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic text-xs shadow-lg">{idx + 1}</div>
                      {mat.icon_url && (
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm">
                          <img src={mat.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${mat.material_type === 'quiz' ? 'text-rose-500' : mat.material_type === 'latihan' ? 'text-amber-500' : 'text-teal-600'}`}>
                          {mat.material_type}
                          {(() => {
                            const c = (typeof mat.content === 'string' ? JSON.parse(mat.content) : mat.content) || {};
                            return c.custom_type_name ? ` (${c.custom_type_name})` : '';
                          })()}
                        </p>
                        <h4 className="font-bold text-slate-800 mt-1">{mat.title}</h4>
                        <span className="text-[8px] text-slate-400 font-bold">Order: {mat.sort_order}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1 mr-2">
                           <button 
                             disabled={idx === 0}
                             onClick={() => moveMaterial(idx, 'up')}
                             className="p-1.5 bg-slate-100 rounded-lg text-[10px] hover:bg-teal-500 hover:text-white disabled:opacity-30 transition-all"
                             title="Move Up"
                           >
                             ▲
                           </button>
                           <button 
                             disabled={idx === arr.length - 1}
                             onClick={() => moveMaterial(idx, 'down')}
                             className="p-1.5 bg-slate-100 rounded-lg text-[10px] hover:bg-teal-500 hover:text-white disabled:opacity-30 transition-all"
                             title="Move Down"
                           >
                             ▼
                           </button>
                        </div>

                       <button onClick={() => openMaterialModal(mat)} className="px-4 py-2 bg-slate-50 rounded-lg text-xs font-bold ring-1 ring-slate-200 hover:bg-slate-100">
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
      
      {/* Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingCategory.id ? 'Edit Category' : 'New Category'}</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Category Name</label>
                    <input value={editingCategory.name || ""} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Description</label>
                    <textarea value={editingCategory.description || ""} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} className="w-full h-24 px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Badge Color</label>
                      <input type="color" value={editingCategory.badge_color || "#14b8a6"} onChange={e => setEditingCategory({...editingCategory, badge_color: e.target.value})} className="w-full h-12 p-0 rounded-2xl overflow-hidden cursor-pointer" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Sort Order</label>
                      <input type="number" value={editingCategory.sort_order || 0} onChange={e => setEditingCategory({...editingCategory, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                   </div>
                 </div>
                 <div className="pt-4 border-t">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Category Icon</label>
                     <div className="flex items-center gap-4">
                       {editingCategory.icon_url && (
                         <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm ring-1 ring-slate-100">
                           <img src={editingCategory.icon_url || undefined} className="w-full h-full object-contain" alt="icon"/>
                         </div>
                       )}
                       <button onClick={() => openIconPicker('category')} className="flex-1 py-4 bg-slate-100 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all">🖼️ Pilih dari Galeri</button>
                     </div>
                 </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t font-black uppercase tracking-widest text-[10px]">
                 <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600">Cancel</button>
                 <button onClick={handleSaveCategory} className="px-10 py-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition">SAVE</button>
              </div>
           </div>
        </div>
      )}

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
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Badge Color</label>
                       <input type="color" value={editingLevel.badge_color || "#14b8a6"} onChange={e => setEditingLevel({...editingLevel, badge_color: e.target.value})} className="w-full h-12 p-0 rounded-2xl overflow-hidden cursor-pointer" />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Sort Order</label>
                       <input type="number" value={editingLevel.sort_order || 0} onChange={e => setEditingLevel({...editingLevel, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
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
                 <div className={`grid gap-4 mb-6 ${useCustomTypeName ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Material Type</label>
                      <select 
                         value={editingMaterial.material_type} 
                         onChange={e => {
                           const newType = e.target.value as any;
                           setEditingMaterial({...editingMaterial, material_type: newType});
                           
                           const mediaFields = {
                             pdf_url: formContent.pdf_url || null,
                             document_url: formContent.document_url || null,
                              pdf_name: formContent.pdf_name || null,
                              ppt_name: formContent.ppt_name || null,
                               custom_type_name: formContent.custom_type_name || null,
                             ppt_url: formContent.ppt_url || null,
                             audioUrl: formContent.audioUrl || null,
                           };

                           if (newType === 'moji_goi' || newType === 'bunpou') setFormContent({ items: [], ...mediaFields });
                           else if (newType === 'dokkai') setFormContent({ text_jp: '', text_id: '', exercises: [], ...mediaFields });
                           else if (newType === 'choukai') setFormContent({ exercises: [], ...mediaFields });
                           else setFormContent({ exercises: [], ...mediaFields });
                         }}
                         className="w-full px-4 py-3 rounded-xl bg-slate-50 font-bold appearance-none outline-none border focus:border-teal-500"
                      >
                         <option value="moji_goi">Moji / Goi</option>
                         <option value="bunpou">Bunpou</option>
                         <option value="dokkai">Dokkai</option>
                         <option value="choukai">Choukai</option>
                         <option value="quiz">Quiz 🎯</option>
                          <option value="latihan">Latihan 📝</option>
                      </select>
                       <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                         <input 
                           type="checkbox" 
                           checked={useCustomTypeName} 
                           onChange={e => setUseCustomTypeName(e.target.checked)}
                           className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4"
                         />
                         <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kustom Nama Tipe</span>
                       </label>
                    </div>
                    {useCustomTypeName && (
                      <div className="animate-in fade-in duration-300">
                        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Custom Nama Tipe</label>
                        <input 
                          placeholder="Contoh: Kosakata, Tata Bahasa" 
                          value={formContent.custom_type_name || ""} 
                          onChange={e => setFormContent({...formContent, custom_type_name: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border font-bold focus:border-teal-500 focus:outline-none" 
                        />
                      </div>
                    )}
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
                     {(editingMaterial.material_type === 'quiz' || editingMaterial.material_type === 'latihan') && (
                       <div className="col-span-2 p-5 bg-amber-500/[0.04] border border-amber-500/10 rounded-2xl space-y-4 mt-2 animate-in fade-in duration-300">
                         <div className="flex items-center gap-2">
                           <span className="text-lg">⏱️</span>
                           <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Pengaturan Waktu & Kelulusan Kuis</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Durasi Kuis (Menit)</label>
                             <input 
                               type="number" 
                               min="1" 
                               value={formContent.duration_minutes !== undefined ? formContent.duration_minutes : 60} 
                               onChange={e => {
                                 const val = parseInt(e.target.value) || 60;
                                 setFormContent({ ...formContent, duration_minutes: val });
                               }} 
                               className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-teal-500 focus:outline-none"
                             />
                           </div>
                           <div>
                             <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">Skor Kelulusan (%)</label>
                             <input 
                               type="number" 
                               min="1" 
                               max="100" 
                               value={formContent.pass_point !== undefined ? formContent.pass_point : 60} 
                               onChange={e => {
                                 const val = parseInt(e.target.value) || 60;
                                 setFormContent({ ...formContent, pass_point: val });
                               }} 
                               className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-teal-500 focus:outline-none"
                             />
                           </div>
                         </div>
                       </div>
                     )}
                     {editingMaterial.material_type !== 'quiz' && editingMaterial.material_type !== 'latihan' && (
                     <div className="col-span-2 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 mt-2">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">🎬 Media Materi (Opsional)</p>
                        <MediaUploader
                          label="Video Materi (MP4/WebM)"
                          mediaType="video"
                          value={editingMaterial.video_url}
                          onChange={(url, size, provider) => setEditingMaterial({...editingMaterial, video_url: url, file_size: size, storage_provider: provider})}
                        />
                        <MediaUploader
                          label="Gambar Pendukung"
                          mediaType="image"
                          value={editingMaterial.image_url}
                          onChange={(url, size, provider) => setEditingMaterial({...editingMaterial, image_url: url})}
                        />
                        <MediaUploader
                          label="Audio Materi / Pendukung (MP3/OGG - Opsional)"
                          mediaType="audio"
                          accept="audio/*"
                          value={formContent.audioUrl}
                          onChange={(url) => setFormContent({...formContent, audioUrl: url})}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <div className="p-4 bg-white/40 border border-slate-100 rounded-2xl space-y-3">
                            <MediaUploader
                              label="Dokumen PDF (Maks 100 MB)"
                              mediaType="document"
                              accept=".pdf,application/pdf"
                              value={formContent.pdf_url || formContent.document_url}
                              onChange={(url) => setFormContent({...formContent, pdf_url: url, document_url: url})}
                            />
                            {(formContent.pdf_url || formContent.document_url) && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Custom Judul PDF (Opsional)</label>
                                <input 
                                  placeholder="Default: Dokumen PDF"
                                  value={formContent.pdf_name || ""} 
                                  onChange={e => setFormContent({...formContent, pdf_name: e.target.value})} 
                                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-teal-500 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="p-4 bg-white/40 border border-slate-100 rounded-2xl space-y-3">
                            <MediaUploader
                              label="Slide PPT / Presentasi (Maks 100 MB)"
                              mediaType="document"
                              accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                              value={formContent.ppt_url}
                              onChange={(url) => setFormContent({...formContent, ppt_url: url})}
                            />
                            {formContent.ppt_url && (
                              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Custom Judul PPT (Opsional)</label>
                                <input 
                                  placeholder="Default: Slide PPT / Presentasi"
                                  value={formContent.ppt_name || ""} 
                                  onChange={e => setFormContent({...formContent, ppt_name: e.target.value})} 
                                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold focus:border-teal-500 focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                     </div>
                     )}
                    <div className="col-span-2 pt-4 border-t mt-2">
                        <div className="flex gap-6">
                           <div className="flex-1">
                              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Sort Order</label>
                              <input type="number" value={editingMaterial.sort_order || 0} onChange={e => setEditingMaterial({...editingMaterial, sort_order: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 border font-bold" />
                           </div>
                           <label className="flex items-center gap-3 cursor-pointer pb-2">
                              <input type="checkbox" checked={editingMaterial.is_locked || false} onChange={e => setEditingMaterial({...editingMaterial, is_locked: e.target.checked})} className="w-5 h-5 accent-rose-500" />
                              <span className="text-sm font-bold text-rose-600 flex items-center gap-2">Premium Locked 🔒</span>
                           </label>
                        </div>
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


