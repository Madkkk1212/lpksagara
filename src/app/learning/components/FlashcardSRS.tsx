"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Brain, ChevronRight, RotateCcw, CheckCircle2, AlertCircle, Bookmark, Star, Zap } from "lucide-react";

export default function FlashcardSRS({ userEmail }: { userEmail: string }) {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetchDueCards();
  }, []);

  const fetchDueCards = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("user_flashcards")
      .select("*")
      .eq("user_email", userEmail)
      .lte("next_review_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    
    if (!error) {
      setCards(data || []);
    }
    setIsLoading(false);
    setIsFinished(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReview = async (quality: number) => {
    const card = cards[currentIndex];
    let { interval, ease_factor, level } = card;

    // Simplified SM-2 algorithm
    if (quality >= 3) {
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 6;
      else interval = Math.round(interval * ease_factor);
      level += 1;
    } else {
      interval = 1; // RESET to tomorrow if hard/forgotten
      level = Math.max(0, level - 1);
    }

    // Update ease factor: EF' = f(EF, quality)
    ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await supabase
      .from("user_flashcards")
      .update({
        interval,
        ease_factor,
        level,
        next_review_at: nextReview.toISOString()
      })
      .eq("id", card.id);

    // Give some EXP for reviewing
    const expGained = 10;
    const { data: prof } = await supabase.from('profiles').select('exp').eq('email', userEmail).single();
    await supabase.from('profiles').update({ exp: (prof?.exp || 0) + expGained }).eq('email', userEmail);
    await supabase.from('user_exp_logs').insert({
        user_email: userEmail,
        activity_type: 'flashcard',
        activity_id: card.id,
        exp_amount: expGained
    });

    // Move to next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse">Memuat kartu...</div>;

  if (cards.length === 0 || isFinished) {
    return (
      <div className="py-16 px-8 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-700">
         <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-100">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
         </div>
         <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tight">Semua Beres!</h3>
         <p className="text-sm text-slate-500 mt-2 max-w-sm">Anda telah menyelesaikan semua kartu untuk hari ini. Kembali lagi besok!</p>
         <button onClick={fetchDueCards} className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
            Cek Lagi
         </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-700">
      {/* Header Info */}
      <div className="flex items-center justify-between px-4">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
               <Brain className="w-5 h-5" />
            </div>
            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kotoba Flashcards</h3>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Memory Mastery Module</p>
            </div>
         </div>
         <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">
            KARTU {currentIndex + 1} / {cards.length}
         </div>
      </div>

      {/* The Card */}
      <div 
        className="perspective-1000 w-full h-[400px] cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
           {/* Front */}
           <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-[3rem] shadow-2xl shadow-indigo-100 flex flex-col items-center justify-center p-12 text-center overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <Zap className="w-40 h-40" />
              </div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Kotoba</span>
              <h2 className="text-7xl font-black text-slate-800 tracking-tight">{currentCard.front}</h2>
              <p className="mt-10 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-bounce">Ketuk untuk melihat arti</p>
           </div>

           {/* Back */}
           <div className="absolute inset-0 backface-hidden bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl rotate-y-180 flex flex-col items-center justify-center p-12 text-center overflow-hidden">
              <div className="absolute bottom-0 left-0 p-8 opacity-10">
                 <Bookmark className="w-40 h-40 text-white" />
              </div>
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] mb-4">Arti & Contoh</span>
              <h2 className="text-5xl font-black text-white tracking-tight leading-tight">{currentCard.back}</h2>
              {currentCard.example_sentence && (
                <p className="mt-8 text-sm italic text-slate-400 font-medium max-w-xs">"{currentCard.example_sentence}"</p>
              )}
           </div>
        </div>
      </div>

      {/* Actions */}
      {isFlipped ? (
        <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <RatingButton 
             label="SULIT" 
             subLabel="Ulang Besok" 
             color="bg-rose-500" 
             icon={<RotateCcw className="w-4 h-4" />}
             onClick={() => handleReview(1)} 
           />
           <RatingButton 
             label="BISA" 
             subLabel="Review 4 Hari" 
             color="bg-amber-500" 
             icon={<Star className="w-4 h-4" />}
             onClick={() => handleReview(3)} 
           />
           <RatingButton 
             label="MUDAH" 
             subLabel="Review 7 Hari" 
             color="bg-emerald-500" 
             icon={<CheckCircle2 className="w-4 h-4" />}
             onClick={() => handleReview(5)} 
           />
        </div>
      ) : (
        <div className="h-[74px]" /> // Placeholder
      )}

      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}

function RatingButton({ label, subLabel, color, icon, onClick }: { label: string, subLabel: string, color: string, icon: any, onClick: () => void }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-4 ${color} text-white rounded-3xl shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-1 group overflow-hidden relative`}
    >
       <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:rotate-12 transition-transform">
          {icon}
       </div>
       <span className="text-xs font-black tracking-widest">{label}</span>
       <span className="text-[8px] font-medium opacity-70 uppercase tracking-tighter">{subLabel}</span>
    </button>
  );
}
