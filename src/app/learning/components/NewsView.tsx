"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  created_at: string;
  image_url?: string;
}

export default function NewsView() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/announcements');
        const json = await res.json();
        setNews(json.data || []);
      } catch (err) {
        console.error("NewsView: Failed to fetch via API", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const typeStyle = (type: string) => {
    switch (type) {
      case "success": return { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", emoji: "🎉", label: "Pengumuman" };
      case "warning": return { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", emoji: "⚠️", label: "Perhatian" };
      case "info":    return { bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-100",   emoji: "ℹ️", label: "Info" };
      default:        return { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", emoji: "📢", label: "Berita" };
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-lg shadow-indigo-200">
          📰
        </div>
        <div>
          <h2 className="text-2xl font-black italic uppercase text-slate-800 tracking-tight">Berita & Pengumuman</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Info terbaru dari admin dan pengajar</p>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">Memuat berita...</p>
        </div>
      )}

      {!loading && news.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <span className="text-5xl">📭</span>
          <p className="text-sm font-black uppercase tracking-widest text-slate-400">Belum Ada Berita</p>
          <p className="text-xs text-slate-300 font-medium">Pantau terus untuk info terbaru!</p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {news.map((item, idx) => {
          const style = typeStyle(item.type);
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              onClick={() => setSelected(item)}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity duration-700 text-[80px]">
                {style.emoji}
              </div>
              <div className="flex items-start gap-4 relative z-10">
                <div className={`h-12 w-12 rounded-[1.2rem] ${style.bg} flex items-center justify-center text-2xl shadow-inner shrink-0`}>
                  {style.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border} inline-block mb-2`}>
                    {style.label}
                  </span>
                  <h3 className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 font-medium leading-relaxed">
                    {item.content}
                  </p>
                  <p className="text-[9px] text-slate-300 font-bold uppercase mt-3 tracking-wider">
                    {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className={`p-8 ${typeStyle(selected.type).bg}`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{typeStyle(selected.type).emoji}</span>
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${typeStyle(selected.type).text}`}>
                      {typeStyle(selected.type).label}
                    </span>
                    <h3 className="text-xl font-black text-slate-800 leading-tight mt-0.5">{selected.title}</h3>
                  </div>
                </div>
              </div>
              <div className="p-8">
                <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{selected.content}</p>
                <p className="text-[10px] text-slate-300 font-bold uppercase mt-6 tracking-wider border-t border-slate-100 pt-4">
                  Diterbitkan: {new Date(selected.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="px-8 pb-8">
                <button
                  onClick={() => setSelected(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
