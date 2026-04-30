"use client";

import { useEffect, useState, useMemo } from "react";
import { Profile, AppTheme, StudyMaterial } from "@/lib/types";
import { getLeaderboard, getUserLastProgressDetails, getStudentWeeklyTargets, getCompletedMaterials, getBasicStudyMaterials } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import AISenseiChat from "./AISenseiChat";
import { Flame, Trophy, Zap, CheckCircle2, Circle, BookOpen, Link2 } from "lucide-react";
import { WeeklyTarget } from "@/lib/types";

export default function DashboardView({ user, theme, onUpgrade, onSwitchTab }: { user: Profile, theme: AppTheme | null, onUpgrade?: (msg: string) => void, onSwitchTab?: (tab: any) => void }) {
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [lastProgress, setLastProgress] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [weeklyTargets, setWeeklyTargets] = useState<WeeklyTarget[]>([]);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);
  const [allMaterials, setAllMaterials] = useState<StudyMaterial[]>([]);
  const [isLeaderboardOpen, setLeaderboardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  
  const currentExp = user.exp || 0;
  // Progress formula: assuming levels are 1000 exp each
  const levelProgress = currentExp % 1000;
  const progressPercent = Math.min(levelProgress / 10, 100);

  useEffect(() => {
    async function loadDashboard() {
      // 1. Fetch active announcements
      const { data: ann } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (ann && ann.length > 0) {
        setAnnouncements(ann);
        setShowAnnouncement(true);
      }

      // 2. Fetch earned achievements
      const { data: ach } = await supabase
        .from('user_achievements')
        .select('achievement_id, achievements(*)')
        .eq('user_email', user.email);
      setAchievements(ach || []);

      // 3. Fetch Leaderboard, Progress, Weekly Targets & All Materials
      const [lb, lp, targets, completed, mats] = await Promise.all([
        getLeaderboard(),
        getUserLastProgressDetails(user.email),
        getStudentWeeklyTargets(user.email, user.batch),
        getCompletedMaterials(user.email),
        getBasicStudyMaterials()
      ]);
      setLeaderboard(lb.filter(p => !p.is_admin && !p.is_teacher));
      setLastProgress(lp);
      setWeeklyTargets(targets);
      setCompletedMaterials(completed);
      setAllMaterials(mats as StudyMaterial[]);
    }
    loadDashboard();
  }, [user.email]);

  // Simulated Weekly Activity Data
  const weeklyActivity = useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return days.map((day, i) => ({
      day,
      value: Math.floor(Math.random() * 60) + 20 + (i === 6 ? 20 : 0)
    }));
  }, []);

  return (
    <div className="space-y-12 pb-20">
      {/* 1. Stat Cards & Welcome */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-[3rem] p-10 shadow-[0_20px_60px_rgba(0,0,0,0.03)] border border-white/80 flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(45,212,191,0.1)_0%,transparent_70%)] rounded-full -mr-40 -mt-40 transition-transform duration-1000 group-hover:scale-110" />
          
          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full">
                   <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                   <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{user.current_streak || 0} DAY STREAK</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                   <Trophy className="w-4 h-4 text-indigo-500" />
                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{achievements.length} BADGES</span>
                </div>
             </div>
             <h2 className="text-4xl font-black text-slate-800 leading-tight">
                Selamat Belajar,<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">{user.full_name}!</span>
             </h2>
          </div>

          <div className="w-full md:w-72 p-6 bg-white/50 backdrop-blur-md rounded-[2rem] border border-white/60 shadow-inner relative z-10">
            <div className="flex justify-between items-end mb-4">
               <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Level Progress</p>
                 <h4 className="text-2xl font-black text-slate-800 italic">Lvl {user.level || 1}</h4>
               </div>
               <span className="text-xl">✨</span>
            </div>
            <div className="h-4 bg-slate-100/50 rounded-full overflow-hidden p-0.5">
               <div 
                 className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(20,184,166,0.3)]" 
                 style={{ width: `${progressPercent}%` }} 
               />
            </div>
            <div className="mt-3 flex justify-between">
              <span className="text-[9px] font-black text-teal-600">{levelProgress} XP</span>
              <span className="text-[9px] font-black text-slate-300">Target Level: {user.target_level || 'N5'}</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Fast Look */}
        <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
             <span className="text-8xl">🏆</span>
           </div>
           <div className="relative z-10">
              <h3 className="text-white text-xl font-black italic mb-6">Top Performers</h3>
              <div className="space-y-4">
                 {leaderboard.slice(0, 4).map((player, idx) => (
                   <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${player.email === user.email ? 'bg-white/10 ring-1 ring-white/20' : ''}`}>
                      <div className="flex items-center gap-3">
                         <span className={`text-xs font-black w-5 h-5 rounded-md flex items-center justify-center ${idx === 0 ? 'bg-amber-400 text-slate-900' : 'bg-white/5 text-white/40'}`}>{idx + 1}</span>
                         <span className="text-xs font-bold text-white/80 truncate max-w-[100px]">{player.full_name}</span>
                      </div>
                      <span className="text-[10px] font-black text-teal-400 tabular-nums">{player.exp} XP</span>
                   </div>
                 ))}
              </div>
              <button 
                onClick={() => setLeaderboardOpen(true)}
                className="w-full mt-6 py-3 bg-white/10 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all duration-500"
              >
                View Full Ranking
              </button>
           </div>
        </div>
      </div>

      {/* 2. Premium Upgrade Banner (Visible for Free Users) */}
      {!user.is_premium && (
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-amber-400 to-orange-500 p-1 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="bg-white/95 backdrop-blur-3xl rounded-[2.8rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                 <div className="h-24 w-24 rounded-[2rem] bg-amber-100 flex items-center justify-center text-5xl shadow-inner rotate-3">👑</div>
                 <div className="space-y-2">
                    <h3 className="text-3xl font-black text-slate-800 italic leading-none">Upgrade ke Premium</h3>
                    <p className="text-slate-500 font-medium max-w-md">Buka semua level, akses bank soal terlengkap, dan raih sertifikasi impianmu lebih cepat!</p>
                 </div>
              </div>
              <button 
                onClick={() => onUpgrade?.(`Halo Admin, saya ${user.full_name} ingin upgrade ke Premium di ${theme?.app_name || 'Sagara'}`)}
                className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest shadow-[0_20px_50px_rgba(15,23,42,0.3)] hover:shadow-none hover:translate-y-1 transition-all duration-500 block text-center min-w-[200px]"
              >
                HUBUNGI ADMIN
              </button>
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="lg:col-span-2 space-y-6">
           <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-wider flex items-center gap-3 px-2">
             <span className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">📊</span>
             Aktivitas Belajar
           </h3>
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex items-end justify-between h-48 gap-4 px-4">
                 {weeklyActivity.map((item, idx) => (
                   <div key={idx} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full max-w-[40px] bg-slate-50 rounded-t-2xl relative transition-all duration-1000 ease-out group-hover:bg-teal-50"
                        style={{ height: `${item.value}%` }}
                      >
                         <div 
                           className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-2xl shadow-[0_0_20px_rgba(20,184,166,0.2)] transition-all duration-1000 group-hover:from-indigo-500 group-hover:to-indigo-300" 
                           style={{ height: '0%' }}
                           ref={(el) => {
                             if (el) setTimeout(() => (el.style.height = "100%"), 100 * idx);
                           }}
                         />
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {Math.round(item.value * 1.5)} XP
                         </div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-tighter">{item.day}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Weekly Mission Section - Always visible */}
        <div className="space-y-6">
           <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-wider flex items-center gap-3 px-2">
             <span className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">📅</span>
             Misi Mingguan
           </h3>

           {weeklyTargets.length === 0 ? (
             <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center gap-4">
               <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                 <span className="text-2xl">📭</span>
               </div>
               <div>
                 <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Belum Ada Misi Mingguan</p>
                 <p className="text-xs text-slate-400 font-medium mt-1">Guru kamu belum memberikan tugas untuk minggu ini. Pantau terus!</p>
               </div>
             </div>
           ) : (
             <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[3rem] p-8 space-y-5">
                {weeklyTargets.map((target) => {
                  const matIds = target.material_ids || [];
                  const totalMaterials = matIds.length;
                  const doneCount = matIds.filter(id => completedMaterials.includes(id)).length;
                  const isDone = totalMaterials > 0 && doneCount === totalMaterials;
                  const pct = totalMaterials > 0 ? Math.round((doneCount / totalMaterials) * 100) : 0;

                  return (
                    <div key={target.id} className={`rounded-[2rem] border flex flex-col transition-all duration-500 overflow-hidden ${isDone ? 'bg-white/20 border-teal-100 opacity-70' : 'bg-white border-white/80 shadow-sm hover:shadow-xl'}`}>
                       {/* Header misi */}
                       <div className="p-5 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2.5">
                                {isDone ? <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
                                <span className={`text-xs font-black uppercase tracking-tight leading-snug ${isDone ? 'text-slate-400 line-through italic' : 'text-slate-800'}`}>{target.title}</span>
                             </div>
                             <span className={`text-[9px] font-black px-2 py-1 rounded-md shrink-0 ${isDone ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {pct}% ({doneCount}/{totalMaterials})
                             </span>
                          </div>

                          {/* Progress bar */}
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div
                               className={`h-full rounded-full transition-all duration-1000 ${isDone ? 'bg-teal-500' : 'bg-gradient-to-r from-indigo-500 to-teal-400'}`}
                               style={{ width: `${pct}%` }}
                             />
                          </div>

                          {/* Catatan guru */}
                          {target.description && (
                            <p className="text-[9px] text-slate-400 font-medium italic leading-relaxed border-t border-slate-100 pt-2">
                               📝 {target.description}
                            </p>
                          )}
                       </div>

                       {/* Daftar materi */}
                       {matIds.length > 0 && (
                         <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 flex flex-col gap-2">
                           <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                             <BookOpen className="w-3 h-3" /> Materi yang harus diselesaikan
                           </p>
                           {matIds.map((mid) => {
                             const mat = allMaterials.find(m => m.id === mid);
                             const done = completedMaterials.includes(mid);
                             return (
                               <div key={mid} className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${done ? 'opacity-50' : ''}`}>
                                 {done
                                   ? <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                                   : <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                                 }
                                 <span className={`text-[10px] font-bold flex-1 ${done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                   {mat?.title || 'Materi'}
                                 </span>
                                 {mat && (
                                   <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                     mat.material_type === 'moji_goi' ? 'bg-purple-50 text-purple-500' :
                                     mat.material_type === 'bunpou' ? 'bg-blue-50 text-blue-500' :
                                     mat.material_type === 'dokkai' ? 'bg-amber-50 text-amber-500' :
                                     mat.material_type === 'choukai' ? 'bg-rose-50 text-rose-500' :
                                     'bg-slate-100 text-slate-400'
                                   }`}>
                                     {mat.material_type}
                                   </span>
                                 )}
                               </div>
                             );
                           })}
                         </div>
                       )}
                    </div>
                  );
                })}
             </div>
           )}
        </div>
      </div>

      {/* Lanjutkan Belajar Section */}
      <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-wider flex items-center gap-3 px-2">
            <span className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">📖</span>
            Lanjutkan Belajar
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-700 group cursor-pointer relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                 <span className="text-6xl">🎓</span>
               </div>
               <div className="relative z-10">
                  <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-teal-100 mb-4 inline-block">Materi Terakhir</span>
                  <h4 className="text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-teal-600 transition-colors">
                    {lastProgress[0]?.study_materials?.title || 'Mulailah Belajar!'}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">Klik untuk melanjutkan bagian yang tertinggal.</p>
               </div>
            </div>

            <div 
              onClick={() => onSwitchTab?.('flashcards')}
              className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:translate-y-[-8px] transition-all duration-700 group cursor-pointer relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                 <Zap className="w-16 h-16 text-amber-400" />
               </div>
               <div className="relative z-10">
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 mb-4 inline-block">Smart Review</span>
                  <h4 className="text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-amber-600 transition-colors">
                    SRS Flashcards
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">Uji daya ingat Anda dengan Flashcards.</p>
               </div>
            </div>
          </div>
      </div>

       {/* ANNOUNCEMENT MODAL */}
       {showAnnouncement && announcements.length > 0 && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAnnouncement(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 duration-500 border border-slate-100">
               <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-3xl mb-6 shadow-xl ${
                    announcements[0].type === 'success' ? 'bg-emerald-100 shadow-emerald-100' : 
                    announcements[0].type === 'warning' ? 'bg-amber-100 shadow-amber-100' : 'bg-indigo-100 shadow-indigo-100'
                  }`}>
                    {announcements[0].type === 'success' ? '🎉' : announcements[0].type === 'warning' ? '⚠️' : '📢'}
                  </div>
                  <h3 className="text-2xl font-black italic text-slate-800 leading-tight mb-4">{announcements[0].title}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{announcements[0].content}</p>
                  <button 
                    onClick={() => setShowAnnouncement(false)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl"
                  >
                    MENGERTI
                  </button>
               </div>
            </div>
         </div>
       )}

       {/* Floating AI Sensei */}
       {theme?.ai_sensei_active !== false && <AISenseiChat />}

       {/* FULL LEADERBOARD MODAL */}
       {isLeaderboardOpen && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
             onClick={() => setLeaderboardOpen(false)} 
           />
           
           {/* Modal Container */}
           <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-2xl font-black italic text-slate-800 tracking-tight flex items-center gap-2">
                       <span className="text-3xl">🏆</span> Full Ranking
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Cari dan lihat posisi seluruh siswa</p>
                 </div>
                 <button 
                   onClick={() => setLeaderboardOpen(false)}
                   className="h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 rounded-full transition-colors"
                 >
                   ✕
                 </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                 <input 
                   type="text" 
                   placeholder="Cari nama siswa..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full py-4 px-6 pl-12 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all shadow-inner"
                 />
                 <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              </div>

              {/* Leaderboard List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                 {leaderboard
                   .filter(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
                   .map((player, idx) => {
                     const originalIdx = leaderboard.findIndex(l => l.email === player.email);
                     const rank = originalIdx + 1;
                     const isMe = player.email === user.email;
                     
                     return (
                       <div 
                         key={player.email} 
                         className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                           isMe ? 'bg-teal-50 border-teal-200 shadow-md scale-[1.02]' : 'bg-white border-slate-100 hover:border-slate-300'
                         }`}
                       >
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center font-black text-sm shadow-sm ${
                                rank === 1 ? 'bg-amber-400 text-slate-900 ring-4 ring-amber-100' :
                                rank === 2 ? 'bg-slate-200 text-slate-700' :
                                rank === 3 ? 'bg-orange-200 text-orange-800' : 'bg-slate-50 text-slate-400 border border-slate-200'
                             }`}>
                               {rank}
                             </div>
                             
                             <div className="flex flex-col">
                               <span className={`text-sm font-black tracking-tight ${isMe ? 'text-teal-900' : 'text-slate-700'}`}>
                                 {player.full_name} {isMe && '(Anda)'}
                               </span>
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{player.target_level || 'Belum Set Target'}</span>
                             </div>
                          </div>
                          
                          <div className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider ${isMe ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                             {player.exp || 0} XP
                          </div>
                       </div>
                     );
                 })}
                 
                 {leaderboard.filter(p => p.full_name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                   <div className="py-20 text-center">
                      <span className="text-4xl opacity-50 mb-4 block">🏜️</span>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Siswa tidak ditemukan</p>
                   </div>
                 )}
              </div>
           </div>
         </div>
       )}
    </div>
  );
}
