"use client";

import { useEffect, useState } from "react";

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  image: string | null;
}

export default function JapanNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news");
        const data = await res.json();
        if (data.items) {
          setNews(data.items.slice(0, 10)); // Show top 10 as requested
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-40 bg-slate-100 rounded-[2rem] animate-pulse" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-xl font-black italic text-slate-800 leading-none">
            Yahoo! Japan
          </h3>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-teal-600/50 mt-1">Live News Feed</p>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full ring-1 ring-red-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Terbaru</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {news.map((item, idx) => {
          const dateObj = new Date(item.pubDate);
          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isFirst = idx === 0;

          if (isFirst) {
            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block relative bg-slate-900 rounded-[2.5rem] p-6 mb-2 shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              >
                {item.image && (
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                <div className="relative z-10 pt-24">
                  <span className="px-3 py-1 rounded-full bg-teal-500 text-white text-[8px] font-black tracking-widest uppercase mb-3 inline-block">UTAMA</span>
                  <h4 className="text-xl font-black text-white italic leading-tight group-hover:text-teal-400 transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </h4>
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{timeStr} • Yahoo Japan</p>
                </div>
              </a>
            );
          }

          return (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 items-center p-3 rounded-2xl hover:bg-white hover:shadow-xl hover:ring-1 hover:ring-slate-100 transition-all duration-300"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1 h-1 rounded-full bg-teal-500/40" />
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{timeStr}</p>
                </div>
                <h4 className="text-xs font-bold text-slate-700 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2 italic">
                  {item.title}
                </h4>
              </div>
              {item.image && (
                <div className="h-12 w-12 shrink-0 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 group-hover:scale-105 transition-transform duration-500">
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </a>
          );
        })}
      </div>

      <button 
        className="w-full py-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-teal-600 border border-slate-100 rounded-3xl transition-all bg-white/50 hover:bg-white hover:shadow-lg mt-2"
        onClick={() => window.open("https://news.yahoo.co.jp/", "_blank")}
      >
        Lihat Selengkapnya →
      </button>
    </div>
  );
}
