"use client";

import { useState, useEffect } from "react";

interface CommitData {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export default function GitUpdateManager() {
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memanggil API GitHub secara langsung untuk repo publik Madkkk1212/lpksagara
    fetch("https://api.github.com/repos/Madkkk1212/lpksagara/commits?per_page=5")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommits(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching commits:", err);
        setLoading(false);
      });
  }, []);

  // Ambil 7 karakter pertama dari SHA commit terbaru sebagai "Active Build" version
  const activeVersion = commits.length > 0 ? commits[0].sha.substring(0, 7) : "Memuat...";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-8 gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">🚀</span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-black tracking-widest uppercase">System Update</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Git Update Log new</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Pantau versi rilis terbaru dan catatan pembaruan sistem yang telah di-push secara real-time dari GitHub.
          </p>
        </div>
        <div className="relative z-10 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Active Build</p>
          <p className="text-sm font-mono font-black tracking-wider text-white mt-0.5">
            {loading ? "..." : activeVersion}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : commits.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-500 font-medium">
          Gagal memuat data update dari GitHub. Pastikan ada koneksi internet.
        </div>
      ) : (
        commits.map((item, index) => {
          const isLatest = index === 0;
          const date = new Date(item.commit.author.date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          // Memisahkan pesan commit: baris pertama jadi judul, sisanya jadi deskripsi
          const messageParts = item.commit.message.split('\n');
          const title = messageParts[0];
          const description = messageParts.slice(1).join('\n').trim() || "Pembaruan minor kode sumber dan optimasi sistem.";

          return (
            <div key={item.sha} className={`bg-white rounded-3xl p-8 border-2 ${isLatest ? 'border-teal-100 shadow-xl shadow-teal-50/50' : 'border-slate-100 shadow-sm opacity-80 hover:opacity-100'} space-y-6 relative overflow-hidden transition-all duration-300`}>
              {isLatest && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-emerald-500" />}
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 relative z-10 flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${isLatest ? 'bg-teal-50 border border-teal-100 text-teal-600' : 'bg-slate-50 text-slate-500'} rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0`}>
                    {isLatest ? '🛡️' : '⚡'}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1">{title}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Oleh {item.commit.author.name} • {date}</p>
                  </div>
                </div>
                {isLatest && (
                  <span className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-xs font-black border border-teal-200 animate-pulse whitespace-nowrap">
                    Latest 🔥
                  </span>
                )}
              </div>

              <div className="space-y-4 text-sm text-slate-600 leading-relaxed relative z-10">
                <div className={`p-5 ${isLatest ? 'bg-teal-50/50 border-teal-100' : 'bg-indigo-50 border-indigo-100'} rounded-2xl border space-y-2`}>
                  <h4 className={`font-black text-xs uppercase tracking-wider ${isLatest ? 'text-teal-700' : 'text-indigo-600'}`}>📌 Catatan Commit:</h4>
                  <p className="text-slate-700 whitespace-pre-wrap font-medium">{description}</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a 
                    href={item.html_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    Lihat Kode ↗
                  </a>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    SHA: {item.sha.substring(0, 7)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
