"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    banners: 0,
    materials: 0,
    levels: 0,
    tests: 0,
    questions: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [{ count: banners }, { count: materials }, { count: levels }, { count: tests }, { count: questions }] = await Promise.all([
        supabase.from('banner_slides').select('*', { count: 'exact', head: true }),
        supabase.from('materials').select('*', { count: 'exact', head: true }),
        supabase.from('exam_levels').select('*', { count: 'exact', head: true }),
        supabase.from('exam_tests').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        banners: banners || 0,
        materials: materials || 0,
        levels: levels || 0,
        tests: tests || 0,
        questions: questions || 0,
      });
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Banners", value: stats.banners, id: "BNR-X1" },
    { label: "Materi Belajar", value: stats.materials, id: "MTR-C7" },
    { label: "Level JLPT", value: stats.levels, id: "LVL-Z9" },
    { label: "Total Tes", value: stats.tests, id: "TST-D4" },
    { label: "Total Soal", value: stats.questions, id: "QST-V2" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statCards.map((item) => (
        <div key={item.label} className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl transition-all hover:shadow-md hover:border-indigo-200">
          <div className="flex justify-between items-start mb-6">
             <p className="text-xs font-semibold text-slate-500">{item.label}</p>
             <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md">{item.id}</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{item.value}</p>
        </div>
      ))}
      <div className="col-span-full mt-4 p-8 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
           SYSTEM OVERVIEW
        </h3>
        <p className="text-sm opacity-80 font-medium">Primary Configuration & Metric Hub</p>
        
        <div className="mt-8 pt-6 border-t border-indigo-200 flex gap-4">
           <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm font-medium text-xs text-slate-600">
             <div className="h-2 w-2 rounded-full bg-emerald-500" />
             Core Database: Synced
           </div>
        </div>
      </div>
    </div>
  );
}
