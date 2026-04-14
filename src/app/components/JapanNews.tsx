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
          setNews(data.items.slice(0, 5)); // Show top 5
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
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-black italic text-slate-800 underline decoration-teal-500/20 underline-offset-8">
          Yahoo! Japan Live Feed
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Live</span>
        </div>
      </div>

      <div className="grid gap-4">
        {news.map((item, idx) => {
          const dateObj = new Date(item.pubDate);
          const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block relative bg-white/60 backdrop-blur-sm p-4 rounded-[2.5rem] ring-1 ring-black/[0.03] hover:ring-teal-500/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex gap-4 items-center">
                {item.image && (
                  <div className="h-20 w-20 shrink-0 rounded-[1.5rem] overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-700">
                    <img src={item.image} alt="" className="w-full h-full object-cover transition-all duration-700" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest mb-1 bg-teal-50 px-2 py-0.5 rounded-full inline-block">
                    {dateStr} • {timeStr}
                  </p>
                  <h4 className="text-sm font-black text-slate-800 leading-snug group-hover:text-teal-600 transition-colors line-clamp-3 italic mt-1">
                    {item.title}
                  </h4>
                </div>
                <div className="flex items-center text-teal-500 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all px-2">
                  <span className="font-black text-2xl">→</span>
                </div>
              </div>
              
              {/* Decorative Shine */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </a>
          );
        })}
      </div>

      <button 
        className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-teal-600 border border-slate-100 rounded-2xl transition-all"
        onClick={() => window.open("https://news.yahoo.co.jp/", "_blank")}
      >
        Lihat Semua di Yahoo! Japan
      </button>
    </div>
  );
}
