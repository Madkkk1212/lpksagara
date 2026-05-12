const fs = require('fs');
const path = 'src/app/teacher/components/QuizAccessManager.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the exact lines and replace them
// Line 746-749 pattern: <div> with h3 and p for chapter title and evaluation materials count
const searchPattern = /(\s+)<div>\s*\n(\s+)<h3 className="text-xl font-black text-slate-900 italic tracking-tight leading-none mb-2">\{chapter\.title\}<\/h3>\s*\n(\s+)<p className="text-\[10px\] font-black uppercase text-slate-400 tracking-\[0\.3em\]">\{chapterQuizzes\.length\} Evaluation Materials<\/p>\s*\n(\s+)<\/div>/;

const replacement = `$1<div>
$2<h3 className="text-xl font-black text-slate-900 italic tracking-tight leading-none mb-2">{chapter.title}</h3>
$3<div className="flex items-center gap-3">
$3  <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">{chapterQuizzes.length} Evaluation Materials</p>
$3  {(() => {
$3    const lvl = levels.find((l) => l.id === chapter.level_id);
$3    return lvl ? (
$3      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[9px] font-black uppercase tracking-wider text-indigo-500">
$3        {lvl.level_code || lvl.title || lvl.name}
$3      </span>
$3    ) : null;
$3  })()}
$3</div>
$4</div>`;

if (searchPattern.test(content)) {
  content = content.replace(searchPattern, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log('SUCCESS: Level badge added to chapter card');
} else {
  console.log('Pattern not found. Dumping lines 744-751:');
  const lines = content.split('\n');
  lines.slice(743, 752).forEach((l, i) => {
    console.log((744+i) + ': ' + JSON.stringify(l));
  });
}
