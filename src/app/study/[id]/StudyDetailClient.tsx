"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { getMaterialBySlug, getProfileByEmail } from "@/lib/db";
import { Material, Profile } from "@/lib/types";

// --- CUSTOM ICONS ---
const StudyIcon = {
  Back: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  Sensei: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Pin: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
};

export default function StudyDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const checkAccess = async () => {
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

      const data = await getMaterialBySlug(id);
      if (data) {
        const hasAccess = !data.is_locked || profile?.is_premium || (profile?.unlocked_materials || []).includes(data.id);
        if (!hasAccess) {
          alert("Materi ini premium! Silakan hubungi admin.");
          router.push("/?tab=materi");
          return;
        }
      }
      
      setMaterial(data);
      setLoading(false);
    };

    checkAccess();
  }, [id, router]);

  const toggleReveal = (idx: number) => {
    setRevealed(p => ({ ...p, [idx]: !p[idx] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="h-16 w-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Knowledge...</p>
      </div>
    );
  }

  if (!material) return null;

  const detail = (material.detail_content as any) || {
    grammar: [{ rule: material.title, usage: material.subtitle, nuance: "Pahami konteks penggunaan kata/kalimat ini." }],
    senseiTips: ["Banyaklah berlatih mendengarkan.", "Gunakan kata ini dalam kalimat Anda sendiri."],
    examples: [
      { jp: material.japanese_text, furigana: material.title, id: material.indonesian_text, note: "Utama" },
      { jp: material.example_sentence, furigana: "Reibun", id: "Contoh penggunaan.", note: "Pendukung" }
    ]
  };

  return (
    <main className="min-h-screen bg-white pb-32 font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Premium Header */}
      <header className="relative pt-[calc(1rem+env(safe-area-inset-top))] px-6 pb-20 overflow-hidden">
         <div className="absolute inset-0 bg-slate-900 -z-10" />
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.15),_transparent_70%)]" />
         
         <div className="max-w-4xl mx-auto mt-10">
            <button onClick={() => router.back()} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xl mb-12 hover:bg-white/20 active:scale-95 transition-all ring-1 ring-white/20">
               <StudyIcon.Back />
            </button>
            
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <span className="px-4 py-1.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-400/20 text-[10px] font-black uppercase tracking-[0.5em] mb-8 inline-block">Study Module</span>
               <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none mb-8">
                  {material.title}
               </h1>
               <p className="text-white/60 text-lg md:text-2xl font-medium leading-relaxed max-w-2xl italic">
                  {material.subtitle}
               </p>
            </div>
         </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 -mt-10">
        {/* Core Rules Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-20">
           {detail.grammar?.map((item: any, i: number) => (
             <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 transition-all hover:-translate-y-2 duration-500 group">
                <div className="flex items-center gap-3 mb-8">
                   <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_2px_10px_rgba(20,184,166,0.4)]" />
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Master Rule</p>
                </div>
                <h3 className="text-2xl font-black text-slate-900 italic mb-8 leading-tight group-hover:text-teal-600 transition-colors underline decoration-slate-50 decoration-8 underline-offset-4">{item.rule}</h3>
                <div className="space-y-8">
                   <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 italic">Function</p>
                      <p className="text-lg text-slate-700 font-bold leading-relaxed">{item.usage}</p>
                   </div>
                   <div className="pt-8 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2 italic">Nuance</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{item.nuance}"</p>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="grid gap-16 lg:grid-cols-[1fr_320px]">
           {/* Examples Section */}
           <section className="space-y-10">
              <div className="flex items-center gap-4 border-l-4 border-slate-900 pl-6">
                 <div>
                    <h3 className="text-4xl font-black text-slate-900 italic tracking-tight">Praktek Kalimat.</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-1">Latihan Penggunaan dalam Konteks</p>
                 </div>
              </div>

              <div className="space-y-8">
                 {detail.examples?.map((ex: any, i: number) => (
                    <div key={i} className="group relative bg-slate-50 rounded-[3rem] p-10 md:p-14 border border-transparent hover:border-teal-500/20 hover:bg-white hover:shadow-2xl transition-all duration-700">
                       <div className="flex justify-between items-center mb-10">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Example {i+1}</span>
                          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100 text-teal-500">
                             <StudyIcon.Pin />
                          </span>
                       </div>
                       
                       <h4 className="text-3xl md:text-5xl font-black text-slate-900 leading-[1.2] italic mb-4 tracking-tighter">"{ex.jp}"</h4>
                       <p className="text-teal-600 font-black tracking-widest text-sm uppercase mb-12">{ex.furigana}</p>
                       
                       <button 
                         onClick={() => toggleReveal(i)}
                         className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-500 active:scale-95 ${revealed[i] ? "bg-white text-slate-900 ring-1 ring-slate-200" : "bg-slate-900 text-white shadow-2xl hover:shadow-slate-900/30"}`}
                       >
                         {revealed[i] ? ex.id : "Tunjukkan Arti"}
                       </button>

                       {ex.note && (
                         <div className="absolute -right-4 top-1/2 -translate-y-1/2 rotate-90 origin-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-200">{ex.note}</span>
                         </div>
                       )}
                    </div>
                 ))}
              </div>
           </section>

           {/* Sensei Tips Side */}
           <aside className="space-y-8">
              <div className="sticky top-10 flex flex-col gap-8">
                 <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl overflow-hidden relative">
                    <div className="relative z-10">
                       <div className="flex items-center gap-4 mb-10">
                          <div className="h-12 w-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
                             <StudyIcon.Sensei />
                          </div>
                          <h4 className="text-2xl font-black italic tracking-tight">Sensei Tips</h4>
                       </div>
                       
                       <div className="space-y-8">
                          {detail.senseiTips?.map((tip: string, i: number) => (
                             <div key={i} className="flex gap-4 group">
                                <div className="h-2 w-2 rounded-full bg-teal-400 mt-2 shrink-0 group-hover:scale-150 transition-all shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                                <p className="text-white/80 font-medium italic leading-relaxed text-sm md:text-base">"{tip}"</p>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="absolute -top-10 -right-10 h-40 w-40 bg-teal-500/10 rounded-full blur-3xl" />
                 </div>

                 <div className="bg-teal-500 rounded-[3rem] p-10 text-white shadow-2xl shadow-teal-500/20 group hover:-translate-y-2 transition-all duration-500">
                    <h5 className="text-sm font-black uppercase tracking-widest mb-6 opacity-60">Ready for a Test?</h5>
                    <h4 className="text-3xl font-black italic tracking-tighter leading-tight mb-8">Ujikan <br/>Kemampuan Anda.</h4>
                    <button 
                      onClick={() => router.push("/?tab=soal")}
                      className="w-full py-5 bg-white text-teal-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all group-hover:bg-slate-900 group-hover:text-white"
                    >
                       Mulai Latihan →
                    </button>
                 </div>
              </div>
           </aside>
        </div>
      </div>
    </main>
  );
}
