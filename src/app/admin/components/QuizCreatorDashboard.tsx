"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MediaUploader from "@/app/components/MediaUploader";

interface Section {
  id: string;
  title: string;
  instructions?: string;
  media: {
    audio_url?: string;
    image_url?: string;
    pdf_url?: string;
    ppt_url?: string;
    video_url?: string;
  };
  questions: CreatorQuestion[];
}

interface CreatorQuestion {
  id: string;
  q: string;
  question_type: "multiple_choice" | "essay";
  options: string[];
  answer: number;
  explanation?: string;
  audio_url?: string;
  image_url?: string;
  video_url?: string;
  audio_play_limit?: number;
  autoplay?: boolean;
  keywords?: string[];
  rubric?: string;
}

interface QuizCreatorDashboardProps {
  initialData: any;
  onChange: (data: any) => void;
  materialType: "quiz" | "latihan" | "exam";
  onSave?: () => Promise<void>;
}

export default function QuizCreatorDashboard({
  initialData,
  onChange,
  materialType,
  onSave,
}: QuizCreatorDashboardProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showJsonPanel, setShowJsonPanel] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "editing" | "saving">("saved");

  // Advanced CBT parameters stored in content root
  const [config, setConfig] = useState({
    duration_minutes: initialData?.duration_minutes || 60,
    pass_point: initialData?.pass_point || 60,
    shuffle_questions: initialData?.shuffle_questions || false,
    shuffle_answers: initialData?.shuffle_answers || false,
    fullscreen_mode: initialData?.fullscreen_mode || false,
    limit_attempts: initialData?.limit_attempts || 1,
    anti_back: initialData?.anti_back || false,
    auto_submit: initialData?.auto_submit || true,
  });

  // Parse initial data into Section format with backward compatibility
  useEffect(() => {
    if (initialData?.is_section_test && Array.isArray(initialData.sections)) {
      setSections(initialData.sections);
    } else {
      // Backward compatibility wrap
      const flatExercises = initialData?.exercises || initialData?.questions || [];
      const legacyQuestions: CreatorQuestion[] = flatExercises.map((ex: any, idx: number) => ({
        id: ex.id || `q-${idx}-${Date.now()}`,
        q: ex.q || ex.question_text || "Pertanyaan Baru",
        question_type: ex.question_type || (ex.options && ex.options.length > 0 ? "multiple_choice" : "essay"),
        options: ex.options || (ex.option_a ? [ex.option_a, ex.option_b, ex.option_c, ex.option_d].filter(Boolean) : ["Opsi A", "Opsi B"]),
        answer: ex.answer !== undefined ? ex.answer : (ex.correct_option !== undefined ? ex.correct_option : 0),
        explanation: ex.explanation || "",
        audio_url: ex.audio_url || null,
        image_url: ex.image_url || null,
        video_url: ex.video_url || null,
      }));

      setSections([
        {
          id: "section-default",
          title: "Section Utama",
          instructions: "Silakan jawab pertanyaan-pertanyaan berikut.",
          media: {
            audio_url: initialData?.audioUrl || initialData?.audio_url || "",
            image_url: initialData?.image_url || "",
          },
          questions: legacyQuestions,
        },
      ]);
    }

    if (initialData?.sections && initialData?.sections.length > 0) {
      const expandedSecs: Record<string, boolean> = {};
      initialData.sections.forEach((sec: any) => {
        expandedSecs[sec.id] = true;
      });
      setExpandedSections(expandedSecs);
    } else {
      setExpandedSections({ "section-default": true });
    }
  }, [initialData]);

  // Propagate changes up to parent
  const updateParent = (updatedSections: Section[], updatedConfig = config) => {
    setSaveStatus("editing");
    onChange({
      is_section_test: true,
      sections: updatedSections,
      ...updatedConfig,
    });
  };

  // --- SECTION ACTIONS ---
  const handleAddSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1} - Baru`,
      instructions: "Petunjuk pengerjaan bagian ini...",
      media: {},
      questions: [],
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setExpandedSections((prev) => ({ ...prev, [newSection.id]: true }));
    updateParent(updated);
  };

  const handleDuplicateSection = (sec: Section) => {
    const duplicated: Section = {
      ...sec,
      id: `section-${Date.now()}`,
      title: `${sec.title} (Salinan)`,
      questions: sec.questions.map((q) => ({
        ...q,
        id: `q-${Date.now()}-${Math.random()}`,
      })),
    };
    const updated = [...sections, duplicated];
    setSections(updated);
    setExpandedSections((prev) => ({ ...prev, [duplicated.id]: true }));
    updateParent(updated);
  };

  const handleDeleteSection = (secId: string) => {
    if (!confirm("Hapus seluruh section ini beserta seluruh soal di dalamnya?")) return;
    const updated = sections.filter((s) => s.id !== secId);
    setSections(updated);
    updateParent(updated);
  };

  const handleSectionFieldChange = (secId: string, field: string, value: any) => {
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      if (field.startsWith("media.")) {
        const mediaKey = field.split(".")[1];
        return {
          ...s,
          media: { ...s.media, [mediaKey]: value },
        };
      }
      return { ...s, [field]: value };
    });
    setSections(updated);
    updateParent(updated);
  };

  // --- QUESTION ACTIONS ---
  const handleAddQuestion = (secId: string, type: "multiple_choice" | "essay" = "multiple_choice") => {
    const newQ: CreatorQuestion = {
      id: `q-${Date.now()}-${Math.random()}`,
      q: "Tuliskan pertanyaan Anda di sini...",
      question_type: type,
      options: type === "multiple_choice" ? ["Opsi A", "Opsi B", "Opsi C", "Opsi D"] : [],
      answer: 0,
      explanation: "",
    };
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return { ...s, questions: [...s.questions, newQ] };
    });
    setSections(updated);
    setExpandedQuestions((prev) => ({ ...prev, [newQ.id]: true }));
    updateParent(updated);
  };

  const handleDuplicateQuestion = (secId: string, q: CreatorQuestion) => {
    const duplicated: CreatorQuestion = {
      ...q,
      id: `q-${Date.now()}-${Math.random()}`,
      q: `${q.q} (Salinan)`,
    };
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return { ...s, questions: [...s.questions, duplicated] };
    });
    setSections(updated);
    updateParent(updated);
  };

  const handleDeleteQuestion = (secId: string, qId: string) => {
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return { ...s, questions: s.questions.filter((q) => q.id !== qId) };
    });
    setSections(updated);
    updateParent(updated);
  };

  const handleQuestionFieldChange = (secId: string, qId: string, field: string, value: any) => {
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return {
        ...s,
        questions: s.questions.map((q) => {
          if (q.id !== qId) return q;
          return { ...q, [field]: value };
        }),
      };
    });
    setSections(updated);
    updateParent(updated);
  };

  // --- MCQ OPTIONS EDITORS ---
  const handleAddOption = (secId: string, qId: string) => {
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return {
        ...s,
        questions: s.questions.map((q) => {
          if (q.id !== qId) return q;
          const nextLetter = String.fromCharCode(65 + q.options.length);
          return { ...q, options: [...q.options, `Opsi Baru ${nextLetter}`] };
        }),
      };
    });
    setSections(updated);
    updateParent(updated);
  };

  const handleOptionTextChange = (secId: string, qId: string, optIdx: number, val: string) => {
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return {
        ...s,
        questions: s.questions.map((q) => {
          if (q.id !== qId) return q;
          const opts = [...q.options];
          opts[optIdx] = val;
          return { ...q, options: opts };
        }),
      };
    });
    setSections(updated);
    updateParent(updated);
  };

  const handleDeleteOption = (secId: string, qId: string, optIdx: number) => {
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      return {
        ...s,
        questions: s.questions.map((q) => {
          if (q.id !== qId) return q;
          const opts = q.options.filter((_, idx) => idx !== optIdx);
          let ans = q.answer;
          if (ans >= opts.length) ans = Math.max(0, opts.length - 1);
          return { ...q, options: opts, answer: ans };
        }),
      };
    });
    setSections(updated);
    updateParent(updated);
  };

  // --- REORDERING & QUICK FUNCTIONS ---
  const moveQuestion = (secId: string, fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.find((s) => s.id === secId)!.questions.length) return;
    const updated = sections.map((s) => {
      if (s.id !== secId) return s;
      const list = [...s.questions];
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return { ...s, questions: list };
    });
    setSections(updated);
    updateParent(updated);
  };

  const moveSection = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sections.length) return;
    const list = [...sections];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setSections(list);
    updateParent(list);
  };

  // Expand / Collapse Helpers
  const toggleAllSections = (expand: boolean) => {
    const map: Record<string, boolean> = {};
    sections.forEach((s) => {
      map[s.id] = expand;
    });
    setExpandedSections(map);
  };

  const toggleAllQuestionsInSection = (secId: string, expand: boolean) => {
    const map = { ...expandedQuestions };
    const sec = sections.find((s) => s.id === secId);
    if (sec) {
      sec.questions.forEach((q) => {
        map[q.id] = expand;
      });
    }
    setExpandedQuestions(map);
  };

  // Sticky saving trigger
  const handleTriggerSave = async () => {
    if (!onSave) return;
    setSaveStatus("saving");
    try {
      await onSave();
      setSaveStatus("saved");
    } catch {
      alert("Gagal melakukan penyimpanan.");
      setSaveStatus("editing");
    }
  };

  // --- IMPORT / EXPORT RAW JSON ---
  const openJsonPanel = () => {
    setJsonInput(JSON.stringify({ is_section_test: true, sections, ...config }, null, 2));
    setShowJsonPanel(true);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed.sections && Array.isArray(parsed.sections)) {
        setSections(parsed.sections);
        setConfig({
          duration_minutes: parsed.duration_minutes || 60,
          pass_point: parsed.pass_point || 60,
          shuffle_questions: parsed.shuffle_questions || false,
          shuffle_answers: parsed.shuffle_answers || false,
          fullscreen_mode: parsed.fullscreen_mode || false,
          limit_attempts: parsed.limit_attempts || 1,
          anti_back: parsed.anti_back || false,
          auto_submit: parsed.auto_submit || true,
        });
        updateParent(parsed.sections, parsed);
        setShowJsonPanel(false);
      } else {
        alert("JSON tidak valid. Objek harus mengandung array 'sections'.");
      }
    } catch {
      alert("Format JSON salah / Gagal melakukan parse.");
    }
  };

  return (
    <div className="space-y-6 relative pb-28">
      {/* HEADER ACTION TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 text-white rounded-[2rem] p-6 gap-4 shadow-xl">
        <div>
          <h2 className="text-xl font-black italic tracking-tight uppercase flex items-center gap-2">
            <span>🛠️ Creator Canvas</span>
            <span className="px-2.5 py-0.5 bg-white/10 rounded-full text-[10px] tracking-widest text-teal-400 font-bold uppercase">
              {materialType}
            </span>
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Gunakan Canvas ini untuk menyusun soal dengan section, audio, dan visual secara cepat.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            ⚙️ Pengaturan CBT
          </button>
          <button
            onClick={openJsonPanel}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            📂 Import / Export
          </button>
          <button
            onClick={handleAddSection}
            className="flex-1 md:flex-none px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/10 transition active:scale-95"
          >
            + Section Baru
          </button>
        </div>
      </div>

      {/* QUICK CONSOLE SEARCH & GLOBAL CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 gap-4 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Cari pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 bg-slate-50 text-sm font-bold focus:outline-none focus:border-slate-900 transition"
          />
        </div>

        <div className="flex gap-2 text-xs font-bold text-slate-500">
          <button onClick={() => toggleAllSections(true)} className="px-3 py-1.5 hover:bg-slate-50 rounded-lg">
            展开 / Expand All
          </button>
          <div className="h-4 w-px bg-slate-200 my-auto" />
          <button onClick={() => toggleAllSections(false)} className="px-3 py-1.5 hover:bg-slate-50 rounded-lg">
            折叠 / Collapse All
          </button>
        </div>
      </div>

      {/* SECTIONS CANVAS */}
      <div className="space-y-6">
        {sections.map((sec, secIdx) => {
          const isExpanded = expandedSections[sec.id] !== false;
          // Filter questions if query present
          const filteredQuestions = sec.questions.filter((q) =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase())
          );

          return (
            <div key={sec.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              {/* SECTION HEADER CARD */}
              <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveSection(secIdx, secIdx - 1)}
                      disabled={secIdx === 0}
                      className="text-[10px] text-slate-400 disabled:opacity-20"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveSection(secIdx, secIdx + 1)}
                      disabled={secIdx === sections.length - 1}
                      className="text-[10px] text-slate-400 disabled:opacity-20"
                    >
                      ▼
                    </button>
                  </div>
                  <div>
                    <input
                      value={sec.title}
                      onChange={(e) => handleSectionFieldChange(sec.id, "title", e.target.value)}
                      className="text-lg font-black bg-transparent border-b border-transparent focus:border-slate-900 focus:outline-none italic tracking-tight"
                    />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {sec.questions.length} Pertanyaan • Section #{secIdx + 1}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleAddQuestion(sec.id, "multiple_choice")}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition active:scale-95"
                  >
                    + Pilihan Ganda
                  </button>
                  <button
                    onClick={() => handleAddQuestion(sec.id, "essay")}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition active:scale-95"
                  >
                    + Essay
                  </button>
                  <button
                    onClick={() => handleDuplicateSection(sec)}
                    className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs"
                    title="Duplikat Section"
                  >
                    📂
                  </button>
                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs"
                    title="Hapus Section"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() =>
                      setExpandedSections((prev) => ({ ...prev, [sec.id]: !isExpanded }))
                    }
                    className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold"
                  >
                    {isExpanded ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* SECTION CONTENT BLOCKS */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="p-6 md:p-8 space-y-8"
                  >
                    {/* GLOBAL MEDIA PANEL */}
                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          📁 Media Global Section (Shared)
                        </span>
                        <span className="text-[9px] font-bold text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded-full">
                          No duplicate upload needed!
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MediaUploader
                          label="Global Audio (TOEFL / Choukai)"
                          mediaType="audio"
                          value={sec.media.audio_url || ""}
                          onChange={(url) => handleSectionFieldChange(sec.id, "media.audio_url", url)}
                        />
                        <MediaUploader
                          label="Global Image (Reading / Dokkai / Map)"
                          mediaType="image"
                          value={sec.media.image_url || ""}
                          onChange={(url) => handleSectionFieldChange(sec.id, "media.image_url", url)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-slate-100 pt-6">
                        <MediaUploader
                          label="Global PDF Document (Opsional)"
                          mediaType="document"
                          accept=".pdf,application/pdf"
                          value={sec.media.pdf_url || ""}
                          onChange={(url) => handleSectionFieldChange(sec.id, "media.pdf_url", url)}
                        />
                        <MediaUploader
                          label="Global PPT Slide (Opsional)"
                          mediaType="document"
                          accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                          value={sec.media.ppt_url || ""}
                          onChange={(url) => handleSectionFieldChange(sec.id, "media.ppt_url", url)}
                        />
                        <MediaUploader
                          label="Global Video (Opsional)"
                          mediaType="video"
                          value={sec.media.video_url || ""}
                          onChange={(url) => handleSectionFieldChange(sec.id, "media.video_url", url)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 block">
                          Petunjuk Global Section
                        </label>
                        <textarea
                          placeholder="Tuliskan teks instruksi global untuk section ini..."
                          value={sec.instructions || ""}
                          onChange={(e) => handleSectionFieldChange(sec.id, "instructions", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none min-h-[70px]"
                        />
                      </div>
                    </div>

                    {/* QUESTIONS CARDS LIST */}
                    <div className="space-y-4">
                      {filteredQuestions.length === 0 ? (
                        <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 font-bold text-xs">
                          Belum ada pertanyaan di bagian ini. Tambahkan kuis pertama Anda!
                        </div>
                      ) : (
                        filteredQuestions.map((q, qIdx) => {
                          const isQExpanded = expandedQuestions[q.id] !== false;

                          return (
                            <div
                              key={q.id}
                              className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              {/* Question Header */}
                              <div className="p-5 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => moveQuestion(sec.id, qIdx, qIdx - 1)}
                                      disabled={qIdx === 0}
                                      className="text-[10px] text-slate-400 disabled:opacity-20"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      onClick={() => moveQuestion(sec.id, qIdx, qIdx + 1)}
                                      disabled={qIdx === filteredQuestions.length - 1}
                                      className="text-[10px] text-slate-400 disabled:opacity-20"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-black text-white bg-slate-900 rounded-lg px-2 py-1 mr-2 italic shadow-md shadow-slate-900/10">
                                      #{qIdx + 1}
                                    </span>
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${q.question_type === "multiple_choice" ? "bg-teal-50 text-teal-600" : "bg-indigo-50 text-indigo-600"}`}
                                    >
                                      {q.question_type === "multiple_choice" ? "Pilihan Ganda" : "Essay"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-1.5 w-full md:w-auto">
                                  <button
                                    onClick={() => handleDuplicateQuestion(sec.id, q)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs"
                                    title="Salin Pertanyaan"
                                  >
                                    📋
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuestion(sec.id, q.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg text-xs"
                                    title="Hapus Pertanyaan"
                                  >
                                    ✕
                                  </button>
                                  <button
                                    onClick={() =>
                                      setExpandedQuestions((prev) => ({
                                        ...prev,
                                        [q.id]: !isQExpanded,
                                      }))
                                    }
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold"
                                  >
                                    {isQExpanded ? "Tutup" : "Edit"}
                                  </button>
                                </div>
                              </div>

                              {/* Question Body */}
                              {isQExpanded && (
                                <div className="p-6 space-y-6">
                                  {/* Rich Text Question Prompts */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block">
                                      Isi Soal Pertanyaan (Mendukung Huruf Jepang Kanji / Arab / Emoji / Rumus)
                                    </label>
                                    <textarea
                                      value={q.q}
                                      onChange={(e) =>
                                        handleQuestionFieldChange(sec.id, q.id, "q", e.target.value)
                                      }
                                      className="w-full px-4 py-3 rounded-2xl border border-slate-100 focus:border-slate-900 bg-slate-50 text-sm font-bold focus:outline-none min-h-[80px]"
                                    />
                                  </div>

                                  {/* Local Specific Media for this Question */}
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <MediaUploader
                                      label="Audio Tambahan (Optional)"
                                      mediaType="audio"
                                      value={q.audio_url || ""}
                                      onChange={(url) =>
                                        handleQuestionFieldChange(sec.id, q.id, "audio_url", url)
                                      }
                                    />
                                    <MediaUploader
                                      label="Gambar Tambahan (Optional)"
                                      mediaType="image"
                                      value={q.image_url || ""}
                                      onChange={(url) =>
                                        handleQuestionFieldChange(sec.id, q.id, "image_url", url)
                                      }
                                    />
                                    <MediaUploader
                                      label="Video Tambahan (Optional)"
                                      mediaType="video"
                                      value={q.video_url || ""}
                                      onChange={(url) =>
                                        handleQuestionFieldChange(sec.id, q.id, "video_url", url)
                                      }
                                    />
                                    <div className="space-y-2">
                                      <label className="text-[10px] font-black uppercase text-slate-400 block">
                                        Konfigurasi Audio
                                      </label>
                                      <div className="space-y-1.5">
                                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                          <input
                                            type="checkbox"
                                            checked={q.autoplay || false}
                                            onChange={(e) =>
                                              handleQuestionFieldChange(sec.id, q.id, "autoplay", e.target.checked)
                                            }
                                          />
                                          Autoplay otomatis
                                        </label>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                          <span>Play Limit:</span>
                                          <input
                                            type="number"
                                            value={q.audio_play_limit || 0}
                                            onChange={(e) =>
                                              handleQuestionFieldChange(
                                                sec.id,
                                                q.id,
                                                "audio_play_limit",
                                                parseInt(e.target.value)
                                              )
                                            }
                                            className="w-14 px-2 py-1 rounded bg-white border border-slate-200 text-center font-bold text-xs"
                                          />
                                          <span className="text-[10px] text-slate-400">(0 = Tanpa batas)</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Answers Block */}
                                  {q.question_type === "multiple_choice" ? (
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block">
                                          Pilihan Jawaban (Pilih Bulatan untuk Jawaban Benar)
                                        </span>
                                        <button
                                          onClick={() => handleAddOption(sec.id, q.id)}
                                          className="text-xs font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg"
                                        >
                                          + Opsi Pilihan
                                        </button>
                                      </div>

                                      <div className="grid gap-3">
                                        {q.options.map((opt, optIdx) => {
                                          const letter = String.fromCharCode(65 + optIdx);
                                          const isCorrect = q.answer === optIdx;

                                          return (
                                            <div
                                              key={optIdx}
                                              className={`flex items-center gap-4 p-3.5 rounded-2xl border-2 transition ${isCorrect ? "bg-teal-50/50 border-teal-500/50" : "bg-white border-slate-100"}`}
                                            >
                                              <input
                                                type="radio"
                                                name={`correct_${q.id}`}
                                                checked={isCorrect}
                                                onChange={() =>
                                                  handleQuestionFieldChange(sec.id, q.id, "answer", optIdx)
                                                }
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                                              />
                                              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500">
                                                {letter}
                                              </div>
                                              <input
                                                value={opt}
                                                onChange={(e) =>
                                                  handleOptionTextChange(
                                                    sec.id,
                                                    q.id,
                                                    optIdx,
                                                    e.target.value
                                                  )
                                                }
                                                className="flex-1 px-3 py-2 bg-slate-50 border border-transparent focus:border-slate-300 rounded-xl text-sm font-bold"
                                              />
                                              <button
                                                onClick={() => handleDeleteOption(sec.id, q.id, optIdx)}
                                                disabled={q.options.length <= 2}
                                                className="text-slate-300 hover:text-rose-500 disabled:opacity-20 text-sm font-black p-1"
                                              >
                                                ✕
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    /* Essay Config and Grading Parameters */
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/30 border border-indigo-100 p-5 rounded-[2rem] space-y-2">
                                      <div className="space-y-1.5 flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block">
                                          Keyword Kata Kunci Koreksi (Pisahkan dengan koma)
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. makan, nasi, restoran"
                                          value={q.keywords?.join(", ") || ""}
                                          onChange={(e) =>
                                            handleQuestionFieldChange(
                                              sec.id,
                                              q.id,
                                              "keywords",
                                              e.target.value.split(",").map((s) => s.trim())
                                            )
                                          }
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                                        />
                                      </div>
                                      <div className="space-y-1.5 flex-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block">
                                          Rubrik Penilaian / Kriteria Nilai
                                        </label>
                                        <textarea
                                          placeholder="Tuliskan kriteria nilai dan panduan skor untuk guru korektor..."
                                          value={q.rubric || ""}
                                          onChange={(e) =>
                                            handleQuestionFieldChange(sec.id, q.id, "rubric", e.target.value)
                                          }
                                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-none min-h-[60px]"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Shared Explanation */}
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 block">
                                      Pembahasan & Penjelasan Jawaban (Optional)
                                    </label>
                                    <textarea
                                      placeholder="Berikan ulasan dan alasan rinci mengenai jawaban ini..."
                                      value={q.explanation || ""}
                                      onChange={(e) =>
                                        handleQuestionFieldChange(sec.id, q.id, "explanation", e.target.value)
                                      }
                                      className="w-full px-4 py-3 rounded-xl border border-slate-100 focus:border-slate-300 bg-slate-50 text-xs font-medium focus:outline-none min-h-[60px]"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* FLOAT STICKY SAVE BAR */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 text-white rounded-[2.5rem] px-8 py-4.5 flex items-center gap-6 shadow-2xl z-50 backdrop-blur-md max-w-lg w-[calc(100%-2rem)]">
        <div className="flex-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status Penyuntingan</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${saveStatus === "saved" ? "bg-teal-400" : saveStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-rose-400"}`}
            />
            <span className="text-xs font-bold text-slate-200">
              {saveStatus === "saved"
                ? "Draf Tersimpan"
                : saveStatus === "saving"
                  ? "Menyimpan Progres..."
                  : "Modifikasi Belum Disimpan"}
            </span>
          </div>
        </div>

        {onSave && (
          <button
            onClick={handleTriggerSave}
            disabled={saveStatus === "saving"}
            className="px-6 py-3 bg-white hover:bg-slate-50 disabled:bg-slate-300 text-slate-900 rounded-2xl font-black italic text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            Simpan Semua 💾
          </button>
        )}
      </div>

      {/* CBT CONFIGURATION PANEL MODAL */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full border border-slate-100 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-800">
                  ⚙️ Pengaturan CBT & Mode Ujian
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Atur perilaku kuis, aturan pengerjaan, dan penguncian anti-curang ujian.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Durasi Kuis (Menit)
                  </label>
                  <input
                    type="number"
                    value={config.duration_minutes}
                    onChange={(e) => {
                      const updated = { ...config, duration_minutes: parseInt(e.target.value) };
                      setConfig(updated);
                      updateParent(sections, updated);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1.5 block">
                    Skor Kelulusan (%)
                  </label>
                  <input
                    type="number"
                    value={config.pass_point}
                    onChange={(e) => {
                      const updated = { ...config, pass_point: parseInt(e.target.value) };
                      setConfig(updated);
                      updateParent(sections, updated);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-2">
                  Aturan Keamanan & Pengacakan (Exam)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <label className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.shuffle_questions}
                      onChange={(e) => {
                        const updated = { ...config, shuffle_questions: e.target.checked };
                        setConfig(updated);
                        updateParent(sections, updated);
                      }}
                      className="h-4 w-4 text-teal-600"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Acak Urutan Soal</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Urutan soal diacak untuk setiap siswa.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.shuffle_answers}
                      onChange={(e) => {
                        const updated = { ...config, shuffle_answers: e.target.checked };
                        setConfig(updated);
                        updateParent(sections, updated);
                      }}
                      className="h-4 w-4 text-teal-600"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Acak Opsi Pilihan</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Opsi ABCD diacak bagi setiap siswa.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.fullscreen_mode}
                      onChange={(e) => {
                        const updated = { ...config, fullscreen_mode: e.target.checked };
                        setConfig(updated);
                        updateParent(sections, updated);
                      }}
                      className="h-4 w-4 text-teal-600"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Kunci Fullscreen</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Ujian memaksa mode layar penuh.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.anti_back}
                      onChange={(e) => {
                        const updated = { ...config, anti_back: e.target.checked };
                        setConfig(updated);
                        updateParent(sections, updated);
                      }}
                      className="h-4 w-4 text-teal-600"
                    />
                    <div>
                      <p className="font-bold text-slate-800">Batas Anti-Back</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Siswa dilarang kembali ke soal sebelumnya.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition active:scale-95"
                >
                  Terapkan Pengaturan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMPORT / EXPORT RAW JSON MODAL PANEL */}
      <AnimatePresence>
        {showJsonPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full border border-slate-100 shadow-2xl space-y-6"
            >
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-800">
                  📁 Import / Export Struktur JSON
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Copy seluruh struktur kuis di bawah untuk dipindahkan atau tempel kode JSON eksternal untuk import instan.
                </p>
              </div>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-80 p-4 rounded-2xl border border-slate-100 bg-slate-50 font-mono text-[10px] leading-relaxed focus:outline-none focus:border-slate-400"
              />

              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonInput);
                    alert("Berhasil disalin ke clipboard!");
                  }}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Salin JSON 📋
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowJsonPanel(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleApplyJson}
                    className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition active:scale-95 shadow-lg shadow-rose-500/15"
                  >
                    Import & Pasang 🚀
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
