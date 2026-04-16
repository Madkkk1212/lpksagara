"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { Upload, FileDown, CheckCircle2, AlertCircle, FileSpreadsheet, Info } from "lucide-react";

export default function BulkImporter() {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // 1. Sheet untuk Ujian (exam_tests)
    const examData = Array.from({ length: 10 }).map((_, i) => ({
      title: `Contoh Ujian JLPT N5 Set ${String.fromCharCode(65 + i)}`,
      level_id: "ID_LEVEL_N5_DISINI",
      time_minutes: 60,
      passing_score: 80,
      description: `Simulasi Ujian N5 bagian ${i + 1}`
    }));
    const wsExam = XLSX.utils.json_to_sheet(examData);
    XLSX.utils.book_append_sheet(wb, wsExam, "Ujian_Exam");

    // 2. Sheet untuk Soal (questions)
    const questionData = Array.from({ length: 10 }).map((_, i) => ({
      test_id: "ID_TEST_DISINI",
      question_text: `Pertanyaan contoh nomor ${i + 1}?`,
      option_a: "Pilihan A",
      option_b: "Pilihan B",
      option_c: "Pilihan C",
      option_d: "Pilihan D",
      correct_option: 0,
      explanation: `Penjelasan untuk soal nomor ${i + 1}`
    }));
    const wsQuestion = XLSX.utils.json_to_sheet(questionData);
    XLSX.utils.book_append_sheet(wb, wsQuestion, "Soal_Questions");

    // 3. Sheet untuk Materi (study_materials)
    const materialData = Array.from({ length: 10 }).map((_, i) => ({
      title: `Materi Bab ${i + 1}`,
      material_type: "moji_goi",
      chapter_id: "ID_CHAPTER_DISINI",
      content: JSON.stringify({ items: [{ jp: "食べる", id: "Makan", example: "ご飯を食べる" }] })
    }));
    const wsMaterial = XLSX.utils.json_to_sheet(materialData);
    XLSX.utils.book_append_sheet(wb, wsMaterial, "Materi_Study");

    XLSX.writeFile(wb, "Sagara_Bulk_Template_Full.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setImportResult(null);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        
        // Loop through all sheets
        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);

          for (const row of data as any[]) {
            try {
              if (row.question_text) {
                // Questions Table
                const { error } = await supabase.from("questions").insert({
                  test_id: row.test_id,
                  question_text: row.question_text,
                  option_a: row.option_a,
                  option_b: row.option_b,
                  option_c: row.option_c,
                  option_d: row.option_d,
                  correct_option: parseInt(row.correct_option),
                  explanation: row.explanation
                });
                if (error) throw error;
              } else if (row.level_id && row.time_minutes) {
                // Exam Tests Table
                const { error } = await supabase.from("exam_tests").insert({
                  level_id: row.level_id,
                  title: row.title,
                  time_minutes: parseInt(row.time_minutes),
                  passing_score: parseInt(row.passing_score),
                  description: row.description
                });
                if (error) throw error;
              } else if (row.material_type) {
                // Study Materials Table
                const { error } = await supabase.from("study_materials").insert({
                  chapter_id: row.chapter_id,
                  material_type: row.material_type,
                  title: row.title,
                  content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
                });
                if (error) throw error;
              } else {
                throw new Error("Tipe data baris tidak dikenali.");
              }
              successCount++;
            } catch (err: any) {
              failedCount++;
              errors.push(`[Sheet: ${sheetName}] "${row.title || row.question_text}": ${err.message}`);
            }
          }
        }

        setImportResult({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) });
      } catch (err: any) {
        setImportResult({ success: 0, failed: 1, errors: [err.message] });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
         <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12">
            <FileSpreadsheet className="w-64 h-64" />
         </div>
         <div className="relative z-10">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 italic">
               <Upload className="w-6 h-6 text-indigo-600" />
               Advanced Bulk Importer
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">Kini mendukung impor **Ujian**, **Soal**, dan **Materi** sekaligus dalam satu file Excel (Multiple Sheets).</p>
         </div>
         <div className="flex flex-col items-end gap-1 relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Butuh Contoh Format?</p>
            <button 
              onClick={downloadTemplate}
              className="text-sm font-black text-indigo-600 hover:text-indigo-800 underline decoration-2 underline-offset-4 transition-all"
            >
              DOWNLOAD TEMPLATE EXCEL (.xlsx)
            </button>
         </div>
      </div>

      <div className="p-20 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center bg-slate-50/50 hover:bg-white hover:border-indigo-400 transition-all cursor-pointer relative group">
         <input 
           type="file" 
           accept=".xlsx, .xls, .csv" 
           onChange={handleFileUpload}
           className="absolute inset-0 opacity-0 cursor-pointer"
           disabled={isUploading}
         />
         <div className={`w-20 h-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all ${isUploading ? 'animate-spin' : ''}`}>
            <Upload className={`w-10 h-10 ${isUploading ? 'text-indigo-400' : 'text-indigo-600'}`} />
         </div>
         <p className="font-black text-slate-800 text-lg">{isUploading ? 'Sedang Menyalin Data...' : 'Klik atau seret file Excel ke sini'}</p>
         <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-[0.3em]">Multi-Sheet Support Enabled</p>
      </div>

      {importResult && (
        <div className={`p-8 rounded-[2.5rem] border transition-all animate-in zoom-in-95 duration-500 shadow-xl ${importResult.failed === 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex items-center gap-6 mb-6">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${importResult.failed === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
               {importResult.failed === 0 ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>
            <div>
               <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Status Impor Selesai</h4>
               <div className="flex gap-4 mt-1">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-lg">{importResult.success} Berhasil</span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-lg">{importResult.failed} Gagal</span>
               </div>
            </div>
          </div>
          
          {importResult.errors.length > 0 && (
            <div className="bg-white/80 rounded-2xl p-6 border border-rose-100">
               <p className="text-[10px] font-black text-rose-600 uppercase mb-4 flex items-center gap-2">
                 <Info className="w-3 h-3" />
                 Log Kegagalan (Maks 10 Baris):
               </p>
               <ul className="space-y-2">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-[11px] text-slate-600 font-bold border-l-2 border-rose-300 pl-3">Baris {i+1}: {err}</li>
                  ))}
               </ul>
            </div>
          )}
        </div>
      )}

      {/* Manual Table Structure Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
         <GuideBox 
           title="Ujian (Exam)" 
           items={[
             "title: Judul Ujian",
             "level_id: Valid UUID",
             "time_minutes: Angka",
             "passing_score: Angka"
           ]}
         />
         <GuideBox 
           title="Pertanyaan" 
           items={[
             "test_id: Valid UUID",
             "question_text: Teks soal",
             "correct_option: 0-3",
             "explanation: Opsional"
           ]}
         />
         <GuideBox 
           title="Materi Belajar" 
           items={[
             "material_type: bunpou/goi",
             "chapter_id: Valid UUID",
             "content: JSON String",
             "title: Nama Materi"
           ]}
         />
      </div>
    </div>
  );
}

function GuideBox({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
       <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-4 tracking-widest">{title}</h4>
       <ul className="space-y-2 text-[10px] text-slate-500 font-bold">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               {item}
            </li>
          ))}
       </ul>
    </div>
  );
}
