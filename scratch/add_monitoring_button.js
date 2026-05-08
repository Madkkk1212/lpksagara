const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'teacher', 'components', 'QuizAccessManager.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Use regex or exact split to find and replace the toggle button cleanly
const oldBtnRegex = /<button\s+onClick=\{\(\)\s+=>\s+toggleQuizAccess\(quiz\.id,\s+active\s+===\s+true\)\}[\s\S]*?className=\{`w-full[\s\S]*?<\/button>/;

const newBtnLayout = `<div className="space-y-3">
                              <button 
                                onClick={() => toggleQuizAccess(quiz.id, active === true)}
                                className={\`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 \${active === true ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600' : isPartial ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20 hover:bg-amber-700' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-emerald-600'}\`}
                              >
                                {active === true ? 'Tutup Akses' : isPartial ? 'Buka Untuk Semua' : 'Buka Akses'}
                              </button>

                              {(active === true || isPartial || isExpired) && (
                                <button
                                  onClick={() => {
                                    setMonitoringQuizId(quiz.id);
                                    setMonitoringQuizTitle(quiz.title);
                                  }}
                                  className="w-full py-4 bg-indigo-50 border-2 border-indigo-100 hover:bg-indigo-100/50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                  👁️ Pantau Live
                                </button>
                              )}
                            </div>`;

if (oldBtnRegex.test(content)) {
  content = content.replace(oldBtnRegex, newBtnLayout);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('QuizAccessManager.tsx buttons updated successfully.');
} else {
  console.error('Error: Toggle button pattern not found!');
}
