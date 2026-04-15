"use client";

import { Profile, AppTheme } from "@/lib/types";

export default function LatihanView({ user, theme, onUpgrade }: { user: Profile, theme: AppTheme | null, onUpgrade?: (msg: string) => void }) {
  const practiceCards = [
    {
      id: "jlpt",
      title: "1. Mockup JLPT / NAT Test",
      description: "Simulasi ujian asli dengan timer mundur & sistem penilaian otomatis.",
      icon: "📄",
      color: "teal",
      tag: null,
      locked: !user.is_premium && !user.is_admin
    },
    {
      id: "jft",
      title: "2. Mockup JFT-Basic",
      description: "Latihan komputerisasi khusus untuk persiapan tes JFT-Basic.",
      icon: "✅",
      color: "indigo",
      tag: null,
      locked: !user.is_premium && !user.is_admin
    },
    {
      id: "ssw",
      title: "3. Mockup Ujian SSW",
      description: "Latihan soal teknis sesuai dengan bidang keahlian pekerjaan Anda.",
      icon: "🏆",
      color: "amber",
      tag: null,
      locked: !user.is_premium && !user.is_admin
    },
    {
      id: "ai",
      title: "4. Kaiwa AI Partner",
      description: "Latih percakapan Anda secara interaktif dengan evaluasi real-time dari AI.",
      icon: "🔊",
      color: "rose",
      tag: "Premium",
      locked: !user.is_premium && !user.is_admin
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="px-4">
        <h3 className="text-3xl font-black italic text-slate-800 uppercase tracking-tight">Pusat Latihan & Simulasi</h3>
        <p className="text-sm text-slate-400 font-medium italic mt-1">Uji kemampuan Anda sebelum menempuh ujian yang sesungguhnya.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {practiceCards.map((card) => (
          <div key={card.id} className="relative group">
            <div className={`bg-white/60 backdrop-blur-xl rounded-[3.5rem] p-10 border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all duration-700 overflow-hidden ${card.locked ? 'grayscale opacity-60' : 'hover:shadow-2xl hover:translate-y-[-10px]'}`}>
              {card.tag && (
                <span className="absolute top-10 right-10 px-4 py-1.5 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30">
                  ✨ {card.tag}
                </span>
              )}
              
              <div className={`h-24 w-24 rounded-[2rem] bg-white flex items-center justify-center text-4xl mb-10 transition-all duration-700 shadow-xl ring-8 ring-slate-100`}>
                {card.icon}
              </div>

              <h4 className="text-2xl font-black text-slate-800 italic mb-3 tracking-tight group-hover:text-teal-600 transition-colors uppercase">{card.title}</h4>
              <p className="text-sm text-slate-400 font-medium mb-10 leading-relaxed">{card.description}</p>

              <button 
                disabled={card.locked}
                className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all duration-500 shadow-lg ${card.locked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-teal-600'}`}>
                {card.locked ? 'Fitur Premium 🔒' : 'Mulai Simulasi Sekarang ›'}
              </button>
            </div>

            {card.locked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-900/5 backdrop-blur-[4px] rounded-[3.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20">
                <div className="text-center space-y-4">
                  <span className="text-4xl">💎</span>
                  <h5 className="text-xl font-black text-slate-900 italic uppercase">Premium Only</h5>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Upgrade untuk akses fitur ini</p>
                  <button 
                    onClick={() => onUpgrade?.(`Halo Admin, saya ${user.full_name} ingin berlangganan Premium untuk akses ${card.title} di ${theme?.app_name || 'Reiwa LMS'}`)}
                    className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-colors"
                  >
                    Hubungi Admin →
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
