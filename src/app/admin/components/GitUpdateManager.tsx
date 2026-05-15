"use client";

import { useState } from "react";

export default function GitUpdateManager() {
  const [version] = useState("v2.0.1 - Paling Baru");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-8 gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">🚀</span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-black tracking-widest uppercase">System Update</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Git Update Log</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Pantau versi rilis terbaru dan catatan pembaruan sistem yang telah di-push.
          </p>
        </div>
        <div className="relative z-10 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Active Build</p>
          <p className="text-sm font-black tracking-wider text-white mt-0.5">{version}</p>
        </div>
      </div>

      {/* Main Release Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 text-2xl font-bold shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">Pak Ijal Makan Paku v2</h3>
              <p className="text-xs font-bold text-slate-400">Dipublikasikan pada: Mei 2026</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100">
            Stable Release
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
             <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider text-indigo-600">📌 Keterangan Rilis & Catatan Pembaruan:</h4>
             <p className="text-slate-700">
               Pembaruan arsitektur sistem penyimpanan media, stabilisasi pemutar audio CBT, serta penambahan pemindai rekursif (Deep Recursive Media Scanner). Seluruh berkas kuis, latihan mendengarkan (Choukai), dan kosakata (Moji-Goi) telah tersinkronisasi 100% dengan Cloudflare R2.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">CBT Audio & Video Resolved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">MIME type dan pemisahan file audio/video terlindungi ketat.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Super Admin Override</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Akses pengumuman dan catatan rilis selalu tersedia di sidebar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
