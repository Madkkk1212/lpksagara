"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StudyMaterial } from "@/lib/types";
import { markMaterialCompleted } from "@/lib/db";
import KioskBarrier from "@/app/components/KioskBarrier";

export default function StudyMaterialClient({ materialData }: { materialData: StudyMaterial }) {
  const router = useRouter();
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const sessionStr = localStorage.getItem('luma-user-profile');
    if (sessionStr) {
      try {
        const u = JSON.parse(sessionStr);
        if (u.email) setUserEmail(u.email);
      } catch(e){}
    }
  }, []);

  const handleFinish = async () => {
    if (!userEmail) { alert("Sesi kadaluarsa. Silakan login."); return; }
    setIsFinishing(true);
    try {
      await markMaterialCompleted(userEmail, materialData.id);
      router.back();
    } catch(e) {
      alert("Error menandai selesai");
      setIsFinishing(false);
    }
  };

  const content: any = materialData.content || {};

  const handleAnswer = (qIdx: number, val: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: val }));
  };

  const renderMojiGoi = () => (
    <div className="space-y-6">
      {content.items?.map((item: any, idx: number) => (
        <div key={idx} className="p-6 bg-white rounded-3xl shadow-sm ring-1 ring-black/[0.05] hover:ring-teal-500/20 transition-all flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-1">{item.jp}</h3>
            <p className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full inline-block">{item.id}</p>
            {item.example && <p className="text-sm text-slate-500 mt-4 italic">"{item.example}"</p>}
          </div>
          {item.audioUrl && (
            <button className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl hover:bg-slate-200 active:scale-95 transition-all">
              🔊
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const renderBunpou = () => (
    <div className="space-y-8">
      {content.items?.map((item: any, idx: number) => (
        <div key={idx} className="bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white text-center">
            <h3 className="text-2xl font-black tracking-widest">{item.pattern}</h3>
          </div>
          <div className="p-8">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-2">Penjelasan</h4>
            <p className="text-slate-700 font-medium leading-relaxed mb-6">{item.explanation}</p>
            
            <h4 className="text-xs font-black uppercase text-slate-400 mb-4 border-t border-slate-100 pt-6">Contoh Kalimat</h4>
            <ul className="space-y-4">
              {item.examples?.map((ex: any, i: number) => (
                <li key={i} className="flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl">
                   <span className="text-lg font-bold text-slate-800">{ex.jp}</span>
                   <span className="text-sm text-slate-500 italic">{ex.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDokkai = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-100 relative">
        <button 
          onClick={() => setShowTranslation(!showTranslation)}
          className="absolute top-6 right-6 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
        >
          {showTranslation ? 'Sembunyikan Arti' : 'Lihat Arti'}
        </button>
        <h3 className="text-sm font-black text-teal-600 uppercase tracking-widest mb-6">Teks Bacaan</h3>
        <p className="text-xl font-medium text-slate-800 leading-loose">{content.text_jp}</p>
        
        {showTranslation && (
          <div className="mt-8 p-6 bg-teal-50 rounded-2xl border border-teal-100">
             <p className="text-teal-900 font-medium italic">{content.text_id}</p>
          </div>
        )}
      </div>
      {renderExercises()}
    </div>
  );

  const renderChoukai = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-[2rem] p-10 shadow-sm ring-1 ring-slate-100 text-center flex flex-col items-center">
        <div className="h-24 w-24 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-4xl mb-6 shadow-inner">
           🎧
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-6 tracking-wide">Audio Listening</h3>
        {content.audioUrl ? (
          <audio controls className="w-full max-w-md mx-auto outline-none rounded-full shadow-md">
            <source src={content.audioUrl} type="audio/mpeg" />
            Browser Anda tidak mendukung elemen audio.
          </audio>
        ) : (
          <p className="text-slate-400 text-sm font-medium">Audio tidak tersedia.</p>
        )}
      </div>
      {renderExercises()}
    </div>
  );

  const renderExercises = () => {
    if (!content.exercises || content.exercises.length === 0) return null;
    return (
      <div className="bg-white rounded-[2rem] p-8 shadow-sm ring-1 ring-slate-100">
        <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-6">Latihan Soal</h3>
        <div className="space-y-12">
          {content.exercises.map((ex: any, idx: number) => {
            const isAnswered = selectedAnswers[idx] !== undefined;
            const isCorrect = selectedAnswers[idx] === ex.answer;
            return (
              <div key={idx} className="space-y-4">
                <p className="font-bold text-slate-800 text-lg">{idx + 1}. {ex.q}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ex.options.map((opt: string, optIdx: number) => {
                    const isSelected = selectedAnswers[idx] === optIdx;
                    let btnClass = "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100";
                    if (isAnswered) {
                      if (optIdx === ex.answer) btnClass = "bg-teal-50 border-teal-500 text-teal-700 font-bold shadow-md";
                      else if (isSelected) btnClass = "bg-rose-50 border-rose-500 text-rose-700 font-bold disabled";
                      else btnClass = "bg-slate-50/50 border-transparent text-slate-400 opacity-50";
                    } else if (isSelected) {
                      btnClass = "bg-slate-900 border-slate-900 text-white shadow-xl";
                    }
                    return (
                      <button 
                        key={optIdx}
                        disabled={isAnswered}
                        onClick={() => handleAnswer(idx, optIdx)}
                        className={`p-4 border-2 rounded-2xl text-left transition-all ${btnClass}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {isAnswered && (
                  <p className={`text-sm font-bold mt-2 ${isCorrect ? 'text-teal-600' : 'text-rose-500'}`}>
                    {isCorrect ? '✨ Benar!' : '❌ Salah.'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuiz = () => (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-[2rem] p-10 text-white shadow-xl text-center">
        <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
        <h3 className="text-3xl font-black italic tracking-tight">Chapter Quiz</h3>
        <p className="opacity-80 font-medium mt-2">Uji pemahaman Anda pada seluruh materi di bab ini.</p>
      </div>
      {renderExercises()}
    </div>
  );

  const nodeRoot = (
    <main className="min-h-screen pb-40" style={{ backgroundColor: '#f8fafc' }}>
      <header className="px-6 pt-12 pb-8 bg-white shadow-sm ring-1 ring-black/[0.03] sticky top-0 z-30 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition">
              ←
            </button>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{materialData.material_type.replace('_', ' ')}</div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
            {materialData.title}
          </h1>
        </div>
        {materialData.icon_url && (
          <img src={materialData.icon_url || undefined} alt="icon" className="w-16 h-16 object-contain rounded-2xl shadow-sm bg-slate-50 p-2" />
        )}
      </header>
      
      <div className="max-w-3xl mx-auto px-6 mt-8">
         {materialData.material_type === 'moji_goi' && renderMojiGoi()}
         {materialData.material_type === 'bunpou' && renderBunpou()}
         {materialData.material_type === 'dokkai' && renderDokkai()}
         {materialData.material_type === 'choukai' && renderChoukai()}
         {materialData.material_type === 'quiz' && renderQuiz()}
      </div>

      <div className="fixed bottom-0 inset-x-0 p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40">
        <div className="max-w-3xl mx-auto">
          <button 
             onClick={handleFinish} 
             disabled={isFinishing}
             className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black tracking-widest uppercase hover:bg-slate-800 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
             {isFinishing ? 'Menyimpan...' : '✓ Tandai Selesai & Lanjut'}
          </button>
        </div>
      </div>
    </main>
  );

  if (materialData.material_type === 'quiz') {
    return <KioskBarrier title="Kuis Evaluasi Bab">{nodeRoot}</KioskBarrier>;
  }
  return nodeRoot;
}
