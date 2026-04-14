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
    { label: "Total Banners", value: stats.banners, icon: "🖼️", bg: "bg-teal-50", text: "text-teal-600" },
    { label: "Materi Belajar", value: stats.materials, icon: "📚", bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Level JLPT", value: stats.levels, icon: "🏆", bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "Total Tes", value: stats.tests, icon: "🎯", bg: "bg-rose-50", text: "text-rose-600" },
    { label: "Total Soal", value: stats.questions, icon: "❓", bg: "bg-slate-50", text: "text-slate-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {statCards.map((item) => (
        <div key={item.label} className={`p-8 rounded-[2rem] ${item.bg} ring-1 ring-inset ring-black/[0.03] transition-transform hover:-translate-y-1`}>
          <div className="text-4xl mb-4">{item.icon}</div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">{item.label}</p>
          <p className={`text-4xl font-black ${item.text}`}>{item.value}</p>
        </div>
      ))}
      <div className="col-span-full md:col-span-2 mt-8 p-10 bg-slate-900 rounded-[2.5rem] text-white shadow-xl">
        <h3 className="text-2xl font-black mb-4">Selamat Datang, Admin!</h3>
        <p className="opacity-70 leading-relaxed font-medium">Ini adalah panel manajemen konten Reiwa LMS. Anda bisa mengubah banner, materi, level, hingga soal ujian secara real-time yang akan langsung terupdate di sisi pengguna.</p>
        <div className="mt-8 flex gap-4">
           <div className="flex h-12 items-center gap-3 bg-white/10 px-6 rounded-full font-bold text-sm">
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
             Supabase Connected
           </div>
        </div>
      </div>
    </div>
  );
}
