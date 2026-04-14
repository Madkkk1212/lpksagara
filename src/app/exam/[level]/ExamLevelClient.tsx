"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { getExamLevels, getExamTests, getQuestions, getProfileByEmail } from "@/lib/db";
import { ExamLevel, ExamTest, Question, Profile } from "@/lib/types";
import KioskBarrier from "@/app/components/KioskBarrier";

// --- ART ICON COMPONENTS ---
const ArtIcon = {
  Scroll: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <path d="M15.5 19C15.5 20.3807 14.3807 21.5 13 21.5H6C4.61929 21.5 3.5 20.3807 3.5 19V5C3.5 3.61929 4.61929 2.5 6 2.5H13C14.3807 2.5 15.5 3.61929 15.5 5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.5 19V5C15.5 3.61929 16.6193 2.5 18 2.5H20.5V17C20.5 18.3807 19.3807 19.5 18 19.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 7H12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 11H12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 15H10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Spark: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Target: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
      <circle cx="12" cy="12" r="9" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
  Check: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17L4 12" />
    </svg>
  ),
  Back: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  )
};

type ViewState = "dashboard" | "pretest" | "exam" | "result";

const CATEGORY_TABS: { id: "full" | "mini" | "skill"; label: string; Icon: any }[] = [
  { id: "full", label: "Full Test", Icon: ArtIcon.Scroll },
  { id: "mini", label: "Mini Test", Icon: ArtIcon.Spark },
  { id: "skill", label: "Skill Test", Icon: ArtIcon.Target },
];

export default function ExamLevelClient({ level }: { level: string }) {
  const router = useRouter();
  
  const [activeView, setActiveView] = useState<ViewState>("dashboard");
  const [activeCategory, setActiveCategory] = useState<"full" | "mini" | "skill">("full");
  const [selectedTest, setSelectedTest] = useState<(ExamTest & { questions: Question[] }) | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [levelConfig, setLevelConfig] = useState<ExamLevel | null>(null);
  const [testList, setTestList] = useState<ExamTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExamData = useCallback(async () => {
    const levels = await getExamLevels();
    const currentLevel = levels.find(l => l.level_code.toLowerCase() === level.toLowerCase());
    
    if (currentLevel) {
      setLevelConfig(currentLevel);
      const tests = await getExamTests(currentLevel.id);
      setTestList(tests);
    }
  }, [level]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const savedUser = localStorage.getItem("luma-user-profile");
      let profile: Profile | null = savedUser ? JSON.parse(savedUser) : null;
      
      if (profile) {
        try {
          const fresh = await getProfileByEmail(profile.email);
          if (fresh) {
            profile = fresh;
            localStorage.setItem("luma-user-profile", JSON.stringify(fresh));
          }
        } catch (err) {}
      }
      setUserProfile(profile);

      await fetchExamData();
      setLoading(false);
    };
    init();
  }, [level, fetchExamData]);

  const filteredTests = useMemo(() => {
    return testList.filter(t => t.category === activeCategory);
  }, [testList, activeCategory]);

  const handleStartTest = async (test: ExamTest) => {
    const auth = localStorage.getItem("luma-auth") === "true";
    if (!auth || !userProfile) {
      router.push(`/login?redirect=exam/${level}`);
      return;
    }
    
    const hasAccess = userProfile.is_premium || !levelConfig?.is_locked || (userProfile.unlocked_levels || []).includes(levelConfig?.id || '');
    if (!hasAccess) {
      alert("Akses level ini premium! Silakan hubungi admin.");
      return;
    }
    
    setLoading(true);
    const questions = await getQuestions(test.id);
    setSelectedTest({ ...test, questions });
    setActiveView("pretest");
    setLoading(false);
  };

  useEffect(() => {
    if (activeView === 'exam' && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(p => {
          if (p <= 1) {
            setActiveView("result");
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeView, timer]);

  const beginExam = () => {
    if (!selectedTest) return;
    setTimer(selectedTest.duration_minutes * 60);
    setCurrentIdx(0);
    setUserAnswers({});
    setActiveView("exam");
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAnswer = (qid: string, idx: number) => {
    setUserAnswers(prev => ({ ...prev, [qid]: idx }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading Hub...</p>
      </div>
    );
  }

  // 1. DASHBOARD VIEW
  if (activeView === "dashboard") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 md:px-12">
        <div className="mx-auto max-w-4xl">
          <header className="mb-12 flex items-center justify-between">
            <button onClick={() => router.push("/?tab=soal")} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 active:scale-95 transition">
              <ArtIcon.Back />
            </button>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-600 mb-1">Skill Center</p>
              <h1 className="text-3xl font-black text-slate-900 italic tracking-tighter">Level {level.toUpperCase()}</h1>
            </div>
            <div className="h-14 w-14" /> {/* Spacer */}
          </header>

          <section 
            className="mb-12 p-10 rounded-[3rem] bg-slate-900 text-white overflow-hidden relative shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${levelConfig?.gradient_from || '#0d9488'}, ${levelConfig?.gradient_to || '#0f172a'})` }}
          >
            <div className="relative z-10">
                <span className="bg-white/10 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase backdrop-blur-xl border border-white/10">{levelConfig?.title || 'Examination'}</span>
                <h2 className="mt-6 text-5xl font-black italic tracking-tight leading-none mb-4">Master Your Limit.</h2>
                <p className="opacity-70 text-sm font-medium leading-relaxed max-w-xs">{levelConfig?.description || 'Curated tests to help you pass the official JLPT exam with confidence.'}</p>
            </div>
            <div className="absolute -bottom-10 -right-10 h-64 w-64 bg-white/5 rounded-full blur-[80px]" />
          </section>

          <div className="flex gap-2 p-1.5 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 mb-10 overflow-x-auto no-scrollbar">
            {CATEGORY_TABS.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveCategory(tab.id as any)} 
                className={`flex-1 min-w-[100px] py-4 rounded-[1.5rem] flex flex-col items-center gap-2 transition-all ${activeCategory === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <tab.Icon />
                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredTests.map((test, idx) => (
              <button 
                key={test.id} 
                onClick={() => handleStartTest(test)}
                className="w-full p-6 rounded-[2.5rem] bg-white border border-slate-100 text-left transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-teal-500/20 group flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.8rem] bg-slate-50 flex items-center justify-center text-2xl font-black text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">{idx + 1}</div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 italic group-hover:text-teal-600 transition-colors">{test.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">⏱️ {test.duration_minutes}m</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">📝 {selectedTest?.questions.length || 0}q</span>
                    </div>
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-teal-500 group-hover:text-white transition-all">→</div>
              </button>
            ))}
            {filteredTests.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-black italic tracking-widest uppercase text-[10px]">No tests found in this category</p>
                </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // 2. PRE-TEST BRIEFING
  if (activeView === "pretest" && selectedTest) {
    return (
      <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-10 animate-in zoom-in duration-500">
           <div className="h-32 w-32 mx-auto bg-teal-500 rounded-[3rem] flex items-center justify-center text-5xl shadow-[0_0_60px_rgba(20,184,166,0.3)]">🏆</div>
           
           <div>
              <p className="text-teal-400 font-black uppercase tracking-[0.5em] text-[10px] mb-4">Exam Protocol</p>
              <h2 className="text-4xl font-black italic tracking-tight leading-tight">{selectedTest.title}</h2>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-[2rem] p-8 ring-1 ring-white/10">
                 <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-2">Duration</p>
                 <p className="text-3xl font-black italic">{selectedTest.duration_minutes}m</p>
              </div>
              <div className="bg-white/5 rounded-[2rem] p-8 ring-1 ring-white/10">
                 <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-2">Questions</p>
                 <p className="text-3xl font-black italic">{selectedTest.questions.length}</p>
              </div>
           </div>

           <div className="space-y-6">
              <button 
                onClick={beginExam} 
                className="w-full py-6 rounded-3xl bg-teal-500 text-white font-black text-xl shadow-2xl shadow-teal-500/20 active:scale-95 transition"
              >
                BEGIN CHALLENGE
              </button>
              <button onClick={() => setActiveView("dashboard")} className="text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition">Cancel & Go Back</button>
           </div>
        </div>
      </main>
    );
  }

  // 3. ACTIVE EXAM
  if (activeView === "exam" && selectedTest) {
    const q = selectedTest.questions[currentIdx];
    const progress = ((currentIdx + 1) / selectedTest.questions.length) * 100;

    return (
      <KioskBarrier title={`Mode Ujian: ${selectedTest.title}`}>
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
        {/* Modern Header / Progress */}
        <div className="sticky top-0 z-50 bg-white shadow-sm">
           <div className="max-w-2xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xl font-black italic text-slate-800 tracking-tighter tabular-nums">{formatTime(timer)}</span>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Question {currentIdx + 1} of {selectedTest.questions.length}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-teal-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(20,184,166,0.3)]"
                   style={{ width: `${progress}%` }}
                 />
              </div>
           </div>
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <section className="bg-white rounded-[3rem] p-10 md:p-14 shadow-[0_8px_40px_rgba(0,0,0,0.03)] ring-1 ring-slate-100">
             <div className="mb-8">
                <span className="px-4 py-1.5 rounded-full bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-widest">Question {currentIdx + 1}</span>
             </div>
             <h2 className="text-2xl md:text-3xl font-black text-slate-900 italic leading-snug">{q.question_text}</h2>
          </section>

          <div className="grid gap-4 pb-24">
            {[q.option_a, q.option_b, q.option_c, q.option_d].map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(q.id, i)}
                className={`flex items-center gap-6 p-6 rounded-[2.5rem] text-left transition-all duration-300 group ${userAnswers[q.id] === i ? 'bg-teal-500 text-white shadow-2xl shadow-teal-500/20 ring-0' : 'bg-white ring-1 ring-slate-100 hover:ring-teal-500/30'}`}
              >
                <div className={`h-12 w-12 rounded-[1.2rem] flex items-center justify-center font-black transition-colors ${userAnswers[q.id] === i ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600'}`}>
                  {String.fromCharCode(65 + i)}
                </div>
                <span className={`text-lg font-bold ${userAnswers[q.id] === i ? 'text-white' : 'text-slate-700'}`}>{opt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
           <div className="max-w-2xl mx-auto flex gap-4">
              <button 
                onClick={() => setCurrentIdx(p => p - 1)} 
                disabled={currentIdx === 0}
                className="h-16 w-16 flex items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 text-slate-400 disabled:opacity-20 disabled:pointer-events-none active:scale-95 transition"
              >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              
              {currentIdx === selectedTest.questions.length - 1 ? (
                <button 
                  onClick={() => setActiveView("result")}
                  className="flex-1 h-16 bg-teal-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 active:scale-95 transition"
                >
                  Selesaikan Ujian
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIdx(p => p + 1)}
                  className="flex-1 h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
                >
                  Lanjutkan
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              )}
           </div>
        </div>
      </div>
      </KioskBarrier>
    );
  }

  // 4. RESULT VIEW
  if (activeView === "result" && selectedTest) {
    const score = selectedTest.questions.reduce((acc, q) => acc + (userAnswers[q.id] === q.correct_option ? 1 : 0), 0) || 0;
    const total = selectedTest.questions.length || 1;
    const finalScore = Math.round((score / total) * 100);
    const passed = finalScore >= (selectedTest.pass_point || 60);

    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col p-8 font-sans">
         <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full text-center py-10">
            <div className={`h-40 w-40 rounded-[3.5rem] flex items-center justify-center text-7xl shadow-2xl mb-12 animate-in zoom-in duration-1000 ${passed ? 'bg-teal-500 shadow-teal-500/30' : 'bg-rose-500 shadow-rose-500/30'}`}>
               {passed ? '🎓' : '📚'}
            </div>
            
            <h2 className="text-5xl font-black italic tracking-tighter mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">Hasil Ujian</h2>
            <p className="text-teal-400 font-black uppercase tracking-[0.4em] text-[10px] mb-14">Latihan JLPT {level.toUpperCase()}</p>
            
            <div className="w-full space-y-4 mb-16">
               <div className="bg-white/5 rounded-[2.5rem] p-10 ring-1 ring-white/10 flex justify-between items-center transition-all hover:bg-white/10">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Precision</span>
                  <span className={`text-5xl font-black italic ${passed ? 'text-teal-400' : 'text-rose-400'}`}>{finalScore}%</span>
               </div>
               <div className="bg-white/5 rounded-[2.5rem] p-10 ring-1 ring-white/10 flex justify-between items-center transition-all hover:bg-white/10">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Correct Answers</span>
                  <span className="text-5xl font-black italic text-white">{score}/{total}</span>
               </div>
            </div>
            
            <button 
              onClick={() => setActiveView("dashboard")}
              className="w-full py-7 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition duration-500"
            >
               Kembali ke Hub
            </button>
         </div>
      </div>
    );
  }

  return null; // Should not reach here
}
