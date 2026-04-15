"use client";

import { Profile } from "@/lib/types";

export default function ProfileView({ user, onLogout }: { user: Profile, onLogout: () => void }) {
  const profileSettings = [
    { label: "Informasi Pribadi", sub: "Ubah nama, email, dan password", icon: "👤" },
    { label: "Privasi & Keamanan", sub: "Atur siapa yang bisa melihat progres Anda di Leaderboard", icon: "🛡️" },
    { label: "Status Membership", sub: "Kelola tagihan dan paket langganan", icon: "💳" },
    { label: "Preferensi Aplikasi", sub: "Tema, Notifikasi, dan Suara", icon: "⚙️" },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <h3 className="text-2xl font-black italic text-slate-800 text-center">Pengaturan Profil</h3>

      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center gap-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full opacity-50" />
        <div className="relative">
          <div className="h-32 w-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center font-black text-4xl text-slate-300 overflow-hidden">
             {user.avatar_url ? (
               <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar"/>
             ) : (
               user.full_name.charAt(0)
             )}
          </div>
          <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-slate-900 text-white rounded-xl shadow-lg flex items-center justify-center text-sm border-2 border-white hover:scale-110 transition active:scale-95">
             📷
          </button>
        </div>

        <div className="text-center">
            <h4 className="text-2xl font-black text-slate-800 italic">{user.full_name}</h4>
            <p className="text-sm font-medium text-slate-400">{user.email}</p>
            <div className="mt-4 flex items-center gap-2 justify-center">
               <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-200">✨ {user.is_premium ? 'Premium' : 'Free User'}</span>
               <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-200">Level {user.target_level || 'N5'}</span>
            </div>
        </div>

        <button className="mt-4 px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black italic shadow-xl shadow-orange-500/20 active:scale-95 transition-all hover:scale-105">
           Upgrade Akun
        </button>
      </div>

      <div className="space-y-4">
        {profileSettings.map((item, idx) => (
          <button key={idx} className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center justify-between group">
             <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                   {item.icon}
                </div>
                <div className="text-left">
                   <h5 className="font-black text-slate-800 text-sm tracking-tight italic">{item.label}</h5>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.sub}</p>
                </div>
             </div>
             <span className="text-slate-200 text-xl font-bold group-hover:text-slate-400 transition-colors">›</span>
          </button>
        ))}
      </div>

      <div className="pt-10 text-center">
         <button onClick={onLogout} className="text-rose-500 font-black italic hover:text-rose-600 transition-colors underline underline-offset-8 decoration-2 decoration-rose-500/20">
            Keluar (Log Out)
         </button>
      </div>
    </div>
  );
}
