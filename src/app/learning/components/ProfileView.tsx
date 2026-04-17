import { useState } from "react";
import { Profile } from "@/lib/types";
import { upsertProfile } from "@/lib/db";

export default function ProfileView({ user, onLogout }: { user: Profile, onLogout: () => void }) {
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword.length < 4) {
      alert("Password minimal 4 karakter.");
      return;
    }

    setLoading(true);
    try {
      await upsertProfile({ ...user, password: newPassword });
      alert("Password berhasil diubah!");
      setIsChangingPass(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert("Gagal mengubah password.");
    } finally {
      setLoading(false);
    }
  };
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
        {/* Information Item */}
        <div className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
           <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl shadow-inner">
                 👤
              </div>
              <div className="text-left">
                 <h5 className="font-black text-slate-800 text-sm tracking-tight italic">Informasi Akun</h5>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.full_name} • {user.email}</p>
              </div>
           </div>
        </div>

        {/* Change Password Button */}
        <button 
          onClick={() => setIsChangingPass(true)}
          className="w-full bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center justify-between group"
        >
           <div className="flex items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                 🔑
              </div>
              <div className="text-left">
                 <h5 className="font-black text-slate-800 text-sm tracking-tight italic">Ubah Password</h5>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Jaga keamanan akun Anda secara berkala</p>
              </div>
           </div>
           <span className="text-slate-200 text-xl font-bold group-hover:text-slate-400 transition-colors">→</span>
        </button>

        {profileSettings.slice(1).map((item, idx) => (
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
             <span className="text-slate-200 text-xl font-bold group-hover:text-slate-400 transition-colors">→</span>
          </button>
        ))}
      </div>

      {/* Change Password Modal */}
      {isChangingPass && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsChangingPass(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
             <h3 className="text-2xl font-black text-slate-800 mb-2 italic">Ubah Password</h3>
             <p className="text-slate-400 text-xs font-medium mb-8 uppercase tracking-widest">Masukkan password baru Anda di bawah ini.</p>
             
             <form onSubmit={handlePasswordChange} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Password Baru</label>
                    <div className="relative">
                       <input 
                         type={showPassword ? "text" : "password"}
                         required
                         className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition font-bold"
                         value={newPassword}
                         onChange={e => setNewPassword(e.target.value)}
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-500 transition-colors"
                       >
                         {showPassword ? "👁️" : "👁️‍🗨️"}
                       </button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Konfirmasi Password</label>
                    <div className="relative">
                       <input 
                         type={showPassword ? "text" : "password"}
                         required
                         className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition font-bold"
                         value={confirmPassword}
                         onChange={e => setConfirmPassword(e.target.value)}
                       />
                    </div>
                 </div>
                
                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => setIsChangingPass(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs transition-all">BATAL</button>
                   <button type="submit" disabled={loading} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-xl active:scale-95 transition-all">
                      {loading ? 'MENYIMPAN...' : 'SIMPAN PASSWORD'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      <div className="pt-10 text-center">
         <button onClick={onLogout} className="text-rose-500 font-black italic hover:text-rose-600 transition-colors underline underline-offset-8 decoration-2 decoration-rose-500/20">
            Keluar (Log Out)
         </button>
      </div>
    </div>
  );
}
