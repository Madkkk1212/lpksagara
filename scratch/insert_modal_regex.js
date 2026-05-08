const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'teacher', 'components', 'QuizAccessManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use a beautiful, highly precise regular expression to locate the duration modal end
const durationModalRegex = /(durationModalOpen\s+&&\s+\([\s\S]*?className="fixed[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*)\}\)/;

const modalContent = `       {/* Real-time progress monitoring modal */}
       {monitoringQuizId && (
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-6 border-b border-slate-100 shrink-0">
                 <div className="space-y-1">
                   <div className="flex items-center gap-3">
                     <span className="flex h-3.5 w-3.5 relative">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                     </span>
                     <h3 className="text-xl font-black uppercase tracking-tight italic">📡 Pemantauan Real-Time</h3>
                   </div>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mt-1">
                     {monitoringQuizTitle}
                   </p>
                 </div>
                 <button 
                   onClick={() => {
                     setMonitoringQuizId(null);
                     setMonitoringQuizTitle("");
                   }} 
                   className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 shadow-sm"
                 >
                   <X size={20} />
                 </button>
              </div>

              {/* Live Indicators / Quick Summary */}
              <div className="grid grid-cols-3 gap-4 py-6 shrink-0 border-b border-slate-50 bg-slate-50/50 -mx-10 px-10">
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                      {students.length}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total Siswa</p>
                      <p className="text-xs font-bold text-slate-800">Ditugaskan</p>
                    </div>
                 </div>
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-lg">
                      {students.filter(s => {
                        const ctrl = monitoringData.find(c => c.student_id === s.id);
                        if (!ctrl || !ctrl.batch || !ctrl.batch.startsWith("PROGRESS:")) return false;
                        return ctrl.batch !== "PROGRESS:SELESAI";
                      }).length}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Sedang Mengisi</p>
                      <p className="text-xs font-bold text-slate-800">Pengerjaan Aktif</p>
                    </div>
                 </div>
                 <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-lg">
                      {students.filter(s => {
                        const ctrl = monitoringData.find(c => c.student_id === s.id);
                        return ctrl && ctrl.batch === "PROGRESS:SELESAI";
                      }).length}
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Selesai</p>
                      <p className="text-xs font-bold text-slate-800">Jawaban Masuk</p>
                    </div>
                 </div>
              </div>

              {/* Table container */}
              <div className="flex-1 overflow-y-auto min-h-0 py-6 custom-scrollbar pr-2">
                 {students.length === 0 ? (
                   <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-wider">
                     Belum ada siswa yang ditugaskan ke kelas Anda.
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="border-b border-slate-100 pb-4">
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider w-16">No</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Siswa</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider w-56">Progress Soal</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-slate-400 tracking-wider w-44 text-right">Status Live</th>
                         </tr>
                       </thead>
                       <tbody>
                         {students.map((s, idx) => {
                           const ctrl = monitoringData.find(c => c.student_id === s.id);
                           let progress = { text: "-", percentage: 0, status: "tidak_ada_akses" };
                           
                           if (ctrl) {
                             if (!ctrl.is_active) {
                               progress = { text: "Akses Ditutup", percentage: 0, status: "ditutup" };
                             } else if (!ctrl.batch || !ctrl.batch.startsWith("PROGRESS:")) {
                               progress = { text: "Belum Mulai", percentage: 0, status: "belum_mulai" };
                             } else if (ctrl.batch === "PROGRESS:SELESAI") {
                               progress = { text: "Lengkap", percentage: 100, status: "selesai" };
                             } else {
                               const val = ctrl.batch.substring("PROGRESS:".length);
                               const parts = val.split("/");
                               const answered = parseInt(parts[0]) || 0;
                               const total = parseInt(parts[1]) || 1;
                               const percentage = Math.round((answered / total) * 100);
                               progress = { text: \`\${answered} / \${total} Soal\`, percentage, status: "mengerjakan" };
                             }
                           }

                           return (
                             <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors group">
                               <td className="py-5 text-xs font-black text-slate-400 italic">
                                 {idx + 1}
                               </td>
                               <td className="py-5">
                                 <div className="flex items-center gap-4">
                                   <div className={\`h-10 w-10 rounded-xl font-black text-xs flex items-center justify-center \${progress.status === 'selesai' ? 'bg-emerald-100 text-emerald-600' : progress.status === 'mengerjakan' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-400'}\`}>
                                     {s.full_name?.charAt(0)}
                                   </div>
                                   <div>
                                     <p className="font-black text-xs text-slate-800 group-hover:text-indigo-600 transition-colors">{s.full_name}</p>
                                     <div className="flex items-center gap-2 mt-1">
                                       <span className="text-[9px] text-slate-400 font-medium">{s.email}</span>
                                       {s.batch && (
                                         <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-wider">{s.batch}</span>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-5">
                                 <div className="space-y-2">
                                   <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                     <span>{progress.text}</span>
                                     {progress.status === 'mengerjakan' && <span>{progress.percentage}%</span>}
                                   </div>
                                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                     <div 
                                       className={\`h-full transition-all duration-500 \${progress.status === 'selesai' ? 'bg-emerald-500' : progress.status === 'mengerjakan' ? 'bg-indigo-500' : 'bg-slate-200'}\`}
                                       style={{ width: \`\${progress.percentage}%\` }}
                                     />
                                   </div>
                                 </div>
                               </td>
                               <td className="py-5 text-right">
                                 {progress.status === 'selesai' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600">
                                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                     Selesai 🏁
                                   </span>
                                 )}
                                 {progress.status === 'mengerjakan' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-600 animate-pulse">
                                     <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                                     Mengerjakan ⏳
                                   </span>
                                 )}
                                 {progress.status === 'belum_mulai' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-400">
                                     Belum Mulai 💤
                                   </span>
                                 )}
                                 {progress.status === 'ditutup' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-[9px] font-black uppercase tracking-widest text-rose-500">
                                     Akses Ditutup 🔒
                                   </span>
                                 )}
                                 {progress.status === 'tidak_ada_akses' && (
                                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-300">
                                     Belum Dibuka 💤
                                   </span>
                                 )}
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-slate-100 shrink-0 text-center flex justify-between items-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                   📡 Data diperbarui secara otomatis setiap 3 detik.
                 </p>
                 <button 
                   onClick={() => {
                     setMonitoringQuizId(null);
                     setMonitoringQuizTitle("");
                   }}
                   className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-md"
                 >
                   Tutup Pemantauan
                 </button>
              </div>
           </div>
         </div>
       )}`;

if (durationModalRegex.test(content)) {
  content = content.replace(durationModalRegex, `$1}\n\n${modalContent}`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('QuizAccessManager.tsx monitoring modal successfully inserted via Regex.');
} else {
  console.error('Error: durationModalOpen regex block not found!');
}
