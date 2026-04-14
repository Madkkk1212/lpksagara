"use client";

import { useEffect, useState } from "react";
import { ExamLevel, ExamTest, Question, IconCategory, IconLibraryItem } from "@/lib/types";
import { 
  getExamLevels, getExamTests, getQuestions, 
  upsertExamLevel, deleteExamLevel, 
  upsertExamTest, deleteExamTest, 
  upsertQuestion, deleteQuestion,
  getIconCategories, getIconLibrary
} from "@/lib/db";

export default function ExamManager() {
  const [levels, setLevels] = useState<ExamLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<ExamLevel | null>(null);
  const [tests, setTests] = useState<ExamTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ExamTest | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals / Forms
  const [editingLevel, setEditingLevel] = useState<Partial<ExamLevel> | null>(null);
  const [editingTest, setEditingTest] = useState<Partial<ExamTest> | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Partial<Question> | null>(null);

  // Icon Picker states
  const [pickerOpen, setPickerOpen] = useState(false);
  const [iconCategories, setIconCategories] = useState<IconCategory[]>([]);
  const [activeIconCategory, setActiveIconCategory] = useState<IconCategory | null>(null);
  const [iconLibrary, setIconLibrary] = useState<IconLibraryItem[]>([]);

  useEffect(() => {
    fetchLevels();
  }, []);

  async function fetchLevels() {
    setLoading(true);
    const data = await getExamLevels();
    setLevels(data);
    setLoading(false);
  }

  async function handleSelectLevel(level: ExamLevel) {
    setSelectedLevel(level);
    setSelectedTest(null);
    setQuestions([]);
    const data = await getExamTests(level.id);
    setTests(data);
  }

  async function handleSelectTest(test: ExamTest) {
    setSelectedTest(test);
    const data = await getQuestions(test.id);
    setQuestions(data);
  }

  // --- CRUD HANDLERS ---
  
  // Levels
  const handleSaveLevel = async () => {
    if (!editingLevel) return;
    try {
      await upsertExamLevel(editingLevel);
      setEditingLevel(null);
      fetchLevels();
    } catch (e) { alert("Error saving level"); }
  };

  const handleDeleteLevel = async (id: string) => {
    if (!confirm("Delete level and all its tests?")) return;
    try {
      await deleteExamLevel(id);
      if (selectedLevel?.id === id) setSelectedLevel(null);
      fetchLevels();
    } catch (e) { alert("Error deleting level"); }
  };

  // Tests
  const handleSaveTest = async () => {
    if (!editingTest || !selectedLevel) return;
    try {
      await upsertExamTest({ ...editingTest, level_id: selectedLevel.id });
      setEditingTest(null);
      handleSelectLevel(selectedLevel);
    } catch (e) { alert("Error saving test"); }
  };

  const handleDeleteTest = async (id: string) => {
    if (!confirm("Delete test and all its questions?")) return;
    try {
      await deleteExamTest(id);
      if (selectedTest?.id === id) setSelectedTest(null);
      handleSelectLevel(selectedLevel!);
    } catch (e) { alert("Error deleting test"); }
  };

  // Questions
  const handleSaveQuestion = async () => {
    if (!editingQuestion || !selectedTest) return;
    try {
      await upsertQuestion({ ...editingQuestion, test_id: selectedTest.id });
      setEditingQuestion(null);
      handleSelectTest(selectedTest);
    } catch (e) { alert("Error saving question"); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete question?")) return;
    try {
      await deleteQuestion(id);
      handleSelectTest(selectedTest!);
    } catch (e) { alert("Error deleting question"); }
  };

  // Icon Picker Logic
  const openIconPicker = async () => {
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
    if (editingLevel) setEditingLevel({...editingLevel, icon_url: url});
    setPickerOpen(false);
  };

  if (loading && levels.length === 0) return <div className="text-center p-10 font-bold text-slate-400">Loading exam data...</div>;

  return (
    <div className="space-y-10">
      {/* 1. LEVEL LIST */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-800 italic">1. Select Level</h3>
          <button onClick={() => setEditingLevel({ level_code: "new", title: "New Level", sort_order: levels.length + 1 })} className="text-[10px] font-black uppercase bg-slate-900 text-white px-4 py-2 rounded-xl">Add Level</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {levels.map(lvl => (
            <div key={lvl.id} className="relative group">
              <button 
                onClick={() => handleSelectLevel(lvl)}
                className={`w-full p-6 rounded-3xl text-left transition-all flex flex-col items-center gap-3 ${selectedLevel?.id === lvl.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white border border-slate-100 hover:bg-slate-50'}`}
              >
                {lvl.icon_url && (
                  <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center p-2 shadow-sm">
                    <img src={lvl.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="text-center">
                   <p className="text-2xl font-black italic">{lvl.level_code.toUpperCase()}</p>
                   <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${selectedLevel?.id === lvl.id ? 'text-teal-400' : 'text-slate-400'}`}>{lvl.title}</p>
                </div>
              </button>
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-10">
                 <button onClick={() => setEditingLevel(lvl)} className="p-2 bg-white shadow-md rounded-lg text-xs">✎</button>
                 <button onClick={() => handleDeleteLevel(lvl.id)} className="p-2 bg-rose-500 text-white shadow-md rounded-lg text-xs">✕</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. TEST LIST (Visible if level selected) */}
      {selectedLevel && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex justify-between items-center mb-6 pt-10 border-t">
              <h3 className="text-xl font-black text-slate-800 italic">2. Tests in {selectedLevel.level_code.toUpperCase()}</h3>
              <button 
                onClick={() => setEditingTest({ category: "full", title: "New Test", duration_minutes: 60, pass_point: 75, difficulty: "Medium", is_active: true, sort_order: tests.length + 1 })}
                className="text-[10px] font-black uppercase bg-slate-900 text-white px-4 py-2 rounded-xl"
              >
                Add Test
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => (
                <div key={test.id} className="relative group">
                  <button 
                    onClick={() => handleSelectTest(test)}
                    className={`w-full p-8 rounded-[2.5rem] text-left transition-all relative overflow-hidden ${selectedTest?.id === test.id ? 'bg-slate-900 text-white shadow-2xl ring-4 ring-teal-500/20' : 'bg-slate-50 border border-slate-200 hover:bg-white'}`}
                  >
                    <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest mb-4 inline-block ${selectedTest?.id === test.id ? 'bg-white/20 text-teal-400' : 'bg-slate-200 text-slate-500'}`}>
                      {test.category.toUpperCase()}
                    </span>
                    <h4 className="text-xl font-black italic">{test.title}</h4>
                    <div className="mt-4 flex gap-4 text-[10px] font-bold uppercase tracking-widest opacity-60">
                       <span>{test.duration_minutes} MIN</span>
                       <span>{test.pass_point}% PASS</span>
                    </div>
                  </button>
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                     <button onClick={() => setEditingTest(test)} className="p-2 bg-white rounded-lg text-xs shadow-sm">✎</button>
                     <button onClick={() => handleDeleteTest(test.id)} className="p-2 bg-rose-500 text-white rounded-lg text-xs shadow-sm">✕</button>
                  </div>
                </div>
              ))}
              {tests.length === 0 && <p className="text-slate-400 font-medium italic">No tests found for this level.</p>}
           </div>
        </section>
      )}

      {/* 3. QUESTIONS LIST (Visible if test selected) */}
      {selectedTest && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex justify-between items-center mb-6 pt-10 border-t">
              <h3 className="text-xl font-black text-slate-800 italic">3. Questions in {selectedTest.title}</h3>
              <button 
                onClick={() => setEditingQuestion({ question_text: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_option: 0, sort_order: questions.length + 1 })}
                className="text-[10px] font-black uppercase bg-slate-900 text-white px-4 py-2 rounded-xl"
              >
                Add Question
              </button>
           </div>
           <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex gap-6 items-start group">
                   <div className="h-10 w-10 shrink-0 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">{idx + 1}</div>
                   <div className="flex-1">
                      <p className="font-bold text-slate-800 leading-relaxed mb-4">{q.question_text}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, i) => (
                            <div key={i} className={`px-4 py-2 rounded-xl text-xs font-bold border ${q.correct_option === i ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                               {String.fromCharCode(65+i)}. {opt}
                            </div>
                         ))}
                      </div>
                      {q.explanation && <p className="mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-widest italic">{q.explanation}</p>}
                   </div>
                   <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => setEditingQuestion(q)} className="p-2 bg-slate-100 rounded-xl text-xs">✎</button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl text-xs">✕</button>
                   </div>
                </div>
              ))}
              {questions.length === 0 && <p className="text-slate-400 font-medium italic">No questions found for this test.</p>}
           </div>
        </section>
      )}

      {/* --- MODALS --- */}

      {/* Level Modal */}
      {editingLevel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingLevel.id ? 'Edit Level' : 'New Level'}</h3>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Level Code (e.g. n5)</label>
                      <input value={editingLevel.level_code || ""} onChange={e => setEditingLevel({...editingLevel, level_code: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Sort Order</label>
                      <input type="number" value={editingLevel.sort_order || 0} onChange={e => setEditingLevel({...editingLevel, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Title (e.g. Beginning)</label>
                    <input value={editingLevel.title || ""} onChange={e => setEditingLevel({...editingLevel, title: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Grad From</label>
                      <input type="color" value={editingLevel.gradient_from || "#14b8a6"} onChange={e => setEditingLevel({...editingLevel, gradient_from: e.target.value})} className="w-full h-12 p-0 rounded-2xl overflow-hidden cursor-pointer bg-transparent border-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Grad To</label>
                      <input type="color" value={editingLevel.gradient_to || "#10b981"} onChange={e => setEditingLevel({...editingLevel, gradient_to: e.target.value})} className="w-full h-12 p-0 rounded-2xl overflow-hidden cursor-pointer bg-transparent border-none" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-teal-600 mb-2 block">Level Icon</label>
                    <div className="flex items-center gap-4">
                      {editingLevel.icon_url && (
                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-sm border border-slate-100">
                          <img src={editingLevel.icon_url || undefined} alt="icon" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <button 
                        onClick={openIconPicker} 
                        className="flex-1 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                      >
                        Pick from Gallery 🖼️
                      </button>
                    </div>
                    <input 
                      value={editingLevel.icon_url || ""} 
                      onChange={e => setEditingLevel({...editingLevel, icon_url: e.target.value})} 
                      placeholder="Or paste URL here..." 
                      className="w-full px-6 py-3 rounded-2xl bg-slate-50 border-none outline-none text-slate-800 font-bold mt-3 text-xs" 
                    />
                 </div>
              </div>
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t font-black tracking-widest text-[10px] uppercase">
                 <button onClick={() => setEditingLevel(null)} className="text-slate-400">Cancel</button>
                 <button onClick={handleSaveLevel} className="px-10 py-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition">Save Level</button>
              </div>
           </div>
        </div>
      )}

      {/* Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingTest.id ? 'Edit Test' : 'New Test'}</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Title</label>
                    <input value={editingTest.title || ""} onChange={e => setEditingTest({...editingTest, title: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Category</label>
                      <select value={editingTest.category} onChange={e => setEditingTest({...editingTest, category: e.target.value as any})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold appearance-none">
                         <option value="full">Full Test</option>
                         <option value="mini">Mini Test</option>
                         <option value="skill">Skill Test</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Difficulty</label>
                      <select value={editingTest.difficulty} onChange={e => setEditingTest({...editingTest, difficulty: e.target.value as any})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold appearance-none">
                         <option value="Easy">Easy</option>
                         <option value="Medium">Medium</option>
                         <option value="Hard">Hard</option>
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Duration (min)</label>
                      <input type="number" value={editingTest.duration_minutes || 0} onChange={e => setEditingTest({...editingTest, duration_minutes: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Pass Point (%)</label>
                      <input type="number" value={editingTest.pass_point || 0} onChange={e => setEditingTest({...editingTest, pass_point: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                 </div>
              </div>
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t font-black tracking-widest text-[10px] uppercase">
                 <button onClick={() => setEditingTest(null)} className="text-slate-400">Cancel</button>
                 <button onClick={handleSaveTest} className="px-10 py-3 bg-slate-900 text-white rounded-2xl shadow-xl active:scale-95 transition">Save Test</button>
              </div>
           </div>
        </div>
      )}

      {/* Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6 font-sans">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl p-12 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-2xl font-black text-slate-800 mb-8 italic">{editingQuestion.id ? 'Edit Question' : 'New Question'}</h3>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Question Text</label>
                    <textarea value={editingQuestion.question_text || ""} onChange={e => setEditingQuestion({...editingQuestion, question_text: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 font-bold h-24" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Option A</label>
                      <input value={editingQuestion.option_a || ""} onChange={e => setEditingQuestion({...editingQuestion, option_a: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Option B</label>
                      <input value={editingQuestion.option_b || ""} onChange={e => setEditingQuestion({...editingQuestion, option_b: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Option C</label>
                      <input value={editingQuestion.option_c || ""} onChange={e => setEditingQuestion({...editingQuestion, option_c: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Option D</label>
                      <input value={editingQuestion.option_d || ""} onChange={e => setEditingQuestion({...editingQuestion, option_d: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Correct Option</label>
                      <select value={editingQuestion.correct_option} onChange={e => setEditingQuestion({...editingQuestion, correct_option: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold appearance-none">
                         <option value={0}>Option A</option>
                         <option value={1}>Option B</option>
                         <option value={2}>Option C</option>
                         <option value={3}>Option D</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Sort</label>
                      <input type="number" value={editingQuestion.sort_order || 0} onChange={e => setEditingQuestion({...editingQuestion, sort_order: parseInt(e.target.value)})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Explanation (Optional)</label>
                    <input value={editingQuestion.explanation || ""} onChange={e => setEditingQuestion({...editingQuestion, explanation: e.target.value})} className="w-full px-6 py-3 rounded-2xl bg-slate-50 font-bold" />
                 </div>
              </div>
              <div className="flex justify-end gap-4 mt-10 pt-6 border-t font-black tracking-widest text-[10px] uppercase">
                 <button onClick={() => setEditingQuestion(null)} className="text-slate-400">Cancel</button>
                 <button onClick={handleSaveQuestion} className="px-12 py-4 bg-slate-900 text-white rounded-[2rem] shadow-xl active:scale-95 transition">Save Question</button>
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
                  <div className="w-1/4 border-r pr-6 overflow-y-auto space-y-2 text-[10px] font-black uppercase tracking-widest">
                     <p className="text-slate-400 mb-4">Categories</p>
                     {iconCategories.map(cat => (
                       <button 
                         key={cat.id} 
                         onClick={() => handleSelectIconCategory(cat)}
                         className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeIconCategory?.id === cat.id ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-slate-50 hover:bg-slate-100'}`}
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
