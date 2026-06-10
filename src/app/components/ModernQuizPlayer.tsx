"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface NormalizedQuestion {
  id: string;
  question_text: string;
  options: string[]; // empty array means it's an essay question
  correct_option: number; // 0, 1, 2, 3... or -1 if essay
  explanation?: string | null;
  audio_url?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  question_type?: string;

  // Section Test fields
  section_title?: string | null;
  section_instructions?: string | null;
  section_audio_url?: string | null;
  section_image_url?: string | null;
  section_pdf_url?: string | null;
  section_ppt_url?: string | null;
  section_video_url?: string | null;
}

interface ModernQuizPlayerProps {
  title: string;
  questions: NormalizedQuestion[];
  mode: "latihan" | "ujian" | "quiz";
  durationMinutes?: number; // optional, mainly for ujian
  localStorageKey: string; // for auto-saving answers
  accessOpenedAt?: string; // for clearing stale progress on teacher reopen
  onFinish?: (userAnswers: Record<string, any>, scorePercentage: number) => void;
  onClose?: () => void;
  onProgressUpdate?: (answeredCount: number, totalCount: number) => void;
}

export default function ModernQuizPlayer({
  title,
  questions,
  mode,
  durationMinutes = 10,
  localStorageKey,
  accessOpenedAt,
  onFinish,
  onClose,
  onProgressUpdate,
}: ModernQuizPlayerProps) {
  const fixUrl = (url?: string | null): string | undefined => typeof url === 'string' ? url.replace(/^undefined\//, "https://storage.sagaracloud.web.id/").replace("https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev", "https://storage.sagaracloud.web.id") : undefined;
  const isNonEmpty = (str: any) => {
    if (!str) return false;
    if (typeof str !== 'string') return true;
    const trimmed = str.trim();
    return trimmed !== "" && trimmed !== "null" && trimmed !== "undefined";
  };

  // Navigation & States
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('luma-user-profile') || '{}');
      if (p.is_super_admin) setIsSuperAdmin(true);
    } catch(e) {}
  }, []);

  const [isFinished, setIsFinished] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [unansweredWarningCount, setUnansweredWarningCount] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
 
  // Audio Player State (Per Question Audio)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
 
  // Image Zoom Lightbox
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  // Mobile Nav Drawer
  const [showMobileNav, setShowMobileNav] = useState(false);
 
  // Auto-Save: Load initial answers on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clear stale answers if accessOpenedAt is newer or different from the local one
      const localOpenedAt = localStorage.getItem(`${localStorageKey}_opened_at`);
      if (accessOpenedAt && localOpenedAt !== accessOpenedAt) {
        localStorage.removeItem(`${localStorageKey}_answers`);
        localStorage.removeItem(`${localStorageKey}_flags`);
        localStorage.removeItem(`${localStorageKey}_index`);
        localStorage.removeItem(`${localStorageKey}_time`);
        localStorage.removeItem(`${localStorageKey}_checked`);
        localStorage.setItem(`${localStorageKey}_opened_at`, accessOpenedAt);
        
        setUserAnswers({});
        setFlaggedQuestions({});
        setCheckedQuestions({});
        setCurrentIdx(0);
        setTimeLeft(durationMinutes * 60);
        setIsFinished(false);
        setIsTimeUp(false);
        return;
      }

      const savedAnswers = localStorage.getItem(`${localStorageKey}_answers`);
      const savedFlags = localStorage.getItem(`${localStorageKey}_flags`);
      const savedIdx = localStorage.getItem(`${localStorageKey}_index`);
      const savedTime = localStorage.getItem(`${localStorageKey}_time`);
      const savedChecked = localStorage.getItem(`${localStorageKey}_checked`);

      if (savedAnswers) {
        try { setUserAnswers(JSON.parse(savedAnswers)); } catch (e) {}
      }
      if (savedFlags) {
        try { setFlaggedQuestions(JSON.parse(savedFlags)); } catch (e) {}
      }
      if (savedIdx) {
        setCurrentIdx(Number(savedIdx));
      }
      if ((mode === "ujian" || mode === "quiz") && savedTime) {
        setTimeLeft(Number(savedTime));
      }
      if (savedChecked) {
        try { setCheckedQuestions(JSON.parse(savedChecked)); } catch (e) {}
      }
    }
  }, [localStorageKey, mode, accessOpenedAt, durationMinutes]);
 
  // Auto-Save: Write answers to localStorage when updated
  useEffect(() => {
    localStorage.setItem(`${localStorageKey}_answers`, JSON.stringify(userAnswers));
    localStorage.setItem(`${localStorageKey}_flags`, JSON.stringify(flaggedQuestions));
    localStorage.setItem(`${localStorageKey}_index`, String(currentIdx));
    localStorage.setItem(`${localStorageKey}_checked`, JSON.stringify(checkedQuestions));
  }, [userAnswers, flaggedQuestions, currentIdx, checkedQuestions, localStorageKey]);

  // Real-Time Progress Update Notifier
  useEffect(() => {
    if (onProgressUpdate && questions.length > 0) {
      const answeredCount = questions.filter(q => userAnswers[q.id] !== undefined).length;
      onProgressUpdate(answeredCount, questions.length);
    }
  }, [userAnswers, questions, onProgressUpdate]);

  // Exam Timer Logic
  useEffect(() => {
    if ((mode === "ujian" || mode === "quiz") && !isFinished) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setIsTimeUp(true);
            handleAutoSubmit();
            return 0;
          }
          localStorage.setItem(`${localStorageKey}_time`, String(prev - 1));
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [mode, isFinished, localStorageKey]);

  // Reset Audio when question switches
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
    }
    setAudioPlaying(false);
    setAudioProgress(0);
  }, [currentIdx]);

  // Keyboard Shortcuts (A, B, C, D / 1, 2, 3, 4) for MCQ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      const q = questions[currentIdx];
      if (!q || !q.options || q.options.length === 0) return;

      const isChecked = checkedQuestions[q.id] === true;
      if (mode === "latihan" && isChecked) return;

      const key = e.key.toLowerCase();
      let selectedOptionIdx = -1;

      if (key === "a" || key === "1") selectedOptionIdx = 0;
      else if (key === "b" || key === "2") selectedOptionIdx = 1;
      else if (key === "c" || key === "3") selectedOptionIdx = 2;
      else if (key === "d" || key === "4") selectedOptionIdx = 3;

      if (selectedOptionIdx !== -1 && selectedOptionIdx < q.options.length) {
        handleSaveAnswer(q.id, selectedOptionIdx);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, questions, userAnswers, isFinished, mode]);

  // Anti-cheat: Extra protection for ujian mode
  useEffect(() => {
    if (mode !== "ujian") return;

    // Block context menu inside quiz
    const blockCtx = (e: MouseEvent) => e.preventDefault();
    // Block drag
    const blockDrag = (e: DragEvent) => e.preventDefault();
    // Detect PrintScreen
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        // Flash screen black briefly as visual deterrent
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;inset:0;background:black;z-index:99999;pointer-events:none;";
        document.body.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1500);
      }
    };

    document.addEventListener("contextmenu", blockCtx, { capture: true });
    document.addEventListener("dragstart", blockDrag, { capture: true });
    document.addEventListener("keydown", handleKey, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", blockCtx, { capture: true });
      document.removeEventListener("dragstart", blockDrag, { capture: true });
      document.removeEventListener("keydown", handleKey, { capture: true });
    };
  }, [mode]);

  const handleSaveAnswer = (qid: string, val: any) => {
    setUserAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  const toggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Auto-Submit on Time Expiration
  const handleAutoSubmit = () => {
    setIsFinished(true);
    calculateScoreAndCallback();
  };

  const calculateScoreAndCallback = async () => {
    // Calculate total correct MCQ answers
    let correctCount = 0;
    let mcqCount = 0;

    questions.forEach((q) => {
      const isMCQ = q.options && q.options.length > 0;
      if (isMCQ) {
        mcqCount++;
        if (userAnswers[q.id] === q.correct_option) {
          correctCount++;
        }
      }
    });

    const finalPercent = mcqCount > 0 ? Math.round((correctCount / mcqCount) * 100) : 100;
    
    // Clear localStorage values after submission
    localStorage.removeItem(`${localStorageKey}_answers`);
    localStorage.removeItem(`${localStorageKey}_flags`);
    localStorage.removeItem(`${localStorageKey}_index`);
    localStorage.removeItem(`${localStorageKey}_time`);
    localStorage.removeItem(`${localStorageKey}_checked`);

    if (onFinish) {
      try {
        await onFinish(userAnswers, finalPercent);
        console.log("[QuizPlayer] onFinish completed successfully. Score:", finalPercent);
      } catch (err) {
        console.error("[QuizPlayer] onFinish callback error:", err);
      }
    }
  };

  const handleFinishTest = () => {
    // Check if there are unanswered questions
    const unansweredCount = questions.filter(q => userAnswers[q.id] === undefined).length;
    if (unansweredCount > 0) {
      setUnansweredWarningCount(unansweredCount);
      setShowWarningModal(true);
      return;
    }
    // All questions answered, show completion confirmation modal
    setShowConfirmModal(true);
  };

  // Audio Playback Helpers
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play().then(() => {
        setAudioPlaying(true);
      }).catch((err) => {
        alert("Gagal memutar audio: " + err.message);
      });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100 || 0;
    setAudioProgress(progress);
  };

  const handleAudioSeek = (percentage: number) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    audioRef.current.currentTime = (percentage / 100) * audioRef.current.duration;
    setAudioProgress(percentage);
  };

  const changeAudioSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Format countdown string
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const q = questions[currentIdx];
  const progressPercent = questions.length > 0 ? ((Object.keys(userAnswers).length) / questions.length) * 100 : 0;

  // Empty state guard
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-12 bg-white rounded-[3rem] border border-slate-100 shadow-sm max-w-xl mx-auto my-12 text-center">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner animate-bounce">
          🎯
        </div>
        <h2 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight mb-3">Belum Ada Pertanyaan</h2>
        <p className="text-sm font-medium text-slate-400 max-w-md leading-relaxed mb-8">
          Kuis ini masih dalam proses penyusunan soal oleh tim pengajar LPK Sagara. Silakan kembali lagi nanti untuk mengerjakan latihan ini!
        </p>
        <button
          onClick={() => {
            if (onClose) onClose();
            else window.history.back();
          }}
          className="px-8 py-4 bg-slate-900 hover:bg-teal-600 text-white rounded-2xl font-black italic text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/15 hover:shadow-teal-600/15"
        >
          ← Kembali ke Chapter
        </button>
      </div>
    );
  }

  // Render Result Screen inside Ujian Mode / Review Mode
  if (isFinished) {
    const totalMCQ = questions.filter(q => q.options && q.options.length > 0).length;
    const correctCount = questions.reduce((acc, cur) => {
      const isMCQ = cur.options && cur.options.length > 0;
      return acc + (isMCQ && userAnswers[cur.id] === cur.correct_option ? 1 : 0);
    }, 0);
    const scorePct = totalMCQ > 0 ? Math.round((correctCount / totalMCQ) * 100) : 100;
    const passed = scorePct >= 60;

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans overflow-y-auto">
        {/* Results Header */}
        <header className="shrink-0 border-b border-white/10 px-6 py-5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏆</span>
            <div>
              <h1 className="text-lg font-black tracking-tight italic">Hasil & Analisis Nilai</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{title}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (onClose) onClose();
              else window.location.reload();
            }}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition"
          >
            Tutup Hub ✕
          </button>
        </header>

        <div className="max-w-4xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
          {/* Main Score Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-10 rounded-[3rem] ring-1 ring-white/10 shadow-2xl relative overflow-hidden">
            <div className="md:col-span-2 space-y-4">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border ${passed ? 'bg-teal-500/20 text-teal-400 border-teal-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                {passed ? "LULUS / PASSED" : "BELUM LULUS"}
              </span>
              <h2 className="text-4xl font-black italic tracking-tight leading-tight pt-2">Performance Analytics</h2>
              <p className="text-sm font-medium text-slate-400 max-w-sm">
                Nilai kelulusan standar LPK Sagara adalah 60%. Teruslah mengasah keterampilan bahasa Jepang Anda!
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-[2.5rem] ring-1 ring-white/10">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Skor Akhir</p>
              <p className={`text-6xl font-black italic tracking-tighter ${passed ? 'text-teal-400' : 'text-rose-400'}`}>{scorePct}%</p>
              <div className="h-px w-16 bg-white/10 my-3" />
              <p className="text-xs font-bold text-slate-300">{correctCount} dari {totalMCQ} MCQ Benar</p>
            </div>
          </div>

          {/* Question-by-Question Review Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-black italic">Tinjau Pembahasan Soal</h3>
            <div className="space-y-4">
              {questions.map((item, index) => {
                const isMCQ = item.options && item.options.length > 0;
                const chosen = userAnswers[item.id];
                const isCorrect = isMCQ && chosen === item.correct_option;

                const showSectionHeader = index === 0 || 
                  questions[index - 1].section_title !== item.section_title ||
                  questions[index - 1].section_instructions !== item.section_instructions ||
                  questions[index - 1].section_audio_url !== item.section_audio_url;

                const hasSecMedia = !!(
                  isNonEmpty(item.section_title) ||
                  isNonEmpty(item.section_instructions) ||
                  isNonEmpty(item.section_audio_url) ||
                  isNonEmpty(item.section_image_url) ||
                  isNonEmpty(item.section_pdf_url) ||
                  isNonEmpty(item.section_ppt_url) ||
                  isNonEmpty(item.section_video_url)
                );

                return (
                  <div key={item.id} className="space-y-4">
                    {showSectionHeader && hasSecMedia && (
                      <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-6 space-y-4">
                        {item.section_title && (
                          <h4 className="text-lg font-black italic text-teal-400">{item.section_title}</h4>
                        )}
                        {item.section_instructions && (
                          <p className="text-slate-300 text-xs font-semibold leading-relaxed whitespace-pre-line p-4 bg-white/5 rounded-2xl border border-white/5">
                            📖 {item.section_instructions}
                          </p>
                        )}
                        
                        {/* Section Media */}
                        <div className="grid grid-cols-1 gap-4">
                          {item.section_audio_url && (
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">🔊 Audio Section (Global)</p>
                              <audio controls className="w-full" src={fixUrl(item.section_audio_url)} />
                            </div>
                          )}
                          {item.section_video_url && (
                            <div className="rounded-2xl overflow-hidden border border-white/5 bg-black aspect-video max-h-56">
                              <video controls className="w-full h-full object-contain" src={fixUrl(item.section_video_url)} />
                            </div>
                          )}
                          {item.section_pdf_url && (
                            <div className="flex items-center justify-between px-4 py-3 bg-indigo-950/40 border border-indigo-900/50 rounded-xl">
                              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">📄 PDF Document</span>
                              <a 
                                href={fixUrl(item.section_pdf_url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] font-black uppercase bg-teal-400 text-slate-900 px-3 py-1 rounded-lg"
                              >
                                Buka PDF ↗
                              </a>
                            </div>
                          )}
                          {item.section_ppt_url && (
                            <div className="flex items-center justify-between px-4 py-3 bg-rose-950/40 border border-rose-900/50 rounded-xl">
                              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">📊 Slide Presentation</span>
                              <a 
                                href={fixUrl(item.section_ppt_url)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[9px] font-black uppercase bg-teal-400 text-slate-900 px-3 py-1 rounded-lg"
                              >
                                Buka Slide ↗
                              </a>
                            </div>
                          )}
                          {item.section_image_url && (
                            <div className="rounded-2xl overflow-hidden border border-white/5 max-h-52 bg-white/5 flex items-center justify-center cursor-pointer" onClick={() => setZoomImage(fixUrl(item.section_image_url) || null)}>
                              <img src={fixUrl(item.section_image_url)} alt="Global Section" className="object-contain max-h-52 w-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 ring-1 ring-white/10 space-y-5">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Soal {index + 1}</span>
                        {isMCQ ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'bg-teal-500/20 text-teal-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {isCorrect ? "✓ Benar" : "✗ Salah"}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400">
                            ✏ Essay / Teks Bebas
                          </span>
                        )}
                      </div>

                      {/* Question Assets */}
                      {item.image_url && (
                        <div className="max-w-md rounded-2xl overflow-hidden border border-white/10">
                          <img src={fixUrl(item.image_url)} alt="asset" className="w-full h-auto object-cover max-h-60" />
                        </div>
                      )}
                      
                      {item.audio_url && (
                        <div className="max-w-md p-4 bg-white/5 rounded-2xl ring-1 ring-white/10">
                          <audio controls className="w-full" src={fixUrl(item.audio_url)}></audio>
                        </div>
                      )}

                      <h4 className="text-lg font-bold text-white leading-relaxed">{item.question_text}</h4>

                      {/* Render Options for MCQ review */}
                      {isMCQ ? (
                        <div className="grid gap-2">
                          {item.options.map((opt, optIdx) => {
                            const isChosen = chosen === optIdx;
                            const isCorrectOpt = optIdx === item.correct_option;
                            let cardClass = "bg-white/5 border border-white/5 text-slate-300";

                            if (isCorrectOpt) {
                              cardClass = "bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold";
                            } else if (isChosen) {
                              cardClass = "bg-rose-500/20 border-rose-500/40 text-rose-300 font-bold";
                            }

                            return (
                              <div key={optIdx} className={`p-4 rounded-xl flex items-center justify-between text-sm ${cardClass}`}>
                                <span>{String.fromCharCode(65 + optIdx)}. {opt}</span>
                                {isCorrectOpt && <span>✓ Jawaban Benar</span>}
                                {isChosen && !isCorrectOpt && <span>✗ Pilihan Anda</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-xs font-black uppercase text-slate-400 mb-1">Jawaban Anda:</p>
                          <p className="text-sm italic text-slate-200">{chosen || "(Tidak diisi)"}</p>
                        </div>
                      )}

                      {/* Detailed Explanation */}
                      {item.explanation && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs leading-relaxed whitespace-pre-wrap">
                          <p className="font-black uppercase text-[10px] tracking-wider mb-1 text-amber-400">Pembahasan & Arti:</p>
                          {item.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMCQ = q && q.options && q.options.length > 0;
  const isAnswered = userAnswers[q?.id] !== undefined;
  const isChecked = q && checkedQuestions[q.id] === true;

  const hasSectionMedia = q && !!(
    isNonEmpty(q.section_instructions) ||
    isNonEmpty(q.section_audio_url) ||
    isNonEmpty(q.section_image_url) ||
    isNonEmpty(q.section_pdf_url) ||
    isNonEmpty(q.section_ppt_url) ||
    isNonEmpty(q.section_video_url)
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans overflow-hidden relative">
      {/* Header Panel - Fixed */}
      <header className="shrink-0 bg-white border-b border-slate-100 shadow-sm relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(isSuperAdmin || mode === 'latihan') && (
              <button 
                onClick={onClose} 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                title="Keluar"
              >
                ✕
              </button>
            )}
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight italic leading-tight">{title}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  mode === 'ujian' ? 'bg-rose-100 text-rose-600' : mode === 'quiz' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'
                }`}>
                  {mode === 'ujian' ? 'Ujian / Exam' : mode === 'quiz' ? 'Kuis / Quiz' : 'Latihan / Practice'}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Auto-Saving ⚡</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer Counter */}
            {(mode === "ujian" || mode === "quiz") && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-sm font-black tabular-nums tracking-wider">{formatTime(timeLeft)}</span>
              </div>
            )}
            
            {/* Submission triggers */}
            <button
              onClick={handleFinishTest}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition"
            >
              Selesai 🎯
            </button>
          </div>
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="h-1 w-full bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Split Screen Area - Responsive Layout */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row max-w-6xl w-full mx-auto" data-lenis-prevent>
        {/* Left column (Scrollable) - Question Context Assets */}
        <div className="w-full md:flex-1 md:overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 px-4 py-6 md:px-6 md:py-8 flex flex-col gap-6 custom-scrollbar bg-slate-50" data-lenis-prevent style={{ overscrollBehavior: 'contain' }}>
          
          {/* GLOBAL SECTION PANEL */}
          {hasSectionMedia && (
            <div className="p-0 bg-transparent text-slate-800 space-y-4">
              {q.section_title && (
                <div>
                  <h3 className="text-xl font-black italic tracking-tight text-slate-800">{q.section_title}</h3>
                  {q.section_instructions && (
                    <p className="text-slate-600 text-xs font-semibold leading-relaxed mt-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm whitespace-pre-line">
                      📖 {q.section_instructions}
                    </p>
                  )}
                </div>
              )}

              {/* Section global media */}
              {(q.section_audio_url || q.section_image_url || q.section_pdf_url || q.section_ppt_url || q.section_video_url) && (
                <div className="grid grid-cols-1 gap-4 pt-2 border-t border-slate-200">
                  
                  {/* Section Audio */}
                  {q.section_audio_url && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">🔊 Audio Section (Global)</p>
                      <audio controls className="w-full" src={fixUrl(q.section_audio_url)} />
                    </div>
                  )}

                  {/* Section Video */}
                  {q.section_video_url && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-black aspect-video max-h-56 shadow-sm">
                      <video controls className="w-full h-full object-contain" src={fixUrl(q.section_video_url)} />
                    </div>
                  )}

                  {/* Section PDF */}
                  {q.section_pdf_url && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl shadow-sm">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">📄 PDF Document</span>
                        <a 
                          href={fixUrl(q.section_pdf_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-black uppercase bg-teal-400 text-slate-900 px-3 py-1 rounded-lg"
                        >
                          Buka di Tab Baru ↗
                        </a>
                      </div>
                      <object 
                        data={`${fixUrl(q.section_pdf_url)}#toolbar=0`} 
                        type="application/pdf"
                        className="w-full h-64 rounded-xl border border-slate-100 shadow-sm"
                      >
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-slate-50 border border-slate-200 rounded-xl">
                          <p className="text-slate-600 font-medium text-xs mb-3">Browser Anda tidak mendukung pratinjau PDF langsung.</p>
                          <a href={fixUrl(q.section_pdf_url)} target="_blank" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-black uppercase tracking-widest text-[10px] transition-all shadow-md">
                            Download PDF
                          </a>
                        </div>
                      </object>
                    </div>
                  )}

                  {/* Section PPT */}
                  {q.section_ppt_url && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl shadow-sm">
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">📊 Slide Presentation</span>
                        <a 
                          href={fixUrl(q.section_ppt_url)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-black uppercase bg-teal-400 text-slate-900 px-3 py-1 rounded-lg"
                        >
                          Download Slide ↗
                        </a>
                      </div>
                      <iframe 
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fixUrl(q.section_ppt_url)!)}`} 
                        className="w-full h-64 rounded-xl border border-slate-100 shadow-sm"
                      />
                    </div>
                  )}

                  {/* Section Image */}
                  {q.section_image_url && (
                    <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-52 bg-white flex items-center justify-center cursor-pointer shadow-sm" onClick={() => setZoomImage(fixUrl(q.section_image_url) || null)}>
                      <img src={fixUrl(q.section_image_url)} alt="Global Section" className="object-contain max-h-52 w-full" />
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Pertanyaan {currentIdx + 1}
              </span>
              <button 
                onClick={() => toggleFlag(currentIdx)}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black transition ${flaggedQuestions[currentIdx] ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              >
                🚩 {flaggedQuestions[currentIdx] ? 'Flagged / Ragu' : 'Tandai Ragu'}
              </button>
            </div>

            {/* COMBINED ASSETS CONTAINER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* IMAGE ASSET WITH ZOOMABLE OVERLAY */}
              {q.image_url && (
                <div 
                  onClick={() => setZoomImage(fixUrl(q.image_url) || null)}
                  className="rounded-2xl overflow-hidden border border-slate-100 shadow-inner bg-slate-50 max-h-64 flex items-center justify-center cursor-pointer group relative overflow-hidden"
                  title="Klik untuk memperbesar"
                >
                  <img 
                    src={fixUrl(q.image_url)} 
                    alt="Soal" 
                    className="object-contain max-h-64 w-full transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider backdrop-blur-[2px]">
                    🔍 Zoom Gambar
                  </div>
                </div>
              )}

              {/* HIGH FIDELITY AUDIO PLAYER WITH VIRTUAL SOUNDWAVE */}
              {q.audio_url && (
                <div className="p-5 bg-slate-900 text-white rounded-[2rem] flex flex-col justify-between shadow-lg relative min-h-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">🔊 AUDIO PLAYER</p>
                    <div className="flex gap-1.5 items-end h-4 w-12 px-1">
                      {/* Virtual Soundwave animation */}
                      {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 bg-teal-400 rounded-full transition-all duration-300 ${audioPlaying ? 'animate-pulse' : 'opacity-40'}`}
                          style={{ 
                            height: audioPlaying ? `${Math.floor(Math.random() * 100) || 10}%` : '20%',
                            animationDelay: `${i * 150}ms`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <audio 
                    ref={audioRef} 
                    src={fixUrl(q.audio_url)}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={() => setAudioPlaying(false)}
                  />

                  {/* Audio Controls Grid */}
                  <div className="flex items-center gap-4 my-4">
                    <button 
                      onClick={togglePlayAudio}
                      className="h-12 w-12 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center text-lg shadow-lg hover:scale-105 transition"
                    >
                      {audioPlaying ? "⏸" : "▶"}
                    </button>
                    
                    {/* Custom Timeline handle */}
                    <div className="flex-1 flex flex-col">
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={audioProgress}
                        onChange={(e) => handleAudioSeek(Number(e.target.value))}
                        className="w-full accent-teal-400 h-1.5 bg-white/20 rounded-full cursor-pointer outline-none"
                      />
                    </div>
                  </div>

                  {/* Speed Controllers */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[9px] text-slate-400 font-bold">Kecepatan:</span>
                    <div className="flex gap-1">
                      {[0.8, 1.0, 1.2, 1.5].map((speed) => (
                        <button 
                          key={speed}
                          onClick={() => changeAudioSpeed(speed)}
                          className={`px-2.5 py-1 rounded text-[10px] font-black tracking-wide uppercase transition ${playbackRate === speed ? 'bg-teal-400 text-slate-950' : 'bg-white/5 hover:bg-white/10 text-white'}`}
                        >
                          {speed === 1.0 ? "Normal" : `${speed}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIDEO PLAYER ASSET */}
              {q.video_url && (
                <div className="rounded-2xl overflow-hidden bg-black max-h-64 relative border border-slate-100 shadow-lg">
                  <video controls className="w-full max-h-64" src={fixUrl(q.video_url)} />
                </div>
              )}
            </div>

            {/* Question Text block */}
            <h2 className="text-xl md:text-2xl font-black text-slate-900 italic tracking-tight leading-snug">
              {q.question_text}
            </h2>
          </div>
        </div>

        {/* Right column (Scrollable) - Answer Submission and Navigation */}
        <div className="w-full md:w-[380px] md:overflow-y-auto border-t md:border-t-0 md:border-l border-slate-100 bg-white px-4 py-6 md:px-6 md:py-8 flex flex-col gap-8 custom-scrollbar" data-lenis-prevent style={{ overscrollBehavior: 'contain' }}>
          
          {/* ANSWER INPUT SECTION */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pilihan Jawaban</h3>
            
            {isMCQ ? (
              <div className="grid gap-3">
                {q.options.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const isSelected = userAnswers[q.id] === i;
                  
                  let btnClass = "bg-white border-slate-100 text-slate-700 hover:border-slate-300";
                  let checkSpan = null;

                  if (isSelected) {
                    btnClass = "bg-slate-900 border-slate-900 text-white font-bold shadow-xl shadow-slate-900/10 scale-[1.02]";
                    checkSpan = <span className="h-6 w-6 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-black uppercase">Pilih</span>;
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleSaveAnswer(q.id, i)}
                      className={`w-full p-4.5 rounded-[1.5rem] border-2 text-left transition-all duration-300 flex items-center gap-4 group active:scale-[0.98] ${btnClass}`}
                    >
                      <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-sm font-black transition ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-700'}`}>
                        {letter}
                      </div>
                      <span className="text-sm font-bold leading-snug flex-1">{opt}</span>
                      {checkSpan}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Essay Input Textarea with auto growing design
              <div className="space-y-2">
                <textarea
                  placeholder="Ketikkan jawaban essay Anda di sini..."
                  value={userAnswers[q.id] || ""}
                  onChange={(e) => handleSaveAnswer(q.id, e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-slate-900 bg-slate-50 font-medium text-sm focus:outline-none min-h-[140px] resize-y transition-all"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
                  <span>Mendukung teks bebas</span>
                  <span>Auto-saved</span>
                </div>
              </div>
            )}
          </div>

          {/* QUESTION DIRECT GRID NAVIGATOR */}
          <div className="hidden md:block space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Navigasi Lembar Soal</h3>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((item, index) => {
                const isItemAnswered = userAnswers[item.id] !== undefined;
                const isItemFlagged = flaggedQuestions[index] === true;
                const isCurrent = index === currentIdx;

                let btnBg = "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100";
                if (isCurrent) {
                  btnBg = "bg-slate-900 text-white ring-2 ring-offset-2 ring-slate-900 font-black";
                } else if (isItemFlagged) {
                  btnBg = "bg-amber-100 text-amber-700 border border-amber-200 font-bold";
                } else if (isItemAnswered) {
                  btnBg = "bg-teal-500 text-white font-bold border border-teal-500";
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIdx(index)}
                    className={`h-11 rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-90 ${btnBg}`}
                  >
                    <span>{index + 1}</span>
                    {isItemAnswered && <span className="text-[10px] font-black">✓</span>}
                  </button>
                );
              })}
            </div>
            {/* Nav Indicators */}
            <div className="flex gap-4 flex-wrap pt-2 justify-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded bg-teal-500" /> Terjawab
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded bg-amber-400" /> Ragu-Ragu
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded bg-slate-100" /> Belum Dijawab
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation bar - Fixed */}
      <footer className="shrink-0 bg-white border-t border-slate-100 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center gap-2 text-slate-600 disabled:opacity-20 disabled:pointer-events-none transition"
          >
            ← Kembali
          </button>

          <button
            onClick={() => setShowMobileNav(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition active:scale-95 md:pointer-events-none"
          >
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
              Soal {currentIdx + 1} / {questions.length}
            </span>
            <div className="md:hidden h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shadow-sm">
              📑
            </div>
          </button>

          <button
            onClick={() => setCurrentIdx((p) => Math.min(questions.length - 1, p + 1))}
            disabled={currentIdx === questions.length - 1}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-20 disabled:pointer-events-none"
          >
            Selanjutnya →
          </button>
        </div>
      </footer>

      {/* LIGHTBOX FOR ZOOMABLE IMAGES */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={zoomImage} 
              alt="Zoomed" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <button className="absolute top-6 right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl backdrop-blur-sm">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-950/60 backdrop-blur-md flex items-end justify-center md:hidden"
            onClick={() => setShowMobileNav(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full rounded-t-[2.5rem] p-6 pb-12 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black italic uppercase text-slate-800 tracking-tight">Navigasi Soal</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Pilih nomor untuk melompat</p>
                </div>
                <button onClick={() => setShowMobileNav(false)} className="h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition">✕</button>
              </div>
              
              <div className="grid grid-cols-5 gap-3">
                {questions.map((item, index) => {
                  const isItemAnswered = userAnswers[item.id] !== undefined;
                  const isItemFlagged = flaggedQuestions[index] === true;
                  const isCurrent = index === currentIdx;

                  let btnBg = "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-sm";
                  if (isCurrent) {
                    btnBg = "bg-slate-900 text-white ring-2 ring-offset-2 ring-slate-900 font-black shadow-lg";
                  } else if (isItemFlagged) {
                    btnBg = "bg-amber-100 text-amber-700 border border-amber-300 font-bold shadow-sm";
                  } else if (isItemAnswered) {
                    btnBg = "bg-teal-500 text-white font-bold border border-teal-600 shadow-sm";
                  }

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentIdx(index);
                        setShowMobileNav(false);
                      }}
                      className={`h-12 rounded-xl text-sm flex items-center justify-center gap-1 transition active:scale-90 ${btnBg}`}
                    >
                      <span>{index + 1}</span>
                      {isItemAnswered && <span className="text-[10px] font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex gap-4 flex-wrap pt-8 justify-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-teal-500 shadow-sm" /> Terjawab
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" /> Ragu
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-200 shadow-inner" /> Belum
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM INLINE WARNING MODAL OVERLAY */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center text-4xl shadow-inner animate-pulse">
                ⚠️
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight">Wajib Diisi Lengkap</h3>
                <p className="text-sm font-semibold text-slate-400 max-w-xs leading-relaxed">
                  Ada <span className="text-rose-500 font-bold">{unansweredWarningCount}</span> soal yang belum Anda jawab. Anda wajib mengisi seluruh soal sebelum dapat menyelesaikan kuis ini!
                </p>
              </div>

              <div className="w-full pt-2">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black italic text-xs uppercase tracking-widest transition active:scale-95 shadow-lg shadow-rose-500/15"
                >
                  Kembali Lengkapi Soal ✍️
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CUSTOM INLINE COMPLETION CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-slate-100 shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <div className="h-20 w-20 bg-teal-50 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">
                🎯
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight">Kuis Selesai!</h3>
                <p className="text-sm font-semibold text-slate-400 max-w-xs leading-relaxed">
                  Semua soal telah terjawab dengan lengkap. Apakah Anda ingin memeriksa kembali jawaban Anda atau langsung menyelesaikan kuis ini?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black italic text-xs uppercase tracking-widest transition active:scale-95"
                >
                  Periksa Kembali ✍️
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setIsFinished(true);
                    calculateScoreAndCallback();
                  }}
                  className="py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black italic text-xs uppercase tracking-widest transition active:scale-95 shadow-lg shadow-teal-500/15"
                >
                  Selesaikan Kuis 🏁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
